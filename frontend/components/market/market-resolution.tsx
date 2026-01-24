"use client"

import { useState } from "react"
import { useUserRights } from "@/hooks/useUserRights"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CONTRACT_ADDRESS } from "@/lib/constants"
import { toast } from "sonner"
// TODO: Implement Stacks contract interactions

interface MarketResolutionProps {
    marketId: string
}

export function MarketResolution({ marketId }: MarketResolutionProps) {
    const { hasCreationRights, isConnected } = useUserRights()
    const [hash, setHash] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [isConfirmed, setIsConfirmed] = useState(false)
    const [resolvingOutcome, setResolvingOutcome] = useState<"YES" | "NO" | null>(null)

    const handleResolve = async (victoryOutcome: boolean) => {
        setResolvingOutcome(victoryOutcome ? "YES" : "NO")
        setIsPending(true)
        try {
            // TODO: Implement Stacks contract call using @stacks/transactions
            // Use makeContractCall for resolve-market function
            toast.error("Stacks transactions not yet implemented.")
            setIsPending(false)
            return
            // const txHash = await sendStacksTransaction(...)
            // setHash(txHash)
        } catch (error) {
            setIsPending(false)
            toast.error(`Failed to resolve market: ${(error as any)?.message || "Unknown error"}`)
        }
    }

    if (!isConnected || !hasCreationRights) {
        return null
    }

    // isPending already defined above

    return (
        <Card className="border-orange-500/50 bg-orange-950/10 shadow-none md:shadow-sm">
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
                <CardTitle className="text-orange-500 text-sm md:text-lg">Admin Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-6 pt-0 md:pt-0">
                <p className="text-xs md:text-sm text-muted-foreground">
                    As an admin/moderator, you can resolve this market. This action is irreversible.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 h-8 md:h-10 text-xs md:text-sm"
                        disabled={isPending}
                        onClick={() => handleResolve(true)}
                    >
                        {isPending && resolvingOutcome === "YES" ? "Resolving..." : "Resolve YES Won"}
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 md:h-10 text-xs md:text-sm"
                        disabled={isPending}
                        onClick={() => handleResolve(false)}
                    >
                        {isPending && resolvingOutcome === "NO" ? "Resolving..." : "Resolve NO Won"}
                    </Button>
                </div>

                {hash && <div className="text-[10px] md:text-xs text-muted-foreground break-all">Tx: {hash}</div>}
                {isConfirmed && <div className="text-xs md:text-sm text-green-500 font-medium">Market Resolved Successfully!</div>}
            </CardContent>
        </Card>
    )
}
