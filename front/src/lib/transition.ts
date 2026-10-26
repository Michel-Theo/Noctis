/**
 * Transition « carte → fiche produit » (FLIP) : la carte cliquée mémorise sa position,
 * la fiche produit part de ce rectangle pour s'agrandir jusqu'à son emplacement final.
 */
let flipFrom: DOMRect | null = null
let clearTimer = 0

export function rememberCard(el: HTMLElement) {
  flipFrom = el.getBoundingClientRect()
}

export const hasCardRect = () => flipFrom !== null

/**
 * Lu par la fiche produit. Effacé un peu plus tard plutôt qu'immédiatement :
 * en mode strict, React rejoue les effets une seconde fois au montage.
 */
export function takeCardRect() {
  const r = flipFrom
  window.clearTimeout(clearTimer)
  clearTimer = window.setTimeout(() => (flipFrom = null), 500)
  return r
}
