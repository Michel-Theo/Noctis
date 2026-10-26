import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../data/products'
import { lineKey, useCart } from '../lib/cart-context'
import { useQuote } from '../lib/pricing'
import { useCountUp } from '../lib/useCountUp'
import { gsap, lockScroll, prefersReducedMotion } from '../lib/scroll'
import { CartLineRow } from './CartLineRow'

/**
 * Tiroir panier (maquette 30:162) : glisse depuis la droite pendant que la page s'assombrit.
 * Modale native : focus piégé, Échap pour fermer.
 */
export function CartDrawer() {
  const { lines, drawer, setDrawer } = useCart()
  const dialog = useRef<HTMLDialogElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const veil = useRef<HTMLDivElement>(null)
  const quote = useQuote(lines, 'colissimo', '')
  const total = useCountUp(quote.subtotal)

  // Dernière pièce retirée : plus rien à montrer.
  const open = drawer && lines.length > 0

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    const still = prefersReducedMotion()
    if (open && !d.open) {
      d.showModal()
      lockScroll(true)
      if (!still) {
        gsap.fromTo(panel.current, { xPercent: 100 }, { xPercent: 0, duration: 0.8, ease: 'expo.out' })
        gsap.fromTo(veil.current, { opacity: 0 }, { opacity: 1, duration: 0.6 })
      }
    }
    if (!open && d.open) {
      const done = () => {
        d.close()
        lockScroll(false)
      }
      if (still) return done()
      gsap.to(veil.current, { opacity: 0, duration: 0.4 })
      gsap.to(panel.current, { xPercent: 100, duration: 0.5, ease: 'expo.in', onComplete: done })
    }
  }, [open])

  return (
    <dialog
      ref={dialog}
      className="drawer"
      aria-label="Panier"
      onCancel={(e) => {
        e.preventDefault()
        setDrawer(false)
      }}
    >
      <div ref={veil} className="drawer__veil" onClick={() => setDrawer(false)} />
      <div ref={panel} className="drawer__panel">
        <div className="drawer__head">
          <p className="t-label t-accent">Ajoutée à votre panier</p>
          <button className="t-label link-draw" onClick={() => setDrawer(false)}>
            Fermer ✕
          </button>
        </div>
        <ul className="drawer__lines">
          {lines.map((l) => (
            <CartLineRow key={lineKey(l)} line={l} compact />
          ))}
        </ul>
        <div className="drawer__foot">
          <div className="drawer__total">
            <span className="t-label">Total</span>
            <span className="drawer__amount">{formatPrice(total)}</span>
          </div>
          <Link to="/commande" className="btn btn--primary btn--block" onClick={() => setDrawer(false)}>
            Passer commande
          </Link>
          <Link to="/panier" className="btn btn--secondary btn--block" onClick={() => setDrawer(false)}>
            Voir le panier
          </Link>
        </div>
      </div>
    </dialog>
  )
}
