"use client"

import { Button } from "@/components/ui/button"
import { CONTRACT_ADDRESS } from "@/lib/constants"
import { useStacks } from "@/hooks/useStacks"
import { claimWinnings } from "@/lib/stacks-transactions"
// TODO: Implement Stacks contract interactions
import { Loader2, Trophy } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ClaimWinningsProps {
    marketId: string
    resolved?: boolean
    yesWon?: boolean
}

export function ClaimWinnings({ marketId, resolved, yesWon }: ClaimWinningsProps) {
    const { isConnected } = useStacks()
    const [hash, setHash] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    useEffect(() => {
        if (isSuccess) {
            toast.success("Winnings claimed successfully!")
        }
    }, [isSuccess])

    const handleClaim = async () => {
        setIsPending(true)
        try {
            const [contractAddress, contractName] = CONTRACT_ADDRESS.split('.')
            await claimWinnings({
                contractAddress,
                contractName,
                marketId: parseInt(marketId),
                onFinish: (data: any) => {
                    setHash(data.txId)
                    setIsSuccess(true)
                },
                onCancel: () => {
                    setIsPending(false)
                }
            })
        } catch (error) {
            setIsPending(false)
            toast.error(`Failed to claim winnings: ${(error as any)?.message || "Unknown error"}`)
        }
    }

    if (!isConnected || !resolved) {
        return null
    }

    return (
        <div className="w-full p-4 border rounded-lg bg-green-500/10 border-green-500/20 space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                <Trophy className="w-5 h-5" />
                <span>Market Resolved: {yesWon ? "YES" : "NO"} Won</span>
            </div>
            <p className="text-sm text-muted-foreground">
                If you hold winning shares, claim your payout now.
            </p>
            <Button
                onClick={handleClaim}
                disabled={isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
                {isPending ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Claiming...
                    </>
                ) : (
                    "Claim Winnings"
                )}
            </Button>
        </div>
    )
}
