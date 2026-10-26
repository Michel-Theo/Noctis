import { useEffect, useRef } from 'react'

const ROWS: [number, string][] = [
  [52, '16,5'],
  [54, '17,2'],
  [56, '17,8'],
  [57, '18,1'],
  [58, '18,5'],
  [60, '19,1'],
  [62, '19,7'],
  [64, '20,4'],
]

/** Modale « Guide des tailles » (maquette page 07). */
export function SizeGuide({ open, onClose, current }: { open: boolean; onClose: () => void; current: number }) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog ref={dialog} className="size-guide" onClose={onClose} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="size-guide__inner">
        <div className="size-guide__head">
          <h2 className="t-h3">Guide des tailles</h2>
          <button className="t-label link-draw" onClick={onClose}>
            Fermer ✕
          </button>
        </div>
        <p className="size-guide__intro">
          Enroulez un fil autour de votre doigt, au niveau de l'articulation. Mesurez sa longueur en millimètres&nbsp;: c'est
          votre taille.
        </p>
        <table className="size-guide__table">
          <thead>
            <tr>
              <th className="t-label-s">Taille FR</th>
              <th className="t-label-s">Tour de doigt</th>
              <th className="t-label-s">Ø intérieur</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([t, d]) => (
              <tr key={t} className={t === current ? 'is-current' : undefined}>
                <td>{t}</td>
                <td>{t}&nbsp;mm</td>
                <td>{d}&nbsp;mm</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="t-label-s">
          Entre deux tailles&nbsp;? Prenez la plus grande&nbsp;: la bague est large (11 mm) et serre davantage qu'un anneau fin.
        </p>
      </div>
    </dialog>
  )
}
