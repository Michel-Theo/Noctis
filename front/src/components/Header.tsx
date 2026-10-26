import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sigil } from './Sigil'
import { useCart } from '../lib/cart-context'
import { gsap, prefersReducedMotion } from '../lib/scroll'

const LINKS = [
  ['Collection', '/#collection'],
  ['Atelier', '/#atelier'],
  ['Journal', '/journal'],
  ['Compte', '/compte'],
] as const

export function Header() {
  const { pathname } = useLocation()
  // Le menu est ouvert « pour une page donnée » : changer de page le referme sans effet de bord.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null)
  const { count } = useCart()
  const badge = useRef<HTMLSpanElement>(null)
  const last = useRef(count)

  useEffect(() => {
    document.documentElement.classList.toggle('menu-open', open)
  }, [open])

  // Dès qu'on a quitté le haut de page, l'en-tête prend un fond pour rester lisible.
  const [solid, setSolid] = useState(() => window.scrollY > 40)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // La pastille pulse une fois quand une pièce entre dans le panier.
  useEffect(() => {
    if (count > last.current && badge.current && !prefersReducedMotion()) {
      gsap.fromTo(badge.current, { scale: 1.6 }, { scale: 1, duration: 0.6, ease: 'expo.out' })
    }
    last.current = count
  }, [count])

  // Tunnel d'achat : en-tête réduit (logo + étapes), pas de navigation pour ne pas distraire.
  if (pathname.startsWith('/commande')) return <CheckoutHeader pathname={pathname} solid={solid} />

  return (
    <header className={['header', solid && 'header--solid'].filter(Boolean).join(' ')}>
      <Link to="/" className="header__logo" aria-label="NOCTIS — accueil">
        <Sigil size={28} />
        <span className="header__wordmark">NOCTIS</span>
      </Link>
      <nav className="header__nav" aria-label="Navigation principale">
        {LINKS.map(([l, to]) => (
          <Link key={l} to={to} className="t-label header__link link-draw">
            {l}
          </Link>
        ))}
        <Link to="/panier" className="t-label header__cart link-draw">
          Panier{' '}
          <span ref={badge} className="header__badge" aria-label={`${count} pièce${count > 1 ? 's' : ''}`}>
            {count}
          </span>
        </Link>
        <button className="t-label header__burger" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(!open)}>
          {open ? 'Fermer' : 'Menu'}
        </button>
      </nav>
      {/* Menu plein écran mobile (maquette M3) : liens en Michroma qui montent un par un. */}
      <div id="menu" className={['menu', open && 'menu--open'].filter(Boolean).join(' ')} hidden={!open}>
        <ul>
          {LINKS.map(([l, to], i) => (
            <li key={l} style={{ transitionDelay: `${i * 0.06}s` }}>
              <Link to={to} onClick={() => setOpen(false)}>
                <span className="t-label-s t-accent">0{i + 1}</span>
                <span className="menu__link">{l}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Sigil size={140} className="menu__sigil" />
      </div>
    </header>
  )
}

const STEPS = ['Informations', 'Livraison', 'Paiement']

function CheckoutHeader({ pathname, solid }: { pathname: string; solid: boolean }) {
  const confirmed = pathname.startsWith('/commande/confirmation')
  const current = pathname === '/commande/paiement' ? 2 : 1
  return (
    <header className={['header', 'header--checkout', solid && 'header--solid'].filter(Boolean).join(' ')}>
      <Link to="/" className="header__logo" aria-label="NOCTIS — accueil">
        <Sigil size={28} />
        <span className="header__wordmark">NOCTIS</span>
      </Link>
      {!confirmed && (
        <ol className="steps" aria-label="Étapes de la commande">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={['t-label-s', i < current && 'is-done', i === current && 'is-current'].filter(Boolean).join(' ')}
              aria-current={i === current ? 'step' : undefined}
            >
              0{i + 1} {s}
            </li>
          ))}
        </ol>
      )}
      <span className="t-label-s header__secure">
        {!confirmed && <span className="steps__count">{current + 1} / 3</span>}
        <span className="steps__secure">Paiement sécurisé</span>
      </span>
    </header>
  )
}
