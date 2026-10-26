import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { sceneState } from '../lib/scroll'

export const MODEL_URL = '/models/ring_tribal.draco.glb'

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Recule la caméra sur écran étroit pour que la bague tienne dans la largeur. */
function CameraFit() {
  useFrame((state) => {
    const aspect = state.size.width / state.size.height
    state.camera.position.z = Math.max(0.066, 0.058 / aspect)
  })
  return null
}

function Ring() {
  const { scene } = useGLTF(MODEL_URL, true)
  const group = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const t = sceneState.hero
    // La bague sort du noir : l'environnement s'allume avec l'intro.
    state.scene.environmentIntensity = 0.15 + sceneState.intro * 0.85
    // Rotation idle 0,1 rad/s, stoppée dès que le scroll prend la main.
    if (t < 0.02) g.rotation.y += delta * 0.1
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, sceneState.pointer.y * 0.25 - t * 0.6, 4, delta)
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, -sceneState.pointer.x * 0.15, 4, delta)
    g.position.y = THREE.MathUtils.damp(g.position.y, -t * 0.01, 6, delta)
    g.scale.setScalar(THREE.MathUtils.damp(g.scale.x, 1 - t * 0.35, 6, delta))
  })

  return (
    <group ref={group}>
      {/* Orientation du GLB = rendu « face » de la maquette : poignard horizontal au centre. */}
      <primitive object={scene} />
    </group>
  )
}

/** Projecteur qui suit le curseur : on « éclaire » la relique soi-même. */
function PointerLight() {
  const light = useRef<THREE.SpotLight>(null)
  useFrame((_, delta) => {
    const l = light.current
    if (!l) return
    l.position.x = THREE.MathUtils.damp(l.position.x, sceneState.pointer.x * 0.08, 3, delta)
    l.position.y = THREE.MathUtils.damp(l.position.y, 0.06 + sceneState.pointer.y * 0.06, 3, delta)
    l.intensity = 6 * sceneState.intro
  })
  return <spotLight ref={light} position={[0, 0.06, 0.12]} angle={0.5} penumbra={1} intensity={0} color="#fff4e6" />
}

/** Lumière rasante qui balaie le métal de gauche à droite à l'ouverture. */
function RimSweep() {
  const light = useRef<THREE.SpotLight>(null)
  useFrame(() => {
    const l = light.current
    if (!l) return
    const p = sceneState.intro
    l.position.x = THREE.MathUtils.lerp(-0.12, 0.12, p)
    l.intensity = Math.sin(Math.PI * p) * 40
  })
  return <spotLight ref={light} position={[-0.12, 0.02, -0.03]} angle={0.4} penumbra={0.8} intensity={0} color="#e8eef6" />
}

export function RingCanvas() {
  const [webgl] = useState(hasWebGL)

  // Repli : rendu Cycles fixe si WebGL est indisponible.
  if (!webgl) return <img className="ring-canvas ring-fallback" src="/img/produit/face_nuit.webp" alt="" />

  return (
    <Canvas
      className="ring-canvas"
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 0.066], fov: 30, near: 0.001, far: 2 }}
      gl={{ antialias: true, toneMapping: THREE.AgXToneMapping, toneMappingExposure: 1 }}
    >
      <CameraFit />
      <Suspense fallback={null}>
        <Ring />
        {/* Studio « softbox + contre-jour » reconstruit en formes lumineuses : pas de HDRI à télécharger. */}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3} position={[0, 2, 1.5]} scale={[3, 1, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[-3, 0.5, -1]} scale={[1, 3, 1]} />
          <Lightformer form="ring" intensity={2} position={[2.5, 0, 2]} scale={1} />
        </Environment>
        <PointerLight />
        <RimSweep />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL, true)
