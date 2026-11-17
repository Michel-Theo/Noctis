import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '../lib/scroll'
import { ProductCard } from '../components/ProductCard'
import { useCatalog } from '../lib/catalog'

/** K4 — le scroll vertical devient un rail horizontal. */
export function Collection() {
  const root = useRef<HTMLElement>(null)
  const rail = useRef<HTMLDivElement>(null)
  const catalog = useCatalog()
  const [active, setActive] = useState(0)
  const cards = catalog.slice(0, 4)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const mm = gsap.matchMedia(root)
    mm.add('(min-width: 801px)', () => {
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
    })
    return () => mm.revert()
  }, [])

  // Mobile : la pastille active suit la carte la plus visible du carrousel.
  const onScroll = () => {
    const r = rail.current
    if (!r) return
    const card = r.firstElementChild as HTMLElement | null
    if (card) setActive(Math.round(r.scrollLeft / (card.offsetWidth + 16)))
  }

  return (
    <section ref={root} id="collection" className="collection">
      <div className="collection__head">
        <div>
          <p className="t-label t-accent">04 / 05</p>
          <h2 className="t-display-l">Collection Nocturne</h2>
        </div>
        <p className="t-label-s">
          01 — 04 &nbsp;&nbsp;<span className="collection__hint--desktop">Défiler ↓</span>
          <span className="collection__hint--mobile">Glisser →</span>
        </p>
      </div>
      <div ref={rail} className="collection__rail" onScroll={onScroll}>
        {cards.map((p) => (
          <ProductCard key={p.slug} p={p} />
        ))}
      </div>
      <div className="collection__dots" aria-hidden="true">
        {cards.map((p, i) => (
          <span key={p.slug} className={i === active ? 'is-on' : undefined} />
        ))}
      </div>
    </section>
  )
}
