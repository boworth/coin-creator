"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z.object({
  amount: z.number().positive("Amount must be positive").min(0.000001, "Minimum amount is 0.000001"),
  percentage: z.string().optional(),
})

interface Pool {
  address: string
  tokenSymbol: string
  pairedTokenSymbol: string
}

interface LiquidityPoolManagerProps {
  pools: Pool[]
}

export function LiquidityPoolManager({ pools }: LiquidityPoolManagerProps) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(pools[0] || null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      percentage: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>, action: "add" | "remove") {
    if (!selectedPool) return

    try {
      setIsProcessing(true)
      // Simulate liquidity management action
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast({
        title: `Liquidity ${action === "add" ? "Added" : "Removed"} (Simulated)`,
        description: `Successfully ${action === "add" ? "added" : "removed"} ${values.amount} ${
          selectedPool.tokenSymbol
        }-${selectedPool.pairedTokenSymbol} LP tokens`,
      })
      form.reset()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to modify liquidity'
      toast({
        title: `Error ${action === "add" ? "Adding" : "Removing"} Liquidity`,
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePercentageChange = (percentage: string) => {
    // This is a placeholder. In a real application, you would calculate the actual amount based on the user's balance
    const simulatedBalance = 1000
    const amount = (Number(percentage) / 100) * simulatedBalance
    form.setValue("amount", amount)
    form.setValue("percentage", percentage)
  }

  if (pools.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No liquidity pools created yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Liquidity Pools</CardTitle>
        <CardDescription>Add or remove liquidity from your Raydium V3 pools</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Select onValueChange={(value) => setSelectedPool(pools.find((pool) => pool.address === value) || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a pool to manage" />
            </SelectTrigger>
            <SelectContent>
              {pools.map((pool) => (
                <SelectItem key={pool.address} value={pool.address}>
                  {pool.tokenSymbol}-{pool.pairedTokenSymbol} Pool
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedPool && (
          <Tabs defaultValue="add">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add">Add Liquidity</TabsTrigger>
              <TabsTrigger value="remove">Remove Liquidity</TabsTrigger>
            </TabsList>
            <TabsContent value="add">
              <Form {...form}>
                <form onSubmit={form.handleSubmit((values) => onSubmit(values, "add"))} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount to Add</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={`Enter amount of ${selectedPool.tokenSymbol}-${selectedPool.pairedTokenSymbol} LP tokens`}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Enter the amount of LP tokens to add</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isProcessing}>
                    {isProcessing ? "Adding Liquidity..." : "Add Liquidity"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="remove">
              <Form {...form}>
                <form onSubmit={form.handleSubmit((values) => onSubmit(values, "remove"))} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount to Remove</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={`Enter amount of ${selectedPool.tokenSymbol}-${selectedPool.pairedTokenSymbol} LP tokens`}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>Enter the amount of LP tokens to remove</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => handlePercentageChange("25")}>
                      25%
                    </Button>
                    <Button type="button" variant="outline" onClick={() => handlePercentageChange("50")}>
                      50%
                    </Button>
                    <Button type="button" variant="outline" onClick={() => handlePercentageChange("100")}>
                      100%
                    </Button>
                  </div>
                  <Button type="submit" className="w-full" disabled={isProcessing}>
                    {isProcessing ? "Removing Liquidity..." : "Remove Liquidity"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

