'use client';

import React, { useState } from 'react';

export const RewardCalculator: React.FC = () => {
    const [volume, setVolume] = useState<number>(1000);
    const [referrals, setReferrals] = useState<number>(5);
    const [tier, setTier] = useState<string>('Silver');

    const multipliers: Record<string, number> = {
        'Bronze': 1,
        'Silver': 1.2,
        'Gold': 1.5,
        'Platinum': 2,
        'Diamond': 3
    };

    const estimate = Math.floor((volume * 0.1 + referrals * 100) * multipliers[tier]);

    return (
        <div className="p-8 bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-3xl backdrop-blur-md">
            <h3 className="text-2xl font-bold text-white mb-6">Earnings Estimator</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Monthly Volume (${volume})</label>
                        <input
                            type="range" min="100" max="10000" step="100"
                            value={volume} onChange={(e) => setVolume(Number(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Referrals ({referrals})</label>
                        <input
                            type="range" min="0" max="50" step="1"
                            value={referrals} onChange={(e) => setReferrals(Number(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase mb-2">Tier Multiplier</label>
                        <select
                            value={tier} onChange={(e) => setTier(e.target.value)}
                            className="w-full bg-slate-800 border-none text-white rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                            {Object.keys(multipliers).map(t => (
                                <option key={t} value={t}>{t} ({multipliers[t]}x)</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center">
                    <span className="text-slate-500 text-xs font-bold uppercase mb-2">Estimated Rewards</span>
                    <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                        {estimate.toLocaleString()}
                    </div>
                    <span className="text-indigo-400 text-sm font-semibold mt-2">Pts / Month</span>
                    <p className="text-[10px] text-slate-600 mt-4 max-w-[160px]">
                        * Estimates based on current network activity and multiplier rules.
                    </p>
                </div>
            </div>
        </div>
    );
};
