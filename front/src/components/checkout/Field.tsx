import { useId } from 'react'

type Props = React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }

/** Champ de formulaire (composant Figma « Champ ») : libellé mono, bordure, erreur sous le champ. */
export function Field({ label, error, className, ...input }: Props) {
  const id = useId()
  return (
    <div className={['field', error && 'field--error', className].filter(Boolean).join(' ')}>
      <label className="t-label-s" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="field__input" aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} {...input} />
      {error && (
        <p id={`${id}-e`} className="field__error t-label-s">
          {error}
        </p>
      )}
    </div>
  )
}

/** Carte d'option à cocher (mode de livraison, moyen de paiement). */
export function OptionCard({
  name,
  checked,
  onChange,
  title,
  detail,
  aside,
  children,
}: {
  name: string
  checked: boolean
  onChange: () => void
  title: string
  detail?: string
  aside?: string
  children?: React.ReactNode
}) {
  return (
    <div className={['option', checked && 'option--on'].filter(Boolean).join(' ')}>
      <label className="option__head">
        <input type="radio" name={name} checked={checked} onChange={onChange} />
        <span className="option__dot" aria-hidden="true" />
        <span className="option__text">
          <span className="t-label">{title}</span>
          {detail && <span className="t-label-s">{detail}</span>}
        </span>
        {aside && <span className="option__aside">{aside}</span>}
      </label>
      {checked && children && <div className="option__body">{children}</div>}
    </div>
  )
}
