import { createContext, useContext } from 'react'

export type CartLine = { slug: string; name: string; price: number; size: number; finish: string; qty: number }

/** Une ligne = une pièce dans une finition et une taille données. */
export const lineKey = (l: Pick<CartLine, 'slug' | 'finish' | 'size'>) => `${l.slug}|${l.finish}|${l.size}`

export const MAX_QTY = 5

export type Cart = {
  lines: CartLine[]
  count: number
  add: (line: CartLine) => void
  setQty: (key: string, qty: number) => void
  remove: (key: string) => void
  clear: () => void
  /** Tiroir panier (s'ouvre après un ajout). */
  drawer: boolean
  setDrawer: (open: boolean) => void
}

export const CartContext = createContext<Cart | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart hors de CartProvider')
  return ctx
}
