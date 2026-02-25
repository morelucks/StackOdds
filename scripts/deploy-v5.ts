import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import {
    makeContractDeploy,
    makeContractCall,
    broadcastTransaction,
    AnchorMode,
    PostConditionMode,
    getAddressFromPrivateKey,
    ClarityVersion,
    principalCV
} from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');
const projectRoot = join(__dirname, '..');

const envContent = readFileSync(join(projectRoot, '.env'), 'utf-8');
const privateKeyMatch = envContent.match(/MAINNET_PRIVATE_KEY="([^"]+)"/);
if (!privateKeyMatch) throw new Error('MAINNET_PRIVATE_KEY not found');
const privateKey = privateKeyMatch[1];
const address = getAddressFromPrivateKey(privateKey, 'mainnet');

const network = STACKS_MAINNET;
const MANNET_API = 'https://api.hiro.so';

// Configuration
const NEW_MARKET_CONTRACT_NAME = 'stackodds-market-v5';
const COLLATERAL_TOKEN = 'SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.usdcx'; // Mainnet USDCx
const OUTCOME_TOKEN_CONTRACT = 'SP34MN3DMM07BNAWYJSHTS4B08T8JRVK8AT810X1B.stackodds-token-v1';

async function getCurrentNonce() {
    const response = await fetch(`${MANNET_API}/v2/accounts/${address}?proof=0`);
    const data = await response.json();
    return data.nonce;
}

async function deploy() {
    console.log(`Deploying ${NEW_MARKET_CONTRACT_NAME}...`);
    const codeBody = readFileSync(join(projectRoot, 'contracts/contract.clar'), 'utf-8');
    const nonce = await getCurrentNonce();

    const txOptions = {
        contractName: NEW_MARKET_CONTRACT_NAME,
        codeBody,
        senderKey: privateKey,
        network,
        anchorMode: AnchorMode.Any,
        fee: 260000, // 0.26 STX
        nonce,
        clarityVersion: ClarityVersion.Clarity2,
    };

    const transaction = await makeContractDeploy(txOptions);
    const result = await broadcastTransaction({ transaction, network });

    if ((result as any).error) throw new Error(`Deploy failed: ${(result as any).error}`);
    console.log(`✅ Deployment broadcasted! TXID: ${(result as any).txid}`);
    return (result as any).txid;
}

async function initialize(nonce: number) {
    console.log(`Initializing ${NEW_MARKET_CONTRACT_NAME}...`);

    const txOptions = {
        contractAddress: address,
        contractName: NEW_MARKET_CONTRACT_NAME,
        functionName: 'initialize',
        functionArgs: [
            principalCV(address),
            principalCV(COLLATERAL_TOKEN),
            principalCV(OUTCOME_TOKEN_CONTRACT)
        ],
        senderKey: privateKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: 100000, // 0.1 STX
        nonce,
    };

    const transaction = await makeContractCall(txOptions);
    const result = await broadcastTransaction({ transaction, network });

    if ((result as any).error) throw new Error(`Initialize failed: ${(result as any).error}`);
    console.log(`✅ Initialization broadcasted! TXID: ${(result as any).txid}`);
}

async function main() {
    try {
        const txid = await deploy();
        console.log('Waiting 50 seconds for deployment to register... (you might need to run initialize separately if it fails)');
        await new Promise(r => setTimeout(r, 50000));

        const nextNonce = await getCurrentNonce();
        await initialize(nextNonce);

        console.log('\n' + '='.repeat(50));
        console.log(`🚀 New Market Contract: ${address}.${NEW_MARKET_CONTRACT_NAME}`);
        console.log(`Action required: Update frontend/lib/constants.ts with the new address.`);
    } catch (e: any) {
        console.error(e.message);
    }
}

main();
