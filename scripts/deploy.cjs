const { makeContractDeploy, broadcastTransaction, AnchorMode } = require('@stacks/transactions');
const { STACKS_MAINNET } = require('@stacks/network');
const fs = require('fs');

const PRIVATE_KEY = '3205c5287311201576ebcd982dd146b07de9c31198c28257d4c7af47600766ba';

async function deployContract(contractName, contractPath) {
  const codeBody = fs.readFileSync(contractPath, 'utf8')
    .replace(/[^\x00-\x7F]/g, ''); // Remove non-ASCII characters
  
  // Fetch account info
  const accountResponse = await fetch('https://api.mainnet.hiro.so/v2/accounts/SP19PS42C7R7BR4VCX2YN8KPHXSB0ZC19K6PFEKTC');
  const accountData = await accountResponse.json();
  const nonce = accountData.nonce;
  
  console.log(`Account nonce: ${nonce}, balance: ${parseInt(accountData.balance, 16) / 1000000} STX`);
  
  const txOptions = {
    contractName,
    codeBody,
    senderKey: PRIVATE_KEY,
    network: STACKS_MAINNET,
    anchorMode: AnchorMode.Any,
    fee: 50000,
    nonce,
  };

  const transaction = await makeContractDeploy(txOptions);
  const result = await broadcastTransaction({ transaction, network: STACKS_MAINNET });
  
  return result;
}

async function main() {
  console.log('Deploying token contract...');
  const tokenResult = await deployContract('token', 'contracts/token.clar');
  console.log('Token deployed:', tokenResult);
  
  if (tokenResult.txid) {
    console.log(`\nToken TX: https://explorer.hiro.so/txid/${tokenResult.txid}?chain=mainnet`);
    
    // Wait a bit before deploying main contract
    console.log('\nWaiting 30 seconds before deploying main contract...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('\nDeploying main contract...');
    const contractResult = await deployContract('contract', 'contracts/contract.clar');
    console.log('Contract deployed:', contractResult);
    
    if (contractResult.txid) {
      console.log(`\nContract TX: https://explorer.hiro.so/txid/${contractResult.txid}?chain=mainnet`);
    }
  }
}

main().catch(console.error);
