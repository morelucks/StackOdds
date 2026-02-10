import { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, uintCV, stringAsciiCV, boolCV, principalCV } from '@stacks/transactions';
import { StacksMainnet, StacksTestnet } from '@stacks/network';

const NETWORK = new StacksMainnet();
const CONTRACT_ADDRESS = 'YOUR_DEPLOYER_ADDRESS';
const CONTRACT_NAME = 'contract';
const PRIVATE_KEY = '338f1cc41fc9fd2ba82c0c22c24dd16525fe9c0a15589cf480de7f4bb1992b0a';

async function createMarket(senderKey: string, b: number, startTime: number, endTime: number, question: string, cId: string) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'create-market',
    functionArgs: [
      uintCV(b),
      uintCV(startTime),
      uintCV(endTime),
      stringAsciiCV(question),
      stringAsciiCV(cId),
    ],
    senderKey,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };
  const tx = await makeContractCall(txOptions);
  return broadcastTransaction(tx, NETWORK);
}

async function buyYes(senderKey: string, marketId: number, shares: number) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'buy-yes',
    functionArgs: [uintCV(marketId), uintCV(shares)],
    senderKey,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };
  const tx = await makeContractCall(txOptions);
  return broadcastTransaction(tx, NETWORK);
}

async function buyNo(senderKey: string, marketId: number, shares: number) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'buy-no',
    functionArgs: [uintCV(marketId), uintCV(shares)],
    senderKey,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };
  const tx = await makeContractCall(txOptions);
  return broadcastTransaction(tx, NETWORK);
}

async function resolveMarket(senderKey: string, marketId: number, yesWon: boolean) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'resolve-market',
    functionArgs: [uintCV(marketId), boolCV(yesWon)],
    senderKey,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };
  const tx = await makeContractCall(txOptions);
  return broadcastTransaction(tx, NETWORK);
}

async function claim(senderKey: string, marketId: number) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'claim',
    functionArgs: [uintCV(marketId)],
    senderKey,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };
  const tx = await makeContractCall(txOptions);
  return broadcastTransaction(tx, NETWORK);
}

async function sellYes(senderKey: string, marketId: number, shares: number) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'sell-yes',
    functionArgs: [uintCV(marketId), uintCV(shares)],
    senderKey,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };
  const tx = await makeContractCall(txOptions);
  return broadcastTransaction(tx, NETWORK);
}

async function sellNo(senderKey: string, marketId: number, shares: number) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'sell-no',
    functionArgs: [uintCV(marketId), uintCV(shares)],
    senderKey,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };
  const tx = await makeContractCall(txOptions);
  return broadcastTransaction(tx, NETWORK);
}

async function addLiquidity(senderKey: string, marketId: number, amount: number) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'add-liquidity',
    functionArgs: [uintCV(marketId), uintCV(amount)],
    senderKey,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };
  const tx = await makeContractCall(txOptions);
  return broadcastTransaction(tx, NETWORK);
}

async function removeLiquidity(senderKey: string, marketId: number, lpShares: number) {
  const txOptions = {
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'remove-liquidity',
    functionArgs: [uintCV(marketId), uintCV(lpShares)],
    senderKey,
    network: NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  };
  const tx = await makeContractCall(txOptions);
  return broadcastTransaction(tx, NETWORK);
}

async function getMarket(marketId: number) {
  const response = await fetch(`${NETWORK.coreApiUrl}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-market`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: CONTRACT_ADDRESS,
      arguments: [`0x${Buffer.from(uintCV(marketId).serialize()).toString('hex')}`],
    }),
  });
  return response.json();
}

async function getBalance(owner: string, tokenId: number) {
  const response = await fetch(`${NETWORK.coreApiUrl}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-balance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: CONTRACT_ADDRESS,
      arguments: [
        `0x${Buffer.from(principalCV(owner).serialize()).toString('hex')}`,
        `0x${Buffer.from(uintCV(tokenId).serialize()).toString('hex')}`
      ],
    }),
  });
  return response.json();
}

async function getCostBuy(marketId: number, shares: number, buyYes: boolean) {
  const fnName = buyYes ? 'get-cost-buy-yes' : 'get-cost-buy-no';
  const response = await fetch(`${NETWORK.coreApiUrl}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/${fnName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: CONTRACT_ADDRESS,
      arguments: [
        `0x${Buffer.from(uintCV(marketId).serialize()).toString('hex')}`,
        `0x${Buffer.from(uintCV(shares).serialize()).toString('hex')}`
      ],
    }),
  });
  return response.json();
}

// Usage example
async function main() {
  const privateKey = PRIVATE_KEY;
  
  // Example 1: Create market
  // const result = await createMarket(
  //   privateKey,
  //   1000000,
  //   Math.floor(Date.now() / 1000),
  //   Math.floor(Date.now() / 1000) + 86400,
  //   'Will BTC reach 100k?',
  //   'btc-100k'
  // );
  // console.log('Market created:', result);

  // Example 2: Get market info
  // const market = await getMarket(1);
  // console.log('Market data:', market);

  // Example 3: Check cost before buying
  // const cost = await getCostBuy(1, 100, true);
  // console.log('Cost to buy 100 YES shares:', cost);

  // Example 4: Buy YES shares
  // const buyResult = await buyYes(privateKey, 1, 100);
  // console.log('Bought YES shares:', buyResult);

  // Example 5: Check balance
  // const balance = await getBalance(CONTRACT_ADDRESS, 1);
  // console.log('Token balance:', balance);

  // Example 6: Add liquidity
  // const lpResult = await addLiquidity(privateKey, 1, 500000);
  // console.log('Added liquidity:', lpResult);
}

main().catch(console.error);
