import type { CartLine } from './cart-context'
import type { CreatedOrder, OrderForm, Shipping } from './api'

/** État du tunnel, gardé le temps de l'onglet : on peut revenir en arrière sans tout ressaisir. */
export type CheckoutState = {
  form: OrderForm
  shipping: Shipping
  code: string
  /** Commande créée côté serveur, en attente de paiement — liée au panier qui l'a produite. */
  order?: CreatedOrder & { cart: string }
}

const KEY = 'noctis-checkout'

const EMPTY: CheckoutState = {
  form: { email: '', firstName: '', lastName: '', address: '', postalCode: '', city: '', country: 'France' },
  shipping: 'colissimo',
  code: '',
}

export function readCheckout(): CheckoutState {
  try {
    return { ...EMPTY, ...(JSON.parse(sessionStorage.getItem(KEY) ?? '{}') as Partial<CheckoutState>) }
  } catch {
    return EMPTY
  }
}

export function saveCheckout(patch: Partial<CheckoutState>) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...readCheckout(), ...patch }))
  } catch {
    /* stockage indisponible */
  }
}

/** Empreinte du panier : une commande créée pour un autre panier n'est plus payable telle quelle. */
export const cartSignature = (lines: CartLine[]) => JSON.stringify(lines.map((l) => [l.slug, l.finish, l.size, l.qty]))
