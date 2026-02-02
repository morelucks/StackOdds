'use client';

import React from 'react';

interface ReferralRecord {
    id: string;
    address: string;
    date: string;
    pointsEarned: number;
    status: 'Completed' | 'Pending';
}

const MOCK_REFERRALS: ReferralRecord[] = [
    { id: '1', address: 'SP2J...X839', date: '2024-05-15', pointsEarned: 100, status: 'Completed' },
    { id: '2', address: 'SP3A...K921', date: '2024-05-18', pointsEarned: 100, status: 'Completed' },
    { id: '3', address: 'SP1P...M482', date: '2024-05-20', pointsEarned: 0, status: 'Pending' },
    { id: '4', address: 'SPZM...Q774', date: '2024-05-22', pointsEarned: 100, status: 'Completed' },
];

export const ReferralHistory: React.FC = () => {
    return (
        <div className="mt-12 p-8 bg-slate-900/60 rounded-3xl border border-slate-800 backdrop-blur-md">
            <h3 className="text-2xl font-bold text-white mb-6">Referral History</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="pb-4 font-semibold">User Address</th>
                            <th className="pb-4 font-semibold">Join Date</th>
                            <th className="pb-4 font-semibold">Points</th>
                            <th className="pb-4 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {MOCK_REFERRALS.map((ref) => (
                            <tr key={ref.id} className="group hover:bg-slate-800/20 transition-colors">
                                <td className="py-4 text-slate-300 font-mono text-sm">{ref.address}</td>
                                <td className="py-4 text-slate-400 text-sm">{ref.date}</td>
                                <td className="py-4 text-indigo-400 font-bold">{ref.pointsEarned} pts</td>
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${ref.status === 'Completed'
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        }`}>
                                        {ref.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {MOCK_REFERRALS.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-slate-500 italic">No referrals found. Start sharing your link!</p>
                </div>
            )}
        </div>
    );
};
