import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { formatPrice } from '../data/products'
import { useCatalog, useProductDetail } from '../lib/catalog'
import { useCart } from '../lib/cart-context'
import { gsap, prefersReducedMotion } from '../lib/scroll'
import { takeCardRect } from '../lib/transition'
import { ProductViewer } from '../three/ProductViewer'
import { Accordion } from '../components/Accordion'
import { SizeGuide } from '../components/SizeGuide'
import { ProductCard } from '../components/ProductCard'
import { Footer } from '../components/Footer'

export function ProductPage() {
  const { slug = '' } = useParams()
  // Prix, accroche, tailles et disponibilité : données vivantes du back-office.
  const p = useProductDetail(slug)
  const catalog = useCatalog()
  const { add, setDrawer } = useCart()
  const root = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const ghost = useRef<HTMLImageElement>(null)
  const [view, setView] = useState('3d')
  // Écran tactile : le doigt fait défiler les vues au lieu de tourner la bague.
  const [touch] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  const swipe = useRef<[number, number]>([0, 0])
  const [pickedFinish, setFinish] = useState('')
  const [pickedSize, setSize] = useState(0)
  const [qty, setQty] = useState(1)
  const [guide, setGuide] = useState(false)
  const [added, setAdded] = useState(false)

  // Carte → fiche (FLIP) : le visuel de la carte s'agrandit jusqu'à la scène produit, puis s'efface sur la 3D.
  useLayoutEffect(() => {
    const from = takeCardRect()
    const g = ghost.current
    const s = stage.current
    if (!g || !s) return
    if (!from || prefersReducedMotion()) {
      g.style.display = 'none'
      return
    }
    // Le visuel vole au-dessus de la page (position fixe) : il n'est pas rogné par le cadre produit.
    const to = s.getBoundingClientRect()
    Object.assign(g.style, { display: 'block', left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` })
    const tl = gsap.timeline()
    tl.fromTo(
      g,
      {
        x: from.left - to.left,
        y: from.top - to.top,
        scaleX: from.width / to.width,
        scaleY: from.height / to.height,
        transformOrigin: '0 0',
      },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.9, ease: 'expo.inOut' },
    ).to(g, { autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, '+=0.2')
    return () => {
      tl.kill()
    }
  }, [slug])

  // Entrée des informations et révélations au scroll.
  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('.product__info > *', { opacity: 0, y: 20, duration: 1.2, ease: 'expo.out', stagger: 0.06, delay: 0.3 })
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.from(el, { opacity: 0, y: 32, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } })
      })
    }, root)
    return () => ctx.revert()
  }, [slug])

  if (!p) return <Navigate to="/" replace />

  const price = formatPrice((p.price ?? 0) * qty)
  const media = p.gallery.find((g) => g.id === view)
  const step = (d: number) => {
    const i = p.gallery.findIndex((g) => g.id === view)
    setView(p.gallery[(i + d + p.gallery.length) % p.gallery.length].id)
  }
  const related = p.related.map((s) => catalog.find((x) => x.slug === s)!).filter(Boolean)
  // Choix encore valides après une modification du back-office, sinon les valeurs par défaut.
  const finish = p.finishes.includes(pickedFinish) ? pickedFinish : p.finishes[0]
  const size = p.sizes.includes(pickedSize) ? pickedSize : p.defaultSize
  const available = p.price !== null

  const addToCart = () => {
    if (!available) return
    add({ slug: p.slug, name: p.name, price: p.price!, size, finish, qty })
    setAdded(true)
    // Le bouton se remplit (0,6 s), puis le tiroir glisse depuis la droite.
    setTimeout(() => setDrawer(true), prefersReducedMotion() ? 0 : 650)
    setTimeout(() => setAdded(false), 2200)
  }

  return (
    <div ref={root} className="product">
      <section className="product__top">
        <div className="product__gallery">
          <ul className="product__thumbs" aria-label="Vues">
            {p.gallery.map((g) => (
              <li key={g.id}>
                <button
                  className={['thumb', view === g.id && 'thumb--on'].filter(Boolean).join(' ')}
                  onClick={() => setView(g.id)}
                  aria-label={g.label}
                  aria-pressed={view === g.id}
                >
                  {g.src ? <img src={g.src} alt="" /> : <span className="thumb__3d t-label-s">3D</span>}
                </button>
              </li>
            ))}
          </ul>
          <div
            ref={stage}
            className="product__stage"
            data-cursor={view === '3d' && !touch ? 'Glisser' : undefined}
            onTouchStart={(e) => (swipe.current = [e.touches[0].clientX, e.touches[0].clientY])}
            onTouchEnd={(e) => {
              // Glissement horizontal net : vue suivante / précédente.
              const [x0, y0] = swipe.current
              const dx = e.changedTouches[0].clientX - x0
              const dy = e.changedTouches[0].clientY - y0
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1)
            }}
          >
            {view === '3d' ? <ProductViewer interactive={!touch} /> : <img key={media?.src} className="product__image" src={media?.src} alt={`${p.name} — ${media?.label}`} />}
            <p className="product__serial t-label-s">{p.serial}</p>
            {view === '3d' && (
              <p className="product__hint t-label-s">
                {touch ? (
                  <>
                    ↻ 360° · glisser pour les photos <span className="t-accent">→</span>
                  </>
                ) : (
                  <>
                    ↻ Glisser pour tourner <span className="t-accent">360°</span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        <div className="product__info">
          <nav className="t-label-s" aria-label="Fil d'Ariane">
            <Link to="/collection" className="link-draw">
              Collection
            </Link>{' '}
            / Nocturne / {p.name}
          </nav>
          <div className="product__title">
            <h1 className="t-display-l product__name">{p.name}</h1>
            <p>
              <span className="product__price">{available ? formatPrice(p.price!) : 'Indisponible'}</span> <span className="t-label-s">TVA incluse</span>
            </p>
          </div>
          <p className="t-body-l">{p.pitch}</p>

          <fieldset className="product__field">
            <legend className="t-label">Finition</legend>
            <div className="tags">
              {p.finishes.map((f) => (
                <button key={f} className={['tag', f === finish && 'tag--on'].filter(Boolean).join(' ')} aria-pressed={f === finish} onClick={() => setFinish(f)}>
                  {f}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="product__field">
            <div className="product__field-head">
              <legend className="t-label">Taille</legend>
              <button className="t-label link-draw" onClick={() => setGuide(true)}>
                Guide des tailles
              </button>
            </div>
            <div className="tags">
              {p.sizes.map((s) => (
                <button key={s} className={['tag', s === size && 'tag--on'].filter(Boolean).join(' ')} aria-pressed={s === size} onClick={() => setSize(s)}>
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="product__buy">
            <div className="stepper" role="group" aria-label="Quantité">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Retirer une pièce">
                −
              </button>
              <span aria-live="polite">{qty}</span>
              <button onClick={() => setQty(Math.min(5, qty + 1))} aria-label="Ajouter une pièce">
                +
              </button>
            </div>
            <button className={['btn btn--primary btn--fill', added && 'is-added'].filter(Boolean).join(' ')} onClick={addToCart}>
              <span className="btn__fill" aria-hidden="true" />
              <span className="btn__text">{added ? 'Ajoutée à votre panier' : `Ajouter au panier — ${price}`}</span>
            </button>
          </div>

          <ul className="product__reassurance t-label-s">
            <li>— Coulée sur commande — expédiée sous 10 jours</li>
            <li>— Livraison offerte dès 150&nbsp;€</li>
            <li>— Retours sous 30 jours · Garantie rhodiage 2 ans</li>
          </ul>

          <div className="product__accordions">
            {p.accordions.map((a, i) => (
              <Accordion key={a.title} title={a.title} defaultOpen={i === 1}>
                {a.body}
              </Accordion>
            ))}
          </div>
        </div>
      </section>

      <section className="product__anatomy">
        <img className="reveal" src="/img/produit/eclatee_nuit.webp" alt="Vue éclatée de Couronne I" loading="lazy" />
        <div className="reveal">
          <p className="t-label t-accent">Anatomie</p>
          <h2 className="t-h1">
            Vingt-six lames,
            <br />
            un poignard.
          </h2>
          <dl className="product__specs">
            {p.specs.map(([k, v]) => (
              <div key={k}>
                <dt className="t-label-s">{k}</dt>
                <dd className="t-label">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="product__worn">
        <h2 className="t-h1 reveal">Portée la nuit</h2>
        <div className="product__worn-grid">
          <img className="reveal" src={p.worn.big} alt="Couronne I portée au majeur" loading="lazy" />
          <img className="reveal" src={p.worn.top} alt="Gros plan de la bague portée" loading="lazy" />
          <img className="reveal" src={p.worn.bottom} alt="Macro du poignard central" loading="lazy" />
        </div>
      </section>

      <section className="product__related">
        <h2 className="t-h1 reveal">Vous aimerez aussi</h2>
        <div className="product__related-grid">
          {related.map((r) => (
            <ProductCard key={r.slug} p={r} />
          ))}
        </div>
      </section>

      <div className="product__footer">
        <Footer />
      </div>

      {/* Barre d'achat collée en bas d'écran sur mobile (maquette M4). */}
      <div className="buybar">
        <div>
          <p className="t-label-s">Taille {size}</p>
          <p className="t-label">{price}</p>
        </div>
        <button className="btn btn--primary" onClick={addToCart}>
          {added ? 'Ajoutée' : 'Ajouter au panier'}
        </button>
      </div>

      <img ref={ghost} className="product__ghost" src={p.card} alt="" aria-hidden="true" />

      <SizeGuide open={guide} onClose={() => setGuide(false)} current={size} />
    </div>
  )
}
