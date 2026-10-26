import { useRef, useState } from 'react'
import { api, type ApiError, type ContactForm } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'
import { Field } from '../../components/checkout/Field'
import { Footer } from '../../components/Footer'
import { useReveal } from '../../lib/useReveal'

const SUBJECTS: { id: ContactForm['subject']; label: string }[] = [
  { id: 'commande', label: 'Commande' },
  { id: 'sur-mesure', label: 'Sur mesure' },
  { id: 'autre', label: 'Autre' },
]

/** Contact (maquette 33:205) : le message est enregistré par l'API. */
export function ContactPage() {
  const root = useRef<HTMLElement>(null)
  const { user } = useAuth()
  const [form, setForm] = useState<ContactForm>(() => ({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    subject: 'sur-mesure',
    message: '',
  }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle')
  useReveal(root)

  const bind = (k: 'firstName' | 'lastName' | 'email') => ({
    value: form[k],
    error: errors[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.firstName.trim()) errs.firstName = 'Indiquez votre prénom.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Adresse e-mail invalide.'
    if (form.message.trim().length < 10) errs.message = 'Quelques mots de plus, s’il vous plaît.'
    setErrors(errs)
    setFailure('')
    if (Object.keys(errs).length) return
    setState('busy')
    try {
      await api.contact({ ...form, email: form.email.trim() })
      setState('sent')
    } catch (err) {
      const apiErr = err as ApiError
      setErrors(apiErr.violations ?? {})
      setFailure(Object.keys(apiErr.violations ?? {}).length ? '' : apiErr.message)
      setState('idle')
    }
  }

  return (
    <main ref={root} className="vitrine contact">
      <section className="intro contact__intro">
        <p className="t-label t-accent">Contact</p>
        <h1 className="contact__title">
          Écrire
          <br />à l'atelier
        </h1>
        <p className="t-body-l contact__lead">
          Commande sur mesure, taille hors grille, question sur une pièce&nbsp;: nous répondons sous 48&nbsp;heures, souvent la nuit.
        </p>
        <dl className="contact__facts">
          <div>
            <dt className="t-label-s">E-mail</dt>
            <dd>atelier@noctis.example</dd>
          </div>
          <div>
            <dt className="t-label-s">Instagram</dt>
            <dd>@noctis.atelier</dd>
          </div>
          <div>
            <dt className="t-label-s">Atelier</dt>
            <dd>Sur rendez-vous uniquement</dd>
          </div>
        </dl>
      </section>

      <div className="contact__panel reveal">
        {state === 'sent' ? (
          <div className="contact__sent" role="status">
            <p className="t-h3">Message reçu.</p>
            <p className="t-body-l">Merci, {form.firstName}. L'atelier vous répond sous 48&nbsp;heures, à {form.email}.</p>
          </div>
        ) : (
          <form className="contact__form" onSubmit={submit} noValidate>
            <div className="checkout__row checkout__row--2">
              <Field label="Prénom" autoComplete="given-name" {...bind('firstName')} />
              <Field label="Nom" autoComplete="family-name" {...bind('lastName')} />
            </div>
            <Field label="E-mail" type="email" autoComplete="email" placeholder="votre@email.com" {...bind('email')} />
            <fieldset className="field">
              <legend className="t-label-s">Sujet</legend>
              <div className="tags">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={['tag', form.subject === s.id && 'tag--on'].filter(Boolean).join(' ')}
                    aria-pressed={form.subject === s.id}
                    onClick={() => setForm({ ...form, subject: s.id })}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className={['field', errors.message && 'field--error'].filter(Boolean).join(' ')}>
              <label className="t-label-s" htmlFor="message">
                Message
              </label>
              <textarea
                id="message"
                className="field__input contact__message"
                placeholder="Une Couronne I en taille 66, est-ce possible ?"
                value={form.message}
                aria-invalid={!!errors.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              {errors.message && <p className="field__error t-label-s">{errors.message}</p>}
            </div>
            {failure && (
              <p className="checkout__failure" role="alert">
                {failure}
              </p>
            )}
            <button className="btn btn--primary contact__send" type="submit" disabled={state === 'busy'}>
              {state === 'busy' ? 'Envoi…' : 'Envoyer'}
            </button>
          </form>
        )}
      </div>

      <div className="product__footer contact__footer">
        <Footer />
      </div>
    </main>
  )
}
