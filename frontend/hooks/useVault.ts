'use client';

import { useState, useCallback } from 'react';
import { openContractCall } from '@stacks/connect';
import { uintCV, contractPrincipalCV } from '@stacks/transactions';
import { useStacks } from './useStacks';

export const useVault = () => {
    const { network, address } = useStacks();
    const [isClaiming, setIsClaiming] = useState(false);

    const claimRewards = useCallback(async (registryAddress: string, registryName: string) => {
        if (!address) return;

        setIsClaiming(true);
        try {
            await openContractCall({
                network,
                contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Vault address
                contractName: 'reward-vault',
                functionName: 'claim-rewards',
                functionArgs: [
                    contractPrincipalCV(registryAddress, registryName),
                ],
                onFinish: (data) => {
                    console.log('Transaction broadcast:', data.txId);
                    setIsClaiming(false);
                },
                onCancel: () => {
                    setIsClaiming(false);
                },
            });
        } catch (error) {
            console.error('Error claiming rewards:', error);
            setIsClaiming(false);
        }
    }, [address, network]);

    const depositFunds = useCallback(async (amount: number) => {
        if (!address) return;

        try {
            await openContractCall({
                network,
                contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
                contractName: 'reward-vault',
                functionName: 'deposit-rewards',
                functionArgs: [uintCV(amount)],
                onFinish: (data) => console.log('Deposit success:', data.txId),
            });
        } catch (error) {
            console.error('Error depositing rewards:', error);
        }
    }, [address, network]);

    return {
        claimRewards,
        depositFunds,
        isClaiming,
    };
};
