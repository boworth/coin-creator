"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

const termsOfServiceSections = [
  {
    title: "Introduction",
    content: [
      'Welcome to SmartDCA.ai ("the Platform"). By accessing or using the Platform, you agree to comply with and be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Platform.',
    ],
  },
  {
    title: "Definitions",
    content: ["The following definitions apply to these Terms:"],
    list: [
      "Wash Trading: The practice of executing trades to create artificial activity or manipulate market volume without genuine market risk.",
      "Prohibited Activities: Activities that violate these Terms, including but not limited to wash trading, market manipulation, securities fraud, and any other unlawful conduct.",
      "User: Any individual or entity accessing or using the Platform.",
    ],
  },
  {
    title: "User Obligations",
    content: ["By using the Platform, you agree to:"],
    list: [
      "Use the Platform in compliance with all applicable laws, regulations, and these Terms.",
      "Refrain from engaging in any Prohibited Activities, including wash trading, market manipulation, or any activity intended to deceive or defraud other users or third parties.",
      "Provide accurate and truthful information during registration and use of the Platform.",
      "Assume full responsibility for your actions on the Platform.",
    ],
  },
  {
    title: "Prohibited Activities",
    content: ["Users are strictly prohibited from engaging in the following activities:"],
    list: [
      "Wash trading or any activity designed to create artificial market activity or manipulate market volume.",
      "Market manipulation, including but not limited to spoofing, layering, or pump-and-dump schemes.",
      "Using the Platform to engage in securities fraud or any other illegal activity.",
      "Circumventing or attempting to circumvent any security measures or restrictions implemented by the Platform.",
    ],
  },
  {
    title: "Monitoring and Enforcement",
    content: [
      "The Platform reserves the right to monitor user activity to detect and prevent Prohibited Activities.",
      "If a user is found to be engaging in Prohibited Activities, the Platform may, at its sole discretion:",
    ],
    list: [
      "Suspend or terminate the user's account.",
      "Report the activity to relevant regulatory authorities.",
      "Pursue any other remedies available under applicable law.",
    ],
  },
  {
    title: "Disclaimer of Liability",
    content: [
      "The Platform is a neutral tool that facilitates algorithmic execution of orders in low-liquidity markets. The Platform does not endorse, verify, or take responsibility for the actions of its users.",
      "The Platform and its developers shall not be held liable for any damages, losses, or liabilities arising from user misconduct, including but not limited to wash trading, market manipulation, or securities fraud.",
      "Users acknowledge that they are solely responsible for ensuring their compliance with applicable laws and regulations.",
    ],
  },
  {
    title: "Indemnification",
    content: [
      "Users agree to indemnify and hold harmless the Platform, its developers, affiliates, and agents from any claims, damages, or liabilities arising out of or related to:",
    ],
    list: [
      "The user's violation of these Terms.",
      "The user's engagement in Prohibited Activities.",
      "Any third-party claims resulting from the user's actions on the Platform.",
    ],
  },
  {
    title: "Compliance with Laws",
    content: [
      "Users represent and warrant that their use of the Platform complies with all applicable laws and regulations, including but not limited to securities laws and anti-fraud provisions.",
    ],
  },
  {
    title: "Amendments",
    content: [
      "The Platform reserves the right to amend these Terms at any time. Users will be notified of any material changes, and continued use of the Platform constitutes acceptance of the updated Terms.",
    ],
  },
  {
    title: "Governing Law and Dispute Resolution",
    content: [
      "These Terms shall be governed by the laws of the State of New York, without regard to its conflict of laws principles. Any disputes arising out of or related to these Terms shall be resolved through binding arbitration administered by the International Chamber of Commerce (ICC) in accordance with its Arbitration Rules. The arbitration shall take place in New York, New York, and the language of arbitration shall be English. The arbitral award shall be final and binding, and judgment on the award may be entered in any court having jurisdiction.",
    ],
  },
  {
    title: "Privacy Policy",
    content: [
      "Your use of the Platform is subject to our Privacy Policy, which is incorporated by reference into these Terms. By using the Platform, you consent to the collection, use, and sharing of your information as described in the Privacy Policy. The Platform complies with applicable data protection laws, including GDPR and CCPA, where applicable.",
    ],
  },
  {
    title: "User Accounts",
    content: ["Users are required to create an account to access certain features of the Platform."],
    list: [
      "You agree to provide accurate and complete information during registration and to update your information as necessary.",
      "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.",
      "The Platform reserves the right to suspend or terminate accounts for violations of these Terms or for any other reason at its sole discretion.",
    ],
  },
  {
    title: "Fees and Payments",
    content: ["The Platform may charge fees for certain services."],
    list: [
      "All fees will be clearly disclosed prior to your use of the service.",
      "Payments must be made using the payment methods specified on the Platform.",
      "Fees are non-refundable unless otherwise stated. The Platform reserves the right to modify its fee structure at any time with prior notice to users.",
    ],
  },
  {
    title: "Risk Disclosure",
    content: [
      "The Platform facilitates algorithmic execution of orders in low-liquidity markets, which may involve significant risks, including but not limited to market volatility, loss of funds, and execution delays.",
      "Users acknowledge and accept these risks and agree that the Platform is not responsible for any losses incurred.",
      "Users should consult with a financial advisor or conduct their own due diligence before using the Platform.",
    ],
  },
  {
    title: "Intellectual Property",
    content: [
      "All content, software, and technology on the Platform, including but not limited to trademarks, logos, and proprietary algorithms, are the exclusive property of the Platform or its licensors.",
      "Users are granted a limited, non-exclusive, non-transferable license to use the Platform for its intended purposes.",
      "Users may not copy, modify, distribute, or reverse-engineer any part of the Platform without prior written consent.",
    ],
  },
  {
    title: "Regulatory Compliance",
    content: [
      "The Platform complies with applicable laws and regulations, including but not limited to AML and KYC requirements.",
    ],
    list: [
      "Users may be required to provide identification and other documentation to verify their identity. Failure to comply with these requirements may result in account suspension or termination.",
    ],
  },
  {
    title: "Third-Party Services",
    content: [
      "The Platform may integrate with third-party services or APIs. The Platform is not responsible for the availability, accuracy, or performance of these third-party services. Your use of third-party services is subject to their respective terms and conditions.",
    ],
  },
  {
    title: "Termination",
    content: [
      "The Platform reserves the right to terminate or suspend your access to the Platform at any time, with or without notice, for any reason, including but not limited to violations of these Terms.",
    ],
    list: [
      "Upon termination, your right to use the Platform will immediately cease, and any outstanding obligations under these Terms will survive termination.",
    ],
  },
  {
    title: "Limitation of Liability",
    content: [
      "To the fullest extent permitted by law, the Platform and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising out of or related to your use of the Platform.",
    ],
  },
  {
    title: "Force Majeure",
    content: [
      "The Platform shall not be held liable for any failure or delay in performance caused by circumstances beyond its reasonable control, including but not limited to acts of God, natural disasters, government actions, or technical failures.",
    ],
  },
  {
    title: "Alternative Dispute Resolution for Non-U.S. Users",
    content: [
      "For users located outside the United States, the Platform may, at its sole discretion, designate an alternative arbitration body or location to ensure compliance with local laws.",
    ],
  },
  {
    title: "Contact Information",
    content: ["For questions or concerns regarding these Terms, please contact us at support@smartdca.ai."],
  },
]

interface TermsOfServiceProps {
  isOpen: boolean
  onAccept: () => void
}

export function TermsOfService({ isOpen, onAccept }: TermsOfServiceProps) {
  const [accepted, setAccepted] = useState(false)

  const handleAccept = () => {
    if (accepted) {
      onAccept()
    }
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif">Terms of Service</DialogTitle>
          <DialogDescription className="text-sm">
            Please read and accept our Terms of Service before using SmartDCA.ai
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[600px] w-full rounded-md border p-4 bg-white">
          <div className="space-y-6 text-gray-900" style={{ fontFamily: "system-ui, sans-serif" }}>
            <h1 className="text-3xl font-bold text-center mb-6" style={{ fontFamily: "Georgia, serif" }}>
              Terms of Service
            </h1>
            <p className="text-sm italic">Effective Date: January 23, 2025</p>

            {termsOfServiceSections.map((section, index) => (
              <div key={index} className="mb-6">
                <h2
                  className="text-xl font-semibold mb-2"
                  style={{ fontFamily: "Georgia, serif" }}
                >{`${index + 1}. ${section.title}`}</h2>
                <div className="pl-4">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className="mb-2 text-sm leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                  {section.list && (
                    <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                      {section.list.map((item, iIndex) => (
                        <li key={iIndex}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" checked={accepted} onCheckedChange={(checked) => setAccepted(checked as boolean)} />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have read and accept the Terms of Service
            </label>
          </div>
          <Button onClick={handleAccept} disabled={!accepted}>
            Accept and Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

