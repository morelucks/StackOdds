"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CONTRACT_ADDRESS } from "@/lib/constants"
import { claimWinnings } from "@/lib/stacks-transactions"
import { toast } from "sonner"
import { Loader2, Coins } from "lucide-react"
import { useStacks } from "@/hooks/useStacks"

interface RedeemSharesProps {
    marketId: string
    isResolved: boolean
    hasWinnings: boolean
}

/**
 * Component for users to redeem their winning shares for collateral.
 * Requires the market to be resolved and the user to hold winning shares.
 */
export function RedeemShares({ marketId, isResolved, hasWinnings }: RedeemSharesProps) {
    const { isConnected } = useStacks()
    const [isPending, setIsPending] = useState(false)
    const [txHash, setTxHash] = useState<string | null>(null)

    const handleClaim = async () => {
        if (!isConnected) {
            toast.info("Please connect your wallet to claim winnings.")
            return
        }

        setIsPending(true)
        try {
            const [contractAddress, contractName] = CONTRACT_ADDRESS.split('.')

            await claimWinnings({
                contractAddress,
                contractName,
                marketId: parseInt(marketId),
                onFinish: (data: any) => {
                    setTxHash(data.txId)
                    toast.success("Redemption transaction broadcasted!")
                    setIsPending(false)
                },
                onCancel: () => {
                    toast.info("Claim cancelled")
                    setIsPending(false)
                }
            })
        } catch (error) {
            setIsPending(false)
            toast.error(`Failed to claim: ${(error as any)?.message || "Unknown error"}`)
        }
    }

    if (!isResolved || !hasWinnings) return null

    return (
        <Card className="border-emerald-500/50 bg-emerald-950/10 transition-all hover:bg-emerald-950/20">
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
                <CardTitle className="text-emerald-500 text-sm md:text-lg flex items-center gap-2">
                    <Coins className="h-4 w-4 md:h-5 md:w-5" />
                    Winnings Available
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-6 pt-0 md:pt-0">
                <p className="text-xs md:text-sm text-emerald-200/80">
                    This market has been resolved! You hold winning outcome tokens that can be redeemed for USDCx collateral.
                </p>

                <Button
                    variant="default"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold h-10 md:h-12 shadow-lg shadow-emerald-900/20"
                    disabled={isPending}
                    onClick={handleClaim}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redeeming...
                        </>
                    ) : (
                        "Claim Your Winnings"
                    )}
                </Button>

                {txHash && (
                    <div className="mt-2 p-3 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] md:text-xs text-blue-200 break-all">
                        <span className="font-semibold block mb-1">Redemption Sent:</span>
                        {txHash}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
