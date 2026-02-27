/**
 * React Hook for Reading Contract State
 * Uses @stacks/transactions for read-only contract calls
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClarityValue } from '@stacks/transactions';
import { callReadOnlyValue, callReadOnlyResponse } from '@/lib/stacks-read-only';

export interface UseContractReadOptions {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValue[];
  senderAddress: string;
  enabled?: boolean;
  refetchInterval?: number;
}

export interface UseContractReadResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for reading contract state with automatic refetching
 */
export function useContractRead<T = any>(
  options: UseContractReadOptions
): UseContractReadResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    senderAddress,
    enabled = true,
    refetchInterval,
  } = options;

  const fetchData = useCallback(async () => {
    if (!enabled || !senderAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await callReadOnlyValue<T>({
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        senderAddress,
      });

      setData(result);
    } catch (err) {
      console.error('Contract read error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    contractAddress,
    contractName,
    functionName,
    JSON.stringify(functionArgs),
    senderAddress,
  ]);

  useEffect(() => {
    fetchData();

    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refetchInterval, enabled]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for reading contract Response types with automatic unwrapping
 */
export function useContractReadResponse<T = any>(
  options: UseContractReadOptions
): UseContractReadResult<{ ok: boolean; value: T }> {
  const [data, setData] = useState<{ ok: boolean; value: T } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const {
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    senderAddress,
    enabled = true,
    refetchInterval,
  } = options;

  const fetchData = useCallback(async () => {
    if (!enabled || !senderAddress) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await callReadOnlyResponse<T>({
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        senderAddress,
      });

      setData(result);
    } catch (err) {
      console.error('Contract read error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    contractAddress,
    contractName,
    functionName,
    JSON.stringify(functionArgs),
    senderAddress,
  ]);

  useEffect(() => {
    fetchData();

    if (refetchInterval && enabled) {
      const interval = setInterval(fetchData, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refetchInterval, enabled]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}

/**
 * Hook for reading multiple contract values in parallel
 */
export function useContractReadBatch<T = any>(
  calls: UseContractReadOptions[],
  enabled: boolean = true
): UseContractReadResult<T[]> {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const results = await Promise.all(
        calls.map(call =>
          callReadOnlyValue<T>({
            contractAddress: call.contractAddress,
            contractName: call.contractName,
            functionName: call.functionName,
            functionArgs: call.functionArgs,
            senderAddress: call.senderAddress,
          })
        )
      );

      setData(results);
    } catch (err) {
      console.error('Batch contract read error:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, JSON.stringify(calls)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
