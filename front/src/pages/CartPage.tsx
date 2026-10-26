import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../data/products'
import { lineKey, useCart } from '../lib/cart-context'
import { useQuote } from '../lib/pricing'
import { useCountUp } from '../lib/useCountUp'
import { CartLineRow } from '../components/CartLineRow'
import { Sigil } from '../components/Sigil'
import { Footer } from '../components/Footer'
import { readCheckout, saveCheckout } from '../lib/checkout'

const pieces = (n: number) => `${n} pièce${n > 1 ? 's' : ''}`

/** Panier (maquettes 30:82, 30:210 et M5). */
export function CartPage() {
  const { lines, count } = useCart()
  const [code, setCode] = useState(() => readCheckout().code)
  const [draft, setDraft] = useState(code)
  const quote = useQuote(lines, 'colissimo', code)
  const subtotal = useCountUp(quote.subtotal)
  const total = useCountUp(quote.total)

  if (!lines.length) {
    return (
      <main className="cart-empty">
        <Sigil size={96} className="cart-empty__sigil" />
        <h1 className="t-h1">Votre panier est vide</h1>
        <p className="t-body-l">La nuit est encore jeune.</p>
        <Link to="/#collection" className="btn btn--secondary">
          Découvrir la collection
        </Link>
      </main>
    )
  }

  const applyCode = (e: React.FormEvent) => {
    e.preventDefault()
    setCode(draft.trim())
    saveCheckout({ code: draft.trim() })
  }
  const missing = quote.freeShippingFrom - quote.subtotal

  return (
    <main className="cart">
      <section className="cart__main">
        <div className="cart__title">
          <h1 className="t-display-l">Panier</h1>
          <span className="t-label-s">{pieces(count)}</span>
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
        <form className="summary__code" onSubmit={applyCode}>
          <label className="t-label-s" htmlFor="code">
            Code de la nuit
          </label>
          <div className="summary__code-row">
            <input id="code" className="field__input" placeholder="Saisir un code" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button className="t-label link-draw" type="submit">
              Appliquer
            </button>
          </div>
          {quote.code && (
            <p className={['t-label-s', !quote.code.valid && 't-accent'].filter(Boolean).join(' ')} role="status">
              {quote.code.valid ? `${quote.code.label} appliqué` : 'Ce code ne mène nulle part.'}
            </p>
          )}
        </form>
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
