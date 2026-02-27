/**
 * React Hook for Writing to Contracts
 * Uses @stacks/connect for transaction signing
 */
'use client';

import { useState, useCallback } from 'react';
import { openContractCall, ContractCallOptions } from '@stacks/connect';
import { ClarityValue, PostCondition, PostConditionMode } from '@stacks/transactions';
import { getStacksNetwork } from '@/lib/stacks-network';

export interface UseContractWriteOptions {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  postConditions?: PostCondition[];
  postConditionMode?: PostConditionMode;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export interface UseContractWriteResult {
  write: () => Promise<void>;
  txId: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook for writing to contracts with transaction state management
 */
export function useContractWrite(
  options: UseContractWriteOptions
): UseContractWriteResult {
  const [txId, setTxId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    postConditions = [],
    postConditionMode = PostConditionMode.Deny,
    onFinish,
    onCancel,
  } = options;

  const write = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      const network = getStacksNetwork();

      await openContractCall({
        network,
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        postConditions,
        postConditionMode,
        onFinish: (data) => {
          setTxId(data.txId);
          setIsSuccess(true);
          setIsLoading(false);
          if (onFinish) onFinish(data);
        },
        onCancel: () => {
          setIsLoading(false);
          if (onCancel) onCancel();
        },
      });
    } catch (err) {
      console.error('Contract write error:', err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, [
    contractAddress,
    contractName,
    functionName,
    JSON.stringify(functionArgs),
    JSON.stringify(postConditions),
    postConditionMode,
    onFinish,
    onCancel,
  ]);

  const reset = useCallback(() => {
    setTxId(null);
    setIsLoading(false);
    setIsSuccess(false);
    setError(null);
  }, []);

  return {
    write,
    txId,
    isLoading,
    isSuccess,
    error,
    reset,
  };
}

/**
 * Hook for preparing contract writes with dynamic arguments
 */
export function usePrepareContractWrite(
  baseOptions: Omit<UseContractWriteOptions, 'functionArgs'>
) {
  return useCallback(
    (functionArgs: ClarityValue[]) => {
      return useContractWrite({
        ...baseOptions,
        functionArgs,
      });
    },
    [baseOptions]
  );
}

/**
 * Hook for contract writes with automatic retry logic
 */
export function useContractWriteWithRetry(
  options: UseContractWriteOptions,
  maxRetries: number = 3
): UseContractWriteResult & { retryCount: number } {
  const [retryCount, setRetryCount] = useState(0);
  const baseWrite = useContractWrite(options);

  const writeWithRetry = useCallback(async () => {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < maxRetries) {
      try {
        await baseWrite.write();
        setRetryCount(attempts);
        return;
      } catch (err) {
        lastError = err as Error;
        attempts++;
        setRetryCount(attempts);

        if (attempts < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => 
            setTimeout(resolve, 1000 * Math.pow(2, attempts))
          );
        }
      }
    }

    throw lastError || new Error('Failed after retries');
  }, [baseWrite, maxRetries]);

  return {
    ...baseWrite,
    write: writeWithRetry,
    retryCount,
  };
}
