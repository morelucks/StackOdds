'use client';

import { useMarketData } from '@/hooks/useMarketData';
import { calculatePrice } from '@/lib/lmsr-math';
import { fromMicroUnits } from '@/lib/constants';

interface MarketPriceProps {
  marketId: number;
}

export const MarketPrice = ({ marketId }: MarketPriceProps) => {
  const { market, loading } = useMarketData(marketId);

  if (loading || !market) {
    return <div>Loading...</div>;
  }

  const yesPrice = calculatePrice(market.qYes, market.qNo, market.liquidity, 'YES');
  const noPrice = calculatePrice(market.qYes, market.qNo, market.liquidity, 'NO');

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 border rounded">
        <div className="text-sm text-muted-foreground">YES</div>
        <div className="text-2xl font-bold">{(yesPrice * 100).toFixed(1)}%</div>
      </div>
      <div className="p-4 border rounded">
        <div className="text-sm text-muted-foreground">NO</div>
        <div className="text-2xl font-bold">{(noPrice * 100).toFixed(1)}%</div>
      </div>
    </div>
  );
};
