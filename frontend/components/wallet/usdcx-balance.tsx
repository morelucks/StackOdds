'use client';

import { useUSDCx } from '@/hooks/useUSDCx';
import { fromMicroUnits } from '@/lib/constants';

export const USDCxBalance = () => {
  const { balance, loading } = useUSDCx();

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{balance.toFixed(2)} USDCx</span>
    </div>
  );
};
