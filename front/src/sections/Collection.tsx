import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/scroll'
import { ProductCard } from '../components/ProductCard'
import { PRODUCTS } from '../data/products'

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
        {PRODUCTS.slice(0, 4).map((p) => (
          <ProductCard key={p.slug} p={p} />
        ))}
      </div>
    </section>
  )
}
