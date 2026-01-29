'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRewards } from '@/hooks/useRewards';
import { useStacks } from '@/hooks/useStacks';

interface RewardsContextType {
    lastNotification: string | null;
    dismissNotification: () => void;
    showRewardAlert: (message: string) => void;
    isNewAchievement: boolean;
}

const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

export const RewardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { address } = useStacks();
    const { scores } = useRewards(address);
    const [lastNotification, setLastNotification] = useState<string | null>(null);
    const [isNewAchievement, setIsNewAchievement] = useState(false);

    useEffect(() => {
        if (scores && scores.totalScore > 0) {
            // Logic to trigger notifications based on score milestones
            if (scores.totalScore >= 500 && !localStorage.getItem('notif_gold')) {
                setLastNotification('Congratulations! You have reached the Gold Tier!');
                setIsNewAchievement(true);
                localStorage.setItem('notif_gold', 'true');
            }
        }
    }, [scores]);

    const dismissNotification = () => {
        setLastNotification(null);
        setIsNewAchievement(false);
    };

    const showRewardAlert = (message: string) => {
        setLastNotification(message);
        setIsNewAchievement(true);
    };

    return (
        <RewardsContext.Provider value={{
            lastNotification,
            dismissNotification,
            showRewardAlert,
            isNewAchievement
        }}>
            {children}
            {lastNotification && (
                <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-10 duration-500">
                    <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">!</div>
                        <p className="font-medium">{lastNotification}</p>
                        <button onClick={dismissNotification} className="text-white/60 hover:text-white">✕</button>
                    </div>
                </div>
            )}
        </RewardsContext.Provider>
    );
};

export const useRewardsContext = () => {
    const context = useContext(RewardsContext);
    if (!context) throw new Error('useRewardsContext must be used within a RewardsProvider');
    return context;
};
