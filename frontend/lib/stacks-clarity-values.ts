/**
 * Stacks Clarity Value Utilities
 * Helper functions for constructing Clarity values using @stacks/transactions
 */
import {
  uintCV,
  intCV,
  boolCV,
  stringAsciiCV,
  stringUtf8CV,
  bufferCV,
  contractPrincipalCV,
  standardPrincipalCV,
  listCV,
  tupleCV,
  someCV,
  noneCV,
  ClarityValue,
} from '@stacks/transactions';

/**
 * Create a uint Clarity value from a number
 */
export function createUintCV(value: number | bigint): ClarityValue {
  return uintCV(value);
}

/**
 * Create an int Clarity value from a number
 */
export function createIntCV(value: number | bigint): ClarityValue {
  return intCV(value);
}

/**
 * Create a boolean Clarity value
 */
export function createBoolCV(value: boolean): ClarityValue {
  return boolCV(value);
}

/**
 * Create an ASCII string Clarity value
 */
export function createStringAsciiCV(value: string): ClarityValue {
  return stringAsciiCV(value);
}

/**
 * Create a UTF-8 string Clarity value
 */
export function createStringUtf8CV(value: string): ClarityValue {
  return stringUtf8CV(value);
}

/**
 * Create a buffer Clarity value from a Uint8Array
 */
export function createBufferCV(value: Uint8Array): ClarityValue {
  return bufferCV(value);
}

/**
 * Create a contract principal Clarity value
 * @param contractAddress - Full contract address (e.g., "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.contract-name")
 */
export function createContractPrincipalCV(contractAddress: string): ClarityValue {
  const [address, contractName] = contractAddress.split('.');
  if (!address || !contractName) {
    throw new Error(`Invalid contract address format: ${contractAddress}`);
  }
  return contractPrincipalCV(address, contractName);
}

/**
 * Create a standard principal Clarity value (user address)
 */
export function createStandardPrincipalCV(address: string): ClarityValue {
  return standardPrincipalCV(address);
}

/**
 * Create a list Clarity value
 */
export function createListCV(values: ClarityValue[]): ClarityValue {
  return listCV(values);
}

/**
 * Create a tuple Clarity value
 */
export function createTupleCV(data: Record<string, ClarityValue>): ClarityValue {
  return tupleCV(data);
}

/**
 * Create an optional some Clarity value
 */
export function createSomeCV(value: ClarityValue): ClarityValue {
  return someCV(value);
}

/**
 * Create an optional none Clarity value
 */
export function createNoneCV(): ClarityValue {
  return noneCV();
}

/**
 * Convert USDCx amount to micro units (6 decimals)
 */
export function toMicroUSDCx(amount: number): bigint {
  return BigInt(Math.floor(amount * 1_000_000));
}

/**
 * Convert micro units to USDCx amount (6 decimals)
 */
export function fromMicroUSDCx(microAmount: bigint | number): number {
  return Number(microAmount) / 1_000_000;
}

/**
 * Create a uint CV for USDCx micro units
 */
export function createUSDCxAmountCV(amount: number): ClarityValue {
  return uintCV(toMicroUSDCx(amount));
}

/**
 * Create a timestamp uint CV from a Date object
 */
export function createTimestampCV(date: Date): ClarityValue {
  return uintCV(Math.floor(date.getTime() / 1000));
}

/**
 * Create a timestamp uint CV from seconds
 */
export function createTimestampFromSecondsCV(seconds: number): ClarityValue {
  return uintCV(seconds);
}
