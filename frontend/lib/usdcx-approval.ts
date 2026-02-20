import { openContractCall } from '@stacks/connect';
import { uintCV, principalCV, PostConditionMode } from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { getUSDCxAddress } from './constants';

const getNetwork = () => {
  return process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
};

export interface ApproveUSDCxParams {
  spenderAddress: string;
  amount: number;
  onFinish?: (data: any) => void;
  onCancel?: () => void;
}

export const approveUSDCx = async (params: ApproveUSDCxParams) => {
  const { spenderAddress, amount, onFinish, onCancel } = params;
  const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
  const usdcxAddress = getUSDCxAddress(isMainnet);
  const [contractAddress, contractName] = usdcxAddress.split('.');

  await openContractCall({
    network: getNetwork(),
    contractAddress,
    contractName,
    functionName: 'approve',
    functionArgs: [
      principalCV(spenderAddress),
      uintCV(amount),
    ],
    postConditionMode: PostConditionMode.Allow,
    postConditions: [],
    onFinish: (data) => {
      console.log('USDCx approval transaction:', data.txId);
      if (onFinish) onFinish(data);
    },
    onCancel: () => {
      console.log('Approval cancelled');
      if (onCancel) onCancel();
    }
  });
};
