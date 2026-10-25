import { useCallback, useState } from 'react'
import './App.css'
import { useSmoothScroll, ScrollTrigger } from './lib/scroll'
import { RingCanvas } from './three/RingCanvas'
import { Loader } from './components/Loader'
import { Header } from './components/Header'
import { Cursor } from './components/Cursor'
import { Hero } from './sections/Hero'
import { Anatomie } from './sections/Anatomie'
import { Forge } from './sections/Forge'
import { Collection } from './sections/Collection'
import { Rejoindre } from './sections/Rejoindre'

export default function App() {
  const [ready, setReady] = useState(false)
  useSmoothScroll()

  const onLoaded = useCallback(() => {
    setReady(true)
    // Les hauteurs changent quand le chargeur disparaît : on recalcule les déclencheurs.
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  return (
    <>
      {!ready && <Loader onDone={onLoaded} />}
      <Cursor />
      <RingCanvas />
      <Header />
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
