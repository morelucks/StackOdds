export const TX_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed'
} as const;

export type TxStatus = typeof TX_STATUS[keyof typeof TX_STATUS];

export interface Transaction {
  txId: string;
  status: TxStatus;
  type: string;
  timestamp: number;
}

export const saveTx = (tx: Transaction) => {
  const txs = getTxHistory();
  txs.unshift(tx);
  localStorage.setItem('tx_history', JSON.stringify(txs.slice(0, 50)));
};

export const getTxHistory = (): Transaction[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('tx_history');
  return stored ? JSON.parse(stored) : [];
};

export const updateTxStatus = (txId: string, status: TxStatus) => {
  const txs = getTxHistory();
  const tx = txs.find(t => t.txId === txId);
  if (tx) {
    tx.status = status;
    localStorage.setItem('tx_history', JSON.stringify(txs));
  }
};
