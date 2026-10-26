import { useSyncExternalStore } from 'react'

export type Theme = 'nuit' | 'os'

const read = (): Theme => (document.documentElement.dataset.theme === 'os' ? 'os' : 'nuit')

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => mo.disconnect()
}

/** Thème courant (attribut data-theme de <html>), mis à jour quand on le bascule. */
export const useTheme = () => useSyncExternalStore(subscribe, read)
