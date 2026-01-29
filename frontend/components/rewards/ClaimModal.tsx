'use client';

import React from 'react';
import { useVault } from '@/hooks/useVault';
import { Trophy, Gift, ArrowRight, Loader2 } from 'lucide-react';

interface ClaimModalProps {
    claimableAmount: number;
    onClose: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ claimableAmount, onClose }) => {
    const { claimRewards, isClaiming } = useVault();

    const handleClaim = async () => {
        // Registry addresses would typically come from config/env
        await claimRewards('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', 'rewards-registry');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 ring-8 ring-indigo-500/5">
                        <Trophy className="text-indigo-400" size={40} />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">Claim Your Rewards!</h2>
                    <p className="text-slate-400 mb-8">
                        You've earned these rewards based on your recent activity and impact on the Stacks ecosystem.
                    </p>

                    <div className="w-full bg-slate-800/50 rounded-2xl p-6 mb-8 border border-white/5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Available to Claim</span>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <Gift className="text-pink-400" size={24} />
                            <span className="text-4xl font-black text-white">{claimableAmount} STX</span>
                        </div>
                    </div>

                    <div className="w-full space-y-3">
                        <button
                            onClick={handleClaim}
                            disabled={isClaiming || claimableAmount <= 0}
                            className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                        >
                            {isClaiming ? <Loader2 className="animate-spin" /> : 'Confirm Claim'}
                            {!isClaiming && <ArrowRight size={18} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full h-12 text-slate-400 hover:text-white font-medium transition-colors"
                        >
                            Maybe later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
