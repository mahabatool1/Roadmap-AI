'use client';

import React, { useState, useEffect } from 'react';
import { useLearningStore } from '@/lib/store';
import { Bell, Clock, Sparkles, Check, Monitor, Send } from 'lucide-react';
import { showToast } from '@/components/NotificationToaster';
import {
  isNotificationSupported,
  requestNotificationPermission,
  getNotificationPermission,
  sendBrowserNotification,
  isInIframe
} from '@/lib/browserNotification';

export default function RemindersView() {
  const { theme } = useLearningStore();
  const [remindersEnabled, setRemindersEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('study-reminders-enabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [reminderTime, setReminderTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('study-reminders-time');
      return saved || '07:00 PM';
    }
    return '07:00 PM';
  });
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('study-browser-notifications-enabled');
      return saved === 'true' && getNotificationPermission() === 'granted';
    }
    return false;
  });
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [supported] = useState(() => isNotificationSupported());
  const [inIframe] = useState(() => {
    if (typeof window !== 'undefined') {
      return isInIframe();
    }
    return false;
  });

  const isDark = theme === 'dark';


  const handleToggleBrowserNotifications = async () => {
    if (!isNotificationSupported()) {
      showToast('Browser notifications are not supported on your browser.', 'error');
      return;
    }

    if (browserNotificationsEnabled) {
      // Toggle off
      setBrowserNotificationsEnabled(false);
      localStorage.setItem('study-browser-notifications-enabled', 'false');
      showToast('Real-time browser notifications disabled.', 'info');
      return;
    }

    if (inIframe) {
      showToast('Browser security policy: Push notification prompts are blocked in iframes. Please open the app in a new tab!', 'warning', 10000);
    }

    const currentPermission = getNotificationPermission();
    if (currentPermission === 'granted') {
      setBrowserNotificationsEnabled(true);
      localStorage.setItem('study-browser-notifications-enabled', 'true');
      showToast('Real-time browser notifications activated!', 'success');
      sendBrowserNotification('Notifications Enabled! 🔔', 'You will now receive study reminders and focus session alerts.');
    } else if (currentPermission === 'denied') {
      if (inIframe) {
        showToast('Iframe restriction detected. Please click "Open in new tab" at the top right to enable notifications!', 'error', 12000);
      } else {
        showToast('Notification permission was denied. Please reset permissions in your browser settings.', 'warning');
      }
    } else {
      // Request permission
      try {
        const result = await requestNotificationPermission();
        if (result === 'granted') {
          setBrowserNotificationsEnabled(true);
          localStorage.setItem('study-browser-notifications-enabled', 'true');
          showToast('Real-time browser notifications activated!', 'success');
          sendBrowserNotification('Notifications Enabled! 🔔', 'You will now receive study reminders and focus session alerts.');
        } else {
          if (inIframe) {
            showToast('Iframe environment blocked permission request. Please click "Open in new tab"!', 'warning', 10000);
          } else {
            showToast('Notification permission was not granted.', 'warning');
          }
        }
      } catch (err) {
        console.error(err);
        if (inIframe) {
          showToast('Iframe context blocks Notification requests. Open in a new tab!', 'error', 10000);
        }
      }
    }
  };

  const handleTestNotification = () => {
    if (!isNotificationSupported()) {
      showToast('Browser notifications are not supported on your browser.', 'error');
      return;
    }

    const permission = getNotificationPermission();
    if (permission !== 'granted') {
      showToast('Please enable browser notifications above first.', 'warning');
      return;
    }

    sendBrowserNotification(
      'Test RoadmapAI Alert! 🚀',
      'This is a real-time browser notification. It will alert you when your study sessions start and end!'
    );
    showToast('Sent test browser notification!', 'success');
  };

  const handleSaveReminders = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to localStorage
    localStorage.setItem('study-reminders-enabled', String(remindersEnabled));
    localStorage.setItem('study-reminders-time', reminderTime);
    localStorage.setItem('study-browser-notifications-enabled', String(browserNotificationsEnabled));

    setShowSavedToast(true);
    showToast('Study reminder configuration updated successfully!', 'success');
    setTimeout(() => {
      setShowSavedToast(false);
    }, 3000);
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto h-screen scrollbar-thin">
      
      {/* Title */}
      <div>
        <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
          Study Reminders & Notifications
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Configure dynamic reminder slots and desktop push notifications to prompt consistency.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <form
          onSubmit={handleSaveReminders}
          className={`rounded-2xl border p-6 shadow-sm space-y-5 relative transition-all duration-300 ${
            isDark ? 'bg-[#121631]/60 border-violet-500/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}
        >
          <div className="text-center mb-6">
            <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center border mb-3 ${
              isDark ? 'bg-violet-500/10 border-violet-500/25 text-violet-400' : 'bg-sky-500/10 border-sky-300 text-sky-600'
            }`}>
              <Bell size={24} />
            </div>
            <h3 className="text-lg font-extrabold tracking-tight">Active Reminders</h3>
            <p className="text-xs text-slate-400 mt-1">Configure daily study notification channels.</p>
          </div>

          {/* Toggle Reminders */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-500/10 text-sm">
            <div className="flex flex-col">
              <span className="font-bold">Enable Daily Study Alerts</span>
              <span className="text-[10px] text-slate-400">Receive in-app alerts at scheduled times.</span>
            </div>
            <button
              type="button"
              onClick={() => setRemindersEnabled(!remindersEnabled)}
              className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 relative ${
                remindersEnabled ? (isDark ? 'bg-violet-600' : 'bg-sky-500') : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-all duration-300 ${
                  remindersEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>

          {/* Toggle Browser Notifications */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-500/10 text-sm">
            <div className="flex flex-col">
              <span className="font-bold flex items-center gap-1">
                Real-Time Desktop Alerts <Monitor size={14} className="text-slate-400" />
              </span>
              <span className="text-[10px] text-slate-400">
                {!supported
                  ? 'Not supported on this browser'
                  : 'Sends HTML5 system notifications even in background.'}
              </span>
            </div>
            <button
              type="button"
              disabled={!supported}
              onClick={handleToggleBrowserNotifications}
              className={`w-11 h-6 rounded-full p-0.5 transition-all duration-300 relative ${
                !supported ? 'opacity-40 cursor-not-allowed' : ''
              } ${
                browserNotificationsEnabled ? (isDark ? 'bg-violet-600' : 'bg-sky-500') : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-all duration-300 ${
                  browserNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></div>
            </button>
          </div>



          {/* Reminder Time Input */}
          {remindersEnabled && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Study Reminder Clock Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  placeholder="07:00 PM"
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs font-bold outline-none ${
                    isDark
                      ? 'bg-violet-950/20 border-violet-500/35 text-white focus:border-violet-500'
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-sky-500'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Send Test Notification Button */}
          {supported && browserNotificationsEnabled && (
            <button
              type="button"
              onClick={handleTestNotification}
              className={`w-full py-2 px-4 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all border ${
                isDark
                  ? 'border-violet-500/20 text-violet-300 hover:bg-violet-500/10'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              Send Test Desktop Alert <Send size={11} />
            </button>
          )}

          {showSavedToast && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-fade-in">
              <Check size={14} /> Alert configurations updated successfully!
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-97 ${
              isDark ? 'bg-violet-600 hover:bg-violet-500' : 'bg-sky-500 hover:bg-sky-600'
            }`}
          >
            Update Notifications <Sparkles size={12} />
          </button>
        </form>
      </div>

    </div>
  );
}

