import { useState, useEffect } from 'react';
import { useStacks } from './useStacks';
import { getUSDCxBalance, getUSDCxAllowance } from '@/lib/usdcx-balance';
import { fromMicroUnits } from '@/lib/constants';

export const useUSDCx = () => {
  const { address } = useStacks();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const bal = await getUSDCxBalance(address);
      setBalance(fromMicroUnits(bal));
    } catch (error) {
      console.error('Error fetching balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAllowance = async (spender: string): Promise<number> => {
    if (!address) return 0;
    
    try {
      const allowance = await getUSDCxAllowance(address, spender);
      return fromMicroUnits(allowance);
    } catch (error) {
      console.error('Error checking allowance:', error);
      return 0;
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [address]);

  return {
    balance,
    loading,
    refetch: fetchBalance,
    checkAllowance
  };
};
