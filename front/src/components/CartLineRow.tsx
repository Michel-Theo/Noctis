import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../data/products'
import { lineSub, thumbOf } from '../lib/lines'
import { MAX_QTY, lineKey, useCart, type CartLine } from '../lib/cart-context'
import { gsap, prefersReducedMotion } from '../lib/scroll'

/** Ligne de panier : vignette, nom, détail, quantité, retrait (la ligne se replie avant de disparaître). */
export function CartLineRow({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const { setQty, remove, setDrawer } = useCart()
  const row = useRef<HTMLLIElement>(null)
  const key = lineKey(line)

  const onRemove = () => {
    const el = row.current
    if (!el || prefersReducedMotion()) return remove(key)
    gsap.to(el, { height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0, duration: 0.4, ease: 'power2.inOut', onComplete: () => remove(key) })
  }

  return (
    <li ref={row} className={['cart-line', compact && 'cart-line--compact'].filter(Boolean).join(' ')}>
      <Link to={`/collection/${line.slug}`} className="cart-line__thumb" onClick={() => setDrawer(false)} tabIndex={-1}>
        <img src={thumbOf(line.slug)} alt="" />
      </Link>
      <div className="cart-line__body">
        <div className="cart-line__head">
          <h3 className="cart-line__name">{line.name}</h3>
          <span className="cart-line__price">{formatPrice(line.price * line.qty)}</span>
        </div>
        <p className="t-label-s">{lineSub(line)}</p>
        <div className="cart-line__actions">
          <div className="stepper" role="group" aria-label={`Quantité — ${line.name}`}>
            <button aria-label="Retirer une pièce" disabled={line.qty <= 1} onClick={() => setQty(key, line.qty - 1)}>
              −
            </button>
            <span aria-live="polite">{line.qty}</span>
            <button aria-label="Ajouter une pièce" disabled={line.qty >= MAX_QTY} onClick={() => setQty(key, line.qty + 1)}>
              +
            </button>
          </div>
          <button className="t-label link-draw cart-line__remove" onClick={onRemove}>
            Retirer
          </button>
        </div>
      </div>
    </li>
  )
}
