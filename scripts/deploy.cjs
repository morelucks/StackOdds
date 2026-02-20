const { makeContractDeploy, broadcastTransaction, AnchorMode, getAddressFromPrivateKey } = require('@stacks/transactions');
const { STACKS_MAINNET } = require('@stacks/network');
const fs = require('fs');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const DEPLOYER_ADDRESS = getAddressFromPrivateKey(PRIVATE_KEY);

async function deployContract(contractName, contractPath) {
  const codeBody = fs.readFileSync(contractPath, 'utf8')
    .replace(/[^\x00-\x7F]/g, '');
  
  const accountResponse = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${DEPLOYER_ADDRESS}`);
  const accountData = await accountResponse.json();
  const nonce = accountData.nonce;
  
  console.log(`Account: ${DEPLOYER_ADDRESS}, nonce: ${nonce}, balance: ${parseInt(accountData.balance, 16) / 1000000} STX`);
  
  const txOptions = {
    contractName,
    codeBody,
    senderKey: PRIVATE_KEY,
    network: STACKS_MAINNET,
    anchorMode: AnchorMode.Any,
    clarityVersion: 3,
    fee: 150000,
    nonce,
  };

  const transaction = await makeContractDeploy(txOptions);
  const result = await broadcastTransaction({ transaction, network: STACKS_MAINNET });
  
  return result;
}

async function main() {
  console.log('Deploying token contract first...\n');
  const tokenResult = await deployContract('token', 'contracts/token.clar');
  
  if (tokenResult.txid) {
    console.log('✅ Token deployed!');
    console.log(`TX: https://explorer.hiro.so/txid/${tokenResult.txid}?chain=mainnet`);
    console.log(`Contract: ${DEPLOYER_ADDRESS}.token\n`);
    
    console.log('Waiting 60 seconds before deploying main contract...\n');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    console.log('Deploying StackOdds main contract...\n');
    const contractResult = await deployContract('stackodds', 'contracts/contract.clar');
    
    if (contractResult.txid) {
      console.log('\n✅ StackOdds deployed successfully!');
      console.log(`TX: https://explorer.hiro.so/txid/${contractResult.txid}?chain=mainnet`);
      console.log(`Contract: ${DEPLOYER_ADDRESS}.stackodds`);
    } else {
      console.log('Result:', contractResult);
    }
  } else {
    console.log('Token deployment failed:', tokenResult);
  }
}

main().catch(console.error);
