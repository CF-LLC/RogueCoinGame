"use client"

import { useEffect, useRef } from "react"

interface RocketAnimationProps {
  multiplier: number
  isPlaying: boolean
  hasCrashed: boolean
  hasWon: boolean
}

export function RocketAnimation({ multiplier, isPlaying, hasCrashed, hasWon }: RocketAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw graph line
    const points: [number, number][] = []
    const startX = 50
    const startY = canvas.height - 50

    if (isPlaying || hasCrashed || hasWon) {
      // Calculate curve based on multiplier
      for (let i = 0; i <= 100; i++) {
        const progress = i / 100
        const currentMult = 1 + (multiplier - 1) * progress
        const x = startX + progress * (canvas.width - 100)
        const y = startY - Math.log(currentMult) * 100
        points.push([x, y])
      }

      // Draw line
      ctx.beginPath()
      ctx.moveTo(points[0][0], points[0][1])

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1])
      }

      // Set line style based on state
      if (hasCrashed) {
        ctx.strokeStyle = "rgb(239, 68, 68)" // red
      } else if (hasWon) {
        ctx.strokeStyle = "rgb(34, 197, 94)" // green
      } else {
        ctx.strokeStyle = "rgb(168, 85, 247)" // purple
      }

      ctx.lineWidth = 3
      ctx.stroke()

      // Draw rocket at end of line
      const lastPoint = points[points.length - 1]
      ctx.save()
      ctx.translate(lastPoint[0], lastPoint[1])

      // Rotate based on slope
      if (points.length > 1) {
        const prevPoint = points[points.length - 2]
        const angle = Math.atan2(lastPoint[1] - prevPoint[1], lastPoint[0] - prevPoint[0])
        ctx.rotate(angle)
      }

      // Draw rocket emoji or shape
      ctx.font = "32px sans-serif"
      ctx.fillText("🚀", -16, 8)

      ctx.restore()

      // Draw explosion if crashed
      if (hasCrashed) {
        ctx.font = "48px sans-serif"
        ctx.fillText("💥", lastPoint[0] - 24, lastPoint[1] + 12)
      }
    } else {
      // Draw idle state
      ctx.font = "64px sans-serif"
      ctx.fillText("🚀", canvas.width / 2 - 32, canvas.height / 2)

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
      ctx.font = "20px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText("Place a bet to start", canvas.width / 2, canvas.height / 2 + 60)
    }
  }, [multiplier, isPlaying, hasCrashed, hasWon])

  return <canvas ref={canvasRef} className="w-full h-full" />
}
