/* Jean Hauser — Showreel 2026.
   Every visual property is a pure function of time t (seconds), so any frame can be
   rendered in isolation with window.renderFrame(t). render.mjs drives this headlessly;
   opening index.html in a browser plays a live preview (space = pause, ←/→ = seek). */
(() => {
'use strict'

const W = 1920, H = 1080, DUR = 20
const C = {
  ink: '#0B0C0E', paper: '#F4F3EF', blue: '#1D4ED8', blueHi: '#3D6BFF', ox: '#7A2E2E',
  red: '#E5484D', amber: '#F5A524', green: '#3DD68C', muted: '#8B90A0',
}
const stage = document.getElementById('stage')
const q = new URLSearchParams(location.search)

// ───────────────────────── math ─────────────────────────
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v)
const lerp = (a, b, t) => a + (b - a) * t
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  const sx = u => ((ax * u + bx) * u + cx) * u
  const sy = u => ((ay * u + by) * u + cy) * u
  return x => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let lo = 0, hi = 1, u = x
    for (let i = 0; i < 28; i++) { if (sx(u) < x) lo = u; else hi = u; u = (lo + hi) / 2 }
    return sy(u)
  }
}
const E = {
  lin: x => x,
  out: bezier(0.16, 1, 0.3, 1),      // expo-style ease-out — the house curve
  in: bezier(0.7, 0, 0.84, 0),
  inOut: bezier(0.83, 0, 0.17, 1),   // snappy
  io: bezier(0.65, 0, 0.35, 1),      // softer in-out
}
const tw = (t, t0, d, e = E.out) => e(clamp((t - t0) / d))
// underdamped spring step response (0 → 1 with overshoot)
function spring(dt, f = 2.4, z = 0.45) {
  if (dt <= 0) return 0
  const w = 2 * Math.PI * f, wd = w * Math.sqrt(1 - z * z)
  return 1 - Math.exp(-z * w * dt) * (Math.cos(wd * dt) + (z * w / wd) * Math.sin(wd * dt))
}
const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x) }
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16))
const mix = (a, b, p) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], p))).join(',')})` }
const GLY = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+/<>=?'
const glyph = (i, t, rate = 40) => GLY[Math.floor(rnd(i * 31.7 + Math.floor(t * rate) * 7.3) * GLY.length)]
const scramble = (text, p, t, seed = 0) =>
  [...text].map((ch, j) => (ch === ' ' || j / text.length < p) ? ch : glyph(j + seed, t, 50)).join('')

// ───────────────────────── DOM helpers ─────────────────────────
function h(tag, o = {}, parent) {
  const el = document.createElement(tag)
  if (o.cls) el.className = o.cls
  if (o.css) el.style.cssText = o.css
  if (o.text != null) el.textContent = o.text
  if (o.html != null) el.innerHTML = o.html
  if (parent) parent.appendChild(el)
  return el
}
const NS = 'http://www.w3.org/2000/svg'
function sv(tag, attrs = {}, parent) {
  const el = document.createElementNS(NS, tag)
  for (const k in attrs) el.setAttribute(k, attrs[k])
  if (parent) parent.appendChild(el)
  return el
}
const T = (el, v) => { el.style.transform = v }
const O = (el, v) => { el.style.opacity = v }
const V = (el, on) => { el.style.visibility = on ? 'visible' : 'hidden' }
function chars(parent, text, mask = false) {
  return [...text].map(ch => {
    const wrap = h('span', { cls: 'ch' + (mask ? ' mask' : '') }, parent)
    const inner = h('span', { cls: 'chi', text: ch }, wrap)
    return { wrap, inner, ch }
  })
}
const imgs = []
function I(src, parent, css = '') {
  const el = h('img', { css }, parent)
  el.src = 'assets/' + src
  imgs.push(el)
  return el
}
const draw = (path, p) => { path.style.strokeDashoffset = 1 - p }  // paths use pathLength="1"

// ───────────────────────── scenes ─────────────────────────
const scenes = []
function scene(name, t0, t1, z, build) {
  const root = h('div', { cls: 'scene', css: `z-index:${z}` }, stage)
  const sc = { name, t0, t1, root, on: false, layout() {}, render() {} }
  Object.assign(sc, build(root))
  scenes.push(sc)
}

// 00 ─ BOOT ───────────────────────────────────────────────── 0.0 → 2.0
scene('boot', 0, 2.0, 1, root => {
  root.style.background = C.ink
  const vl = [], hl = []
  for (let i = 0; i <= 12; i++) vl.push(h('div', { cls: 'gl v', css: `left:${96 + i * 144}px` }, root))
  for (let j = 0; j <= 6; j++) hl.push(h('div', { cls: 'gl h', css: `top:${96 + j * 148}px` }, root))
  const tag = h('div', { cls: 'abs mono', css: `left:0;right:0;top:318px;text-align:center;font-size:19px;letter-spacing:.34em;color:${C.blueHi}`, text: 'SHOWREEL — 2026' }, root)
  const name = h('div', { cls: 'abs disp', css: 'left:0;right:0;top:372px;text-align:center;font-size:212px;font-weight:700;line-height:1;letter-spacing:-.045em;white-space:nowrap' }, root)
  const L = chars(name, 'JEAN HAUSER', true)
  const caret = h('div', { cls: 'abs', css: `top:398px;width:22px;height:158px;background:${C.blueHi}` }, root)
  const role = h('div', { cls: 'abs mono', css: 'left:0;right:0;top:648px;text-align:center;font-size:22px;letter-spacing:.24em;color:rgba(244,243,239,.72);white-space:pre' }, root)
  const ROLE = 'SENIOR PRODUCT OWNER · CYBERSECURITY PM · BUILDER'
  const panel = h('div', { cls: 'fill', css: `background:${C.blue};transform-origin:50% 100%;transform:scaleY(0)` }, root)
  let xs = []
  return {
    layout() {
      // lock each letter to its final width so scrambled glyphs never shift the line
      L.forEach(l => { l.wrap.style.width = l.wrap.offsetWidth + 'px'; l.wrap.style.textAlign = 'center' })
      xs = L.map(l => [name.offsetLeft + l.wrap.offsetLeft, l.wrap.offsetWidth])
    },
    render(t) {
      vl.forEach((l, i) => {
        const p = tw(t, 0.04 + i * 0.022, 0.55) * (1 - tw(t, 1.5 + i * 0.01, 0.3, E.in))
        l.style.transformOrigin = i % 2 ? '50% 0' : '50% 100%'
        T(l, `scaleY(${p})`)
      })
      hl.forEach((l, j) => {
        const p = tw(t, 0.1 + j * 0.03, 0.6) * (1 - tw(t, 1.5 + j * 0.012, 0.3, E.in))
        l.style.transformOrigin = j % 2 ? '0 50%' : '100% 50%'
        T(l, `scaleX(${p})`)
      })
      let last = -1
      L.forEach((l, i) => {
        const t0 = 0.32 + i * 0.042, tr = t0 + 0.24
        V(l.inner, t >= t0)
        if (t >= t0) last = i
        if (l.ch !== ' ') {
          const res = t >= tr
          l.inner.textContent = res ? l.ch : glyph(i, t)
          l.inner.style.color = res ? C.paper : C.blueHi
        }
        const pin = tw(t, t0, 0.2), pout = tw(t, 1.44 + i * 0.022, 0.3, E.in)
        T(l.inner, `translateY(${(1 - pin) * 70 - pout * 120}%)`)
      })
      const cx = last < 0 ? xs[0][0] - 36 : xs[last][0] + xs[last][1] + 24
      const blink = t < 0.32 ? Math.floor(t / 0.1) % 2 === 0 : t > 0.86 ? Math.floor((t - 0.86) / 0.14) % 2 === 0 : true
      V(caret, blink && t < 1.44)
      caret.style.left = cx + 'px'
      const n = Math.round(ROLE.length * tw(t, 0.88, 0.5, E.lin))
      role.textContent = ROLE.slice(0, n) + (n > 0 && n < ROLE.length ? '_' : '')
      const out = tw(t, 1.46, 0.26, E.in)
      O(role, 1 - out); T(role, `translateY(${-out * 40}px)`)
      const tg = tw(t, 0.72, 0.45)
      tag.style.clipPath = `inset(0 ${50 - tg * 50}% 0 ${50 - tg * 50}%)`
      O(tag, 1 - out); T(tag, `translateY(${-out * 40}px)`)
      T(panel, `scaleY(${tw(t, 1.66, 0.34, E.inOut)})`)
    },
  }
})

// 01 ─ MANIFESTO ──────────────────────────────────────────── 2.0 → 4.0
scene('manifesto', 2.0, 4.0, 2, root => {
  const WORDS = [
    { t0: 2.0, text: 'DESIGN', bg: C.paper, fg: C.ink, dot: C.blue, n: '01', cap: 'type · motion · systems' },
    { t0: 2.5, text: 'BUILD', bg: C.blue, fg: C.paper, dot: C.ink, n: '02', cap: 'React · Vite · Python · Lua' },
    { t0: 3.0, text: 'SECURE', bg: C.ink, fg: C.paper, dot: C.blueHi, n: '03', cap: '277 detectors · 24 ecosystems' },
    { t0: 3.5, text: 'SHIP', bg: C.paper, fg: C.ink, dot: C.blue, n: '04', cap: '7+ yrs · Airbus ecosystem · EU · China · APAC' },
  ]
  const wordCss = fg => `left:0;right:0;top:318px;text-align:center;font-size:330px;font-weight:700;line-height:1;letter-spacing:-.055em;color:${fg};white-space:nowrap`
  for (const w of WORDS) {
    w.el = h('div', { cls: 'fill', css: `background:${w.bg}` }, root)
    w.rule = h('div', { cls: 'abs', css: `left:96px;right:96px;top:860px;height:2px;background:${w.fg};opacity:.9;transform-origin:0 50%` }, w.el)
    w.capBox = h('div', { cls: 'abs mono', css: `left:96px;top:884px;font-size:22px;letter-spacing:.12em;color:${w.fg};overflow:hidden;padding-bottom:4px;white-space:pre` }, w.el)
    w.capIn = h('div', { html: `<b style="color:${w.dot === C.ink ? C.paper : w.dot}">(${w.n})</b>  ${w.text} — ${w.cap}` }, w.capBox)
    w.idx = h('div', { cls: 'abs mono', css: `right:96px;top:884px;font-size:22px;letter-spacing:.12em;color:${w.fg};opacity:.6`, text: `${w.n} / 04` }, w.el)
    w.box = h('div', { cls: 'abs disp', css: wordCss(w.fg) }, w.el)
    if (w.text === 'SECURE') {
      w.layers = ['#FF2D55', '#00E5FF', w.fg].map((col, k) => {
        const lay = h('div', { cls: 'abs disp', css: wordCss(col) + (k < 2 ? ';mix-blend-mode:screen' : '') }, w.el)
        return { el: lay, L: chars(lay, w.text) }
      })
      w.box.remove()
      w.layers.forEach((lay, k) => { lay.dot = h('span', { css: `display:inline-block;width:.17em;height:.17em;border-radius:50%;background:${k === 2 ? w.dot : 'currentColor'};margin-left:.03em` }, lay.el) })
      w.scan = h('div', { cls: 'abs', css: `left:0;right:0;height:3px;background:${C.blueHi};box-shadow:0 0 30px 8px rgba(61,107,255,.55)` }, w.el)
      w.dotEl = w.layers[2].dot
    } else {
      w.L = chars(w.box, w.text, w.text === 'DESIGN')
      if (w.text === 'BUILD') w.L.forEach(l => { l.block = h('span', { cls: 'abs', css: `left:0;right:0;top:.06em;bottom:.08em;background:${C.paper}` }, l.wrap) })
      w.dotEl = h('span', { css: `display:inline-block;width:.17em;height:.17em;border-radius:50%;background:${w.dot};margin-left:.03em;${w.text === 'DESIGN' ? 'vertical-align:bottom;margin-bottom:.115em' : ''}` }, w.box)
    }
  }
  const zoom = h('div', { cls: 'abs', css: `border-radius:50%;background:${C.blue};visibility:hidden` }, WORDS[3].el)
  let dot = { x: 0, y: 0, r: 0 }
  return {
    layout() {
      const w = WORDS[3]
      dot = { x: w.box.offsetLeft + w.dotEl.offsetLeft + w.dotEl.offsetWidth / 2, y: w.box.offsetTop + w.dotEl.offsetTop + w.dotEl.offsetHeight / 2, r: w.dotEl.offsetWidth / 2 }
      w.box.style.transformOrigin = `${dot.x - w.box.offsetLeft}px ${dot.y - w.box.offsetTop}px`
    },
    render(t) {
      for (const w of WORDS) {
        const on = t >= w.t0 && t < w.t0 + 0.5
        w.el.style.display = on ? 'block' : 'none'
        if (!on) continue
        const lt = t - w.t0
        T(w.rule, `scaleX(${tw(lt, 0.02, 0.45)})`)
        T(w.capIn, `translateY(${(1 - tw(lt, 0.06, 0.3)) * 110}%)`)
        const pop = spring(lt - 0.16, 3.2, 0.4)
        if (w.text === 'DESIGN') {
          w.L.forEach((l, i) => {
            const p = tw(lt, 0.01 + i * 0.028, 0.34)
            T(l.inner, `translateY(${(1 - p) * 108}%)`)
            l.inner.style.fontWeight = Math.round(lerp(300, 700, tw(lt, i * 0.028, 0.42)))
          })
          T(w.dotEl, `scale(${pop})`)
        } else if (w.text === 'BUILD') {
          w.L.forEach((l, i) => {
            const s0 = 0.01 + i * 0.03
            const p1 = tw(lt, s0, 0.09, E.inOut), p2 = tw(lt, s0 + 0.09, 0.1, E.inOut)
            l.block.style.transformOrigin = p2 > 0 ? '100% 50%' : '0 50%'
            T(l.block, `scaleX(${p2 > 0 ? 1 - p2 : p1})`)
            V(l.inner, p1 >= 1)
          })
          T(w.dotEl, `scale(${spring(lt - 0.2, 3.2, 0.4)})`)
        } else if (w.text === 'SECURE') {
          const f = Math.floor(t * 60)
          const amp = 30 * (1 - tw(lt, 0, 0.34))
          w.layers.forEach((lay, k) => {
            lay.L.forEach((l, i) => {
              const res = lt >= 0.03 + i * 0.034
              l.inner.textContent = res ? l.ch : glyph(i, t, 30)
              if (k === 2) l.inner.style.color = res ? C.paper : C.blueHi
            })
            const dx = k === 2 ? 0 : (k ? -1 : 1) * amp * (0.5 + rnd(f * 3.1 + k))
            const dy = k === 2 ? 0 : (rnd(f * 1.7 + k) - 0.5) * amp * 0.3
            T(lay.el, `translate(${dx}px,${dy}px)`)
            // one horizontal slice tears for the first frames
            lay.el.style.clipPath = 'none'
          })
          const tear = lt < 0.2 ? rnd(f * 5.3) : 0
          if (tear > 0.35) {
            const y0 = 320 + rnd(f * 2.2) * 260
            w.layers[2].el.style.clipPath = `polygon(0 0,100% 0,100% ${y0 - 318}px,0 ${y0 - 318}px)`
          }
          T(w.scan, `translateY(${lerp(250, 760, tw(lt, 0.02, 0.36, E.io))}px)`)
          O(w.scan, 1 - tw(lt, 0.3, 0.1, E.lin))
          w.layers.forEach(lay => T(lay.dot, `scale(${spring(lt - 0.24, 3.2, 0.4)})`))
        } else { // SHIP
          const e = tw(lt, 0, 0.22)
          const z = tw(lt, 0.22, 0.25, E.in)
          T(w.box, `scale(${lerp(2.3, 1, e) * (1 + z * 3.2)})`)
          w.box.style.filter = e < 1 ? `blur(${(1 - e) * 16}px)` : 'none'
          O(w.box, clamp(e * 3))
          T(w.dotEl, `scale(${spring(lt - 0.1, 3.4, 0.4)})`)
          V(zoom, z > 0)
          if (z > 0) {
            const r = dot.r * (1 + z * 3.2) * Math.pow(1200 / (dot.r * 4.2), z)
            zoom.style.cssText += `;left:${dot.x - r}px;top:${dot.y - r}px;width:${2 * r}px;height:${2 * r}px`
          }
        }
      }
    },
  }
})

// 02 ─ DONATELLO ──────────────────────────────────────────── 4.0 → 8.0
const ECOSYSTEMS = [
  ['EVM', 48], ['Solana', 42], ['Vyper', 22], ['Move', 22], ['Cairo', 20], ['Cosmos/Go', 18],
  ['Stellar/Soroban', 16], ['Clarity', 15], ['AA/4337', 12], ['Sui', 12], ['Cadence', 12], ['Aptos', 12],
  ['Sway', 11], ['CosmWasm', 10], ['Polkadot', 10], ['Tact', 10], ['TON', 4], ['Bitcoin', 10],
  ['NEAR', 9], ['ink!', 7], ['Cardano', 6], ['Aleo', 5], ['Algorand', 4], ['Mina', 3],
]
const CODE = [
  'function withdraw(uint amount) external {',
  '  require(balances[msg.sender] >= amount);',
  '  (bool ok,) = msg.sender.call{value: amount}("");',
  '  balances[msg.sender] -= amount;',
  '}',
]
function tokens(line) {
  const out = [], re = /(\s+|[A-Za-z_]\w*|"[^"]*"|.)/g
  let m
  while ((m = re.exec(line))) {
    const s = m[0]
    let c = 'p'
    if (/^(function|external|public|returns)$/.test(s)) c = 'kw'
    else if (/^(uint|bool|address)$/.test(s)) c = 'ty'
    else if (s[0] === '"') c = 'str'
    else if (/^[A-Za-z_]/.test(s)) { const nx = line.slice(re.lastIndex).trimStart()[0]; c = nx === '(' || nx === '{' ? 'fn' : 'id' }
    out.push([s, c])
  }
  return out
}
scene('donatello', 4.0, 8.0, 3, root => {
  root.style.background = C.blue
  const ink = h('div', { cls: 'fill dotgrid', css: `background-color:${C.ink}` }, root)
  const rings = [0, 1, 2].map(() => h('div', { cls: 'abs', css: `left:960px;top:540px;width:0;height:0;border-radius:50%;border:2px solid ${C.blueHi}` }, root))
  const head = h('div', { cls: 'abs', css: 'left:150px;top:112px' }, ink)
  const title = h('div', { cls: 'disp', css: 'font-size:50px;font-weight:700;letter-spacing:-.02em;overflow:hidden', html: `<span style="display:inline-block"><span style="color:${C.blueHi}">◆</span> DONATELLO</span>` }, head)
  const sub = h('div', { cls: 'mono', css: `font-size:18px;letter-spacing:.2em;color:${C.muted};margin-top:10px;white-space:pre`, text: 'MULTI-CHAIN SMART-CONTRACT SECURITY SCANNER' }, head)
  const stack = h('div', { cls: 'abs mono', css: `right:150px;top:128px;font-size:16px;letter-spacing:.16em;color:${C.muted};border:1px solid #2a2d36;border-radius:999px;padding:10px 18px`, text: 'PYTHON · SLITHER · Z3 · CTF HARNESS' }, ink)

  // code panel
  const group = h('div', { cls: 'fill' }, ink)
  const panel = h('div', { cls: 'code', css: 'left:150px;top:300px;width:930px;height:392px' }, group)
  const bar = h('div', { cls: 'bar' }, panel)
  ;[0, 1, 2].forEach(() => h('span', { cls: 'dot' }, bar))
  h('span', { text: 'Vault.sol', css: 'margin-left:12px;color:#C9CDD8' }, bar)
  const status = h('span', { css: 'margin-left:auto;font-size:16px;letter-spacing:.08em' }, bar)
  const body = h('div', { cls: 'abs', css: 'left:0;right:0;top:90px;height:270px' }, panel)
  const lines = [], codeChars = []
  CODE.forEach((src, li) => {
    const ln = h('div', { cls: 'ln', css: `top:${li * 52}px;padding-left:92px;z-index:0` }, body)
    const hl = h('div', { cls: 'hl', css: 'z-index:-1;transform:scaleX(0)' }, ln)
    for (const [s, c] of tokens(src)) for (const ch of s) codeChars.push({ el: h('span', { cls: 'tok-' + c, text: ch }, ln), li })
    lines.push({ ln, hl })
  })
  CODE.forEach((_, li) => h('div', { cls: 'abs mono', css: `left:0;width:56px;top:${li * 52}px;text-align:right;font-size:22px;line-height:52px;color:#4A4E5A`, text: li + 1 }, body))
  const tcaret = h('div', { cls: 'abs', css: `width:14px;height:30px;background:${C.blueHi}` }, body)
  const beam = h('div', { cls: 'abs', css: 'left:0;right:0;height:140px;background:linear-gradient(180deg,transparent,rgba(61,107,255,.22) 46%,rgba(120,150,255,.95) 50%,rgba(61,107,255,.22) 54%,transparent)' }, panel)

  // finding card (flips to PASS once the fix lands)
  const card = h('div', { cls: 'card3d', css: 'left:1170px;top:300px;width:600px;height:392px' }, group)
  const face = (bg, border) => h('div', { cls: 'face', css: `background:${bg};border:1px solid ${border}` }, card)
  const front = face('#15161B', 'rgba(229,72,77,.5)'), back = face('#0E1813', 'rgba(61,214,140,.5)')
  back.style.transform = 'rotateY(180deg)'
  const pill = (bg, txt) => `<span class="pill mono" style="background:${bg};color:${C.ink};font-weight:700;font-size:16px;letter-spacing:.12em;padding:7px 14px">${txt}</span>`
  front.innerHTML = `<div style="display:flex;align-items:center;gap:16px">${pill(C.red, 'HIGH')}<span class="mono" style="font-size:17px;letter-spacing:.14em;color:${C.muted}">E1 · REENTRANCY</span></div>
    <div class="disp" style="font-size:42px;font-weight:600;line-height:1.08;margin-top:26px;letter-spacing:-.015em">State mutated after an external call</div>
    <div style="font-size:21px;line-height:1.45;color:#A3A8B6;margin-top:16px">Checks-effects-interactions violated — withdraw() can be re-entered and drained.</div>
    <div class="mono abs" style="left:38px;bottom:28px;font-size:14px;letter-spacing:.16em;color:#5C6170">DONATELLO · DETECTOR E1 · EVM</div>`
  back.innerHTML = `<div style="display:flex;align-items:center;gap:16px">${pill(C.green, 'PASS')}<span class="mono" style="font-size:17px;letter-spacing:.14em;color:${C.muted}">E1 · RESOLVED</span></div>
    <div class="disp" style="font-size:42px;font-weight:600;line-height:1.08;margin-top:26px;letter-spacing:-.015em">Checks → Effects → Interactions</div>
    <div style="font-size:21px;line-height:1.45;color:#A3B6AC;margin-top:16px">State is written before the call. 0 findings, regression-locked.</div>
    <div class="mono abs" style="left:38px;bottom:28px;font-size:14px;letter-spacing:.16em;color:#5C6F66">CTF-VALIDATED · 0 FALSE POSITIVES</div>`
  const svg = sv('svg', { width: W, height: H, style: 'position:absolute;left:0;top:0;overflow:visible' }, group)
  const conn = sv('path', { fill: 'none', stroke: C.red, 'stroke-width': 2.5, pathLength: 1, 'stroke-dasharray': 1 }, svg)
  const connDot = sv('circle', { r: 6, fill: C.red }, svg)

  // counter 277 / 24
  const counter = h('div', { cls: 'fill' }, ink)
  const roll = (parent, digits, size, color, left, top) => h('div', { cls: 'abs disp', css: `left:${left}px;top:${top}px;font-size:${size}px;font-weight:700;line-height:1;color:${color};display:flex;letter-spacing:-.04em` }, parent)
  const mkCols = (box, digits) => [...digits].map(d => {
    const col = h('div', { css: 'height:1em;width:.6em;overflow:hidden;text-align:center' }, box)
    const strip = h('div', { html: Array.from({ length: 21 }, (_, k) => `<div style="height:1em">${k % 10}</div>`).join('') }, col)
    return { strip, d: +d }
  })
  const big = roll(counter, '277', 390, C.paper, 138, 300)
  const bigCols = mkCols(big, '277')
  const lab1 = h('div', { cls: 'abs disp', css: 'left:880px;top:318px;font-size:92px;font-weight:700;letter-spacing:-.03em;overflow:hidden;line-height:1.05', html: '<div>DETECTORS</div>' }, counter)
  const lab1s = h('div', { cls: 'abs mono', css: `left:884px;top:430px;font-size:19px;letter-spacing:.2em;color:${C.muted};white-space:pre`, text: 'CTF-VALIDATED · REGRESSION-LOCKED' }, counter)
  const small = roll(counter, '24', 170, C.blueHi, 870, 492)
  const smallCols = mkCols(small, '24')
  const lab2 = h('div', { cls: 'abs disp', css: 'left:1100px;top:548px;font-size:64px;font-weight:600;letter-spacing:-.02em;overflow:hidden;line-height:1.1', html: '<div>ECOSYSTEMS</div>' }, counter)
  const crule = h('div', { cls: 'abs', css: 'left:150px;top:730px;width:1620px;height:2px;background:rgba(255,255,255,.14);transform-origin:0 50%' }, counter)

  // ecosystem chips → bar chart
  const chartTitle = h('div', { cls: 'abs mono', css: `left:150px;top:300px;font-size:19px;letter-spacing:.2em;color:${C.muted};white-space:pre`, text: 'DETECTORS PER ECOSYSTEM — 24 KITS' }, ink)
  const base = h('div', { cls: 'abs', css: 'left:150px;top:900px;width:1620px;height:2px;background:rgba(255,255,255,.3);transform-origin:0 50%' }, ink)
  const sorted = ECOSYSTEMS.map((e, i) => ({ e, i })).sort((a, b) => b.e[1] - a.e[1])
  const chips = ECOSYSTEMS.map(([name, n], i) => {
    const col = i % 8, row = Math.floor(i / 8)
    const g = { x: 150 + col * (190 + 14.3), y: 360 + row * (118 + 18), w: 190, h: 118 }
    const el = h('div', { cls: 'abs', css: 'border-radius:12px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.14);transform-origin:50% 100%;overflow:visible' }, ink)
    const fill = h('div', { cls: 'fill', css: 'border-radius:inherit;background:linear-gradient(180deg,#5A82FF,#1D4ED8);opacity:0' }, el)
    const face = h('div', { cls: 'fill', css: 'padding:16px 18px;box-sizing:border-box' }, el)
    h('div', { cls: 'disp', css: 'font-size:25px;font-weight:600;letter-spacing:-.01em;white-space:nowrap', text: name }, face)
    h('div', { cls: 'mono', css: `font-size:17px;color:${C.blueHi};margin-top:6px`, text: `${String(n).padStart(2, '0')} det.` }, face)
    h('div', { cls: 'abs', css: `left:18px;bottom:16px;height:3px;width:${(n / 48) * 154}px;background:${C.blueHi};border-radius:2px` }, face)
    const vlab = h('div', { cls: 'abs mono', css: 'left:50%;bottom:14px;writing-mode:vertical-rl;transform:translateX(-50%) rotate(180deg);font-size:16px;letter-spacing:.06em;white-space:nowrap;color:#fff;opacity:0', text: name }, el)
    const cnt = h('div', { cls: 'abs mono', css: `left:0;right:0;top:calc(100% + 14px);text-align:center;font-size:17px;color:${C.blueHi};opacity:0`, text: n }, el)
    const cx = g.x + g.w / 2 - 960, cy = g.y + g.h / 2 - 525
    return { el, fill, face, vlab, cnt, g, n, dist: Math.hypot(cx, cy), rot: (rnd(i * 9.1) - 0.5) * 70 }
  })
  chips.slice().sort((a, b) => a.dist - b.dist).forEach((c, k) => { c.rank = k })
  sorted.forEach((s, r) => { chips[s.i].r = r })
  chips.forEach(c => { c.b = { x: 150 + c.r * (54 + 14.087), w: 54, h: 30 + (c.n / 48) * 430 }; c.b.y = 900 - c.b.h })

  // wipe to next scene
  const bands = [0, 1, 2, 3, 4].map(k => h('div', { cls: 'abs', css: `left:0;width:1920px;top:${k * 216}px;height:217px;background:#F3EDE4` }, root))
  let charW = 15.6
  return {
    layout() { charW = codeChars[0].el.offsetWidth || charW },
    render(t) {
      const r = 1150 * tw(t, 4.0, 0.45)
      ink.style.clipPath = `circle(${r}px at 960px 540px)`
      rings.forEach((ring, k) => {
        const p = tw(t, 4.02 + k * 0.08, 0.7), rr = p * (700 + k * 160)
        ring.style.cssText += `;left:${960 - rr}px;top:${540 - rr}px;width:${2 * rr}px;height:${2 * rr}px;opacity:${(1 - p) * 0.9}`
      })
      T(title.firstChild, `translateY(${(1 - tw(t, 4.14, 0.4)) * 110}%)`)
      O(sub, tw(t, 4.26, 0.3)); O(stack, tw(t, 4.3, 0.3))

      // code typing
      const pin = spring(t - 4.08, 1.8, 0.62)
      T(panel, `translateY(${(1 - pin) * 120}px)`); O(panel, clamp((t - 4.08) * 6))
      const n = Math.floor(codeChars.length * tw(t, 4.26, 0.62, E.lin))
      codeChars.forEach((c, k) => V(c.el, k < n))
      const lastC = codeChars[Math.max(0, n - 1)]
      const colOf = k => { let c = 0; for (let j = k; j >= 0 && codeChars[j].li === codeChars[k].li; j--) c++; return c }
      if (n > 0 && n < codeChars.length) {
        V(tcaret, true)
        tcaret.style.left = 92 + colOf(n - 1) * charW + 'px'
        tcaret.style.top = lastC.li * 52 + 11 + 'px'
      } else V(tcaret, n === 0 ? Math.floor(t / 0.12) % 2 === 0 && t > 4.1 : false)

      // scan beam drives the highlights
      const bp = tw(t, 4.92, 0.42, E.io), bc = lerp(-40, 450, bp)
      V(beam, bp > 0 && bp < 1); T(beam, `translateY(${bc - 70}px)`)
      const fix = tw(t, 5.44, 0.3, E.inOut)
      const flag = (li, col) => {
        const lc = 90 + li * 52 + 26
        const p = E.out(clamp((bc - lc) / 120))
        T(lines[li].hl, `scaleX(${p})`)
        lines[li].hl.style.background = fix > 0.5 ? 'rgba(61,214,140,.13)' : col
        lines[li].hl.style.boxShadow = `inset 4px 0 0 ${fix > 0.5 ? C.green : col.replace(/[\d.]+\)$/, '1)')}`
      }
      flag(2, 'rgba(229,72,77,.17)'); flag(3, 'rgba(245,165,36,.15)')
      const arc = Math.sin(fix * Math.PI)
      T(lines[2].ln, `translate(${arc * 34}px,${fix * 52}px)`)
      T(lines[3].ln, `translate(${-arc * 34}px,${-fix * 52}px)`)
      if (t < 4.92) { status.textContent = 'parsing…'; status.style.color = C.muted }
      else if (t < 5.14) { status.textContent = 'scanning ' + '▮'.repeat(1 + Math.floor((t - 4.92) * 30) % 6); status.style.color = C.blueHi }
      else if (fix < 0.6) { status.textContent = '1 FINDING · HIGH'; status.style.color = C.red }
      else { status.textContent = '0 FINDINGS · PASS'; status.style.color = C.green }

      const cin = tw(t, 5.16, 0.34)
      const flip = tw(t, 5.5, 0.4, E.inOut)
      T(card, `perspective(1600px) translateX(${(1 - cin) * 80}px) rotateY(${flip * 180}deg)`)
      O(card, cin)
      const x1 = 150 + 92 + 50 * charW + 16, y1 = 300 + 90 + 2 * 52 + 26
      conn.setAttribute('d', `M${x1} ${y1} C ${x1 + 70} ${y1}, ${1170 - 90} ${410}, 1166 410`)
      draw(conn, tw(t, 5.12, 0.22)); connDot.setAttribute('cx', x1); connDot.setAttribute('cy', y1)
      const cf = 1 - tw(t, 5.42, 0.14, E.lin)
      O(conn, cf); O(connDot, t > 5.12 ? cf : 0)

      const gout = tw(t, 5.9, 0.3, E.in)
      T(group, `translateX(${-gout * 280}px) scale(${1 - gout * 0.06})`)
      O(group, 1 - gout); group.style.filter = gout > 0 ? `blur(${gout * 10}px)` : 'none'

      // 277 odometer
      const cOut = tw(t, 6.64, 0.26, E.in)
      V(counter, t > 5.95 && cOut < 1)
      T(counter, `translateY(${-cOut * 140}px)`); O(counter, 1 - cOut)
      counter.style.filter = cOut > 0 ? `blur(${cOut * 8}px)` : 'none'
      bigCols.forEach((c, k) => { const p = tw(t, 5.96 + k * 0.09, 0.78 - k * 0.04); T(c.strip, `translateY(${-(10 + c.d) * p}em)`) })
      smallCols.forEach((c, k) => { const p = tw(t, 6.18 + k * 0.07, 0.5); T(c.strip, `translateY(${-(10 + c.d) * p}em)`) })
      T(big, `translateY(${(1 - tw(t, 5.96, 0.4)) * 60}px)`)
      T(lab1.firstChild, `translateY(${(1 - tw(t, 6.08, 0.36)) * 110}%)`)
      O(lab1s, tw(t, 6.2, 0.3))
      T(lab2.firstChild, `translateY(${(1 - tw(t, 6.26, 0.36)) * 110}%)`)
      T(crule, `scaleX(${tw(t, 6.1, 0.6)})`)

      // chips burst → bars
      O(chartTitle, tw(t, 7.3, 0.3) * (1 - tw(t, 7.74, 0.12, E.lin)))
      T(base, `scaleX(${tw(t, 7.28, 0.4) * (1 - tw(t, 7.74, 0.2, E.in))})`)
      for (const c of chips) {
        const st = 6.8 + c.rank * 0.013
        if (t < st) { V(c.el, false); continue }
        V(c.el, true)
        const sp = spring(t - st, 2.3, 0.5)
        const m = tw(t, 7.28 + c.r * 0.008, 0.38, E.inOut)
        const gx = lerp(960 - c.g.w / 2, c.g.x, sp), gy = lerp(525 - c.g.h / 2, c.g.y, sp)
        const x = lerp(gx, c.b.x, m), y = lerp(gy, c.b.y, m), w = lerp(c.g.w, c.b.w, m), hh = lerp(c.g.h, c.b.h, m)
        c.el.style.left = x + 'px'; c.el.style.top = y + 'px'; c.el.style.width = w + 'px'; c.el.style.height = hh + 'px'
        c.el.style.borderRadius = lerp(12, 6, m) + 'px'
        const col = tw(t, 7.72 + c.r * 0.006, 0.18, E.in)
        T(c.el, `rotate(${lerp(c.rot, 0, clamp(sp))}deg) scale(${lerp(0.25, 1, clamp(sp, 0, 1.2))}) scaleY(${1 - col})`)
        O(c.el, clamp((t - st) / 0.06))
        O(c.face, 1 - clamp(m / 0.35)); O(c.fill, m); O(c.vlab, clamp((m - 0.6) / 0.4)); O(c.cnt, clamp((m - 0.6) / 0.4) * (1 - col))
      }
      bands.forEach((b, k) => { const p = tw(t, 7.76 + k * 0.03, 0.2, E.inOut); T(b, `translateX(${(1 - p) * (k % 2 ? 100 : -100)}%)`) })
    },
  }
})

// 03 ─ HAUUM — five directions ──────────────────────────── 8.0 → 10.0
scene('hauum', 8.0, 10.0, 4, root => {
  const DIRS = [
    ['hauum-warm-organic', 'Warm Organic', '#F3EDE4'], ['hauum-dark-luxe', 'Dark Luxe', '#17120F'],
    ['hauum-editorial-mag', 'Editorial', '#F7F5F0'], ['hauum-kinetic', 'Kinetic', '#F6E7DE'], ['hauum-brutalist-chic', 'Brutalist-chic', '#EFEFEF'],
  ]
  const world = h('div', { cls: 'fill' }, root)
  const head = h('div', { cls: 'abs mono', css: 'left:384px;top:118px;font-size:18px;letter-spacing:.2em;color:#fff;mix-blend-mode:difference;white-space:pre', text: 'HAUUM — STUDIO D’ARCHITECTURE COMMERCIALE · BORDEAUX' }, world)
  const persp = h('div', { cls: 'fill', css: 'perspective:2000px;perspective-origin:50% 50%' }, world)
  const cards = DIRS.map(([src, label], i) => {
    const el = h('div', { cls: 'abs', css: 'left:384px;top:180px;width:1152px;height:720px;border-radius:14px;overflow:hidden;box-shadow:0 50px 110px rgba(0,0,0,.35),0 0 0 1px rgba(255,255,255,.08)' }, persp)
    I('img/' + src + '.webp', el, 'width:100%;height:100%;object-fit:cover')
    const lab = h('div', { cls: 'abs mono', css: `left:0;right:0;top:752px;text-align:center;font-size:54px;letter-spacing:.1em;color:${C.ink};opacity:0;white-space:nowrap`, text: `0${i + 1} ${label.toUpperCase()}` }, el)
    el.style.overflow = 'visible'
    el.firstChild.style.borderRadius = '14px'
    return { el, lab }
  })
  const sticker = h('div', { cls: 'abs mono pill', css: `left:384px;top:930px;background:${C.ink};color:${C.paper};font-size:20px;letter-spacing:.14em;padding:12px 22px;white-space:pre` }, world)
  const titleBox = h('div', { cls: 'abs disp', css: `left:0;right:0;top:236px;text-align:center;font-size:104px;font-weight:700;letter-spacing:-.045em;color:${C.ink};line-height:1` }, world)
  const words = 'One studio. Five directions.'.split(' ').map(wd => {
    const m = h('span', { css: 'display:inline-block;overflow:hidden;padding:0 .12em .1em;vertical-align:bottom' }, titleBox)
    return h('span', { css: 'display:inline-block', text: wd }, m)
  })
  const bands = [0, 1, 2, 3, 4].map(k => h('div', { cls: 'abs', css: `left:0;width:1920px;top:${k * 216}px;height:217px;background:#F3EDE4` }, root))
  const edge = h('div', { cls: 'abs', css: 'top:0;bottom:0;width:180px;background:linear-gradient(90deg,transparent,rgba(0,0,0,.32))' }, root)
  const steps = [1, 2, 3, 4].map(k => 8.24 + (k - 1) * 0.22)
  return {
    render(t) {
      const cam = steps.reduce((a, s) => a + tw(t, s, 0.2, E.inOut), 0)
      const g = tw(t, 9.1, 0.52, E.inOut)
      const k = Math.min(4, Math.floor(cam)), fr = cam - k
      const bg = mix(DIRS[k][2], DIRS[Math.min(4, k + 1)][2], fr)
      root.style.background = g > 0 ? mix(g > 0 ? '#EFEFEF' : DIRS[k][2], '#E9E6DF', g) : bg
      cards.forEach((c, i) => {
        const d = i - cam
        const xc = d * 1100, zc = -Math.min(Math.abs(d), 2) * 380, ry = clamp(d, -1.6, 1.6) * -34
        const oc = clamp(2.6 - Math.abs(d))
        const x = lerp(xc, (i - 2) * 372, g), z = lerp(zc, 0, g), r = lerp(ry, 0, g), s = lerp(1, 0.31, g), y = lerp(0, 34, g)
        T(c.el, `translate3d(${x}px,${y}px,${z}px) rotateY(${r}deg) scale(${s})`)
        O(c.el, lerp(oc, 1, g))
        c.el.style.zIndex = 10 - Math.round(Math.abs(d) * 2)
        O(c.lab, tw(t, 9.4 + i * 0.04, 0.3))
      })
      const idx = Math.round(cam)
      const since = t - (idx === 0 ? 8.0 : steps[idx - 1] + 0.1)
      sticker.textContent = scramble(`HAUUM — 0${idx + 1} / ${DIRS[idx][1].toUpperCase()}`, clamp(since / 0.14), t, idx * 13)
      O(sticker, (1 - g) * tw(t, 8.06, 0.2))
      O(head, 1 - g)
      words.forEach((w, j) => T(w, `translateY(${(1 - tw(t, 9.26 + j * 0.05, 0.42)) * 110}%)`))
      bands.forEach((b, j) => { const p = tw(t, 8.0 + j * 0.03, 0.22, E.inOut); T(b, `translateX(${p * (j % 2 ? -100 : 100)}%)`) })
      const out = tw(t, 9.7, 0.3, E.inOut)
      T(world, `translateX(${-out * 24}%)`)
      V(edge, out > 0); edge.style.left = (1 - out) * 1920 - 180 + 'px'
      world.style.filter = out > 0 ? `brightness(${1 - out * 0.35})` : 'none'
    },
  }
})

// 04 ─ CHỢ VỈA HÈ ───────────────────────────────────────── 9.7 → 12.0
scene('choviahe', 9.7, 12.0, 5, root => {
  root.style.cssText += ';background:#EADCBD url(assets/img/papier.webp) center/cover'
  imgs.push(Object.assign(new Image(), { src: 'assets/img/papier.webp' }))
  const scooter = I('illus/scooter.webp', root, 'position:absolute;left:0;top:800px;width:300px')
  const frame = h('div', { cls: 'abs', css: 'left:110px;top:196px;width:1000px;height:665px;border-radius:14px;overflow:hidden;background:#F7F1E3;box-shadow:0 12px 28px rgba(30,26,23,.22),0 40px 90px rgba(30,26,23,.28);transform-origin:50% 100%' }, root)
  const chrome = h('div', { css: 'height:40px;display:flex;align-items:center;gap:8px;padding:0 16px;background:#F1E7D2;border-bottom:1px solid #E0D2B4' }, frame)
  ;['#E07A5F', '#F2B300', '#81B29A'].forEach(c => h('span', { css: `width:11px;height:11px;border-radius:50%;background:${c}` }, chrome))
  h('span', { cls: 'mono', css: 'margin-left:auto;margin-right:auto;font-size:14px;color:#4a423a;background:#FBF6EC;border-radius:999px;padding:5px 60px', text: 'choviahe.fr' }, chrome)
  const screen = h('div', { css: 'position:relative;height:625px;overflow:hidden' }, frame)
  const shot = I('img/choviahe-full.webp', screen, 'width:1000px')
  const col = h('div', { cls: 'abs', css: 'left:1196px;top:236px;width:620px' }, root)
  const label = h('div', { cls: 'mono', css: 'font-size:17px;letter-spacing:.22em;color:#17566E;white-space:pre', text: 'SITE WEB · DESIGN SYSTEM · 2026' }, col)
  const ttl = h('div', { css: 'font-family:Lora,serif;font-weight:600;font-size:112px;line-height:1.05;color:#C0264B;margin-top:14px;white-space:nowrap' }, col)
  const TL = chars(ttl, 'Chợ Vỉa Hè')
  const hand = h('div', { css: 'font-family:"Dancing Script",cursive;font-weight:600;font-size:48px;color:#1E1A17;margin-top:6px;white-space:nowrap', text: 'cuisine de rue vietnamienne' }, col)
  const para = h('div', { css: 'font-size:22px;line-height:1.5;color:#4a423a;margin-top:18px;max-width:560px', text: 'Kraft échantillonné au pixel sur la carte imprimée, illustrations d’Oriane, un motion calme : on feuillette.' }, col)
  const cta = h('div', { cls: 'abs pill', css: 'left:1196px;top:700px;background:#F2B300;color:#1E1A17;font:600 25px Inter,sans-serif;padding:20px 38px;box-shadow:0 6px 0 #B98500' , text: 'Réserver une table' }, root)
  const ripple = h('div', { cls: 'abs', css: 'border-radius:50%;border:3px solid #1E1A17' }, root)
  const cursor = h('div', { cls: 'abs', css: 'width:36px;height:36px', html: '<svg viewBox="0 0 24 24" width="36" height="36"><path d="M3 2l7.5 19 2.6-8.1L21 10.3z" fill="#fff" stroke="#1E1A17" stroke-width="1.6" stroke-linejoin="round"/></svg>' }, root)
  const il = (src, css) => I('illus/' + src + '.webp', root, 'position:absolute;' + css)
  const guir = il('guirlande', 'left:1020px;top:-26px;width:800px;transform-origin:50% 0')
  const lant = il('lanternes', 'left:1748px;top:-40px;width:150px;transform-origin:50% 0')
  const pops = [
    [il('banh-mi', 'left:26px;top:770px;width:300px'), 10.38, -28, -8],
    [il('tabouret', 'left:1216px;top:846px;width:140px'), 10.5, 18, 4],
    [il('sriracha', 'left:1430px;top:800px;width:92px'), 10.56, -20, 8],
    [il('nems', 'left:1560px;top:772px;width:300px'), 10.46, 24, 6],
  ]
  const wipeY = h('div', { cls: 'fill', css: 'background:#F2B300' }, root)
  const wipeC = h('div', { cls: 'fill', css: 'background:#24140F' }, root)
  let btn = { x: 0, y: 0 }
  return {
    layout() { btn = { x: cta.offsetLeft + cta.offsetWidth / 2, y: cta.offsetTop + cta.offsetHeight / 2 } },
    render(t) {
      const slide = tw(t, 9.7, 0.3, E.inOut)
      T(root, `translateX(${(1 - slide) * 100}%)`)
      const fin = spring(t - 10.0, 1.6, 0.5)
      T(frame, `translateY(${(1 - fin) * 820}px) rotate(${lerp(-9, -1.5, fin)}deg)`)
      T(shot, `translateY(${-lerp(0, 1180, tw(t, 10.4, 1.5, E.io))}px)`)
      O(label, tw(t, 10.08, 0.3))
      TL.forEach((l, i) => {
        const st = 10.14 + i * 0.035, p = spring(t - st, 2.2, 0.45)
        T(l.inner, `translateY(${(1 - p) * 70}px) rotate(${(1 - p) * -14}deg)`)
        O(l.inner, clamp((t - st) * 10))
      })
      hand.style.clipPath = `inset(-20px ${(1 - tw(t, 10.44, 0.6, E.io)) * 100}% -20px 0)`
      T(para, `translateY(${(1 - tw(t, 10.6, 0.5)) * 30}px)`); O(para, tw(t, 10.6, 0.4))
      // CTA pops, the cursor glides in and clicks it
      const cp = spring(t - 10.8, 2.6, 0.42)
      const press = t > 11.3 && t < 11.44 ? 1 : 0
      T(cta, `scale(${cp}) translateY(${press * 4}px)`)
      cta.style.boxShadow = `0 ${press ? 2 : 6}px 0 #B98500`
      const cm = tw(t, 10.95, 0.35, E.inOut)
      const cx = lerp(1720, btn.x + 60, cm), cy = lerp(1100, btn.y + 6, cm)
      T(cursor, `translate(${cx}px,${cy}px) scale(${press ? 0.88 : 1})`)
      const rp = tw(t, 11.3, 0.4)
      V(ripple, t > 11.3 && rp < 1)
      const rr = rp * 110
      ripple.style.cssText += `;left:${btn.x + 60 - rr}px;top:${btn.y + 6 - rr}px;width:${2 * rr}px;height:${2 * rr}px;opacity:${1 - rp}`
      // illustrations
      const gt = t - 10.04
      T(guir, `translateY(${(1 - spring(gt, 1.7, 0.45)) * -340}px) rotate(${gt > 0 ? 3.5 * Math.exp(-3 * gt) * Math.sin(10 * gt) : 0}deg)`)
      const lt = t - 10.12
      T(lant, `translateY(${(1 - spring(lt, 1.5, 0.5)) * -380}px) rotate(${lt > 0 ? 16 * Math.exp(-1.5 * lt) * Math.cos(6.5 * lt) : 16}deg)`)
      for (const [el, st, r0, r1] of pops) {
        const p = spring(t - st, 2.4, 0.38)
        T(el, `scale(${Math.max(0, p)}) rotate(${lerp(r0, r1, clamp(p, 0, 1.3))}deg)`)
      }
      const sx = lerp(-440, 2050, clamp((t - 10.62) / 1.3))
      T(scooter, `translate(${sx}px,${-Math.abs(Math.sin(t * 26)) * 7}px)`)
      T(wipeY, `translateY(${(1 - tw(t, 11.58, 0.26, E.inOut)) * 100}%)`)
      T(wipeC, `translateY(${(1 - tw(t, 11.72, 0.28, E.inOut)) * 100}%)`)
    },
  }
})

// 05 ─ CAFÉ BÔNG ────────────────────────────────────────── 12.0 → 13.5
scene('cafebong', 12.0, 13.5, 6, root => {
  root.style.background = 'radial-gradient(circle at 520px 560px,#4A2A1C 0%,#24140F 55%,#170D09 100%)'
  const outline = h('div', { cls: 'abs', css: 'left:272px;top:150px;width:540px;height:740px;border-radius:270px 270px 20px 20px;border:1.5px solid rgba(224,161,90,.55);box-sizing:border-box' }, root)
  const arch = h('div', { cls: 'abs', css: 'left:250px;top:170px;width:540px;height:740px;border-radius:270px 270px 20px 20px;overflow:hidden;background:#C4502A;box-shadow:0 40px 90px rgba(0,0,0,.45)' }, root)
  const cv = h('canvas', {}, arch); cv.width = 540; cv.height = 740
  const ctx = cv.getContext('2d')
  const frames = Array.from({ length: 60 }, (_, i) => { const im = new Image(); im.src = `assets/media/phin/${String(i + 1).padStart(3, '0')}.jpg`; imgs.push(im); return im })
  const txt = h('div', { cls: 'abs', css: 'left:910px;top:268px;width:900px' }, root)
  const lab = h('div', { cls: 'mono', css: 'font-size:17px;letter-spacing:.22em;color:#E0A15A;white-space:pre', text: 'CAFÉ BÔNG — TOULOUSE · 11 RUE DE LA BOURSE' }, txt)
  const line = (text, italic, color) => {
    const l = h('div', { css: `font-family:Fraunces,serif;font-weight:500;font-size:132px;line-height:1.04;letter-spacing:-.02em;color:${color};${italic ? 'font-style:italic;' : ''}white-space:nowrap` }, txt)
    return text.split(' ').map(wd => {
      const m = h('span', { css: 'display:inline-block;overflow:hidden;padding:0 .04em .12em;margin-right:.18em;vertical-align:bottom' }, l)
      return h('span', { css: 'display:inline-block', text: wd }, m)
    })
  }
  const words = [...line('Le café viet,', false, '#F3E9DC'), ...line('fait maison.', true, '#E0A15A')]
  const para = h('div', { css: 'font-size:22px;line-height:1.5;color:#CDB9A6;margin-top:10px;max-width:640px', text: 'Bubble teas, limonades pétillantes, thés glacés et gâteaux maison — une carte courte et fraîche.' }, txt)
  const row = h('div', { css: 'display:flex;align-items:center;gap:26px;margin-top:34px' }, txt)
  const cta = h('div', { cls: 'pill', css: 'background:#C4502A;color:#fff;font:600 22px Inter,sans-serif;padding:16px 32px', text: 'Voir la carte' }, row)
  const tags = h('div', { cls: 'mono', css: 'font-size:15px;letter-spacing:.18em;color:#8C6F5C;white-space:pre', text: 'FRAUNCES · DM SANS · 3 DIRECTIONS' }, row)
  const drop = h('div', { cls: 'abs', css: 'left:946px;width:28px;height:36px;background:#E0A15A;border-radius:50% 50% 50% 50% / 62% 62% 38% 38%' }, root)
  const inkC = h('div', { cls: 'fill', css: `background:${C.ink}` }, root)
  const rip = [0, 1].map(() => h('div', { cls: 'abs', css: 'border-radius:50%;border:2px solid #E0A15A' }, root))
  return {
    render(t) {
      const lt = t - 12.0
      const rv = tw(t, 12.0, 0.45)
      arch.style.clipPath = `inset(${(1 - rv) * 100}% 0 0 0 round 270px 270px 20px 20px)`
      O(outline, tw(t, 12.25, 0.4)); T(outline, `translate(${(1 - tw(t, 12.25, 0.5)) * -18}px,${(1 - tw(t, 12.25, 0.5)) * 18}px)`)
      const fr = frames[Math.min(59, Math.floor(lt * 30))]
      const s = lerp(1.18, 1.0, tw(t, 12.0, 1.5, E.out)) * 740 / 608
      ctx.fillStyle = '#C4502A'; ctx.fillRect(0, 0, 540, 740)
      if (fr.complete && fr.naturalWidth) ctx.drawImage(fr, 270 - 304 * s, 370 - 304 * s, 608 * s, 608 * s)
      O(lab, tw(t, 12.1, 0.3))
      words.forEach((w, j) => T(w, `translateY(${(1 - tw(t, 12.1 + j * 0.055, 0.45)) * 112}%)`))
      T(para, `translateY(${(1 - tw(t, 12.4, 0.45)) * 24}px)`); O(para, tw(t, 12.4, 0.35))
      T(cta, `scale(${spring(t - 12.48, 2.6, 0.45)})`)
      O(tags, tw(t, 12.6, 0.3))
      // a coffee drop falls and splashes into the next scene
      const dp = clamp((t - 13.1) / 0.22)
      V(drop, t > 13.1 && t < 13.32)
      T(drop, `translateY(${lerp(-60, 522, dp * dp)}px) scaleY(${1 + dp * 0.35})`)
      const ir = tw(t, 13.31, 0.18)
      V(inkC, t >= 13.31)
      inkC.style.clipPath = `circle(${ir * 1150}px at 960px 540px)`
      rip.forEach((r, k) => {
        const p = tw(t, 13.31 + k * 0.06, 0.4), rr = 20 + p * (240 + k * 120)
        V(r, t > 13.31 + k * 0.06)
        r.style.cssText += `;left:${960 - rr}px;top:${540 - rr * 0.35}px;width:${2 * rr}px;height:${0.7 * rr}px;opacity:${(1 - p) * 0.9}`
      })
    },
  }
})

// 06 ─ GIDEON + PLANS & AMBIANCES ───────────────────────── 13.5 → 15.5
scene('systems', 13.5, 15.5, 7, root => {
  root.style.background = C.ink
  h('div', { cls: 'fill dotgrid' }, root)
  const CX = 960, CY = 560
  const glow = h('div', { cls: 'abs', css: `left:${CX - 330}px;top:${CY - 330}px;width:660px;height:660px;border-radius:50%;background:radial-gradient(circle,rgba(61,107,255,.42),transparent 62%)` }, root)
  const esvg = sv('svg', { width: W, height: H, style: 'position:absolute;left:0;top:0' }, root)
  const NODES = [['Claude', 205], ['MCP', 180], ['Discord bot', 155], ['Pairing engine', -25], ['VPS · Lua 5.1', 0], ['WoW addon', 25]]
  const nodes = NODES.map(([label, a], i) => {
    const x = CX + 560 * Math.cos(a * Math.PI / 180), y = CY + 290 * Math.sin(a * Math.PI / 180)
    const line = sv('line', { x1: CX, y1: CY, x2: x, y2: y, stroke: 'rgba(61,107,255,.7)', 'stroke-width': 1.6, pathLength: 1, 'stroke-dasharray': 1 }, esvg)
    const pulses = [0, 1].map(() => sv('circle', { r: 4.5, fill: '#9FB4FF' }, esvg))
    const el = h('div', { cls: 'abs mono pill', css: `left:${x}px;top:${y}px;background:#121317;border:1px solid rgba(255,255,255,.16);padding:13px 22px;font-size:20px;gap:12px;white-space:nowrap;color:${C.paper}`, html: `<i style="width:9px;height:9px;border-radius:50%;background:${C.blueHi};display:inline-block"></i>${label}` }, root)
    return { x, y, line, pulses, el, i }
  })
  const hub = h('div', { cls: 'abs', css: `left:${CX - 310}px;top:${CY - 310}px;width:620px;height:620px` }, root)
  const rsvg = sv('svg', { width: 620, height: 620, style: 'position:absolute;left:0;top:0;overflow:visible' }, hub)
  const r1 = sv('circle', { cx: 310, cy: 310, r: 214, fill: 'none', stroke: C.blueHi, 'stroke-width': 2, 'stroke-dasharray': '3 9' }, rsvg)
  const r2 = sv('circle', { cx: 310, cy: 310, r: 246, fill: 'none', stroke: 'rgba(255,255,255,.28)', 'stroke-width': 1.5, 'stroke-dasharray': '80 18 6 18' }, rsvg)
  const face = I('img/gideon.webp', hub, 'position:absolute;left:125px;top:125px;width:370px;height:370px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 2px rgba(61,107,255,.7),0 0 80px rgba(61,107,255,.5)')
  const head = h('div', { cls: 'abs', css: 'left:150px;top:108px' }, root)
  const ttl = h('div', { cls: 'disp', css: 'font-size:84px;font-weight:700;letter-spacing:-.035em;overflow:hidden;line-height:1.05', html: '<div>GIDEON</div>' }, head)
  const sub = h('div', { cls: 'mono', css: `font-size:18px;letter-spacing:.2em;color:${C.muted};margin-top:8px;white-space:pre`, text: 'AGENTIC ORCHESTRATION · CLAUDE + MCP · RAID COACH' }, head)
  const LOG = ['› fan-out    6 agents · parallel', '› verify     adversarial  ✓', '› triage     structured → SavedVariables']
  const log = h('div', { cls: 'abs mono', css: `left:150px;top:858px;font-size:19px;line-height:32px;color:${C.muted};white-space:pre` }, root)

  // blueprint — outil-archi "Plans & Ambiances"
  const bp = h('div', { cls: 'fill', css: 'background-color:#0B2A6F;background-image:linear-gradient(rgba(255,255,255,.14) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.14) 1px,transparent 1px),linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);background-size:160px 160px,160px 160px,32px 32px,32px 32px;background-position:-1px -1px' }, root)
  const bhead = h('div', { cls: 'abs', css: 'left:150px;top:108px' }, bp)
  const bttl = h('div', { cls: 'disp', css: 'font-size:76px;font-weight:700;letter-spacing:-.03em;overflow:hidden;line-height:1.08', html: '<div>PLANS &amp; AMBIANCES</div>' }, bhead)
  const bsub = h('div', { cls: 'mono', css: 'font-size:18px;letter-spacing:.2em;color:rgba(255,255,255,.72);margin-top:8px;white-space:pre', text: 'OUTIL ARCHI D’INTÉRIEUR · PWA · PLAN 2D · EXPORT PDF · AMBIANCES IA' }, bhead)
  const plan = h('div', { cls: 'abs', css: 'left:430px;top:352px;width:1000px;height:560px;transform-origin:50% 50%' }, bp)
  const psvg = sv('svg', { width: 1000, height: 560, style: 'position:absolute;left:0;top:0;overflow:visible' }, plan)
  const ROOMS = [
    ['Séjour', '28 m²', 0, 0, 600, 330, '#E8D9C5'], ['Cuisine', '12 m²', 600, 0, 400, 330, '#CBB8A0'],
    ['Chambre', '11 m²', 0, 330, 420, 230, '#D8C3AE'], ['SdB', '6 m²', 420, 330, 280, 230, '#B9CFCB'], ['Bureau', '8 m²', 700, 330, 300, 230, '#E2CDBF'],
  ].map(([n, a, x, y, w, hh, col], k) => {
    const r = sv('rect', { x, y, width: w, height: hh, fill: col, opacity: 0 }, psvg)
    const lab = h('div', { cls: 'abs', css: `left:${x}px;top:${y}px;width:${w}px;height:${hh}px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#1E1A17;opacity:0`, html: `<div style="font:600 26px Inter,sans-serif">${n}</div><div class="mono" style="font-size:17px;margin-top:4px;opacity:.7">${a}</div>` }, plan)
    return { r, lab, k, cx: x + w / 2, cy: y + hh / 2 }
  })
  const wall = (d, w = 12) => sv('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': w, 'stroke-linecap': 'square', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, psvg)
  const outer = wall('M0 0 H1000 V560 H0 Z', 14)
  const inner = ['M600 0 V330', 'M0 330 H230 M320 330 H500 M580 330 H760 M850 330 H1000', 'M420 330 V560', 'M700 330 V560'].map(d => wall(d, 10))
  const doors = ['M230 330 A90 90 0 0 0 320 420', 'M500 330 A80 80 0 0 1 580 410', 'M760 330 A90 90 0 0 0 850 420'].map(d => sv('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.75)', 'stroke-width': 2, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, psvg))
  const dims = ['M0 -54 H1000 M0 -66 V-42 M1000 -66 V-42', 'M-54 0 V560 M-66 0 H-42 M-66 560 H-42'].map(d => sv('path', { d, fill: 'none', stroke: 'rgba(255,255,255,.7)', 'stroke-width': 1.5, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, psvg))
  const dimT = h('div', { cls: 'abs mono', css: 'left:0;width:1000px;top:-100px;text-align:center;font-size:20px;color:#fff' }, plan)
  const dimL = h('div', { cls: 'abs mono', css: 'left:-160px;top:264px;width:200px;text-align:center;font-size:20px;color:#fff;transform:rotate(-90deg)' }, plan)
  const amb = h('div', { cls: 'abs mono pill', css: 'left:1480px;top:352px;flex-direction:column;align-items:flex-start;gap:14px;border-radius:16px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.28);padding:18px 22px;font-size:15px;letter-spacing:.16em;color:#fff;transform-origin:0 0', html: `<div>AMBIANCE IA</div><div style="font:600 24px Inter,sans-serif;letter-spacing:0">Warm minimal</div><div style="display:flex;gap:8px">${['#E8D9C5', '#CBB8A0', '#D8C3AE', '#B9CFCB', '#E2CDBF'].map(c => `<i style="display:block;width:26px;height:26px;border-radius:50%;background:${c}"></i>`).join('')}</div>` }, bp)
  return {
    render(t) {
      const sp = spring(t - 13.5, 2.2, 0.5)
      T(hub, `scale(${lerp(0.3, 1, sp)})`); O(hub, clamp((t - 13.5) * 8))
      r1.setAttribute('transform', `rotate(${t * 40} 310 310)`); r2.setAttribute('transform', `rotate(${-t * 26} 310 310)`)
      T(face, `scale(${lerp(1.3, 1, tw(t, 13.5, 0.6))})`)
      O(glow, tw(t, 13.5, 0.4) * (0.8 + 0.2 * Math.sin(t * 9)))
      nodes.forEach(n => {
        const st = 13.62 + n.i * 0.035
        draw(n.line, tw(t, st, 0.24))
        const p = spring(t - st - 0.1, 2.6, 0.45)
        T(n.el, `translate(-50%,-50%) scale(${Math.max(0, p)})`)
        n.pulses.forEach((c, k) => {
          const u = ((t - 13.86) * 1.5 + n.i * 0.13 + k * 0.5) % 1
          V(c, t > 13.86)
          c.setAttribute('cx', lerp(CX, n.x, u)); c.setAttribute('cy', lerp(CY, n.y, u))
          c.setAttribute('opacity', Math.sin(u * Math.PI))
        })
      })
      T(ttl.firstChild, `translateY(${(1 - tw(t, 13.56, 0.4)) * 110}%)`)
      O(sub, tw(t, 13.68, 0.3))
      const nl = Math.floor(LOG.join('\n').length * tw(t, 13.8, 0.5, E.lin))
      log.textContent = LOG.join('\n').slice(0, nl)

      const br = tw(t, 14.4, 0.28, E.inOut)
      V(bp, br > 0)
      bp.style.clipPath = `circle(${br * 1200}px at ${CX}px ${CY}px)`
      T(bttl.firstChild, `translateY(${(1 - tw(t, 14.52, 0.4)) * 110}%)`)
      O(bsub, tw(t, 14.62, 0.3))
      draw(outer, tw(t, 14.56, 0.36, E.io))
      inner.forEach((p, k) => draw(p, tw(t, 14.7 + k * 0.045, 0.26, E.io)))
      doors.forEach((p, k) => draw(p, tw(t, 14.96 + k * 0.03, 0.2)))
      dims.forEach((p, k) => draw(p, tw(t, 14.78 + k * 0.05, 0.3)))
      const dc = tw(t, 14.8, 0.36)
      dimT.textContent = (8.4 * dc).toFixed(2).replace('.', ',') + ' m'; O(dimT, clamp(dc * 4))
      dimL.textContent = (5.6 * dc).toFixed(2).replace('.', ',') + ' m'; O(dimL, clamp(dc * 4))
      ROOMS.forEach(r => {
        const p = tw(t, 15.0 + r.k * 0.045, 0.22)
        r.r.setAttribute('opacity', p * 0.95)
        r.r.setAttribute('transform', `translate(${r.cx} ${r.cy}) scale(${lerp(0.85, 1, p)}) translate(${-r.cx} ${-r.cy})`)
        O(r.lab, tw(t, 15.06 + r.k * 0.045, 0.2)); T(r.lab, `translateY(${(1 - p) * 14}px)`)
      })
      T(amb, `scale(${Math.max(0, spring(t - 15.1, 2.6, 0.45))})`)
      const iso = tw(t, 15.26, 0.26, E.inOut)
      T(plan, `perspective(3000px) rotateX(${iso * 52}deg) rotateZ(${-iso * 36}deg) scale(${1 - iso * 0.35})`)
    },
  }
})

// 07 ─ SELECTED WORK — isometric wall + hyper-cut ─────────── 15.36 → 17.5
scene('wall', 15.36, 17.5, 8, root => {
  root.style.background = C.ink
  const COLS = [
    ['hauum-kinetic-full', 'cafebong-v2', 'hauum-dark-luxe'],
    ['choviahe-full', 'hauum-editorial-mag', 'gideon'],
    ['hauserjean-full', 'hauum-brutalist-chic', 'cafebong-v1'],
    ['cafebong-v1-full', 'choviahe', 'hauum-kinetic'],
    ['hauum-warm-organic-full', 'hauserjean', 'hauum-dark-luxe'],
    ['choviahe-full', 'gideon', 'hauum-editorial-mag'],
    ['hauum-kinetic-full', 'hauum-brutalist-chic', 'cafebong-v2'],
  ]
  const plane = h('div', { cls: 'abs', css: 'left:50%;top:50%;width:3320px;height:4200px' }, root)
  const cols = COLS.map((list, k) => {
    const col = h('div', { cls: 'abs', css: `left:${k * 480}px;top:0;width:440px;height:4200px;overflow:hidden` }, plane)
    const strip = h('div', { cls: 'abs', css: 'left:0;top:0;width:440px' }, col)
    for (let r = 0; r < 3; r++) for (const src of list) I((src === 'gideon' ? 'img/gideon' : 'img/' + src) + '.webp', strip, 'width:440px;margin-bottom:28px;border-radius:10px;box-shadow:0 20px 40px rgba(0,0,0,.4)')
    return { strip, seq: 0, dir: k % 2 ? 1 : -1, v: 0.8 + 0.35 * rnd(k * 4.7) }
  })
  h('div', { cls: 'fill', css: 'background:radial-gradient(ellipse 80% 70% at 50% 50%,rgba(11,12,14,.25),rgba(11,12,14,.75))' }, root)
  const marquee = (top, text, css) => {
    const m = h('div', { cls: 'abs', css: `left:0;right:0;top:${top}px;height:230px;overflow:hidden` }, root)
    return h('div', { cls: 'abs disp', css: `left:0;top:0;font-size:200px;font-weight:700;letter-spacing:-.045em;line-height:1.1;white-space:nowrap;${css}`, text: text.repeat(4) }, m)
  }
  const mA = marquee(190, 'DESIGN — BUILD — SECURE — SHIP — ', 'color:transparent;-webkit-text-stroke:2.5px rgba(244,243,239,.92)')
  const mB = marquee(680, 'SELECTED WORK • 2024 — 2026 • ', `color:${C.blueHi}`)
  const flash = h('div', { cls: 'fill', css: `background:${C.paper};opacity:0` }, root)
  // hyper-cut montage on 16th notes
  const CUTS = ['hauum-kinetic', 'choviahe', 'gideon', 'hauserjean', 'cafebong-v1', 'hauum-dark-luxe', 'hauum-brutalist-chic', null]
  const WORDS = ['DESIGN', 'BUILD', 'SECURE', 'SHIP']
  const cut = h('div', { cls: 'fill', css: `background:${C.blue}` }, root)
  const cutImgs = CUTS.map(src => src ? I('img/' + src + '.webp', cut, 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover') : null)
  const tint = h('div', { cls: 'fill', css: `background:${C.blue};mix-blend-mode:multiply` }, cut)
  const n277 = h('div', { cls: 'abs disp', css: `left:0;right:0;top:250px;text-align:center;font-size:520px;font-weight:700;letter-spacing:-.05em;line-height:1;color:${C.paper}`, text: '277' }, cut)
  const cword = h('div', { cls: 'abs disp', css: 'left:0;right:0;top:360px;text-align:center;font-size:300px;font-weight:700;letter-spacing:-.05em;line-height:1;color:#fff;mix-blend-mode:difference' }, cut)
  return {
    layout() { cols.forEach(c => { c.seq = c.strip.offsetHeight / 3 }) },
    render(t) {
      const lt = t - 15.36
      O(root, tw(t, 15.36, 0.14, E.lin))
      const sc = lerp(1.22, 0.9, tw(t, 15.36, 2.0, E.out)), rz = lerp(-33, -41, tw(t, 15.36, 2.1, E.io))
      const shake = t > 16.5 ? (t - 16.5) * 6 : 0
      const f = Math.floor(t * 60)
      T(plane, `translate(calc(-50% + ${(rnd(f) - 0.5) * shake}px),calc(-50% + ${(rnd(f + 7) - 0.5) * shake}px)) rotateX(52deg) rotateZ(${rz}deg) scale(${sc})`)
      const off = 260 * lt + 170 * lt * lt * lt
      cols.forEach(c => {
        const o = (off * c.v) % c.seq
        T(c.strip, `translateY(${c.dir < 0 ? -o : -c.seq + o}px)`)
      })
      T(mA, `translate(${-240 - lt * 560}px,${(1 - tw(t, 15.5, 0.45)) * 105}%)`)
      T(mB, `translate(${-1900 + lt * 520}px,${(1 - tw(t, 15.62, 0.45)) * 105}%)`)
      O(flash, t > 16.75 && t < 17 ? (Math.floor((t - 16.75) * 16) % 2 ? 0 : 0.12) : 0)
      const ci = Math.floor((t - 17.0) / 0.0625)
      V(cut, t >= 17.0)
      if (t >= 17.0) {
        const k = Math.min(7, ci), lp = (t - 17.0 - k * 0.0625) / 0.0625
        cutImgs.forEach((im, j) => { if (im) { V(im, j === k); if (j === k) T(im, `scale(${1.14 - 0.1 * lp})`) } })
        V(tint, k % 2 === 1 && k < 7)
        V(n277, k === 7)
        V(cword, k < 7); cword.textContent = WORDS[k % 4]
        T(cword, `scale(${1.1 - 0.1 * lp})`)
      }
    },
  }
})

// ─ breath: flash, then silence with a lone caret ───────────── 17.5 → 18.0
scene('breath', 17.5, 18.0, 9, root => {
  const caret = h('div', { cls: 'abs', css: `left:949px;top:461px;width:22px;height:158px;background:${C.blueHi}` }, root)
  return {
    render(t) {
      root.style.background = mix(C.paper, C.ink, tw(t, 17.5, 0.22))
      V(caret, t > 17.72 && Math.floor((t - 17.72) / 0.07) % 2 === 0)
    },
  }
})

// 08 ─ OUTRO ─────────────────────────────────────────────── 18.0 → 20.0
scene('outro', 18.0, 20.01, 10, root => {
  root.style.background = C.paper
  const vl = [], hl = []
  for (let i = 0; i <= 12; i++) vl.push(h('div', { cls: 'gl v', css: `left:${96 + i * 144}px;background:rgba(11,12,14,.07)` }, root))
  for (let j = 0; j <= 6; j++) hl.push(h('div', { cls: 'gl h', css: `top:${96 + j * 148}px;background:rgba(11,12,14,.07)` }, root))
  const wrap = h('div', { cls: 'fill', css: 'transform-origin:50% 50%' }, root)
  const name = h('div', { cls: 'abs disp', css: `left:0;right:0;top:360px;text-align:center;font-size:212px;font-weight:700;line-height:1;letter-spacing:-.045em;color:${C.ink};white-space:nowrap` }, wrap)
  const L = chars(name, 'JEAN HAUSER')
  const under = h('div', { cls: 'abs', css: `height:12px;background:${C.blue};transform-origin:0 50%` }, wrap)
  const caret = h('div', { cls: 'abs', css: `width:22px;height:158px;background:${C.blue}` }, wrap)
  const role = h('div', { cls: 'abs mono', css: 'left:0;right:0;top:640px;text-align:center;overflow:hidden;font-size:23px;letter-spacing:.26em;color:rgba(11,12,14,.72);white-space:pre', html: '<div>SENIOR PRODUCT OWNER · CYBERSECURITY PM · BUILDER</div>' }, wrap)
  const links = h('div', { cls: 'abs disp', css: 'left:0;right:0;top:716px;display:flex;justify-content:center;gap:34px;font-size:36px;font-weight:500;letter-spacing:-.01em;color:#111' }, wrap)
  const items = ['hauserjean.fr', 'github.com/BathmanTv', 'linkedin.com/in/hauserjean'].flatMap((s, j) => {
    const out = []
    if (j) out.push(h('span', { css: `display:inline-block;width:10px;height:10px;border-radius:50%;background:${C.blue};align-self:center` }, links))
    const m = h('span', { css: 'display:inline-block;overflow:hidden;padding-bottom:.1em' }, links)
    out.push(h('span', { css: 'display:inline-block', text: s }, m))
    return out
  })
  const fl = h('div', { cls: 'abs mono', css: 'left:56px;bottom:44px;font-size:15px;letter-spacing:.14em;color:rgba(11,12,14,.6)', text: 'SHOWREEL 2026 — MOTION · WEB · SECURITY' }, root)
  const fr = h('div', { cls: 'abs mono', css: 'right:56px;bottom:44px;font-size:15px;letter-spacing:.14em;color:rgba(11,12,14,.6)', text: 'REMOTE-FIRST · EU + APAC' }, root)
  let nm = { l: 0, r: 0 }
  return {
    layout() {
      const a = L[0].wrap, b = L[L.length - 1].wrap
      nm = { l: name.offsetLeft + a.offsetLeft, r: name.offsetLeft + b.offsetLeft + b.offsetWidth }
      under.style.cssText += `;left:${nm.l + 8}px;top:606px;width:${nm.r - nm.l - 8}px`
      caret.style.cssText += `;left:${nm.r + 16}px;top:386px`
    },
    render(t) {
      vl.forEach((l, i) => T(l, `scaleY(${tw(t, 18.0 + i * 0.012, 0.5)})`))
      hl.forEach((l, j) => T(l, `scaleX(${tw(t, 18.04 + j * 0.02, 0.5)})`))
      L.forEach((l, i) => {
        const p = tw(t, 18.0 + Math.abs(i - 5) * 0.024, 0.24)
        T(l.inner, `scale(${lerp(1.8, 1, p)})`)
        O(l.inner, clamp(p * 3))
        l.inner.style.filter = p < 1 ? `blur(${(1 - p) * 14}px)` : 'none'
      })
      T(under, `scaleX(${tw(t, 18.14, 0.5)})`)
      V(caret, t > 18.5 && ((t - 18.5) % 0.5) < 0.25)
      T(role.firstChild, `translateY(${(1 - tw(t, 18.26, 0.42)) * 110}%)`)
      let j = 0
      items.forEach(el => {
        if (el.parentNode === links) { T(el, `scale(${tw(t, 18.44 + j * 0.06, 0.3)})`); return }
        T(el, `translateY(${(1 - tw(t, 18.38 + j * 0.07, 0.42)) * 110}%)`); j++
      })
      O(fl, tw(t, 18.6, 0.4)); O(fr, tw(t, 18.66, 0.4))
      T(wrap, `scale(${lerp(1, 1.03, tw(t, 18.2, 1.8, E.io))})`)
    },
  }
})

// ───────────────────────── HUD + film grain ─────────────────────────
const hud = h('div', { cls: 'hud' }, stage)
;[['left:32px;top:32px', '2px 0 0 2px'], ['right:32px;top:32px', '2px 2px 0 0'], ['left:32px;bottom:32px', '0 0 2px 2px'], ['right:32px;bottom:32px', '0 2px 2px 0']]
  .forEach(([pos, bw]) => h('div', { cls: 'crop', css: `${pos};border-width:${bw}` }, hud))
const hudInfo = h('div', { cls: 'fill' }, hud)
h('div', { cls: 'abs', css: 'left:66px;top:46px', text: 'JEAN HAUSER — SHOWREEL ’26' }, hudInfo)
const tc = h('div', { cls: 'abs', css: 'right:66px;top:46px' }, hudInfo)
const sect = h('div', { cls: 'abs', css: 'left:66px;bottom:44px;white-space:pre' }, hudInfo)
const barBox = h('div', { cls: 'bar' }, hudInfo)
const barFill = h('i', {}, barBox)
h('div', { cls: 'abs', css: 'right:280px;bottom:44px', text: 'HAUSERJEAN.FR' }, hudInfo)
const SECTIONS = [
  [0, '00 / BOOT'], [2.0, '01 / MANIFESTO'], [4.0, '02 / DONATELLO — SECURITY'], [8.0, '03 / HAUUM — WEB'],
  [9.85, '04 / CHỢ VỈA HÈ — WEB'], [12.0, '05 / CAFÉ BÔNG — WEB'], [13.5, '06 / GIDEON — AGENTIC'],
  [14.45, '07 / PLANS & AMBIANCES — PWA'], [15.4, '08 / SELECTED WORK'],
]
function renderHud(t) {
  V(hudInfo, t < 18.0)
  const f = Math.floor(t * 60 + 1e-6)
  tc.textContent = `00:00:${String(Math.floor(f / 60)).padStart(2, '0')}:${String(f % 60).padStart(2, '0')}`
  let s = SECTIONS[0]
  for (const x of SECTIONS) if (t >= x[0]) s = x
  sect.textContent = scramble(s[1], clamp((t - s[0]) / 0.22), t, s[0] * 10)
  barFill.style.width = (clamp(t / DUR) * 100) + '%'
}
const grain = h('canvas', { cls: 'grain' }, stage)
grain.width = 960; grain.height = 540
const gctx = grain.getContext('2d')
const noise = Array.from({ length: 8 }, (_, k) => {
  const d = gctx.createImageData(960, 540)
  let s = 1234567 + k * 7919
  for (let i = 0; i < d.data.length; i += 4) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const v = 128 + ((s >> 8) % 96) - 48
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255
  }
  return d
})
h('div', { cls: 'vignette' }, stage)

function renderFrame(t) {
  for (const sc of scenes) {
    const on = t >= sc.t0 && t < sc.t1
    if (on !== sc.on) { sc.root.style.display = on ? 'block' : 'none'; sc.on = on }
    if (on) sc.render(t)
  }
  renderHud(t)
  gctx.putImageData(noise[Math.floor(t * 60 + 1e-6) % 8], 0, 0)
}

// ───────────────────────── boot ─────────────────────────
window.__ready = (async () => {
  const faces = ['700 100px "Space Grotesk"', '300 100px "Space Grotesk"', '500 20px "JetBrains Mono"', '400 20px Inter', '600 20px Inter',
    '500 100px Fraunces', 'italic 500 100px Fraunces', '600 100px Lora', '600 40px "Dancing Script"']
  await Promise.all(faces.map(f => document.fonts.load(f, 'Chợ Vỉa Hè Bông ABC 0123')))
  await document.fonts.ready
  await Promise.all(imgs.map(im => (im.decode ? im.decode() : Promise.resolve()).catch(() => {})))
  for (const sc of scenes) { sc.root.style.display = 'block'; sc.root.style.visibility = 'hidden' }
  for (const sc of scenes) sc.layout()
  for (const sc of scenes) { sc.root.style.display = 'none'; sc.root.style.visibility = ''; sc.on = false }
  renderFrame(0)
  return true
})()
window.renderFrame = renderFrame
window.DURATION = DUR

// live preview when opened directly in a browser
if (!q.has('render')) {
  const fit = () => { const s = Math.min(innerWidth / W, innerHeight / H); stage.style.transform = `translate(${(innerWidth - W * s) / 2}px,${(innerHeight - H * s) / 2}px) scale(${s})` }
  addEventListener('resize', fit); fit()
  window.__ready.then(() => {
    const audio = new Audio('out/soundtrack.wav')
    let t0 = performance.now() / 1000 - (+q.get('t') || 0), paused = q.has('t'), pt = +q.get('t') || 0
    const now = () => (paused ? pt : (performance.now() / 1000 - t0) % DUR)
    addEventListener('keydown', e => {
      if (e.code === 'Space') { if (paused) { t0 = performance.now() / 1000 - pt; audio.currentTime = pt; audio.play().catch(() => {}) } else { pt = now(); audio.pause() } paused = !paused }
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { pt = clamp(now() + (e.code === 'ArrowRight' ? 1 / 60 : -1 / 60), 0, DUR - 1e-3); paused = true; audio.pause() }
    })
    if (!paused) audio.play().catch(() => {})
    const loop = () => { const t = now(); if (!paused && audio.paused === false && Math.abs(audio.currentTime - t) > 0.08) audio.currentTime = t; renderFrame(t); requestAnimationFrame(loop) }
    loop()
  })
}
})()
