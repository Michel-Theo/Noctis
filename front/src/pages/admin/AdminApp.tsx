import { useEffect, useRef } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth-context'
import { Sigil } from '../../components/Sigil'
import { AdminDashboard } from './AdminDashboard'
import { AdminOrders } from './AdminOrders'
import { AdminProducts } from './AdminProducts'
import { AdminProduct } from './AdminProduct'
import { AdminEmails } from './AdminEmails'

const NAV = [
  ['Tableau de bord', '/admin', true],
  ['Commandes', '/admin/commandes', false],
  ['Produits', '/admin/produits', false],
  ['E-mails', '/admin/emails', false],
] as const

/**
 * Back-office (maquettes page 10). Accès : compte avec le rôle admin.
 * Pas connecté → page de connexion, qui ramène ici ensuite.
 */
export function AdminApp() {
  const { user } = useAuth()
  const { pathname } = useLocation()

  if (user === undefined) return <main className="admin" aria-busy="true" />
  if (!user) return <Navigate to={`/compte?next=${encodeURIComponent(pathname)}`} replace />
  if (!user.admin) {
    return (
      <main className="lost">
        <div className="lost__body">
          <Sigil size={64} />
          <h1 className="t-h1">Accès réservé à l'atelier</h1>
          <p className="t-body-l">Ce compte n'a pas accès au back-office.</p>
          <Link to="/" className="btn btn--secondary">
            Retour au site
          </Link>
        </div>
      </main>
    )
  }

  return (
    <div className="admin">
      <aside className="admin__side">
        <Link to="/" className="admin__brand" title="Retour au site">
          <Sigil size={22} />
          <span className="t-label">NOCTIS · Atelier</span>
        </Link>
        <nav className="admin__nav" aria-label="Back-office">
          {NAV.map(([label, to, end]) => (
            <NavLink key={to} to={to} end={end} className="t-label">
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="t-label-s admin__who">
          {user.firstName} {user.lastName.charAt(0)}. · Admin
        </p>
      </aside>
      <div className="admin__main">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="commandes" element={<AdminOrders />} />
          <Route path="produits" element={<AdminProducts />} />
          <Route path="produits/:slug" element={<AdminProduct />} />
          <Route path="emails" element={<AdminEmails />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  )
}

/** Barre de titre des écrans admin : titre, recherche (⌘K / Ctrl K), actions. */
export function AdminTop({ title, q, onSearch, children }: { title: string; q?: string; onSearch?: (q: string) => void; children?: React.ReactNode }) {
  const input = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className="admin__top">
      <h1 className="admin__title">{title}</h1>
      <div className="admin__actions">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            const value = input.current?.value.trim() ?? ''
            // Hors de la liste des commandes, la recherche y mène.
            if (onSearch) onSearch(value)
            else navigate(`/admin/commandes?q=${encodeURIComponent(value)}`)
          }}
        >
          <input ref={input} className="admin__search" defaultValue={q} placeholder="Rechercher…  ⌘K" aria-label="Rechercher une commande" />
        </form>
        {children}
      </div>
    </header>
  )
}

const BADGES: Record<string, string> = { paid: '○', cast: '◐', polished: '◑', shipped: '→', delivered: '✓' }

export function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span className={`badge badge--${status}`}>
      <span aria-hidden="true">{BADGES[status] ?? '●'}</span> {label}
    </span>
  )
}
