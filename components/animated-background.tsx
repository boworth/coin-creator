"use client"

import type React from "react"
import { useEffect, useRef } from "react"

export const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let mouseX = window.innerWidth / 2  // Start at center
    let mouseY = window.innerHeight / 2 // Start at center
    const gridSize = 40
    const effectRadius = 150
    const effectStrength = 30
    const visibilityRadius = 300

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const drawEffect = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Set the background color (off-white with a hint of teal)
      ctx.fillStyle = "rgb(248, 250, 252)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Create an even more gradual radial gradient
      const gradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, visibilityRadius)
      gradient.addColorStop(0, "rgba(0, 128, 128, 0.1)")
      gradient.addColorStop(0.3, "rgba(0, 128, 128, 0.07)")
      gradient.addColorStop(0.5, "rgba(0, 128, 128, 0.05)")
      gradient.addColorStop(0.7, "rgba(0, 128, 128, 0.03)")
      gradient.addColorStop(0.9, "rgba(0, 128, 128, 0.01)")
      gradient.addColorStop(1, "rgba(0, 128, 128, 0)")

      for (let x = 0; x <= canvas.width + gridSize; x += gridSize) {
        for (let y = 0; y <= canvas.height + gridSize; y += gridSize) {
          const dx = x - mouseX
          const dy = y - mouseY
          const distance = Math.sqrt(dx * dx + dy * dy)

          // Revert to previous opacity calculation for grid lines
          const opacity = Math.max(0.02, Math.min(0.2, 1 - distance / visibilityRadius))

          ctx.strokeStyle = `rgba(0, 128, 128, ${opacity})`
          ctx.lineWidth = 0.5

          if (distance < effectRadius) {
            const angle = Math.atan2(dy, dx)
            const force = (1 - distance / effectRadius) * effectStrength
            const offsetX = Math.cos(angle) * force
            const offsetY = Math.sin(angle) * force

            ctx.beginPath()
            ctx.moveTo(x + offsetX, y + offsetY)
            ctx.lineTo(x + gridSize + offsetX, y + offsetY)
            ctx.moveTo(x + offsetX, y + offsetY)
            ctx.lineTo(x + offsetX, y + gridSize + offsetY)
            ctx.stroke()
          } else {
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(x + gridSize, y)
            ctx.moveTo(x, y)
            ctx.lineTo(x, y + gridSize)
            ctx.stroke()
          }
        }
      }

      // Draw the gradient circle on top
      ctx.globalCompositeOperation = "source-over"
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(mouseX, mouseY, visibilityRadius, 0, Math.PI * 2)
      ctx.fill()

      animationFrameId = requestAnimationFrame(drawEffect)
    }

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX
      mouseY = event.clientY
    }

    window.addEventListener("resize", resizeCanvas)
    window.addEventListener("mousemove", handleMouseMove)

    resizeCanvas()
    drawEffect(0)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 z-[-1]" />
}