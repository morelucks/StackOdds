'use client';

import { Button } from '@/components/ui/button';
import { claimWinningsTx } from '@/lib/claim-winnings';
import { useState } from 'react';

interface ClaimButtonProps {
  marketId: number;
  onSuccess?: () => void;
}

export const ClaimButton = ({ marketId, onSuccess }: ClaimButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleClaim = async () => {
    setLoading(true);
    try {
      await claimWinningsTx({
        marketId,
        onFinish: () => {
          if (onSuccess) onSuccess();
        }
      });
    } catch (error) {
      console.error('Claim failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClaim} disabled={loading}>
      {loading ? 'Claiming...' : 'Claim Winnings'}
    </Button>
  );
};
