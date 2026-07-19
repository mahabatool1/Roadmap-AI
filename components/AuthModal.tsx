'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, X, Compass, ShieldCheck, Mail, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import { signInWithGoogle, auth } from '@/lib/firebase';
import { useLearningStore } from '@/lib/store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { setUser } = useLearningStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsIframe(typeof window !== 'undefined' && window.self !== window.top);
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        setUser(user.displayName || user.email?.split('@')[0] || 'Scholar');
        setSuccess(`Welcome, ${user.displayName || 'Learner'}!`);
        setTimeout(() => {
          onClose();
          setSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#0B0D19] p-6 shadow-2xl md:p-8"
          >
            {/* Top Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-slate-800/50"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Glowing Aura Decoration */}
            <div className="absolute -top-12 -left-12 -z-10 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute -bottom-12 -right-12 -z-10 h-32 w-32 rounded-full bg-teal-500/10 blur-3xl" />

            {/* Header / Brand */}
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="relative mb-4 w-14 h-14 rounded-2xl overflow-hidden shadow-xl border border-slate-700/50 flex items-center justify-center bg-slate-950">
                <img
                  src="/logo.jpg"
                  alt="RoadmapAI Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
                Elevate Your Learning
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Unlock cloud backups, streak synchronization, and personalized AI skill-coaching.
              </p>
            </div>

            {/* Status Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300"
                >
                  <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content Actions */}
            <div className="space-y-4">
              {isIframe && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-[11px] leading-relaxed text-slate-300">
                  <div className="flex gap-2.5 items-start">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-300 block mb-0.5">Iframe Cookie Restriction</span>
                      Google Sign-In popup communication may be blocked inside the preview iframe. For a smooth cloud sync experience, please{' '}
                      <button
                        onClick={() => window.open(window.location.href, '_blank')}
                        className="text-amber-400 font-bold hover:underline underline-offset-2"
                      >
                        Open in New Tab
                      </button>
                      .
                    </div>
                  </div>
                </div>
              )}

              {/* Google Login Button */}
              <button
                disabled={loading}
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-white px-4 py-3 font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-100 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              <div className="relative my-5 flex items-center justify-center">
                <span className="absolute inset-x-0 h-px bg-slate-800" />
                <span className="relative bg-[#0B0D19] px-3 text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  Secure Access Guaranteed
                </span>
              </div>

              {/* Offline mode guarantee */}
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3.5 text-xs text-slate-400">
                <div className="flex gap-2 items-start">
                  <ShieldCheck className="h-4.5 w-4.5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-slate-300">Privacy & Cloud Sync</h4>
                    <p className="mt-0.5 leading-relaxed text-[11px]">
                      Your generated learning roadmaps and streaks will sync automatically across all browsers using high-performance Firebase cloud architecture.
                    </p>
                  </div>
                </div>
              </div>

              {/* Guest continuation option */}
              <button
                onClick={onClose}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-300 hover:underline transition-all py-1"
              >
                Continue studying in offline-only mode
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
