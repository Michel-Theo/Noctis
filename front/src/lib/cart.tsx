import { useCallback, useEffect, useMemo, useState } from 'react'
import { CartContext, MAX_QTY, lineKey, type CartLine } from './cart-context'

const KEY = 'noctis-cart'

function read(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CartLine[]
  } catch {
    return []
  }
}

/** Panier côté client, persisté dans le navigateur. Les prix font foi côté serveur (API /quote). */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(read)
  const [drawer, setDrawer] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines))
    } catch {
      /* stockage indisponible : le panier reste en mémoire */
    }
  }, [lines])

  const add = useCallback((line: CartLine) => {
    setLines((prev) => {
      const same = prev.find((l) => lineKey(l) === lineKey(line))
      return same
        ? prev.map((l) => (l === same ? { ...l, qty: Math.min(MAX_QTY, l.qty + line.qty) } : l))
        : [...prev, line]
    })
  }, [])

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) => prev.map((l) => (lineKey(l) === key ? { ...l, qty: Math.max(1, Math.min(MAX_QTY, qty)) } : l)))
  }, [])

  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => lineKey(l) !== key)), [])
  const clear = useCallback(() => setLines([]), [])

  const value = useMemo(
    () => ({ lines, add, setQty, remove, clear, drawer, setDrawer, count: lines.reduce((n, l) => n + l.qty, 0) }),
    [lines, add, setQty, remove, clear, drawer],
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
