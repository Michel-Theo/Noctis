import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { Sigil } from './Sigil'
import { gsap, prefersReducedMotion } from '../lib/scroll'

/**
 * K0 — le sigil se trace pendant que le modèle 3D se charge (progression réelle).
 * Sortie : le sigil file vers sa place dans la nav (FLIP) et le fond s'ouvre en iris sur la scène.
 */
export function Loader({ onDone }: { onDone: () => void }) {
  const { progress, active } = useProgress()
  const [shown, setShown] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const leaving = shown >= 100

  // Le compteur rattrape la progression réelle sans jamais reculer.
  useEffect(() => {
    let raf = 0
    const step = () => {
      setShown((v) => {
        const target = active ? Math.min(progress, 99) : 100
        return v < target ? Math.min(target, v + Math.max(1, (target - v) * 0.08)) : v
      })
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [progress, active])

  useEffect(() => {
    const el = root.current
    if (!leaving || !el) return
    if (prefersReducedMotion()) {
      const t = setTimeout(onDone, 300)
      return () => clearTimeout(t)
    }
    const sigil = el.querySelector<SVGSVGElement>('.sigil')!
    const target = document.querySelector<SVGSVGElement>('.header__logo .sigil')
    const from = sigil.getBoundingClientRect()
    const to = target?.getBoundingClientRect()
    const tl = gsap.timeline({ delay: 0.5, onComplete: onDone })
    tl.to(el.querySelectorAll('.loader__count, .loader__caption, .loader__bar'), { opacity: 0, duration: 0.4, ease: 'power2.in' })
    if (to) {
      tl.to(
        sigil,
        {
          x: to.left + to.width / 2 - (from.left + from.width / 2),
          y: to.top + to.height / 2 - (from.top + from.height / 2),
          scale: to.width / from.width,
          duration: 0.9,
          ease: 'expo.inOut',
        },
        0.2,
      )
    }
    tl.to(el, { '--hole': '150vmax', duration: 1.1, ease: 'expo.in' }, 0.45)
    return () => {
      tl.kill()
    }
  }, [leaving, onDone])

  const value = Math.floor(shown)
  return (
    <div ref={root} className="loader" role="status" aria-live="polite">
      <Sigil size={140} draw accent />
      <p className="loader__count t-display-l">{String(value).padStart(3, '0')}</p>
      <p className="loader__caption t-label-s">Réveil de la relique</p>
      <div className="loader__bar" style={{ transform: `scaleX(${shown / 100})` }} />
      <span className="visually-hidden">Chargement {value} %</span>
    </div>
  )
}
