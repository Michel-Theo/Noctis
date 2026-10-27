import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'
import { AdminTop } from './AdminApp'

/** Aperçu des e-mails envoyés par la boutique, rendus par l'API avec des données d'exemple. */
export function AdminEmails() {
  const [list, setList] = useState<{ key: string; label: string; subject: string }[] | null>(null)
  const [current, setCurrent] = useState('')
  const [failure, setFailure] = useState('')

  useEffect(() => {
    api.admin.emails().then(
      (l) => {
        setList(l)
        setCurrent(l[0]?.key ?? '')
      },
      (e: Error) => setFailure(e.message),
    )
  }, [])

  const selected = list?.find((m) => m.key === current)

  // Un e-mail fait 600 px : sur un écran plus étroit, l'aperçu est réduit à la largeur disponible.
  const frame = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, (e.contentRect.width - 2) / 602)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [selected])

  return (
    <>
      <AdminTop title="E-mails" />
      {failure && <p className="checkout__failure">{failure}</p>}
      <div className="emails">
        <nav className="panel emails__list" aria-label="E-mails">
          {list?.map((m) => (
            <button key={m.key} className={['emails__item', m.key === current && 'is-current'].filter(Boolean).join(' ')} aria-current={m.key === current} onClick={() => setCurrent(m.key)}>
              <span className="t-label">{m.label}</span>
              <span className="t-label-s emails__item-subject">{m.subject}</span>
            </button>
          ))}
        </nav>
        <section className="panel emails__preview" aria-label="Aperçu">
          {selected && (
            <>
              <p className="t-label-s">
                Objet&nbsp;: <span className="emails__subject">{selected.subject}</span>
              </p>
              <div ref={frame} className="emails__frame">
                <iframe
                  key={current}
                  title={`Aperçu : ${selected.label}`}
                  src={api.admin.emailUrl(current)}
                  style={scale < 1 ? { width: 600, height: `calc(78vh / ${scale})`, transform: `scale(${scale})`, transformOrigin: '0 0' } : undefined}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </>
  )
}
