import { useState } from 'react'
import type { Quote } from '../lib/api'

/** « Code de la nuit » : panier et tunnel. onApply peut échouer (commande déjà créée côté serveur). */
export function CodeField({ code, quote, onApply }: { code: string; quote: Quote; onApply: (code: string) => void | Promise<void> }) {
  const [draft, setDraft] = useState(code)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await onApply(draft.trim())
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="summary__code" onSubmit={submit}>
      <label className="t-label-s" htmlFor="code">
        Code de la nuit
      </label>
      <div className="summary__code-row">
        <input id="code" className="field__input" placeholder="Saisir un code" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className="t-label link-draw" type="submit" disabled={busy}>
          Appliquer
        </button>
      </div>
      {(error || quote.code) && (
        <p className={['t-label-s', (error || !quote.code?.valid) && 't-accent'].filter(Boolean).join(' ')} role="status">
          {error || (quote.code?.valid ? `${quote.code.label} appliqué` : 'Ce code ne mène nulle part.')}
        </p>
      )}
    </form>
  )
}
