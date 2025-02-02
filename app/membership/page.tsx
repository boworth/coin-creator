"use client"

import { useEffect } from "react"
import { Membership, membershipOptions } from "@/components/membership"
import { AnimatedDescription } from "@/components/animated-description"
import { useSearchParams } from "next/navigation"
import { useMembership } from "@/contexts/membership-context"

export default function MembershipPage() {
  const searchParams = useSearchParams()
  const { setIsActive } = useMembership()

  useEffect(() => {
    const success = searchParams.get("success") === "true"
    const priceId = searchParams.get("priceId")

    if (success && priceId) {
      const duration = priceId === membershipOptions.weekly.stripePriceId ? 7 : 30
      setIsActive(true)
      console.log(`Membership activated for ${duration} days`)
    }
  }, [searchParams, setIsActive])

  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center">Premium Membership</h1>
        <div className="h-12 mb-4">
          <AnimatedDescription
            text="Eliminate all service fees and gain access to SmartDCA.ai with our premium membership. Choose between weekly and monthly plans, payable in SOL or USD."
            speed={30}
          />
        </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg mt-6">
          <Membership />
        </div>
      </div>
    </div>
  )
}

