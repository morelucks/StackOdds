import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import {
    makeContractCall,
    broadcastTransaction,
    AnchorMode,
    PostConditionMode,
    getAddressFromPrivateKey,
    uintCV,
    principalCV
} from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';

// Get the project root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');
const projectRoot = join(__dirname, '..', '..');

// Read private key from .env file
const envContent = readFileSync(join(projectRoot, '.env'), 'utf-8');
const privateKeyMatch = envContent.match(/MAINNET_PRIVATE_KEY="([^"]+)"/);
if (!privateKeyMatch) {
    throw new Error('MAINNET_PRIVATE_KEY not found in .env file');
}
const privateKey = privateKeyMatch[1];
const address = getAddressFromPrivateKey(privateKey, 'mainnet');
console.log(`Interacting from address: ${address}`);

const API_ENDPOINTS = [
    'https://api.hiro.so',
    'https://stacks-node-api.mainnet.stacks.co',
];

const primaryApiUrl = API_ENDPOINTS[0];
const network = {
    ...STACKS_MAINNET,
    getCoreApiUrl: () => primaryApiUrl,
    getBroadcastApiUrl: () => primaryApiUrl,
    getAccountApiUrl: () => primaryApiUrl,
};

// Contract configuration
const CONTRACT_ADDRESS = 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B';
const CONTRACT_NAME = 'stackoddpoll';
const FEE = 23000; // 0.023 STX as requested

const FETCH_TIMEOUT = 15000;
const MAX_RETRIES = 3;

async function fetchWithRetry(url: string, options: RequestInit = {}) {
    let lastError: any;
    for (const endpoint of API_ENDPOINTS) {
        let retries = MAX_RETRIES;
        const targetUrl = url.startsWith('http') ? url : `${endpoint}${url}`;
        while (retries > 0) {
            try {
                const response = await fetch(targetUrl, {
                    ...options,
                    signal: AbortSignal.timeout(FETCH_TIMEOUT)
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            } catch (error: any) {
                lastError = error;
                retries--;
                if (retries > 0) await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    throw lastError;
}

async function getCurrentNonce() {
    const accountInfo = await fetchWithRetry(`/v2/accounts/${address}?proof=0`);
    let nonce = accountInfo.nonce;

    // Check mempool for pending nonces
    try {
        const mempool = await fetchWithRetry(`/extended/v1/tx/mempool?address=${address}&limit=50`);
        if (mempool.results && mempool.results.length > 0) {
            const sentTransactions = mempool.results.filter((tx: any) => tx.sender_address === address);
            if (sentTransactions.length > 0) {
                const highestMempoolNonce = Math.max(...sentTransactions.map((tx: any) => tx.nonce));
                if (highestMempoolNonce >= nonce) nonce = highestMempoolNonce + 1;
            }
        }
    } catch (e) { }

    return nonce;
}

async function main() {
    try {
        console.log(`Starting 20 interactions for ${CONTRACT_NAME}...`);
        console.log(`Fee per transaction: ${FEE / 1000000} STX`);

        let currentNonce = await getCurrentNonce();
        const txIds = [];

        for (let i = 1; i <= 20; i++) {
            console.log(`\n[${i}/20] Minting 1,000 SPOLL tokens to self...`);
            console.log(`Using nonce: ${currentNonce}`);

            const txOptions = {
                contractAddress: CONTRACT_ADDRESS,
                contractName: CONTRACT_NAME,
                functionName: 'mint',
                functionArgs: [uintCV(1000000), principalCV(address)],
                senderKey: privateKey,
                network,
                anchorMode: AnchorMode.Any,
                postConditionMode: PostConditionMode.Allow,
                fee: FEE,
                nonce: currentNonce,
            };

            const transaction = await makeContractCall(txOptions);
            const broadcastResponse = await broadcastTransaction({ transaction, network });

            if ('error' in broadcastResponse && broadcastResponse.error) {
                console.error(`❌ Error in tx ${i}: ${broadcastResponse.error}`);
                if ('reason' in broadcastResponse) console.error(`Reason: ${broadcastResponse.reason}`);
                // If it's a nonce error, try to refresh nonce for next one
                if (broadcastResponse.error === 'ConflictingNonceInMempool' || broadcastResponse.error === 'NonceTooLow') {
                    currentNonce = await getCurrentNonce();
                    continue;
                }
            } else {
                const txid = (broadcastResponse as any).txid;
                console.log(`✅ Transaction broadcast! TXID: ${txid}`);
                txIds.push(txid);
                currentNonce++;
            }

            // Small delay between broadcasts to avoid hitting rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n' + '='.repeat(50));
        console.log(`✅ Completed broadcasting ${txIds.length} transactions!`);
        console.log(`Total gas used: ${(txIds.length * FEE) / 1000000} STX`);

    } catch (error: any) {
        console.error('\n❌ Script failed:', error.message);
        process.exit(1);
    }
}

main();
