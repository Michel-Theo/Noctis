import type { CartLine } from './cart-context'

/** Client de l'API Symfony (back/). En dev, Vite relaie /api vers 127.0.0.1:8000. */

export type Shipping = 'colissimo' | 'chronopost' | 'atelier'

export type QuoteLine = { slug: string; name: string; finish: string; size: number; quantity: number; unitPrice: number; total: number }

export type Quote = {
  lines: QuoteLine[]
  subtotal: number
  shipping: number
  discount: number
  tax: number
  total: number
  freeShippingFrom: number
  code: { code: string; label: string; valid: boolean } | null
}

export type OrderForm = {
  email: string
  firstName: string
  lastName: string
  address: string
  postalCode: string
  city: string
  country: string
}

export type CreatedOrder = { reference: string; token: string; total: number; status: string }

export type OrderStep = { key: string; label: string; date: string; done: boolean }

export type Order = Omit<Quote, 'freeShippingFrom' | 'code'> & {
  reference: string
  status: string
  email: string
  firstName: string
  shippingMethod: Shipping
  createdAt: string
  paidAt: string | null
  timeline: OrderStep[]
}

export type User = { email: string; firstName: string; lastName: string; createdAt: string }

export type AccountStep = OrderStep & { current: boolean }

export type AccountOrder = {
  reference: string
  token: string
  createdAt: string
  paidAt: string
  status: string
  statusLabel: string
  total: number
  lines: { slug: string; name: string; finish: string; size: number; quantity: number; serials: number[] }[]
  timeline: AccountStep[]
}

export type Piece = { slug: string; name: string; finish: string; size: number; serial: number; editionTotal: number; orderReference: string; castAt: string }

export type AccountOrders = { current: AccountOrder | null; history: AccountOrder[]; pieces: Piece[] }

export type ContactForm = { firstName: string; lastName: string; email: string; subject: 'commande' | 'sur-mesure' | 'autre'; message: string }

export type Payment = { method: 'card' | 'applepay' | 'paypal'; cardNumber?: string; expiry?: string; cvc?: string }

/** Erreur renvoyée par l'API : message lisible + éventuelles erreurs par champ. */
export class ApiError extends Error {
  status: number
  violations: Record<string, string>
  constructor(status: number, message: string, violations: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.violations = violations
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, { ...init, headers: { 'Content-Type': 'application/json', Accept: 'application/json' } })
  } catch {
    throw new ApiError(0, 'Le serveur est injoignable. Réessayez dans un instant.')
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = res.status >= 500 || !body?.error ? 'Une erreur est survenue côté serveur.' : body.error
    throw new ApiError(res.status, msg, body?.violations ?? {})
  }
  return body as T
}

const items = (lines: CartLine[]) => lines.map((l) => ({ slug: l.slug, finish: l.finish, size: l.size, quantity: l.qty }))
const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })

export const api = {
  quote: (lines: CartLine[], shipping: Shipping, code: string, signal?: AbortSignal) =>
    call<Quote>('/quote', { ...post({ items: items(lines), shipping, code: code || undefined }), signal }),
  createOrder: (form: OrderForm, lines: CartLine[], shipping: Shipping, code: string) =>
    call<CreatedOrder>('/orders', post({ ...form, shipping, items: items(lines), code: code || undefined })),
  applyCode: (reference: string, token: string, code: string) =>
    call<Quote & { reference: string }>(`/orders/${encodeURIComponent(reference)}/code?token=${encodeURIComponent(token)}`, post({ code: code || null })),
  pay: (reference: string, token: string, payment: Payment) =>
    call<Order>(`/orders/${encodeURIComponent(reference)}/pay?token=${encodeURIComponent(token)}`, post(payment)),
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => call<User>('/auth/register', post(data)),
  login: (email: string, password: string, remember: boolean) => call<User>('/auth/login', post({ email, password, remember })),
  logout: () => call<null>('/auth/logout', { method: 'POST' }),
  contact: (form: ContactForm) => call<{ ok: true }>('/contact', post(form)),
  me: () => call<User>('/me'),
  myOrders: () => call<AccountOrders>('/me/orders'),
  order: (reference: string, token: string) =>
    call<Order>(`/orders/${encodeURIComponent(reference)}?token=${encodeURIComponent(token)}`),
}
