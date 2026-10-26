import { useId, useState } from 'react'

/** Accordéon (composant Figma « Accordéon ») : la hauteur s'ouvre en douceur. */
export function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className={['accordion', open && 'accordion--open'].filter(Boolean).join(' ')}>
      <button className="accordion__head t-label" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span className="accordion__icon" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      <div id={id} className="accordion__body" role="region">
        <div>
          <p>{children}</p>
        </div>
      </div>
    </div>
  )
}
