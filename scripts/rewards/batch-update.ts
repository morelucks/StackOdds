import {
    makeContractCall,
    broadcastTransaction,
    AnchorMode,
    uintCV,
    principalCV,
    PostConditionMode
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';

/**
 * Batch Update Script for Rewards Registry
 * 
 * This script is used by developers/admins to sync indexed impact scores
 * to the on-chain Clarity contract.
 */

const NETWORK = new StacksMainnet();
const PRIVATE_KEY = process.env.REWARD_ADMIN_KEY || '';
const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME = 'rewards-registry';

interface UpdateRequest {
    user: string;
    score: number;
}

const updates: UpdateRequest[] = [
    { user: 'SP2..W5Z', score: 850 },
    { user: 'SP3..X4Y', score: 920 },
    { user: 'SP1..V6A', score: 430 },
];

async function runBatchUpdate() {
    if (!PRIVATE_KEY) throw new Error('Admin key missing');

    for (const update of updates) {
        console.log(`Updating score for ${update.user} to ${update.score}...`);

        const txOptions = {
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'update-score',
            functionArgs: [
                principalCV(update.user),
                uintCV(update.score),
            ],
            senderKey: PRIVATE_KEY,
            validateWithAbis: true,
            network: NETWORK,
            anchorMode: AnchorMode.Any,
            postConditionMode: PostConditionMode.Allow,
        };

        try {
            const transaction = await makeContractCall(txOptions);
            const result = await broadcastTransaction(transaction, NETWORK);
            console.log(`Broadcast success! TXID: ${result.txid}`);
        } catch (e) {
            console.error(`Failed to update ${update.user}:`, e);
        }
    }
}

runBatchUpdate().catch(console.error);
