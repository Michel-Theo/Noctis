import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '../../components/Footer'
import { Sigil } from '../../components/Sigil'
import { useReveal } from '../../lib/useReveal'

const STEPS = [
  { n: '01', title: 'Sculpter', text: 'Modélisation 3D lame par lame, autour d’un poignard central.', img: 'atelier_01-sculpter' },
  { n: '02', title: 'Couler', text: 'Impression résine, moule en plâtre, argent 925 versé à 960 °C.', img: 'atelier_02-couler' },
  { n: '03', title: 'Polir', text: 'Ébavurage, polissage miroir, bain de rhodium.', img: 'atelier_03-polir' },
  { n: '04', title: 'Numéroter', text: 'Gravure du numéro à l’intérieur de l’anneau. 150 par modèle.', img: 'atelier_04-numeroter' },
]

/** L'atelier (maquettes 32:112 et M7). */
export function AtelierPage() {
  const root = useRef<HTMLElement>(null)
  useReveal(root)

  return (
    <main ref={root} className="vitrine atelier">
      <header className="atelier__hero">
        <img src="/img/vitrine/mains_large.webp" alt="" />
        <div className="intro">
          <p className="t-label t-accent">L'atelier</p>
          <h1 className="atelier__title">
            Là où la nuit
            <br />
            prend forme.
          </h1>
        </div>
      </header>

      <section className="atelier__story">
        <p className="atelier__manifesto reveal">
          NOCTIS est né d'une obsession&nbsp;: faire des bijoux qu'on porte comme on garde un secret. Des pièces lourdes, tranchantes, qui
          ne cherchent pas à plaire.
        </p>
        <div className="atelier__text reveal">
          <p>
            Chaque modèle commence dans Blender&nbsp;: des lames sculptées une à une, assemblées jusqu'à ce que la pièce tienne debout
            seule. Le fichier part ensuite à l'impression en résine, puis à la fonte à cire perdue.
          </p>
          <p>Rien n'est produit à l'avance. Vous commandez, nous coulons. Dix jours plus tard, la relique vous rejoint.</p>
        </div>
      </section>

      <ol className="steps-grid">
        {STEPS.map((s) => (
          <li key={s.n} className="reveal">
            <img src={`/img/vitrine/${s.img}.webp`} alt="" loading="lazy" />
            <div>
              <p className="t-label t-accent">{s.n}</p>
              <h2 className="t-h3">{s.title}</h2>
              <p className="steps-grid__text">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="atelier__quote reveal">
        <Sigil size={56} />
        <blockquote>«&nbsp;Une bague doit pouvoir blesser un peu. Sinon, ce n'est qu'un ornement.&nbsp;»</blockquote>
        <Link to="/collection" className="btn btn--primary">
          Voir la collection
        </Link>
      </section>

      <div className="product__footer">
        <Footer />
      </div>
    </main>
  )
}
