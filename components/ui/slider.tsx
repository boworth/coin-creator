"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="range"
        className={cn(
          "relative w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer dark:bg-gray-700",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Slider.displayName = "Slider"

export { Slider }
