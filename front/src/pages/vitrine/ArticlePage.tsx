import { useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ARTICLES, articleDate } from '../../data/journal'
import { Footer } from '../../components/Footer'
import { useReveal } from '../../lib/useReveal'
import { NotFoundPage } from './NotFoundPage'

/** Journal — article (maquette 33:159). */
export function ArticlePage() {
  const { slug } = useParams()
  const root = useRef<HTMLElement>(null)
  const i = ARTICLES.findIndex((a) => a.slug === slug)
  useReveal(root, slug)
  if (i < 0) return <NotFoundPage />

  const a = ARTICLES[i]
  // Navigation circulaire : l'article précédent et le suivant dans le journal.
  const prev = ARTICLES[(i - 1 + ARTICLES.length) % ARTICLES.length]
  const next = ARTICLES[(i + 1) % ARTICLES.length]

  return (
    <main ref={root} className="vitrine post">
      <header className="intro post__head">
        <p className="t-label-s t-accent">
          {a.category} · {a.minutes} min · {articleDate(a.date)}
        </p>
        <h1 className="post__title">{a.title}</h1>
      </header>
      <img className="post__cover reveal" src={a.cover} alt="" />

      <article className="post__body">
        {a.body.map((b, k) => {
          if (b.type === 'lead' || b.type === 'p')
            return (
              <p key={k} className={`post__${b.type} reveal`}>
                {b.text}
              </p>
            )
          if (b.type === 'quote') return <blockquote key={k} className="post__quote reveal">{b.text}</blockquote>
          return (
            <div key={k} className="post__images reveal">
              {b.images.map((src) => (
                <img key={src} src={src} alt="" loading="lazy" />
              ))}
            </div>
          )
        })}
      </article>

      <nav className="post__nav" aria-label="Autres articles">
        <Link to={`/journal/${prev.slug}`} className="post__link">
          ← {prev.title}
        </Link>
        {a.product && (
          <Link to={`/collection/${a.product.slug}`} className="btn btn--primary">
            {a.product.label}
          </Link>
        )}
        <Link to={`/journal/${next.slug}`} className="post__link post__link--next">
          {next.title} →
        </Link>
      </nav>

      <div className="product__footer">
        <Footer />
      </div>
    </main>
  )
}
