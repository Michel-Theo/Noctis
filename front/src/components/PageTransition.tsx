import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, ScrollTrigger, prefersReducedMotion, scrollToTop } from '../lib/scroll'
import { Sigil } from './Sigil'
import { hasCardRect } from '../lib/transition'

/**
 * Changement de page : le rideau noir couvre l'écran, le sigil se dessine, puis le rideau
 * remonte sur la nouvelle page. Ignoré au premier chargement (le chargeur s'en occupe).
 */
export function PageTransition() {
  const { pathname } = useLocation()
  const curtain = useRef<HTMLDivElement>(null)
  const first = useRef(true)
  const prev = useRef(pathname)

  useLayoutEffect(() => {
    if (!window.location.hash) scrollToTop()
    if (first.current) {
      first.current = false
      return
    }
    requestAnimationFrame(() => ScrollTrigger.refresh())
    // Entre deux étapes du tunnel : simple fondu de la page (CSS), pas de rideau.
    const inCheckout = prev.current.startsWith('/commande') && pathname.startsWith('/commande')
    prev.current = pathname
    if (inCheckout) return
    const el = curtain.current
    // Depuis une carte, c'est l'agrandissement de la carte (FLIP) qui fait la transition.
    if (!el || prefersReducedMotion() || hasCardRect()) return
    const sigil = el.querySelector('.sigil')
    sigil?.classList.remove('sigil--draw')
    void (sigil as SVGElement | null)?.getBoundingClientRect()
    sigil?.classList.add('sigil--draw')
    const tl = gsap.timeline()
    tl.set(el, { yPercent: 0, autoAlpha: 1 })
      .to({}, { duration: 0.5 })
      .to(el, { yPercent: -100, duration: 0.8, ease: 'expo.inOut' })
      .set(el, { autoAlpha: 0 })
    return () => {
      tl.kill()
    }
  }, [pathname])

  return (
    <div ref={curtain} className="curtain" aria-hidden="true">
      <Sigil size={96} />
    </div>
  )
}
