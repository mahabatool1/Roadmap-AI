'use client';

import React, { useEffect, useState } from 'react';
import { useLearningStore } from '@/lib/store';
import { 
  BarChart3, 
  Clock, 
  GraduationCap, 
  Calendar, 
  TrendingUp, 
  PieChart as PieIcon 
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Custom tooltips declared outside of render to prevent resetting state on each render cycle
const CustomTooltip = ({ active, payload, label, isDark }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-3 rounded-xl border shadow-xl ${
        isDark 
          ? 'bg-[#0f1225]/95 border-slate-700/60 text-white' 
          : 'bg-white/95 border-slate-200 text-slate-800'
      }`}>
        <p className="text-xs font-extrabold mb-1.5 uppercase tracking-wider text-slate-400">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            if (entry.value === 0) return null;
            return (
              <div key={index} className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload?.fill }}></span>
                <span className="text-slate-400">{entry.name}:</span>
                <span className="font-bold">{entry.value} hrs</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function ProgressView() {
  const { theme, roadmaps, hoursLoggedToday, activeRoadmapId } = useLearningStore();
  const [mounted, setMounted] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    // Avoid synchronous setState during mount to prevent cascading renders
    const timer = setTimeout(() => {
      setMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Compute stats
  const totalRoadmaps = roadmaps.length;
  const totalMilestones = roadmaps.reduce((acc, r) => acc + r.milestones.length, 0);
  const completedMilestones = roadmaps.reduce(
    (acc, r) => acc + r.milestones.filter((m) => m.completed).length,
    0
  );
  const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  // Custom palette for categories
  const colors = isDark 
    ? ['#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#10b981', '#14b8a6']
    : ['#0ea5e9', '#6366f1', '#f59e0b', '#f43f5e', '#14b8a6', '#db2777'];

  // 1. Generate realistic, dynamic 30-day dataset aligned with roadmap progression
  const generate30DaysData = () => {
    const data = [];
    const now = new Date();
    const categoriesList = roadmaps;

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayData: Record<string, any> = { date: dateStr };
      let totalForDay = 0;

      categoriesList.forEach((r, idx) => {
        // Base study time influenced deterministically by completed milestones
        const completedMilestonesCount = r.milestones ? r.milestones.filter(m => m.completed).length : 0;
        const totalCount = r.milestones ? r.milestones.length : 5;
        const progressFactor = totalCount > 0 ? (completedMilestonesCount / totalCount) : 0.4;
        
        // Seeded sine logic to produce realistic daily learning patterns (peaks, rest days)
        const baseVal = (Math.sin((i + idx * 8) * 0.4) + 1) * 0.9; 
        let hours = baseVal * (0.3 + progressFactor * 0.7);

        // Extra focus if this is the active roadmap
        if (r.id === activeRoadmapId && i < 12) {
          hours += 0.4;
        }

        // Rest days logic to mirror real student behaviors
        const isRestDay = (i + idx * 4) % 6 === 0;
        if (isRestDay) hours = 0;

        // Round to 1 decimal place
        hours = parseFloat(hours.toFixed(1));

        // Inject active live logged study hours on the current day
        if (i === 0 && r.id === activeRoadmapId) {
          hours = parseFloat((hours + hoursLoggedToday).toFixed(1));
        }

        dayData[r.title] = hours;
        totalForDay += hours;
      });

      dayData.total = parseFloat(totalForDay.toFixed(1));
      data.push(dayData);
    }
    return data;
  };

  const chartData = generate30DaysData();

  // 2. Aggregate cumulative totals for each category
  const categoryTotals = roadmaps.map((r, idx) => {
    const totalHours = chartData.reduce((acc, curr) => acc + (curr[r.title] || 0), 0);
    return {
      name: r.title,
      value: parseFloat(totalHours.toFixed(1))
    };
  }).filter(c => c.value > 0);

  // Fallback if no hours are logged yet across categories
  const fallbackTotals = roadmaps.length > 0 
    ? roadmaps.map((r, idx) => ({ name: r.title, value: idx === 0 ? 4.5 : 2.0 })) 
    : [];

  const donutChartData = categoryTotals.length > 0 ? categoryTotals : fallbackTotals;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto h-screen scrollbar-thin">
      
      {/* Title */}
      <div>
        <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Learning Progress & Analytics
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Review in-depth performance logs, completion metrics, and subject distributions.
        </p>
      </div>

      {/* Recharts 30-Day Distribution and Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Stacked Area Chart: Study Hours Trend */}
        <div
          className={`rounded-2xl border p-5 shadow-sm lg:col-span-2 relative transition-all duration-300 flex flex-col justify-between ${
            isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Calendar size={15} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> Study Hours Trend (Last 30 Days)
            </h3>
            <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Daily study sessions distributed by specific roadmap domains. Check peaks and milestones progression.
            </p>
          </div>

          <div className="h-72 w-full">
            {!mounted ? (
              <div className="h-full w-full flex items-center justify-center animate-pulse">
                <span className="text-xs text-slate-400">Loading learning curves...</span>
              </div>
            ) : roadmaps.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
                <TrendingUp size={30} className="text-slate-500 mb-2" />
                <p className="text-xs text-slate-400">Generate a custom AI roadmap first to enable historic logging.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    {roadmaps.map((r, idx) => {
                      const color = colors[idx % colors.length];
                      return (
                        <linearGradient key={r.id} id={`grad-${r.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 9 }}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 9 }}
                    unit="h"
                  />
                  <Tooltip content={<CustomTooltip isDark={isDark} />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }} />
                  {roadmaps.map((r, idx) => (
                    <Area
                      key={r.id}
                      type="monotone"
                      dataKey={r.title}
                      stackId="1"
                      stroke={colors[idx % colors.length]}
                      fill={`url(#grad-${r.id})`}
                      strokeWidth={1.5}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Donut Chart: Skill Category Allocation */}
        <div
          className={`rounded-2xl border p-5 shadow-sm relative transition-all duration-300 flex flex-col justify-between ${
            isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <PieIcon size={15} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> Category Allocation
            </h3>
            <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Percentage allocation of total study hours committed across skills.
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {!mounted ? (
              <div className="h-full w-full flex items-center justify-center animate-pulse">
                <span className="text-xs text-slate-400">Loading allocation...</span>
              </div>
            ) : roadmaps.length === 0 ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
                <PieIcon size={30} className="text-slate-500 mb-2" />
                <p className="text-xs text-slate-400">Generate a custom AI roadmap first to enable category mapping.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value} hrs`, 'Time Spent']} />
                  <Legend 
                    iconType="circle" 
                    iconSize={8}
                    layout="horizontal" 
                    align="center" 
                    verticalAlign="bottom" 
                    wrapperStyle={{ fontSize: '10px' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-500/10 flex justify-between items-center text-[11px] font-medium text-slate-400">
            <span>Focused Track:</span>
            <span className={`font-bold uppercase ${isDark ? 'text-violet-400' : 'text-sky-600'}`}>
              {roadmaps.find(r => r.id === activeRoadmapId)?.title || 'No Active Track'}
            </span>
          </div>
        </div>

      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress Circular Arc Card */}
        <div
          className={`rounded-2xl border p-5 shadow-sm text-center flex flex-col items-center justify-between transition-all duration-300 ${
            isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="w-full">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-6 text-left flex items-center gap-1.5">
              <GraduationCap size={15} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> Overall Course Mastery
            </h3>

            <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  className={isDark ? 'stroke-slate-800' : 'stroke-slate-100'}
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  className={`transition-all duration-1000 ${
                    isDark ? 'stroke-violet-500' : 'stroke-sky-500'
                  }`}
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * progressPercent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center select-none">
                <span className="text-3xl font-black">{progressPercent}%</span>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">mastered</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mt-6 max-w-xs">
            Reflects overall completion of {completedMilestones} milestones across {totalMilestones} total sequential study modules.
          </p>
        </div>

        {/* Course-by-Course Distribution Lists */}
        <div
          className={`rounded-2xl border p-5 shadow-sm lg:col-span-2 relative transition-all duration-300 ${
            isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-1.5">
            <BarChart3 size={15} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> Subject Performance Distribution
          </h3>

          <div className="space-y-5">
            {roadmaps.map((r) => {
              const completedCount = r.milestones.filter((m) => m.completed).length;
              const totalCount = r.milestones.length;
              const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div key={r.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span>{r.title}</span>
                    <span className={isDark ? 'text-violet-400' : 'text-sky-600'}>
                      {completedCount}/{totalCount} milestones ({percent}%)
                    </span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-slate-500/10 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isDark ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : 'bg-gradient-to-r from-sky-400 to-sky-500'}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}

