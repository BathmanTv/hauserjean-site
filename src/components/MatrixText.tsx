import { useEffect, useMemo, useRef, useState } from 'react'

interface Props {
  text: string
  className?: string
  as?: 'span' | 'h1' | 'h2'
  initialDelay?: number          // ms before this segment starts
  letterAnimationDuration?: number // ms each letter stays in the matrix blip
  letterInterval?: number        // ms stagger between letters
}

const rand = () => (Math.random() > 0.5 ? '1' : '0')

type Token = { word: { c: string; i: number }[] } | { space: true }

// Matrix-text (adapted from kokonutd/matrix-text): each letter blips through a
// random 0/1 glyph in sequence, then settles to the real character.
//
// Adaptations for this site:
// - keeps the Swiss display font instead of forcing monospace (kokonutd's
//   w-[1ch] would wrap the long FR/EN hero lines badly);
// - reserves each glyph's slot at exactly the final char's width via an
//   invisible sizer, so the swap never reflows (fixes the load-time jump) and
//   the settled headline stays tight;
// - because a digit is wider than most letters in this font, the blip glyph is
//   horizontally scaled (measured per-char) to fit its slot — so a 0/1 over a
//   thin letter (i, l, t…) can never overflow and overlap its neighbour;
// - blips in the site accent rather than neon green.
// Respects prefers-reduced-motion and stays screen-reader friendly.
export default function MatrixText({
  text,
  className,
  as = 'span',
  initialDelay = 120,
  letterAnimationDuration = 380,
  letterInterval = 32,
}: Props) {
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const finals = useMemo(() => [...text], [text])
  const [anim, setAnim] = useState<Record<number, { g: string; m: boolean }>>({})
  const [scale, setScale] = useState<Record<number, number>>({})
  const rootRef = useRef<HTMLElement>(null)

  // group characters into words (with global indices) + breakable space tokens
  const tokens = useMemo<Token[]>(() => {
    const out: Token[] = []
    let w: { c: string; i: number }[] = []
    finals.forEach((c, i) => {
      if (c === ' ') {
        if (w.length) { out.push({ word: w }); w = [] }
        out.push({ space: true })
      } else {
        w.push({ c, i })
      }
    })
    if (w.length) out.push({ word: w })
    return out
  }, [finals])

  // schedule blip timeouts (reset happens via key={text} remount in the parent)
  useEffect(() => {
    if (reduced) return
    const ids: number[] = []
    finals.forEach((c, i) => {
      if (c === ' ') return
      const start = initialDelay + i * letterInterval
      ids.push(window.setTimeout(() => setAnim((p) => ({ ...p, [i]: { g: rand(), m: true } })), start))
      ids.push(window.setTimeout(() => setAnim((p) => ({ ...p, [i]: { g: c, m: false } })), start + letterAnimationDuration))
    })
    return () => ids.forEach(clearTimeout)
  }, [text, reduced, initialDelay, letterAnimationDuration, letterInterval, finals])

  // measure each slot vs a digit and store the scaleX that makes a 0/1 fit it.
  // runs after layout and again once webfonts are ready (metrics change on swap).
  useEffect(() => {
    if (reduced) return
    const el = rootRef.current
    if (!el) return
    let alive = true
    const measure = () => {
      if (!alive || !rootRef.current) return
      const probe = rootRef.current.querySelector('[data-probe]') as HTMLElement | null
      const zeroW = probe?.getBoundingClientRect().width ?? 0
      if (!zeroW) return
      const next: Record<number, number> = {}
      rootRef.current.querySelectorAll<HTMLElement>('[data-sizer]').forEach((s) => {
        const i = Number(s.dataset.sizer)
        next[i] = Math.min(1, s.getBoundingClientRect().width / zeroW)
      })
      setScale(next)
    }
    measure()
    let cancelled = false
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => { if (!cancelled) measure() })
    }
    return () => { alive = false; cancelled = true }
  }, [text, reduced, finals])

  const Tag = as
  if (reduced) return <Tag className={className}>{text}</Tag>

  return (
    <Tag ref={rootRef as never} className={className} aria-label={text}>
      {/* hidden probe: width of a digit in this exact font/size, for the scale calc */}
      <span data-probe aria-hidden="true" style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}>0</span>
      {tokens.map((tok, ti) =>
        'space' in tok ? (
          ' '
        ) : (
          <span key={ti} className="inline-block" style={{ whiteSpace: 'nowrap' }}>
            {tok.word.map(({ c, i }) => {
              const a = anim[i]
              const glyph = a ? a.g : c
              const matrix = a ? a.m : false
              return (
                <span key={i} aria-hidden="true" className="relative inline-block text-center">
                  {/* sizer keeps the slot at exactly the final char's width */}
                  <span data-sizer={i} style={{ visibility: 'hidden' }}>{c}</span>
                  {/* blip glyph centered + scaled to fit the slot → no overflow, no overlap */}
                  <span
                    className="absolute inset-x-0 top-0"
                    style={{
                      color: matrix ? '#1D4ED8' : 'inherit',
                      transform: matrix ? `scaleX(${scale[i] ?? 0.62})` : undefined,
                      transformOrigin: 'center',
                      transition: 'color 120ms linear',
                    }}
                  >
                    {glyph}
                  </span>
                </span>
              )
            })}
          </span>
        ),
      )}
    </Tag>
  )
}
