'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';

const NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;

interface Transaction {
  txId: string;
  type: 'buy' | 'create' | 'resolve' | 'claim';
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
}

export function TransactionTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('stackodds_transactions');
    if (stored) {
      setTransactions(JSON.parse(stored));
    }
  }, []);

  const addTransaction = (tx: Transaction) => {
    const updated = [tx, ...transactions].slice(0, 10);
    setTransactions(updated);
    localStorage.setItem('stackodds_transactions', JSON.stringify(updated));
  };

  const explorerUrl = NETWORK.isMainnet() 
    ? `https://explorer.hiro.so/txid/`
    : `https://explorer.hiro.so/txid/?chain=testnet`;

  if (transactions.length === 0) return null;

  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div key={tx.txId} className="flex items-center justify-between p-2 rounded bg-secondary/50">
            <div className="flex items-center gap-2">
              {tx.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
              {tx.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
              {tx.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
              <div>
                <Badge variant="outline" className="text-xs">{tx.type}</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {tx.txId.slice(0, 8)}...{tx.txId.slice(-8)}
                </p>
              </div>
            </div>
            <a
              href={`${explorerUrl}${tx.txId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function useTransactionTracker() {
  const addTransaction = (txId: string, type: Transaction['type']) => {
    const tx: Transaction = {
      txId,
      type,
      status: 'pending',
      timestamp: Date.now(),
    };
    
    const stored = localStorage.getItem('stackodds_transactions');
    const existing = stored ? JSON.parse(stored) : [];
    const updated = [tx, ...existing].slice(0, 10);
    localStorage.setItem('stackodds_transactions', JSON.stringify(updated));
    
    window.dispatchEvent(new Event('storage'));
  };

  return { addTransaction };
}
