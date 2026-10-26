import { useRef } from 'react'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#*+'

/** Lien du pied de page : brouillage des lettres au survol (0,3 s). */
export function ScrambleLink({ children, href = '#' }: { children: string; href?: string }) {
  const el = useRef<HTMLAnchorElement>(null)
  const raf = useRef(0)

  const scramble = () => {
    const node = el.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    cancelAnimationFrame(raf.current)
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 300)
      const fixed = Math.floor(p * children.length)
      node.textContent = children
        .split('')
        .map((c, i) => (i < fixed || c === ' ' ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
        .join('')
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }

  return (
    <a ref={el} href={href} className="t-label-s" onMouseEnter={scramble} aria-label={children}>
      {children}
    </a>
  )
}
