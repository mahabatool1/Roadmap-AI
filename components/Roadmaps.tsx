'use client';

import React, { useState, useEffect } from 'react';
import { useLearningStore, Roadmap, Milestone } from '@/lib/store';
import { Compass, BookOpen, Clock, CheckCircle2, ChevronRight, ArrowLeft, ArrowUpRight, Search, Sparkles, Loader2, PlaySquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast } from '@/components/NotificationToaster';

interface RoadmapsProps {
  onSetActiveTab: (tab: string) => void;
}

export default function Roadmaps({ onSetActiveTab }: RoadmapsProps) {
  const {
    theme,
    roadmaps,
    activeRoadmapId,
    setActiveRoadmapId,
    toggleMilestone,
    addRoadmap,
    deleteRoadmap,
    setCurrentQuiz
  } = useLearningStore();

  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [drawerMilestone, setDrawerMilestone] = useState<Milestone | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [subtasks, setSubtasks] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('roadmap-subtasks');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {};
  });

  const isDark = theme === 'dark';

  const toggleSubtask = (roadmapId: string, milestoneId: string, concept: string) => {
    const key = `${roadmapId}-${milestoneId}-${concept}`;
    const updated = { ...subtasks, [key]: !subtasks[key] };
    setSubtasks(updated);
    localStorage.setItem('roadmap-subtasks', JSON.stringify(updated));
  };

  // Find active course
  const activeRoadmap = roadmaps.find((r) => r.id === activeRoadmapId);

  const handleToggleMilestoneInDrawer = (milestoneId: string) => {
    if (!activeRoadmapId || !activeRoadmap) return;
    toggleMilestone(activeRoadmap.id, milestoneId);
    setDrawerMilestone(prev => prev && prev.id === milestoneId ? { ...prev, completed: !prev.completed } : prev);
  };

  // Toggle dropdown expanding for showing key concepts & resources of a milestone
  const handleToggleExpand = (milestoneId: string) => {
    setExpandedMilestoneId(expandedMilestoneId === milestoneId ? null : milestoneId);
  };

  // Trigger custom AI generation from search prompt
  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) return;

    setIsGeneratingCustom(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-roadmap',
          payload: { topic: customTopic.trim() }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reach AI server.');
      }

      const generatedData = await response.json();
      if (generatedData.error) {
        throw new Error(generatedData.error);
      }

      const newId = addRoadmap({
        title: generatedData.title,
        description: generatedData.description,
        durationHrs: generatedData.durationHrs || 10,
        milestones: generatedData.milestones.map((m: any) => ({
          ...m,
          completed: false
        }))
      });

      setActiveRoadmapId(newId);
      setCustomTopic('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong while generating the roadmap.');
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  // Redirect to taking dynamic quiz for a specific milestone module
  const handleStartQuiz = async (milestone: Milestone) => {
    if (!activeRoadmap) return;

    // Trigger quiz UI load state
    onSetActiveTab('quizzes');
    
    // We will let the QuizzesHub handle quiz generation since it holds the AI quiz controller
    // But we can preset the target module in local storage context!
    // Or we can pre-trigger quiz generation by setting a loading quiz object in store
    const loadingQuiz = {
      moduleTitle: milestone.title,
      roadmapId: activeRoadmap.id,
      roadmapTitle: activeRoadmap.title,
      questions: [],
      userAnswers: {},
      score: null,
      submitted: false
    };
    setCurrentQuiz(loadingQuiz);
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto h-screen scrollbar-thin">
      
      {/* AI Generating Loader Screen */}
      {isGeneratingCustom && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-6 animate-fade-in">
          <div className="relative flex flex-col items-center">
            <Loader2 size={50} className={`animate-spin mb-4 ${isDark ? 'text-violet-400' : 'text-sky-400'}`} />
            <Sparkles size={24} className="absolute -top-3 -right-3 text-yellow-300 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-2">Generating Technical Roadmap...</h3>
          <p className="text-sm text-slate-400 text-center max-w-sm">
            Passively building curriculum matrices, detailed step explanations, and verified MDN/Python references for <strong className="text-white">&quot;{customTopic}&quot;</strong>...
          </p>
          <div className="mt-8 flex gap-2">
            <span className="w-2.5 h-2.5 bg-violet-500 rounded-full animate-bounce"></span>
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2.5 h-2.5 bg-fuchsia-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
        </div>
      )}

      {activeRoadmap ? (
        /* Detailed Active Course Study View */
        <div className="space-y-6 animate-fade-in">
          {/* Header & Back Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveRoadmapId(null);
                setShowDeleteConfirm(false);
              }}
              className={`p-2 rounded-xl border transition-colors hover:bg-slate-500/10 ${
                isDark ? 'border-violet-500/15 text-violet-300' : 'border-slate-200 text-slate-600'
              }`}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <span className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? 'text-violet-400' : 'text-sky-600'}`}>
                Active learning track
              </span>
              <h2 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {activeRoadmap.title}
              </h2>
            </div>
          </div>

          {/* Description Card */}
          <div
            className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-300 ${
              isDark
                ? 'bg-gradient-to-br from-[#121631] via-[#111428] to-[#121631] border-violet-500/10 text-white'
                : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="max-w-xl">
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {activeRoadmap.description}
              </p>
              <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400 font-bold">
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {activeRoadmap.durationHrs} Hours Expected
                </span>
                <span className="flex items-center gap-1">
                  <Compass size={12} /> {activeRoadmap.milestones.length} Milestone Milestones
                </span>
              </div>
            </div>

            {!showDeleteConfirm ? (
              <button
                type="button"
                id="delete-curriculum-btn"
                onClick={() => setShowDeleteConfirm(true)}
                className="py-2 px-3 text-red-400 border border-dashed border-red-500/30 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all self-start md:self-auto cursor-pointer"
              >
                Delete Curriculum
              </button>
            ) : (
              <div className={`p-3 rounded-xl border space-y-2 max-w-xs transition-all duration-300 self-start md:self-auto ${
                isDark 
                  ? 'bg-red-500/10 border-red-500/20 text-red-200' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <p className="text-[11px] font-bold leading-normal">
                  ⚠️ Are you sure you want to permanently delete this curriculum course track?
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    id="cancel-delete-curriculum-btn"
                    onClick={() => setShowDeleteConfirm(false)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer ${
                      isDark
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="confirm-delete-curriculum-btn"
                    onClick={() => {
                      const deletedTitle = activeRoadmap.title;
                      deleteRoadmap(activeRoadmap.id);
                      showToast(`Successfully deleted curriculum: ${deletedTitle}`, 'success');
                      setShowDeleteConfirm(false);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all active:scale-95 cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Node Map Visualization */}
          <div className={`p-6 rounded-2xl border ${
            isDark ? 'bg-[#121631]/40 border-violet-500/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-1.5">
              <Sparkles size={14} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> Interactive Roadmap Path
            </h3>
            
            {/* Horizontal timeline for md+ screens, vertical for smaller screens */}
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 py-4 px-2 overflow-x-auto scrollbar-none">
              {/* Connection line in background (desktop) */}
              <div className="absolute hidden md:block left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-800 z-0">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDark ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : 'bg-sky-500'
                  }`}
                  style={{
                    width: `${
                      activeRoadmap.milestones.length > 1
                        ? (activeRoadmap.milestones.filter((m) => m.completed).length / (activeRoadmap.milestones.length - 1)) * 100
                        : 0
                    }%`
                  }}
                />
              </div>

              {/* Connection line in background (mobile) */}
              <div className="absolute block md:hidden left-1/2 -translate-x-1/2 top-10 bottom-10 w-1 bg-slate-200 dark:bg-slate-800 z-0">
                <div 
                  className={`w-full rounded-full transition-all duration-500 ${
                    isDark ? 'bg-violet-500' : 'bg-sky-500'
                  }`}
                  style={{
                    height: `${
                      activeRoadmap.milestones.length > 1
                        ? (activeRoadmap.milestones.filter((m) => m.completed).length / (activeRoadmap.milestones.length - 1)) * 100
                        : 0
                    }%`
                  }}
                />
              </div>

              {activeRoadmap.milestones.map((m, idx) => {
                const isCompleted = m.completed;
                const isCurrent = !isCompleted && (idx === 0 || activeRoadmap.milestones[idx - 1].completed);
                
                return (
                  <button
                    key={m.id}
                    onClick={() => setDrawerMilestone(m)}
                    className="relative z-10 flex flex-col items-center group focus:outline-none"
                    id={`roadmap-node-${m.id}`}
                  >
                    {/* Node Dot */}
                    <div 
                      className={`w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                        isCompleted
                          ? isDark
                            ? 'bg-violet-600 border-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                            : 'bg-sky-500 border-sky-400 text-white shadow-[0_0_15px_rgba(14,165,233,0.3)]'
                          : isCurrent
                          ? isDark
                            ? 'bg-slate-900 border-violet-400 text-violet-400 animate-pulse shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                            : 'bg-white border-sky-400 text-sky-500 animate-pulse'
                          : isDark
                          ? 'bg-[#0f1123] border-slate-800 text-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      } hover:scale-110 active:scale-95`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={20} className="stroke-[3px]" />
                      ) : (
                        <span className="text-sm font-black">{idx + 1}</span>
                      )}
                    </div>

                    {/* Step label */}
                    <div className="mt-3 text-center max-w-[120px] md:max-w-[140px]">
                      <p className={`text-xs font-bold truncate ${
                        isCompleted 
                          ? isDark ? 'text-violet-300' : 'text-sky-600'
                          : isCurrent 
                          ? 'text-slate-200 font-extrabold' 
                          : 'text-slate-400'
                      }`}>
                        {m.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isCompleted ? 'Completed' : isCurrent ? 'Active Now' : 'Locked'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Milestone Steps Timeline Grid */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">Milestone Steps Checklist</h3>

            {activeRoadmap.milestones.map((m, idx) => {
              const isCompleted = m.completed;
              const isExpanded = expandedMilestoneId === m.id;

              return (
                <div
                  key={m.id}
                  className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                    isExpanded
                      ? isDark
                        ? 'border-violet-500/30 bg-violet-950/15'
                        : 'border-sky-300 bg-sky-50/10'
                      : isDark
                      ? 'border-violet-500/5 bg-[#121631]/40'
                      : 'border-slate-200 bg-white shadow-sm'
                  }`}
                >
                  {/* Step Header */}
                  <div className="p-4 flex items-start gap-4 justify-between">
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Checkbox Trigger */}
                      <button
                        onClick={() => toggleMilestone(activeRoadmap.id, m.id)}
                        className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center transition-all border shrink-0 ${
                          isCompleted
                            ? isDark
                              ? 'bg-violet-600 border-violet-500'
                              : 'bg-sky-500 border-sky-400'
                            : isDark
                            ? 'border-violet-500/30 bg-transparent'
                            : 'border-slate-300 bg-transparent'
                        }`}
                      >
                        {isCompleted && <CheckCircle2 size={12} className="text-white fill-white stroke-none" />}
                      </button>

                      {/* Info and Trigger Dropdown Expansion */}
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleToggleExpand(m.id)}>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-green-500/15 text-green-400'
                              : isDark
                              ? 'bg-violet-500/10 text-violet-400'
                              : 'bg-sky-500/10 text-sky-600'
                          }`}>
                            Step 0{idx + 1}
                          </span>
                          <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                            <Clock size={10} /> {m.estimatedMin}m
                          </span>
                        </div>
                        <h4 className={`text-sm font-bold tracking-tight mt-1.5 ${
                          isCompleted ? 'line-through text-slate-500' : isDark ? 'text-white' : 'text-slate-800'
                        }`}>
                          {m.title}
                        </h4>
                        <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {m.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleExpand(m.id)}
                      className={`p-1.5 rounded-lg text-slate-400 hover:bg-slate-500/10 transition-transform duration-300 ${
                        isExpanded ? 'rotate-90' : 'rotate-0'
                      }`}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {/* Dropdown Expanded Panel: Core Concepts & Resources */}
                  {isExpanded && (
                    <div className={`p-4 border-t px-11 space-y-4 animate-fade-in ${
                      isDark ? 'border-violet-500/10 bg-violet-950/10' : 'border-slate-100 bg-slate-50/30'
                    }`}>
                      {/* Concepts */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Core target concepts:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {m.keyConcepts.map((concept, cIdx) => (
                            <span
                              key={cIdx}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                isDark
                                  ? 'bg-violet-950/20 border-violet-500/15 text-violet-300'
                                  : 'bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Curated Resources */}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Curated technical references:</p>
                        <div className="space-y-1.5">
                          {m.resources.map((linkStr, lIdx) => (
                            <div
                              key={lIdx}
                              className={`p-2 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                                isDark ? 'bg-[#121631]/40 border-violet-500/5 text-violet-300' : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              <span className="truncate">{linkStr}</span>
                              <a
                                href={linkStr}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 text-slate-400 hover:underline transition-colors ${
                                  isDark ? 'hover:text-violet-400' : 'hover:text-sky-500'
                                }`}
                              >
                                Read reference <ArrowUpRight size={11} />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action: Take checkpoint quiz & Open Drawer */}
                      <div className="flex gap-2 pt-2 border-t border-slate-500/10">
                        <button
                          onClick={() => handleStartQuiz(m)}
                          className={`flex items-center gap-1.5 py-2 px-3 rounded-xl font-bold text-[11px] text-white transition-all hover:scale-105 active:scale-95 ${
                            isDark ? 'bg-violet-600 hover:bg-violet-500' : 'bg-sky-500 hover:bg-sky-600'
                          }`}
                        >
                          Take Checkpoint Quiz 📝
                        </button>

                        <button
                          onClick={() => setDrawerMilestone(m)}
                          className={`flex items-center gap-1.5 py-2 px-3 rounded-xl font-bold text-[11px] border transition-all hover:scale-105 active:scale-95 ${
                            isDark
                              ? 'border-violet-500/20 text-violet-300 hover:bg-violet-500/10'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                          id={`milestone-drawer-trigger-${m.id}`}
                        >
                          Open Deep Dive Drawer 🔍
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Grid Course Browser */
        <div className="space-y-6 animate-fade-in">
          {/* Title row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                My Roadmap Portfolio
              </h2>
              <p className="text-xs text-slate-400 mt-1">Browse and manage all customized generative technical curricula.</p>
            </div>

            {/* Custom search bar right aligned */}
            <form onSubmit={handleCreateCustom} className="flex gap-2 max-w-sm w-full">
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Topic, e.g., Kubernetes..."
                className={`flex-1 p-2 rounded-xl text-xs font-semibold border outline-none ${
                  isDark
                    ? 'bg-violet-950/20 border-violet-500/35 text-white focus:border-violet-500'
                    : 'bg-slate-50 border-slate-200 focus:border-sky-500'
                }`}
              />
              <button
                type="submit"
                disabled={!customTopic.trim()}
                className={`py-2 px-3 rounded-xl font-bold text-xs text-white flex items-center gap-1 transition-all disabled:opacity-50 ${
                  isDark ? 'bg-violet-600 hover:bg-violet-500' : 'bg-sky-500 hover:bg-sky-600'
                }`}
              >
                Create AI ✨
              </button>
            </form>
          </div>

          {errorMsg && <p className="text-xs text-red-400 font-bold mt-1">{errorMsg}</p>}

          {/* Grid Layout of Curriculums */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roadmaps.map((r) => {
              const completedCount = r.milestones.filter((m) => m.completed).length;
              const totalCount = r.milestones.length;
              const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return (
                <div
                  key={r.id}
                  onClick={() => {
                    setActiveRoadmapId(r.id);
                    setShowDeleteConfirm(false);
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer flex flex-col justify-between h-44 shadow-sm hover:scale-[1.02] transition-all duration-300 ${
                    isDark
                      ? 'bg-[#121631]/60 border-violet-500/10 text-white hover:border-violet-500/30'
                      : 'bg-white border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isDark ? 'bg-violet-500/15 text-violet-400' : 'bg-sky-500/10 text-sky-600'
                      }`}>
                        Course track
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock size={10} /> {r.durationHrs} Hrs
                      </span>
                    </div>

                    <h3 className={`text-base font-extrabold tracking-tight mt-2 truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {r.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mt-1">{r.description}</p>
                  </div>

                  {/* Progress Info */}
                  <div className="pt-3 border-t border-slate-500/10">
                    <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                      <span>Course Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-500/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isDark ? 'bg-violet-500' : 'bg-sky-500'}`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Side Drawer for Milestone Details */}
      <AnimatePresence>
        {drawerMilestone && activeRoadmap && (
          <div className="fixed inset-0 z-50 flex justify-end" id="node-details-drawer">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerMilestone(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`relative z-10 w-full max-w-md h-full shadow-2xl flex flex-col justify-between overflow-hidden border-l ${
                isDark ? 'bg-[#0f1123] border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-500/10 flex items-start justify-between">
                <div className="space-y-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    drawerMilestone.completed
                      ? 'bg-green-500/15 text-green-400'
                      : isDark
                      ? 'bg-violet-500/10 text-violet-400'
                      : 'bg-sky-500/10 text-sky-600'
                  }`}>
                    Milestone Deep Dive
                  </span>
                  <h3 className="text-lg font-black tracking-tight pt-1">
                    {drawerMilestone.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-bold mt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {drawerMilestone.estimatedMin} Min Session
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} className={drawerMilestone.completed ? 'text-green-400' : 'text-slate-500'} />
                      {drawerMilestone.completed ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerMilestone(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-all bg-white/5"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Description</h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {drawerMilestone.description}
                  </p>
                </div>

                {/* Sub-tasks Section (using keyConcepts) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                      Specific Sub-tasks ({
                        drawerMilestone.keyConcepts.filter(c => subtasks[`${activeRoadmap.id}-${drawerMilestone.id}-${c}`]).length
                      }/{drawerMilestone.keyConcepts.length})
                    </h4>
                    
                    {/* Tiny Progress bar */}
                    <div className="w-24 bg-slate-500/10 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${isDark ? 'bg-violet-500' : 'bg-sky-500'}`}
                        style={{
                          width: `${
                            (drawerMilestone.keyConcepts.filter(c => subtasks[`${activeRoadmap.id}-${drawerMilestone.id}-${c}`]).length /
                            drawerMilestone.keyConcepts.length) * 100
                          }%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {drawerMilestone.keyConcepts.map((concept, cIdx) => {
                      const conceptKey = `${activeRoadmap.id}-${drawerMilestone.id}-${concept}`;
                      const isSubtaskDone = !!subtasks[conceptKey];
                      return (
                        <div
                          key={cIdx}
                          onClick={() => toggleSubtask(activeRoadmap.id, drawerMilestone.id, concept)}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                            isSubtaskDone
                              ? isDark
                                ? 'bg-violet-950/20 border-violet-500/20 text-violet-300'
                                : 'bg-sky-50 border-sky-100 text-sky-700'
                              : isDark
                              ? 'bg-slate-500/5 border-slate-500/5 text-slate-300 hover:bg-slate-500/10'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/50'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            isSubtaskDone
                              ? isDark ? 'bg-violet-500 border-violet-400 text-white' : 'bg-sky-500 border-sky-400 text-white'
                              : 'border-slate-500/30'
                          }`}>
                            {isSubtaskDone && <CheckCircle2 size={11} className="stroke-[3px]" />}
                          </div>
                          <span className={`text-xs font-semibold select-none ${isSubtaskDone ? 'line-through opacity-60' : ''}`}>
                            {concept}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Relevant Study Resources */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Relevant Study Resources</h4>
                  <div className="space-y-2">
                    {drawerMilestone.resources.map((linkStr, lIdx) => (
                      <div
                        key={lIdx}
                        className={`p-3 rounded-xl border flex flex-col gap-2 ${
                          isDark ? 'bg-slate-500/5 border-slate-500/5' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-xs font-bold text-slate-300 dark:text-slate-200 truncate max-w-[240px]">
                            {linkStr.replace(/^https?:\/\/(www\.)?/, '')}
                          </span>
                          <a
                            href={linkStr}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-0.5 whitespace-nowrap transition-colors ${
                              isDark ? 'text-violet-400 hover:text-violet-300' : 'text-sky-600 hover:text-sky-500'
                            }`}
                          >
                            Explore <ArrowUpRight size={11} />
                          </a>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Verified external developer guide, code examples, and standard documentation.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 border-t border-slate-500/10 flex flex-col gap-3">
                <button
                  onClick={() => handleToggleMilestoneInDrawer(drawerMilestone.id)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 ${
                    drawerMilestone.completed
                      ? isDark
                        ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                        : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                      : isDark
                      ? 'bg-violet-600/10 border-violet-500/20 text-violet-300 hover:bg-violet-500/20'
                      : 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100'
                  }`}
                >
                  <CheckCircle2 size={14} />
                  {drawerMilestone.completed ? 'Mark Step Incomplete' : 'Mark Step Completed'}
                </button>

                <button
                  onClick={() => {
                    handleStartQuiz(drawerMilestone);
                    setDrawerMilestone(null);
                  }}
                  className={`w-full py-2.5 rounded-xl font-black text-xs text-white transition-all hover:scale-103 active:scale-97 flex items-center justify-center gap-2 ${
                    isDark ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : 'bg-gradient-to-r from-sky-500 to-sky-600'
                  }`}
                >
                  Take Checkpoint Quiz 📝
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
