'use client';

import { Badge } from '@/components/ui/badge';
import { getNetworkName, isMainnet } from '@/lib/stacks-network';
import { Globe } from 'lucide-react';

/**
 * Network Indicator Component
 * Displays the current Stacks network (Mainnet/Testnet)
 * Uses @stacks/network for network detection
 */
export function NetworkIndicator() {
  const networkName = getNetworkName();
  const isMain = isMainnet();

  return (
    <Badge 
      variant={isMain ? 'default' : 'secondary'}
      className={`flex items-center gap-1.5 ${
        isMain 
          ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20' 
          : 'bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20'
      }`}
    >
      <Globe className="h-3 w-3" />
      <span className="text-xs font-medium">{networkName}</span>
    </Badge>
  );
}
