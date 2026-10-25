import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/scroll'
import { Sigil } from '../components/Sigil'

/** K5 — newsletter ; le sigil se regrave et le NOCTIS géant monte en parallaxe. */
export function Rejoindre() {
  const root = useRef<HTMLElement>(null)
  const [sent, setSent] = useState(false)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.rejoindre__giant', { yPercent: 40 }, {
        yPercent: 0,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom bottom', scrub: true },
      })
      gsap.timeline({ scrollTrigger: { trigger: root.current, start: 'top 60%', onEnter: () => setDrawn(true) } })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} className="rejoindre">
      <Sigil size={200} draw={drawn} accent={sent} className="rejoindre__sigil" />
      <h2 className="t-display-l">Rejoindre la nuit</h2>
      <p className="t-body-l rejoindre__sub">
        Les nouvelles pièces sortent la nuit, en séries numérotées. Recevez l'heure de la prochaine fonte.
      </p>
      <form
        className="rejoindre__form"
        onSubmit={(e) => {
          e.preventDefault()
          setSent(true)
        }}
      >
        <label htmlFor="email" className="visually-hidden">
          E-mail
        </label>
        <input id="email" type="email" required placeholder="votre@email.com" className="rejoindre__input" />
        <button className="btn btn--primary" type="submit">
          {sent ? 'Vous êtes des nôtres' : "S'inscrire"}
        </button>
      </form>
      <p className="rejoindre__giant t-display-xl" aria-hidden="true">
        NOCTIS
      </p>
      <footer className="footer">
        <p className="t-label-s">© 2026 NOCTIS · Projet portfolio</p>
        <nav className="footer__nav" aria-label="Pied de page">
          {['Instagram', 'Mentions légales', 'CGV', 'Contact'].map((l) => (
            <a key={l} href="#" className="t-label-s">
              {l}
            </a>
          ))}
        </nav>
      </footer>
    </section>
  )
}
