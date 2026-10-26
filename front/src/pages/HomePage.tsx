import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ScrollTrigger } from '../lib/scroll'
import { RingCanvas } from '../three/RingCanvas'
import { Loader } from '../components/Loader'
import { Hero } from '../sections/Hero'
import { Anatomie } from '../sections/Anatomie'
import { Forge } from '../sections/Forge'
import { Collection } from '../sections/Collection'
import { Rejoindre } from '../sections/Rejoindre'

// Le chargeur ne joue qu'une fois par visite, pas à chaque retour sur l'accueil.
let introPlayed = false

export function HomePage() {
  const [ready, setReady] = useState(introPlayed)

  const onLoaded = useCallback(() => {
    introPlayed = true
    setReady(true)
    // Les hauteurs changent quand le chargeur disparaît : on recalcule les déclencheurs.
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  // Lien avec ancre (/#collection), depuis l'accueil ou une autre page : on y descend.
  const { hash } = useLocation()
  useEffect(() => {
    const id = hash.slice(1)
    if (!id || !ready) return
    const t = setTimeout(() => {
      const el = document.getElementById(id)
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' })
    }, 150)
    return () => clearTimeout(t)
  }, [hash, ready])

  return (
    <>
      {!ready && <Loader onDone={onLoaded} />}
      <RingCanvas />
      <div className="ring-vignette" aria-hidden="true" />
      <main>
        <Hero ready={ready} />
        <Anatomie />
        <Forge />
        <Collection />
        <Rejoindre />
      </main>
    </>
  )
}
