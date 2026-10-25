import { useEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import { ScrubVideo } from '../components/ScrubVideo'

const PARTS = [
  ['01', 'Poignard', 'pièce centrale, 9 mm'],
  ['02', 'Griffes ×4', 'lames en crochet'],
  ['03', 'Anneau', 'Ø intérieur 18 mm · taille 57'],
  ['04', 'Argent 925', 'rhodié, imprimé puis coulé'],
]

/** K2 — la bague s'ouvre en vue éclatée au fil du scroll (vidéo Blender pilotée). */
export function Anatomie() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.anatomie__part', {
        opacity: 0,
        x: 24,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.anatomie__parts', start: 'top 75%', end: 'bottom 60%', scrub: 1 },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} id="anatomie" className="anatomie">
      <div className="anatomie__sticky">
        <div className="anatomie__media">
          <ScrubVideo
            src="/video/couronne-i_eclatee_nuit.mp4"
            poster="/img/couronne-i_eclatee_nuit.png"
            trigger={root}
            label="Vue éclatée de la bague Couronne I"
          />
        </div>
        <div className="anatomie__text">
          <p className="t-label t-accent">02 / 05</p>
          <h2 className="t-h1">
            Anatomie
            <br />
            d'une relique
          </h2>
          <p className="t-body-l">
            Vingt-six lames sculptées une à une, assemblées autour d'un poignard central. Rien n'est symétrique par
            hasard.
          </p>
          <ul className="anatomie__parts">
            {PARTS.map(([n, t, d]) => (
              <li key={n} className="anatomie__part">
                <span className="t-label">
                  {n} · {t}
                </span>
                <span className="t-label-s">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
