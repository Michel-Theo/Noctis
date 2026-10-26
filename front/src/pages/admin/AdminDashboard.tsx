import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import { api, type Dashboard } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'
import { AdminTop, StatusBadge } from './AdminApp'
import { SalesChart } from './SalesChart'
import { OrdersTable } from './OrdersTable'

const euros = (cents: number) => formatPrice(cents).replace(',00', '')
const monthLabel = (m: string) => new Date(`${m}-01T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

/** Six derniers mois, du plus récent au plus ancien : choix du mois affiché. */
function lastMonths(n = 6) {
  const d = new Date()
  return Array.from({ length: n }, (_, i) => {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
    return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
  })
}

const PRODUCTION = [
  ['paid', 'À couler'],
  ['cast', 'Coulée'],
  ['polished', 'Polissage'],
  ['shipped', 'Expédiée'],
] as const

/** Tableau de bord (maquette 36:5). */
export function AdminDashboard() {
  const { user } = useAuth()
  const months = useMemo(() => lastMonths(), [])
  const [month, setMonth] = useState(months[0])
  const [data, setData] = useState<Dashboard | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    api.admin.dashboard(month).then(setData, () => setFailed(true))
  }, [month])

  const previous = data ? monthLabel(data.monthly[data.monthly.length - 2]?.month ?? month).split(' ')[0] : ''

  return (
    <>
      <AdminTop title={`Bonsoir, ${user!.firstName}`}>
        <label className="admin__month">
          <span className="sr-only">Mois affiché</span>
          <select className="btn btn--secondary" value={month} onChange={(e) => setMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </label>
      </AdminTop>

      {failed && <p className="checkout__failure">Impossible de charger le tableau de bord.</p>}

      {data && (
        <div className={['dash', !data && 'is-loading'].filter(Boolean).join(' ')}>
          <section className="kpis" aria-label="Indicateurs du mois">
            <article className="kpi">
              <p className="t-label-s">Chiffre d'affaires</p>
              <p className="kpi__value">{euros(data.revenue)}</p>
              <p className="t-label-s">
                {data.revenueDelta === null ? 'Premier mois de ventes' : `${data.revenueDelta > 0 ? '+' : ''}${data.revenueDelta} % vs ${previous}`}
              </p>
            </article>
            <article className="kpi">
              <p className="t-label-s">Commandes</p>
              <p className="kpi__value">{data.orders}</p>
              <p className="t-label-s">dont {data.inProduction} en fabrication</p>
            </article>
            <article className="kpi">
              <p className="t-label-s">Panier moyen</p>
              <p className="kpi__value">{euros(data.averageBasket)}</p>
              <p className="t-label-s">
                {data.averageBasketDelta === null ? '—' : `${data.averageBasketDelta >= 0 ? '+' : '−'}${euros(Math.abs(data.averageBasketDelta))} vs ${previous}`}
              </p>
            </article>
            <article className="kpi">
              <p className="t-label-s">Séries vendues</p>
              {data.series.map((s) => (
                <div key={s.slug} className="kpi__series">
                  <p className="kpi__serie">
                    {s.name} · {s.sold} / {s.total}
                  </p>
                  <p className="t-label-s">{Math.round((s.sold / s.total) * 100)} % de la série</p>
                </div>
              ))}
            </article>
          </section>

          <section className="panel dash__chart" aria-labelledby="sales-title">
            <h2 id="sales-title" className="t-label-s">
              Ventes mensuelles (€)
            </h2>
            <SalesChart data={data.monthly} current={data.month} />
            <p className="t-label-s">Lancement de Couronne I le 12 septembre. Survol d'une barre : montant et nombre de commandes.</p>
          </section>

          <section className="panel dash__production" aria-labelledby="production-title">
            <h2 id="production-title" className="t-label-s">
              Fabrication en cours
            </h2>
            <ul>
              {PRODUCTION.map(([k, label]) => (
                <li key={k}>
                  <StatusBadge status={k} label={label} />
                  <span className="dash__count">{data.production[k]}</span>
                </li>
              ))}
            </ul>
            <Link to="/admin/commandes?status=production" className="t-label link-draw">
              Ouvrir le tableau de fabrication
            </Link>
          </section>

          <section className="panel dash__latest" aria-labelledby="latest-title">
            <h2 id="latest-title" className="t-label-s">
              Dernières commandes
            </h2>
            <OrdersTable orders={data.latest} compact />
          </section>
        </div>
      )}
    </>
  )
}
