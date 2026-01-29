/**
 * Rewards Calculation Logic for StackOdds
 * 
 * Rewards are based on leaderboard position, determined by:
 * - Activity and impact of smart contracts deployed on Stacks
 * - Use of @stacks/connect and @stacks/transactions
 * - GitHub contributions to public repositories
 */

export interface UserActivity {
    contractInteractions: number;
    contractVolume: number; // in STX
    stacksConnectUsage: boolean;
    stacksTransactionsUsage: boolean;
    githubContributions: number;
    githubImpact: number; // stars/forks of repos contributed to
}

export interface ScoreBreakdown {
    contractScore: number;
    integrationScore: number;
    communityScore: number;
    totalScore: number;
}

export const calculateScore = (activity: UserActivity): ScoreBreakdown => {
    // 1. Smart Contract Activity (40% Weight)
    // Base points for interactions + volume multiplier
    const contractScore = Math.min(
        400,
        (activity.contractInteractions * 10) + (activity.contractVolume * 0.5)
    );

    // 2. Integration Depth (30% Weight)
    // Binary rewards for using core libraries
    let integrationScore = 0;
    if (activity.stacksConnectUsage) integrationScore += 150;
    if (activity.stacksTransactionsUsage) integrationScore += 150;

    // 3. Community & Open Source (30% Weight)
    // Contribution count weighted by repo impact
    const communityScore = Math.min(
        300,
        (activity.githubContributions * 20) + (activity.githubImpact * 5)
    );

    return {
        contractScore: Math.round(contractScore),
        integrationScore: Math.round(integrationScore),
        communityScore: Math.round(communityScore),
        totalScore: Math.round(contractScore + integrationScore + communityScore),
    };
};

export const getRewardTier = (score: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' => {
    if (score >= 900) return 'Diamond';
    if (score >= 750) return 'Platinum';
    if (score >= 500) return 'Gold';
    if (score >= 250) return 'Silver';
    return 'Bronze';
};
