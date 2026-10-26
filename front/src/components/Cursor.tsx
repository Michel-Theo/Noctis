import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** Point + anneau qui suit avec retard. Sur un élément [data-cursor], l'anneau grossit et affiche le mot. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)
  // Conteneur déplacé dans la modale ouverte : une <dialog> passe au-dessus de tout (top layer), curseur compris.
  const [host] = useState(() => document.createElement('div'))

  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) return
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const lag = { ...pos }
    let raf = 0

    // Le contenu bouge aussi sous un curseur immobile (scroll) : on relit l'élément survolé.
    const refresh = () => {
      const hit = document.elementFromPoint(pos.x, pos.y) as HTMLElement | null
      const target = hit?.closest<HTMLElement>('[data-cursor]')
      ring.current?.classList.toggle('cursor__ring--active', !!target)
      if (label.current) label.current.textContent = target?.dataset.cursor ?? ''
    }
    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX
      pos.y = e.clientY
      refresh()
    }
    window.addEventListener('scroll', refresh, { passive: true })
    document.body.appendChild(host)
    const loop = () => {
      const parent = document.querySelector('dialog[open]') ?? document.body
      if (host.parentNode !== parent) parent.appendChild(host)
      lag.x += (pos.x - lag.x) * 0.15
      lag.y += (pos.y - lag.y) * 0.15
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      if (ring.current) ring.current.style.transform = `translate3d(${lag.x}px, ${lag.y}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', onMove)
    raf = requestAnimationFrame(loop)
    document.documentElement.classList.add('has-cursor')
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('scroll', refresh)
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-cursor')
      host.remove()
    }
  }, [host])

  return createPortal(
    <>
      <div ref={dot} className="cursor__dot" aria-hidden="true" />
      <div ref={ring} className="cursor__ring" aria-hidden="true">
        <span ref={label} className="cursor__label" />
      </div>
    </>,
    host,
  )
}
