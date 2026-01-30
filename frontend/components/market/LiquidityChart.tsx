'use client';

import React from 'react';

interface LiquidityPoint {
    time: string;
    amount: number;
}

const MOCK_DATA: LiquidityPoint[] = [
    { time: '09:00', amount: 4500 },
    { time: '10:00', amount: 7200 },
    { time: '11:00', amount: 6800 },
    { time: '12:00', amount: 9500 },
    { time: '13:00', amount: 12400 },
    { time: '14:00', amount: 15800 },
    { time: '15:00', amount: 14200 },
];

export const LiquidityChart: React.FC = () => {
    const maxAmount = Math.max(...MOCK_DATA.map(d => d.amount));

    return (
        <div className="p-6 bg-slate-900/60 rounded-3xl border border-slate-800">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-lg font-bold text-white">Market Liquidity</h3>
                    <p className="text-xs text-slate-500">Last 24 hours trend (USDCx)</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-indigo-400">15.8k</span>
                    <span className="ml-2 text-xs text-emerald-500">↑ 12%</span>
                </div>
            </div>

            <div className="flex items-end justify-between h-40 gap-2">
                {MOCK_DATA.map((point, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center group">
                        <div
                            className="w-full bg-indigo-600/20 group-hover:bg-indigo-600/40 rounded-t-lg transition-all duration-300 relative"
                            style={{ height: `${(point.amount / maxAmount) * 100}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                                ${point.amount}
                            </div>
                        </div>
                        <span className="mt-3 text-[10px] text-slate-600 font-medium">{point.time}</span>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800/50 flex justify-around text-center">
                <div>
                    <p className="text-[10px] text-slate-500 uppercase">Min</p>
                    <p className="text-sm font-semibold text-slate-300">4.5k</p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 uppercase">Avg</p>
                    <p className="text-sm font-semibold text-slate-300">9.2k</p>
                </div>
                <div>
                    <p className="text-[10px] text-slate-500 uppercase">Max</p>
                    <p className="text-sm font-semibold text-slate-300">15.8k</p>
                </div>
            </div>
        </div>
    );
};
