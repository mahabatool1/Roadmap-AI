'use client';

import React, { useState } from 'react';
import { useLearningStore, Roadmap } from '@/lib/store';
import { Calendar, Clock, BookOpen, ChevronRight, Plus, Sliders, ArrowRight } from 'lucide-react';

export default function StudyPlanner() {
  const { theme, roadmaps, activeRoadmapId, setActiveRoadmapId } = useLearningStore();

  const [studyHoursPerDay, setStudyHoursPerDay] = useState(2.0);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState(() => activeRoadmapId || (roadmaps.length > 0 ? roadmaps[0].id : ''));

  const isDark = theme === 'dark';

  const targetRoadmap = roadmaps.find((r) => r.id === selectedRoadmapId);

  // Mathematical Planner Projection
  const projectSchedule = () => {
    if (!targetRoadmap) return null;

    let cumulativeMin = 0;
    const projectedDays: Array<{
      dateStr: string;
      milestones: string[];
      dayName: string;
    }> = [];

    const baseDate = new Date(); // Dynamic local date
    const dailyMinutesMax = studyHoursPerDay * 60;

    let currentDayMilestones: string[] = [];
    let currentDayMinutes = 0;
    let dayIndex = 0;

    targetRoadmap.milestones.forEach((m) => {
      // If adding this exceeds daily minutes, push previous day and start next day
      if (currentDayMinutes + m.estimatedMin > dailyMinutesMax && currentDayMilestones.length > 0) {
        const studyDate = new Date(baseDate.getTime() + dayIndex * 86400000);
        projectedDays.push({
          dateStr: studyDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          dayName: studyDate.toLocaleDateString('en-US', { weekday: 'long' }),
          milestones: currentDayMilestones
        });

        currentDayMilestones = [m.title];
        currentDayMinutes = m.estimatedMin;
        dayIndex++;
      } else {
        currentDayMilestones.push(m.title);
        currentDayMinutes += m.estimatedMin;
      }
      cumulativeMin += m.estimatedMin;
    });

    // Push final day
    if (currentDayMilestones.length > 0) {
      const studyDate = new Date(baseDate.getTime() + dayIndex * 86400000);
      projectedDays.push({
        dateStr: studyDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dayName: studyDate.toLocaleDateString('en-US', { weekday: 'long' }),
        milestones: currentDayMilestones
      });
      dayIndex++;
    }

    const totalHoursNeeded = parseFloat((cumulativeMin / 60).toFixed(1));
    const studyDaysCount = dayIndex;

    return {
      totalHoursNeeded,
      studyDaysCount,
      projectedDays
    };
  };

  const scheduleData = projectSchedule();

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto h-screen scrollbar-thin">
      
      {/* Title */}
      <div>
        <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Study Planner Scheduler
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Configure available hours to mathematically schedule milestone steps sequentially onto consecutive dates.
        </p>
      </div>

      {roadmaps.length === 0 ? (
        <div className="max-w-md mx-auto space-y-6 animate-fade-in text-center py-12">
          <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center border mb-3 ${
            isDark ? 'bg-violet-500/10 border-violet-500/25 text-violet-400' : 'bg-sky-500/10 border-sky-300 text-sky-600'
          }`}>
            <Calendar size={24} />
          </div>
          <h3 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            No study planner schedule available
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Please enter a topic on the Home dashboard to generate your first custom learning roadmap. Once generated, you can dynamically budget your study hours here!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Scheduler Controls Panel */}
        <div
          className={`rounded-2xl border p-5 shadow-sm relative transition-all duration-300 h-fit space-y-5 ${
            isDark
              ? 'bg-[#121631]/60 border-violet-500/10 text-white'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sliders size={15} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> Configure Capacity
          </h3>

          {/* Select Course */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
              Select Roadmap Course
            </label>
            <select
              value={selectedRoadmapId}
              onChange={(e) => setSelectedRoadmapId(e.target.value)}
              className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                isDark
                  ? 'bg-violet-950/20 border-violet-500/35 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {roadmaps.map((r) => (
                <option key={r.id} value={r.id} className={isDark ? 'bg-[#111428]' : 'bg-white'}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          {/* Slider for Hours per Day */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Daily Availability Study Hours
              </label>
              <span className={`text-xs font-black ${isDark ? 'text-violet-400' : 'text-sky-600'}`}>
                {studyHoursPerDay} hrs/day
              </span>
            </div>

            <input
              type="range"
              min="0.5"
              max="6.0"
              step="0.5"
              value={studyHoursPerDay}
              onChange={(e) => setStudyHoursPerDay(parseFloat(e.target.value))}
              className={`w-full accent-violet-500 h-1.5 rounded-lg cursor-pointer ${
                isDark ? 'bg-violet-950/30' : 'bg-slate-200'
              }`}
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
              <span>0.5h (light)</span>
              <span>6.0h (intensive)</span>
            </div>
          </div>

          {/* Math Report Breakdown Card */}
          {scheduleData && (
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-violet-950/15 border-violet-500/10' : 'bg-slate-50 border-slate-200'
            }`}>
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Projected Resource Analysis</h4>
              
              <div className="space-y-1.5 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total course hours:</span>
                  <span>{targetRoadmap?.durationHrs} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Task content workload:</span>
                  <span>{scheduleData.totalHoursNeeded} hrs</span>
                </div>
                <div className="flex justify-between border-t border-slate-500/10 pt-1.5 mt-1 text-sm font-bold">
                  <span className="text-slate-400">Study period needed:</span>
                  <span className={isDark ? 'text-violet-300' : 'text-sky-600'}>{scheduleData.studyDaysCount} days</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Projected Calendar Days Output */}
        <div
          className={`rounded-2xl border p-5 shadow-sm lg:col-span-2 relative transition-all duration-300 ${
            isDark
              ? 'bg-[#121631]/60 border-violet-500/10 text-white'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-1.5">
            <Calendar size={15} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> Weekly Projected Schedule
          </h3>

          <div className="space-y-4">
            {!scheduleData ? (
              <p className="text-xs text-slate-400 italic text-center py-6">
                Please select a generated course roadmap to schedule study slots.
              </p>
            ) : (
              scheduleData.projectedDays.map((day, dIdx) => (
                <div
                  key={dIdx}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isDark
                      ? 'bg-[#121631]/40 border-violet-500/5'
                      : 'bg-slate-50 border-slate-200/50'
                  }`}
                >
                  {/* Left Column: Date */}
                  <div className="w-40 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                      {day.dayName}
                    </span>
                    <span className={`text-sm font-extrabold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {day.dateStr}
                    </span>
                  </div>

                  {/* Right Column: Assigned milestones */}
                  <div className="flex-1 space-y-1.5">
                    {day.milestones.map((milestoneTitle, mIdx) => (
                      <div
                        key={mIdx}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                          isDark
                            ? 'bg-[#121631] border-violet-500/10 text-violet-300'
                            : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                        }`}
                      >
                        <BookOpen size={11} className="shrink-0" />
                        <span className="truncate">{milestoneTitle}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      )}

    </div>
  );
}
