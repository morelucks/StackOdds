/**
 * Stacks Contract Helper Functions
 * High-level helpers for common contract operations
 * Uses @stacks/connect and @stacks/transactions
 */
import { openContractCall } from '@stacks/connect';
import { PostConditionMode, PostCondition } from '@stacks/transactions';
import { getStacksNetwork, getTxUrl } from './stacks-network';
import { 
    createUintCV, 
    createBoolCV, 
    createStringAsciiCV,
    createContractPrincipalCV,
    toMicroUSDCx 
} from './stacks-clarity-values';
import { createUSDCxPostCondition, PostConditionCodes } from './stacks-post-conditions';
import { getUSDCxAddress, CONTRACT_ADDRESS, TOKEN_CONTRACT_ADDRESS } from './constants';

export interface ContractCallResult {
    txId: string;
    explorerUrl: string;
}

export interface ContractCallOptions {
    onSuccess?: (result: ContractCallResult) => void;
    onError?: (error: Error) => void;
    onCancel?: () => void;
}

/**
 * Helper to create a market with proper post-conditions
 */
export async function createMarketHelper(
    userAddress: string,
    liquidity: number,
    startTime: number,
    endTime: number,
    question: string,
    metadataCid: string,
    options?: ContractCallOptions
): Promise<void> {
    const [contractAddress, contractName] = CONTRACT_ADDRESS.split('.');
    const liquidityMicro = toMicroUSDCx(liquidity);
    const usdcxAddress = getUSDCxAddress(process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet');

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
            createContractPrincipalCV(usdcxAddress),
            createContractPrincipalCV(TOKEN_CONTRACT_ADDRESS),
        ],
        postConditionMode: PostConditionMode.Deny,
        postConditions,
        onFinish: (data) => {
            const result = {
                txId: data.txId,
                explorerUrl: getTxUrl(data.txId),
            };
            if (options?.onSuccess) options.onSuccess(result);
        },
        onCancel: () => {
            if (options?.onCancel) options.onCancel();
        },
    });
}

/**
 * Helper to buy outcome shares with proper post-conditions
 */
export async function buyOutcomeHelper(
    userAddress: string,
    marketId: number,
    amount: number,
    outcome: 'YES' | 'NO',
    options?: ContractCallOptions
): Promise<void> {
    const [contractAddress, contractName] = CONTRACT_ADDRESS.split('.');
    const amountMicro = toMicroUSDCx(amount);
    const usdcxAddress = getUSDCxAddress(process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet');
    const functionName = outcome === 'YES' ? 'buy-yes' : 'buy-no';

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
            createContractPrincipalCV(usdcxAddress),
            createContractPrincipalCV(TOKEN_CONTRACT_ADDRESS),
        ],
        postConditionMode: PostConditionMode.Deny,
        postConditions,
        onFinish: (data) => {
            const result = {
                txId: data.txId,
                explorerUrl: getTxUrl(data.txId),
            };
            if (options?.onSuccess) options.onSuccess(result);
        },
        onCancel: () => {
            if (options?.onCancel) options.onCancel();
        },
    });
}

/**
 * Helper to resolve a market
 */
export async function resolveMarketHelper(
    marketId: number,
    yesWon: boolean,
    options?: ContractCallOptions
): Promise<void> {
    const [contractAddress, contractName] = CONTRACT_ADDRESS.split('.');

    await openContractCall({
        network: getStacksNetwork(),
        contractAddress,
        contractName,
        functionName: 'resolve-market',
        functionArgs: [
            createUintCV(marketId),
            createBoolCV(yesWon),
        ],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [],
        onFinish: (data) => {
            const result = {
                txId: data.txId,
                explorerUrl: getTxUrl(data.txId),
            };
            if (options?.onSuccess) options.onSuccess(result);
        },
        onCancel: () => {
            if (options?.onCancel) options.onCancel();
        },
    });
}

/**
 * Helper to claim winnings
 */
export async function claimWinningsHelper(
    marketId: number,
    options?: ContractCallOptions
): Promise<void> {
    const [contractAddress, contractName] = CONTRACT_ADDRESS.split('.');
    const usdcxAddress = getUSDCxAddress(process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet');

    await openContractCall({
        network: getStacksNetwork(),
        contractAddress,
        contractName,
        functionName: 'claim',
        functionArgs: [
            createUintCV(marketId),
            createContractPrincipalCV(usdcxAddress),
            createContractPrincipalCV(TOKEN_CONTRACT_ADDRESS),
        ],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [],
        onFinish: (data) => {
            const result = {
                txId: data.txId,
                explorerUrl: getTxUrl(data.txId),
            };
            if (options?.onSuccess) options.onSuccess(result);
        },
        onCancel: () => {
            if (options?.onCancel) options.onCancel();
        },
    });
}

/**
 * Helper to approve USDCx spending
 */
export async function approveUSDCxHelper(
    spenderContract: string,
    amount: number,
    options?: ContractCallOptions
): Promise<void> {
    const usdcxAddress = getUSDCxAddress(process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet');
    const [contractAddress, contractName] = usdcxAddress.split('.');
    const amountMicro = toMicroUSDCx(amount);

    await openContractCall({
        network: getStacksNetwork(),
        contractAddress,
        contractName,
        functionName: 'approve',
        functionArgs: [
            createContractPrincipalCV(spenderContract),
            createUintCV(amountMicro),
        ],
        postConditionMode: PostConditionMode.Allow,
        postConditions: [],
        onFinish: (data) => {
            const result = {
                txId: data.txId,
                explorerUrl: getTxUrl(data.txId),
            };
            if (options?.onSuccess) options.onSuccess(result);
        },
        onCancel: () => {
            if (options?.onCancel) options.onCancel();
        },
    });
}

/**
 * Generic contract call helper
 */
export async function callContractHelper(
    contractAddress: string,
    contractName: string,
    functionName: string,
    functionArgs: any[],
    postConditions: PostCondition[] = [],
    postConditionMode: PostConditionMode = PostConditionMode.Deny,
    options?: ContractCallOptions
): Promise<void> {
    await openContractCall({
        network: getStacksNetwork(),
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        postConditions,
        postConditionMode,
        onFinish: (data) => {
            const result = {
                txId: data.txId,
                explorerUrl: getTxUrl(data.txId),
            };
            if (options?.onSuccess) options.onSuccess(result);
        },
        onCancel: () => {
            if (options?.onCancel) options.onCancel();
        },
    });
}
