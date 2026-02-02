'use client';

import React, { useState } from 'react';
import { Github, Settings2, Bell, ShieldCheck, Save, Loader2 } from 'lucide-react';

export const RewardSettings: React.FC = () => {
    const [handle, setHandle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [notifications, setNotifications] = useState(true);

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API call to update registry
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSaving(false);
        alert('Settings saved successfully!');
    };

    return (
        <div className="max-w-2xl mx-auto bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-8">
                <Settings2 className="text-indigo-400" size={24} />
                <h2 className="text-2xl font-bold text-white">Reward Preferences</h2>
            </div>

            <div className="space-y-8">
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-400 uppercase tracking-widest">
                        <Github size={16} /> GitHub Identity
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            placeholder="e.g. stacks-dev"
                            className="w-full h-12 bg-slate-950/50 border border-slate-700 rounded-xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                        <p className="mt-2 text-xs text-slate-500">Linking your GitHub allows us to track your open-source contributions to the Stacks ecosystem.</p>
                    </div>
                </div>

                <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Bell size={20} className="text-slate-400" />
                        <div>
                            <p className="text-sm font-medium text-slate-200">Achievement Notifications</p>
                            <p className="text-xs text-slate-500">Get alerts when you reach a new reward tier.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setNotifications(!notifications)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications ? 'bg-indigo-600' : 'bg-slate-700'}`}
                    >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500">
                        <ShieldCheck size={16} />
                        <span className="text-xs">Your data is stored securely on the Stacks blockchain.</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-11 bg-indigo-600 hover:bg-indigo-500 text-white px-6 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
