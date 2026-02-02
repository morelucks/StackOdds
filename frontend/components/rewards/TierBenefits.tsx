'use client';

import React from 'react';

const TIER_DETAILS = [
    {
        tier: 'Bronze',
        benefits: ['Basic leaderboard access', 'Weekly reward notifications'],
        multiplier: '1x'
    },
    {
        tier: 'Silver',
        benefits: ['1.2x points multiplier', 'Priority support', 'Silver badge', 'Weekly beta access'],
        multiplier: '1.2x'
    },
    {
        tier: 'Gold',
        benefits: ['1.5x points multiplier', 'Early access to new pools', 'Gold badge', 'Governance voting'],
        multiplier: '1.5x'
    },
    {
        tier: 'Platinum',
        benefits: ['2x points multiplier', 'Exclusive Discord role', 'Governance voting rights', 'No withdrawal fees'],
        multiplier: '2x'
    },
    {
        tier: 'Diamond',
        benefits: ['3x points multiplier', 'Direct team access', 'Diamond NFT membership', 'Unlimited API access'],
        multiplier: '3x'
    }
];

export const TierBenefits: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {TIER_DETAILS.map((detail) => (
                <div
                    key={detail.tier}
                    className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-colors group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <h4 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {detail.tier}
                        </h4>
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded-full border border-indigo-500/20">
                            {detail.multiplier} Multiplier
                        </span>
                    </div>
                    <ul className="space-y-2">
                        {detail.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center text-sm text-slate-400">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 opacity-50" />
                                {benefit}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};
