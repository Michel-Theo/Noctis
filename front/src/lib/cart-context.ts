import { createContext, useContext } from 'react'

export type CartLine = { slug: string; name: string; price: number; size: number; finish: string; qty: number }

export type Cart = {
  lines: CartLine[]
  count: number
  add: (line: CartLine) => void
}

export const CartContext = createContext<Cart | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart hors de CartProvider')
  return ctx
}
