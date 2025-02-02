"use client"

import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn("relative", className)}
      {...props}
    >
      <div className="h-8 w-8">
        <span className="spinner">
          <style jsx>{`
            .spinner {
              width: 24px;
              height: 24px;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 2px;
              position: absolute;
            }
            
            .spinner > div {
              background-color: #3b82f6;
              animation: grid-animation 1.2s linear infinite;
            }
            
            .spinner > div:nth-child(1) { animation-delay: 0s; }
            .spinner > div:nth-child(2) { animation-delay: 0.1s; }
            .spinner > div:nth-child(3) { animation-delay: 0.2s; }
            .spinner > div:nth-child(4) { animation-delay: 0.3s; }
            .spinner > div:nth-child(5) { animation-delay: 0.4s; }
            .spinner > div:nth-child(6) { animation-delay: 0.5s; }
            .spinner > div:nth-child(7) { animation-delay: 0.6s; }
            .spinner > div:nth-child(8) { animation-delay: 0.7s; }
            .spinner > div:nth-child(9) { animation-delay: 0.8s; }

            @keyframes grid-animation {
              0%, 70%, 100% { 
                transform: scale3D(1, 1, 1);
                opacity: 0.8;
              }
              35% {
                transform: scale3D(0, 0, 1);
                opacity: 0.2;
              }
            }
          `}</style>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </span>
      </div>
    </div>
  )
} 