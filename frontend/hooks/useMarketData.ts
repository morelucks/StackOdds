import { useState, useEffect } from 'react';
import { fetchMarket } from '@/lib/market-queries';
import type { Market } from '@/lib/market-types';

export const useMarketData = (marketId: number) => {
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchMarket(marketId);
      setMarket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [marketId]);

  return { market, loading, error, refetch };
};
