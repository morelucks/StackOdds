'use client';

import React, { useState, useEffect } from 'react';

interface Transaction {
    txId: string;
    type: string;
    status: 'pending' | 'success' | 'failed';
    timestamp: number;
}

export const TxTracker: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const mockInterval = setInterval(() => {
            if (Math.random() > 0.8) {
                const newTx: Transaction = {
                    txId: Math.random().toString(36).substring(2, 15),
                    type: ['Buy YES', 'Buy NO', 'Create Market', 'Claim'][Math.floor(Math.random() * 4)],
                    status: 'pending',
                    timestamp: Date.now(),
                };
                setTransactions(prev => [newTx, ...prev].slice(0, 5));
            }
        }, 30000);
        return () => clearInterval(mockInterval);
    }, []);

    return (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isOpen ? 'w-80' : 'w-14'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-colors"
                aria-label="Track transactions"
            >
                <span className="text-white text-xl">⏳</span>
            </button>

            {isOpen && (
                <div className="absolute bottom-16 right-0 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-white">Recent Transactions</h4>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                            {transactions.length} Active
                        </span>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {transactions.map((tx) => (
                            <div key={tx.txId} className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-semibold text-slate-200">{tx.type}</span>
                                    <span className="text-[10px] text-indigo-400 animate-pulse">Pending...</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <code className="text-[10px] text-slate-500 truncate w-32">{tx.txId}</code>
                                    <a href={`https://explorer.stacks.co/txid/${tx.txId}?chain=mainnet`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:underline">Explorer</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
