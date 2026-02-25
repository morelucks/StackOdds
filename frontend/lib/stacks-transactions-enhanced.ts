/**
 * Enhanced Stacks transaction utilities with post-conditions.
 * Provides secure contract interactions with proper post-condition checks.
 */
import { openContractCall } from '@stacks/connect';
import {
    uintCV,
    boolCV,
    stringAsciiCV,
    contractPrincipalCV,
    PostConditionMode,
    makeStandardFungiblePostCondition,
    FungibleConditionCode,
    createAssetInfo,
} from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { toMicroUnits, getUSDCxAddress, TOKEN_CONTRACT_ADDRESS } from './constants';

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
 * Creates a new prediction market with post-conditions for security.
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

    const liquidityMicro = toMicroUnits(liquidity);
    const usdcxAddress = getUSDCxAddress(process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet');
    const [usdcxAddr, usdcxName] = usdcxAddress.split('.');

    // Post-condition: User must transfer exact liquidity amount
    const postConditions = [
        makeStandardFungiblePostCondition(
            userAddress,
            FungibleConditionCode.Equal,
            liquidityMicro,
            createAssetInfo(usdcxAddr, usdcxName, 'usdcx')
        ),
    ];

    await openContractCall({
        network: NETWORK,
        contractAddress,
        contractName,
        functionName: 'create-market',
        functionArgs: [
            uintCV(liquidityMicro),
            uintCV(startTime),
            uintCV(endTime),
            stringAsciiCV(question),
            stringAsciiCV(metadataCid),
            contractPrincipalCV(usdcxAddr, usdcxName),
            contractPrincipalCV(TOKEN_CONTRACT_ADDRESS.split('.')[0], TOKEN_CONTRACT_ADDRESS.split('.')[1])
        ],
        postConditionMode: PostConditionMode.Deny,
        postConditions,
        onFinish: (data) => {
            console.log('Market created:', data.txId);
            if (onFinish) onFinish(data);
        },
        onCancel: () => {
            console.log('Market creation cancelled');
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
 * Purchases outcome shares with post-conditions.
 */
export const buyOutcome = async (params: BuyParams) => {
    const {
        contractAddress,
        contractName,
        marketId,
        amount,
        outcome,
        userAddress,
        onFinish,
        onCancel
    } = params;

    const functionName = outcome === 'YES' ? 'buy-yes' : 'buy-no';
    const amountMicro = toMicroUnits(amount);
    const usdcxAddress = getUSDCxAddress(process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet');
    const [usdcxAddr, usdcxName] = usdcxAddress.split('.');

    // Post-condition: User must transfer exact amount
    const postConditions = [
        makeStandardFungiblePostCondition(
            userAddress,
            FungibleConditionCode.Equal,
            amountMicro,
            createAssetInfo(usdcxAddr, usdcxName, 'usdcx')
        ),
    ];

    await openContractCall({
        network: NETWORK,
        contractAddress,
        contractName,
        functionName,
        functionArgs: [
            uintCV(marketId),
            uintCV(amountMicro),
            contractPrincipalCV(usdcxAddr, usdcxName),
            contractPrincipalCV(TOKEN_CONTRACT_ADDRESS.split('.')[0], TOKEN_CONTRACT_ADDRESS.split('.')[1])
        ],
        postConditionMode: PostConditionMode.Deny,
        postConditions,
        onFinish: (data) => {
            console.log(`Buy ${outcome} completed:`, data.txId);
            if (onFinish) onFinish(data);
        },
        onCancel: () => {
            console.log('Buy cancelled');
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
 * Resolves a market outcome (admin only).
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
            console.log('Market resolved:', data.txId);
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
 * Claims winnings from a resolved market.
 */
export const claimWinnings = async (params: ClaimParams) => {
    const {
        contractAddress,
        contractName,
        marketId,
        onFinish,
        onCancel
    } = params;

    const usdcxAddress = getUSDCxAddress(process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet');
    const [usdcxAddr, usdcxName] = usdcxAddress.split('.');

    await openContractCall({
        network: NETWORK,
        contractAddress,
        contractName,
        functionName: 'claim',
        functionArgs: [
            uintCV(marketId),
            contractPrincipalCV(usdcxAddr, usdcxName),
            contractPrincipalCV(TOKEN_CONTRACT_ADDRESS.split('.')[0], TOKEN_CONTRACT_ADDRESS.split('.')[1])
        ],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [],
        onFinish: (data) => {
            console.log('Claim completed:', data.txId);
            if (onFinish) onFinish(data);
        },
        onCancel: () => {
            console.log('Claim cancelled');
            if (onCancel) onCancel();
        }
    });
};
