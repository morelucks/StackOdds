"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Users, Droplets, BarChart3 } from "lucide-react"

interface MarketStatsProps {
    liquidity: string
    totalVolume: string
    tradersCount: number
    yesShares: number
    noShares: number
}

/**
 * Renders detailed market statistics including liquidity, volume, and share distribution.
 * Uses a progress bar to visualize the balance between YES and NO positions.
 */
export function MarketStats({
    liquidity,
    totalVolume,
    tradersCount,
    yesShares,
    noShares
}: MarketStatsProps) {
    const totalShares = yesShares + noShares
    const yesPercentage = totalShares > 0 ? (yesShares / totalShares) * 100 : 50

    return (
        <Card className="border-border bg-secondary/30 shadow-none border">
            <CardHeader className="p-4 pb-2 md:p-6 md:pb-4 border-b border-border/10">
                <CardTitle className="text-sm md:text-base font-semibold flex items-center gap-2 text-foreground">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Market Insights
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-6">
                {/* Top Metrics Row */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground">
                            <Droplets className="h-3 w-3" />
                            Liquidity
                        </div>
                        <div className="text-xs md:text-sm font-bold text-foreground">{liquidity} USDCx</div>
                    </div>
                    <div className="space-y-1 border-x border-border/50 px-2 md:px-4">
                        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            Volume
                        </div>
                        <div className="text-xs md:text-sm font-bold text-foreground">{totalVolume} USDCx</div>
                    </div>
                    <div className="space-y-1 pl-2">
                        <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            Traders
                        </div>
                        <div className="text-xs md:text-sm font-bold text-foreground">{tradersCount}</div>
                    </div>
                </div>

                {/* Share Distribution Visualization */}
                <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] md:text-xs font-semibold text-emerald-500 uppercase tracking-wider">YES Shares</span>
                        <span className="text-[10px] md:text-xs font-semibold text-red-500 uppercase tracking-wider">NO Shares</span>
                    </div>
                    <Progress value={yesPercentage} className="h-2 md:h-2.5 bg-red-500 rounded-full overflow-hidden" />
                    <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground mt-1 font-medium">
                        <span>{yesShares} shares</span>
                        <span>{noShares} shares</span>
                    </div>
                </div>

                <div className="pt-2 text-[10px] md:text-xs text-muted-foreground italic border-t border-border/10">
                    * Statistics are updated in real-time as transactions are confirmed on the Stacks blockchain.
                </div>
            </CardContent>
        </Card>
    )
}
