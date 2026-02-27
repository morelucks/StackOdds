/**
 * Stacks Token Metadata Utilities
 * Helper functions for working with SIP-010 fungible tokens
 * Uses @stacks/transactions for token operations
 */
import { callReadOnlyValue } from './stacks-read-only';
import { createUintCV, createStandardPrincipalCV } from './stacks-clarity-values';

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  tokenUri?: string;
}

export interface TokenBalance {
  balance: bigint;
  formattedBalance: string;
}

/**
 * Get token metadata from a SIP-010 compliant contract
 */
export async function getTokenMetadata(
  contractAddress: string,
  contractName: string,
  senderAddress: string
): Promise<Partial<TokenMetadata>> {
  const [address, name] = `${contractAddress}.${contractName}`.split('.');
  
  try {
    const [tokenName, symbol, decimals, totalSupply] = await Promise.allSettled([
      callReadOnlyValue<string>({
        contractAddress: address,
        contractName: name,
        functionName: 'get-name',
        functionArgs: [],
        senderAddress,
      }),
      callReadOnlyValue<string>({
        contractAddress: address,
        contractName: name,
        functionName: 'get-symbol',
        functionArgs: [],
        senderAddress,
      }),
      callReadOnlyValue<number>({
        contractAddress: address,
        contractName: name,
        functionName: 'get-decimals',
        functionArgs: [],
        senderAddress,
      }),
      callReadOnlyValue<bigint>({
        contractAddress: address,
        contractName: name,
        functionName: 'get-total-supply',
        functionArgs: [],
        senderAddress,
      }),
    ]);

    return {
      name: tokenName.status === 'fulfilled' ? tokenName.value : undefined,
      symbol: symbol.status === 'fulfilled' ? symbol.value : undefined,
      decimals: decimals.status === 'fulfilled' ? decimals.value : undefined,
      totalSupply: totalSupply.status === 'fulfilled' ? BigInt(totalSupply.value) : undefined,
    };
  } catch (error) {
    console.error('Failed to fetch token metadata:', error);
    return {};
  }
}

/**
 * Get token balance for an address
 */
export async function getTokenBalance(
  contractAddress: string,
  contractName: string,
  ownerAddress: string,
  senderAddress: string,
  decimals: number = 6
): Promise<TokenBalance> {
  const [address, name] = `${contractAddress}.${contractName}`.split('.');
  
  try {
    const balance = await callReadOnlyValue<bigint>({
      contractAddress: address,
      contractName: name,
      functionName: 'get-balance',
      functionArgs: [createStandardPrincipalCV(ownerAddress)],
      senderAddress,
    });

    const balanceBigInt = BigInt(balance);
    const formattedBalance = formatTokenAmount(balanceBigInt, decimals);

    return {
      balance: balanceBigInt,
      formattedBalance,
    };
  } catch (error) {
    console.error('Failed to fetch token balance:', error);
    return {
      balance: BigInt(0),
      formattedBalance: '0',
    };
  }
}

/**
 * Get token allowance for a spender
 */
export async function getTokenAllowance(
  contractAddress: string,
  contractName: string,
  ownerAddress: string,
  spenderAddress: string,
  senderAddress: string,
  decimals: number = 6
): Promise<TokenBalance> {
  const [address, name] = `${contractAddress}.${contractName}`.split('.');
  
  try {
    const allowance = await callReadOnlyValue<bigint>({
      contractAddress: address,
      contractName: name,
      functionName: 'get-allowance',
      functionArgs: [
        createStandardPrincipalCV(ownerAddress),
        createStandardPrincipalCV(spenderAddress),
      ],
      senderAddress,
    });

    const allowanceBigInt = BigInt(allowance);
    const formattedAllowance = formatTokenAmount(allowanceBigInt, decimals);

    return {
      balance: allowanceBigInt,
      formattedBalance: formattedAllowance,
    };
  } catch (error) {
    console.error('Failed to fetch token allowance:', error);
    return {
      balance: BigInt(0),
      formattedBalance: '0',
    };
  }
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(
  amount: bigint | number,
  decimals: number = 6,
  maxDecimals: number = 2
): string {
  const amountBigInt = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const integerPart = amountBigInt / divisor;
  const fractionalPart = amountBigInt % divisor;

  if (fractionalPart === BigInt(0)) {
    return integerPart.toString();
  }

  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.slice(0, maxDecimals).replace(/0+$/, '');

  if (trimmedFractional === '') {
    return integerPart.toString();
  }

  return `${integerPart}.${trimmedFractional}`;
}

/**
 * Parse token amount to micro units
 */
export function parseTokenAmount(
  amount: string | number,
  decimals: number = 6
): bigint {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  const [integerPart, fractionalPart = ''] = amountStr.split('.');
  
  const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  const fullAmount = integerPart + paddedFractional;
  
  return BigInt(fullAmount);
}

/**
 * Check if an amount is valid
 */
export function isValidTokenAmount(
  amount: string | number,
  decimals: number = 6
): boolean {
  try {
    const parsed = parseTokenAmount(amount, decimals);
    return parsed > BigInt(0);
  } catch {
    return false;
  }
}
