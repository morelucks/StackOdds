"use client"

import { CONTRACT_ADDRESS } from "@/lib/constants"
import { Market } from "@/lib/mock-data"
import { useEffect, useState } from "react"
import { fetchIPFSMetadata, getIPFSUrl } from "@/lib/ipfs"
import { fetchCallReadOnlyFunction, cvToJSON } from '@stacks/transactions'
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network'

// Use testnet by default, can be configured via environment variable
const NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;

export function useMarkets() {
    const [marketCount, setMarketCount] = useState<number>(0)
    const [isLoadingMarketCount, setIsLoadingMarketCount] = useState(true)
    const [marketsData, setMarketsData] = useState<any[]>([])
    const [isLoadingMarkets, setIsLoadingMarkets] = useState(false)
    const [metadataMap, setMetadataMap] = useState<Record<string, any>>({})

    // Parse contract address
    const [contractAddress, contractName] = CONTRACT_ADDRESS.split('.')

    // Fetch market count
    useEffect(() => {
        const fetchCount = async () => {
            setIsLoadingMarketCount(true)
            try {
                const result = await fetchCallReadOnlyFunction({
                    network: NETWORK,
                    contractAddress,
                    contractName,
                    functionName: 'get-market-count',
                    functionArgs: [],
                    senderAddress: contractAddress,
                })

                const json = cvToJSON(result)
                const count = json.value ? Number(json.value.value) : 0
                setMarketCount(count)
            } catch (error) {
                console.error('Error fetching market count:', error)
            } finally {
                setIsLoadingMarketCount(false)
            }
        }

        fetchCount()
    }, [contractAddress, contractName])

    // Fetch all markets
    useEffect(() => {
        if (marketCount === 0) return

        const fetchMarkets = async () => {
            setIsLoadingMarkets(true)
            try {
                const marketPromises = Array.from({ length: marketCount }, (_, i) => 
                    fetchCallReadOnlyFunction({
                        network: NETWORK,
                        contractAddress,
                        contractName,
                        functionName: 'get-market',
                        functionArgs: [{ type: 'uint', value: BigInt(i + 1) }],
                        senderAddress: contractAddress,
                    })
                )

                const results = await Promise.all(marketPromises)
                const markets = results.map((result, index) => {
                    try {
                        const json = cvToJSON(result)
                        return json.value || null
                    } catch (error) {
                        console.error(`Error parsing market ${index + 1}:`, error)
                        return null
                    }
                }).filter(m => m !== null)

                setMarketsData(markets)
            } catch (error) {
                console.error('Error fetching markets:', error)
            } finally {
                setIsLoadingMarkets(false)
            }
        }

        fetchMarkets()
    }, [marketCount, contractAddress, contractName])

    // Fetch IPFS metadata
    useEffect(() => {
        if (!marketsData.length) return

        const fetchAll = async () => {
            const cidsToFetch = new Set<string>()
            marketsData.forEach((data) => {
                const cId = data['c-id'] || data.cId
                if (cId && !metadataMap[cId]) {
                    cidsToFetch.add(cId)
                }
            })

            if (cidsToFetch.size === 0) return

            const results = await Promise.all(
                Array.from(cidsToFetch).map(async (cid) => {
                    return { cid, data: await fetchIPFSMetadata(cid) }
                })
            )

            setMetadataMap((prev) => {
                const next = { ...prev }
                let hasUpdates = false
                results.forEach(({ cid, data }) => {
                    if (data && !next[cid]) {
                        next[cid] = data
                        hasUpdates = true
                    }
                })
                return hasUpdates ? next : prev
            })
        }

        fetchAll()
    }, [marketsData, metadataMap])

    // Transform data
    const markets: Market[] = marketsData.map((data, index): Market | null => {
        if (!data || !data.exists) return null

        const question = data.question || ''
        const cId = data['c-id'] || data.cId
        const startTime = data['start-time'] ? Number(data['start-time']) : undefined
        const endTime = data['end-time'] ? Number(data['end-time']) : undefined

        // Calculate probability
        const qYes = Number(data['q-yes'] || data.qYes || 0)
        const qNo = Number(data['q-no'] || data.qNo || 0)
        const total = qYes + qNo
        const probability = total > 0 ? (qYes / total) * 100 : 50

        // Image
        let imageUrl = "/prediction-market-placeholder.png"
        const metadata = metadataMap[cId]
        if (metadata?.image) {
            if (metadata?.imageSource === "cloudinary") {
                imageUrl = metadata.image;
            } else {
                imageUrl = getIPFSUrl(metadata.image)
            }
        } else if (cId && cId.includes("TestImageCid")) {
            imageUrl = "/super-bowl-atmosphere.png"
        }

        return {
            id: (index + 1).toString(),
            title: question,
            image: imageUrl,
            type: "binary",
            outcomes: [
                { name: "Yes", probability: Math.round(probability) },
                { name: "No", probability: 100 - Math.round(probability) },
            ],
            volume: "0",
            tag: "",
            startTime,
            endTime,
        }
    }).filter((m): m is Market => m !== null)

    return {
        markets,
        isLoading: isLoadingMarketCount || isLoadingMarkets,
    }
}
