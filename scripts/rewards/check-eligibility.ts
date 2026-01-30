import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { fetchCallReadOnlyFunction, cvToJSON, principalCV } from '@stacks/transactions';

const NETWORK = process.env.STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
const CONTRACT_ADDRESS = 'SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS';
const CONTRACT_NAME = 'rewards-registry';

async function checkRegistration(address: string) {
    console.log(`Checking registration for ${address}...`);
    try {
        const result = await fetchCallReadOnlyFunction({
            network: NETWORK,
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-user-data',
            functionArgs: [principalCV(address)],
            senderAddress: address,
        });
        const json = cvToJSON(result);
        if (json.value) {
            console.log(`✅ ${address} registered as: ${json.value['github-handle'].value}`);
            return { registered: true, handle: json.value['github-handle'].value };
        }
        console.log(`❌ ${address} not registered.`);
        return { registered: false, handle: null };
    } catch (error) {
        console.error(`Error checking ${address}:`, (error as Error).message);
        return { registered: false, handle: null };
    }
}

async function runBatch(addresses: string[]) {
    console.log(`\nStarting check for ${addresses.length} addresses...\n`);
    const results = [];
    for (const addr of addresses) {
        const res = await checkRegistration(addr);
        results.push({ address: addr, ...res });
    }
    console.log('\n--- Registration Status Report ---');
    console.table(results);
}

const addressesToCheck = [
    'SP2JX070HDPDDAF38GEG0JS8Y0W0C25KDBH72XG3X',
    'SP3A82C72WAVNNSAKF9CGB1A16KK3HT1KGE99D937',
    'SP1P72Z3704YMTTBM7S3DKM6C0B83JDB1XQ0JEDXW',
    'SPZM8FCHK7X098V872H998D0BAJYK59Q2E72594D7',
];

runBatch(addressesToCheck).catch(console.error);
