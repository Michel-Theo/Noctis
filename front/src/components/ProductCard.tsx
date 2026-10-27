import { lazy, Suspense, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { prefersReducedMotion } from '../lib/scroll'
import { rememberCard } from '../lib/transition'
import { formatPrice, type Product } from '../data/products'

// La bague 3D du survol (et Three.js avec elle) n'est téléchargée qu'au premier survol.
const MiniRing = lazy(() => import('../three/MiniRing').then((m) => ({ default: m.MiniRing })))

/** Carte produit (collection, recommandations). Pièce « en forge » = visuel flouté, non cliquable. */
export function ProductCard({ p }: { p: Product }) {
  const forge = p.price === null
  const [hover, setHover] = useState(false)
  const media = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const open = (e: React.MouseEvent) => {
    if (forge) return
    e.preventDefault()
    if (media.current) rememberCard(media.current)
    navigate(`/collection/${p.slug}`)
  }

  return (
    <a
      href={forge ? undefined : `/collection/${p.slug}`}
      onClick={open}
      className={['card', forge && 'card--forge'].filter(Boolean).join(' ')}
      data-cursor={forge ? 'Bientôt' : 'Voir'}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div ref={media} className="card__media">
        <img src={p.card ?? '/img/produit/face_nuit.webp'} alt={forge ? '' : p.name} loading="lazy" />
        {/* Au survol, l'image laisse place à la bague en 3D qui tourne. */}
        {!forge && hover && !prefersReducedMotion() && (
          <Suspense fallback={null}>
            <MiniRing />
          </Suspense>
        )}
      </div>
      <div className="card__meta">
        <div>
          <p className="t-h3">{p.name}</p>
          <p className="t-label-s">{p.sub}</p>
        </div>
        <p className={['t-label', !forge && 'card__price'].filter(Boolean).join(' ')}>
          {p.price === null ? 'En forge' : formatPrice(p.price)}
        </p>
      </div>
    </a>
  )
}
