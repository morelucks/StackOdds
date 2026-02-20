import { useState, useEffect } from 'react';
import { useStacks } from './useStacks';
import { getUserShares } from '@/lib/user-shares';

export const useUserPosition = (marketId: number) => {
  const { address } = useStacks();
  const [yesShares, setYesShares] = useState(0);
  const [noShares, setNoShares] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPosition = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const [yes, no] = await Promise.all([
        getUserShares(marketId, address, 'YES'),
        getUserShares(marketId, address, 'NO')
      ]);
      
      setYesShares(yes);
      setNoShares(no);
    } catch (error) {
      console.error('Error fetching position:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosition();
  }, [marketId, address]);

  return {
    yesShares,
    noShares,
    loading,
    refetch: fetchPosition
  };
};
