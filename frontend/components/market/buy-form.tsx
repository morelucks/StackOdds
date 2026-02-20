'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStacks } from '@/hooks/useStacks';
import { useUSDCx } from '@/hooks/useUSDCx';
import { approveUSDCx } from '@/lib/usdcx-approval';
import { buyOutcome } from '@/lib/stacks-transactions';
import { toMicroUnits } from '@/lib/constants';
import { CONTRACT_CONFIG } from '@/lib/contract-config';

interface BuyFormProps {
  marketId: number;
  outcome: 'YES' | 'NO';
  onSuccess?: () => void;
}

export const BuyForm = ({ marketId, outcome, onSuccess }: BuyFormProps) => {
  const { address } = useStacks();
  const { balance, checkAllowance, refetch } = useUSDCx();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    if (!address || !amount) return;
    
    setLoading(true);
    try {
      const amountNum = parseFloat(amount);
      const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
      const config = isMainnet ? CONTRACT_CONFIG.mainnet : CONTRACT_CONFIG.testnet;
      
      const allowance = await checkAllowance(config.address);
      
      if (allowance < amountNum) {
        await approveUSDCx({
          spenderAddress: config.address,
          amount: toMicroUnits(amountNum * 2),
          onFinish: async () => {
            await buyOutcome({
              contractAddress: config.address,
              contractName: config.name,
              marketId,
              amount: amountNum,
              outcome,
              tokenAddress: '',
              tokenContractName: '',
              userAddress: address,
              onFinish: () => {
                refetch();
                if (onSuccess) onSuccess();
              }
            });
          }
        });
      } else {
        await buyOutcome({
          contractAddress: config.address,
          contractName: config.name,
          marketId,
          amount: amountNum,
          outcome,
          tokenAddress: '',
          tokenContractName: '',
          userAddress: address,
          onFinish: () => {
            refetch();
            if (onSuccess) onSuccess();
          }
        });
      }
    } catch (error) {
      console.error('Buy failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        type="number"
        placeholder="Amount (USDCx)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Button onClick={handleBuy} disabled={loading || !amount}>
        {loading ? 'Processing...' : `Buy ${outcome}`}
      </Button>
    </div>
  );
};
