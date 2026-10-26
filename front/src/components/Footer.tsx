import { useState } from 'react'
import { ScrambleLink } from './ScrambleLink'

const LINKS = [
  ['Journal', '/journal'],
  ['Contact', '/contact'],
  ['Mentions légales', '/informations/mentions-legales'],
  ['CGV', '/informations/cgv'],
  ['Back-office', '/admin'],
] as const

export function Footer() {
  const [theme, setTheme] = useState(() => (document.documentElement.dataset.theme === 'os' ? 'os' : 'nuit'))

  const toggleTheme = () => {
    const next = theme === 'nuit' ? 'os' : 'nuit'
    document.documentElement.dataset.theme = next
    setTheme(next)
  }

  return (
    <footer className="footer">
      <p className="t-label-s">© 2026 NOCTIS · Projet portfolio</p>
      <nav className="footer__nav" aria-label="Pied de page">
        {LINKS.map(([l, to]) => (
          <ScrambleLink key={l} to={to}>
            {l}
          </ScrambleLink>
        ))}
        <button className="t-label-s footer__theme" onClick={toggleTheme} aria-pressed={theme === 'os'}>
          Thème : {theme === 'nuit' ? 'Nuit' : 'Os'}
        </button>
      </nav>
    </footer>
  )
}
