/**
 * Stacks Indexer Utility for StackOdds Rewards
 * 
 * Tracks activity and impact of smart contracts deployed on Stacks.
 */

export interface ContractActivity {
    contractId: string;
    txCount: number;
    uniqueCallers: number;
    lastActiveBlock: number;
    totalFeesPaid: number;
}

const STACKS_API_BASE = 'https://api.mainnet.hiro.so';

export async function fetchUserContracts(address: string): Promise<ContractActivity[]> {
    try {
        const response = await fetch(`${STACKS_API_BASE}/extended/v1/address/${address}/transactions?limit=50`);
        if (!response.ok) throw new Error('Failed to fetch transactions');

        const data = await response.json();
        const deployments = data.results.filter((tx: any) => tx.tx_type === 'smart_contract');

        const activities: ContractActivity[] = await Promise.all(
            deployments.map(async (deployment: any) => {
                const contractId = `${deployment.sender_address}.${deployment.smart_contract.contract_id.split('.')[1]}`;

                // Fetch specific contract metrics (simulated for brevity)
                // In reality, we would use a dedicated indexer or multiple API calls
                return {
                    contractId,
                    txCount: Math.floor(Math.random() * 1000) + 10,
                    uniqueCallers: Math.floor(Math.random() * 200) + 5,
                    lastActiveBlock: deployment.block_height,
                    totalFeesPaid: deployment.fee_rate
                };
            })
        );

        return activities;
    } catch (error) {
        console.error('Error indexing Stacks contracts:', error);
        return [];
    }
}

export function calculateContractImpact(activities: ContractActivity[]): number {
    return activities.reduce((acc, curr) => {
        // Weight unique users highly, followed by transaction count
        const baseScore = curr.uniqueCallers * 25 + curr.txCount * 2;
        // Multiplier for recent activity
        const recencyMultiplier = curr.lastActiveBlock > 170000 ? 1.2 : 1.0;
        return acc + (baseScore * recencyMultiplier);
    }, 0);
}
