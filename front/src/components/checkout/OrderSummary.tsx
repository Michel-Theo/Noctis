import { useState } from 'react'
import { formatPrice } from '../../data/products'
import { lineKey, type CartLine } from '../../lib/cart-context'
import type { Quote } from '../../lib/api'
import { lineSub, thumbOf } from '../../lib/lines'

/** « Votre commande » : colonne de droite sur ordinateur, volet repliable en haut sur mobile (M8). */
export function OrderSummary({ lines, quote }: { lines: CartLine[]; quote: Quote }) {
  const [open, setOpen] = useState(false)
  return (
    <aside className={['summary', 'order-summary', open && 'order-summary--open'].filter(Boolean).join(' ')} aria-label="Votre commande">
      <button className="order-summary__toggle t-label" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{open ? 'Masquer la commande ▴' : 'Afficher la commande ▾'}</span>
        <span className="t-accent">{formatPrice(quote.total)}</span>
      </button>
      <div className="order-summary__body">
        <h2 className="t-h3 summary__title">Votre commande</h2>
        <ul className="order-summary__lines">
          {lines.map((l) => (
            <li key={lineKey(l)}>
              <img src={thumbOf(l.slug)} alt="" />
              <div>
                <p className="t-label">
                  {l.name}
                  {l.qty > 1 && ` × ${l.qty}`}
                </p>
                <p className="t-label-s">{lineSub(l, false)}</p>
              </div>
              <span className="order-summary__price">{formatPrice(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="summary__rows">
          <div>
            <dt className="t-label-s">Sous-total</dt>
            <dd>{formatPrice(quote.subtotal)}</dd>
          </div>
          {quote.discount > 0 && (
            <div>
              <dt className="t-label-s">{quote.code?.label}</dt>
              <dd>−{formatPrice(quote.discount)}</dd>
            </div>
          )}
          <div>
            <dt className="t-label-s">Livraison</dt>
            <dd>{quote.shipping ? formatPrice(quote.shipping) : 'Offerte'}</dd>
          </div>
        </dl>
        <div className="summary__total summary__total--flat">
          <span className="t-label">Total TTC</span>
          <span className="summary__amount">{formatPrice(quote.total)}</span>
        </div>
        <p className="t-label-s">Fabrication 10 jours · expédition suivie</p>
      </div>
    </aside>
  )
}
