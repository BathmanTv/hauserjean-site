// Renders index.html frame-by-frame in headless Chromium and encodes it with ffmpeg.
//
//   node render.mjs                       # full 1080p60 render with 4× motion blur → out/showreel.mp4
//   node render.mjs --mb 1 --fps 30       # fast draft
//   node render.mjs --stills 0.5,4.6,9    # single frames → out/stills/*.png
//
// Needs: playwright (global or local), ffmpeg (FFMPEG env var, PATH, or imageio-ffmpeg).
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawn, execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(ROOT, 'out')
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d }
const FPS = +arg('fps', 60)
const MB = +arg('mb', 4)              // sub-frames averaged per frame (motion blur)
const SHUTTER = +arg('shutter', 0.5)  // fraction of the frame interval the shutter is open (180°)
const WORKERS = +arg('workers', Math.max(1, Math.min(4, os.cpus().length)))
const FROM = +arg('from', 0)
const STILLS = arg('stills')

function loadPlaywright() {
  const req = createRequire(import.meta.url)
  for (const p of ['playwright', '/opt/node22/lib/node_modules/playwright', execFileSync('npm', ['root', '-g']).toString().trim() + '/playwright']) {
    try { return req(p) } catch { /* try next */ }
  }
  throw new Error('playwright not found — npm i -g playwright')
}
function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return 'ffmpeg' } catch { /* fall through */ }
  return execFileSync('python3', ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim()
}

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.wav': 'audio/wav' }
const server = http.createServer((req, res) => {
  const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() }
  res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
}).listen(0)
const PORT = await new Promise(r => server.on('listening', () => r(server.address().port)))

const { chromium } = loadPlaywright()
const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'] })
async function openPage() {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  page.on('pageerror', e => console.error('page error:', e.message))
  await page.goto(`http://localhost:${PORT}/index.html?render`)
  await page.evaluate(() => window.__ready)
  const cdp = await page.context().newCDPSession(page)
  const shot = async (t, format = 'jpeg') => {
    await page.evaluate(tt => window.renderFrame(tt), t)
    const { data } = await cdp.send('Page.captureScreenshot', { format, quality: format === 'jpeg' ? 94 : undefined, optimizeForSpeed: true })
    return Buffer.from(data, 'base64')
  }
  return { page, shot }
}

fs.mkdirSync(OUT, { recursive: true })

if (STILLS) {
  const dir = path.join(OUT, 'stills'); fs.mkdirSync(dir, { recursive: true })
  const { shot } = await openPage()
  for (const s of STILLS.split(',')) {
    fs.writeFileSync(path.join(dir, `t${(+s).toFixed(3)}.png`), await shot(+s, 'png'))
    console.log('still', s)
  }
  await browser.close(); server.close(); process.exit(0)
}

const FF = findFfmpeg()
const probe = await openPage()
const DUR = +arg('dur', await probe.page.evaluate(() => window.DURATION))
await probe.page.close()
const TO = +arg('to', DUR)
const f0 = Math.round(FROM * FPS), f1 = Math.round(TO * FPS)
const per = Math.ceil((f1 - f0) / WORKERS)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-'))
console.log(`rendering frames ${f0}–${f1 - 1} @${FPS}fps, ${MB} sub-frames, ${WORKERS} workers → ${tmp}`)

const started = Date.now()
let done = 0
async function worker(w) {
  const a = f0 + w * per, b = Math.min(f1, a + per)
  if (a >= b) return null
  const seg = path.join(tmp, `seg${w}.mkv`)
  const vf = MB > 1
    ? `tmix=frames=${MB},select='eq(mod(n\\,${MB})\\,${MB - 1})',setpts=N/${FPS}/TB`
    : `setpts=N/${FPS}/TB`
  const ff = spawn(FF, ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS * MB), '-c:v', 'mjpeg', '-i', '-',
    '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', '12', '-pix_fmt', 'yuv444p', seg], { stdio: ['pipe', 'inherit', 'inherit'] })
  const closed = new Promise((res, rej) => ff.on('close', c => (c ? rej(new Error('ffmpeg ' + c)) : res())))
  const { shot } = await openPage()
  for (let f = a; f < b; f++) {
    for (let k = 0; k < MB; k++) {
      const t = (f + (MB > 1 ? (k / MB) * SHUTTER : 0)) / FPS
      const buf = await shot(t)
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r))
    }
    if (++done % 30 === 0) {
      const el = (Date.now() - started) / 1000
      console.log(`${done}/${f1 - f0} frames · ${el.toFixed(0)}s · eta ${((el / done) * (f1 - f0 - done)).toFixed(0)}s`)
    }
  }
  ff.stdin.end()
  await closed
  return seg
}
const segs = (await Promise.all(Array.from({ length: WORKERS }, (_, w) => worker(w)))).filter(Boolean)
await browser.close(); server.close()

const list = path.join(tmp, 'list.txt')
fs.writeFileSync(list, segs.map(s => `file '${s}'`).join('\n'))
const audio = path.join(OUT, 'soundtrack.wav')
const name = arg('out', 'showreel.mp4')
const outFile = path.join(OUT, name)
const args = ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list]
if (fs.existsSync(audio) && FROM === 0) args.push('-ss', '0', '-i', audio)
args.push('-map', '0:v')
if (fs.existsSync(audio) && FROM === 0) args.push('-map', '1:a', '-c:a', 'aac', '-b:a', '320k', '-shortest')
args.push('-c:v', 'libx264', '-preset', 'slow', '-crf', arg('crf', '17'), '-pix_fmt', 'yuv420p', '-profile:v', 'high',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart', outFile)
execFileSync(FF, args, { stdio: 'inherit' })
fs.rmSync(tmp, { recursive: true, force: true })
console.log(`done in ${((Date.now() - started) / 1000).toFixed(0)}s → ${outFile}`)
