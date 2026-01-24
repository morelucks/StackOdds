"use client"

import { useState, useEffect, useMemo } from "react"
import { CONTRACT_ADDRESS } from "@/lib/constants"
// TODO: Implement Stacks contract interactions
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useStacks } from "@/hooks/useStacks"
import { getStacksAddress } from "@/lib/wallet-utils"

interface TradingFormProps {
    marketId: string
    outcome: "YES" | "NO"
    probability: number
    isExpired?: boolean
}

export function TradingForm({ marketId, outcome, probability, isExpired = false }: TradingFormProps) {
    // TODO: Update to use Stacks wallet instead of EVM
    const { isConnected: isStacksConnected } = useStacks()
    const queryClient = useQueryClient()

    // For now, using Stacks wallet address
    const { userData } = useStacks()
    const walletAddress = userData ? getStacksAddress(userData) : null

    const [amount, setAmount] = useState("")

    const [approveHash, setApproveHash] = useState<string | null>(null)
    const [isApprovePending, setIsApprovePending] = useState(false)
    const [buyHash, setBuyHash] = useState<string | null>(null)
    const [isBuyPending, setIsBuyPending] = useState(false)


    // TODO: Replace with Stacks contract read
    // For now, setting allowance to 0 - needs Stacks implementation
    const allowance = BigInt(0)
    const refetchAllowance = () => {}


    useEffect(() => {
        if (approveHash && !isApprovePending) {

            setTimeout(() => {
                refetchAllowance()
                toast.success("USDC Approved!")
            }, 2000)
        }
    }, [approveHash, isApprovePending, refetchAllowance])

    // Normalize amount to BigInt (microSTX - 6 decimals)
    const amountBI = useMemo(() => {
        try {
            return amount ? BigInt(Math.floor(parseFloat(amount) * 1000000)) : BigInt(0)
        } catch {
            return BigInt(0)
        }
    }, [amount])

    const isAllowanceSufficient = allowance ? allowance >= amountBI : false


    async function handleApprove() {
        if (!isStacksConnected) {
            toast.info("Please connect your Bitcoin wallet first")
            return
        }

        if (!walletAddress) {
            toast.error("Wallet not available. Please reconnect your wallet.")
            return
        }

        try {
            setIsApprovePending(true)

            // TODO: Implement Stacks token approval using @stacks/transactions
            // Use makeContractCall for token approval
            toast.error("Stacks token approval not yet implemented.")
            return

            setApproveHash(hash)
            toast.success("Approval transaction sent!")
            setIsApprovePending(false)
        } catch (error) {
            setIsApprovePending(false)
            toast.error(`Failed to approve USDC: ${(error as any)?.message || "Unknown error"}`)
        }
    }

    async function handleBuy() {
        if (!isStacksConnected) {
            toast.info("Please connect your Bitcoin wallet first")
            return
        }

        if (!walletAddress) {
            toast.error("Wallet not available. Please reconnect your wallet.")
            return
        }

        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Enter a valid amount")
            return
        }

        try {
            setIsBuyPending(true)

            const functionName = outcome === "YES" ? "buyYES" : "buyNO"

            // TODO: Implement Stacks contract call using @stacks/transactions
            // Use makeContractCall for buy-yes or buy-no function
            toast.error("Stacks transactions not yet implemented. Please use Stacks wallet.")
            return

            setBuyHash(hash)
            toast.success(`Buy ${outcome} transaction sent!`)
            setAmount("")

            // Invalidate the graph query to trigger a refetch
            // Note: Data might not be available immediately from subgraph, 
            // but this ensures we try to get the latest state
            queryClient.invalidateQueries({ queryKey: ['sharesBoughts', marketId] })

            setIsBuyPending(false)
        } catch (error) {
            setIsBuyPending(false)
            toast.error(`Failed to buy ${outcome}: ${(error as any)?.message || "Unknown error"}`)
        }
    }

    const isPending = isApprovePending || isBuyPending
    const buttonLabel = !isStacksConnected
        ? "Connect Bitcoin Wallet to Trade"
        : isApprovePending
            ? "Approving..."
            : isAllowanceSufficient
                ? (isBuyPending ? "Buying..." : `Buy ${outcome}`)
                : "Approve USDC"

    const isGreen = outcome === "YES"
    const colorClass = isGreen ? "text-emerald-500" : "text-red-500"
    const bgClass = isGreen ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"

    return (
        <div className="space-y-4">
            {/* Price Display */}
            <div className="flex justify-between items-end border-b border-border pb-4">
                <span className="text-xs md:text-sm font-medium text-muted-foreground">Current Price</span>
                <div className="text-right">
                    <div className={`text-2xl md:text-3xl font-bold ${colorClass}`}>{probability}%</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground">1 <span className="font-bold">{outcome}</span> = ${probability / 100}</div>
                </div>
            </div>

            {/* Input Section */}
            {!isExpired && (
                <div className="space-y-3">
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="0.00"
                            className="pr-16 text-base md:text-lg font-medium border-border bg-secondary h-10 md:h-12 focus-visible:ring-1 focus-visible:ring-primary/50 text-foreground"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={isPending}
                            min={0}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                            USDC
                        </div>
                    </div>

                    {/* Simulated Output (Optional, could add later if logic existed) */}
                    {/* <div className="flex justify-between text-xs text-muted-foreground px-1">
                    <span>Est. Return</span>
                    <span className="text-green-400">+$0.00 (0%)</span>
                </div> */}

                    <Button
                        className={`w-full h-10 md:h-12 font-bold text-sm md:text-base transition-all ${isAllowanceSufficient ? bgClass : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                        onClick={!isStacksConnected ? undefined : (isAllowanceSufficient ? handleBuy : handleApprove)}
                        disabled={isPending || (isStacksConnected && (!amount || parseFloat(amount) <= 0)) || !isStacksConnected}
                        variant="default"
                    >
                        {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {buttonLabel}
                    </Button>
                </div>
            )}

            {buyHash && (
                <div className="p-3 rounded bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 break-all">
                    <span className="font-semibold block mb-1">Transaction Sent:</span>
                    {buyHash}
                </div>
            )}
        </div>
    )
}
