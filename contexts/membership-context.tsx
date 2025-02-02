"use client"

import { createContext, useContext, useState } from 'react'

interface MembershipContextType {
  isActive: boolean
  activateMembership: (duration: number) => void
}

const MembershipContext = createContext<MembershipContextType>({
  isActive: false,
  activateMembership: () => {}
})

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false)

  const activateMembership = (duration: number) => {
    setIsActive(true)
  }

  return (
    <MembershipContext.Provider value={{ isActive, activateMembership }}>
      {children}
    </MembershipContext.Provider>
  )
}

export const useMembership = () => useContext(MembershipContext)

