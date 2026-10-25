import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { sceneState } from '../lib/scroll'

const MODEL_URL = '/models/ring_tribal.draco.glb'

function Ring() {
  const { scene } = useGLTF(MODEL_URL, true)
  const group = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    const g = group.current
    if (!g) return
    const t = sceneState.hero
    // Rotation lente continue + inclinaison qui suit le pointeur (amortie).
    g.rotation.y += delta * 0.1
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, sceneState.pointer.y * 0.25 - t * 0.6, 4, delta)
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, -sceneState.pointer.x * 0.15, 4, delta)
    // Au scroll du hero, la bague recule et descend.
    g.position.y = THREE.MathUtils.damp(g.position.y, -t * 0.012, 6, delta)
    const s = THREE.MathUtils.damp(g.scale.x, 1 - t * 0.35, 6, delta)
    g.scale.setScalar(s)
    state.camera.lookAt(0, 0, 0)
  })

  return (
    <group ref={group}>
      {/* Le GLB a l'axe du doigt horizontal : on redresse pour présenter le poignard debout. */}
      <primitive object={scene} rotation={[0, 0, Math.PI / 2]} />
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
  })
  return <spotLight ref={light} position={[0, 0.06, 0.12]} angle={0.5} penumbra={1} intensity={6} color="#fff4e6" />
}

export function RingCanvas() {
  return (
    <Canvas
      className="ring-canvas"
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 0.1], fov: 30, near: 0.001, far: 2 }}
      gl={{ antialias: true, toneMapping: THREE.AgXToneMapping, toneMappingExposure: 1 }}
    >
      <Suspense fallback={null}>
        <Ring />
        {/* Studio « softbox + contre-jour » reconstruit en formes lumineuses : pas de HDRI à télécharger. */}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3} position={[0, 2, 1.5]} scale={[3, 1, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[-3, 0.5, -1]} scale={[1, 3, 1]} />
          <Lightformer form="ring" intensity={2} position={[2.5, 0, 2]} scale={1} />
        </Environment>
        <PointerLight />
      </Suspense>
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL, true)
