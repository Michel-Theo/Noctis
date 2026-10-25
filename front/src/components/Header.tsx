import { useState } from 'react'
import { Sigil } from './Sigil'

const LINKS = ['Collection', 'Atelier', 'Journal', 'Compte']

export function Header() {
  const [theme, setTheme] = useState<'nuit' | 'os'>('nuit')

  const toggleTheme = () => {
    const next = theme === 'nuit' ? 'os' : 'nuit'
    document.documentElement.dataset.theme = next
    setTheme(next)
  }

  return (
    <header className="header">
      <a href="/" className="header__logo" aria-label="NOCTIS — accueil">
        <Sigil size={28} />
        <span className="header__wordmark">NOCTIS</span>
      </a>
      <nav className="header__nav" aria-label="Navigation principale">
        {LINKS.map((l) => (
          <a key={l} href={`#${l.toLowerCase()}`} className="t-label header__link">
            {l}
          </a>
        ))}
        <a href="#panier" className="t-label header__cart">
          Panier <span className="header__badge">0</span>
        </a>
        <button className="t-label-s header__theme" onClick={toggleTheme} aria-pressed={theme === 'os'}>
          {theme === 'nuit' ? 'Os' : 'Nuit'}
        </button>
      </nav>
    </header>
  )
}
