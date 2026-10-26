import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DETAILS } from '../../data/products'
import { api, type AdminProduct as Product, type ApiError } from '../../lib/api'
import { refreshCatalog } from '../../lib/catalog'
import { Field } from '../../components/checkout/Field'
import { AdminTop } from './AdminApp'

const SIZES = [50, 52, 54, 56, 57, 58, 60, 62, 64, 66]
const FINISHES: [string, string][] = [
  ['Argent rhodié', 'Rhodié'],
  ['Argent oxydé', 'Oxydé'],
  ['Or 18 k', 'Or 18 k'],
]

type Form = { name: string; pitch: string; price: string; editionTotal: string; published: boolean; sizes: number[]; finishes: string[] }

const toForm = (p: Product): Form => ({
  name: p.name,
  pitch: p.pitch ?? '',
  price: p.price === null ? '' : (p.price / 100).toFixed(2).replace('.', ','),
  editionTotal: String(p.editionTotal),
  published: p.published,
  sizes: p.sizes,
  finishes: p.finishes,
})

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

/** Édition d'un produit (maquette 36:305). */
export function AdminProduct() {
  const { slug = '' } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<Form | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [state, setState] = useState<'idle' | 'busy' | 'saved'>('idle')
  const [failure, setFailure] = useState('')

  useEffect(() => {
    api.admin.product(slug).then(
      (p) => {
        setProduct(p)
        setForm(toForm(p))
      },
      (e: Error) => setFailure(e.message),
    )
  }, [slug])

  if (!form || !product) {
    return (
      <>
        <AdminTop title="Produit" />
        {failure && <p className="checkout__failure">{failure}</p>}
      </>
    )
  }

  const edit = (patch: Partial<Form>) => {
    setForm({ ...form, ...patch })
    setState('idle')
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const price = form.price.trim() ? Math.round(Number(form.price.replace(/\s/g, '').replace(',', '.')) * 100) : null
    const errs: Record<string, string> = {}
    if (price !== null && !Number.isFinite(price)) errs.price = 'Prix invalide.'
    if (!/^\d+$/.test(form.editionTotal)) errs.editionTotal = 'Nombre de pièces invalide.'
    setErrors(errs)
    setFailure('')
    if (Object.keys(errs).length) return
    setState('busy')
    try {
      const saved = await api.admin.saveProduct(slug, {
        name: form.name.trim(),
        pitch: form.pitch.trim(),
        price,
        published: form.published,
        editionTotal: Number(form.editionTotal),
        sizes: [...form.sizes].sort((a, b) => a - b),
        finishes: FINISHES.map(([v]) => v).filter((v) => form.finishes.includes(v)),
      })
      setProduct(saved)
      setForm(toForm(saved))
      setState('saved')
      // Le site public reprend tout de suite les nouvelles valeurs.
      refreshCatalog()
    } catch (err) {
      const apiErr = err as ApiError
      setErrors(apiErr.violations ?? {})
      if (!Object.keys(apiErr.violations ?? {}).length) setFailure(apiErr.message)
      setState('idle')
    }
  }

  const remaining = product.editionTotal - product.editionSold
  const images = DETAILS[slug]?.gallery.filter((g) => g.src).slice(0, 3) ?? []

  return (
    <>
      <AdminTop title={product.name}>
        <a className="btn btn--secondary" href={`/collection/${slug}`} target="_blank" rel="noreferrer">
          Aperçu
        </a>
        {/* Le bouton est dans la barre de titre, hors du formulaire : relié par son id. */}
        <button className="btn btn--primary" type="submit" form="product-form" disabled={state === 'busy'}>
          {state === 'busy' ? 'Enregistrement…' : state === 'saved' ? 'Enregistré ✓' : 'Enregistrer'}
        </button>
      </AdminTop>

      {failure && (
        <p className="checkout__failure" role="alert">
          {failure}
        </p>
      )}

      <form id="product-form" className="product-edit" onSubmit={save} noValidate>
        <div className="product-edit__main">
          <section className="panel">
            <h2 className="t-label-s">Informations</h2>
            <Field label="Nom" value={form.name} error={errors.name} onChange={(e) => edit({ name: e.target.value })} />
            <div className={['field', errors.pitch && 'field--error'].filter(Boolean).join(' ')}>
              <label className="t-label-s" htmlFor="pitch">
                Accroche
              </label>
              <textarea id="pitch" className="field__input product-edit__pitch" value={form.pitch} onChange={(e) => edit({ pitch: e.target.value })} />
              {errors.pitch && <p className="field__error t-label-s">{errors.pitch}</p>}
            </div>
            <div className="checkout__row checkout__row--3">
              <Field label="Prix (€)" inputMode="decimal" value={form.price} placeholder="—" error={errors.price} onChange={(e) => edit({ price: e.target.value })} />
              <Field label="Série" inputMode="numeric" value={form.editionTotal} error={errors.editionTotal} onChange={(e) => edit({ editionTotal: e.target.value })} />
              <Field label="Numéro suivant" value={String(product.editionSold + 1).padStart(3, '0')} readOnly />
            </div>
          </section>

          <section className="panel">
            <h2 className="t-label-s">Variantes</h2>
            <fieldset className="field">
              <legend className="t-label-s">Tailles disponibles</legend>
              <div className="tags">
                {SIZES.map((s) => (
                  <button key={s} type="button" className={['tag', form.sizes.includes(s) && 'tag--on'].filter(Boolean).join(' ')} aria-pressed={form.sizes.includes(s)} onClick={() => edit({ sizes: toggle(form.sizes, s) })}>
                    {s}
                  </button>
                ))}
              </div>
              {errors.sizes && <p className="field__error t-label-s">{errors.sizes}</p>}
            </fieldset>
            <fieldset className="field">
              <legend className="t-label-s">Finitions</legend>
              <div className="tags">
                {FINISHES.map(([v, label]) => (
                  <button key={v} type="button" className={['tag', form.finishes.includes(v) && 'tag--on'].filter(Boolean).join(' ')} aria-pressed={form.finishes.includes(v)} onClick={() => edit({ finishes: toggle(form.finishes, v) })}>
                    {label}
                  </button>
                ))}
              </div>
              {errors.finishes && <p className="field__error t-label-s">{errors.finishes}</p>}
            </fieldset>
          </section>
        </div>

        <div className="product-edit__side">
          <section className="panel">
            <h2 className="t-label-s">Statut</h2>
            <label className="switch">
              <span>Publié sur le site</span>
              <input type="checkbox" role="switch" checked={form.published} onChange={(e) => edit({ published: e.target.checked })} />
              <span className="switch__track" aria-hidden="true" />
            </label>
            {errors.published && <p className="field__error t-label-s">{errors.published}</p>}
            <p className="t-label-s">
              {product.editionSold} vendues · {remaining} restantes
            </p>
            <div className="meter" role="meter" aria-valuemin={0} aria-valuemax={product.editionTotal} aria-valuenow={product.editionSold} aria-label="Pièces vendues">
              <span style={{ width: `${(product.editionSold / product.editionTotal) * 100}%` }} />
            </div>
          </section>

          <section className="panel">
            <h2 className="t-label-s">Médias</h2>
            <div className="product-edit__media">
              {images.map((g) => (
                <img key={g.id} src={g.src} alt={g.label} />
              ))}
            </div>
            <p className="product-edit__drop t-label-s">Rendus Blender et modèle .glb : déposés dans le code du site pour l’instant.</p>
          </section>
        </div>
      </form>
    </>
  )
}
