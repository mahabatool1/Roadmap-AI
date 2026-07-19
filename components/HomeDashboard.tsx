'use client';

import React, { useState, useEffect } from 'react';
import { useLearningStore, Roadmap } from '@/lib/store';
import { Compass, BookOpen, Flame, Trophy, Search, Loader2, Sparkles, BookOpenCheck } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface HomeDashboardProps {
  onSetActiveTab: (tab: string) => void;
}

export default function HomeDashboard({ onSetActiveTab }: HomeDashboardProps) {
  const {
    theme,
    user,
    roadmaps,
    activeRoadmapId,
    setActiveRoadmapId,
    streak,
    badges,
    weakAreas,
    addRoadmap
  } = useLearningStore();

  const [searchTopic, setSearchTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setCurrentUser(usr);
    });
    return () => unsubscribe();
  }, []);

  const isDark = theme === 'dark';

  const displayName = currentUser 
    ? (user.name && user.name !== 'Ezza' && user.name !== 'Guest' ? user.name : (currentUser.displayName || currentUser.email?.split('@')[0] || 'Scholar'))
    : 'Guest';

  // Category pills shortcuts
  const popularPills = ['Python', 'JavaScript', 'Data Science', 'UI/UX Design', 'C++', 'Cyber Security'];

  // Calculate Overall Progress
  const totalMilestones = roadmaps.reduce((acc, r) => acc + r.milestones.length, 0);
  const completedMilestones = roadmaps.reduce(
    (acc, r) => acc + r.milestones.filter((m) => m.completed).length,
    0
  );
  const overallProgressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  // Handle roadmap generation trigger
  const handleGenerateRoadmap = async (topicStr: string) => {
    if (!topicStr.trim()) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-roadmap',
          payload: { topic: topicStr.trim() }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reach AI Roadmap Generator on the server.');
      }

      const generatedData = await response.json();
      
      if (generatedData.error) {
        throw new Error(generatedData.error);
      }

      // Add generated course back into local storage store
      const newId = addRoadmap({
        title: generatedData.title,
        description: generatedData.description,
        durationHrs: generatedData.durationHrs || 10,
        milestones: generatedData.milestones.map((m: any) => ({
          ...m,
          completed: false
        }))
      });

      // Navigate to detailed study view of the course
      setActiveRoadmapId(newId);
      onSetActiveTab('roadmaps');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong while generating the roadmap.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGenerateRoadmap(searchTopic);
  };

  // Switch to specific course detailed study
  const handleContinueCourse = (roadmapId: string) => {
    setActiveRoadmapId(roadmapId);
    onSetActiveTab('roadmaps');
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto h-screen scrollbar-thin">
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-6 animate-fade-in">
          <div className="relative flex flex-col items-center">
            <Loader2 size={50} className={`animate-spin mb-4 ${isDark ? 'text-violet-400' : 'text-sky-400'}`} />
            <Sparkles size={24} className="absolute -top-3 -right-3 text-yellow-300 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold tracking-tight mb-2">Analyzing Topic...</h3>
          <p className="text-sm text-slate-400 text-center max-w-sm">
            Our server-side Gemini 1.5/3.5 engine is breaking down <strong className="text-white">&quot;{searchTopic}&quot;</strong> into sequential milestones, resource links, and target concepts...
          </p>
          <div className="mt-8 flex gap-2">
            <span className="w-2.5 h-2.5 bg-violet-500 rounded-full animate-bounce"></span>
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2.5 h-2.5 bg-fuchsia-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
        </div>
      )}

      {/* Greeting Header */}
      <div>
        <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Welcome back, {displayName}! 👋
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          What do you want to learn today? Enter any topic below to build a dynamic AI path.
        </p>
      </div>

      {/* Global AI Discovery Search Box */}
      <div
        className={`rounded-2xl border p-6 text-center overflow-hidden relative shadow-md ${
          isDark
            ? 'bg-gradient-to-br from-[#121631] via-[#111428] to-[#121631] border-violet-500/10'
            : 'bg-gradient-to-br from-white via-slate-50 to-white border-slate-200 shadow-sky-100/30'
        }`}
      >
        <div className="max-w-xl mx-auto space-y-4">
          <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-violet-200' : 'text-slate-700'}`}>
            What do you want to learn?
          </h3>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 relative">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                placeholder="e.g. Machine Learning, Python, Web Development..."
                className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm font-semibold outline-none border transition-all ${
                  isDark
                    ? 'bg-violet-950/20 border-violet-500/20 text-white placeholder-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={!searchTopic.trim()}
              className={`px-5 py-3 rounded-xl font-bold text-sm text-white flex items-center gap-1.5 transition-all shadow-md active:scale-97 disabled:opacity-50 ${
                isDark
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-950/40'
                  : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-sky-100'
              }`}
            >
              Generate Roadmap ✨
            </button>
          </form>

          {errorMsg && <p className="text-xs text-red-400 font-bold mt-1">{errorMsg}</p>}

          {/* Shortcut Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Popular:</span>
            {popularPills.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => {
                  setSearchTopic(pill);
                  handleGenerateRoadmap(pill);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${
                  isDark
                    ? 'border-violet-500/10 bg-violet-950/20 text-violet-300 hover:bg-violet-900/30'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Ribbon (Metric Ribbon Layer) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak Counter */}
        <div
          onClick={() => onSetActiveTab('streaks')}
          className={`rounded-2xl border p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:scale-[1.02] active:scale-98 transition-all duration-200 ${
            isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
            <Flame className="text-orange-500" size={24} fill="currentColor" />
          </div>
          <div>
            <span className="text-2xl font-black block tracking-tight">{streak}</span>
            <span className="text-xs font-bold text-slate-400">Day Streak</span>
            <p className="text-[10px] text-orange-400 font-bold mt-0.5">Keep it up! 🔥</p>
          </div>
        </div>

        {/* Overall Progress */}
        <div
          onClick={() => onSetActiveTab('progress')}
          className={`rounded-2xl border p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:scale-[1.02] active:scale-98 transition-all duration-200 ${
            isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <BookOpenCheck className="text-indigo-400" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-2xl font-black block tracking-tight">{overallProgressPercent}%</span>
            <span className="text-xs font-bold text-slate-400">Overall Progress</span>
            
            {/* Visual Mini Progress Bar */}
            <div className="w-full bg-slate-500/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${isDark ? 'bg-violet-500' : 'bg-sky-500'}`}
                style={{ width: `${overallProgressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Active Modules Indicator */}
        <div
          onClick={() => onSetActiveTab('roadmaps')}
          className={`rounded-2xl border p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:scale-[1.02] active:scale-98 transition-all duration-200 ${
            isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
            <BookOpen className="text-green-400" size={24} />
          </div>
          <div>
            <span className="text-2xl font-black block tracking-tight">{roadmaps.length}</span>
            <span className="text-xs font-bold text-slate-400">Skills Learning</span>
            <p className="text-[10px] text-green-400 font-bold mt-0.5">You&apos;re doing great! 🌟</p>
          </div>
        </div>

        {/* Badges Element */}
        <div
          onClick={() => onSetActiveTab('achievements')}
          className={`rounded-2xl border p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:scale-[1.02] active:scale-98 transition-all duration-200 ${
            isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
            <Trophy className="text-yellow-400" size={24} />
          </div>
          <div>
            <span className="text-2xl font-black block tracking-tight">{badges.length}</span>
            <span className="text-xs font-bold text-slate-400">Badges Earned</span>
            <p className="text-[10px] text-yellow-500 font-bold mt-0.5">Amazing work! 🏆</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active Progress Monitors ("Continue Learning") */}
        <div
          className={`rounded-2xl border p-5 shadow-sm xl:col-span-2 relative transition-all duration-300 ${
            isDark
              ? 'bg-[#121631]/60 border-violet-500/10 text-white'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400">Continue Learning</h3>
            <button
              onClick={() => onSetActiveTab('roadmaps')}
              className={`text-xs font-bold hover:underline ${isDark ? 'text-violet-400' : 'text-sky-500'}`}
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {roadmaps.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">
                You haven&apos;t generated any learning roadmaps yet. Use the search bar above to generate one instantly!
              </p>
            ) : (
              roadmaps.map((r) => {
                const completedCount = r.milestones.filter((m) => m.completed).length;
                const totalCount = r.milestones.length;
                const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                return (
                  <div
                    key={r.id}
                    className={`p-3.5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
                      isDark
                        ? 'bg-violet-950/10 border-violet-500/5 hover:border-violet-500/15'
                        : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{r.title}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 bg-slate-500/15 h-2 rounded-full overflow-hidden max-w-[240px]">
                          <div
                            className={`h-full rounded-full ${isDark ? 'bg-gradient-to-r from-violet-500 to-indigo-500' : 'bg-gradient-to-r from-sky-400 to-sky-500'}`}
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-400 whitespace-nowrap">
                          {progressPercent}% completed
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleContinueCourse(r.id)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs text-white transition-all hover:scale-105 active:scale-95 ${
                        isDark ? 'bg-violet-600 hover:bg-violet-500' : 'bg-sky-500 hover:bg-sky-600'
                      }`}
                    >
                      Continue
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* AI Motivation Box / Adaptive Motivation Block */}
        <div
          className={`rounded-2xl border p-5 shadow-sm relative transition-all duration-300 flex flex-col justify-between overflow-hidden ${
            isDark
              ? 'bg-gradient-to-b from-[#121631]/60 to-violet-950/20 border-violet-500/10 text-white'
              : 'bg-gradient-to-b from-white to-sky-50/20 border-slate-200 text-slate-800'
          }`}
        >
          <div>
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Sparkles size={14} className={isDark ? 'text-violet-400' : 'text-sky-500'} /> AI Motivation
            </h3>

            {weakAreas.length > 0 ? (
              /* Remediation State Quote */
              <div className="space-y-3 animate-fade-in">
                <div className="text-2xl font-serif text-violet-400 leading-none">“</div>
                <p className="text-xs font-semibold leading-relaxed text-slate-300 italic">
                  Don&apos;t worry about <strong className="text-orange-400">{weakAreas[0]}</strong>! Scored metrics indicate a small misunderstanding. Let&apos;s review the quiz explanations together, practice on key concepts, and retake the assessment. You can do it!
                </p>
                <div className="text-2xl font-serif text-violet-400 leading-none text-right">”</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-orange-400 mt-2 bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-500/15 w-fit">
                  ⚠️ Review weak topics
                </div>
              </div>
            ) : (
              /* Standard Encouragement Quote */
              <div className="space-y-3 animate-fade-in">
                <div className="text-2xl font-serif text-violet-400 leading-none">“</div>
                <p className="text-xs font-semibold leading-relaxed text-slate-300 italic">
                  Small progress every day adds up to big results. Consistency beats intensity. Keep pushing your limits!
                </p>
                <div className="text-2xl font-serif text-violet-400 leading-none text-right">”</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mt-2 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/15 w-fit">
                  🚀 Consistent Learning
                </div>
              </div>
            )}
          </div>

          {/* Animating Robot Visual */}
          <div className="flex justify-center mt-6">
            <div className="relative flex items-center justify-center">
              <div className={`absolute w-12 h-12 rounded-full animate-ping opacity-25 ${isDark ? 'bg-violet-500' : 'bg-sky-400'}`}></div>
              <span className="text-4xl select-none animate-bounce [animation-duration:3s]">🤖</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
