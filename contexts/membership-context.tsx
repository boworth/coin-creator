"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface MembershipContextType {
  isActive: boolean
  setIsActive: (active: boolean) => void
}

const MembershipContext = createContext<MembershipContextType | undefined>(undefined)

export function MembershipProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false)

  return (
    <MembershipContext.Provider value={{ isActive, setIsActive }}>
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

