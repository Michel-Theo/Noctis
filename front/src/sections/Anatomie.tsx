import { useCallback, useEffect, useRef } from 'react'
import { gsap } from '../lib/scroll'
import { ScrollSequence } from '../components/ScrollSequence'
import TRACK from './eclatee-track.json'

/**
 * Repères numérotés de haut en bas. Chaque point suit sa pièce image par image :
 * les positions (en % du cadre) ont été projetées depuis la caméra Blender pour les 160 images
 * de l'animation — le point reste collé à la pièce quand la bague s'ouvre puis se referme.
 */
const CALLOUTS = [
  { n: '01', t: 'Griffes ×4', d: 'lames en crochet', ly: 20 },
  { n: '02', t: 'Anneau', d: 'Ø intérieur 18 mm · taille 57', ly: 38 },
  { n: '03', t: 'Poignard', d: 'pièce centrale, 9 mm', ly: 56 },
  { n: '04', t: 'Argent 925', d: 'rhodié, imprimé puis coulé', ly: 74 },
] as const
const LX = 106
const FRAMES = 160
// Visibles quand les pièces commencent à s'écarter, masqués une fois la bague refermée.
const SHOW_FROM = 36
const SHOW_TO = 140

const track = TRACK as Record<string, number[][]>

function at(n: string, f: number) {
  const a = track[n]
  const i = Math.min(FRAMES - 2, Math.max(0, Math.floor(f)))
  const t = Math.min(1, Math.max(0, f - i))
  return [a[i][0] + (a[i + 1][0] - a[i][0]) * t, a[i][1] + (a[i + 1][1] - a[i][1]) * t]
}

/** K2 — la bague s'ouvre en vue éclatée au fil du scroll ; les repères suivent les pièces. */
export function Anatomie() {
  const root = useRef<HTMLElement>(null)
  const layer = useRef<HTMLDivElement>(null)
  const shown = useRef(false)

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
    }, root)
    return () => ctx.revert()
  }, [])

  const onFrame = useCallback((f: number) => {
    const el = layer.current
    if (!el) return
    for (const c of CALLOUTS) {
      const [x, y] = at(c.n, f)
      el.querySelector<HTMLElement>(`[data-dot="${c.n}"]`)?.style.setProperty('left', `${x}%`)
      el.querySelector<HTMLElement>(`[data-dot="${c.n}"]`)?.style.setProperty('top', `${y}%`)
      el.querySelector(`[data-line="${c.n}"]`)?.setAttribute('points', `${x},${y} ${LX - 3},${c.ly + 1.5} ${LX - 1},${c.ly + 1.5}`)
    }
    const show = f >= SHOW_FROM && f <= SHOW_TO
    if (show !== shown.current) {
      shown.current = show
      el.classList.toggle('callouts--on', show)
    }
  }, [])

  return (
    <section ref={root} id="anatomie" className="anatomie">
      <div className="anatomie__sticky">
        <div className="anatomie__media">
          <div className="anatomie__stage">
            <ScrollSequence
              dir="/seq/eclatee_nuit"
              count={FRAMES}
              width={960}
              height={960}
              poster="/img/eclatee_poster.webp"
              trigger={root}
              label="Vue éclatée de la bague Couronne I"
              onFrame={onFrame}
            />
            <div ref={layer} className="callouts" aria-hidden="true">
              <svg className="anatomie__lines" viewBox="0 0 100 100" preserveAspectRatio="none">
                {CALLOUTS.map((c) => (
                  <polyline key={c.n} data-line={c.n} className="callout__line" pathLength={1} />
                ))}
              </svg>
              {CALLOUTS.map((c, i) => (
                <div key={c.n} className="callout" style={{ '--i': i } as React.CSSProperties}>
                  <span data-dot={c.n} className="callout__dot" />
                  <span className="callout__label" style={{ left: `${LX}%`, top: `${c.ly}%` }}>
                    <span className="t-label">
                      {c.n} · {c.t}
                    </span>
                    <span className="t-label-s">{c.d}</span>
                  </span>
                </div>
              ))}
            </div>
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
