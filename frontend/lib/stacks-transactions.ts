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

/**
 * Creates a new prediction market on the Stacks blockchain.
 * @param params Creation parameters including liquidity and market details.
 */
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
        postConditionMode: PostConditionMode.Deny,
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

/**
 * Purchases YES or NO outcome shares for a specific market.
 * @param params Buy parameters including the amount of USDCx to spend.
 */
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

export interface ResolveParams {
    contractAddress: string;
    contractName: string;
    marketId: number;
    yesWon: boolean;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}

/**
 * Resolves a prediction market outcome.
 * Only callable by authorized contract owners/moderators.
 */
export const resolveMarket = async (params: ResolveParams) => {
    const {
        contractAddress,
        contractName,
        marketId,
        yesWon,
        onFinish,
        onCancel
    } = params;

    await openContractCall({
        network: NETWORK,
        contractAddress,
        contractName,
        functionName: 'resolve-market',
        functionArgs: [
            uintCV(marketId),
            boolCV(yesWon)
        ],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [],
        onFinish: (data) => {
            console.log('Market resolution transaction broadcasted:', data.txId);
            if (onFinish) onFinish(data);
        },
        onCancel: () => {
            console.log('Resolution cancelled');
            if (onCancel) onCancel();
        }
    });
};

export interface ClaimParams {
    contractAddress: string;
    contractName: string;
    marketId: number;
    onFinish?: (data: any) => void;
    onCancel?: () => void;
}

/**
 * Claims winnings for a resolved prediction market.
 * Burns shares and transfers collateral back to the user.
 */
export const claimWinnings = async (params: ClaimParams) => {
    const {
        contractAddress,
        contractName,
        marketId,
        onFinish,
        onCancel
    } = params;

    await openContractCall({
        network: NETWORK,
        contractAddress,
        contractName,
        functionName: 'claim',
        functionArgs: [
            uintCV(marketId)
        ],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [],
        onFinish: (data) => {
            console.log('Claim transaction broadcasted:', data.txId);
            if (onFinish) onFinish(data);
        },
        onCancel: () => {
            console.log('Claim cancelled');
            if (onCancel) onCancel();
        }
    });
};
