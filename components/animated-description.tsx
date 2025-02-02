"use client"

export const AnimatedDescription = ({ 
  text, 
  speed = 30 
}: { 
  text: string
  speed?: number 
}) => {
  return (
    <div>
      {text}
    </div>
  )
}

