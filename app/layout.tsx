import { WalletProviders } from "./providers"
import { Toaster } from "@/components/ui/toaster"
import { AnimatedBackground } from "@/components/animated-background"
import { MotionConfig } from "framer-motion"
import { NavMenu } from "@/components/nav-menu"
import { WalletConnect } from "@/components/wallet-connect"
import { Footer } from "@/components/footer"
import { MembershipProvider } from "@/contexts/membership-context"
import "@/app/globals.css"
import "@/styles/create-token-button.css"
import '../styles/globals.css'
import { Analytics } from '@vercel/analytics/react'

export const dynamic = "force-dynamic"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <MotionConfig reducedMotion="user">
          <AnimatedBackground />
          <WalletProviders>
            <MembershipProvider>
              <div className="flex flex-col justify-between min-h-screen">
                <header className="absolute top-0 left-0 w-full z-50 p-8 flex justify-between items-center">
                  <NavMenu />
                  <WalletConnect />
                </header>
                <main className="flex-grow pt-24 pb-16">{children}</main>
                <Footer />
              </div>
            </MembershipProvider>
          </WalletProviders>
        </MotionConfig>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

import './globals.css'