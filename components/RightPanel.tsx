'use client';

import React, { useState } from 'react';
import { useLearningStore, StudySession } from '@/lib/store';
import { Play, Check, Plus, Trash2, Calendar, Clock, Edit2, ChevronRight, BookOpen } from 'lucide-react';

interface RightPanelProps {
  onStartFocus: () => void;
}

export default function RightPanel({ onStartFocus }: RightPanelProps) {
  const {
    theme,
    upcomingSession,
    setUpcomingSession,
    todayPlan,
    togglePlanItem,
    addPlanItem,
    deletePlanItem,
    hoursLoggedToday,
    dailyHoursGoal,
    logHoursToday,
    roadmaps,
    activeRoadmapId
  } = useLearningStore();

  const [isEditingSession, setIsEditingSession] = useState(false);
  const [sessionTopic, setSessionTopic] = useState(upcomingSession.topic);
  const [sessionTime, setSessionTime] = useState(upcomingSession.time);
  const [sessionDuration, setSessionDuration] = useState(upcomingSession.durationMin.toString());

  const [newItemText, setNewItemText] = useState('');

  const isDark = theme === 'dark';

  // Calculate daily goal percentage
  const goalPercent = Math.min(100, Math.round((hoursLoggedToday / dailyHoursGoal) * 100)) || 0;

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionTopic.trim() && sessionTime.trim()) {
      setUpcomingSession({
        topic: sessionTopic.trim(),
        time: sessionTime.trim(),
        durationMin: parseInt(sessionDuration, 10) || 25
      });
      setIsEditingSession(false);
    }
  };

  const handleAddPlanItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItemText.trim()) {
      addPlanItem(newItemText.trim());
      setNewItemText('');
    }
  };

  // Find active roadmap info for display
  const activeRoadmap = roadmaps.find((r) => r.id === activeRoadmapId);

  return (
    <div className="w-80 shrink-0 flex flex-col gap-6 p-6 overflow-y-auto h-screen border-l scrollbar-none transition-all duration-300">
      
      {/* 1. Upcoming Study Session Tracker */}
      <div
        className={`rounded-2xl border p-4 shadow-sm relative transition-all duration-300 ${
          isDark
            ? 'bg-[#121631]/60 border-violet-500/10 text-white'
            : 'bg-white border-slate-200 text-slate-800 shadow-sky-100/40'
        }`}
      >
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar size={13} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> Upcoming Session
          </h4>
          <button
            onClick={() => setIsEditingSession(true)}
            className={`p-1 rounded-md transition-colors hover:bg-slate-500/10 ${
              isDark ? 'text-violet-400 hover:text-violet-300' : 'text-slate-400 hover:text-sky-600'
            }`}
          >
            <Edit2 size={13} />
          </button>
        </div>

        {isEditingSession ? (
          <form onSubmit={handleSaveSession} className="space-y-3 mt-2 animate-fade-in text-xs">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Session Topic</label>
              <input
                type="text"
                value={sessionTopic}
                onChange={(e) => setSessionTopic(e.target.value)}
                className={`w-full p-2 rounded-lg border outline-none ${
                  isDark
                    ? 'bg-violet-950/20 border-violet-500/30 text-white focus:border-violet-500'
                    : 'bg-slate-50 border-slate-200 focus:border-sky-500'
                }`}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Time</label>
                <input
                  type="text"
                  value={sessionTime}
                  onChange={(e) => setSessionTime(e.target.value)}
                  className={`w-full p-2 rounded-lg border outline-none ${
                    isDark
                      ? 'bg-violet-950/20 border-violet-500/30 text-white focus:border-violet-500'
                      : 'bg-slate-50 border-slate-200 focus:border-sky-500'
                  }`}
                  placeholder="07:00 PM"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Min</label>
                <input
                  type="number"
                  value={sessionDuration}
                  onChange={(e) => setSessionDuration(e.target.value)}
                  className={`w-full p-2 rounded-lg border outline-none ${
                    isDark
                      ? 'bg-violet-950/20 border-violet-500/30 text-white focus:border-violet-500'
                      : 'bg-slate-50 border-slate-200 focus:border-sky-500'
                  }`}
                />
              </div>
            </div>
            <div className="flex gap-1.5 justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsEditingSession(false)}
                className={`px-2 py-1 rounded-md border font-semibold ${
                  isDark ? 'border-violet-500/20 text-violet-300' : 'border-slate-200 text-slate-600'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-2.5 py-1 rounded-md text-white font-semibold ${
                  isDark ? 'bg-violet-600 hover:bg-violet-500' : 'bg-sky-500 hover:bg-sky-600'
                }`}
              >
                Save
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div>
              <p className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-violet-300' : 'text-slate-800'}`}>
                {upcomingSession.time}
              </p>
              <p className={`text-xs mt-1 font-bold flex items-center gap-1 ${isDark ? 'text-violet-400' : 'text-sky-600'}`}>
                <BookOpen size={11} /> {upcomingSession.topic}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Clock size={11} /> Estimated time: {upcomingSession.durationMin} min
              </p>
            </div>

            <button
              onClick={onStartFocus}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs text-white transition-all duration-300 hover:scale-[1.03] active:scale-97 shadow-md ${
                isDark
                  ? 'bg-violet-600 hover:bg-violet-500 shadow-violet-950/40'
                  : 'bg-sky-500 hover:bg-sky-600 shadow-sky-200'
              }`}
            >
              <Play size={12} fill="white" /> Start Session
            </button>
          </div>
        )}
      </div>

      {/* 2. Today's Checklist Plan */}
      <div
        className={`rounded-2xl border p-4 shadow-sm flex-1 flex flex-col min-h-[220px] justify-between relative transition-all duration-300 ${
          isDark
            ? 'bg-[#121631]/60 border-violet-500/10 text-white'
            : 'bg-white border-slate-200 text-slate-800 shadow-sky-100/40'
        }`}
      >
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
            <Check size={13} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> Today&apos;s Plan
          </h4>

          {/* Checklist Items */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
            {todayPlan.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4 italic">No items planned for today.</p>
            ) : (
              todayPlan.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2 rounded-xl border group transition-all ${
                    isDark
                      ? 'border-violet-500/5 bg-violet-950/5 hover:bg-violet-900/10'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <button
                    onClick={() => togglePlanItem(item.id)}
                    className="flex items-center gap-2.5 text-left flex-1"
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center transition-all border ${
                        item.completed
                          ? isDark
                            ? 'bg-violet-600 border-violet-500'
                            : 'bg-sky-500 border-sky-400'
                          : isDark
                          ? 'border-violet-500/30 bg-transparent'
                          : 'border-slate-300 bg-transparent'
                      }`}
                    >
                      {item.completed && <Check size={10} className="text-white stroke-[3px]" />}
                    </div>
                    <span
                      className={`text-xs font-semibold select-none transition-all truncate max-w-[170px] ${
                        item.completed
                          ? 'line-through text-slate-500'
                          : isDark
                          ? 'text-slate-300'
                          : 'text-slate-700'
                      }`}
                    >
                      {item.text}
                    </span>
                  </button>

                  <button
                    onClick={() => deletePlanItem(item.id)}
                    className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/15 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Input for adding custom items */}
        <form onSubmit={handleAddPlanItem} className="flex gap-1.5 mt-4 pt-3 border-t border-slate-500/10">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add concept plan..."
            className={`flex-1 p-2 rounded-lg border text-xs outline-none ${
              isDark
                ? 'bg-violet-950/20 border-violet-500/30 text-white placeholder-slate-500 focus:border-violet-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500'
            }`}
          />
          <button
            type="submit"
            className={`p-2 rounded-lg text-white transition-all ${
              isDark ? 'bg-violet-600 hover:bg-violet-500' : 'bg-sky-500 hover:bg-sky-600'
            }`}
          >
            <Plus size={14} />
          </button>
        </form>
      </div>

      {/* 3. Daily Goal Metrics Tracker */}
      <div
        className={`rounded-2xl border p-4 shadow-sm relative transition-all duration-300 ${
          isDark
            ? 'bg-[#121631]/60 border-violet-500/10 text-white'
            : 'bg-white border-slate-200 text-slate-800 shadow-sky-100/40'
        }`}
      >
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
          <Clock size={13} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> Daily Goal
        </h4>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {hoursLoggedToday} / {dailyHoursGoal} <span className="text-xs font-semibold text-slate-400">hrs</span>
            </p>
            <p className={`text-[11px] mt-1 font-semibold ${isDark ? 'text-violet-400' : 'text-sky-600'}`}>
              {goalPercent}% completed today
            </p>

            {/* Quick Logging Options */}
            <div className="flex gap-1.5 mt-3">
              <button
                onClick={() => logHoursToday(0.5)}
                className={`py-1 px-2 rounded-md text-[10px] font-bold border transition-colors ${
                  isDark
                    ? 'border-violet-500/20 bg-violet-950/20 text-violet-300 hover:bg-violet-500/10'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                +30m
              </button>
              <button
                onClick={() => logHoursToday(1.0)}
                className={`py-1 px-2 rounded-md text-[10px] font-bold border transition-colors ${
                  isDark
                    ? 'border-violet-500/20 bg-violet-950/20 text-violet-300 hover:bg-violet-500/10'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                +1h
              </button>
            </div>
          </div>

          {/* SVG Radial Progress Tracker */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                className={isDark ? 'stroke-slate-800' : 'stroke-slate-100'}
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                className={`transition-all duration-700 ${
                  isDark ? 'stroke-violet-500' : 'stroke-sky-500'
                }`}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={213}
                strokeDashoffset={213 - (213 * goalPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-black select-none">{goalPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
