/**
 * Stacks Post-Condition Utilities
 * Helper functions for creating secure post-conditions using @stacks/transactions
 */
import {
  makeStandardSTXPostCondition,
  makeContractSTXPostCondition,
  makeStandardFungiblePostCondition,
  makeContractFungiblePostCondition,
  makeStandardNonFungiblePostCondition,
  makeContractNonFungiblePostCondition,
  FungibleConditionCode,
  NonFungibleConditionCode,
  PostCondition,
  createAssetInfo,
} from '@stacks/transactions';

/**
 * Create a post-condition for STX transfer from a user
 */
export function createSTXPostCondition(
  address: string,
  conditionCode: FungibleConditionCode,
  amount: bigint
): PostCondition {
  return makeStandardSTXPostCondition(address, conditionCode, amount);
}

/**
 * Create a post-condition for STX transfer from a contract
 */
export function createContractSTXPostCondition(
  contractAddress: string,
  contractName: string,
  conditionCode: FungibleConditionCode,
  amount: bigint
): PostCondition {
  return makeContractSTXPostCondition(
    contractAddress,
    contractName,
    conditionCode,
    amount
  );
}

/**
 * Create a post-condition for fungible token transfer from a user
 */
export function createFungiblePostCondition(
  address: string,
  conditionCode: FungibleConditionCode,
  amount: bigint,
  tokenContractAddress: string,
  tokenContractName: string,
  tokenAssetName: string
): PostCondition {
  const assetInfo = createAssetInfo(
    tokenContractAddress,
    tokenContractName,
    tokenAssetName
  );
  
  return makeStandardFungiblePostCondition(
    address,
    conditionCode,
    amount,
    assetInfo
  );
}

/**
 * Create a post-condition for fungible token transfer from a contract
 */
export function createContractFungiblePostCondition(
  contractAddress: string,
  contractName: string,
  conditionCode: FungibleConditionCode,
  amount: bigint,
  tokenContractAddress: string,
  tokenContractName: string,
  tokenAssetName: string
): PostCondition {
  const assetInfo = createAssetInfo(
    tokenContractAddress,
    tokenContractName,
    tokenAssetName
  );
  
  return makeContractFungiblePostCondition(
    contractAddress,
    contractName,
    conditionCode,
    amount,
    assetInfo
  );
}

/**
 * Create a USDCx transfer post-condition for a user
 * Convenience wrapper for USDCx token transfers
 */
export function createUSDCxPostCondition(
  userAddress: string,
  amount: bigint,
  usdcxContractAddress: string,
  conditionCode: FungibleConditionCode = FungibleConditionCode.Equal
): PostCondition {
  const [tokenAddress, tokenName] = usdcxContractAddress.split('.');
  
  return createFungiblePostCondition(
    userAddress,
    conditionCode,
    amount,
    tokenAddress,
    tokenName,
    'usdcx'
  );
}

/**
 * Create a post-condition for NFT transfer from a user
 */
export function createNonFungiblePostCondition(
  address: string,
  conditionCode: NonFungibleConditionCode,
  assetId: any,
  tokenContractAddress: string,
  tokenContractName: string,
  tokenAssetName: string
): PostCondition {
  const assetInfo = createAssetInfo(
    tokenContractAddress,
    tokenContractName,
    tokenAssetName
  );
  
  return makeStandardNonFungiblePostCondition(
    address,
    conditionCode,
    assetInfo,
    assetId
  );
}

/**
 * Create a post-condition for NFT transfer from a contract
 */
export function createContractNonFungiblePostCondition(
  contractAddress: string,
  contractName: string,
  conditionCode: NonFungibleConditionCode,
  assetId: any,
  tokenContractAddress: string,
  tokenContractName: string,
  tokenAssetName: string
): PostCondition {
  const assetInfo = createAssetInfo(
    tokenContractAddress,
    tokenContractName,
    tokenAssetName
  );
  
  return makeContractNonFungiblePostCondition(
    contractAddress,
    contractName,
    conditionCode,
    assetInfo,
    assetId
  );
}

/**
 * Post-condition code helpers
 */
export const PostConditionCodes = {
  // Fungible token codes
  Equal: FungibleConditionCode.Equal,
  Greater: FungibleConditionCode.Greater,
  GreaterEqual: FungibleConditionCode.GreaterEqual,
  Less: FungibleConditionCode.Less,
  LessEqual: FungibleConditionCode.LessEqual,
  
  // Non-fungible token codes
  Sends: NonFungibleConditionCode.Sends,
  DoesNotSend: NonFungibleConditionCode.DoesNotSend,
} as const;

/**
 * Validate post-conditions array
 */
export function validatePostConditions(postConditions: PostCondition[]): boolean {
  return Array.isArray(postConditions) && postConditions.length >= 0;
}
