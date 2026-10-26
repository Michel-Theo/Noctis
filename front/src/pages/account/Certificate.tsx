import { useEffect, useRef } from 'react'
import type { Piece } from '../../lib/api'
import { Sigil } from '../../components/Sigil'

const pad = (n: number) => String(n).padStart(3, '0')
const longDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/** Certificat numérique d'une pièce numérotée. */
export function Certificate({ piece, onClose }: { piece: Piece | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (piece && !d.open) d.showModal()
    if (!piece && d.open) d.close()
  }, [piece])

  return (
    <dialog ref={dialog} className="size-guide certificate" onClose={onClose} onClick={(e) => e.target === e.currentTarget && onClose()}>
      {piece && (
        <div className="size-guide__inner certificate__inner">
          <div className="size-guide__head">
            <p className="t-label-s t-accent">Certificat d'authenticité</p>
            <button className="t-label link-draw" onClick={onClose}>
              Fermer ✕
            </button>
          </div>
          <Sigil size={64} accent className="certificate__sigil" />
          <h2 className="t-display-l certificate__name">{piece.name}</h2>
          <p className="certificate__serial">
            N° {pad(piece.serial)} / {pad(piece.editionTotal)}
          </p>
          <dl className="certificate__facts">
            <div>
              <dt className="t-label-s">Matière</dt>
              <dd>{piece.finish} · argent 925</dd>
            </div>
            <div>
              <dt className="t-label-s">Taille</dt>
              <dd>{piece.size}</dd>
            </div>
            <div>
              <dt className="t-label-s">Coulée</dt>
              <dd>{longDate(piece.castAt)}</dd>
            </div>
            <div>
              <dt className="t-label-s">Commande</dt>
              <dd>{piece.orderReference}</dd>
            </div>
          </dl>
          <p className="size-guide__intro">
            Entretien : un chiffon doux suffit. Évitez le chlore et les parfums ; le rhodium protège l'argent, il ne craint que les
            frottements répétés.
          </p>
        </div>
      )}
    </dialog>
  )
}
