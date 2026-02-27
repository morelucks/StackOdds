'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getTokenAllowance } from '@/lib/stacks-token-metadata';
import { openContractCall } from '@stacks/connect';
import { PostConditionMode } from '@stacks/transactions';
import { getStacksNetwork } from '@/lib/stacks-network';
import { createContractPrincipalCV, createUintCV, toMicroUSDCx } from '@/lib/stacks-clarity-values';
import { getUSDCxAddress } from '@/lib/constants';

interface USDCxApprovalFlowProps {
  userAddress: string;
  spenderContract: string;
  requiredAmount: number;
  onApproved?: () => void;
  onError?: (error: Error) => void;
}

/**
 * USDCx Approval Flow Component
 * Handles token approval with allowance checking
 * Uses @stacks/connect and @stacks/transactions
 */
export function USDCxApprovalFlow({
  userAddress,
  spenderContract,
  requiredAmount,
  onApproved,
  onError,
}: USDCxApprovalFlowProps) {
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const requiredMicro = toMicroUSDCx(requiredAmount);
  const needsApproval = allowance < requiredMicro;

  useEffect(() => {
    checkAllowance();
  }, [userAddress, spenderContract]);

  const checkAllowance = async () => {
    if (!userAddress) return;

    try {
      setIsCheckingAllowance(true);
      const usdcxAddress = getUSDCxAddress(process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet');
      const [contractAddress, contractName] = usdcxAddress.split('.');

      const result = await getTokenAllowance(
        contractAddress,
        contractName,
        userAddress,
        spenderContract,
        userAddress,
        6
      );

      setAllowance(result.balance);
      setIsApproved(result.balance >= requiredMicro);
    } catch (error) {
      console.error('Failed to check allowance:', error);
      toast.error('Failed to check token allowance');
    } finally {
      setIsCheckingAllowance(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      const usdcxAddress = getUSDCxAddress(process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet');
      const [tokenAddr, tokenName] = usdcxAddress.split('.');

      await openContractCall({
        network: getStacksNetwork(),
        contractAddress: tokenAddr,
        contractName: tokenName,
        functionName: 'approve',
        functionArgs: [
          createContractPrincipalCV(spenderContract),
          createUintCV(requiredMicro),
        ],
        postConditionMode: PostConditionMode.Allow,
        postConditions: [],
        onFinish: (data) => {
          toast.success('USDCx approved successfully!');
          setIsApproved(true);
          setIsApproving(false);
          if (onApproved) onApproved();
        },
        onCancel: () => {
          toast.info('Approval cancelled');
          setIsApproving(false);
        },
      });
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve USDCx');
      setIsApproving(false);
      if (onError) onError(error as Error);
    }
  };

  if (isCheckingAllowance) {
    return (
      <Card className="p-4 bg-secondary/50">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Checking allowance...</span>
        </div>
      </Card>
    );
  }

  if (isApproved) {
    return (
      <Card className="p-4 bg-green-500/10 border-green-500/20">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            USDCx Approved
          </span>
        </div>
      </Card>
    );
  }

  if (needsApproval) {
    return (
      <Card className="p-4 bg-orange-500/10 border-orange-500/20">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                Approval Required
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You need to approve {requiredAmount} USDCx for this transaction
              </p>
            </div>
          </div>
          <Button
            onClick={handleApprove}
            disabled={isApproving}
            className="w-full"
            size="sm"
          >
            {isApproving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isApproving ? 'Approving...' : 'Approve USDCx'}
          </Button>
        </div>
      </Card>
    );
  }

  return null;
}
