'use client';

import React, { useState, useEffect } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        // Mock occasional notification for preview
        const interval = setInterval(() => {
            if (Math.random() > 0.9) {
                const id = Math.random().toString(36).substring(2, 9);
                const types: Toast['type'][] = ['success', 'info', 'error'];
                const messages = ['Points earned!', 'New market live', 'Transaction failed'];
                const idx = Math.floor(Math.random() * 3);

                setToasts(prev => [...prev, { id, message: messages[idx], type: types[idx] }]);
                setTimeout(() => {
                    setToasts(prev => prev.filter(t => t.id !== id));
                }, 4000);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const getColors = (type: Toast['type']) => {
        switch (type) {
            case 'success': return 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400';
            case 'error': return 'bg-rose-500/10 border-rose-500/50 text-rose-400';
            default: return 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400';
        }
    };

    return (
        <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`min-w-[280px] p-4 rounded-xl border backdrop-blur-md shadow-lg flex items-center justify-between pointer-events-auto transition-all ${getColors(toast.type)}`}
                >
                    <div className="flex items-center gap-3">
                        <p className="text-sm font-bold">{toast.message}</p>
                    </div>
                    <button
                        onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                        className="opacity-50 hover:opacity-100 transition-opacity"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
};
