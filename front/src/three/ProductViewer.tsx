import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_URL } from './RingCanvas'
import { prefersReducedMotion } from '../lib/scroll'

function Ring({ url }: { url: string }) {
  const { scene } = useGLTF(url, true)
  // Clone : le même GLB peut être monté sur l'accueil et dans les cartes.
  return <primitive object={scene.clone()} />
}

/** Rotation continue, sans contrôle au doigt (mobile : le glissement sert à changer de vue). */
function Spin({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (group.current && !prefersReducedMotion()) group.current.rotation.y += dt * 0.5
  })
  return <group ref={group}>{children}</group>
}

/**
 * Viewer de la fiche produit. Ordinateur : on fait tourner la bague à la main (360°), rotation lente au repos.
 * Mobile (interactive = false) : la bague tourne seule et le canvas laisse passer les gestes.
 */
export function ProductViewer({ model = MODEL_URL, interactive = true }: { model?: string; interactive?: boolean }) {
  return (
    <Canvas
      className="product-viewer"
      style={interactive ? undefined : { touchAction: 'pan-y', cursor: 'auto' }}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.012, 0.07], fov: 30, near: 0.001, far: 2 }}
      gl={{ antialias: true, toneMapping: THREE.AgXToneMapping }}
    >
      <Suspense fallback={null}>
        {interactive ? <Ring url={model} /> : (
          <Spin>
            <Ring url={model} />
          </Spin>
        )}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3} position={[0, 2, 1.5]} scale={[3, 1, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[-3, 0.5, -1]} scale={[1, 3, 1]} />
          <Lightformer form="ring" intensity={2} position={[2.5, 0, 2]} scale={1} />
        </Environment>
        <spotLight position={[0.05, 0.08, 0.1]} angle={0.6} penumbra={1} intensity={4} color="#fff4e6" />
      </Suspense>
      {interactive && (
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping
        autoRotate={!prefersReducedMotion()}
        autoRotateSpeed={0.6}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
      />
      )}
    </Canvas>
  )
}
