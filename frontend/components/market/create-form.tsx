'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useStacks } from '@/hooks/useStacks';
import { useUSDCx } from '@/hooks/useUSDCx';
import { createMarket } from '@/lib/stacks-transactions';
import { approveUSDCx } from '@/lib/usdcx-approval';
import { toMicroUnits, getUSDCxAddress } from '@/lib/constants';
import { CONTRACT_CONFIG } from '@/lib/contract-config';

export const CreateMarketForm = () => {
  const { address } = useStacks();
  const { balance, checkAllowance, refetch } = useUSDCx();
  const [question, setQuestion] = useState('');
  const [liquidity, setLiquidity] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!address || !question || !liquidity || !endTime) return;
    
    setLoading(true);
    try {
      const liquidityNum = parseFloat(liquidity);
      const isMainnet = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet';
      const config = isMainnet ? CONTRACT_CONFIG.mainnet : CONTRACT_CONFIG.testnet;
      const usdcxAddress = getUSDCxAddress(isMainnet);
      const [tokenAddr, tokenName] = usdcxAddress.split('.');
      
      const allowance = await checkAllowance(config.address);
      
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);
      const startTimestamp = Math.floor(Date.now() / 1000);
      
      if (allowance < liquidityNum) {
        await approveUSDCx({
          spenderAddress: config.address,
          amount: toMicroUnits(liquidityNum * 2),
          onFinish: async () => {
            await createMarket({
              contractAddress: config.address,
              contractName: config.name,
              liquidity: liquidityNum,
              startTime: startTimestamp,
              endTime: endTimestamp,
              question,
              metadataCid: '',
              tokenAddress: tokenAddr,
              tokenContractName: tokenName,
              userAddress: address,
              onFinish: () => {
                refetch();
                setQuestion('');
                setLiquidity('');
                setEndTime('');
              }
            });
          }
        });
      } else {
        await createMarket({
          contractAddress: config.address,
          contractName: config.name,
          liquidity: liquidityNum,
          startTime: startTimestamp,
          endTime: endTimestamp,
          question,
          metadataCid: '',
          tokenAddress: tokenAddr,
          tokenContractName: tokenName,
          userAddress: address,
          onFinish: () => {
            refetch();
            setQuestion('');
            setLiquidity('');
            setEndTime('');
          }
        });
      }
    } catch (error) {
      console.error('Market creation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Question</Label>
        <Textarea
          placeholder="Will X happen by Y date?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
      </div>
      <div>
        <Label>Initial Liquidity (USDCx)</Label>
        <Input
          type="number"
          placeholder="100"
          value={liquidity}
          onChange={(e) => setLiquidity(e.target.value)}
        />
      </div>
      <div>
        <Label>End Date</Label>
        <Input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
      </div>
      <Button onClick={handleCreate} disabled={loading || !question || !liquidity || !endTime}>
        {loading ? 'Creating...' : 'Create Market'}
      </Button>
    </div>
  );
};
