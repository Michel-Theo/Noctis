import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import { useCart } from '../../lib/cart-context'
import { api, ApiError, type Payment } from '../../lib/api'
import { SHIPPING_OPTIONS, useQuote } from '../../lib/pricing'
import { cartSignature, readCheckout, saveCheckout } from '../../lib/checkout'
import { Field, OptionCard } from '../../components/checkout/Field'
import { OrderSummary } from '../../components/checkout/OrderSummary'

const digits = (s: string) => s.replace(/\D/g, '')
const formatCard = (s: string) => digits(s).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
const formatExpiry = (s: string) => {
  const d = digits(s).slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d
}

/** Étape 03 : paiement (maquette 34:102). Paiement simulé côté serveur, façon cartes de test Stripe. */
export function PaymentPage() {
  const { lines, clear } = useCart()
  const navigate = useNavigate()
  const saved = readCheckout()
  const quote = useQuote(lines, saved.shipping, saved.code)
  const [method, setMethod] = useState<Payment['method']>('card')
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  const [paid, setPaid] = useState(false)

  // Payée : le panier se vide pendant que la confirmation se charge, rien à afficher ici.
  if (paid) return null
  const order = saved.order
  // Pas de commande, ou panier modifié depuis : on repasse par l'étape précédente.
  if (!order || order.cart !== cartSignature(lines)) return <Navigate to={lines.length ? '/commande' : '/panier'} replace />

  const { form } = saved
  const ship = SHIPPING_OPTIONS.find((o) => o.id === saved.shipping)!

  const pay = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (method === 'card') {
      if (digits(card.number).length < 13) errs.cardNumber = 'Numéro de carte incomplet.'
      if (digits(card.expiry).length !== 4) errs.expiry = 'Format MM / AA.'
      if (!/^\d{3,4}$/.test(card.cvc)) errs.cvc = '3 ou 4 chiffres.'
    }
    setErrors(errs)
    setFailure('')
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      const exp = digits(card.expiry)
      await api.pay(order.reference, order.token, {
        method,
        ...(method === 'card' && { cardNumber: digits(card.number), expiry: `${exp.slice(0, 2)}/${exp.slice(2)}`, cvc: card.cvc }),
      })
      setPaid(true)
      saveCheckout({ order: undefined, code: '' })
      clear()
      navigate(`/commande/confirmation/${order.reference}?token=${order.token}`)
    } catch (err) {
      const apiErr = err as ApiError
      setErrors(apiErr.violations)
      setFailure(apiErr.message)
      setBusy(false)
    }
  }

  return (
    <main className="checkout">
      <form className="checkout__main" onSubmit={pay} noValidate>
        <h1 className="t-h1">Paiement</h1>

        <dl className="recap">
          {[
            ['Contact', form.email],
            ['Livrer à', `${form.address}, ${form.postalCode} ${form.city}`],
            ['Livraison', `${ship.label} · ${quote.shipping ? formatPrice(quote.shipping) : 'Offert'}`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="t-label-s">{k}</dt>
              <dd>{v}</dd>
              <Link to="/commande" className="t-label link-draw">
                Modifier
              </Link>
            </div>
          ))}
        </dl>

        <fieldset className="checkout__group">
          <legend className="t-label-s t-accent">Moyen de paiement</legend>
          <OptionCard name="method" checked={method === 'card'} onChange={() => setMethod('card')} title="Carte bancaire">
            <Field
              label="Numéro de carte"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="4242 4242 4242 4242"
              value={card.number}
              error={errors.cardNumber}
              onChange={(e) => setCard({ ...card, number: formatCard(e.target.value) })}
            />
            <div className="checkout__row checkout__row--2">
              <Field
                label="Expiration"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="12 / 28"
                value={card.expiry}
                error={errors.expiry}
                onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
              />
              <Field
                label="CVC"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="•••"
                maxLength={4}
                value={card.cvc}
                error={errors.cvc}
                onChange={(e) => setCard({ ...card, cvc: digits(e.target.value) })}
              />
            </div>
          </OptionCard>
          <OptionCard name="method" checked={method === 'applepay'} onChange={() => setMethod('applepay')} title="Apple Pay" detail="Paiement en un geste" />
          <OptionCard name="method" checked={method === 'paypal'} onChange={() => setMethod('paypal')} title="PayPal" detail="Redirection sécurisée" />
        </fieldset>

        <p className="t-label-s">
          Projet portfolio : aucun paiement réel n'est effectué. Carte de test 4242 4242 4242 4242, ou 4000 0000 0000 0002 pour un refus.
        </p>

        {failure && (
          <p className="checkout__failure" role="alert">
            {failure}
          </p>
        )}

        <div className="checkout__nav">
          <Link to="/commande" className="t-label link-draw">
            ← Livraison
          </Link>
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? 'Paiement en cours…' : `Payer ${formatPrice(quote.total)}`}
          </button>
        </div>
      </form>
      <OrderSummary lines={lines} quote={quote} />
    </main>
  )
}
