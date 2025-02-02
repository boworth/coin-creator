import type { Metadata } from "next"
import { FAQAccordion } from "@/components/faq-accordion"

export const metadata: Metadata = {
  title: "FAQ - Solana Token Creator",
  description: "Frequently Asked Questions about creating tokens on Solana",
}

export default function FAQPage() {
  return (
    <div className="container mx-auto py-12">
      <h1 className="text-4xl font-bold text-center mb-8">Frequently Asked Questions</h1>
      <FAQAccordion />
    </div>
  )
}

