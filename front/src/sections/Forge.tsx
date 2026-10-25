import { useEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import { ScrubVideo } from '../components/ScrubVideo'

const MANIFESTE = 'Nous ne fabriquons pas des bagues. Nous forgeons des reliques pour ceux qui veillent.'
const STEPS = [
  ['01', 'Sculpture 3D', 'Chaque lame est modélisée puis assemblée autour du poignard.'],
  ['02', 'Fonte à cire perdue', 'Impression en résine, puis coulée en argent 925 massif.'],
  ['03', 'Polissage & rhodiage', 'Polie à la main, scellée au rhodium : elle ne noircira pas.'],
]

/** K3 — manifeste révélé mot par mot ; la bague passe du fil de fer au métal. */
export function Forge() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.forge__word',
        { opacity: 0.15 },
        {
          opacity: 1,
          stagger: 0.05,
          ease: 'none',
          scrollTrigger: { trigger: '.forge__manifeste', start: 'top 80%', end: 'bottom 40%', scrub: true },
        },
      )
      gsap.utils.toArray<HTMLElement>('.forge__step').forEach((el) => {
        gsap.from(el, { opacity: 0, y: 24, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} id="atelier" className="forge">
      <div className="forge__sticky">
        <div className="forge__media">
          <ScrubVideo
            src="/video/couronne-i_forge_nuit.mp4"
            poster="/img/couronne-i_forge_nuit.png"
            trigger={root}
            label="La bague passe du fil de fer au métal"
          />
        </div>
        <div className="forge__text">
          <p className="t-label t-accent">03 / 05</p>
          <p className="forge__manifeste t-h1">
            {MANIFESTE.split(' ').map((w, i) => (
              <span key={i} className="forge__word">
                {w}{' '}
              </span>
            ))}
          </p>
          <ol className="forge__steps">
            {STEPS.map(([n, t, d]) => (
              <li key={n} className="forge__step">
                <span className="t-display-l forge__num">{n}</span>
                <span className="t-h3">{t}</span>
                <span className="t-label-s">{d}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
