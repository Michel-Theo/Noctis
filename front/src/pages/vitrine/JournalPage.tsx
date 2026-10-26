import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ARTICLES, articleDate, type Article } from '../../data/journal'
import { Footer } from '../../components/Footer'
import { useReveal } from '../../lib/useReveal'

const CATEGORIES = ['Tout', 'Atelier', 'Inspirations', 'Entretien'] as const

const meta = (a: Article, withDate = false) => [a.category, `${a.minutes} min`, withDate && articleDate(a.date)].filter(Boolean).join(' · ')

/** Journal — liste (maquette 33:99) : un article à la une, les suivants en cartes. */
export function JournalPage() {
  const root = useRef<HTMLElement>(null)
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('Tout')
  const list = ARTICLES.filter((a) => category === 'Tout' || a.category === category)
  const [first, ...rest] = list
  useReveal(root, category)

  return (
    <main ref={root} className="vitrine">
      <header className="intro vitrine__intro">
        <p className="t-label t-accent">Journal</p>
        <h1 className="vitrine__title">Carnets de nuit</h1>
        <div className="tags" role="group" aria-label="Catégorie">
          {CATEGORIES.map((c) => (
            <button key={c} className={['tag', category === c && 'tag--on'].filter(Boolean).join(' ')} aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      </header>

      {first && (
        <Link to={`/journal/${first.slug}`} className="feature reveal" key={first.slug}>
          <div className="feature__media">
            <img src={first.cover} alt="" />
          </div>
          <div className="feature__text">
            <p className="t-label-s">{meta(first, true)}</p>
            <h2 className="feature__title">{first.title}</h2>
            <p className="t-body-l">{first.excerpt}</p>
            <span className="t-label link-draw feature__more">Lire l'article</span>
          </div>
        </Link>
      )}

      {!!rest.length && (
        <div className="articles">
          {rest.map((a) => (
            <Link key={a.slug} to={`/journal/${a.slug}`} className="article-card reveal">
              <div className="article-card__media">
                <img src={a.cover} alt="" loading="lazy" />
              </div>
              <p className="t-label-s">{meta(a)}</p>
              <h2 className="t-h3">{a.title}</h2>
            </Link>
          ))}
        </div>
      )}

      <div className="product__footer">
        <Footer />
      </div>
    </main>
  )
}
