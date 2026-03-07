/**
 * Shared Stacks client utilities
 * Used by both deployment scripts and frontend
 */

import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

export const getNetwork = (networkName: 'mainnet' | 'testnet' = 'mainnet') => {
  return networkName === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
};

export const getApiUrl = (networkName: 'mainnet' | 'testnet' = 'mainnet') => {
  return networkName === 'mainnet' 
    ? 'https://api.hiro.so' 
    : 'https://api.testnet.hiro.so';
};

export const parseContractAddress = (address: string) => {
  const [contractAddress, contractName] = address.split('.');
  return { contractAddress, contractName };
};








