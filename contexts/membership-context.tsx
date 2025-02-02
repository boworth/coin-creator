"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useWallet } from "@solana/wallet-adapter-react"

interface MembershipContextType {
  isActive: boolean
  timeRemaining: number
  isLoading: boolean
  activateMembership: (duration: number) => void
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined)

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { publicKey } = useWallet()

  const checkMembershipStatus = async () => {
    if (!publicKey) {
      setIsActive(false)
      setTimeRemaining(0)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/membership/status?wallet=${publicKey.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch membership status')
      }

      const data = await response.json()
      setIsActive(data.isActive)
      setTimeRemaining(data.expiresAt ? data.expiresAt - Date.now() : 0)
    } catch (error) {
      console.error('Error checking membership status:', error)
      setIsActive(false)
      setTimeRemaining(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkMembershipStatus()
    const interval = setInterval(checkMembershipStatus, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [publicKey])

  const activateMembership = (duration: number) => {
    setIsActive(true)
    setTimeRemaining(duration)
  }

  return (
    <MembershipContext.Provider value={{ isActive, timeRemaining, isLoading, activateMembership }}>
      {children}
    </MembershipContext.Provider>
  )
}

export function useMembership() {
  const context = useContext(MembershipContext)
  if (context === undefined) {
    throw new Error("useMembership must be used within a MembershipProvider")
  }
  return context
}

