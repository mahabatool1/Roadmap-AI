'use client';

import React, { useState, useEffect } from 'react';
import { useLearningStore } from '@/lib/store';
import {
  Home,
  MessageSquare,
  GraduationCap,
  History,
  Compass,
  CheckSquare,
  BarChart3,
  Flame,
  Trophy,
  Calendar,
  Bell,
  Settings,
  Moon,
  Sun,
  ChevronRight,
  User,
  LogOut,
  Edit2,
  CloudLightning,
  CloudOff,
  LogIn
} from 'lucide-react';
import { auth, logOut, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { showToast } from '@/components/NotificationToaster';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth?: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onOpenAuth }: SidebarProps) {
  const { theme, setTheme, user, setUser, resetAll, streak } = useLearningStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tempName, setTempName] = useState(user.name);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setCurrentUser(usr);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await logOut();
      showToast('Logged out successfully', 'info');
      setCurrentUser(null);
      setUser('Guest Student');
      setShowProfileModal(false);
    } catch (error: any) {
      showToast(error?.message || 'Failed to sign out', 'error');
    }
  };

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'teacher', label: 'AI Teacher', icon: MessageSquare },
    { id: 'skills', label: 'My Skills', icon: GraduationCap },
    { id: 'history', label: 'History', icon: History },
    { id: 'roadmaps', label: 'Roadmaps', icon: Compass },
    { id: 'quizzes', label: 'Quizzes', icon: CheckSquare },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'streaks', label: 'Streaks', icon: Flame, extra: streak.toString() },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'planner', label: 'Study Planner', icon: Calendar },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setUser(tempName.trim());
      setShowProfileModal(false);
    }
  };

  const isDark = theme === 'dark';

  const profileName = currentUser 
    ? (user.name && user.name !== 'Ezza' && user.name !== 'Guest' ? user.name : (currentUser.displayName || currentUser.email?.split('@')[0] || 'Scholar'))
    : 'Guest';

  const profilePic = currentUser?.photoURL || user.avatarUrl || '';

  return (
    <>
      <aside
        className={`w-64 h-screen flex flex-col justify-between border-r shrink-0 transition-all duration-300 ${
          isDark
            ? 'bg-[#111428] border-violet-500/10 text-slate-300'
            : 'bg-[#1E2243] border-slate-700/30 text-slate-300'
        }`}
      >
        {/* Top Branding Section */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg border border-slate-700/50 flex items-center justify-center bg-slate-950">
              <img
                src="/logo.jpg"
                alt="RoadmapAI Logo"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white tracking-wide font-sans flex items-center gap-1">
                RoadmapAI
              </h1>
              <span className={`text-[10px] uppercase font-bold tracking-widest ${
                isDark ? 'text-violet-400' : 'text-sky-400'
              }`}>
                Your AI Learning Coach
              </span>
            </div>
          </div>
        </div>

        {/* Middleware Navigation Menu */}
        <nav className="flex-1 px-4 overflow-y-auto space-y-1 py-4 scrollbar-thin">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                  isActive
                    ? isDark
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-950/40'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-950/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-500/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent
                    size={18}
                    className={`transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : isDark ? 'text-violet-400/80 group-hover:text-violet-400' : 'text-slate-400 group-hover:text-sky-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.extra && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                  }`}>
                    {item.extra}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section with Theme toggle & Profile */}
        <div className={`p-4 border-t ${isDark ? 'border-violet-500/10' : 'border-slate-700/30'}`}>
          {/* Theme Toggle */}
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs font-bold text-slate-400 tracking-wider">Dark Mode</span>
            <button
              onClick={toggleTheme}
              className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 relative ${
                isDark ? 'bg-violet-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white flex items-center justify-center transition-all duration-300 ${
                  isDark ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                {isDark ? <Moon size={11} className="text-violet-600" /> : <Sun size={11} className="text-slate-700" />}
              </div>
            </button>
          </div>

          {/* User Profile Badge */}
          {!currentUser ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenAuth) onOpenAuth();
                }}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs text-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  isDark 
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-950/20' 
                    : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700'
                }`}
              >
                <LogIn size={14} /> Sign In
              </button>
              
              <button
                onClick={() => {
                  if (onOpenAuth) onOpenAuth();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-500/10 transition-all duration-200 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 select-none uppercase ${
                      isDark ? 'bg-gradient-to-tr from-violet-600 to-fuchsia-600 border-violet-400' : 'bg-gradient-to-tr from-sky-400 to-indigo-500 border-sky-300'
                    }`}>
                      GU
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-[#111428] bg-slate-500 rounded-full"></div>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate">Guest mode</p>
                    <p className="text-[10px] text-slate-400 truncate">Connect to save history</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTempName(profileName);
                setShowProfileModal(true);
                setShowResetConfirm(false);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-500/10 transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  {profilePic ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-violet-400 flex items-center justify-center">
                      <img
                        src={profilePic}
                        alt={profileName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 select-none uppercase ${
                      isDark ? 'bg-gradient-to-tr from-violet-600 to-fuchsia-600 border-violet-400' : 'bg-gradient-to-tr from-sky-400 to-indigo-500 border-sky-300'
                    }`}>
                      {profileName.slice(0, 2)}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-2 border-[#111428] rounded-full bg-green-500"></div>
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">{profileName}</p>
                  <p className="text-[11px] text-slate-400 truncate">View Profile</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          )}
        </div>
      </aside>

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl relative ${
            isDark ? 'bg-[#121631] border-violet-500/20 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <h3 className="text-lg font-bold mb-4">Edit Profile Context</h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">
                  Student Name
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-sm font-semibold outline-none focus:ring-2 ${
                    isDark
                      ? 'bg-violet-950/20 border-violet-500/30 text-white focus:ring-violet-500/40'
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-sky-500/40'
                  }`}
                  placeholder="E.g., Ezza, Maha"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className={`px-4 py-2 text-sm rounded-xl font-bold border ${
                    isDark
                      ? 'border-violet-500/20 text-violet-300 hover:bg-violet-500/10'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95 ${
                    isDark ? 'bg-violet-600 hover:bg-violet-500' : 'bg-sky-500 hover:bg-sky-600'
                  }`}
                >
                  Save Profile
                </button>
              </div>

              {/* Cloud Backup and Cloud Sync Status Block */}
              <div className="pt-4 border-t border-slate-500/15">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-400 flex items-center gap-1.5">
                  {currentUser ? <CloudLightning size={12} className="text-green-400 animate-pulse" /> : <CloudOff size={12} className="text-slate-500" />}
                  Cloud Backup & Sync
                </label>
                {currentUser ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-green-500/10 border border-green-500/20 p-2.5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[11px] font-semibold text-green-400 truncate">
                          Synced: {currentUser.email}
                        </span>
                      </div>
                      <span className="text-[9px] bg-green-500/20 text-green-300 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Active
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-400 hover:bg-red-500/5 text-xs font-bold transition-all"
                    >
                      Disconnect & Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Connect your account to back up and synchronize all your customized roadmaps, milestones, and daily study statistics in the cloud.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileModal(false);
                        if (onOpenAuth) onOpenAuth();
                      }}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        isDark ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-sky-500 hover:bg-sky-600'
                      }`}
                    >
                      Connect & Sync Now
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-500/15">
                {!showResetConfirm ? (
                  <button
                    type="button"
                    id="reset-study-account-btn"
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all"
                  >
                    <LogOut size={12} /> Reset Study Account
                  </button>
                ) : (
                  <div className={`p-3 rounded-xl border space-y-3 transition-all duration-300 ${
                    isDark 
                      ? 'bg-red-500/10 border-red-500/20 text-red-200' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <p className="text-[11px] font-bold leading-normal">
                      ⚠️ Are you absolutely sure? This will permanently reset all learning history, streaks, custom roadmaps, and plans to default.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        id="cancel-reset-btn"
                        onClick={() => setShowResetConfirm(false)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border ${
                          isDark
                            ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        id="confirm-reset-btn"
                        onClick={async () => {
                          const currentUser = auth.currentUser;
                          if (currentUser) {
                            try {
                              const userRef = doc(db, 'users', currentUser.uid);
                              await setDoc(userRef, {
                                name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Scholar',
                                avatarUrl: currentUser.photoURL || '',
                                streak: 0,
                                badges: [],
                                dailyHoursGoal: 4.0,
                                hoursLoggedToday: 0,
                                upcomingSession: {
                                  time: '',
                                  topic: '',
                                  durationMin: 0
                                },
                                updatedAt: new Date().toISOString()
                              });
                            } catch (e) {
                              console.error('Error resetting database records:', e);
                            }
                          }
                          resetAll();
                          setShowResetConfirm(false);
                          setShowProfileModal(false);
                          showToast('Study account reset successfully!', 'success');
                          setTimeout(() => {
                            window.location.reload();
                          }, 300);
                        }}
                        className="px-3 py-1.5 text-[10px] font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all active:scale-95"
                      >
                        Yes, Reset
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
}
