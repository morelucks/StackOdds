'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getTxUrl } from '@/lib/stacks-network';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'unknown';

interface TransactionStatusProps {
  txId: string;
  status?: TransactionStatus;
  onStatusChange?: (status: TransactionStatus) => void;
  autoCheck?: boolean;
  checkInterval?: number;
}

/**
 * Transaction Status Component
 * Displays transaction status with link to Stacks explorer
 * Uses @stacks/network for explorer URL generation
 */
export function TransactionStatus({
  txId,
  status: initialStatus = 'pending',
  onStatusChange,
  autoCheck = false,
  checkInterval = 10000,
}: TransactionStatusProps) {
  const [status, setStatus] = useState<TransactionStatus>(initialStatus);
  const explorerUrl = getTxUrl(txId);

  useEffect(() => {
    if (!autoCheck) return;

    const checkStatus = async () => {
      try {
        // In a real implementation, you would check the transaction status
        // via the Stacks API or a transaction monitoring service
        // For now, we'll just keep it as pending
        // This is a placeholder for future implementation
      } catch (error) {
        console.error('Failed to check transaction status:', error);
      }
    };

    const interval = setInterval(checkStatus, checkInterval);
    return () => clearInterval(interval);
  }, [txId, autoCheck, checkInterval]);

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Pending</Badge>;
      case 'success':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">Success</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card className="p-4 bg-secondary/50 border-border">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="mt-0.5">{getStatusIcon()}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-foreground">Transaction</span>
              {getStatusBadge()}
            </div>
            <code className="text-xs text-muted-foreground break-all block">
              {txId}
            </code>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0"
          onClick={() => window.open(explorerUrl, '_blank')}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          View
        </Button>
      </div>
    </Card>
  );
}

/**
 * Compact Transaction Status Component
 * Minimal version for inline display
 */
export function TransactionStatusCompact({ txId, status = 'pending' }: { txId: string; status?: TransactionStatus }) {
  const explorerUrl = getTxUrl(txId);

  return (
    <div className="flex items-center gap-2 text-xs">
      {status === 'pending' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
      {status === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
      {status === 'failed' && <XCircle className="h-3 w-3 text-red-500" />}
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline truncate max-w-[200px]"
      >
        {txId.slice(0, 8)}...{txId.slice(-8)}
      </a>
    </div>
  );
}
