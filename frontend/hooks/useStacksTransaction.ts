/**
 * React Hook for Stacks Transactions
 * Comprehensive transaction management with @stacks/connect
 */
'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { getTxUrl } from '@/lib/stacks-network';

export interface TransactionState {
    txId: string | null;
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    error: Error | null;
}

export interface UseStacksTransactionOptions {
    onSuccess?: (txId: string) => void;
    onError?: (error: Error) => void;
    showToasts?: boolean;
    successMessage?: string;
    errorMessage?: string;
}

export interface UseStacksTransactionResult extends TransactionState {
    execute: (fn: () => Promise<void>) => Promise<void>;
    reset: () => void;
    openExplorer: () => void;
}

/**
 * Hook for managing Stacks transaction state and execution
 */
export function useStacksTransaction(
    options: UseStacksTransactionOptions = {}
): UseStacksTransactionResult {
    const {
        onSuccess,
        onError,
        showToasts = true,
        successMessage = 'Transaction submitted successfully',
        errorMessage = 'Transaction failed',
    } = options;

    const [state, setState] = useState<TransactionState>({
        txId: null,
        isLoading: false,
        isSuccess: false,
        isError: false,
        error: null,
    });

    const execute = useCallback(
        async (fn: () => Promise<void>) => {
            setState({
                txId: null,
                isLoading: true,
                isSuccess: false,
                isError: false,
                error: null,
            });

            try {
                await fn();
                // Note: The actual txId will be set by the transaction callback
                // This is just to mark the transaction as initiated
            } catch (error) {
                const err = error as Error;
                setState({
                    txId: null,
                    isLoading: false,
                    isSuccess: false,
                    isError: true,
                    error: err,
                });

                if (showToasts) {
                    toast.error(errorMessage, {
                        description: err.message,
                    });
                }

                if (onError) {
                    onError(err);
                }
            }
        },
        [onError, showToasts, errorMessage]
    );

    const setSuccess = useCallback(
        (txId: string) => {
            setState({
                txId,
                isLoading: false,
                isSuccess: true,
                isError: false,
                error: null,
            });

            if (showToasts) {
                toast.success(successMessage, {
                    description: `Transaction ID: ${txId.slice(0, 8)}...${txId.slice(-8)}`,
                    action: {
                        label: 'View',
                        onClick: () => window.open(getTxUrl(txId), '_blank'),
                    },
                });
            }

            if (onSuccess) {
                onSuccess(txId);
            }
        },
        [onSuccess, showToasts, successMessage]
    );

    const reset = useCallback(() => {
        setState({
            txId: null,
            isLoading: false,
            isSuccess: false,
            isError: false,
            error: null,
        });
    }, []);

    const openExplorer = useCallback(() => {
        if (state.txId) {
            window.open(getTxUrl(state.txId), '_blank');
        }
    }, [state.txId]);

    return {
        ...state,
        execute,
        reset,
        openExplorer,
    };
}

/**
 * Hook for managing multiple transactions in sequence
 */
export function useStacksTransactionQueue() {
    const [queue, setQueue] = useState<Array<() => Promise<void>>>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const addToQueue = useCallback((fn: () => Promise<void>) => {
        setQueue((prev) => [...prev, fn]);
    }, []);

    const processQueue = useCallback(async () => {
        if (isProcessing || queue.length === 0) return;

        setIsProcessing(true);

        for (let i = 0; i < queue.length; i++) {
            setCurrentIndex(i);
            try {
                await queue[i]();
            } catch (error) {
                console.error('Transaction queue error:', error);
                setIsProcessing(false);
                return;
            }
        }

        setQueue([]);
        setCurrentIndex(0);
        setIsProcessing(false);
    }, [queue, isProcessing]);

    const clearQueue = useCallback(() => {
        setQueue([]);
        setCurrentIndex(0);
        setIsProcessing(false);
    }, []);

    return {
        queue,
        currentIndex,
        isProcessing,
        addToQueue,
        processQueue,
        clearQueue,
        queueLength: queue.length,
    };
}

/**
 * Hook for transaction with automatic retry
 */
export function useStacksTransactionWithRetry(
    maxRetries: number = 3,
    retryDelay: number = 2000,
    options: UseStacksTransactionOptions = {}
) {
    const baseTransaction = useStacksTransaction(options);
    const [retryCount, setRetryCount] = useState(0);

    const executeWithRetry = useCallback(
        async (fn: () => Promise<void>) => {
            let attempts = 0;

            while (attempts < maxRetries) {
                try {
                    await baseTransaction.execute(fn);
                    setRetryCount(attempts);
                    return;
                } catch (error) {
                    attempts++;
                    setRetryCount(attempts);

                    if (attempts < maxRetries) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, retryDelay * attempts)
                        );
                    } else {
                        throw error;
                    }
                }
            }
        },
        [baseTransaction, maxRetries, retryDelay]
    );

    return {
        ...baseTransaction,
        execute: executeWithRetry,
        retryCount,
    };
}
