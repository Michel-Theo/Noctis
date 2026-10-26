type Props = {
  children: string
  variant?: 'primary' | 'secondary'
  href?: string
  type?: 'button' | 'submit'
  cursor?: string
}

/** Bouton NOCTIS : au survol, le libellé glisse vers le haut et son double le remplace. */
export function Button({ children, variant = 'primary', href, type = 'button', cursor }: Props) {
  const label = (
    <span className="btn__label" data-text={children}>
      <span>{children}</span>
    </span>
  )
  const className = `btn btn--${variant}`
  return href ? (
    <a href={href} className={className} data-cursor={cursor}>
      {label}
    </a>
  ) : (
    <button type={type} className={className} data-cursor={cursor}>
      {label}
    </button>
  )
}
