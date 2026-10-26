import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/scroll'
import { Sigil } from '../components/Sigil'
import { Button } from '../components/Button'
import { ScrambleLink } from '../components/ScrambleLink'

/** K5 — newsletter ; le sigil se regrave et le NOCTIS géant monte en parallaxe. */
export function Rejoindre() {
  const root = useRef<HTMLElement>(null)
  const [sent, setSent] = useState(false)
  const [drawn, setDrawn] = useState(false)
  const [theme, setTheme] = useState<'nuit' | 'os'>('nuit')

  useEffect(() => {
    const st = ScrollTrigger.create({ trigger: root.current, start: 'top 60%', once: true, onEnter: () => setDrawn(true) })
    if (prefersReducedMotion()) return () => st.kill()
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.rejoindre__giant',
        { yPercent: 40 },
        {
          yPercent: 0,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom bottom', scrub: true },
        },
      )
      gsap.from('.rejoindre > h2, .rejoindre__sub, .rejoindre__form', {
        opacity: 0,
        y: 24,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: 'top 55%' },
      })
    }, root)
    return () => {
      st.kill()
      ctx.revert()
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'nuit' ? 'os' : 'nuit'
    document.documentElement.dataset.theme = next
    setTheme(next)
  }

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
        <Button type="submit">{sent ? 'Vous êtes des nôtres' : "S'inscrire"}</Button>
      </form>
      <p className="rejoindre__giant t-display-xl" aria-hidden="true">
        NOCTIS
      </p>
      <footer className="footer">
        <p className="t-label-s">© 2026 NOCTIS · Projet portfolio</p>
        <nav className="footer__nav" aria-label="Pied de page">
          {['Instagram', 'Mentions légales', 'CGV', 'Contact'].map((l) => (
            <ScrambleLink key={l}>{l}</ScrambleLink>
          ))}
          <button className="t-label-s footer__theme" onClick={toggleTheme} aria-pressed={theme === 'os'}>
            Thème : {theme === 'nuit' ? 'Nuit' : 'Os'}
          </button>
        </nav>
      </footer>
    </section>
  )
}
