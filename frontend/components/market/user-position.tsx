'use client';

import { useUserPosition } from '@/hooks/useUserPosition';
import { fromMicroUnits } from '@/lib/constants';

interface UserPositionProps {
  marketId: number;
}

export const UserPosition = ({ marketId }: UserPositionProps) => {
  const { yesShares, noShares, loading } = useUserPosition(marketId);

  if (loading) {
    return <div>Loading position...</div>;
  }

  if (yesShares === 0 && noShares === 0) {
    return <div className="text-sm text-muted-foreground">No position</div>;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Your Position</div>
      {yesShares > 0 && (
        <div className="flex justify-between">
          <span>YES Shares:</span>
          <span className="font-medium">{fromMicroUnits(yesShares).toFixed(2)}</span>
        </div>
      )}
      {noShares > 0 && (
        <div className="flex justify-between">
          <span>NO Shares:</span>
          <span className="font-medium">{fromMicroUnits(noShares).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};
