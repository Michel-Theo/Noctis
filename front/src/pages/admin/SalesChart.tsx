import { useState } from 'react'
import { formatPrice } from '../../data/products'

type Month = { month: string; revenue: number; orders: number }

const monthName = (m: string, style: 'short' | 'long' = 'short') =>
  new Date(`${m}-01T12:00:00`).toLocaleDateString('fr-FR', style === 'short' ? { month: 'short' } : { month: 'long', year: 'numeric' })
const compact = (cents: number) => (cents >= 100000 ? `${(cents / 100000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k` : String(cents / 100))

/** Haut d'axe dont la moitié reste un chiffre rond (1 k / 2 k, 1,5 k / 3 k…). */
function niceMax(max: number) {
  const steps = [100000, 200000, 300000, 400000, 600000, 800000, 1000000, 2000000, 3000000, 4000000, 6000000, 10000000]
  return steps.find((s) => s >= max) ?? Math.ceil(max / 2000000) * 2000000
}

/**
 * Ventes mensuelles : une seule série (pas de légende), le mois choisi en accent avec sa valeur
 * au sommet, les autres en gris. Chaque barre est focusable et porte son infobulle ; un tableau
 * caché reprend toutes les valeurs pour les lecteurs d'écran.
 */
export function SalesChart({ data, current }: { data: Month[]; current: string }) {
  const [hover, setHover] = useState<string | null>(null)
  const max = niceMax(Math.max(1, ...data.map((d) => d.revenue)))
  const ticks = [0, max / 2, max]
  const tip = data.find((d) => d.month === hover)

  return (
    <figure className="chart">
      <div className="chart__plot">
        <div className="chart__grid" aria-hidden="true">
          {[...ticks].reverse().map((t) => (
            <span key={t} className="chart__tick">
              {compact(t)}
            </span>
          ))}
        </div>
        <div className="chart__bars">
          {data.map((d) => {
            const h = (d.revenue / max) * 100
            const on = d.month === current
            return (
              <div
                key={d.month}
                className={['chart__col', on && 'is-current', hover === d.month && 'is-hover'].filter(Boolean).join(' ')}
                tabIndex={0}
                aria-label={`${monthName(d.month, 'long')} : ${formatPrice(d.revenue)}, ${d.orders} commandes`}
                onPointerEnter={() => setHover(d.month)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(d.month)}
                onBlur={() => setHover(null)}
              >
                {on && (
                  <span className="chart__value" style={{ bottom: `calc(${h}% + 8px)` }}>
                    {formatPrice(d.revenue).replace(',00', '')}
                  </span>
                )}
                <span className="chart__bar" style={{ height: `${h}%` }} />
                {hover === d.month && tip && (
                  <span className="chart__tip" role="tooltip" style={{ bottom: `calc(${h}% + 12px)` }}>
                    <strong>
                      {formatPrice(tip.revenue).replace(',00', '')} · {tip.orders} commande{tip.orders > 1 ? 's' : ''}
                    </strong>
                    <span>{monthName(tip.month, 'long')}</span>
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="chart__axis" aria-hidden="true">
        {data.map((d) => (
          <span key={d.month} className={d.month === current ? 'is-current' : undefined}>
            {monthName(d.month)}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Ventes mensuelles</caption>
        <thead>
          <tr>
            <th>Mois</th>
            <th>Chiffre d'affaires</th>
            <th>Commandes</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{monthName(d.month, 'long')}</td>
              <td>{formatPrice(d.revenue)}</td>
              <td>{d.orders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
