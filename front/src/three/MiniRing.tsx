import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_URL } from './RingCanvas'

function Spinning({ url }: { url: string }) {
  const { scene } = useGLTF(url, true)
  const g = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (g.current) g.current.rotation.y += delta * 0.8
  })
  return (
    // Inclinée en 3/4 comme le packshot de la carte, puis tourne sur elle-même.
    <group rotation={[0.35, 0, 0]}>
      <group ref={g}>
        {/* Clone : le même GLB est déjà monté dans la scène du hero. */}
        <primitive object={scene.clone()} />
      </group>
    </group>
  )
}

/** Mini viewer 3D monté uniquement au survol d'une carte de la collection. */
export function MiniRing({ model = MODEL_URL }: { model?: string }) {
  return (
    <Canvas className="mini-ring" dpr={[1, 1.5]} camera={{ position: [0, 0, 0.07], fov: 30, near: 0.001, far: 1 }}>
      <Suspense fallback={null}>
        <Spinning url={model} />
        <Environment resolution={128}>
          <Lightformer form="rect" intensity={3} position={[0, 2, 1.5]} scale={[3, 1, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[-3, 0.5, -1]} scale={[1, 3, 1]} />
          <Lightformer form="ring" intensity={2} position={[2.5, 0, 2]} scale={1} />
          <Lightformer form="rect" intensity={1.2} position={[0, 0, 3]} scale={[2, 2, 1]} />
        </Environment>
        <spotLight position={[0.05, 0.08, 0.1]} angle={0.6} penumbra={1} intensity={5} color="#fff4e6" />
      </Suspense>
    </Canvas>
  )
}
