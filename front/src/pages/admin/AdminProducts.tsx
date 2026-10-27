import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../../data/products'
import { api, type AdminProduct } from '../../lib/api'
import { AdminTop } from './AdminApp'

type Row = Pick<AdminProduct, 'slug' | 'name' | 'price' | 'published' | 'editionTotal' | 'editionSold'>

/** Liste des produits (non maquettée : même tableau que les commandes), vers la fiche d'édition. */
export function AdminProducts() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [failure, setFailure] = useState('')

  useEffect(() => {
    api.admin.products().then(setRows, (e: Error) => setFailure(e.message))
  }, [])

  return (
    <>
      <AdminTop title="Produits" />
      {failure && <p className="checkout__failure">{failure}</p>}
      <div className={['panel', 'panel--flush', !rows && 'is-loading'].filter(Boolean).join(' ')}>
        <table className="admin-table admin-table--products">
          <thead>
            <tr>
              {['Pièce', 'Prix', 'Série', 'Statut'].map((h) => (
                <th key={h} className="t-label-s">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows?.map((p) => (
              <tr key={p.slug}>
                <td>
                  <Link to={`/admin/produits/${p.slug}`} className="link-draw">
                    {p.name}
                  </Link>
                </td>
                <td className="admin-table__total">{p.price === null ? '—' : formatPrice(p.price)}</td>
                <td className="admin-table__muted">
                  {p.editionSold} / {p.editionTotal}
                </td>
                <td>
                  <span className={`badge ${p.published ? 'badge--paid' : 'badge--off'}`}>{p.published ? 'Publiée' : 'En forge'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
