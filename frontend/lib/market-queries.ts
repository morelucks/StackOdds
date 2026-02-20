import { callReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { CONTRACT_CONFIG } from './contract-config';
import type { Market } from './market-types';

const getNetwork = () => {
  return process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
};

const getContractAddress = () => {
  const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
  return isMainnet ? CONTRACT_CONFIG.mainnet : CONTRACT_CONFIG.testnet;
};

export const fetchMarket = async (marketId: number): Promise<Market | null> => {
  const { address, name } = getContractAddress();
  
  try {
    const result = await callReadOnlyFunction({
      network: getNetwork(),
      contractAddress: address,
      contractName: name,
      functionName: 'get-market',
      functionArgs: [uintCV(marketId)],
      senderAddress: address,
    });
    
    const data = cvToJSON(result);
    if (!data.value) return null;
    
    return {
      id: marketId,
      question: data.value.question.value,
      liquidity: parseInt(data.value.b.value),
      qYes: parseInt(data.value['q-yes'].value),
      qNo: parseInt(data.value['q-no'].value),
      startTime: parseInt(data.value['start-time'].value),
      endTime: parseInt(data.value['end-time'].value),
      resolved: data.value.resolved.value,
      yesWon: data.value['yes-won'].value,
      metadataCid: data.value['c-id'].value,
    };
  } catch (error) {
    console.error('Error fetching market:', error);
    return null;
  }
};
