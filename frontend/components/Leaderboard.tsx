'use client';

import React from 'react';
import { getRewardTier } from '@/lib/rewards';

interface LeaderboardEntry {
    rank: number;
    address: string;
    score: number;
}

const MOCK_DATA: LeaderboardEntry[] = [
    { rank: 1, address: 'SP3..X4Y', score: 950 },
    { rank: 2, address: 'SP2..W5Z', score: 820 },
    { rank: 3, address: 'SP1..V6A', score: 710 },
    { rank: 4, address: 'SP4..U7B', score: 450 },
    { rank: 5, address: 'SP5..T8C', score: 320 },
];

export const Leaderboard: React.FC = () => {
    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                Top Contributors
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800">
                            <th className="py-4 px-4 text-slate-400 font-medium">Rank</th>
                            <th className="py-4 px-4 text-slate-400 font-medium">Contributor</th>
                            <th className="py-4 px-4 text-slate-400 font-medium text-right">Score</th>
                            <th className="py-4 px-4 text-slate-400 font-medium text-right">Tier</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_DATA.map((user) => (
                            <tr key={user.rank} className="group hover:bg-slate-800/30 transition-colors border-b border-slate-800/30">
                                <td className="py-4 px-4 font-mono text-xl text-purple-400">#{user.rank}</td>
                                <td className="py-4 px-4 text-slate-200">{user.address}</td>
                                <td className="py-4 px-4 text-right font-bold text-slate-100">{user.score}</td>
                                <td className="py-4 px-4 text-right">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.score >= 900 ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30' :
                                            user.score >= 750 ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30' :
                                                user.score >= 500 ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30' :
                                                    'bg-slate-500/20 text-slate-300 ring-1 ring-slate-500/30'
                                        }`}>
                                        {getRewardTier(user.score)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
