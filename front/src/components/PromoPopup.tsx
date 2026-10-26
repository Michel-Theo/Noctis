import { useEffect, useRef, useState } from 'react'
import { readCheckout, saveCheckout } from '../lib/checkout'
import { lockScroll } from '../lib/scroll'
import { Sigil } from './Sigil'

const CODE = 'NUIT10'
const SEEN = 'noctis-promo-vue'

const seen = () => {
  try {
    return localStorage.getItem(SEEN) === '1' || readCheckout().code.toUpperCase() === CODE
  } catch {
    return false
  }
}

/**
 * Code de la nuit, proposé une seule fois par visiteur à son arrivée sur la collection.
 * « Appliquer » enregistre le code pour le panier et le tunnel : rien à recopier.
 */
export function PromoPopup({ delay = 1800 }: { delay?: number }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [state, setState] = useState<'idle' | 'applied' | 'copied'>('idle')

  useEffect(() => {
    if (seen()) return
    const t = window.setTimeout(() => {
      dialog.current?.showModal()
      lockScroll(true)
      try {
        localStorage.setItem(SEEN, '1')
      } catch {
        /* stockage indisponible : la pop-up pourra revenir */
      }
    }, delay)
    return () => window.clearTimeout(t)
  }, [delay])

  const close = () => {
    dialog.current?.close()
  }

  const apply = () => {
    saveCheckout({ code: CODE })
    setState('applied')
    window.setTimeout(close, 1400)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CODE)
      setState('copied')
    } catch {
      /* presse-papiers refusé : le code reste lisible */
    }
  }

  return (
    <dialog
      ref={dialog}
      className="size-guide promo"
      aria-labelledby="promo-title"
      onClose={() => lockScroll(false)}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="size-guide__inner promo__inner">
        <button className="t-label link-draw promo__close" onClick={close}>
          Fermer ✕
        </button>
        <Sigil size={56} accent />
        <p className="t-label-s t-accent">Code de la nuit</p>
        <h2 id="promo-title" className="t-h1 promo__title">
          −10&nbsp;% sur votre commande
        </h2>
        <p className="size-guide__intro">Valable sur toute la collection Nocturne, cumulable avec la livraison offerte dès 150&nbsp;€.</p>
        <button className="promo__code" onClick={copy} aria-label={`Copier le code ${CODE}`}>
          {CODE}
          <span className="t-label-s">{state === 'copied' ? 'Copié ✓' : 'Copier'}</span>
        </button>
        <button className="btn btn--primary btn--block" autoFocus onClick={apply} disabled={state === 'applied'}>
          {state === 'applied' ? 'Code appliqué à votre panier ✓' : 'Appliquer à mon panier'}
        </button>
      </div>
    </dialog>
  )
}
