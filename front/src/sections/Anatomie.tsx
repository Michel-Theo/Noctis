import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/scroll'
import { ScrubVideo } from '../components/ScrubVideo'

/**
 * Repères posés sur la vue éclatée : point (x, y) sur la pièce → légende (lx, ly),
 * en % du cadre de la vidéo (relevés sur l'image la plus ouverte, frame 88).
 */
const CALLOUTS = [
  // Légendes rangées dans l'ordre vertical des points : les traits ne se croisent pas.
  { n: '04', t: 'Argent 925', d: 'rhodié, imprimé puis coulé', x: 53, y: 18, lx: 106, ly: 20 },
  { n: '03', t: 'Anneau', d: 'Ø intérieur 18 mm · taille 57', x: 34, y: 44, lx: 106, ly: 38 },
  { n: '01', t: 'Poignard', d: 'pièce centrale, 9 mm', x: 66, y: 50, lx: 106, ly: 56 },
  { n: '02', t: 'Griffes ×4', d: 'lames en crochet', x: 61, y: 82, lx: 106, ly: 74 },
]

/** K2 — la bague s'ouvre en vue éclatée au fil du scroll ; les repères se tracent vers leurs légendes. */
export function Anatomie() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.anatomie__text > *', {
        opacity: 0,
        y: 24,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: 'top 60%' },
      })
      if (prefersReducedMotion()) return
      // Les repères apparaissent quand la bague est ouverte, puis disparaissent quand elle se referme.
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 1 },
      })
      tl.set('.callout', { opacity: 0 })
        .to({}, { duration: 0.3 })
        .to('.callout', { opacity: 1, duration: 0.01 })
        .fromTo('.callout__dot', { scale: 0 }, { scale: 1, stagger: 0.03, duration: 0.05 })
        .fromTo('.callout__line', { strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: 0.03, duration: 0.08 }, '<')
        .fromTo('.callout__label', { opacity: 0, x: -8 }, { opacity: 1, x: 0, stagger: 0.03, duration: 0.06 }, '<0.04')
        .to({}, { duration: 0.25 })
        .to('.callout', { opacity: 0, duration: 0.08 })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} id="anatomie" className="anatomie">
      <div className="anatomie__sticky">
        <div className="anatomie__media">
          <div className="anatomie__stage">
          <ScrubVideo
            src="/video/couronne-i_eclatee_nuit.mp4"
            poster="/img/couronne-i_eclatee_nuit.png"
            trigger={root}
            label="Vue éclatée de la bague Couronne I"
          />
          <svg className="anatomie__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {CALLOUTS.map((c) => (
              <polyline
                key={c.n}
                className="callout callout__line"
                points={`${c.x},${c.y} ${c.lx - 3},${c.ly + 1.5} ${c.lx - 1},${c.ly + 1.5}`}
                pathLength={1}
              />
            ))}
          </svg>
          {CALLOUTS.map((c) => (
            <div key={c.n} className="callout" aria-hidden="true">
              <span className="callout__dot" style={{ left: `${c.x}%`, top: `${c.y}%` }} />
              <span className="callout__label" style={{ left: `${c.lx}%`, top: `${c.ly}%` }}>
                <span className="t-label">
                  {c.n} · {c.t}
                </span>
                <span className="t-label-s">{c.d}</span>
              </span>
            </div>
          ))}
          </div>
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
          <ul className="visually-hidden">
            {CALLOUTS.map((c) => (
              <li key={c.n}>
                {c.t} : {c.d}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
