import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from './scroll'

/** Valeur qui « recompte » jusqu'à sa nouvelle cible (totaux du panier). */
export function useCountUp(value: number, duration = 0.6) {
  const [shown, setShown] = useState(value)
  const obj = useRef({ v: value })

  useEffect(() => {
    if (prefersReducedMotion()) {
      obj.current.v = value
      const id = requestAnimationFrame(() => setShown(value))
      return () => cancelAnimationFrame(id)
    }
    const tw = gsap.to(obj.current, {
      v: value,
      duration,
      ease: 'power2.out',
      onUpdate: () => setShown(Math.round(obj.current.v)),
    })
    return () => {
      tw.kill()
    }
  }, [value, duration])

  return shown
}
