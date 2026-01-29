'use client';

import React from 'react';
import { Terminal, Github, Cpu, ArrowUpRight } from 'lucide-react';

interface ActivityItem {
    id: string;
    type: 'contract' | 'github' | 'integration';
    description: string;
    points: number;
    date: string;
}

const MOCK_HISTORY: ActivityItem[] = [
    { id: '1', type: 'contract', description: 'Smart contract deployment: TokenExchange', points: 150, date: '2 hours ago' },
    { id: '2', type: 'github', description: 'PR merged: stacks-network/connect', points: 50, date: 'Yesterday' },
    { id: '3', type: 'integration', description: 'Integrated @stacks/transactions', points: 100, date: '3 days ago' },
    { id: '4', type: 'github', description: 'Added documentation to stacks-wallet', points: 30, date: 'Jan 25, 2026' },
];

export const ActivityHistory: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Activity History</h3>
                <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                    View all <ArrowUpRight size={14} />
                </button>
            </div>

            <div className="grid gap-4">
                {MOCK_HISTORY.map((item) => (
                    <div key={item.id} className="group p-5 bg-slate-900/40 rounded-2xl border border-slate-800/50 hover:border-slate-700/50 transition-all flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${item.type === 'contract' ? 'bg-orange-500/10 text-orange-400' :
                                item.type === 'github' ? 'bg-slate-700/20 text-slate-300' :
                                    'bg-blue-500/10 text-blue-400'
                            }`}>
                            {item.type === 'contract' && <Cpu size={20} />}
                            {item.type === 'github' && <Github size={20} />}
                            {item.type === 'integration' && <Terminal size={20} />}
                        </div>

                        <div className="flex-1">
                            <p className="font-medium text-slate-200">{item.description}</p>
                            <p className="text-sm text-slate-500">{item.date}</p>
                        </div>

                        <div className="text-right">
                            <p className="text-lg font-bold text-emerald-400">+{item.points}</p>
                            <p className="text-[10px] font-bold text-slate-600 uppercase">Points</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
