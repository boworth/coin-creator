"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronRight, BarChart2, Zap, Shield, RefreshCcw } from "lucide-react"
import { AnimatedBackground } from "@/components/animated-background"
import { useMembership } from "@/contexts/membership-context"
import { redirect } from 'next/navigation'

// Add this type guard at the top of the file
const isProduction = process.env.NODE_ENV === 'production'

export default function SmartDCADescription() {
  const { isActive } = useMembership()

  // Handle production case first
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container mx-auto py-24 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mb-6">
          SmartDCA<span className="text-blue-600">.ai</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Coming Soon! Our intelligent DCA solution is currently in development.
        </p>
        <p className="text-gray-500">
          Stay tuned for updates on our revolutionary DCA trading algorithm.
        </p>
      </div>
    )
  }

  // Development-only code below
  return (
    <div className="min-h-screen relative font-sans">
      <AnimatedBackground />
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto py-16 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl mb-6 text-gray-900">
              SmartDCA<span className="text-blue-600">.ai</span>
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-10">
              Intelligent Dollar Cost Averaging for Low Liquidity Markets
            </p>
            <div className="space-x-4">
              {isActive ? (
                <Link href="/smart-dca/app">
                  <Button
                    size="lg"
                    className="bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-600 font-bold py-4 px-8 rounded-full transition duration-300 ease-in-out transform hover:scale-105"
                  >
                    Launch App
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  className="bg-gray-400 hover:bg-gray-400 text-white font-bold py-4 px-8 rounded-full transition duration-300 ease-in-out transform cursor-not-allowed"
                  disabled={isProduction}
                >
                  {isProduction ? 'Coming Soon' : 'Become a Member'}
                  {!isProduction && (
                    <ChevronRight className="ml-2 h-5 w-5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="pt-8 pb-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: BarChart2,
                  title: "Multi-Wallet Distribution",
                  description: "Spread your investment across multiple wallets for optimal market entry",
                },
                {
                  icon: Zap,
                  title: "Customizable Speed",
                  description: "Adjust deployment speed to match your strategy and market conditions",
                },
                {
                  icon: Shield,
                  title: "Secure & Discreet",
                  description: "Execute large transactions without significantly impacting market dynamics",
                },
                {
                  icon: RefreshCcw,
                  title: "Real-time Tracking",
                  description: "Monitor your DCA progress with our intuitive dashboard",
                },
              ].map((feature, index) => (
                <Card key={index} className="bg-white/80 backdrop-blur-sm border-gray-200">
                  <CardHeader>
                    <feature.icon className="h-10 w-10 text-blue-600 mb-4" />
                    <CardTitle className="text-gray-900">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: 1,
                  title: "Set Your Parameters",
                  description: "Choose your token, investment amount, and strategy speed",
                },
                {
                  step: 2,
                  title: "AI-Powered Execution",
                  description:
                    "Our advanced machine learning algorithm analyzes market patterns and executes trades across multiple wallets, optimizing capital deployment while maintaining natural trading behavior to avoid detection.",
                },
                {
                  step: 3,
                  title: "Monitor & Adjust",
                  description: "Track progress in real-time and make adjustments as needed",
                },
              ].map((step, index) => (
                <div key={index} className="text-center bg-white/80 backdrop-blur-sm rounded-lg p-6">
                  <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900">{step.title}</h3>
                  <p className="text-gray-700">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-center mb-4 text-black">Important Notice</h2>
              <div className="space-y-4 text-black">
                <p>
                  SmartDCA.ai is designed for legitimate Dollar Cost Averaging strategies in low liquidity markets. It
                  is not intended for price manipulation or any fraudulent trading practices.
                </p>
                <p>
                  Users are responsible for ensuring their use of SmartDCA.ai complies with all applicable laws and
                  regulations. Any use of this tool intended to manipulate prices or engage in market abuse is strictly
                  prohibited and may result in legal consequences.
                </p>
                <p>
                  Always conduct thorough research and consider seeking professional financial advice before investing
                  in any cryptocurrency or token.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

