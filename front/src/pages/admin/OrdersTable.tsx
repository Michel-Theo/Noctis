import { Link } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import type { AdminOrder } from '../../lib/api'
import { StatusBadge } from './AdminApp'

const euros = (cents: number) => formatPrice(cents).replace(',00', '')
const day = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

/** « Couronne I ×2, Chaîne Veille » */
const pieces = (o: AdminOrder) => o.items.map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name)).join(', ')

/** Tableau des commandes : version courte (tableau de bord) ou complète, avec sélection (page Commandes). */
export function OrdersTable({
  orders,
  compact = false,
  selected,
  onToggle,
  onToggleAll,
}: {
  orders: AdminOrder[]
  compact?: boolean
  selected?: Set<string>
  onToggle?: (ref: string) => void
  onToggleAll?: () => void
}) {
  const selectable = !!selected
  return (
    <table className={['admin-table', 'admin-table--orders', compact && 'admin-table--compact'].filter(Boolean).join(' ')}>
      <thead>
        <tr>
          {selectable && (
            <th className="admin-table__check">
              <input
                type="checkbox"
                aria-label="Tout sélectionner"
                checked={orders.length > 0 && orders.every((o) => selected.has(o.reference))}
                onChange={onToggleAll}
              />
            </th>
          )}
          <th className="t-label-s">N°</th>
          {!compact && <th className="t-label-s">Date</th>}
          <th className="t-label-s">Client</th>
          <th className="t-label-s">Pièces</th>
          {!compact && <th className="t-label-s">Taille</th>}
          <th className="t-label-s">Statut</th>
          <th className="t-label-s">Total</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.reference} className={selected?.has(o.reference) ? 'is-selected' : undefined}>
            {selectable && (
              <td className="admin-table__check">
                <input type="checkbox" aria-label={`Sélectionner ${o.reference}`} checked={selected.has(o.reference)} onChange={() => onToggle?.(o.reference)} />
              </td>
            )}
            <td className="cell-ref">
              <Link to={`/commande/confirmation/${o.reference}?token=${o.token}`} target="_blank" className="link-draw">
                {o.reference}
              </Link>
            </td>
            {!compact && <td className="admin-table__muted cell-date">{day(o.paidAt)}</td>}
            <td className="admin-table__muted cell-client" title={o.email}>
              {o.customer}
            </td>
            <td className="admin-table__muted cell-pieces">{pieces(o)}</td>
            {!compact && <td className="admin-table__muted cell-size">T. {[...new Set(o.items.map((i) => i.size))].join(', ') || '—'}</td>}
            <td className="cell-status">
              <StatusBadge status={o.status} label={o.statusLabel} />
            </td>
            <td className="admin-table__total cell-total">{euros(o.total)}</td>
          </tr>
        ))}
        {!orders.length && (
          <tr>
            <td colSpan={8} className="admin-table__empty">
              Aucune commande.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
