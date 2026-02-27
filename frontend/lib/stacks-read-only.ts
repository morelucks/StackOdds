/**
 * Stacks Read-Only Contract Call Utilities
 * Helper functions for reading contract state using @stacks/transactions
 */
import {
  callReadOnlyFunction,
  cvToValue,
  ClarityValue,
  cvToJSON,
  ResponseCV,
} from '@stacks/transactions';
import { getStacksNetwork } from './stacks-network';

export interface ReadOnlyFunctionOptions {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress: string;
}

/**
 * Call a read-only contract function and return the raw Clarity value
 */
export async function callReadOnly(
  options: ReadOnlyFunctionOptions
): Promise<ClarityValue> {
  const network = getStacksNetwork();
  
  const result = await callReadOnlyFunction({
    network,
    contractAddress: options.contractAddress,
    contractName: options.contractName,
    functionName: options.functionName,
    functionArgs: options.functionArgs,
    senderAddress: options.senderAddress,
  });
  
  return result;
}

/**
 * Call a read-only contract function and return the JavaScript value
 */
export async function callReadOnlyValue<T = any>(
  options: ReadOnlyFunctionOptions
): Promise<T> {
  const clarityValue = await callReadOnly(options);
  return cvToValue(clarityValue) as T;
}

/**
 * Call a read-only contract function and return JSON representation
 */
export async function callReadOnlyJSON(
  options: ReadOnlyFunctionOptions
): Promise<any> {
  const clarityValue = await callReadOnly(options);
  return cvToJSON(clarityValue);
}

/**
 * Call a read-only function that returns a Response type
 * Automatically unwraps ok/err values
 */
export async function callReadOnlyResponse<T = any>(
  options: ReadOnlyFunctionOptions
): Promise<{ ok: boolean; value: T }> {
  const clarityValue = await callReadOnly(options);
  
  // Check if it's a Response type
  if ('type' in clarityValue && (clarityValue.type === 7 || clarityValue.type === 8)) {
    const responseCV = clarityValue as ResponseCV;
    const isOk = responseCV.type === 7; // ResponseOk = 7, ResponseErr = 8
    const value = cvToValue(responseCV.value) as T;
    
    return {
      ok: isOk,
      value,
    };
  }
  
  // If not a Response, return the value directly
  return {
    ok: true,
    value: cvToValue(clarityValue) as T,
  };
}

/**
 * Helper to read a uint value from a contract
 */
export async function readUint(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[],
  senderAddress: string
): Promise<bigint> {
  const value = await callReadOnlyValue<bigint>({
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    senderAddress,
  });
  
  return BigInt(value);
}

/**
 * Helper to read a boolean value from a contract
 */
export async function readBool(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[],
  senderAddress: string
): Promise<boolean> {
  return callReadOnlyValue<boolean>({
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    senderAddress,
  });
}

/**
 * Helper to read a string value from a contract
 */
export async function readString(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[],
  senderAddress: string
): Promise<string> {
  return callReadOnlyValue<string>({
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    senderAddress,
  });
}

/**
 * Helper to read a principal value from a contract
 */
export async function readPrincipal(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[],
  senderAddress: string
): Promise<string> {
  return callReadOnlyValue<string>({
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    senderAddress,
  });
}

/**
 * Batch read multiple contract functions
 */
export async function batchReadOnly(
  calls: ReadOnlyFunctionOptions[]
): Promise<any[]> {
  return Promise.all(calls.map(call => callReadOnlyValue(call)));
}

/**
 * Read with retry logic for network failures
 */
export async function callReadOnlyWithRetry<T = any>(
  options: ReadOnlyFunctionOptions,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callReadOnlyValue<T>(options);
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  
  throw lastError || new Error('Failed to read contract after retries');
}
