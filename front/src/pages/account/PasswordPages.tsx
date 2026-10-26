import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, type ApiError } from '../../lib/api'
import { Field } from '../../components/checkout/Field'

/** Même mise en page que la connexion : la photo à gauche, le formulaire à droite. */
function AuthFrame({ quote, children }: { quote: string; children: React.ReactNode }) {
  return (
    <main className="auth">
      <div className="auth__visual">
        <img src="/img/compte_orfevre.webp" alt="" />
        <p className="t-h1 auth__quote">{quote}</p>
      </div>
      <div className="auth__side">
        <div className="auth__form">{children}</div>
      </div>
    </main>
  )
}

/** Mot de passe oublié : la réponse est la même que le compte existe ou non. */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Adresse e-mail invalide.')
    setError('')
    setState('busy')
    try {
      await api.forgot(email.trim())
      setState('sent')
    } catch (err) {
      setError((err as ApiError).message)
      setState('idle')
    }
  }

  return (
    <AuthFrame quote="«&nbsp;Même la nuit oublie parfois.&nbsp;»">
      <h1 className="auth__heading">Mot de passe oublié</h1>
      {state === 'sent' ? (
        <div className="auth__done" role="status">
          <p className="auth__note">
            Si un compte existe pour <strong>{email.trim()}</strong>, un lien vous attend dans votre boîte. Il est valable une heure.
          </p>
          <Link to="/compte" className="t-label link-draw">
            ← Retour à la connexion
          </Link>
        </div>
      ) : (
        <form className="auth__form" onSubmit={submit} noValidate>
          <p className="auth__note">Indiquez l'adresse de votre compte : nous vous envoyons un lien pour choisir un nouveau mot de passe.</p>
          <Field label="E-mail" type="email" autoComplete="email" placeholder="vous@exemple.fr" value={email} error={error} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn btn--primary btn--block" type="submit" disabled={state === 'busy'}>
            {state === 'busy' ? 'Un instant…' : 'Recevoir le lien'}
          </button>
          <Link to="/compte" className="t-label link-draw auth__back">
            ← Retour à la connexion
          </Link>
        </form>
      )}
    </AuthFrame>
  )
}

/** Nouveau mot de passe, depuis le lien reçu par e-mail. */
export function ResetPasswordPage() {
  const token = useSearchParams()[0].get('token') ?? ''
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (form.password.length < 8) errs.password = '8 caractères au moins.'
    else if (form.password !== form.confirm) errs.confirm = 'Les deux saisies diffèrent.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setState('busy')
    try {
      await api.reset(token, form.password)
      setState('done')
    } catch (err) {
      const apiErr = err as ApiError
      setErrors(Object.keys(apiErr.violations ?? {}).length ? apiErr.violations : { token: apiErr.message })
      setState('idle')
    }
  }

  return (
    <AuthFrame quote="«&nbsp;Une nouvelle clé pour la nuit.&nbsp;»">
      <h1 className="auth__heading">Nouveau mot de passe</h1>
      {state === 'done' ? (
        <div className="auth__done" role="status">
          <p className="auth__note">Votre mot de passe est changé. Vous pouvez vous connecter.</p>
          <Link to="/compte" className="btn btn--primary btn--block">
            Se connecter
          </Link>
        </div>
      ) : !token || errors.token ? (
        <div className="auth__done" role="alert">
          <p className="auth__note">{errors.token ?? "Ce lien est incomplet. Demandez-en un nouveau."}</p>
          <Link to="/compte/mot-de-passe" className="btn btn--secondary btn--block">
            Demander un nouveau lien
          </Link>
        </div>
      ) : (
        <form className="auth__form" onSubmit={submit} noValidate>
          <Field
            label="Nouveau mot de passe"
            type="password"
            autoComplete="new-password"
            value={form.password}
            error={errors.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Field
            label="Confirmation"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            error={errors.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          />
          <button className="btn btn--primary btn--block" type="submit" disabled={state === 'busy'}>
            {state === 'busy' ? 'Un instant…' : 'Changer le mot de passe'}
          </button>
        </form>
      )}
    </AuthFrame>
  )
}
