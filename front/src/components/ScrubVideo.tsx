import { useEffect, useRef } from 'react'
import { ScrollTrigger, prefersReducedMotion } from '../lib/scroll'

type Props = {
  src: string
  poster: string
  /** Élément qui pilote la lecture : la vidéo avance avec sa traversée de l'écran. */
  trigger: React.RefObject<HTMLElement | null>
  label: string
}

/** Vidéo rendue dans Blender dont la lecture suit le scroll (vue éclatée, forge). */
export function ScrubVideo({ src, poster, trigger, label }: Props) {
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = video.current
    if (!v || !trigger.current) return
    if (prefersReducedMotion()) return // reste sur l'image fixe (poster)

    let target = 0
    let raf = 0
    const st = ScrollTrigger.create({
      trigger: trigger.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        target = self.progress
      },
    })
    // On lisse côté rAF : fixer currentTime à chaque évènement de scroll saccade.
    const loop = () => {
      if (v.duration) {
        const t = target * (v.duration - 0.05)
        if (Math.abs(v.currentTime - t) > 0.01) v.currentTime += (t - v.currentTime) * 0.25
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      st.kill()
      cancelAnimationFrame(raf)
    }
  }, [trigger])

  return (
    <video ref={video} className="scrub-video" poster={poster} muted playsInline preload="auto" aria-label={label}>
      <source src={src.replace('.mp4', '.webm')} type="video/webm" />
      <source src={src} type="video/mp4" />
    </video>
  )
}
