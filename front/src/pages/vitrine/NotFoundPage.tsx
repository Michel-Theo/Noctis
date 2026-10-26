import { Link } from 'react-router-dom'
import { Sigil } from '../../components/Sigil'

/** 404 (maquette 33:367) : « 404 » géant en filigrane, le sigil se trace. */
export function NotFoundPage() {
  return (
    <main className="lost">
      <p className="lost__code" aria-hidden="true">
        404
      </p>
      <div className="lost__body">
        <Sigil size={80} draw />
        <h1 className="t-h1">Perdu dans la nuit</h1>
        <p className="t-body-l">Cette page n'existe pas, ou elle a été fondue pour faire autre chose.</p>
        <Link to="/" className="btn btn--secondary">
          Retour à l'accueil
        </Link>
      </div>
    </main>
  )
}
