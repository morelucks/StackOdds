const { makeContractDeploy, broadcastTransaction, AnchorMode, getAddressFromPrivateKey } = require('@stacks/transactions');
const { STACKS_MAINNET } = require('@stacks/network');
const fs = require('fs');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.MAINNET_PRIVATE_KEY;
const DEPLOYER_ADDRESS = process.env.CONTRACT_ADDRESS || getAddressFromPrivateKey(PRIVATE_KEY);

async function deployStackOddPoll() {
    const codeBody = fs.readFileSync('contracts/stackoddpoll.clar', 'utf8')
        .replace(/[^\x00-\x7F]/g, '');

    console.log(`Fetching account info for: ${DEPLOYER_ADDRESS}`);
    const accountResponse = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${DEPLOYER_ADDRESS}`);

    if (!accountResponse.ok) {
        throw new Error(`Failed to fetch account: ${accountResponse.status} ${accountResponse.statusText}`);
    }

    const accountData = await accountResponse.json();
    const nonce = accountData.nonce;

    console.log(`Account: ${DEPLOYER_ADDRESS}`);
    console.log(`Nonce: ${nonce}, Balance: ${parseInt(accountData.balance, 16) / 1000000} STX`);

    const txOptions = {
        contractName: 'stackoddpoll',
        codeBody,
        senderKey: PRIVATE_KEY,
        network: STACKS_MAINNET,
        anchorMode: AnchorMode.Any,
        fee: 100000,
        nonce,
    };

    const transaction = await makeContractDeploy(txOptions);
    const result = await broadcastTransaction({ transaction, network: STACKS_MAINNET });

    return result;
}

async function main() {
    console.log('Deploying StackOdds Poll Token (SPOLL)...\n');

    const result = await deployStackOddPoll();

    if (result.txid) {
        console.log('\n✅ Poll token deployed successfully!');
        console.log(`TX ID: ${result.txid}`);
        console.log(`Explorer: https://explorer.hiro.so/txid/${result.txid}?chain=mainnet`);
        console.log(`Contract: ${DEPLOYER_ADDRESS}.stackoddpoll`);
    } else if (result.error) {
        console.error('\n❌ Deployment failed:', result.error);
        console.error('Reason:', result.reason);
    } else {
        console.log('\nResult:', result);
    }
}

main().catch(console.error);
