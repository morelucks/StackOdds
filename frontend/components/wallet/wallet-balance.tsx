'use client';

import { useEffect, useState } from 'react';
import { cvToValue, callReadOnlyFunction } from '@stacks/transactions';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { getUSDCxAddress } from '@/lib/constants';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;

interface WalletBalanceProps {
  address: string;
}

export function WalletBalance({ address }: WalletBalanceProps) {
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) return;

      try {
        const [contractAddress, contractName] = getUSDCxAddress(
          process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet'
        ).split('.');

        const result = await callReadOnlyFunction({
          network: NETWORK,
          contractAddress,
          contractName,
          functionName: 'get-balance',
          functionArgs: [],
          senderAddress: address,
        });

        const balanceValue = cvToValue(result);
        const formattedBalance = (Number(balanceValue) / 1_000_000).toFixed(2);
        setBalance(formattedBalance);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setBalance('0.00');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [address]);

  if (isLoading) {
    return (
      <Card className="p-4 bg-secondary/50">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading balance...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-secondary/50">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">USDCx Balance</span>
        <span className="text-lg font-bold text-foreground">{balance} USDCx</span>
      </div>
    </Card>
  );
}
