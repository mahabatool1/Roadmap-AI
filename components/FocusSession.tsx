'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLearningStore } from '@/lib/store';
import { Play, Pause, RotateCcw, CheckCircle, X, Clock } from 'lucide-react';
import { sendBrowserNotification } from '@/lib/browserNotification';
import { showToast } from '@/components/NotificationToaster';

interface FocusSessionProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FocusSession({ isOpen, onClose }: FocusSessionProps) {
  const { upcomingSession, logHoursToday, theme } = useLearningStore();
  const [timeLeft, setTimeLeft] = useState(upcomingSession.durationMin * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSeconds = upcomingSession.durationMin * 60;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  // Initialize time when modal opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeLeft(upcomingSession.durationMin * 60);
      setIsRunning(false);
      setIsCompleted(false);
    }
  }, [isOpen, upcomingSession.durationMin]);

  // Trigger browser notification and toast upon completion
  useEffect(() => {
    if (isCompleted) {
      sendBrowserNotification(
        'Focus Session Completed! 🎉',
        `Excellent job finishing your session on: ${upcomingSession.topic || 'your roadmap topic'}!`
      );
      showToast(`Focus Session Completed! Excellent job!`, 'success');
    }
  }, [isCompleted, upcomingSession.topic]);

  // Timer countdown hook
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);


  if (!isOpen) return null;

  const handleToggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(upcomingSession.durationMin * 60);
    setIsCompleted(false);
  };

  const handleCompleteEarly = () => {
    setIsRunning(false);
    setIsCompleted(true);
    setTimeLeft(0);
  };

  const handleSaveHours = () => {
    // Math breakdown of duration spent
    const minutesSpent = Math.floor((totalSeconds - timeLeft) / 60);
    const hoursSpent = parseFloat((minutesSpent / 60).toFixed(2)) || 0.1;
    logHoursToday(hoursSpent);
    onClose();
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl relative transition-all duration-300 ${
          isDark
            ? 'bg-[#121631] border-violet-500/20 text-white'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-500/10 transition-colors ${
            isDark ? 'text-violet-300' : 'text-slate-400'
          }`}
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 ${
              isDark ? 'bg-violet-500/15 text-violet-400' : 'bg-sky-500/10 text-sky-600'
            }`}
          >
            <Clock size={12} className="animate-pulse" /> Focus Zone
          </span>
          <h3 className="text-xl font-bold tracking-tight">Active Study Session</h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Studying: <strong className={isDark ? 'text-violet-300' : 'text-sky-600'}>{upcomingSession.topic}</strong>
          </p>
        </div>

        {/* Circular Timer Visual */}
        <div className="flex justify-center my-8">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG Circle Track and Fill */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="86"
                className={`${isDark ? 'stroke-slate-800' : 'stroke-slate-100'}`}
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="96"
                cy="96"
                r="86"
                className={`transition-all duration-1000 ${
                  isDark ? 'stroke-violet-500' : 'stroke-sky-500'
                }`}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={540}
                strokeDashoffset={540 - (540 * (progressPercent || 1)) / 100}
                strokeLinecap="round"
              />
            </svg>

            {/* Time Indicators */}
            <div className="absolute text-center select-none">
              {!isCompleted ? (
                <>
                  <div className="text-4xl font-extrabold tracking-mono">
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                  </div>
                  <div className={`text-xs mt-1 uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isRunning ? 'Flowing...' : 'Paused'}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <CheckCircle size={42} className={isDark ? 'text-violet-400 animate-bounce' : 'text-sky-500 animate-bounce'} />
                  <span className="text-lg font-bold mt-2">Well Done!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        {!isCompleted ? (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={handleResetTimer}
              className={`p-3 rounded-full border transition-all hover:scale-105 active:scale-95 ${
                isDark
                  ? 'border-violet-500/20 bg-violet-950/20 hover:bg-violet-900/30 text-violet-300'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
              title="Reset timer"
            >
              <RotateCcw size={20} />
            </button>

            <button
              onClick={handleToggleTimer}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 text-white ${
                isDark
                  ? 'bg-violet-600 hover:bg-violet-500 shadow-violet-950/50'
                  : 'bg-sky-500 hover:bg-sky-600 shadow-sky-200'
              }`}
            >
              {isRunning ? <Pause size={28} /> : <Play size={28} className="translate-x-0.5" />}
            </button>

            <button
              onClick={handleCompleteEarly}
              className={`p-3 rounded-full border transition-all hover:scale-105 active:scale-95 ${
                isDark
                  ? 'border-violet-500/20 bg-violet-950/20 hover:bg-violet-900/30 text-violet-300'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
              title="Complete early"
            >
              <CheckCircle size={20} />
            </button>
          </div>
        ) : (
          <div className="mt-6 text-center animate-fade-in">
            <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Ready to log your focus session? We will add the focused time to your daily progress goal tracker.
            </p>
            <button
              onClick={handleSaveHours}
              className={`w-full py-3 px-4 rounded-xl font-bold transition-all shadow-md hover:scale-[1.02] active:scale-98 text-white ${
                isDark
                  ? 'bg-violet-600 hover:bg-violet-500 shadow-violet-900/20'
                  : 'bg-sky-500 hover:bg-sky-600 shadow-sky-200'
              }`}
            >
              Log Session & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
