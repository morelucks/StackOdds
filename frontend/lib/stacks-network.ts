/**
 * Stacks Network Configuration
 * Centralized network management using @stacks/network
 */
import { StacksMainnet, StacksTestnet, StacksNetwork } from '@stacks/network';

/**
 * Get the configured Stacks network instance
 * @returns StacksNetwork instance (mainnet or testnet)
 */
export function getStacksNetwork(): StacksNetwork {
  const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
  return isMainnet ? new StacksMainnet() : new StacksTestnet();
}

/**
 * Get the network name for display purposes
 */
export function getNetworkName(): string {
  return process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? 'Mainnet' : 'Testnet';
}

/**
 * Get the explorer base URL for the current network
 */
export function getExplorerUrl(): string {
  const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
  return isMainnet 
    ? 'https://explorer.hiro.so' 
    : 'https://explorer.hiro.so?chain=testnet';
}

/**
 * Get the transaction URL for a given txId
 */
export function getTxUrl(txId: string): string {
  const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
  return `https://explorer.hiro.so/txid/${txId}${isMainnet ? '' : '?chain=testnet'}`;
}

/**
 * Get the address URL for a given address
 */
export function getAddressUrl(address: string): string {
  const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
  return `https://explorer.hiro.so/address/${address}${isMainnet ? '' : '?chain=testnet'}`;
}

/**
 * Check if we're on mainnet
 */
export function isMainnet(): boolean {
  return process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
}
