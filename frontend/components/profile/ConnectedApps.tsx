'use client';

import React from 'react';

interface AppConnection {
    id: string;
    name: string;
    description: string;
    status: 'connected' | 'disconnected';
    icon: string;
}

const CONNECTIONS: AppConnection[] = [
    {
        id: 'github',
        name: 'GitHub',
        description: 'Connect your GitHub account to reward open source contributions.',
        status: 'disconnected',
        icon: '🔗'
    },
    {
        id: 'stacks',
        name: 'Stacks Wallet',
        description: 'Primary wallet for receiving rewards and deploying contracts.',
        status: 'connected',
        icon: '💰'
    },
    {
        id: 'discord',
        name: 'Discord',
        description: 'Join our community to earn roles and exclusive access.',
        status: 'disconnected',
        icon: '💬'
    }
];

export const ConnectedApps: React.FC = () => {
    return (
        <div className="mt-10 max-w-2xl mx-auto space-y-6">
            <div className="flex flex-col gap-1">
                <h3 className="text-2xl font-bold text-white">Connected Applications</h3>
                <p className="text-slate-400 text-sm">Manage your external account links for reward eligibility.</p>
            </div>

            <div className="grid gap-4">
                {CONNECTIONS.map((app) => (
                    <div
                        key={app.id}
                        className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-slate-700 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-2xl">
                                {app.icon}
                            </div>
                            <div>
                                <h4 className="font-bold text-white">{app.name}</h4>
                                <p className="text-xs text-slate-500 max-w-[280px]">{app.description}</p>
                            </div>
                        </div>

                        <div>
                            {app.status === 'connected' ? (
                                <button className="px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold hover:bg-rose-500/20 transition-colors">
                                    Disconnect
                                </button>
                            ) : (
                                <button className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold hover:bg-indigo-600 transition-colors">
                                    Connect
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
