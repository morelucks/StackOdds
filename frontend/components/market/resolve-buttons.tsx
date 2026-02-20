'use client';

import { Button } from '@/components/ui/button';
import { resolveMarketTx } from '@/lib/resolve-market';
import { useState } from 'react';

interface ResolveButtonsProps {
  marketId: number;
  onSuccess?: () => void;
}

export const ResolveButtons = ({ marketId, onSuccess }: ResolveButtonsProps) => {
  const [loading, setLoading] = useState(false);

  const handleResolve = async (yesWon: boolean) => {
    setLoading(true);
    try {
      await resolveMarketTx({
        marketId,
        yesWon,
        onFinish: () => {
          if (onSuccess) onSuccess();
        }
      });
    } catch (error) {
      console.error('Resolution failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-4">
      <Button onClick={() => handleResolve(true)} disabled={loading}>
        Resolve YES
      </Button>
      <Button onClick={() => handleResolve(false)} disabled={loading} variant="outline">
        Resolve NO
      </Button>
    </div>
  );
};
