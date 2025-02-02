"use client"

import type React from "react"
import { useState, useEffect } from "react"

interface AnimatedDescriptionProps {
  text: string
  speed?: number
}

export const AnimatedDescription: React.FC<AnimatedDescriptionProps> = ({ text, speed = 50 }) => {
  const [displayedText, setDisplayedText] = useState("")

  useEffect(() => {
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i))
        i++
      } else {
        clearInterval(timer)
      }
    }, speed)

    return () => clearInterval(timer)
  }, [text, speed])

  return (
    <p className="text-center text-muted-foreground font-mono" style={{ fontFamily: "monospace" }}>
      {displayedText}
      <span className="animate-blink">|</span>
    </p>
  )
}

