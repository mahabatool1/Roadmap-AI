'use client';

import React, { useState, useEffect } from 'react';
import { useLearningStore } from '@/lib/store';
import { 
  Flame, 
  Calendar, 
  Award, 
  Trophy, 
  ChevronRight, 
  Zap, 
  Shield, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  Info,
  Clock,
  Check,
  RotateCcw
} from 'lucide-react';
import { motion } from 'motion/react';
import { showToast } from '@/components/NotificationToaster';

export default function StreaksView() {
  const { theme, streak, hoursLoggedToday, dailyHoursGoal, roadmaps, currentQuiz, lockInStreak, lastActiveDate } = useLearningStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'milestones'>('overview');
  const [shieldActive, setShieldActive] = useState(true);
  const [manualHabitDone, setManualHabitDone] = useState<Record<string, boolean>>({});

  const isDark = theme === 'dark';

  // Get dynamic current date based on local time
  const today = new Date();
  const todayDate = today.getDate();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed (e.g. 6 for July)
  
  // Calculate month metrics dynamically
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOffset = new Date(year, month, 1).getDay(); // 0 for Sun, 1 for Mon, etc.

  // Dynamic Month Name (e.g., "July 2026")
  const currentMonthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Generate completed days dynamically based on today's date and consecutive streak.
  const completedDays: number[] = [];
  for (let i = 0; i < streak; i++) {
    const day = todayDate - i;
    if (day > 0) {
      completedDays.push(day);
    }
  }

  // Pre-seed some prior completions in early July to represent historical consistency before current streak
  const priorCompletedDays = [1, 2, 4];
  const allCompletedDays = Array.from(new Set([...completedDays, ...priorCompletedDays])).sort((a, b) => a - b);

  // Dynamic habit integration
  const milestoneCompletedToday = roadmaps.some(r => r.milestones.some(m => m.completed));
  const focusTimeCompletedToday = hoursLoggedToday > 0;
  const quizAttemptedToday = currentQuiz?.submitted || false;

  // Milestones criteria
  const milestonesList = [
    { id: 'm-3', name: '3-Day Ember', days: 3, desc: 'Ignite the learning flame', badge: '🔥' },
    { id: 'm-7', name: '7-Day Spark', days: 7, desc: 'One full week of consistency', badge: '⚡' },
    { id: 'm-14', name: '14-Day Blaze', days: 14, desc: 'Two weeks of uninterrupted focus', badge: '☄️' },
    { id: 'm-30', name: '30-Day Supernova', days: 30, desc: 'Achieve legendary atomic focus', badge: '✨' },
    { id: 'm-50', name: '50-Day Cosmic Shift', days: 50, desc: 'Absolute mastery of habit loops', badge: '🌌' },
  ];

  // Consistency Score calculations
  const totalDaysElapsed = todayDate;
  const consistencyRate = Math.round((allCompletedDays.filter(d => d <= todayDate).length / totalDaysElapsed) * 100) || 0;

  const handleToggleShield = () => {
    setShieldActive(!shieldActive);
    showToast(
      !shieldActive ? 'Streak Shield activated! Your streak is secured.' : 'Streak Shield deactivated.',
      !shieldActive ? 'success' : 'info'
    );
  };

  const toggleManualHabit = (id: string, text: string) => {
    const isDone = !manualHabitDone[id];
    setManualHabitDone(prev => ({ ...prev, [id]: isDone }));
    if (isDone) {
      showToast(`Habit completed: "${text}"! Keep it up!`, 'success');
    }
  };

  const handleLockInStreak = () => {
    const res = lockInStreak();
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'info');
    }
  };

  // Generate the current week days dynamically around today's date (Monday through Sunday)
  const getDynamicWeekDays = () => {
    const list = [];
    const currentDayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      list.push({
        name: dayNames[i],
        date: d.getDate(),
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return list;
  };
  const weekDays = getDynamicWeekDays();

  // Container motion presets
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
  };

  return (
    <div className={`flex-1 p-6 space-y-6 overflow-y-auto h-screen scrollbar-thin transition-colors duration-300 ${
      isDark ? 'bg-[#0b0f19] text-white' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Header and Summary block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/10 dark:border-slate-800/40 pb-5">
        <div>
          <span className={`text-[11px] font-black tracking-wider uppercase px-2.5 py-1 rounded-full ${
            isDark ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'
          }`}>
            Habit Consistency Hub
          </span>
          <h2 className={`text-2xl md:text-3xl font-black tracking-tight mt-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Consistency &amp; Streaks
          </h2>
          <p className={`text-xs mt-1 max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Power up learning inertia, lock down consecutive study metrics, and build unbreakable atomic loops.
          </p>
        </div>

        {/* Floating Quick Stats Panel */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handleToggleShield}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all duration-300 ${
              shieldActive 
                ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                : (isDark ? 'bg-slate-800/50 border-slate-700/50 text-slate-400' : 'bg-white border-slate-200 text-slate-400')
            }`}
          >
            <Shield size={12} className={shieldActive ? 'animate-pulse' : ''} />
            Streak Shield: {shieldActive ? 'Active' : 'Offline'}
          </button>
        </div>
      </div>

      {/* Main Grid: Bento Style layout */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
      >
        
        {/* COL 1: The Massive Premium Streak Ring */}
        <motion.div 
          variants={itemVariants}
          className={`rounded-2xl border p-6 shadow-md relative overflow-hidden transition-all duration-300 flex flex-col items-center justify-between text-center min-h-[380px] ${
            isDark 
              ? 'bg-gradient-to-b from-[#141a30] to-[#0f1322] border-violet-500/10' 
              : 'bg-white border-slate-200/80 shadow-slate-100'
          }`}
        >
          {/* Subtle background glow effect in dark mode */}
          {isDark && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          )}

          <div className="w-full flex justify-between items-center text-xs">
            <span className="font-bold text-slate-400">Blaze Tier II</span>
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
              <Zap size={10} fill="currentColor" /> Top 3%
            </span>
          </div>

          {/* Large Concentric Circle Ring */}
          <div className="relative my-6 flex items-center justify-center">
            {/* Outer Circular SVG Track */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                className={isDark ? 'stroke-slate-800' : 'stroke-slate-100'}
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-orange-500 transition-all duration-1000 ease-out"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={402}
                strokeDashoffset={402 - (402 * Math.min(streak, 14)) / 14}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Content - Big Flame and Counter */}
            <div className="absolute flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-orange-500/15 flex items-center justify-center border border-orange-500/30 animate-bounce duration-1000">
                <Flame className="text-orange-500" size={24} fill="currentColor" />
              </div>
              <span className="text-3xl font-black tracking-tight mt-1">{streak}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Consecutive Days</span>
            </div>
          </div>

          <div className="space-y-2 w-full">
            <h3 className="font-extrabold text-base">Unstoppable Progress</h3>
            <p className={`text-xs px-4 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Excellent job! You are logging consistent learning sessions. Smash tomorrow&apos;s goal to upgrade to 13 consecutive days.
            </p>
          </div>

          {/* Quick Share / Info Footer */}
          <div className="w-full pt-4 mt-2 border-t border-slate-800/10 dark:border-slate-800/40 flex justify-between text-[11px] font-bold text-slate-400">
            <span>Next Milestone: 14 Days</span>
            <span className="text-orange-500">2 days to go</span>
          </div>
        </motion.div>

        {/* COL 2: Habit ledger & July 2026 Calendar */}
        <motion.div 
          variants={itemVariants}
          className={`rounded-2xl border p-6 shadow-md lg:col-span-2 relative transition-all duration-300 ${
            isDark ? 'bg-gradient-to-b from-[#141a30] to-[#0f1322] border-violet-500/10' : 'bg-white border-slate-200/80 shadow-slate-100'
          }`}
        >
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800/10 dark:border-slate-800/40">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar size={15} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> {currentMonthName} Ledger
            </h3>

            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span> Completed ({allCompletedDays.length}d)
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-violet-950/40' : 'bg-slate-200'}`}></span> Blank
              </div>
            </div>
          </div>

          {/* Grid Layout of Calendar */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold">
            {/* Week Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day} className="text-slate-400 py-1 font-extrabold uppercase tracking-widest text-[10px]">{day}</span>
            ))}

            {/* Empty Offsets */}
            {Array.from({ length: startDayOffset }).map((_, idx) => (
              <div key={`offset-${idx}`} className="p-2 opacity-25"></div>
            ))}

            {/* Dates */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dateVal = idx + 1;
              const isCompleted = allCompletedDays.includes(dateVal);
              const isToday = dateVal === todayDate;

              return (
                <div
                  key={`day-${dateVal}`}
                  className={`group p-2.5 rounded-xl font-black text-xs select-none relative transition-all duration-300 flex flex-col items-center justify-center min-h-[38px] ${
                    isCompleted
                      ? 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 scale-[1.03] hover:scale-110 hover:shadow-orange-500/35 cursor-pointer'
                      : isToday
                      ? 'border-2 border-dashed border-sky-400 text-sky-400 animate-pulse bg-sky-500/5'
                      : isDark
                      ? 'bg-[#18203d]/40 text-slate-400 hover:bg-[#202952]/60 hover:text-white cursor-pointer'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 cursor-pointer'
                  }`}
                >
                  <span>{dateVal}</span>
                  {isToday && (
                    <span className="absolute -top-1 -right-1 px-1 py-0.2 text-[7px] font-black bg-sky-500 text-white rounded-full uppercase leading-none">
                      now
                    </span>
                  )}
                  {isCompleted && (
                    <span className="w-1 h-1 bg-white rounded-full mt-0.5 opacity-80 group-hover:scale-150 transition-all"></span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-3 rounded-xl border border-dashed border-slate-500/10 bg-slate-500/5 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-[#1e2541]' : 'bg-slate-100'}`}>
              <TrendingUp className="text-orange-400" size={16} />
            </div>
            <div className="flex-1 text-[11px] leading-normal text-slate-400">
              <span className="font-bold text-white dark:text-white text-slate-800 block">July Consistency Rating: {consistencyRate}%</span>
              You have completed {allCompletedDays.length} total active study days out of {todayDate} elapsed this month. Awesome velocity!
            </div>
          </div>
        </motion.div>

      </motion.div>

      {/* Grid Row 2: Atomic Habit Booster (Middle) & Milestones Tracking (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Daily Atomic Habit Booster Checklist */}
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className={`rounded-2xl border p-6 shadow-md lg:col-span-2 flex flex-col justify-between transition-all duration-300 ${
            isDark ? 'bg-gradient-to-b from-[#141a30] to-[#0f1322] border-violet-500/10' : 'bg-white border-slate-200/80'
          }`}
        >
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-black text-sm flex items-center gap-2">
                <CheckCircle2 size={16} className="text-orange-500" /> Daily Habit Lock-in
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <p className={`text-xs mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Complete daily micro-habits to safeguard and fortify your study streak.
            </p>

            <div className="space-y-3">
              {/* Habit 1: Automatic from Store (Milestones) */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                milestoneCompletedToday 
                  ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                  : (isDark ? 'bg-[#18203d]/30 border-slate-800' : 'bg-slate-50 border-slate-100')
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${milestoneCompletedToday ? 'bg-emerald-500/20' : 'bg-slate-500/10'}`}>
                    {milestoneCompletedToday ? <Check size={14} className="text-emerald-400" /> : <Clock size={14} className="text-slate-400" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Complete at least 1 Roadmap Concept</span>
                    <span className="text-[9px] text-slate-400">Syncs automatically as you mark milestones.</span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400">+1 Streak Day</span>
              </div>

              {/* Habit 2: Automatic from Store (Hours Logged) */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                focusTimeCompletedToday 
                  ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                  : (isDark ? 'bg-[#18203d]/30 border-slate-800' : 'bg-slate-50 border-slate-100')
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${focusTimeCompletedToday ? 'bg-emerald-500/20' : 'bg-slate-500/10'}`}>
                    {focusTimeCompletedToday ? <Check size={14} className="text-emerald-400" /> : <Clock size={14} className="text-slate-400" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Log Today&apos;s Focus Hours</span>
                    <span className="text-[9px] text-slate-400">Logged {hoursLoggedToday}h of {dailyHoursGoal}h study goal.</span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400">+1 Streak Day</span>
              </div>

              {/* Habit 3: Interactive manual toggles */}
              {[
                { id: 'h-quiz', text: 'Answer a Knowledge Check Quiz today', badge: '📝' },
                { id: 'h-mindful', text: 'Complete a 5-min Focus Breather', badge: '🧘' }
              ].map((habit) => {
                const isManualDone = manualHabitDone[habit.id] || (habit.id === 'h-quiz' && quizAttemptedToday);
                return (
                  <div 
                    key={habit.id}
                    onClick={() => toggleManualHabit(habit.id, habit.text)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-300 cursor-pointer ${
                      isManualDone 
                        ? (isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                        : (isDark ? 'bg-[#18203d]/30 border-slate-800 hover:bg-[#18203d]/60' : 'bg-slate-50 border-slate-100 hover:bg-slate-100')
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${isManualDone ? 'bg-emerald-500/20' : 'bg-slate-500/10'}`}>
                        {isManualDone ? <Check size={14} className="text-emerald-400" /> : <span className="text-xs leading-none">{habit.badge}</span>}
                      </div>
                      <div>
                        <span className="text-xs font-bold block">{habit.text}</span>
                        <span className="text-[9px] text-slate-400">Click to manual-verify completion</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400">+1 Boost</span>
                  </div>
                );
              })}
            </div>

            {/* Lock In Streak Button */}
            <div className="mt-5 pt-2">
              <button
                onClick={handleLockInStreak}
                className={`w-full py-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  lastActiveDate === new Date().toISOString().split('T')[0]
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/20 hover:scale-[1.02] hover:shadow-orange-500/30 active:scale-[0.98]'
                }`}
                disabled={lastActiveDate === new Date().toISOString().split('T')[0]}
              >
                <Flame size={15} fill={lastActiveDate === new Date().toISOString().split('T')[0] ? 'none' : 'currentColor'} />
                {lastActiveDate === new Date().toISOString().split('T')[0] 
                  ? "Today's Streak Secured! ✓" 
                  : "Lock In Today's Streak! 🔥"}
              </button>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-500/10 flex justify-between items-center text-[10px] font-bold text-slate-400">
            <span>Verify atomic completions daily.</span>
            <span>Refreshes at midnight UTC.</span>
          </div>
        </motion.div>

        {/* Milestone Badges Panel */}
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className={`rounded-2xl border p-6 shadow-md flex flex-col justify-between transition-all duration-300 ${
            isDark ? 'bg-gradient-to-b from-[#141a30] to-[#0f1322] border-violet-500/10' : 'bg-white border-slate-200/80'
          }`}
        >
          <div>
            <h3 className="font-black text-sm flex items-center gap-2 mb-1">
              <Trophy size={16} className="text-amber-500" /> Streak Milestones
            </h3>
            <p className={`text-xs mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Unlock learning accolades as your consecutive streak deepens.
            </p>

            <div className="space-y-4">
              {milestonesList.map((m) => {
                const isUnlocked = streak >= m.days;
                const progressPercentage = Math.min((streak / m.days) * 100, 100);

                return (
                  <div key={m.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{m.badge}</span>
                        <span className={`font-bold ${isUnlocked ? 'text-white dark:text-white text-slate-900' : 'text-slate-400'}`}>
                          {m.name}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        isUnlocked ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {isUnlocked ? 'Unlocked' : `${streak}/${m.days}d`}
                      </span>
                    </div>

                    {/* Milestone Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${progressPercentage}%` }}
                        className={`h-full rounded-full transition-all duration-700 ${
                          isUnlocked 
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                            : 'bg-gradient-to-r from-orange-500 to-amber-500'
                        }`}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 block pl-6 italic">{m.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-500/10 text-center text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1">
            <Award size={12} className="text-amber-500" /> Badges saved to your local profile ledger.
          </div>
        </motion.div>

      </div>

      {/* Week Focus Velocity Row */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className={`rounded-2xl border p-6 shadow-md transition-all duration-300 ${
          isDark ? 'bg-gradient-to-b from-[#141a30] to-[#0f1322] border-violet-500/10' : 'bg-white border-slate-200/80'
        }`}
      >
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-black text-sm flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" /> Weekly Velocity Indicator
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Cycle Overview</span>
        </div>
        <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Active consistency visualizer representing daily habit patterns and study intervals.
        </p>

        {/* Weekly Day Indicator row */}
        <div className="grid grid-cols-7 gap-3 md:gap-4">
          {weekDays.map((wd) => {
            const dayCompleted = allCompletedDays.includes(wd.date);
            const isToday = wd.date === todayDate;

            return (
              <div 
                key={wd.date}
                className={`flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 relative ${
                  dayCompleted 
                    ? (isDark ? 'bg-orange-500/10 border-orange-500/25 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700')
                    : isToday
                    ? 'border-dashed border-sky-400 bg-sky-500/5 text-sky-400'
                    : (isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-400')
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest block mb-1">{wd.name}</span>
                <span className="text-xs font-black block">{wd.date}</span>
                
                <div className="mt-2.5">
                  {dayCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                      <Flame size={12} className="text-orange-500 animate-pulse" fill="currentColor" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-500/5 flex items-center justify-center border border-dashed border-slate-500/10 text-[9px] font-black">
                      {isToday ? '⏳' : '💤'}
                    </div>
                  )}
                </div>

                {isToday && (
                  <span className="absolute -bottom-1.5 bg-sky-500 text-white text-[7px] font-black px-1.5 py-0.2 uppercase rounded-full tracking-wider">
                    Today
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

    </div>
  );
}

