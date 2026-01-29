/**
 * Multiplier Logic for StackOdds Rewards
 * 
 * Provides bonuses for consistent activity and high-tier status.
 */

export interface MultiplierState {
    tierMultiplier: number;
    streakDays: number;
    isGenesisUser: boolean;
    activeEventBoost: number;
}

export const TIERS = {
    BRONZE: 1.0,
    SILVER: 1.1,
    GOLD: 1.25,
    PLATINUM: 1.5,
    DIAMOND: 2.0,
};

export function calculateTotalMultiplier(state: MultiplierState): number {
    let total = state.tierMultiplier;

    // Streak bonus: 1% per day, capped at 20%
    const streakBonus = Math.min(0.2, state.streakDays * 0.01);
    total += streakBonus;

    // Early adopter bonus
    if (state.isGenesisUser) {
        total += 0.15;
    }

    // Limited time event boosts (e.g. hackathons, launches)
    total += state.activeEventBoost;

    return parseFloat(total.toFixed(2));
}

export function applyMultiplier(basePoints: number, state: MultiplierState): number {
    const multiplier = calculateTotalMultiplier(state);
    return Math.floor(basePoints * multiplier);
}

export function getMultiplierBreakdown(state: MultiplierState) {
    return [
        { label: 'Tier Bonus', value: `+${((state.tierMultiplier - 1) * 100).toFixed(0)}%` },
        { label: 'Streak Bonus', value: `+${(Math.min(0.2, state.streakDays * 0.01) * 100).toFixed(0)}%` },
        { label: 'Genesis Bonus', value: state.isGenesisUser ? '+15%' : '0%' },
        { label: 'Event Boost', value: `+${(state.activeEventBoost * 100).toFixed(0)}%` },
    ].filter(b => b.value !== '0%' && b.value !== '+0%');
}
