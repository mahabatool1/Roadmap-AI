'use client';

import React from 'react';
import { useLearningStore } from '@/lib/store';
import { Trophy, BookOpen, GraduationCap, Sparkles, CheckCircle, AlertTriangle, Play, HelpCircle } from 'lucide-react';

interface MySkillsProps {
  onSetActiveTab: (tab: string) => void;
}

export default function MySkills({ onSetActiveTab }: MySkillsProps) {
  const { theme, roadmaps, weakAreas, badges, streak } = useLearningStore();

  const isDark = theme === 'dark';

  // Compute stats
  const totalMilestones = roadmaps.reduce((acc, r) => acc + r.milestones.length, 0);
  const completedMilestones = roadmaps.reduce(
    (acc, r) => acc + r.milestones.filter((m) => m.completed).length,
    0
  );

  // Derive mastered modules
  const masteredModules = roadmaps.reduce((acc: string[], r) => {
    r.milestones.forEach((m) => {
      // Completed, and not in weak areas
      if (m.completed && !weakAreas.includes(m.title)) {
        acc.push(m.title);
      }
    });
    return acc;
  }, []);

  // Standard predefined badges with descriptions and icons
  const availableBadges = [
    { name: 'Pioneer', desc: 'Started your very first custom generated technical learning roadmap.', unlocked: roadmaps.length > 0 },
    { name: 'Night Owl', desc: 'Focused and logged study session hours after 9:00 PM.', unlocked: badges.includes('Night Owl') },
    { name: 'Fast Learner', desc: 'Completed 3 structural milestones within a single learning day.', unlocked: badges.includes('Fast Learner') },
    { name: 'Quiz Whiz', desc: 'Achieved a perfect 100% score on any module checkpoint quiz.', unlocked: badges.includes('Quiz Whiz') },
    { name: 'JS Adventurer', desc: 'Unlocked the core Fundamentals of modern JavaScript.', unlocked: badges.includes('JS Adventurer') },
    { name: 'Python Pioneer', desc: 'Completed the structural foundations of Python programming.', unlocked: badges.includes('Python Pioneer') },
    { name: 'Focus Master', desc: 'Logged more than 3 study hours in a single calendar day.', unlocked: badges.includes('Focus Master') },
    { name: 'Consistency King', desc: 'Maintained a study streak of 10 days or longer.', unlocked: streak >= 10 || badges.includes('Consistency King') },
    { name: 'Weakness Slayer', desc: 'Retook and cleared a failed quiz module with a score of 80% or more.', unlocked: badges.includes('Weakness Slayer') },
  ];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto h-screen scrollbar-thin">
      
      {/* Title */}
      <div>
        <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Skills Portfolio & Achievements
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Monitor technical strengths, review identified remedial topics, and explore earned badges.
        </p>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Skills Stats Card */}
        <div
          className={`rounded-2xl border p-5 shadow-sm lg:col-span-1 flex flex-col justify-between relative transition-all duration-300 ${
            isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <GraduationCap size={15} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> Course Mastery
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-xs font-semibold">Total Course Progress</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-3xl font-black">{completedMilestones} / {totalMilestones}</span>
                  <span className="text-xs font-bold text-slate-400">Milestones Done</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-500/10 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${isDark ? 'bg-gradient-to-r from-violet-500 to-indigo-500' : 'bg-gradient-to-r from-sky-400 to-sky-500'}`}
                  style={{ width: `${(completedMilestones / (totalMilestones || 1)) * 100}%` }}
                ></div>
              </div>

              <div className="pt-2">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Every milestone checked off on your roadmaps or Today&apos;s Plan advances this mastery level. Taking quizzes secures these achievements.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-500/10 mt-6 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-400">Active Course tracks:</span>
            <span className={`font-black ${isDark ? 'text-violet-300' : 'text-sky-600'}`}>{roadmaps.length} Courses</span>
          </div>
        </div>

        {/* Dynamic Strengths & Weaknesses Panel */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Mastered Strengths Card */}
          <div
            className={`rounded-2xl border p-5 shadow-sm relative transition-all duration-300 ${
              isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-green-400 mb-3 flex items-center gap-1.5">
              <CheckCircle size={15} /> Verified Strengths
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Milestones you&apos;ve completed and demonstrated strong understanding in checkpoints.
            </p>

            <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
              {masteredModules.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-4">No verified strengths yet. Continue studying!</p>
              ) : (
                masteredModules.map((m) => (
                  <div
                    key={m}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                      isDark ? 'bg-green-500/5 border-green-500/10 text-green-300' : 'bg-green-50 border-green-200 text-green-700'
                    }`}
                  >
                    <CheckCircle size={12} className="shrink-0" />
                    <span className="truncate">{m}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Remedial Weak Areas Card */}
          <div
            className={`rounded-2xl border p-5 shadow-sm relative transition-all duration-300 ${
              isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-orange-400 mb-3 flex items-center gap-1.5">
              <AlertTriangle size={15} /> Identified Weak Areas
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Quiz scores fell under 70%. Practice and retake quizzes to clear weak tags!
            </p>

            <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
              {weakAreas.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-green-400 font-bold mb-1">🎉 All clear!</p>
                  <p className="text-[11px] text-slate-400">No weak remedial areas logged. Stellar work!</p>
                </div>
              ) : (
                weakAreas.map((w) => (
                  <div
                    key={w}
                    className={`p-2 rounded-xl flex items-center justify-between gap-2 border ${
                      isDark ? 'bg-orange-500/5 border-orange-500/10' : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-400 truncate flex-1">
                      <AlertTriangle size={12} className="shrink-0" />
                      <span className="truncate">{w}</span>
                    </div>

                    <button
                      onClick={() => onSetActiveTab('quizzes')}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all whitespace-nowrap border ${
                        isDark
                          ? 'border-orange-500/20 text-orange-400 hover:bg-orange-500/10'
                          : 'border-orange-200 bg-orange-100/50 text-orange-700 hover:bg-orange-100'
                      }`}
                    >
                      Quiz Hub
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Gamified Achievements/Badges Hub */}
      <div
        className={`rounded-2xl border p-5 shadow-sm relative transition-all duration-300 ${
          isDark
            ? 'bg-[#121631]/60 border-violet-500/10 text-white'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
          <Trophy size={15} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> Gamified Achievements
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {availableBadges.map((badge) => (
            <div
              key={badge.name}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all group ${
                badge.unlocked
                  ? isDark
                    ? 'bg-violet-950/10 border-violet-500/15 text-white hover:scale-[1.02]'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:scale-[1.02]'
                  : 'bg-slate-500/5 border-dashed border-slate-500/10 opacity-40 select-none'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{badge.unlocked ? '🏆' : '🔒'}</span>
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-full ${
                    badge.unlocked
                      ? isDark
                        ? 'bg-violet-500/15 text-violet-400'
                        : 'bg-sky-500/10 text-sky-600'
                      : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {badge.unlocked ? 'unlocked' : 'locked'}
                  </span>
                </div>
                <p className="font-extrabold text-xs tracking-tight">{badge.name}</p>
                <p className="text-[10px] text-slate-400 leading-normal mt-1.5">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
