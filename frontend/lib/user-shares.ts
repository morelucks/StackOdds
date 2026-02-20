import { callReadOnlyFunction, cvToJSON, uintCV, principalCV } from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { CONTRACT_CONFIG } from './contract-config';

const getNetwork = () => {
  return process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
};

const getContractAddress = () => {
  const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
  return isMainnet ? CONTRACT_CONFIG.mainnet : CONTRACT_CONFIG.testnet;
};

export const getUserShares = async (marketId: number, userAddress: string, outcome: 'YES' | 'NO'): Promise<number> => {
  const { address, name } = getContractAddress();
  
  try {
    const result = await callReadOnlyFunction({
      network: getNetwork(),
      contractAddress: address,
      contractName: name,
      functionName: outcome === 'YES' ? 'get-yes-shares' : 'get-no-shares',
      functionArgs: [uintCV(marketId), principalCV(userAddress)],
      senderAddress: address,
    });
    
    const data = cvToJSON(result);
    return parseInt(data.value) || 0;
  } catch (error) {
    console.error('Error fetching user shares:', error);
    return 0;
  }
};
