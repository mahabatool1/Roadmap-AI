'use client';

import React, { useState, useEffect } from 'react';
import { useLearningStore } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import RightPanel from '@/components/RightPanel';
import HomeDashboard from '@/components/HomeDashboard';
import MySkills from '@/components/MySkills';
import HistoryView from '@/components/History';
import Roadmaps from '@/components/Roadmaps';
import Quizzes from '@/components/Quizzes';
import ProgressView from '@/components/Progress';
import StreaksView from '@/components/Streaks';
import AchievementsView from '@/components/Achievements';
import StudyPlanner from '@/components/StudyPlanner';
import RemindersView from '@/components/Reminders';
import SettingsView from '@/components/Settings';
import TeacherChat from '@/components/TeacherChat';
import FocusSession from '@/components/FocusSession';
import AuthModal from '@/components/AuthModal';
import NotificationToaster, { showToast } from '@/components/NotificationToaster';
import FirebaseSyncManager from '@/components/FirebaseSyncManager';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function MainPage() {
  const { theme, setUser } = useLearningStore();
  const [activeTab, setActiveTab] = useState('home');
  const [isFocusOpen, setIsFocusOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Client-side hydration safeguard
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Sync Firebase authentication status with the application state
  useEffect(() => {
    if (!mounted) return;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Scholar');
        showToast(`Authenticated successfully as ${firebaseUser.displayName || firebaseUser.email}`, 'success');
      } else {
        setUser('Guest');
      }
    });
    return () => unsubscribe();
  }, [mounted, setUser]);

  if (!mounted) {
    return (
      <div className="h-screen w-screen bg-[#0B0D19] flex flex-col gap-3 items-center justify-center text-slate-300 font-sans text-sm tracking-widest select-none">
        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 flex items-center justify-center bg-slate-950 animate-bounce">
          <img
            src="/logo.jpg"
            alt="RoadmapAI Logo"
            className="w-full h-full object-cover animate-pulse"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="font-extrabold animate-pulse uppercase text-[10px]">Initializing RoadmapAI Coach...</div>
      </div>
    );
  }

  const isDark = theme === 'dark';

  // Active Screen Selector Map
  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeDashboard onSetActiveTab={setActiveTab} />;
      case 'teacher':
        return <TeacherChat />;
      case 'skills':
        return <MySkills onSetActiveTab={setActiveTab} />;
      case 'history':
        return <HistoryView />;
      case 'roadmaps':
        return <Roadmaps onSetActiveTab={setActiveTab} />;
      case 'quizzes':
        return <Quizzes />;
      case 'progress':
        return <ProgressView />;
      case 'streaks':
        return <StreaksView />;
      case 'achievements':
        return <AchievementsView />;
      case 'planner':
        return <StudyPlanner />;
      case 'reminders':
        return <RemindersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <HomeDashboard onSetActiveTab={setActiveTab} />;
    }
  };

  return (
    <div
      id="app-container"
      className={`flex h-screen w-screen overflow-hidden transition-all duration-300 ${
        isDark ? 'bg-[#0B0D19] text-white' : 'bg-[#F4F6FA] text-slate-800'
      }`}
    >
      {/* 1. Left Persistent Sidebar Menu */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onOpenAuth={() => setIsAuthOpen(true)} />

      {/* 2. Central Active View Container */}
      <main className="flex-1 flex h-screen overflow-hidden">
        {renderActiveScreen()}
      </main>

      {/* 3. Right Context Panel (desktop sidebar, collapses or lists on right side) */}
      <RightPanel onStartFocus={() => setIsFocusOpen(true)} />

      {/* 4. Focus Study Timer modal overlay */}
      <FocusSession isOpen={isFocusOpen} onClose={() => setIsFocusOpen(false)} />

      {/* 5. Firebase Authentication Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* 6. Global Notifications Engine */}
      <NotificationToaster />

      {/* 7. Cloud Sync and Persistence Bridge */}
      <FirebaseSyncManager />
    </div>
  );
}

