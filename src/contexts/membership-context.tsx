"use client"

import { createContext, useContext, useState, useEffect } from 'react'

interface MembershipContextType {
  isActive: boolean
  timeRemaining: number
  isLoading: boolean
  activateMembership: (duration: number) => void
}

const MembershipContext = createContext<MembershipContextType>({
  isActive: false,
  timeRemaining: 0,
  isLoading: false,
  activateMembership: () => {}
})

export const MembershipProvider = ({ children }: { children: React.ReactNode }) => {
  const [isActive, setIsActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isActive, timeRemaining])

  const activateMembership = (duration: number) => {
    setIsActive(true)
    setTimeRemaining(duration * 24 * 60 * 60)
  }

  return (
    <MembershipContext.Provider value={{ isActive, timeRemaining, isLoading, activateMembership }}>
      {children}
    </MembershipContext.Provider>
  )
}

export const useMembership = () => useContext(MembershipContext)

