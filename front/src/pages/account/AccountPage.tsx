import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import { api, type AccountOrder, type AccountOrders, type Piece } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'
import { thumbOf } from '../../lib/lines'
import { Footer } from '../../components/Footer'
import { AuthPanel } from './AuthPanel'
import { Certificate } from './Certificate'

const day = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const pad = (n: number) => String(n).padStart(3, '0')
const names = (o: AccountOrder) => [...new Set(o.lines.map((l) => l.name))].join(' · ')

/** /compte : connexion si personne n'est connecté, sinon les commandes (maquettes 35:58 et M11). */
export function AccountPage() {
  const { user } = useAuth()
  if (user === undefined) return <main className="account" aria-busy="true" />
  if (!user) return <AuthPanel />
  return <Dashboard />
}

function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<AccountOrders | null>(null)
  const [failed, setFailed] = useState(false)
  const [certificate, setCertificate] = useState<Piece | null>(null)

  useEffect(() => {
    api.myOrders().then(setData, () => setFailed(true))
  }, [])

  const since = new Date(user!.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })

  const signOut = async () => {
    await logout()
    navigate('/')
  }

  return (
    <main className="account">
      <aside className="account__menu">
        <div className="account__hello">
          <p className="account__name">Bonsoir, {user!.firstName}</p>
          <p className="t-label-s">Veilleur depuis {since}</p>
        </div>
        <nav className="account__nav" aria-label="Mon compte">
          <a href="#commandes" className="t-label is-current">
            Commandes
          </a>
          <a href="#pieces" className="t-label">
            Mes pièces
          </a>
          <button className="t-label" onClick={signOut}>
            Se déconnecter
          </button>
        </nav>
      </aside>

      <div className="account__main">
        <h1 id="commandes" className="t-display-l account__title">
          Commandes
        </h1>

        {failed && <p className="checkout__failure">Impossible de charger vos commandes pour le moment.</p>}
        {data && !data.current && !data.history.length && (
          <div className="account__empty">
            <p className="t-body-l">Aucune pièce commandée pour l'instant.</p>
            <Link to="/#collection" className="btn btn--secondary">
              Découvrir la collection
            </Link>
          </div>
        )}

        {data?.current && <CurrentOrder order={data.current} />}

        {!!data?.history.length && (
          <section className="history" aria-labelledby="history-title">
            <h2 id="history-title" className="t-label history__title">
              Historique
            </h2>
            <table className="history__table">
              <thead>
                <tr>
                  {['N°', 'Date', 'Pièces', 'Statut', 'Total'].map((h) => (
                    <th key={h} className="t-label-s">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.history.map((o) => (
                  <tr key={o.reference}>
                    <td>
                      <Link to={`/commande/confirmation/${o.reference}?token=${o.token}`} className="link-draw">
                        {o.reference}
                      </Link>
                      <span className="t-label-s history__sub">
                        {names(o)} · {o.statusLabel}
                      </span>
                    </td>
                    <td>{day(o.paidAt)}</td>
                    <td>{names(o)}</td>
                    <td>{o.statusLabel}</td>
                    <td className="history__total">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {!!data?.pieces.length && (
          <section id="pieces" className="pieces" aria-label="Mes pièces">
            {data.pieces.map((p) => (
              <article key={`${p.slug}-${p.serial}`} className="piece">
                <img src={thumbOf(p.slug)} alt="" />
                <div>
                  <h2 className="t-h3">
                    Certificat {p.name} — N° {pad(p.serial)} / {pad(p.editionTotal)}
                  </h2>
                  <p className="piece__text">Chaque pièce possède son certificat numérique : numéro, date de fonte, entretien.</p>
                </div>
                <button className="t-label link-draw" onClick={() => setCertificate(p)}>
                  Voir le certificat
                </button>
              </article>
            ))}
          </section>
        )}
      </div>

      <div className="product__footer account__footer">
        <Footer />
      </div>
      <Certificate piece={certificate} onClose={() => setCertificate(null)} />
    </main>
  )
}

function CurrentOrder({ order }: { order: AccountOrder }) {
  const done = order.timeline.filter((s) => s.done).length
  const step = order.timeline.find((s) => s.current) ?? order.timeline[order.timeline.length - 1]
  const thumbs = [...new Set(order.lines.map((l) => l.slug))]
  return (
    <section className="current" aria-label="Commande en cours">
      <div className="current__head">
        <div>
          <p className="t-label-s">
            N° {order.reference} · {day(order.paidAt)}
          </p>
          <p className="current__status">{order.statusLabel}</p>
        </div>
        <span className="current__total">{formatPrice(order.total)}</span>
      </div>
      <ol className="current__steps" style={{ '--done': done, '--steps': order.timeline.length } as React.CSSProperties}>
        {order.timeline.map((s) => (
          <li key={s.key} className={['t-label-s', s.done && 'is-done'].filter(Boolean).join(' ')} aria-current={s.current ? 'step' : undefined}>
            {s.label}
          </li>
        ))}
      </ol>
      <p className="t-label-s current__step-mobile" style={{ '--progress': done / order.timeline.length } as React.CSSProperties}>
        Étape {Math.min(done + 1, order.timeline.length)} / {order.timeline.length} · {step.label}
      </p>
      <div className="current__foot">
        <div className="current__thumbs">
          {thumbs.map((slug) => (
            <img key={slug} src={thumbOf(slug)} alt="" />
          ))}
        </div>
        <p className="current__names">{names(order)}</p>
        <Link to={`/commande/confirmation/${order.reference}?token=${order.token}`} className="btn btn--secondary">
          Détails
        </Link>
      </div>
    </section>
  )
}
