import { useRef, type ReactNode } from 'react'

interface Props { children: ReactNode; href: string; className?: string; strength?: number }

// Magnetic pull (faithful to kokonutd/magnetize-button): the button eases toward
// the cursor while hovered, springs back on leave. Disabled for reduced-motion.
export default function MagneticButton({ children, href, className = '', strength = 0.4 }: Props) {
  const ref = useRef<HTMLAnchorElement>(null)
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  function onMove(e: React.MouseEvent) {
    if (reduced || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = e.clientX - (r.left + r.width / 2)
    const y = e.clientY - (r.top + r.height / 2)
    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`
  }
  function onLeave() { if (ref.current) ref.current.style.transform = '' }

  return (
    <a ref={ref} href={href} onMouseMove={onMove} onMouseLeave={onLeave}
      className={`transition-transform duration-200 ease-out will-change-transform ${className}`}>
      {children}
    </a>
  )
}
