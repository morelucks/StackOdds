"use client"

import { CONTRACT_ADDRESS } from "@/lib/constants"
import { Market } from "@/lib/mock-data"
import { useEffect, useState } from "react"
import { fetchIPFSMetadata, getIPFSUrl } from "@/lib/ipfs"
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions'
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network'

// Use testnet by default, can be configured via environment variable
const NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;

export function useMarket(marketId: string) {
    const [marketData, setMarketData] = useState<any>(null)
    const [isLoadingMarket, setIsLoadingMarket] = useState(true)
    const [metadata, setMetadata] = useState<any>(null)
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)

    // Parse contract address
    const [contractAddress, contractName] = CONTRACT_ADDRESS.split('.')

    // Fetch market data from Stacks contract
    useEffect(() => {
        const fetchMarket = async () => {
            setIsLoadingMarket(true)
            try {
                const result = await fetchCallReadOnlyFunction({
                    network: NETWORK,
                    contractAddress,
                    contractName,
                    functionName: 'get-market',
                    functionArgs: [{ type: 'uint', value: BigInt(marketId) }],
                    senderAddress: contractAddress, // Use contract address as sender for read-only calls
                })

                const json = cvToJSON(result)
                if (json.value) {
                    setMarketData(json.value)
                }
            } catch (error) {
                console.error('Error fetching market:', error)
            } finally {
                setIsLoadingMarket(false)
            }
        }

        fetchMarket()
    }, [marketId, contractAddress, contractName])

    // Fetch metadata from IPFS
    useEffect(() => {
        if (!marketData) return

        const fetchMetadata = async () => {
            const cId = marketData['c-id'] || marketData.cId

            if (!cId) return

            setIsLoadingMetadata(true)
            const meta = await fetchIPFSMetadata(cId)
            setMetadata(meta)
            setIsLoadingMetadata(false)
        }

        fetchMetadata()
    }, [marketData])

    // Transform data
    let market: Market | null = null

    if (marketData && marketData.exists) {
        const question = marketData.question || ''
        const cId = marketData['c-id'] || marketData.cId

        // Calculate probability (simplified - you may need to implement proper LMSR pricing)
        const qYes = Number(marketData['q-yes'] || marketData.qYes || 0)
        const qNo = Number(marketData['q-no'] || marketData.qNo || 0)
        const total = qYes + qNo
        const probability = total > 0 ? (qYes / total) * 100 : 50

        // Image
        let imageUrl = "/bitcoin-concept.png"
        if (metadata?.image) {
            if (metadata?.imageSource === "cloudinary") {
                imageUrl = metadata.image;
            } else {
                imageUrl = getIPFSUrl(metadata.image)
            }
        } else if (cId && cId.includes("TestImageCid")) {
            imageUrl = "/super-bowl-atmosphere.png"
        }

        market = {
            id: marketId,
            title: question,
            image: imageUrl,
            type: "binary",
            outcomes: [
                { name: "Yes", probability: Math.round(probability) },
                { name: "No", probability: 100 - Math.round(probability) },
            ],
            volume: "0", // Placeholder
            tag: "Crypto", // Placeholder
            description: metadata?.description || "",
            resolutionSource: metadata?.resolutionSource || "",
            category: metadata?.category || "General",
            startDate: marketData['start-time'] ? new Date(Number(marketData['start-time']) * 1000).toLocaleString() : "",
            endDate: marketData['end-time'] ? new Date(Number(marketData['end-time']) * 1000).toLocaleString() : "",
            startTime: marketData['start-time'] ? Number(marketData['start-time']) : undefined,
            endTime: marketData['end-time'] ? Number(marketData['end-time']) : undefined,
            resolved: marketData.resolved || false,
            yesWon: marketData['yes-won'] || marketData.yesWon || false,
            isExpired: marketData['end-time'] ? new Date() > new Date(Number(marketData['end-time']) * 1000) : false,
        } as Market
    }

    return {
        market,
        isLoading: isLoadingMarket || isLoadingMetadata
    }
}
