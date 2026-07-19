'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Info, CheckCircle, AlertTriangle, X, ShieldAlert } from 'lucide-react';
import { sendBrowserNotification, getNotificationPermission } from '@/lib/browserNotification';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Global hook / event-listener pattern to trigger toasts from anywhere in the codebase!
let toastListener: ((toast: Omit<ToastItem, 'id'>) => void) | null = null;

export function showToast(message: string, type: ToastType = 'success', duration = 4000) {
  if (toastListener) {
    toastListener({ message, type, duration });
  } else {
    console.log(`[Toast Fallback] ${type.toUpperCase()}: ${message}`);
  }
}

export default function NotificationToaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastTriggeredRef = useRef<string | null>(null);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    toastListener = (newToast) => {
      const id = Math.random().toString(36).substring(2, 9);
      const toastItem: ToastItem = { ...newToast, id };
      
      setToasts((prev) => [...prev, toastItem]);

      const duration = newToast.duration ?? 4000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    };

    return () => {
      toastListener = null;
    };
  }, []);

  // Helper parser for study time configuration
  const parseTime = (timeStr: string): { hours: number; minutes: number } | null => {
    const clean = timeStr.trim().toUpperCase();
    
    // Match 12-hour formats like "07:00 PM", "7:30 AM", "7 PM", "7PM"
    const match12 = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
      const ampm = match12[3];
      
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return { hours, minutes };
    }
    
    // Match 24-hour formats like "19:00", "07:30", "19"
    const match24 = clean.match(/^(\d{1,2})(?::(\d{2}))?$/);
    if (match24) {
      const hours = parseInt(match24[1], 10);
      const minutes = match24[2] ? parseInt(match24[2], 10) : 0;
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        return { hours, minutes };
      }
    }
    
    return null;
  };

  // Background reminder ticking effect (runs every 10 seconds for real-time responsiveness)
  useEffect(() => {
    const checkReminders = () => {
      if (typeof window === 'undefined') return;

      const enabled = localStorage.getItem('study-reminders-enabled') !== 'false';
      if (!enabled) return;

      const reminderTime = localStorage.getItem('study-reminders-time') || '07:00 PM';
      const parsed = parseTime(reminderTime);
      if (!parsed) return;

      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();

      if (currentHours === parsed.hours && currentMinutes === parsed.minutes) {
        const todayDateString = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${currentHours}-${currentMinutes}`;
        if (lastTriggeredRef.current === todayDateString) {
          // Already triggered this minute
          return;
        }

        lastTriggeredRef.current = todayDateString;

        // Trigger in-app toast
        showToast('Daily Study Reminder! 📚 Time to start your learning path!', 'info', 6000);

        // Trigger real-time browser desktop alert
        const browserEnabled = localStorage.getItem('study-browser-notifications-enabled') === 'true';
        if (browserEnabled && getNotificationPermission() === 'granted') {
          sendBrowserNotification(
            'Daily Study Time! 📚',
            'Your scheduled study slot has arrived. Open RoadmapAI to resume your learning path and smash your goals!'
          );
        }
      }
    };

    // Run immediately on mount, then check every 15 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 15000);

    return () => clearInterval(interval);
  }, []);


  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'error':
        return <ShieldAlert className="h-5 w-5 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-indigo-400" />;
    }
  };

  const getColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-[#0E1B1B] border-emerald-500/20 text-emerald-200 shadow-[0_4px_20px_rgba(16,185,129,0.15)]';
      case 'error':
        return 'bg-[#1D1115] border-rose-500/20 text-rose-200 shadow-[0_4px_20px_rgba(244,63,94,0.15)]';
      case 'warning':
        return 'bg-[#1C1711] border-amber-500/20 text-amber-200 shadow-[0_4px_20px_rgba(245,158,11,0.15)]';
      case 'info':
      default:
        return 'bg-[#0E1120] border-indigo-500/20 text-indigo-200 shadow-[0_4px_20px_rgba(99,102,241,0.15)]';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 backdrop-blur-md transition-all ${getColors(
              toast.type
            )}`}
          >
            {/* Type Specific Icon */}
            <div className="shrink-0 mt-0.5">{getIcon(toast.type)}</div>

            {/* Content Text */}
            <div className="flex-1 text-xs leading-relaxed font-sans font-medium">
              {toast.message}
            </div>

            {/* Individual Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-800/40 hover:text-white transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
