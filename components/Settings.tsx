'use client';

import React, { useState } from 'react';
import { useLearningStore } from '@/lib/store';
import { Settings, Sliders, LogOut, Check, Sparkles } from 'lucide-react';

export default function SettingsView() {
  const {
    theme,
    user,
    setUser,
    dailyHoursGoal,
    setDailyHoursGoal,
    resetAll
  } = useLearningStore();

  const [tempName, setTempName] = useState(user.name);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const isDark = theme === 'dark';

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setUser(tempName.trim());
      setShowSavedToast(true);
      setTimeout(() => {
        setShowSavedToast(false);
      }, 3000);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto h-screen scrollbar-thin">
      
      {/* Title */}
      <div>
        <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
          System Settings & Customization
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Tailor default goal tracking indices, modify profile names, and audit system stores.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <form
          onSubmit={handleSaveSettings}
          className={`rounded-2xl border p-6 shadow-sm space-y-5 relative transition-all duration-300 ${
            isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="text-center mb-6">
            <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center border mb-3 ${
              isDark ? 'bg-violet-500/10 border-violet-500/25 text-violet-400' : 'bg-sky-500/10 border-sky-300 text-sky-600'
            }`}>
              <Settings size={24} />
            </div>
            <h3 className="text-lg font-extrabold tracking-tight">Customizations</h3>
            <p className="text-xs text-slate-400 mt-1">Configure user configurations & goals.</p>
          </div>

          {/* Student name */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Student Profile Name
            </label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none ${
                isDark
                  ? 'bg-violet-950/20 border-violet-500/35 text-white focus:border-violet-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500'
              }`}
            />
          </div>

          {/* Daily Goal hours slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Daily Studying Goal Capacity
              </label>
              <span className={`text-xs font-black ${isDark ? 'text-violet-400' : 'text-sky-600'}`}>
                {dailyHoursGoal} hours/day
              </span>
            </div>

            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.5"
              value={dailyHoursGoal}
              onChange={(e) => setDailyHoursGoal(parseFloat(e.target.value))}
              className={`w-full accent-violet-500 h-1 rounded-lg cursor-pointer ${
                isDark ? 'bg-violet-950/30' : 'bg-slate-200'
              }`}
            />
          </div>

          {showSavedToast && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-fade-in">
              <Check size={14} /> Profile settings updated successfully!
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-97 ${
              isDark ? 'bg-violet-600 hover:bg-violet-500' : 'bg-sky-500 hover:bg-sky-600'
            }`}
          >
            Save Configuration <Sparkles size={12} />
          </button>
        </form>
      </div>

    </div>
  );
}
