/**
 * GitHub API Utility for StackOdds Rewards
 * 
 * Fetches and calculates contribution metrics from public repositories.
 */

export interface GitHubStats {
    contributions: number;
    starsEarned: number;
    forksEarned: number;
    topRepo: string;
}

const GITHUB_API_BASE = 'https://api.github.com';

export async function fetchGitHubStats(username: string): Promise<GitHubStats> {
    // In a production environment, this would involve OAuth and rate-limit handling
    try {
        const reposResponse = await fetch(`${GITHUB_API_BASE}/users/${username}/repos?sort=updated&per_page=100`);
        if (!reposResponse.ok) throw new Error('GitHub user not found');

        const repos = await reposResponse.json();

        let totalStars = 0;
        let totalForks = 0;
        let topRepo = '';
        let maxStars = -1;

        repos.forEach((repo: any) => {
            totalStars += repo.stargazers_count;
            totalForks += repo.forks_count;
            if (repo.stargazers_count > maxStars) {
                maxStars = repo.stargazers_count;
                topRepo = repo.name;
            }
        });

        // Mock contribution count as it requires a different API/scraping
        const contributions = Math.floor(Math.random() * 500) + 50;

        return {
            contributions,
            starsEarned: totalStars,
            forksEarned: totalForks,
            topRepo
        };
    } catch (error) {
        console.error('Error fetching GitHub stats:', error);
        return {
            contributions: 0,
            starsEarned: 0,
            forksEarned: 0,
            topRepo: 'N/A'
        };
    }
}

export function calculateGitHubImpact(stats: GitHubStats): number {
    const contributionWeight = 2;
    const starWeight = 5;
    const forkWeight = 10;

    return (stats.contributions * contributionWeight) +
        (stats.starsEarned * starWeight) +
        (stats.forksEarned * forkWeight);
}
