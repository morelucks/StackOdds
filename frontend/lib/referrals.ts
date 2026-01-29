/**
 * Referral Points Logic for StackOdds Rewards
 * 
 * Manages referral linking and multi-level rewards for community growth.
 */

export interface ReferralData {
    referrer: string;
    referredUsers: string[];
    totalReferralPoints: number;
}

const POINTS_PER_REFERRAL = 100;
const COMMISSION_RATE = 0.05; // 5% of referred user's earned points

export function generateReferralLink(address: string): string {
    if (!address) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://stackodds.com';
    return `${baseUrl}/rewards?ref=${address}`;
}

export function parseReferrerFromUrl(url: string): string | null {
    try {
        const params = new URL(url).searchParams;
        return params.get('ref');
    } catch {
        return null;
    }
}

export function calculateReferralBonus(referralData: ReferralData, referredUserScore: number): number {
    // Direct points for the referral itself
    const directPoints = referralData.referredUsers.length * POINTS_PER_REFERRAL;

    // Ongoing commission from the referred user's activity
    const commissionPoints = referredUserScore * COMMISSION_RATE;

    return Math.floor(directPoints + commissionPoints);
}

export function getReferralStats(data: ReferralData) {
    return {
        count: data.referredUsers.length,
        earnings: data.totalReferralPoints,
        nextMilestone: (Math.floor(data.referredUsers.length / 5) + 1) * 5,
        potentialCommission: data.referredUsers.length * 50, // rough estimate
    };
}

export const validateReferralCode = (code: string): boolean => {
    // Simple check for Stacks address format
    return code.startsWith('SP') || code.startsWith('ST');
};
