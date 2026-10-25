import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/scroll'

type Product = { name: string; price: string; sub: string; img?: string }

const PRODUCTS: Product[] = [
  { name: 'Couronne I', price: '140,00 €', sub: 'Argent 925 rhodié · N° 001', img: '/img/couronne-i_34_nuit.png' },
  { name: 'Couronne II', price: 'En forge', sub: 'Bientôt' },
  { name: 'Spina', price: 'En forge', sub: 'Bientôt' },
  { name: 'Vigile', price: 'En forge', sub: 'Bientôt' },
]

/** K4 — le scroll vertical devient un rail horizontal. */
export function Collection() {
  const root = useRef<HTMLElement>(null)
  const rail = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const r = rail.current!
      const distance = () => r.scrollWidth - window.innerWidth + 96
      gsap.to(r, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={root} id="collection" className="collection">
      <div className="collection__head">
        <div>
          <p className="t-label t-accent">04 / 05</p>
          <h2 className="t-display-l">Collection Nocturne</h2>
        </div>
        <p className="t-label-s">01 — 04 &nbsp;&nbsp; Glisser →</p>
      </div>
      <div ref={rail} className="collection__rail">
        {PRODUCTS.map((p) => {
          const forge = !p.img
          return (
            <a
              key={p.name}
              href={forge ? undefined : '#produit'}
              className={['card', forge && 'card--forge'].filter(Boolean).join(' ')}
              data-cursor={forge ? 'Bientôt' : 'Voir'}
            >
              <div className="card__media">
                <img src={p.img ?? '/img/couronne-i_face_nuit.png'} alt={forge ? '' : p.name} loading="lazy" />
              </div>
              <div className="card__meta">
                <div>
                  <p className="t-h3">{p.name}</p>
                  <p className="t-label-s">{p.sub}</p>
                </div>
                <p className={['t-label', !forge && 'card__price'].filter(Boolean).join(' ')}>{p.price}</p>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}
