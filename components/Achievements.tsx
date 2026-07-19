'use client';

import React, { useState, useEffect } from 'react';
import { useLearningStore } from '@/lib/store';
import { 
  Trophy, 
  Award, 
  Star, 
  Compass, 
  Sparkles, 
  Moon, 
  Zap, 
  Flame, 
  Sword, 
  X, 
  RotateCcw, 
  CheckCircle, 
  Lock, 
  Unlock,
  Play,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
}

interface BadgeItem {
  name: string;
  desc: string;
  iconType: string;
  colorClass: string;
  accentColor: string;
}

export default function AchievementsView() {
  const { theme, roadmaps, badges, unlockBadge, toggleBadge } = useLearningStore();
  const isDark = theme === 'dark';

  // Construct dynamic timeline items from actual roadmaps
  const timelineItems: Array<{
    title: string;
    desc: string;
    status: 'Completed' | 'In Progress';
    color: string;
  }> = [];

  roadmaps.forEach((r) => {
    r.milestones.forEach((m) => {
      if (m.completed) {
        timelineItems.push({
          title: `${r.title}: ${m.title}`,
          desc: m.description,
          status: 'Completed',
          color: 'bg-indigo-400'
        });
      }
    });
  });

  // Also grab up to 2 in-progress/uncompleted milestones to show as "In Progress"
  let inProgressCount = 0;
  roadmaps.forEach((r) => {
    r.milestones.forEach((m) => {
      if (!m.completed && inProgressCount < 2) {
        timelineItems.push({
          title: `${r.title}: ${m.title}`,
          desc: m.description,
          status: 'In Progress',
          color: 'bg-slate-500 animate-pulse'
        });
        inProgressCount++;
      }
    });
  });

  // Modal / Celebration states
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);
  const [celebrationBadge, setCelebrationBadge] = useState<BadgeItem | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [milestoneCelebration, setMilestoneCelebration] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Full Badge List
  const badgeCatalog: BadgeItem[] = [
    { 
      name: 'Pioneer', 
      desc: 'Started your very first custom generated technical learning roadmap.', 
      iconType: 'compass', 
      colorClass: 'from-amber-500/20 to-yellow-600/10 border-yellow-500/20 text-yellow-400',
      accentColor: '#f59e0b'
    },
    { 
      name: 'Night Owl', 
      desc: 'Focused and logged study session hours after 9:00 PM.', 
      iconType: 'moon', 
      colorClass: 'from-indigo-500/20 to-purple-600/10 border-indigo-500/20 text-indigo-400',
      accentColor: '#6366f1'
    },
    { 
      name: 'Fast Learner', 
      desc: 'Completed 3 structural milestones within a single learning day.', 
      iconType: 'zap', 
      colorClass: 'from-orange-500/20 to-red-600/10 border-orange-500/20 text-orange-400',
      accentColor: '#f97316'
    },
    { 
      name: 'Quiz Whiz', 
      desc: 'Achieved a perfect 100% score on any module checkpoint quiz.', 
      iconType: 'award', 
      colorClass: 'from-rose-500/20 to-pink-600/10 border-rose-500/20 text-rose-400',
      accentColor: '#f43f5e'
    },
    { 
      name: 'JS Adventurer', 
      desc: 'Unlocked the core Fundamentals of modern JavaScript.', 
      iconType: 'trophy', 
      colorClass: 'from-cyan-500/20 to-sky-600/10 border-cyan-500/20 text-cyan-400',
      accentColor: '#06b6d4'
    },
    { 
      name: 'Consistency King', 
      desc: 'Maintained a study streak of 10 days or longer.', 
      iconType: 'flame', 
      colorClass: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/20 text-emerald-400',
      accentColor: '#10b981'
    },
    { 
      name: 'Weakness Slayer', 
      desc: 'Retook and cleared a failed quiz module with a score of 80% or more.', 
      iconType: 'sword', 
      colorClass: 'from-violet-500/20 to-fuchsia-600/10 border-violet-500/20 text-violet-400',
      accentColor: '#8b5cf6'
    },
    { 
      name: 'Specialization Master', 
      desc: 'Mastered all sequential milestones across an entire curriculum.', 
      iconType: 'sparkles', 
      colorClass: 'from-pink-500/20 to-fuchsia-600/10 border-pink-500/20 text-pink-400',
      accentColor: '#ec4899'
    },
  ];

  // Synthesis chimes using Web Audio API
  const playUnlockChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playTone = (freq: number, start: number, duration: number, type: 'sine' | 'triangle' | 'sawtooth' = 'sine') => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(0.25, start + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      const now = ctx.currentTime;
      // Celebratory ascending arpeggio
      playTone(523.25, now, 0.4, 'sine');       // C5
      playTone(659.25, now + 0.08, 0.4, 'sine');  // E5
      playTone(783.99, now + 0.16, 0.4, 'sine');  // G5
      playTone(1046.50, now + 0.24, 0.6, 'sine'); // C6
      
      // Warm layered resonance
      playTone(1046.50, now + 0.24, 0.3, 'triangle');
    } catch (e) {
      console.warn('Audio failed:', e);
    }
  };

  const playMilestoneChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(0.2, start + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      const now = ctx.currentTime;
      // Dynamic happy cadence
      playTone(587.33, now, 0.25); // D5
      playTone(659.25, now + 0.12, 0.25); // E5
      playTone(880.00, now + 0.24, 0.5); // A5
    } catch (e) {
      console.warn('Audio failed:', e);
    }
  };

  // Generate particle explosion data
  const triggerParticles = (color: string) => {
    const arr: Particle[] = [];
    const colors = [color, '#ffffff', '#f59e0b', '#38bdf8', '#a78bfa', '#f43f5e'];
    
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 200;
      arr.push({
        id: Math.random(),
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed - 20, // offset upward slightly
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 10,
        rotation: Math.random() * 360
      });
    }
    setParticles(arr);
  };

  const handleUnlockBadge = (badge: BadgeItem) => {
    unlockBadge(badge.name);
    setSelectedBadge(null);
    setCelebrationBadge(badge);
    triggerParticles(badge.accentColor);
    playUnlockChime();
  };

  const handleToggleBadgeState = (badge: BadgeItem) => {
    toggleBadge(badge.name);
    // Refresh modal states
    setSelectedBadge(prev => prev && prev.name === badge.name ? { ...badge } : null);
  };

  const handleSimulateMilestone = () => {
    setMilestoneCelebration(true);
    triggerParticles('#10b981');
    playMilestoneChime();
    setTimeout(() => {
      setMilestoneCelebration(false);
    }, 4000);
  };

  const getBadgeIcon = (type: string, size = 24) => {
    switch (type) {
      case 'compass': return <Compass size={size} />;
      case 'moon': return <Moon size={size} />;
      case 'zap': return <Zap size={size} />;
      case 'award': return <Award size={size} />;
      case 'flame': return <Flame size={size} />;
      case 'sword': return <Sword size={size} />;
      case 'sparkles': return <Sparkles size={size} />;
      default: return <Trophy size={size} />;
    }
  };

  const unlockedCount = badgeCatalog.filter(b => badges.includes(b.name)).length;

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto h-screen scrollbar-thin relative" id="achievements-container">
      
      {/* Top Header / Actions Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="achievements-header">
        <div>
          <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Achievements & Micro-Certificates
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Earn specialized micro-credentials, explore unlocked badges, and review sequential course milestones.
          </p>
        </div>

        {/* Audio feedback indicator & fast simulator */}
        <div className="flex items-center gap-3">
          <button
            id="toggle-audio-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
              soundEnabled 
                ? isDark ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-sky-500/10 border-sky-200 text-sky-600'
                : 'bg-slate-500/5 border-slate-500/10 text-slate-400'
            }`}
            title={soundEnabled ? "Mute audio" : "Unmute audio"}
          >
            <Volume2 size={18} className={soundEnabled ? 'animate-pulse' : ''} />
          </button>

          <button
            id="simulate-milestone-btn"
            onClick={handleSimulateMilestone}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm ${
              isDark 
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-violet-500/30' 
                : 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white shadow-sky-100'
            }`}
          >
            <Play size={13} /> Simulate Milestone Unlock
          </button>
        </div>
      </div>

      {/* Progress Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="achievements-progress-row">
        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2">Unlocked Badges</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">{unlockedCount}</span>
            <span className="text-slate-400 text-xs">/ {badgeCatalog.length} completed</span>
          </div>
          <div className="w-full bg-slate-500/10 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000"
              style={{ width: `${(unlockedCount / badgeCatalog.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2">Mastery Rank</h4>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${isDark ? 'text-violet-400' : 'text-sky-600'}`}>
              {unlockedCount >= 8 ? 'Grandmaster' : unlockedCount >= 5 ? 'Specialist' : unlockedCount >= 2 ? 'Initiate' : 'Pioneer'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Unlock {Math.max(0, 5 - unlockedCount)} more badges to elevate your mastery status.</p>
        </div>

        <div className={`p-5 rounded-2xl border ${isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
          <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 mb-2">Gamified XP Multiplier</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{(1.0 + unlockedCount * 0.1).toFixed(1)}x</span>
            <span className="text-slate-400 text-xs">bonus points active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Each badge increases generated AI module score multipliers by +0.1x.</p>
        </div>
      </div>

      {/* Main Grid of Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="badges-catalog-grid">
        {badgeCatalog.map((badge, idx) => {
          const isUnlocked = badges.includes(badge.name);
          return (
            <motion.div
              key={badge.name}
              id={`badge-card-${badge.name.replace(/\s+/g, '-').toLowerCase()}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={isUnlocked ? { scale: 1.03, y: -2 } : { scale: 1.01 }}
              onClick={() => setSelectedBadge(badge)}
              className={`p-5 rounded-2xl border flex flex-col justify-between h-48 cursor-pointer transition-all ${
                isUnlocked
                  ? isDark
                    ? `bg-gradient-to-br ${badge.colorClass} hover:shadow-[0_8px_30px_rgb(139,92,246,0.1)]`
                    : 'bg-white border-slate-200 text-slate-800 shadow-sm hover:shadow-md'
                  : 'bg-slate-500/5 border-dashed border-slate-300/10 hover:border-slate-400/20 opacity-40 select-none'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                  isUnlocked
                    ? isDark
                      ? 'bg-white/5 border-white/10'
                      : 'bg-slate-50 border-slate-100 text-slate-700'
                    : 'border-slate-500/10 text-slate-400'
                }`} style={{ color: isUnlocked ? badge.accentColor : undefined }}>
                  {getBadgeIcon(badge.iconType, 22)}
                </div>

                <div className="flex items-center gap-1">
                  {isUnlocked ? (
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      unlocked
                    </span>
                  ) : (
                    <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 flex items-center gap-1">
                      <Lock size={8} /> locked
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-sm tracking-tight">{badge.name}</h4>
                <p className="text-[11px] text-slate-400 leading-normal mt-1.5 line-clamp-2">{badge.desc}</p>
                
                <div className="mt-4 pt-3 border-t border-slate-500/5 flex items-center justify-between text-[10px] font-medium text-slate-400">
                  <span>Click to Inspect</span>
                  {isUnlocked ? (
                    <Sparkles size={11} className="text-amber-400 animate-pulse" />
                  ) : (
                    <Lock size={10} className="text-slate-500" />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Milestone Progress Timeline Section */}
      <div 
        id="achievements-timeline-section"
        className={`p-6 rounded-2xl border transition-all ${
          isDark ? 'bg-[#121631]/40 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-1.5">
          <Star size={15} className="text-amber-400" /> Dynamic Milestone Learning Journey
        </h3>

        <div className="relative pl-6 border-l border-slate-500/10 space-y-6">
          {timelineItems.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">
              No learning journey logs yet. Start working through milestones on your dashboard to see your progress here!
            </p>
          ) : (
            timelineItems.map((item, idx) => (
              <div key={idx} className="relative">
                <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-4 border-[#0f1123] ${item.color}`} />
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className={`font-bold text-xs ${item.status === 'In Progress' ? 'text-slate-300' : ''}`}>{item.title}</h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                  <span className={`text-[10px] font-mono ${item.status === 'In Progress' ? 'text-violet-400 font-bold animate-pulse' : 'text-slate-500'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- FLOATING DIALOGS / OVERLAYS --- */}
      <AnimatePresence>
        
        {/* Detail Inspector Modal */}
        {selectedBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" id="inspector-modal">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl border p-6 relative shadow-2xl ${
                isDark ? 'bg-[#0f1225] border-violet-500/20 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <button
                onClick={() => setSelectedBadge(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white transition-all bg-white/5"
              >
                <X size={15} />
              </button>

              <div className="text-center space-y-4">
                <div 
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border text-2xl"
                  style={{ 
                    backgroundColor: `${selectedBadge.accentColor}10`,
                    borderColor: `${selectedBadge.accentColor}30`,
                    color: selectedBadge.accentColor
                  }}
                >
                  {getBadgeIcon(selectedBadge.iconType, 32)}
                </div>

                <div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                    badges.includes(selectedBadge.name)
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-slate-500/10 text-slate-400'
                  }`}>
                    {badges.includes(selectedBadge.name) ? 'unlocked badge' : 'locked badge'}
                  </span>
                  <h3 className="text-lg font-black mt-3 tracking-tight">{selectedBadge.name}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{selectedBadge.desc}</p>
                </div>

                <div className={`p-4 rounded-xl text-left text-xs ${isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
                  <h5 className="font-bold mb-1 flex items-center gap-1.5 text-slate-400 text-[10px] uppercase tracking-wider">
                    <Star size={11} className="text-amber-400" /> Reward Details
                  </h5>
                  <p className="leading-relaxed">
                    Unlocking this credential grants you an extra 10% daily point boost, unlocking special customized AI comments on your daily logs.
                  </p>
                </div>

                <div className="pt-3 flex gap-3">
                  {badges.includes(selectedBadge.name) ? (
                    <>
                      <button
                        onClick={() => handleToggleBadgeState(selectedBadge)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border ${
                          isDark 
                            ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' 
                            : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        <RotateCcw size={12} /> Relock Badge (Reset)
                      </button>
                      <button
                        onClick={() => setSelectedBadge(null)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                          isDark ? 'bg-white/10 hover:bg-white/15 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        Done
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedBadge(null)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                          isDark ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUnlockBadge(selectedBadge)}
                        className="flex-1 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5"
                      >
                        <Unlock size={12} /> Unlock Badge Now!
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Grand Achievement Unlocked Celebration Popover */}
        {celebrationBadge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-hidden" id="celebration-overlay">
            
            {/* Visual Particle Explosion */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {particles.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
                  animate={{ 
                    x: p.x * 2.5, 
                    y: p.y * 2.5, 
                    scale: 0.2, 
                    opacity: 0,
                    rotate: p.rotation * 2
                  }}
                  transition={{ duration: 1.8, ease: 'easeOut' }}
                  className="absolute left-1/2 top-1/2 w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: p.color,
                    width: p.size,
                    height: p.size,
                    boxShadow: `0 0 10px ${p.color}`
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
              animate={{ scale: [0.3, 1.1, 1], opacity: 1, rotate: 0 }}
              transition={{ duration: 0.7, ease: 'backOut' }}
              className="w-full max-w-lg text-center relative p-8 rounded-3xl border shadow-2xl bg-gradient-to-b from-slate-950 to-[#0d0f21] border-amber-500/20 text-white"
            >
              {/* Grand Rotating Radial Spotlight Halo */}
              <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
              
              <div className="space-y-6">
                <motion.div
                  animate={{ 
                    rotateY: [0, 360],
                    scale: [1, 1.1, 1],
                    boxShadow: ['0 0 0px rgba(245,158,11,0)', '0 0 30px rgba(245,158,11,0.4)', '0 0 0px rgba(245,158,11,0)']
                  }}
                  transition={{ repeat: Infinity, duration: 3, repeatDelay: 1 }}
                  className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center border text-4xl"
                  style={{ 
                    backgroundColor: `${celebrationBadge.accentColor}20`,
                    borderColor: `${celebrationBadge.accentColor}55`,
                    color: celebrationBadge.accentColor
                  }}
                >
                  {getBadgeIcon(celebrationBadge.iconType, 48)}
                </motion.div>

                <div className="space-y-2">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center gap-1 text-amber-400"
                  >
                    <Star size={16} className="animate-bounce" />
                    <Star size={16} style={{ animationDelay: '0.1s' }} className="animate-bounce" />
                    <Star size={16} style={{ animationDelay: '0.2s' }} className="animate-bounce" />
                  </motion.div>
                  
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-500 tracking-tight"
                  >
                    ACHIEVEMENT UNLOCKED!
                  </motion.h2>

                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-slate-400 text-xs px-6"
                  >
                    Fantastic effort! Your dedication has rewarded you with the prestigious <span className="font-extrabold text-white">{celebrationBadge.name}</span> micro-credential.
                  </motion.p>
                </div>

                {/* Badge card inside celebration popover */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm max-w-sm mx-auto text-left"
                >
                  <h4 className="font-extrabold text-sm">{celebrationBadge.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{celebrationBadge.desc}</p>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="pt-2"
                >
                  <button
                    onClick={() => setCelebrationBadge(null)}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 text-xs font-black tracking-wider uppercase transition-all shadow-xl shadow-amber-500/10 hover:scale-105"
                  >
                    Incredible, close
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Milestone Completed Banner Animation */}
        {milestoneCelebration && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md p-4 rounded-2xl border bg-slate-950/90 border-emerald-500/20 shadow-2xl backdrop-blur-md flex items-center gap-3.5"
            id="milestone-completed-alert"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0">
              <CheckCircle size={22} className="animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h5 className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1">
                Milestone Complete! <Sparkles size={12} className="text-amber-400" />
              </h5>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                Simulated Roadmap module completed! Hours & streak incremented.
              </p>
            </div>

            <button
              onClick={() => setMilestoneCelebration(false)}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
