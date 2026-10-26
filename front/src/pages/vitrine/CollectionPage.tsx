import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { type Product } from '../../data/products'
import { useCatalog } from '../../lib/catalog'
import { ProductCard } from '../../components/ProductCard'
import { Footer } from '../../components/Footer'
import { useReveal } from '../../lib/useReveal'

const FAMILIES: { id: Product['type'] | 'tout'; label: string }[] = [
  { id: 'tout', label: 'Tout' },
  { id: 'bague', label: 'Bagues' },
  { id: 'chaine', label: 'Chaînes' },
  { id: 'boucle', label: 'Boucles' },
]

const SORTS = {
  nouveautes: 'Nouveautés',
  'prix-asc': 'Prix croissant',
  'prix-desc': 'Prix décroissant',
} as const
type Sort = keyof typeof SORTS

/** Collection Nocturne (maquettes 32:3 et M6) : filtres par famille, disponibilité, tri. */
export function CollectionPage() {
  const root = useRef<HTMLElement>(null)
  const [family, setFamily] = useState<(typeof FAMILIES)[number]['id']>('tout')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [sort, setSort] = useState<Sort>('nouveautes')
  const catalog = useCatalog()

  const pieces = useMemo(() => {
    const list = catalog.filter((p) => (family === 'tout' || p.type === family) && (!onlyAvailable || p.price !== null))
    if (sort === 'nouveautes') return list
    // Les pièces en forge, sans prix, restent en fin de liste.
    const price = (p: Product) => p.price ?? (sort === 'prix-asc' ? Infinity : -Infinity)
    return [...list].sort((a, b) => (sort === 'prix-asc' ? price(a) - price(b) : price(b) - price(a)))
  }, [catalog, family, onlyAvailable, sort])

  useReveal(root)

  return (
    <main ref={root} className="vitrine">
      <header className="intro vitrine__intro">
        <p className="t-label t-accent">Collection</p>
        <h1 className="vitrine__title">Nocturne</h1>
        <p className="t-body-l vitrine__lead">Sept pièces forgées pour la nuit. Chaque modèle est numéroté et coulé à la commande.</p>
      </header>

      <div className="filters">
        <div className="tags" role="group" aria-label="Famille">
          {FAMILIES.map((f) => {
            const n = f.id === 'tout' ? catalog.length : catalog.filter((p) => p.type === f.id).length
            return (
              <button key={f.id} className={['tag', family === f.id && 'tag--on'].filter(Boolean).join(' ')} aria-pressed={family === f.id} onClick={() => setFamily(f.id)}>
                {f.label} <span className="filters__count">· {n}</span>
              </button>
            )
          })}
        </div>
        <div className="filters__right">
          <label className="filters__switch t-label-s">
            Disponibles uniquement
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
            <span aria-hidden="true" />
          </label>
          <label className="filters__sort t-label">
            Trier&nbsp;:
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <section className="collection-grid" aria-live="polite">
        {pieces.map((p) => (
          <ProductCard key={p.slug} p={p} />
        ))}
        {!pieces.length && <p className="t-body-l collection-grid__empty">Aucune pièce de cette famille n'est encore disponible.</p>}
        <aside className="collection-grid__note">
          <p className="t-label-s t-accent">Pièces numérotées</p>
          <p className="collection-grid__claim">Chaque modèle n'existe qu'en 150 exemplaires. Après, la fonte s'éteint.</p>
          <Link to="/atelier" className="t-label link-draw">
            L'atelier
          </Link>
        </aside>
      </section>

      <div className="product__footer">
        <Footer />
      </div>
    </main>
  )
}
