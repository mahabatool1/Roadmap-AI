'use client';

import React from 'react';
import { useLearningStore } from '@/lib/store';
import { History, Clock, BookOpen, CheckCircle2, Award, ArrowUpRight } from 'lucide-react';

export default function HistoryView() {
  const { theme, roadmaps, hoursLoggedToday, dailyHoursGoal } = useLearningStore();

  const isDark = theme === 'dark';

  // Gather completed milestones sequentially to represent a timeline of success
  const completedHistory: Array<{
    courseTitle: string;
    milestoneTitle: string;
    time: string;
  }> = [];

  roadmaps.forEach((r) => {
    r.milestones.forEach((m, idx) => {
      if (m.completed) {
        completedHistory.push({
          courseTitle: r.title,
          milestoneTitle: m.title,
          time: new Date(new Date(r.createdAt).getTime() + idx * 86400000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        });
      }
    });
  });

  // Calculate cumulative stats
  const completedCount = completedHistory.length;
  const totalHoursEstimation = parseFloat((roadmaps.reduce((acc, r) => acc + r.durationHrs, 0) * 0.4).toFixed(1)) || 0.0;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto h-screen scrollbar-thin">
      
      {/* Title */}
      <div>
        <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Study History & Timeline
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Review past completions, check off milestones timeline logs, and track historic logging.
        </p>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Time Spent */}
        <div
          className={`rounded-2xl border p-4 shadow-sm flex items-center gap-4 transition-all duration-300 ${
            isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
            <Clock className="text-violet-400" size={20} />
          </div>
          <div>
            <span className="text-xl font-black block tracking-tight">{totalHoursEstimation + hoursLoggedToday} hrs</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Time Studied</span>
          </div>
        </div>

        {/* Milestone Accomplishments */}
        <div
          className={`rounded-2xl border p-4 shadow-sm flex items-center gap-4 transition-all duration-300 ${
            isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <CheckCircle2 className="text-green-400" size={20} />
          </div>
          <div>
            <span className="text-xl font-black block tracking-tight">{completedCount} Completed</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Structural Steps Cleared</span>
          </div>
        </div>

        {/* Quizzes Taken */}
        <div
          className={`rounded-2xl border p-4 shadow-sm flex items-center gap-4 transition-all duration-300 ${
            isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
            <Award className="text-yellow-400" size={20} />
          </div>
          <div>
            <span className="text-xl font-black block tracking-tight">Active Track</span>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SkillBuilder AI Platform</span>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Timeline of Completed Milestones */}
        <div
          className={`rounded-2xl border p-5 shadow-sm lg:col-span-2 relative transition-all duration-300 ${
            isDark
              ? 'bg-[#121631]/60 border-violet-500/10 text-white'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-1.5">
            <History size={15} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> Completion Timeline
          </h3>

          <div className="relative border-l border-slate-500/20 ml-3.5 pl-6 space-y-6">
            {completedHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 pl-2">
                No completion logs available. Work through milestones in &quot;Home&quot; or &quot;Roadmaps&quot; to build your timeline!
              </p>
            ) : (
              completedHistory.map((item, idx) => (
                <div key={idx} className="relative animate-fade-in">
                  {/* Timeline Node Dot */}
                  <div className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                    isDark ? 'bg-[#121631] border-violet-500' : 'bg-white border-sky-500'
                  }`}></div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block tracking-wider uppercase mb-1">{item.time}</span>
                    <h4 className="text-sm font-bold tracking-tight">{item.milestoneTitle}</h4>
                    <p className={`text-xs mt-0.5 flex items-center gap-1 ${isDark ? 'text-violet-400' : 'text-sky-600'}`}>
                      <BookOpen size={11} /> {item.courseTitle}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Certificate / Progress Stamp Card */}
        <div
          className={`rounded-2xl border p-5 shadow-sm relative transition-all duration-300 overflow-hidden flex flex-col justify-between ${
            isDark
              ? 'bg-gradient-to-br from-violet-950/20 to-indigo-950/10 border-violet-500/10 text-white'
              : 'bg-gradient-to-br from-slate-50 to-indigo-50/20 border-slate-200 text-slate-800'
          }`}
        >
          <div className="space-y-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-sky-500/15 text-sky-600'
            }`}>
              <Award size={20} />
            </div>

            <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-400">Micro-Credentials</h4>
            <h3 className="text-lg font-bold tracking-tight">Active Student Badge</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upon finishing all 5 milestones of a technical roadmap and scoring 100% on its checkpoint quiz, you will earn a permanent specialization badge inside your profile catalog.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-500/10 flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Specialization Status</span>
            <span className={`flex items-center gap-0.5 ${isDark ? 'text-violet-400' : 'text-sky-600'}`}>
              Learning <ArrowUpRight size={13} />
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
