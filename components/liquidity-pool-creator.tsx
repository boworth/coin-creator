"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useMembership } from "@/contexts/membership-context"
import { InfoCircledIcon } from "@radix-ui/react-icons"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { LiquidityPoolManager } from "./liquidity-pool-manager"

const formSchema = z.object({
  tokenAddress: z.string().min(32, "Invalid token address").max(44, "Invalid token address"),
  pairedToken: z.string().min(1, "Please select a paired token"),
  initialLiquidity: z
    .number()
    .positive("Initial liquidity must be positive")
    .min(0.1, "Minimum initial liquidity is 0.1"),
  tokenAmount: z.number().positive("Token amount must be positive").min(1, "Minimum token amount is 1"),
  fee: z.string().min(1, "Please select a fee tier"),
})

const pairedTokens = [
  { value: "SOL", label: "SOL" },
  { value: "USDC", label: "USDC" },
  { value: "USDT", label: "USDT" },
  { value: "RAY", label: "RAY" },
]

const feeTiers = [
  { value: "0.01", label: "0.01%" },
  { value: "0.05", label: "0.05%" },
  { value: "0.3", label: "0.3%" },
  { value: "1", label: "1%" },
]

export function LiquidityPoolCreator() {
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [usdValue, setUsdValue] = useState<number | null>(null)
  const { isActive: isMembershipActive } = useMembership()
  const [poolCreated, setPoolCreated] = useState(false)
  const [poolDetails, setPoolDetails] = useState({ address: "", tokenSymbol: "", pairedTokenSymbol: "" })
  const [pools, setPools] = useState<
    Array<{
      address: string
      tokenSymbol: string
      pairedTokenSymbol: string
    }>
  >([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tokenAddress: "",
      pairedToken: "",
      initialLiquidity: 0,
      tokenAmount: 0,
      fee: "",
    },
  })

  useEffect(() => {
    const fetchUsdValue = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")
        const data = await response.json()
        const solToUsd = data.solana.usd
        setUsdValue(0.25 * solToUsd)
      } catch (error) {
        console.error("Failed to fetch USD value:", error)
      }
    }

    fetchUsdValue()
  }, [])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsCreating(true)
      // Simulate liquidity pool creation
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const simulatedPoolAddress = "SimulatedPoolAddress" + Math.random().toString(36).substring(2, 15)
      setPoolDetails({
        address: simulatedPoolAddress,
        tokenSymbol: "YourToken",
        pairedTokenSymbol: values.pairedToken,
      })
      setPools((prevPools) => [
        ...prevPools,
        {
          address: simulatedPoolAddress,
          tokenSymbol: "YourToken",
          pairedTokenSymbol: values.pairedToken,
        },
      ])
      setPoolCreated(true)
      toast({
        title: "Raydium V3 Liquidity Pool Created! (Simulated)",
        description: `Created pool for ${values.tokenAmount} of your tokens and ${values.initialLiquidity} ${values.pairedToken} with ${values.fee}% fee tier`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create liquidity pool'
      toast({
        title: "Error creating liquidity pool",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Raydium V3 Liquidity Pool</CardTitle>
          <CardDescription>Set up a new Raydium V3 liquidity pool for your token</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="tokenAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your token address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pairedToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paired Token</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select paired token" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pairedTokens.map((token) => (
                          <SelectItem key={token.value} value={token.value}>
                            {token.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initialLiquidity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Liquidity ({form.watch("pairedToken") || "Paired Token"})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter initial liquidity amount"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Amount of paired token to add to the pool</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tokenAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Token Amount</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          placeholder="Enter amount of your token"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                        <Button type="button" variant="outline" onClick={() => field.onChange(1000000)}>
                          Max
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>Amount of your token to add to the pool</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Tier</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fee tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {feeTiers.map((tier) => (
                          <SelectItem key={tier.value} value={tier.value}>
                            {tier.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the fee tier for your liquidity pool
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoCircledIcon className="h-4 w-4 inline-block ml-1 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Higher fees can attract more liquidity providers but may deter traders.</p>
                            <p>
                              Lower fees can attract more trading volume but may provide less incentive for liquidity
                              providers.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-lg border bg-card p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">Service Fee</h3>
                      <p className="text-sm text-muted-foreground">Required to create liquidity pool</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        {isMembershipActive ? <span className="text-green-600">Free</span> : "0.05 SOL"}
                      </div>
                      {!isMembershipActive && (
                        <div className="text-sm text-muted-foreground">
                          {usdValue ? `≈ $${(usdValue * 0.2).toFixed(2)} USD` : "Fetching USD value..."}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div>Raydium Fee</div>
                      <div>0.18 SOL</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>Gas Fee</div>
                      <div>0.02 SOL</div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Total Cost</h3>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{isMembershipActive ? "0.20 SOL" : "0.25 SOL"}</div>
                        <div className="text-sm text-muted-foreground">
                          {usdValue
                            ? `≈ $${(usdValue * (isMembershipActive ? 0.8 : 1)).toFixed(2)} USD`
                            : "Fetching USD value..."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full py-6 text-xl font-semibold" disabled={isCreating}>
                {isCreating ? "Creating Raydium V3 Liquidity Pool..." : "Create Raydium V3 Liquidity Pool"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      {pools.length > 0 ? (
        <LiquidityPoolManager pools={pools} />
      ) : (
        <Card className="flex items-center justify-center h-full">
          <CardContent>
            <p className="text-center text-muted-foreground">Create a liquidity pool to manage it here</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

