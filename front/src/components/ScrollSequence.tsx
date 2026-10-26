import { useEffect, useRef } from 'react'
import { ScrollTrigger, prefersReducedMotion } from '../lib/scroll'

type Props = {
  /** Dossier dans public/ contenant 000.webp … (count-1).webp */
  dir: string
  count: number
  width: number
  height: number
  /** Image affichée tant que la séquence charge, et seule image si reduced-motion. */
  poster: string
  /** Section qui pilote la lecture : la séquence avance avec sa traversée. */
  trigger: React.RefObject<HTMLElement | null>
  label: string
  /** Appelé à chaque image dessinée (frame flottante, pour caler des éléments dessus). */
  onFrame?: (frame: number) => void
  className?: string
}

/**
 * Séquence d'images Blender dessinée sur un canvas au rythme du scroll.
 * Remplace la vidéo : une vidéo H.264 saccade quand on la rembobine au scroll,
 * une séquence d'images ne décode que l'image demandée.
 */
export function ScrollSequence({ dir, count, width, height, poster, trigger, label, onFrame, className }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const onFrameRef = useRef(onFrame)

  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  useEffect(() => {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx || !trigger.current) return

    const frames: HTMLImageElement[] = []
    const posterImg = new Image()
    posterImg.src = poster
    let drawn = -1
    const draw = (i: number) => {
      // Si l'image demandée n'est pas encore chargée, on garde la plus proche disponible.
      let k = i
      while (k > 0 && !frames[k]?.complete) k--
      const img = frames[k]?.complete && frames[k].naturalWidth ? frames[k] : posterImg
      if (!img.complete || k === drawn) return
      ctx.drawImage(img, 0, 0, width, height)
      drawn = k
    }

    if (prefersReducedMotion()) {
      posterImg.onload = () => ctx.drawImage(posterImg, 0, 0, width, height)
      return
    }

    for (let i = 0; i < count; i++) {
      const img = new Image()
      img.decoding = 'async'
      img.src = `${dir}/${String(i).padStart(3, '0')}.webp`
      // Décodage anticipé : sinon le premier affichage de chaque image coûte une saccade.
      img.decode().catch(() => {})
      frames.push(img)
    }
    frames[0].onload = () => draw(0)

    let target = 0
    let current = 0
    let raf = 0
    const st = ScrollTrigger.create({
      trigger: trigger.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        target = self.progress * (count - 1)
      },
    })
    // Lissage : la séquence rattrape le scroll au lieu de sauter d'image en image.
    const loop = () => {
      current += (target - current) * 0.18
      if (Math.abs(target - current) < 0.01) current = target
      draw(Math.round(current))
      onFrameRef.current?.(current)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      st.kill()
      cancelAnimationFrame(raf)
    }
  }, [dir, count, width, height, poster, trigger])

  return <canvas ref={canvas} className={['scroll-seq', className].filter(Boolean).join(' ')} width={width} height={height} role="img" aria-label={label} />
}
