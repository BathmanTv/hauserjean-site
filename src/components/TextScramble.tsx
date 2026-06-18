import { useEffect, useRef, useState } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!<>-_/\\*'

interface Props {
  text: string
  className?: string
  as?: 'span' | 'h1' | 'h2'
  delay?: number   // ms before starting
  duration?: number // ms total
}

// Scramble-in effect (faithful to motion-primitives/text-scramble): characters
// flicker through random glyphs then lock in left-to-right. Re-runs when text
// changes (e.g. FR/EN toggle). Respects prefers-reduced-motion.
export default function TextScramble({ text, className, as = 'span', delay = 0, duration = 700 }: Props) {
  const [display, setDisplay] = useState(text)
  const raf = useRef<number>(0)

  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) { setDisplay(text); return }

    const start = performance.now() + delay
    const len = text.length
    const tick = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - start) / duration))
      const revealed = Math.floor(p * len)
      let out = ''
      for (let i = 0; i < len; i++) {
        const ch = text[i]
        if (ch === ' ') { out += ' '; continue }
        out += i < revealed ? ch : CHARS[Math.floor(Math.random() * CHARS.length)]
      }
      setDisplay(out)
      if (p < 1) raf.current = requestAnimationFrame(tick)
      else setDisplay(text)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [text, delay, duration])

  const Tag = as
  return <Tag className={className}>{display}</Tag>
}
