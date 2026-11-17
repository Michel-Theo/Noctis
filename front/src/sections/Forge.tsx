import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/scroll'
import { ScrollSequence } from '../components/ScrollSequence'
import { useTheme } from '../lib/theme'

const MANIFESTE = ['Nous ne fabriquons pas des bagues.', 'Nous forgeons des reliques', 'pour ceux qui veillent.']
const STEPS = [
  ['01', 'Sculpture 3D', 'Chaque lame est modélisée puis assemblée autour du poignard.'],
  ['02', 'Fonte à cire perdue', 'Impression en résine, puis coulée en argent 925 massif.'],
  ['03', 'Polissage & rhodiage', 'Polie à la main, scellée au rhodium : elle ne noircira pas.'],
]

/**
 * K3 — manifeste révélé mot par mot ; la bague recule en fond et passe du fil de fer au métal
 * pendant que les trois étapes se lisent l'une après l'autre (section pinnée).
 */
export function Forge() {
  const theme = useTheme()
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const mm = gsap.matchMedia(root)
    mm.add({ mobile: '(max-width: 800px)', desktop: '(min-width: 801px)' }, (c) => {
      const mobile = c.conditions?.mobile
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 1 },
        defaults: { ease: 'power3.inOut' },
      })
      tl.fromTo('.forge__word', { opacity: 0.15 }, { opacity: 1, stagger: 0.02, duration: 0.1, ease: 'none' })
      const steps = gsap.utils.toArray<HTMLElement>('.forge__step')
      steps.forEach((step, i) => {
        const num = step.querySelector('.forge__num')
        tl.fromTo(step, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.12 })
          // Le numéro s'allume brièvement en rouge puis retombe en cendre.
          .fromTo(num, { color: 'var(--color-text-accent)' }, { color: 'var(--color-text-secondary)', duration: 0.12 })
          .to({}, { duration: 0.1 })
        // Mobile : les étapes sont superposées, chacune s'efface avant la suivante (la dernière reste).
        if (mobile && i < steps.length - 1) tl.to(step, { opacity: 0, y: -16, duration: 0.08 })
      })
    })
    return () => mm.revert()
  }, [])

  return (
    <section ref={root} id="atelier" className="forge">
      <div className="forge__sticky">
        <div className="forge__media" aria-hidden="true">
          <ScrollSequence
            dir={`/seq/forge_${theme}`}
            count={160}
            width={720}
            height={960}
            poster={theme === 'os' ? '/img/forge_poster_os.webp' : '/img/forge_poster.webp'}
            trigger={root}
            label="La bague passe du fil de fer au métal"
          />
        </div>
        <div className="forge__head">
          <p className="t-label t-accent">03 / 05</p>
          <p className="forge__manifeste t-h1">
            {MANIFESTE.map((line, li) => (
              <span key={li} className="forge__line">
                {line.split(' ').map((w, i) => (
                  <span key={i} className="forge__word">
                    {w}{' '}
                  </span>
                ))}
              </span>
            ))}
          </p>
        </div>
        <ol className="forge__steps">
          {STEPS.map(([n, t, d]) => (
            <li key={n} className="forge__step">
              <span className="t-display-l forge__num">{n}</span>
              <span className="t-h3">{t}</span>
              <span className="forge__desc">{d}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
