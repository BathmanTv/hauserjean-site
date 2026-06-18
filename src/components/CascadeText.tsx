interface Props { text: string; className?: string; stagger?: number }

// Cascade-on-hover (faithful to aayush-duhan/cascade-text): each character lifts
// and shifts to the accent color with a staggered delay when the text is hovered.
export default function CascadeText({ text, className = '', stagger = 28 }: Props) {
  return (
    <span className={`group inline-flex flex-wrap ${className}`}>
      {text.split('').map((c, i) => (
        <span
          key={i}
          className="inline-block transition-[transform,color] duration-300 ease-out group-hover:-translate-y-1.5 group-hover:text-accent"
          style={{ transitionDelay: `${i * stagger}ms` }}
        >
          {c === ' ' ? ' ' : c}
        </span>
      ))}
    </span>
  )
}
