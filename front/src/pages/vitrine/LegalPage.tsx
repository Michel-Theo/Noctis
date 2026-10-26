import { NavLink, useParams } from 'react-router-dom'
import { LEGAL } from '../../data/legal'
import { Footer } from '../../components/Footer'
import { NotFoundPage } from './NotFoundPage'

const longDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/** Informations : mentions légales, CGV, livraison… (maquette 33:320). */
export function LegalPage() {
  const { slug = 'cgv' } = useParams()
  const page = LEGAL.find((p) => p.slug === slug)
  if (!page) return <NotFoundPage />

  return (
    <main className="vitrine legal">
      <nav className="legal__nav" aria-label="Informations">
        <p className="t-label t-accent">Informations</p>
        {LEGAL.map((p) => (
          <NavLink key={p.slug} to={`/informations/${p.slug}`} className="t-label">
            {p.nav}
          </NavLink>
        ))}
      </nav>
      <article className="legal__body" key={page.slug}>
        <h1 className="legal__title">{page.title}</h1>
        <p className="t-label-s">Dernière mise à jour&nbsp;: {longDate(page.updated)}</p>
        {page.sections.map((s) => (
          <section key={s.title}>
            <h2 className="t-h3">{s.title}</h2>
            <p>{s.text}</p>
          </section>
        ))}
      </article>
      <div className="product__footer legal__footer">
        <Footer />
      </div>
    </main>
  )
}
