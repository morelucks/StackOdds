/**
 * Stacks transaction utilities for StackOdds.
 * Provides functions for contract calls with Post-Conditions.
 */
import { openContractCall } from '@stacks/connect';
import {
    uintCV,
    boolCV,
    stringAsciiCV,
    PostConditionMode,
    Pc
} from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

const NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;

export interface CreateMarketParams {
    contractAddress: string;
    contractName: string;
    liquidity: number;
    startTime: number;
    endTime: number;
    question: string;
    metadataCid: string;
    tokenAddress: string;
    tokenContractName: string;
    userAddress: string;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}

export const createMarket = async (params: CreateMarketParams) => {
    const {
        contractAddress,
        contractName,
        liquidity,
        startTime,
        endTime,
        question,
        metadataCid,
        tokenAddress,
        tokenContractName,
        userAddress,
        onFinish,
        onCancel
    } = params;

    // Post conditions to ensure the user sends the liquidity amount
    // Using the modern Pc helper from @stacks/transactions 7.x
    const postConditions = [
        Pc.principal(userAddress)
            .willSendEq(BigInt(liquidity))
            .ft(`${tokenAddress}.${tokenContractName}`, 'usdcx')
    ];

    await openContractCall({
        network: NETWORK,
        contractAddress,
        contractName,
        functionName: 'create-market',
        functionArgs: [
            uintCV(liquidity),
            uintCV(startTime),
            uintCV(endTime),
            stringAsciiCV(question),
            stringAsciiCV(metadataCid)
        ],
        postConditionMode: PostConditionMode.Deny, // Restricted for safety
        postConditions,
        onFinish: (data) => {
            console.log('Transaction broadcasted:', data.txId);
            if (onFinish) onFinish(data);
        },
        onCancel: () => {
            console.log('Transaction cancelled');
            if (onCancel) onCancel();
        }
    });
};

export interface BuyParams {
    contractAddress: string;
    contractName: string;
    marketId: number;
    amount: number;
    outcome: 'YES' | 'NO';
    tokenAddress: string;
    tokenContractName: string;
    userAddress: string;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}

export const buyOutcome = async (params: BuyParams) => {
    const {
        contractAddress,
        contractName,
        marketId,
        amount,
        outcome,
        tokenAddress,
        tokenContractName,
        userAddress,
        onFinish,
        onCancel
    } = params;

    const functionName = outcome === 'YES' ? 'buy-yes' : 'buy-no';

    // Post condition: user sends USDCx to the contract
    const postConditions = [
        Pc.principal(userAddress)
            .willSendEq(BigInt(amount))
            .ft(`${tokenAddress}.${tokenContractName}`, 'usdcx')
    ];

    await openContractCall({
        network: NETWORK,
        contractAddress,
        contractName,
        functionName,
        functionArgs: [
            uintCV(marketId),
            uintCV(amount)
        ],
        postConditionMode: PostConditionMode.Deny,
        postConditions,
        onFinish: (data) => {
            console.log(`Buy ${outcome} transaction broadcasted:`, data.txId);
            if (onFinish) onFinish(data);
        },
        onCancel: () => {
            console.log('Transaction cancelled');
            if (onCancel) onCancel();
        }
    });
};

