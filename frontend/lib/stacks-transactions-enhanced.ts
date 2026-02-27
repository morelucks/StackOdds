/**
 * Enhanced Stacks transaction utilities with post-conditions.
 * Provides secure contract interactions with proper post-condition checks.
 * Uses @stacks/connect for wallet interactions and @stacks/transactions for Clarity values.
 */
import { openContractCall } from '@stacks/connect';
import { PostConditionMode } from '@stacks/transactions';
import { getStacksNetwork } from './stacks-network';
import { 
    createUintCV, 
    createBoolCV, 
    createStringAsciiCV, 
    createContractPrincipalCV,
    toMicroUSDCx 
} from './stacks-clarity-values';
import { 
    createUSDCxPostCondition, 
    PostConditionCodes 
} from './stacks-post-conditions';
import { getUSDCxAddress, TOKEN_CONTRACT_ADDRESS } from './constants';

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

    const liquidityMicro = toMicroUSDCx(liquidity);
    const usdcxAddress = getUSDCxAddress(process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet');
    const [usdcxAddr, usdcxName] = usdcxAddress.split('.');

    // Post-condition: User must transfer exact liquidity amount
    const postConditions = [
        createUSDCxPostCondition(
            userAddress,
            liquidityMicro,
            usdcxAddress,
            PostConditionCodes.Equal
        ),
    ];

    await openContractCall({
        network: getStacksNetwork(),
        contractAddress,
        contractName,
        functionName: 'create-market',
        functionArgs: [
            createUintCV(liquidityMicro),
            createUintCV(startTime),
            createUintCV(endTime),
            createStringAsciiCV(question),
            createStringAsciiCV(metadataCid),
            createContractPrincipalCV(`${usdcxAddr}.${usdcxName}`),
            createContractPrincipalCV(TOKEN_CONTRACT_ADDRESS)
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
    const amountMicro = toMicroUSDCx(amount);
    const usdcxAddress = getUSDCxAddress(process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet');
    const [usdcxAddr, usdcxName] = usdcxAddress.split('.');

    // Post-condition: User must transfer exact amount
    const postConditions = [
        createUSDCxPostCondition(
            userAddress,
            amountMicro,
            usdcxAddress,
            PostConditionCodes.Equal
        ),
    ];

    await openContractCall({
        network: getStacksNetwork(),
        contractAddress,
        contractName,
        functionName,
        functionArgs: [
            createUintCV(marketId),
            createUintCV(amountMicro),
            createContractPrincipalCV(`${usdcxAddr}.${usdcxName}`),
            createContractPrincipalCV(TOKEN_CONTRACT_ADDRESS)
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
        network: getStacksNetwork(),
        contractAddress,
        contractName,
        functionName: 'resolve-market',
        functionArgs: [
            createUintCV(marketId),
            createBoolCV(yesWon)
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
        network: getStacksNetwork(),
        contractAddress,
        contractName,
        functionName: 'claim',
        functionArgs: [
            createUintCV(marketId),
            createContractPrincipalCV(`${usdcxAddr}.${usdcxName}`),
            createContractPrincipalCV(TOKEN_CONTRACT_ADDRESS)
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
