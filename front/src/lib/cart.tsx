import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext, type CartLine } from './cart-context'

const KEY = 'noctis-cart'

function read(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CartLine[]
  } catch {
    return []
  }
}

/** Panier côté client (en attendant l'API Symfony) — persisté dans le navigateur. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(read)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines))
    } catch {
      /* stockage indisponible : le panier reste en mémoire */
    }
  }, [lines])

  const add = useCallback((line: CartLine) => {
    setLines((prev) => {
      const same = prev.find((l) => l.slug === line.slug && l.size === line.size && l.finish === line.finish)
      return same ? prev.map((l) => (l === same ? { ...l, qty: l.qty + line.qty } : l)) : [...prev, line]
    })
  }, [])

  const value = useMemo(() => ({ lines, add, count: lines.reduce((n, l) => n + l.qty, 0) }), [lines, add])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
