import { useEffect, useState } from 'react'
import { Sigil } from './Sigil'

const LINKS = ['Collection', 'Atelier', 'Journal', 'Compte']

export function Header() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
  }, [open])

  return (
    <header className="header">
      <a href="/" className="header__logo" aria-label="NOCTIS — accueil">
        <Sigil size={28} />
        <span className="header__wordmark">NOCTIS</span>
      </a>
      <nav className="header__nav" aria-label="Navigation principale">
        {LINKS.map((l) => (
          <a key={l} href={`#${l.toLowerCase()}`} className="t-label header__link link-draw">
            {l}
          </a>
        ))}
        <a href="#panier" className="t-label header__cart link-draw">
          Panier <span className="header__badge">0</span>
        </a>
        <button className="t-label header__burger" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(!open)}>
          {open ? 'Fermer' : 'Menu'}
        </button>
      </nav>
      {/* Menu plein écran mobile (maquette M3) : liens en Michroma qui montent un par un. */}
      <div id="menu" className={['menu', open && 'menu--open'].filter(Boolean).join(' ')} hidden={!open}>
        <ul>
          {LINKS.map((l, i) => (
            <li key={l} style={{ transitionDelay: `${i * 0.06}s` }}>
              <a href={`#${l.toLowerCase()}`} onClick={() => setOpen(false)}>
                <span className="t-label-s t-accent">0{i + 1}</span>
                <span className="menu__link">{l}</span>
              </a>
            </li>
          ))}
        </ul>
        <Sigil size={140} className="menu__sigil" />
      </div>
    </header>
  )
}
