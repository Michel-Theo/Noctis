import { useEffect } from 'react'
import { gsap, prefersReducedMotion } from './scroll'

/**
 * Apparitions des pages vitrine : l'intro (.intro > *) monte en cascade au chargement,
 * chaque élément .reveal monte quand il entre dans l'écran.
 */
export function useReveal(root: React.RefObject<HTMLElement | null>, key?: unknown) {
  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('.intro > *', { opacity: 0, y: 24, duration: 1.2, ease: 'expo.out', stagger: 0.07, delay: 0.25 })
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.from(el, { opacity: 0, y: 32, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } })
      })
    }, root)
    return () => ctx.revert()
  }, [root, key])
}
