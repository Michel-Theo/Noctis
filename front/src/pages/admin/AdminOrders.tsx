import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, type AdminOrder, type OrderFilter } from '../../lib/api'
import { AdminTop } from './AdminApp'
import { OrdersTable } from './OrdersTable'

const FILTERS: [OrderFilter, string][] = [
  ['all', 'Toutes'],
  ['paid', 'À couler'],
  ['production', 'En fabrication'],
  ['shipped', 'Expédiées'],
  ['delivered', 'Livrées'],
]

/** Libellé de l'action groupée selon l'étape suivante commune à la sélection. */
const NEXT: Record<string, string> = {
  paid: 'Marquer comme coulée',
  cast: 'Marquer comme polie',
  polished: 'Marquer comme expédiée',
  shipped: 'Marquer comme livrée',
}

/** Commandes (maquette 36:144). */
export function AdminOrders() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') as OrderFilter) || 'all'
  const q = params.get('q') ?? ''
  const [data, setData] = useState<{ counts: Record<OrderFilter, number>; orders: AdminOrder[] } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const [reload, setReload] = useState(0)
  const [today] = useState(() => new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }))

  useEffect(() => {
    api.admin.orders(status, q).then(setData, (e: Error) => setFailure(e.message))
  }, [status, q, reload])

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v && !(k === 'status' && v === 'all')) next.set(k, v)
      else next.delete(k)
    }
    setParams(next, { replace: true })
    setSelected(new Set())
  }

  const toggle = (ref: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(ref)) n.delete(ref)
      else n.add(ref)
      return n
    })

  const orders = data?.orders ?? []
  const chosen = orders.filter((o) => selected.has(o.reference))
  const steps = new Set(chosen.map((o) => o.status))
  const delivered = chosen.some((o) => o.status === 'delivered')
  const action = steps.size === 1 ? NEXT[[...steps][0]] : 'Passer à l’étape suivante'

  const advance = async () => {
    setBusy(true)
    setFailure('')
    try {
      await api.admin.advance(chosen.map((o) => o.reference))
      setSelected(new Set())
      setReload((r) => r + 1)
    } catch (e) {
      setFailure((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <AdminTop title="Commandes" q={q} onSearch={(value) => set({ q: value })}>
        <a className="btn btn--secondary" href={api.admin.csvUrl(status, q)} download>
          Exporter CSV
        </a>
      </AdminTop>

      <div className="tags admin__filters" role="group" aria-label="Statut">
        {FILTERS.map(([id, label]) => (
          <button key={id} className={['tag', status === id && 'tag--on'].filter(Boolean).join(' ')} aria-pressed={status === id} onClick={() => set({ status: id })}>
            {label} · {data?.counts[id] ?? '…'}
          </button>
        ))}
      </div>

      {failure && (
        <p className="checkout__failure" role="alert">
          {failure}
        </p>
      )}

      <div className={['panel', 'panel--flush', !data && 'is-loading'].filter(Boolean).join(' ')}>
        <OrdersTable
          orders={orders}
          selected={selected}
          onToggle={toggle}
          onToggleAll={() => setSelected(orders.every((o) => selected.has(o.reference)) ? new Set() : new Set(orders.map((o) => o.reference)))}
        />
      </div>

      {chosen.length > 0 && (
        <div className="bulk" role="region" aria-label="Action groupée">
          <span className="t-label">
            {chosen.length} commande{chosen.length > 1 ? 's' : ''} sélectionnée{chosen.length > 1 ? 's' : ''}
          </span>
          <button className="btn btn--primary" onClick={advance} disabled={busy || delivered} title={delivered ? 'Une commande livrée ne peut plus avancer.' : undefined}>
            {busy ? 'Un instant…' : action}
          </button>
          <button className="t-label link-draw" onClick={() => window.print()}>
            Imprimer le bon de fonte
          </button>
        </div>
      )}

      {/* Bon de fonte : n'apparaît qu'à l'impression, avec les pièces des commandes sélectionnées. */}
      <section className="print-sheet" aria-hidden="true">
        <h1>NOCTIS · Bon de fonte</h1>
        <p>{today}</p>
        <table>
          <thead>
            <tr>
              <th>Commande</th>
              <th>Pièce</th>
              <th>Finition</th>
              <th>Taille</th>
              <th>N° de série</th>
            </tr>
          </thead>
          <tbody>
            {chosen.flatMap((o) =>
              o.items.map((i, k) => (
                <tr key={`${o.reference}-${k}`}>
                  <td>{o.reference}</td>
                  <td>
                    {i.name}
                    {i.quantity > 1 && ` ×${i.quantity}`}
                  </td>
                  <td>{i.finish}</td>
                  <td>{i.size || '—'}</td>
                  <td>{i.serials.map((s) => String(s).padStart(3, '0')).join(', ')}</td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}
