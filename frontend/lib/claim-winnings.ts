import { openContractCall } from '@stacks/connect';
import { uintCV, PostConditionMode } from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { CONTRACT_CONFIG } from './contract-config';

const getNetwork = () => {
  return process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
};

export interface ClaimWinningsParams {
  marketId: number;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export const claimWinningsTx = async (params: ClaimWinningsParams) => {
  const { marketId, onFinish, onCancel } = params;
  const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
  const config = isMainnet ? CONTRACT_CONFIG.mainnet : CONTRACT_CONFIG.testnet;

  await openContractCall({
    network: getNetwork(),
    contractAddress: config.address,
    contractName: config.name,
    functionName: 'claim',
    functionArgs: [uintCV(marketId)],
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish: (data) => {
      console.log('Winnings claimed:', data.txId);
      if (onFinish) onFinish(data);
    },
    onCancel: () => {
      console.log('Claim cancelled');
      if (onCancel) onCancel();
    }
  });
};
