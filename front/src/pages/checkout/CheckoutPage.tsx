import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import { useCart } from '../../lib/cart-context'
import { api, ApiError, type OrderForm, type Shipping } from '../../lib/api'
import { SHIPPING_OPTIONS, shippingCost, useQuote } from '../../lib/pricing'
import { cartSignature, readCheckout, saveCheckout } from '../../lib/checkout'
import { Field, OptionCard } from '../../components/checkout/Field'
import { OrderSummary } from '../../components/checkout/OrderSummary'

type Errors = Partial<Record<keyof OrderForm, string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Vérification immédiate dans le navigateur ; le serveur revalide tout. */
function validate(f: OrderForm): Errors {
  const e: Errors = {}
  if (!EMAIL.test(f.email.trim())) e.email = 'Adresse e-mail invalide.'
  if (!f.firstName.trim()) e.firstName = 'Indiquez votre prénom.'
  if (!f.lastName.trim()) e.lastName = 'Indiquez votre nom.'
  if (!f.address.trim()) e.address = 'Indiquez votre adresse.'
  if (!/^\d{4,5}$/.test(f.postalCode.trim())) e.postalCode = 'Code postal invalide.'
  if (!f.city.trim()) e.city = 'Indiquez votre ville.'
  return e
}

/** Étapes 01-02 : informations et livraison (maquettes 34:3 et M8). */
export function CheckoutPage() {
  const { lines } = useCart()
  const navigate = useNavigate()
  const saved = readCheckout()
  const [form, setForm] = useState<OrderForm>(saved.form)
  const [shipping, setShipping] = useState<Shipping>(saved.shipping)
  const [errors, setErrors] = useState<Errors>({})
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState(saved.code)
  const quote = useQuote(lines, shipping, code)

  if (!lines.length) return <Navigate to="/panier" replace />

  const bind = (k: keyof OrderForm) => ({
    value: form[k],
    error: errors[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({ ...form, [k]: e.target.value })
      if (errors[k]) setErrors({ ...errors, [k]: undefined })
    },
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    setErrors(errs)
    setFailure('')
    if (Object.keys(errs).length) {
      document.querySelector<HTMLInputElement>('.field--error input')?.focus()
      return
    }
    saveCheckout({ form, shipping })
    setBusy(true)
    try {
      const order = await api.createOrder(form, lines, shipping, code)
      saveCheckout({ order: { ...order, cart: cartSignature(lines) } })
      navigate('/commande/paiement')
    } catch (err) {
      const apiErr = err as ApiError
      setErrors(apiErr.violations as Errors)
      setFailure(apiErr.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="checkout">
      <form className="checkout__main" onSubmit={submit} noValidate>
        <h1 className="t-h1">Où envoyer la relique&nbsp;?</h1>

        <Field label="E-mail" type="email" autoComplete="email" placeholder="vous@exemple.fr" {...bind('email')} />

        <fieldset className="checkout__group">
          <legend className="t-label-s t-accent">Adresse de livraison</legend>
          <div className="checkout__row checkout__row--2">
            <Field label="Prénom" autoComplete="given-name" {...bind('firstName')} />
            <Field label="Nom" autoComplete="family-name" {...bind('lastName')} />
          </div>
          <Field label="Adresse" autoComplete="street-address" {...bind('address')} />
          <div className="checkout__row checkout__row--3">
            <Field label="Code postal" autoComplete="postal-code" inputMode="numeric" {...bind('postalCode')} />
            <Field label="Ville" autoComplete="address-level2" {...bind('city')} />
            <div className="field">
              <label className="t-label-s" htmlFor="country">
                Pays
              </label>
              <select id="country" className="field__input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                {['France', 'Belgique', 'Luxembourg', 'Suisse'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="checkout__group">
          <legend className="t-label-s t-accent">Mode de livraison</legend>
          {SHIPPING_OPTIONS.map((o) => {
            const cost = o.id === shipping ? quote.shipping : shippingCost(o.id, quote.subtotal)
            return (
              <OptionCard
                key={o.id}
                name="shipping"
                checked={shipping === o.id}
                onChange={() => setShipping(o.id)}
                title={o.label}
                detail={o.detail}
                aside={cost ? formatPrice(cost) : 'Offert'}
              />
            )
          })}
        </fieldset>

        {failure && (
          <p className="checkout__failure" role="alert">
            {failure}
          </p>
        )}

        <div className="checkout__nav">
          <Link to="/panier" className="t-label link-draw">
            ← Retour au panier
          </Link>
          <button className="btn btn--primary" type="submit" disabled={busy}>
            {busy ? 'Un instant…' : 'Continuer vers le paiement'}
          </button>
        </div>
      </form>
      <OrderSummary
        lines={lines}
        quote={quote}
        code={code}
        onCode={(c) => {
          setCode(c)
          saveCheckout({ code: c })
        }}
      />
    </main>
  )
}
