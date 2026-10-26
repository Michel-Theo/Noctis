import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../data/products'
import { lineKey, useCart } from '../lib/cart-context'
import { useQuote } from '../lib/pricing'
import { useCountUp } from '../lib/useCountUp'
import { CartLineRow } from '../components/CartLineRow'
import { Sigil } from '../components/Sigil'
import { Footer } from '../components/Footer'
import { CodeField } from '../components/CodeField'
import { readCheckout, saveCheckout } from '../lib/checkout'

const pieces = (n: number) => `${n} pièce${n > 1 ? 's' : ''}`

/** Panier (maquettes 30:82, 30:210 et M5). */
export function CartPage() {
  const { lines, count } = useCart()
  const [code, setCode] = useState(() => readCheckout().code)
  const quote = useQuote(lines, 'colissimo', code)
  const subtotal = useCountUp(quote.subtotal)
  const total = useCountUp(quote.total)

  if (!lines.length) {
    return (
      <main className="cart-empty">
        <Sigil size={120} className="cart-empty__sigil" />
        <h1 className="t-h1">Votre panier est vide</h1>
        <p className="t-body-l">La nuit est encore jeune.</p>
        <Link to="/#collection" className="btn btn--secondary">
          Découvrir la collection
        </Link>
      </main>
    )
  }

  const applyCode = (c: string) => {
    setCode(c)
    saveCheckout({ code: c })
  }
  const missing = quote.freeShippingFrom - quote.subtotal

  return (
    <main className="cart">
      <section className="cart__main">
        <div className="cart__title">
          <h1 className="t-display-l">Panier</h1>
          <span className="t-label cart__count">{pieces(count)}</span>
        </div>
        <ul className="cart__lines">
          {lines.map((l) => (
            <CartLineRow key={lineKey(l)} line={l} />
          ))}
        </ul>
        <p className="cart__note">
          {missing > 0
            ? `Plus que ${formatPrice(missing)} pour la livraison offerte. Chaque pièce est coulée à la commande : comptez dix jours.`
            : 'La livraison vous est offerte. Chaque pièce est coulée à la commande : comptez dix jours.'}
        </p>
      </section>

      <aside className="summary" aria-label="Récapitulatif">
        <h2 className="t-h3 summary__title">Récapitulatif</h2>
        <dl className="summary__rows">
          <div>
            <dt className="t-label-s">Sous-total</dt>
            <dd>{formatPrice(subtotal)}</dd>
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
          <div className="summary__desktop">
            <dt className="t-label-s">Dont TVA</dt>
            <dd>{formatPrice(quote.tax)}</dd>
          </div>
        </dl>
        <div className="summary__total">
          <span className="t-label">Total</span>
          <span className="summary__amount">{formatPrice(total)}</span>
        </div>
        <CodeField code={code} quote={quote} onApply={applyCode} />
        <div className="summary__cta">
          <Link to="/commande" className="btn btn--primary btn--block">
            Passer commande
          </Link>
        </div>
        <p className="t-label-s summary__desktop">Paiement sécurisé · carte, Apple Pay, PayPal</p>
      </aside>

      <div className="product__footer">
        <Footer />
      </div>
    </main>
  )
}
