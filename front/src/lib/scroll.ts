import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** État partagé entre le DOM (ScrollTrigger) et la scène 3D (useFrame). */
export const sceneState = {
  /** 0 → 1 au chargement : la bague sort du noir, la lumière rasante la balaie. */
  intro: 0,
  /** 0 → 1 pendant le hero : la bague recule et pivote. */
  hero: 0,
  /** Pointeur normalisé (-1 → 1), lissé côté 3D. */
  pointer: { x: 0, y: 0 },
}

let lenisInstance: Lenis | null = null

/** Remonte en haut de page instantanément (changement de page). */
export function scrollToTop() {
  if (lenisInstance) lenisInstance.scrollTo(0, { immediate: true, force: true })
  else window.scrollTo(0, 0)
}

/** Défilement doux Lenis branché sur le ticker GSAP (une seule boucle d'animation). */
export function useSmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return

    const lenis = new Lenis({ lerp: 0.1 })
    lenisInstance = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      lenisInstance = null
    }
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      sceneState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      sceneState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])
}

export { gsap, ScrollTrigger }
