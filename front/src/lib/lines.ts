import { DETAILS, PRODUCTS } from '../data/products'
import type { CartLine } from './cart-context'

export const thumbOf = (slug: string) => PRODUCTS.find((p) => p.slug === slug)?.card ?? '/img/produit/34_nuit.webp'

/** « Argent rhodié · Taille 57 · N° 001 » */
export function lineSub(l: Pick<CartLine, 'slug' | 'finish' | 'size'>, withSerial = true) {
  const serial = DETAILS[l.slug]?.serial.split(' / ')[0]
  return [l.finish, `Taille ${l.size}`, withSerial && serial].filter(Boolean).join(' · ')
}
