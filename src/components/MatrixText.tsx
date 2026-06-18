import { useEffect, useMemo, useState } from 'react'

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
// random 0/1 glyph in sequence, then settles to the real character. Adaptations
// for this site: keeps the proportional display font instead of forcing
// monospace (so the long French/English hero lines don't wrap badly), reserves
// each glyph's width with an invisible sizer so the swap never reflows (fixes
// the load-time layout jump), groups chars into per-word nowrap spans so line
// breaks only happen at spaces (no mid-word splits), and blips in the site
// accent rather than neon green. Respects prefers-reduced-motion + a11y.
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

  // reset happens via `key={text}` remount in the parent (see App hero), so the
  // effect only schedules the blip timeouts — no setState-in-effect reset needed.
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

  const Tag = as
  if (reduced) return <Tag className={className}>{text}</Tag>

  return (
    <Tag className={className} aria-label={text}>
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
                <span key={i} aria-hidden="true" className="relative inline-block">
                  {/* invisible sizer reserves the final char's width → swap never reflows */}
                  <span style={{ visibility: 'hidden' }}>{c}</span>
                  <span
                    className="absolute left-0 top-0"
                    style={{ color: matrix ? '#1D4ED8' : 'inherit', transition: 'color 120ms linear' }}
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
