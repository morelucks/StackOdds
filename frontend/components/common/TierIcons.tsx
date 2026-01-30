'use client';

import React from 'react';

const icons = {
    Bronze: (
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-orange-600 transition-transform hover:scale-110">
            <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="0.5" className="animate-pulse" />
        </svg>
    ),
    Silver: (
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-slate-300 transition-transform hover:scale-110">
            <path fill="currentColor" d="M12 1L8 5h8l-4-4zM5 8l-4 4 4 4 4-4-4-4zm14 0l-4 4 4 4 4-4-4-4zM12 19l4-4H8l4 4z" />
            <rect x="10" y="10" width="4" height="4" fill="white" className="animate-spin-slow origin-center" />
        </svg>
    ),
    Gold: (
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-yellow-500 transition-transform hover:rotate-12">
            <path fill="currentColor" d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.46 1.48 1.63 2.62 3.11 2.94V18H7v2h10v-2h-3.5v-2.06c1.48-.32 2.65-1.46 3.11-2.94C19.08 10.63 21 8.55 21 6V5c0-1.1-.9-2-2-2zM5 7h2v3c-1.1 0-2-.9-2-2V7zm14 3c0 1.1-.9 2-2 2V7h2v3z" />
        </svg>
    ),
    Platinum: (
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-indigo-300">
            <path fill="currentColor" d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
            <path fill="white" d="M12 2v16l6.79 3 .71-.71L12 2z" opacity="0.3" className="animate-pulse" />
        </svg>
    ),
    Diamond: (
        <svg viewBox="0 0 24 24" className="w-12 h-12 text-cyan-400">
            <path fill="currentColor" d="M12 2L2 12l10 10 10-10L12 2zm0 4l6 6-6 6-6-6 6-6z" />
            <circle cx="12" cy="12" r="3" fill="white" className="animate-ping" />
        </svg>
    )
};

export const TierIcons: React.FC<{ tier: keyof typeof icons }> = ({ tier }) => {
    return (
        <div className="flex items-center justify-center p-4 bg-slate-800/30 rounded-full border border-slate-700/50 shadow-inner">
            {icons[tier]}
        </div>
    );
};
