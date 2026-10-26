// Sigil NOCTIS (variante B, poignard arrondi « moyen ») — mêmes tracés que le composant Figma « Logo ».
const CLAWS = [
  'M102 106 C146 108 170 78 182 22 C164 58 140 80 112 84 Z',
  'M98 106 C54 108 30 78 18 22 C36 58 60 80 88 84 Z',
  'M102 94 C146 92 170 122 182 178 C164 142 140 120 112 116 Z',
  'M98 94 C54 92 30 122 18 178 C36 142 60 120 88 116 Z',
]
const DAGGER = 'M100 2 C107 30 120 48 120 100 C120 152 107 170 100 198 C93 170 80 152 80 100 C80 48 93 30 100 2 Z'

type Props = {
  size?: number
  /** Trace le sigil trait par trait (chargement, fin de page). */
  draw?: boolean
  /** Poignard en rouge sang (version principale du logo). */
  accent?: boolean
  className?: string
}

export function Sigil({ size = 200, draw = false, accent = false, className }: Props) {
  return (
    <svg
      className={['sigil', draw && 'sigil--draw', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-hidden="true"
    >
      <circle className="sigil__ring" cx="100" cy="100" r="62" pathLength={1} />
      {CLAWS.map((d) => (
        <path key={d} className="sigil__claw" d={d} pathLength={1} />
      ))}
      <path className={['sigil__dagger', accent && 'sigil__dagger--accent'].filter(Boolean).join(' ')} d={DAGGER} pathLength={1} />
    </svg>
  )
}
