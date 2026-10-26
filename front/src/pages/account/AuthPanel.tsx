import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/auth-context'
import type { ApiError } from '../../lib/api'
import { Field } from '../../components/checkout/Field'

type Tab = 'login' | 'register'

/** Connexion / inscription (maquettes 35:3 et M10). */
export function AuthPanel() {
  const { login, register } = useAuth()
  const [tab, setTab] = useState<Tab>('login')
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' })
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)

  const bind = (k: keyof typeof form) => ({
    value: form[k],
    error: errors[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }),
  })

  const switchTo = (t: Tab) => {
    setTab(t)
    setErrors({})
    setFailure('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Adresse e-mail invalide.'
    if (tab === 'register') {
      if (form.password.length < 8) errs.password = '8 caractères au moins.'
      if (!form.firstName.trim()) errs.firstName = 'Indiquez votre prénom.'
      if (!form.lastName.trim()) errs.lastName = 'Indiquez votre nom.'
    } else if (!form.password) errs.password = 'Indiquez votre mot de passe.'
    setErrors(errs)
    setFailure('')
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      if (tab === 'login') await login(form.email.trim(), form.password, remember)
      else await register({ ...form, email: form.email.trim() })
    } catch (err) {
      const apiErr = err as ApiError
      setErrors(apiErr.violations ?? {})
      if (!Object.keys(apiErr.violations ?? {}).length) setFailure(apiErr.message)
      setBusy(false)
    }
  }

  return (
    <main className="auth">
      <div className="auth__visual">
        <img src="/img/compte_orfevre.webp" alt="" />
        <p className="t-h1 auth__quote">«&nbsp;Bon retour parmi les veilleurs.&nbsp;»</p>
      </div>
      <div className="auth__side">
        <form className="auth__form" onSubmit={submit} noValidate>
          <div className="auth__tabs" role="tablist">
            {(['login', 'register'] as const).map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} className="auth__tab" onClick={() => switchTo(t)}>
                {t === 'login' ? 'Connexion' : 'Créer un compte'}
              </button>
            ))}
          </div>

          {tab === 'register' && (
            <div className="checkout__row checkout__row--2">
              <Field label="Prénom" autoComplete="given-name" {...bind('firstName')} />
              <Field label="Nom" autoComplete="family-name" {...bind('lastName')} />
            </div>
          )}
          <Field label="E-mail" type="email" autoComplete="email" placeholder="vous@exemple.fr" {...bind('email')} />
          <Field
            label="Mot de passe"
            type="password"
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            {...bind('password')}
          />

          {tab === 'login' && (
            <div className="auth__row">
              <label className="auth__remember t-label-s">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span className="auth__box" aria-hidden="true" />
                Rester connecté
              </label>
              <Link to="/compte/mot-de-passe" className="t-label link-draw">
                Mot de passe oublié
              </Link>
            </div>
          )}

          {failure && (
            <p className="checkout__failure" role="alert">
              {failure}
            </p>
          )}

          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? 'Un instant…' : tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>

          <p className="auth__note">Un compte permet de suivre la fonte de vos pièces et d'être prévenu avant chaque nouvelle série.</p>
        </form>
      </div>
    </main>
  )
}
