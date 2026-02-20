import { openContractCall } from '@stacks/connect';
import { uintCV, boolCV, PostConditionMode } from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { CONTRACT_CONFIG } from './contract-config';

const getNetwork = () => {
  return process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
};

export interface ResolveMarketParams {
  marketId: number;
  yesWon: boolean;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export const resolveMarketTx = async (params: ResolveMarketParams) => {
  const { marketId, yesWon, onFinish, onCancel } = params;
  const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
  const config = isMainnet ? CONTRACT_CONFIG.mainnet : CONTRACT_CONFIG.testnet;

  await openContractCall({
    network: getNetwork(),
    contractAddress: config.address,
    contractName: config.name,
    functionName: 'resolve-market',
    functionArgs: [
      uintCV(marketId),
      boolCV(yesWon)
    ],
    postConditionMode: PostConditionMode.Allow,
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
