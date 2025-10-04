"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

interface RocketAnimationProps {
  multiplier: number
  isPlaying: boolean
  hasCrashed: boolean
  hasWon: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface Star {
  x: number
  y: number
  size: number
  twinkle: number
}

export function RocketAnimation({ multiplier, isPlaying, hasCrashed, hasWon }: RocketAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rocketImageRef = useRef<HTMLImageElement>(null)
  const coinImageRef = useRef<HTMLImageElement>(null)
  const [stars, setStars] = useState<Star[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  // Initialize stars
  useEffect(() => {
    const newStars: Star[] = []
    for (let i = 0; i < 50; i++) {
      newStars.push({
        x: Math.random() * 800,
        y: Math.random() * 400,
        size: Math.random() * 2 + 1,
        twinkle: Math.random() * Math.PI * 2
      })
    }
    setStars(newStars)
  }, [])

  // Update particles
  const updateParticles = (currentParticles: Particle[]) => {
    return currentParticles
      .map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        vy: particle.vy + 0.2, // gravity
        life: particle.life - 1,
        vx: particle.vx * 0.98 // air resistance
      }))
      .filter(particle => particle.life > 0)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let currentParticles: Particle[] = []

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current

      // Set canvas size
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#0f0f23")
      gradient.addColorStop(0.5, "#1a1a2e")
      gradient.addColorStop(1, "#16213e")
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw twinkling stars
      stars.forEach((star, index) => {
        const twinklePhase = (elapsed * 0.003) + star.twinkle
        const alpha = (Math.sin(twinklePhase) + 1) * 0.5 * 0.8 + 0.2
        
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // Draw grid lines
      ctx.strokeStyle = "rgba(168, 85, 247, 0.2)"
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      
      // Vertical lines
      for (let x = 0; x <= canvas.width; x += 50) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      
      // Horizontal lines
      for (let y = 0; y <= canvas.height; y += 50) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
      
      ctx.setLineDash([])

      const startX = 80
      const startY = canvas.height - 80

      if (isPlaying || hasCrashed || hasWon) {
        // Calculate trajectory curve
        const points: [number, number][] = []
        const maxProgress = hasCrashed || hasWon ? 1 : Math.min(1, elapsed / 5000)
        
        for (let i = 0; i <= Math.floor(maxProgress * 100); i++) {
          const progress = i / 100
          const currentMult = 1 + (multiplier - 1) * progress
          const x = startX + progress * (canvas.width - 160)
          // More dramatic curve using exponential growth
          const y = startY - (Math.pow(currentMult, 0.8) - 1) * 120
          points.push([x, Math.max(20, y)])
        }

        // Draw glowing trajectory line
        if (points.length > 1) {
          // Outer glow
          ctx.shadowColor = hasCrashed ? "#ef4444" : hasWon ? "#22c55e" : "#8b5cf6"
          ctx.shadowBlur = 15
          ctx.lineWidth = 6
          ctx.strokeStyle = hasCrashed ? "rgba(239, 68, 68, 0.3)" : hasWon ? "rgba(34, 197, 94, 0.3)" : "rgba(139, 92, 246, 0.3)"
          
          ctx.beginPath()
          ctx.moveTo(points[0][0], points[0][1])
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i][0], points[i][1])
          }
          ctx.stroke()
          
          // Inner line
          ctx.shadowBlur = 8
          ctx.lineWidth = 3
          ctx.strokeStyle = hasCrashed ? "#ef4444" : hasWon ? "#22c55e" : "#8b5cf6"
          ctx.stroke()
          
          ctx.shadowBlur = 0
        }

        // Draw rocket with coin
        if (points.length > 0) {
          const rocketPoint = points[points.length - 1]
          
          // Calculate rocket angle
          let angle = 0
          if (points.length > 1) {
            const prevPoint = points[points.length - 2]
            angle = Math.atan2(rocketPoint[1] - prevPoint[1], rocketPoint[0] - prevPoint[0])
          }

          ctx.save()
          ctx.translate(rocketPoint[0], rocketPoint[1])
          ctx.rotate(angle)

          // Rocket body with gradient
          const rocketGradient = ctx.createLinearGradient(-20, -10, 20, 10)
          rocketGradient.addColorStop(0, "#fbbf24")
          rocketGradient.addColorStop(0.5, "#f59e0b")
          rocketGradient.addColorStop(1, "#d97706")
          
          ctx.fillStyle = rocketGradient
          ctx.beginPath()
          ctx.ellipse(0, 0, 25, 12, 0, 0, Math.PI * 2)
          ctx.fill()

          // Rocket highlight
          ctx.fillStyle = "#fef3c7"
          ctx.beginPath()
          ctx.ellipse(-5, -3, 15, 6, 0, 0, Math.PI * 2)
          ctx.fill()

          // Coin on rocket
          if (coinImageRef.current) {
            ctx.drawImage(coinImageRef.current, -12, -12, 24, 24)
          } else {
            // Fallback coin
            ctx.fillStyle = "#ffd700"
            ctx.beginPath()
            ctx.arc(0, 0, 8, 0, Math.PI * 2)
            ctx.fill()
            
            ctx.fillStyle = "#ffffff"
            ctx.font = "12px bold sans-serif"
            ctx.textAlign = "center"
            ctx.fillText("RGC", 0, 4)
          }

          // Rocket flames/exhaust
          if (isPlaying && !hasCrashed) {
            const flameLength = 20 + Math.sin(elapsed * 0.01) * 5
            const flameGradient = ctx.createLinearGradient(-flameLength, 0, 0, 0)
            flameGradient.addColorStop(0, "rgba(255, 0, 0, 0)")
            flameGradient.addColorStop(0.3, "rgba(255, 100, 0, 0.8)")
            flameGradient.addColorStop(0.7, "rgba(255, 200, 0, 0.9)")
            flameGradient.addColorStop(1, "rgba(255, 255, 255, 1)")
            
            ctx.fillStyle = flameGradient
            ctx.beginPath()
            ctx.moveTo(-25, 0)
            ctx.lineTo(-25 - flameLength, -8)
            ctx.lineTo(-25 - flameLength + 5, 0)
            ctx.lineTo(-25 - flameLength, 8)
            ctx.closePath()
            ctx.fill()
          }

          ctx.restore()

          // Create trail particles during flight
          if (isPlaying && !hasCrashed && Math.random() < 0.3) {
            const newParticles = createParticlesArray(rocketPoint[0] - 30, rocketPoint[1], 'trail')
            currentParticles.push(...newParticles)
          }

          // Create sparkle particles around rocket
          if (isPlaying && !hasCrashed && Math.random() < 0.2) {
            const newParticles = createParticlesArray(rocketPoint[0], rocketPoint[1], 'sparkle')
            currentParticles.push(...newParticles)
          }
        }

        // Explosion effect when crashed
        if (hasCrashed && points.length > 0) {
          const explosionPoint = points[points.length - 1]
          
          // Big explosion burst
          ctx.save()
          ctx.globalAlpha = 0.8
          const explosionSize = 60 + Math.sin(elapsed * 0.02) * 10
          
          // Multiple explosion rings
          for (let ring = 0; ring < 3; ring++) {
            const ringSize = explosionSize - (ring * 15)
            const ringGradient = ctx.createRadialGradient(
              explosionPoint[0], explosionPoint[1], 0,
              explosionPoint[0], explosionPoint[1], ringSize
            )
            ringGradient.addColorStop(0, ring === 0 ? "#ffffff" : "#ffaa00")
            ringGradient.addColorStop(0.4, ring === 0 ? "#ff6600" : "#ff4400")
            ringGradient.addColorStop(1, "rgba(255, 0, 0, 0)")
            
            ctx.fillStyle = ringGradient
            ctx.beginPath()
            ctx.arc(explosionPoint[0], explosionPoint[1], ringSize, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.restore()

          // Create explosion particles
          if (Math.random() < 0.4) {
            const newParticles = createParticlesArray(explosionPoint[0], explosionPoint[1], 'explosion')
            currentParticles.push(...newParticles)
          }
        }

      } else {
        // Idle state - floating rocket with coin
        const floatOffset = Math.sin(elapsed * 0.002) * 10
        const rocketX = canvas.width / 2
        const rocketY = canvas.height / 2 + floatOffset

        ctx.save()
        ctx.translate(rocketX, rocketY)

        // Floating rocket body
        const idleGradient = ctx.createLinearGradient(-30, -15, 30, 15)
        idleGradient.addColorStop(0, "#fbbf24")
        idleGradient.addColorStop(0.5, "#f59e0b")
        idleGradient.addColorStop(1, "#d97706")
        
        ctx.fillStyle = idleGradient
        ctx.beginPath()
        ctx.ellipse(0, 0, 35, 18, 0, 0, Math.PI * 2)
        ctx.fill()

        // Rocket highlight
        ctx.fillStyle = "#fef3c7"
        ctx.beginPath()
        ctx.ellipse(-8, -5, 20, 8, 0, 0, Math.PI * 2)
        ctx.fill()

        // Floating coin
        const coinFloat = Math.sin(elapsed * 0.003) * 8
        if (coinImageRef.current) {
          ctx.drawImage(coinImageRef.current, -18 + coinFloat, -18, 36, 36)
        } else {
          // Fallback coin
          ctx.fillStyle = "#ffd700"
          ctx.beginPath()
          ctx.arc(coinFloat, 0, 12, 0, Math.PI * 2)
          ctx.fill()
          
          ctx.fillStyle = "#ffffff"
          ctx.font = "16px bold sans-serif"
          ctx.textAlign = "center"
          ctx.fillText("RGC", coinFloat, 5)
        }

        ctx.restore()

        // Idle instructions
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)"
        ctx.font = "24px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("🚀 Place a bet to launch the rocket! 🚀", canvas.width / 2, canvas.height / 2 + 100)
      }

      // Update and draw particles
      currentParticles = updateParticles(currentParticles)
      
      currentParticles.forEach(particle => {
        const alpha = particle.life / particle.maxLife
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // Draw multiplier display
      if (isPlaying || hasCrashed || hasWon) {
        ctx.save()
        ctx.fillStyle = hasCrashed ? "#ef4444" : hasWon ? "#22c55e" : "#ffffff"
        ctx.font = "bold 48px sans-serif"
        ctx.textAlign = "center"
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 3
        
        const multText = `${multiplier.toFixed(2)}x`
        ctx.strokeText(multText, canvas.width / 2, 60)
        ctx.fillText(multText, canvas.width / 2, 60)
        ctx.restore()
      }

      animationId = requestAnimationFrame(animate)
    }

    // Helper function to create particles without state update
    const createParticlesArray = (x: number, y: number, type: 'trail' | 'explosion' | 'sparkle'): Particle[] => {
      const newParticles: Particle[] = []
      const count = type === 'explosion' ? 20 : type === 'trail' ? 8 : 5

      for (let i = 0; i < count; i++) {
        const angle = type === 'explosion' ? (Math.PI * 2 * i) / count : Math.random() * Math.PI * 2
        const speed = type === 'explosion' ? Math.random() * 8 + 4 : Math.random() * 3 + 1
        
        newParticles.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed * (type === 'trail' ? -0.5 : 1),
          vy: Math.sin(angle) * speed * (type === 'trail' ? -0.5 : 1),
          life: type === 'explosion' ? 60 : 30,
          maxLife: type === 'explosion' ? 60 : 30,
          color: type === 'explosion' 
            ? ['#ff4444', '#ff6644', '#ff8844', '#ffaa44'][Math.floor(Math.random() * 4)]
            : type === 'trail'
            ? ['#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe'][Math.floor(Math.random() * 4)]
            : ['#ffd700', '#ffed4a', '#fff176'][Math.floor(Math.random() * 3)],
          size: Math.random() * 4 + 2
        })
      }

      return newParticles
    }

    animate(0)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [multiplier, isPlaying, hasCrashed, hasWon, stars])

  // Reset animation when game restarts
  useEffect(() => {
    if (isPlaying) {
      startTimeRef.current = 0
    }
  }, [isPlaying])

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {/* Preload images */}
      <div className="hidden">
        <img 
          ref={coinImageRef}
          src={`${process.env.NODE_ENV === 'production' ? '/RogueCoinGame' : ''}/My_Coin.png`}
          alt="RGC Coin"
          onLoad={() => {
            // Image loaded
          }}
        />
      </div>
    </div>
  )
}
