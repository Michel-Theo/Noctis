import { useSyncExternalStore } from 'react'
import { DETAILS, PRODUCTS, type Product, type ProductDetail } from '../data/products'
import { api, type CatalogProduct } from './api'

/**
 * Catalogue vivant : nom, accroche, prix, tailles et disponibilité viennent de l'API (modifiables
 * dans le back-office) ; visuels et textes éditoriaux restent dans data/products.ts.
 * API injoignable : les données statiques suffisent.
 */
let live: Record<string, CatalogProduct> | null = null
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

export function refreshCatalog() {
  loading = api
    .products()
    .then((list) => {
      live = Object.fromEntries(list.map((p) => [p.slug, p]))
      listeners.forEach((l) => l())
    })
    .catch(() => {})
  return loading
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  if (!loading) refreshCatalog()
  return () => listeners.delete(cb)
}

const merge = <T extends Product>(p: T): T => {
  const l = live?.[p.slug]
  if (!l) return p
  // Pièce dépubliée, sans prix ou épuisée : affichée « en forge », non achetable.
  return { ...p, name: l.name, price: l.available ? l.price : null }
}

export function useCatalog(): Product[] {
  const snapshot = useSyncExternalStore(subscribe, () => live)
  return snapshot ? PRODUCTS.map(merge) : PRODUCTS
}

export function useProductDetail(slug: string | undefined): ProductDetail | undefined {
  const snapshot = useSyncExternalStore(subscribe, () => live)
  const base = slug ? DETAILS[slug] : undefined
  const l = slug ? snapshot?.[slug] : undefined
  if (!base || !l) return base
  return {
    ...merge(base),
    pitch: l.pitch || base.pitch,
    sizes: l.sizes.length ? l.sizes : base.sizes,
    finishes: l.finishes.length ? l.finishes : base.finishes,
    defaultSize: l.sizes.includes(base.defaultSize) ? base.defaultSize : (l.sizes[0] ?? base.defaultSize),
  }
}
