"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { WALLETS } from "@/lib/wallet-data"

interface WalletDialogProps {
  isOpen: boolean
  onClose: () => void
  onConnect: (walletId: string) => void
}

export function WalletDialog({ isOpen, onClose, onConnect }: WalletDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect a wallet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {WALLETS.map((wallet) => (
            <Button
              key={wallet.id}
              variant="outline"
              onClick={() => onConnect(wallet.id)}
              className="w-full justify-start text-left font-normal"
            >
              <Image
                src={wallet.logo || "/placeholder.svg"}
                alt={`${wallet.name} logo`}
                width={24}
                height={24}
                className="mr-2"
              />
              <span>{wallet.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

