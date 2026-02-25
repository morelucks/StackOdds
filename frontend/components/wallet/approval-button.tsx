'use client';

import { useState } from 'react';
import { openContractCall } from '@stacks/connect';
import { uintCV, contractPrincipalCV, PostConditionMode } from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { getUSDCxAddress, TOKEN_CONTRACT_ADDRESS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

const NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;

interface ApprovalButtonProps {
  spenderAddress: string;
  amount: number;
  onApproved?: () => void;
}

export function ApprovalButton({ spenderAddress, amount, onApproved }: ApprovalButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleApprove = async () => {
    try {
      setIsPending(true);
      const amountMicro = Math.floor(amount * 1_000_000);
      const [tokenAddr, tokenName] = getUSDCxAddress(
        process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet'
      ).split('.');

      await openContractCall({
        network: NETWORK,
        contractAddress: tokenAddr,
        contractName: tokenName,
        functionName: 'approve',
        functionArgs: [
          contractPrincipalCV(spenderAddress.split('.')[0], spenderAddress.split('.')[1]),
          uintCV(amountMicro),
        ],
        postConditionMode: PostConditionMode.Allow,
        postConditions: [],
        onFinish: (data) => {
          toast.success('USDCx approved successfully!');
          setIsApproved(true);
          setIsPending(false);
          if (onApproved) onApproved();
        },
        onCancel: () => {
          toast.info('Approval cancelled');
          setIsPending(false);
        },
      });
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve USDCx');
      setIsPending(false);
    }
  };

  if (isApproved) {
    return (
      <Button disabled className="w-full" variant="outline">
        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
        Approved
      </Button>
    );
  }

  return (
    <Button onClick={handleApprove} disabled={isPending} className="w-full">
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? 'Approving...' : 'Approve USDCx'}
    </Button>
  );
}
