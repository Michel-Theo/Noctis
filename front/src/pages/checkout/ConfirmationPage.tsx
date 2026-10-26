import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api, type Order } from '../../lib/api'
import { prefersReducedMotion } from '../../lib/scroll'
import { Sigil } from '../../components/Sigil'

const day = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

/** Confirmation (maquettes 34:198 et M9) : le sigil se grave, puis le poignard s'allume en rouge. */
export function ConfirmationPage() {
  const { reference = '' } = useParams()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [order, setOrder] = useState<Order | null>(null)
  const [failed, setFailed] = useState(false)
  const [lit, setLit] = useState(false)

  useEffect(() => {
    api.order(reference, token).then(setOrder, () => setFailed(true))
  }, [reference, token])

  useEffect(() => {
    if (!order) return
    const t = window.setTimeout(() => setLit(true), prefersReducedMotion() ? 0 : 1900)
    return () => window.clearTimeout(t)
  }, [order])

  if (failed) {
    return (
      <main className="confirm">
        <h1 className="t-h1">Commande introuvable</h1>
        <p className="t-body-l">Le lien est peut-être incomplet. Vérifiez l'e-mail de confirmation.</p>
        <Link to="/" className="btn btn--secondary">
          Retour à l'accueil
        </Link>
      </main>
    )
  }
  if (!order) return <main className="confirm" aria-busy="true" />

  const done = order.timeline.filter((s) => s.done).length

  return (
    <main className="confirm">
      <Sigil size={140} draw accent={lit} className="confirm__sigil" />
      <p className="t-label t-accent">Commande N° {order.reference}</p>
      <h1 className="t-display-l confirm__title">
        Votre relique
        <br />
        est en route.
      </h1>
      <p className="t-body-l confirm__text">
        Merci, {order.firstName}. La fonte commence cette nuit. Vous recevrez un e-mail à chaque étape&nbsp;: coulée, polissage,
        expédition.
      </p>
      <ol className="timeline" style={{ '--done': done } as React.CSSProperties}>
        {order.timeline.map((s) => (
          <li key={s.key} className={s.done ? 'is-done' : undefined}>
            <span className="t-label">{s.label}</span>
            <span className="t-label-s">
              {s.done ? '' : '≈ '}
              {day(s.date)}
            </span>
          </li>
        ))}
      </ol>
      <div className="confirm__actions">
        <Link to="/collection" className="t-label link-draw">
          Retour à la collection
        </Link>
      </div>
    </main>
  )
}
