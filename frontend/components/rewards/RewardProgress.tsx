'use client';

import React from 'react';

interface RewardProgressProps {
    currentScore: number;
}

const TIERS = [
    { name: 'Bronze', threshold: 0 },
    { name: 'Silver', threshold: 250 },
    { name: 'Gold', threshold: 500 },
    { name: 'Platinum', threshold: 750 },
    { name: 'Diamond', threshold: 900 },
];

export const RewardProgress: React.FC<RewardProgressProps> = ({ currentScore }) => {
    const currentTierIndex = TIERS.findIndex((t, i) =>
        currentScore >= t.threshold && (i === TIERS.length - 1 || currentScore < TIERS[i + 1].threshold)
    );

    const nextTier = TIERS[currentTierIndex + 1];
    const progress = nextTier
        ? ((currentScore - TIERS[currentTierIndex].threshold) / (nextTier.threshold - TIERS[currentTierIndex].threshold)) * 100
        : 100;

    return (
        <div className="p-8 bg-slate-900/60 rounded-3xl border border-slate-800 backdrop-blur-md">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">Current Status</span>
                    <h3 className="text-3xl font-bold text-white mt-1">{TIERS[currentTierIndex].name} Tier</h3>
                </div>
                {nextTier && (
                    <div className="text-right">
                        <span className="text-slate-500 text-xs font-medium uppercase">Next: {nextTier.name}</span>
                        <p className="text-slate-300 font-mono">{nextTier.threshold - currentScore} pts to go</p>
                    </div>
                )}
            </div>

            <div className="relative h-4 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                    style={{ width: `${Math.min(100, progress)}%` }}
                />
            </div>

            <div className="flex justify-between mt-4">
                {TIERS.map((tier) => (
                    <div key={tier.name} className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mb-2 ${currentScore >= tier.threshold ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                        <span className={`text-[10px] font-bold uppercase ${currentScore >= tier.threshold ? 'text-indigo-400' : 'text-slate-600'}`}>
                            {tier.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
