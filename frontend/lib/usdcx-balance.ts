import { callReadOnlyFunction, cvToJSON, uintCV, principalCV } from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { getUSDCxAddress } from './constants';

const getNetwork = () => {
  return process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
};

export const getUSDCxBalance = async (address: string): Promise<number> => {
  const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
  const usdcxAddress = getUSDCxAddress(isMainnet);
  const [contractAddress, contractName] = usdcxAddress.split('.');

  try {
    const result = await callReadOnlyFunction({
      network: getNetwork(),
      contractAddress,
      contractName,
      functionName: 'get-balance',
      functionArgs: [principalCV(address)],
      senderAddress: address,
    });
    
    const json = cvToJSON(result);
    return json.value || 0;
  } catch (error) {
    console.error('Error fetching USDCx balance:', error);
    return 0;
  }
};

export const getUSDCxAllowance = async (owner: string, spender: string): Promise<number> => {
  const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
  const usdcxAddress = getUSDCxAddress(isMainnet);
  const [contractAddress, contractName] = usdcxAddress.split('.');

  try {
    const result = await callReadOnlyFunction({
      network: getNetwork(),
      contractAddress,
      contractName,
      functionName: 'get-allowance',
      functionArgs: [principalCV(owner), principalCV(spender)],
      senderAddress: owner,
    });
    
    const json = cvToJSON(result);
    return json.value || 0;
  } catch (error) {
    console.error('Error fetching USDCx allowance:', error);
    return 0;
  }
};
