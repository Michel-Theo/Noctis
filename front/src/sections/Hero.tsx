import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, sceneState } from '../lib/scroll'

export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)

  // Progression du hero → la bague 3D recule (lue dans useFrame).
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        sceneState.hero = self.progress
        // La bague 3D s'efface en fin de hero : la vue éclatée (vidéo) prend le relais.
        const canvas = document.querySelector<HTMLElement>('.ring-canvas')
        if (canvas) canvas.style.opacity = String(1 - Math.max(0, (self.progress - 0.55) / 0.45))
      },
    })
    return () => st.kill()
  }, [])

  // Titre révélé ligne par ligne après le chargement.
  useEffect(() => {
    if (!ready) return
    const ctx = gsap.context(() => {
      gsap.from('.hero__line > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.2 })
      gsap.from('.hero__side, .hero__cta', { opacity: 0, y: 12, duration: 1, ease: 'expo.out', delay: 0.7, stagger: 0.1 })
      gsap.from('.hero__bg-word', { opacity: 0, duration: 2.4, ease: 'power2.out' })
    }, root)
    return () => ctx.revert()
  }, [ready])

  return (
    <section ref={root} className="hero" aria-label="NOCTIS — Couronne I">
      <p className="hero__bg-word t-display-xl" aria-hidden="true">
        NOCTIS
      </p>
      <h1 className="hero__title t-h1">
        <span className="hero__line">
          <span>Forgée pour ceux</span>
        </span>
        <span className="hero__line">
          <span>qui marchent la nuit.</span>
        </span>
      </h1>
      <p className="hero__side t-label-s">N° 001 — Couronne I</p>
      <div className="hero__cta">
        <a href="#collection" className="btn btn--primary" data-cursor="Voir">
          Découvrir Couronne I
        </a>
        <p className="t-label-s">Défiler pour réveiller la relique ↓</p>
      </div>
    </section>
  )
}
