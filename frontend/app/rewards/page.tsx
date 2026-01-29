'use client';

import React from 'react';
import { Leaderboard } from '@/components/Leaderboard';
import { useRewards } from '@/hooks/useRewards';
import { useStacks } from '@/hooks/useStacks';

export default function RewardsPage() {
    const { address } = useStacks();
    const { scores, loading } = useRewards(address);

    return (
        <main className="min-h-screen bg-[#020617] text-white pt-24 pb-12 px-4">
            <div className="max-w-6xl mx-auto space-y-12">
                <section className="text-center space-y-4">
                    <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        StackOdds Rewards
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Build, contribute, and earn. Our rewards system recognizes the impact of developers in the Stacks ecosystem.
                    </p>
                </section>

                {address && (
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 text-center">
                            <span className="text-sm font-medium text-slate-500 uppercase">My Total Score</span>
                            <p className="text-4xl font-bold mt-2 text-indigo-400">{loading ? '...' : scores?.totalScore || 0}</p>
                        </div>
                        <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 text-center">
                            <span className="text-sm font-medium text-slate-500 uppercase">Current Tier</span>
                            <p className="text-4xl font-bold mt-2 text-purple-400">{loading ? '...' : (scores?.totalScore ? (scores.totalScore >= 750 ? 'Platinum' : 'Gold') : 'Bronze')}</p>
                        </div>
                        <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 text-center">
                            <span className="text-sm font-medium text-slate-500 uppercase">Next Reward</span>
                            <p className="text-4xl font-bold mt-2 text-pink-400">Feb 2</p>
                        </div>
                    </section>
                )}

                <Leaderboard />

                <section className="text-center p-8 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
                    <h3 className="text-2xl font-bold mb-2">Want to boost your score?</h3>
                    <p className="text-slate-400 mb-6">Read our rewards documentation to learn about the scoring criteria and how to maximize your impact.</p>
                    <a href="/REWARDS.md" className="inline-flex h-12 items-center justify-center rounded-xl bg-indigo-600 px-8 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                        View Documentation
                    </a>
                </section>
            </div>
        </main>
    );
}
