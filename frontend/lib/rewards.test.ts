import { describe, it, expect } from 'vitest';
import { calculateScore, getRewardTier, UserActivity } from './rewards';

describe('Rewards Scoring Logic', () => {
    it('calculates perfect score correctly', () => {
        const activity: UserActivity = {
            contractInteractions: 100, // 400 points max
            contractVolume: 1000,
            stacksConnectUsage: true, // 150 points
            stacksTransactionsUsage: true, // 150 points
            githubContributions: 50, // 300 points max
            githubImpact: 100,
        };

        const scores = calculateScore(activity);
        expect(scores.totalScore).toBe(1000);
        expect(getRewardTier(scores.totalScore)).toBe('Diamond');
    });

    it('calculates bronze score for minimal activity', () => {
        const activity: UserActivity = {
            contractInteractions: 1,
            contractVolume: 10,
            stacksConnectUsage: false,
            stacksTransactionsUsage: false,
            githubContributions: 1,
            githubImpact: 0,
        };

        const scores = calculateScore(activity);
        expect(scores.totalScore).toBeLessThan(100);
        expect(getRewardTier(scores.totalScore)).toBe('Bronze');
    });

    it('awards points for integrations correctly', () => {
        const noIntegration: UserActivity = {
            contractInteractions: 0, contractVolume: 0, stacksConnectUsage: false,
            stacksTransactionsUsage: false, githubContributions: 0, githubImpact: 0
        };
        const withConnect: UserActivity = { ...noIntegration, stacksConnectUsage: true };
        const withBoth: UserActivity = { ...noIntegration, stacksConnectUsage: true, stacksTransactionsUsage: true };

        expect(calculateScore(noIntegration).integrationScore).toBe(0);
        expect(calculateScore(withConnect).integrationScore).toBe(150);
        expect(calculateScore(withBoth).integrationScore).toBe(300);
    });

    it('caps scores at their respective maximums', () => {
        const massiveActivity: UserActivity = {
            contractInteractions: 9999,
            contractVolume: 99999,
            stacksConnectUsage: true,
            stacksTransactionsUsage: true,
            githubContributions: 9999,
            githubImpact: 9999,
        };

        const scores = calculateScore(massiveActivity);
        expect(scores.contractScore).toBe(400);
        expect(scores.communityScore).toBe(300);
        expect(scores.totalScore).toBe(1000);
    });
});
