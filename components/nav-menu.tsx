"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Menu } from "lucide-react"
import { motion } from "framer-motion"

const mainNavItems = [
  { href: "/", label: "Token Creator" },
  { href: "/create-liquidity-pool", label: "Create LP" },
  { href: "/update-metadata", label: "Update Metadata" },
  { href: "/burn-tokens", label: "Burn Tokens" },
  { href: "/smart-dca", label: "SmartDCA", suffix: ".ai" },
  { href: "/membership", label: "Join" },
]

const faqItem = { href: "/faq", label: "FAQ" }

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
}

const item = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      duration: 0.3,
    },
  },
}

export function NavMenu() {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600 transition-colors">
          <Menu className="h-12 w-12" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 bg-transparent border-none shadow-none">
        <motion.nav
          className="flex flex-col h-[calc(100vh-6rem)]"
          variants={container}
          initial="hidden"
          animate={open ? "show" : "hidden"}
        >
          <div className="space-y-2">
            {mainNavItems.map((navItem) => (
              <motion.div key={navItem.href} variants={item}>
                <Link
                  href={navItem.href}
                  className={`block px-2 py-1 transition-colors text-gray-600 hover:text-gray-800 ${
                    navItem.label === "Join" ? "font-bold text-lg" : "text-lg font-medium"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {navItem.label}
                  {navItem.suffix && <span className="text-blue-600">{navItem.suffix}</span>}
                </Link>
              </motion.div>
            ))}
          </div>
          <motion.div className="mt-auto" variants={item}>
            <Link
              href={faqItem.href}
              className="block px-2 py-1 transition-colors text-gray-600 hover:text-gray-800 text-sm"
              onClick={() => setOpen(false)}
            >
              {faqItem.label}
            </Link>
          </motion.div>
        </motion.nav>
      </PopoverContent>
    </Popover>
  )
}

