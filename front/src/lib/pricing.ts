import { useEffect, useMemo, useState } from 'react'
import type { CartLine } from './cart-context'
import { api, type Quote, type Shipping } from './api'

export const FREE_SHIPPING_FROM = 15000

export const SHIPPING_OPTIONS: { id: Shipping; label: string; detail: string }[] = [
  { id: 'colissimo', label: 'Colissimo suivi', detail: 'Livraison 2-3 jours après fabrication' },
  { id: 'chronopost', label: 'Chronopost 24 h', detail: "Livraison le lendemain de l'expédition" },
  { id: 'atelier', label: "Retrait à l'atelier", detail: 'Sur rendez-vous, Troyes' },
]

export function shippingCost(method: Shipping, subtotal: number) {
  if (method === 'chronopost') return 1200
  if (method === 'atelier') return 0
  return subtotal >= FREE_SHIPPING_FROM ? 0 : 690
}

/**
 * Devis calculé dans le navigateur, avec les mêmes règles que l'API.
 * Affiché tout de suite, puis remplacé par la réponse du serveur, qui seule fait foi.
 */
export function localQuote(lines: CartLine[], shipping: Shipping, code: string): Quote {
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
  const valid = code.trim().toUpperCase() === 'NUIT10'
  const discount = valid ? Math.round(subtotal / 10) : 0
  const ship = shippingCost(shipping, subtotal)
  const total = subtotal - discount + ship
  return {
    lines: lines.map((l) => ({ slug: l.slug, name: l.name, finish: l.finish, size: l.size, quantity: l.qty, unitPrice: l.price, total: l.price * l.qty })),
    subtotal,
    shipping: ship,
    discount,
    tax: Math.round(total / 6),
    total,
    freeShippingFrom: FREE_SHIPPING_FROM,
    code: code.trim() ? { code: code.trim().toUpperCase(), label: valid ? 'Code de la nuit −10 %' : '', valid } : null,
  }
}

/** Devis du panier : local immédiatement, serveur dès qu'il répond (si l'API est éteinte, le local reste). */
export function useQuote(lines: CartLine[], shipping: Shipping, code: string) {
  const local = useMemo(() => localQuote(lines, shipping, code), [lines, shipping, code])
  const sig = JSON.stringify([lines, shipping, code])
  const [server, setServer] = useState<{ sig: string; quote: Quote } | null>(null)

  useEffect(() => {
    if (!lines.length) return
    const ctrl = new AbortController()
    const t = window.setTimeout(() => {
      api
        .quote(lines, shipping, code, ctrl.signal)
        .then((quote) => setServer({ sig, quote }))
        .catch(() => {})
    }, 200)
    return () => {
      window.clearTimeout(t)
      ctrl.abort()
    }
  }, [sig, lines, shipping, code])

  return server?.sig === sig ? server.quote : local
}
