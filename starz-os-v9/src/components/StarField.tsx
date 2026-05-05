import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  z: number
  baseX: number
  baseY: number
  size: number
  opacity: number
  speed: number
  color: string
}

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let width = window.innerWidth
    let height = window.innerHeight

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }
    resize()
    window.addEventListener('resize', resize)

    const starCount = Math.min(200, Math.floor((width * height) / 8000))
    const stars: Star[] = []
    const colors = ['#00F0FF', '#7C3AED', '#F8FAFC', '#00F0FF', '#7C3AED']

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 2 + 0.5,
        baseX: Math.random() * width,
        baseY: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.6 + 0.2,
        speed: Math.random() * 0.3 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }

    let mouseX = width / 2
    let mouseY = height / 2

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      // Draw faint nebula glow at center
      const gradient = ctx.createRadialGradient(width / 2, height / 3, 0, width / 2, height / 3, width * 0.6)
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.03)')
      gradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.02)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Update and draw stars
      stars.forEach((star) => {
        star.x = star.baseX + (mouseX - width / 2) * star.speed * 0.02 * star.z
        star.y = star.baseY + (mouseY - height / 2) * star.speed * 0.02 * star.z

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * star.z, 0, Math.PI * 2)
        ctx.fillStyle = star.color
        ctx.globalAlpha = star.opacity * star.z
        ctx.fill()
      })

      ctx.globalAlpha = 1

      // Draw constellation lines between nearby stars
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)'
      ctx.lineWidth = 0.5
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x
          const dy = stars[i].y - stars[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.globalAlpha = (1 - dist / 120) * 0.15
            ctx.beginPath()
            ctx.moveTo(stars[i].x, stars[i].y)
            ctx.lineTo(stars[j].x, stars[j].y)
            ctx.stroke()
          }
        }
      }
      ctx.globalAlpha = 1

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
