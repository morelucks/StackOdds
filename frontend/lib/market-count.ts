import { callReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { CONTRACT_CONFIG } from './contract-config';

const getNetwork = () => {
  return process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
};

const getContractAddress = () => {
  const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
  return isMainnet ? CONTRACT_CONFIG.mainnet : CONTRACT_CONFIG.testnet;
};

export const getMarketCount = async (): Promise<number> => {
  const { address, name } = getContractAddress();
  
  try {
    const result = await callReadOnlyFunction({
      network: getNetwork(),
      contractAddress: address,
      contractName: name,
      functionName: 'get-market-count',
      functionArgs: [],
      senderAddress: address,
    });
    
    const data = cvToJSON(result);
    return parseInt(data.value) || 0;
  } catch (error) {
    console.error('Error fetching market count:', error);
    return 0;
  }
};
