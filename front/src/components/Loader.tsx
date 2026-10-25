import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { Sigil } from './Sigil'

/** K0 — le sigil se trace pendant que le modèle 3D se charge (progression réelle). */
export function Loader({ onDone }: { onDone: () => void }) {
  const { progress, active } = useProgress()
  const [shown, setShown] = useState(0)
  const leaving = shown >= 100

  // Le compteur rattrape la progression réelle sans jamais reculer.
  useEffect(() => {
    let raf = 0
    const step = () => {
      setShown((v) => {
        const target = active ? Math.min(progress, 99) : 100
        return v < target ? Math.min(target, v + Math.max(1, (target - v) * 0.08)) : v
      })
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [progress, active])

  useEffect(() => {
    if (!leaving) return
    const t = setTimeout(onDone, 900)
    return () => clearTimeout(t)
  }, [leaving, onDone])

  const value = Math.floor(shown)
  return (
    <div className={['loader', leaving && 'loader--leaving'].filter(Boolean).join(' ')} role="status" aria-live="polite">
      <Sigil size={140} draw accent />
      <p className="loader__count t-display-l">{String(value).padStart(3, '0')}</p>
      <p className="t-label-s">Réveil de la relique</p>
      <div className="loader__bar" style={{ transform: `scaleX(${shown / 100})` }} />
      <span className="visually-hidden">Chargement {value} %</span>
    </div>
  )
}
