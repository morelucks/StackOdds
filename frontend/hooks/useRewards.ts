'use client';

import { useState, useEffect, useMemo } from 'react';
import { calculateScore, UserActivity, ScoreBreakdown } from '@/lib/rewards';

export const useRewards = (address?: string) => {
    const [activity, setActivity] = useState<UserActivity | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!address) {
            setLoading(false);
            return;
        }

        const fetchActivity = async () => {
            try {
                setLoading(true);
                // In a real app, this would be an API call to our indexer
                // Mocking the delay and data for now
                await new Promise(resolve => setTimeout(resolve, 1000));

                const mockActivity: UserActivity = {
                    contractInteractions: 12,
                    contractVolume: 450,
                    stacksConnectUsage: true,
                    stacksTransactionsUsage: true,
                    githubContributions: 25,
                    githubImpact: 15,
                };

                setActivity(mockActivity);
            } catch (err) {
                setError('Failed to fetch rewards data');
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, [address]);

    const scores = useMemo(() => {
        if (!activity) return null;
        return calculateScore(activity);
    }, [activity]);

    return {
        activity,
        scores,
        loading,
        error,
        refresh: () => { /* Logic to re-fetch */ }
    };
};
