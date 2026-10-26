import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, sceneState, prefersReducedMotion } from '../lib/scroll'
import { Button } from '../components/Button'

export function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null)
  const bgWord = useRef<HTMLParagraphElement>(null)

  // Progression du hero → la bague 3D recule (lue dans useFrame) puis s'efface.
  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        sceneState.hero = self.progress
        const fade = String(1 - Math.max(0, (self.progress - 0.55) / 0.45))
        document.querySelectorAll<HTMLElement>('.ring-canvas, .ring-vignette').forEach((el) => (el.style.opacity = fade))
        if (bgWord.current) bgWord.current.style.opacity = String(0.07 * Number(fade))
      },
    })
    return () => st.kill()
  }, [])

  // Le mot NOCTIS géant part à l'inverse du pointeur (parallaxe).
  useEffect(() => {
    if (prefersReducedMotion() || !bgWord.current) return
    const x = gsap.quickTo(bgWord.current, 'x', { duration: 1.2, ease: 'power3.out' })
    const y = gsap.quickTo(bgWord.current, 'y', { duration: 1.2, ease: 'power3.out' })
    const onMove = (e: PointerEvent) => {
      x(-(e.clientX / window.innerWidth - 0.5) * 40)
      y(-(e.clientY / window.innerHeight - 0.5) * 24)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  // Entrée après le chargement : la bague sort du noir, titre révélé ligne par ligne.
  useEffect(() => {
    if (!ready) return
    if (prefersReducedMotion()) {
      sceneState.intro = 1
      return
    }
    const ctx = gsap.context(() => {
      gsap.fromTo(sceneState, { intro: 0 }, { intro: 1, duration: 2.4, ease: 'power2.inOut' })
      gsap.from('.hero__line > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.6 })
      gsap.from('.hero__side, .hero__cta', { opacity: 0, y: 12, duration: 1.2, ease: 'expo.out', delay: 1.1, stagger: 0.08 })
      gsap.from(bgWord.current, { opacity: 0, duration: 2.4, ease: 'power2.out' })
    }, root)
    return () => ctx.revert()
  }, [ready])

  return (
    <section ref={root} className="hero" aria-label="NOCTIS — Couronne I">
      <p ref={bgWord} className="hero__bg-word t-display-xl" aria-hidden="true">
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
        <Button href="#collection" cursor="Voir">
          Découvrir Couronne I
        </Button>
        <p className="t-label-s">Défiler pour réveiller la relique ↓</p>
      </div>
    </section>
  )
}
