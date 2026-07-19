import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  estimatedMin: number;
  keyConcepts: string[];
  resources: string[];
  completed: boolean;
}

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  durationHrs: number;
  milestones: Milestone[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  type?: 'mcq' | 'question' | 'true-false' | 'fill-blank';
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  correctTextAnswer?: string;
  explanation: string;
}

export interface Quiz {
  moduleTitle: string;
  roadmapId: string;
  roadmapTitle: string;
  questions: QuizQuestion[];
  userAnswers: Record<string, any>; // questionId -> optionIndex or text response
  score: number | null; // percentage, e.g. 100 or 66.7
  submitted: boolean;
}

export interface StudySession {
  time: string;
  topic: string;
  durationMin: number;
}

export interface PlanItem {
  id: string;
  text: string;
  completed: boolean;
}

interface LearningStore {
  theme: 'dark' | 'light';
  user: {
    name: string;
    avatarUrl: string;
  };
  roadmaps: Roadmap[];
  activeRoadmapId: string | null;
  currentQuiz: Quiz | null;
  weakAreas: string[]; // module titles that scored < 70%
  streak: number;
  lastActiveDate: string;
  badges: string[];
  dailyHoursGoal: number;
  hoursLoggedToday: number;
  upcomingSession: StudySession;
  todayPlan: PlanItem[];
  
  // Actions
  setTheme: (theme: 'dark' | 'light') => void;
  setUser: (name: string) => void;
  addRoadmap: (roadmap: Omit<Roadmap, 'id' | 'createdAt'>) => string;
  deleteRoadmap: (id: string) => void;
  toggleMilestone: (roadmapId: string, milestoneId: string) => void;
  setActiveRoadmapId: (id: string | null) => void;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  answerQuizQuestion: (questionId: string, answer: any) => void;
  submitQuiz: () => { score: number; passed: boolean };
  addWeakArea: (moduleTitle: string) => void;
  clearWeakArea: (moduleTitle: string) => void;
  setDailyHoursGoal: (hours: number) => void;
  logHoursToday: (hours: number) => void;
  setUpcomingSession: (session: StudySession) => void;
  togglePlanItem: (id: string) => void;
  addPlanItem: (text: string) => void;
  deletePlanItem: (id: string) => void;
  unlockBadge: (badgeName: string) => void;
  toggleBadge: (badgeName: string) => void;
  resetAll: () => void;
  setStreak: (streak: number) => void;
  lockInStreak: () => { success: boolean; message: string; newStreak: number };
}

// Default initial roadmaps to show in profile
const defaultRoadmaps: Roadmap[] = [];

const defaultTodayPlan: PlanItem[] = [];

export const useLearningStore = create<LearningStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      user: {
        name: 'Guest',
        avatarUrl: ''
      },
      roadmaps: defaultRoadmaps,
      activeRoadmapId: null,
      currentQuiz: null,
      weakAreas: [],
      streak: 0,
      lastActiveDate: '',
      badges: [],
      dailyHoursGoal: 4.0,
      hoursLoggedToday: 0,
      upcomingSession: {
        time: '',
        topic: '',
        durationMin: 0
      },
      todayPlan: defaultTodayPlan,

      setTheme: (theme) => set({ theme }),
      setStreak: (streak) => {
        set({ streak });
        
        // Cloud Sync Streak
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, {
            streak,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
          });
        }
      },
      lockInStreak: () => {
        const state = get();
        const todayStr = new Date().toISOString().split('T')[0];
        
        if (state.lastActiveDate === todayStr) {
          return {
            success: false,
            message: "Streak already secured for today! Complete more daily goals or keep studying.",
            newStreak: state.streak
          };
        }

        let newStreak = state.streak;
        
        // Calculate yesterday's date string
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (state.lastActiveDate === yesterdayStr) {
          // Consecutive active day
          newStreak = state.streak + 1;
        } else if (state.lastActiveDate === '') {
          // New/first streak
          newStreak = 1;
        } else {
          // Streak was broken, restart it at 1
          newStreak = 1;
        }

        // Add 'Consistency King' badge if they reach 10 days
        let updatedBadges = [...state.badges];
        if (newStreak >= 10 && !updatedBadges.includes('Consistency King')) {
          updatedBadges.push('Consistency King');
        }

        set({
          streak: newStreak,
          lastActiveDate: todayStr,
          badges: updatedBadges
        });

        // Cloud Sync
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, {
            streak: newStreak,
            badges: updatedBadges,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
          });
        }

        return {
          success: true,
          message: newStreak === 1 
            ? "Your learning streak has started! Welcome to day 1." 
            : `Streak locked in! You are on a ${newStreak}-day learning loop! 🔥`,
          newStreak
        };
      },
      setUser: (name) => {
        set((state) => ({ user: { ...state.user, name } }));

        // Cloud Sync User Profile Name
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, {
            name,
            streak: get().streak,
            badges: get().badges,
            dailyHoursGoal: get().dailyHoursGoal,
            hoursLoggedToday: get().hoursLoggedToday,
            upcomingSession: get().upcomingSession,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
          });
        }
      },
      
      addRoadmap: (roadmap) => {
        const id = Math.random().toString(36).substring(2, 11);
        const newRoadmap: Roadmap = {
          ...roadmap,
          id,
          createdAt: new Date().toISOString()
        };
        set((state) => ({
          roadmaps: [newRoadmap, ...state.roadmaps],
          activeRoadmapId: id
        }));

        // Cloud Sync New Roadmap
        const currentUser = auth.currentUser;
        if (currentUser) {
          const roadmapRef = doc(db, 'users', currentUser.uid, 'roadmaps', id);
          setDoc(roadmapRef, {
            title: newRoadmap.title,
            description: newRoadmap.description,
            durationHrs: newRoadmap.durationHrs,
            milestones: newRoadmap.milestones,
            createdAt: newRoadmap.createdAt
          }).catch(err => {
            handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/roadmaps/${id}`);
          });
        }

        return id;
      },

      deleteRoadmap: (id) => {
        set((state) => {
          const remainingRoadmaps = state.roadmaps.filter((r) => r.id !== id);
          return {
            roadmaps: remainingRoadmaps,
            activeRoadmapId: state.activeRoadmapId === id ? null : state.activeRoadmapId
          };
        });

        // Cloud Sync Delete Roadmap
        const currentUser = auth.currentUser;
        if (currentUser) {
          const roadmapRef = doc(db, 'users', currentUser.uid, 'roadmaps', id);
          deleteDoc(roadmapRef).catch(err => {
            handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/roadmaps/${id}`);
          });
        }
      },

      toggleMilestone: (roadmapId, milestoneId) => {
        let targetMilestoneCopy: any = null;

        set((state) => {
          const updatedRoadmaps = state.roadmaps.map((r) => {
            if (r.id !== roadmapId) return r;
            const updatedMilestones = r.milestones.map((m) => {
              if (m.id !== milestoneId) return m;
              return { ...m, completed: !m.completed };
            });
            return { ...r, milestones: updatedMilestones };
          });

          const targetRoadmap = state.roadmaps.find((r) => r.id === roadmapId);
          const targetMilestone = targetRoadmap?.milestones.find((m) => m.id === milestoneId);
          let updatedTodayPlan = [...state.todayPlan];
          
          if (targetMilestone) {
            targetMilestoneCopy = { ...targetMilestone, completed: !targetMilestone.completed };
            const isCompleted = !targetMilestone.completed;
            updatedTodayPlan = state.todayPlan.map((item) => {
              if (item.text.toLowerCase() === targetMilestone.title.toLowerCase()) {
                return { ...item, completed: isCompleted };
              }
              return item;
            });
          }

          return {
            roadmaps: updatedRoadmaps,
            todayPlan: updatedTodayPlan
          };
        });

        // Cloud Sync Milestone Toggle & Matching Checklist Item
        const currentUser = auth.currentUser;
        if (currentUser) {
          const state = get();
          const updatedRoadmap = state.roadmaps.find((r) => r.id === roadmapId);
          if (updatedRoadmap) {
            const roadmapRef = doc(db, 'users', currentUser.uid, 'roadmaps', roadmapId);
            setDoc(roadmapRef, {
              title: updatedRoadmap.title,
              description: updatedRoadmap.description,
              durationHrs: updatedRoadmap.durationHrs,
              milestones: updatedRoadmap.milestones,
              createdAt: updatedRoadmap.createdAt
            }).catch(err => {
              handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/roadmaps/${roadmapId}`);
            });
          }

          if (targetMilestoneCopy) {
            const matchedItem = state.todayPlan.find(item => item.text.toLowerCase() === targetMilestoneCopy.title.toLowerCase());
            if (matchedItem) {
              const itemRef = doc(db, 'users', currentUser.uid, 'planItems', matchedItem.id);
              setDoc(itemRef, {
                text: matchedItem.text,
                completed: matchedItem.completed
              }).catch(err => {
                handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/planItems/${matchedItem.id}`);
              });
            }
          }
        }
      },

      setActiveRoadmapId: (id) => {
        let newPlan: PlanItem[] = [];

        set((state) => {
          const activeRm = state.roadmaps.find((r) => r.id === id);
          let plan = state.todayPlan;
          
          if (activeRm) {
            plan = activeRm.milestones.map((m) => ({
              id: `plan-${m.id}`,
              text: m.title,
              completed: m.completed
            }));
          }
          
          newPlan = plan;

          return {
            activeRoadmapId: id,
            todayPlan: plan,
            currentQuiz: null
          };
        });

        // Cloud Sync Checklist Items for Active Roadmap
        const currentUser = auth.currentUser;
        if (currentUser && newPlan.length > 0) {
          newPlan.forEach((item) => {
            const itemRef = doc(db, 'users', currentUser.uid, 'planItems', item.id);
            setDoc(itemRef, {
              text: item.text,
              completed: item.completed
            }).catch(err => {
              handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/planItems/${item.id}`);
            });
          });
        }
      },

      setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),

      answerQuizQuestion: (questionId, answer) => set((state) => {
        if (!state.currentQuiz) return {};
        return {
          currentQuiz: {
            ...state.currentQuiz,
            userAnswers: {
              ...state.currentQuiz.userAnswers,
              [questionId]: answer
            }
          }
        };
      }),

      submitQuiz: () => {
        const state = get();
        const quiz = state.currentQuiz;
        if (!quiz) return { score: 0, passed: false };

        let correctCount = 0;
        quiz.questions.forEach((q) => {
          const userAns = quiz.userAnswers[q.id];
          const type = q.type || 'mcq';
          if (type === 'mcq' || type === 'true-false') {
            if (userAns !== undefined && Number(userAns) === q.correctOptionIndex) {
              correctCount++;
            }
          } else if (type === 'fill-blank') {
            const userStr = String(userAns || '').trim().toLowerCase();
            const correctStr = String(q.correctTextAnswer || '').trim().toLowerCase();
            if (userStr === correctStr && correctStr !== '') {
              correctCount++;
            }
          } else if (type === 'question') {
            const userStr = String(userAns || '').trim();
            if (userStr.length >= 5) {
              correctCount++;
            }
          }
        });

        const score = Math.round((correctCount / quiz.questions.length) * 100);
        const passed = score >= 70;

        set((state) => {
          let updatedWeakAreas = [...state.weakAreas];
          if (!passed) {
            if (!updatedWeakAreas.includes(quiz.moduleTitle)) {
              updatedWeakAreas.push(quiz.moduleTitle);
            }
          } else {
            updatedWeakAreas = updatedWeakAreas.filter((w) => w !== quiz.moduleTitle);
          }

          let updatedBadges = [...state.badges];
          if (score === 100 && !updatedBadges.includes('Quiz Whiz')) {
            updatedBadges.push('Quiz Whiz');
          }

          return {
            currentQuiz: {
              ...quiz,
              score,
              submitted: true
            },
            weakAreas: updatedWeakAreas,
            badges: updatedBadges
          };
        });

        // Cloud Sync User Profile with New Badges / Weak Areas
        const currentUser = auth.currentUser;
        if (currentUser) {
          const finalState = get();
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, {
            name: finalState.user.name,
            streak: finalState.streak,
            badges: finalState.badges,
            dailyHoursGoal: finalState.dailyHoursGoal,
            hoursLoggedToday: finalState.hoursLoggedToday,
            upcomingSession: finalState.upcomingSession,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
          });
        }

        return { score, passed };
      },

      addWeakArea: (moduleTitle) => {
        set((state) => {
          if (state.weakAreas.includes(moduleTitle)) return {};
          return { weakAreas: [...state.weakAreas, moduleTitle] };
        });

        // Cloud Sync
        const currentUser = auth.currentUser;
        if (currentUser) {
          const state = get();
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, {
            badges: state.badges,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
          });
        }
      },

      clearWeakArea: (moduleTitle) => {
        set((state) => ({
          weakAreas: state.weakAreas.filter((w) => w !== moduleTitle)
        }));

        // Cloud Sync
        const currentUser = auth.currentUser;
        if (currentUser) {
          const state = get();
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, {
            badges: state.badges,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
          });
        }
      },

      setDailyHoursGoal: (dailyHoursGoal) => {
        set({ dailyHoursGoal });

        // Cloud Sync Daily Goal
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, {
            dailyHoursGoal,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
          });
        }
      },
      
      logHoursToday: (hours) => {
        set((state) => {
          const newHours = Math.min(state.dailyHoursGoal, Math.max(0, state.hoursLoggedToday + hours));
          return { hoursLoggedToday: parseFloat(newHours.toFixed(1)) };
        });

        // Cloud Sync Study Logs
        const currentUser = auth.currentUser;
        if (currentUser) {
          const state = get();
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, {
            hoursLoggedToday: state.hoursLoggedToday,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
          });
        }
      },

      setUpcomingSession: (upcomingSession) => {
        set({ upcomingSession });

        // Cloud Sync Upcoming Session
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, {
            upcomingSession,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
          });
        }
      },

      togglePlanItem: (id) => {
        set((state) => {
          const updatedPlan = state.todayPlan.map((item) => {
            if (item.id !== id) return item;
            const isCompleted = !item.completed;
            
            if (state.activeRoadmapId) {
              const activeRm = state.roadmaps.find((r) => r.id === state.activeRoadmapId);
              const targetMs = activeRm?.milestones.find((m) => m.title.toLowerCase() === item.text.toLowerCase());
              if (targetMs) {
                setTimeout(() => {
                  get().toggleMilestone(state.activeRoadmapId!, targetMs.id);
                }, 0);
              }
            }
            
            return { ...item, completed: isCompleted };
          });
          
          return { todayPlan: updatedPlan };
        });

        // Cloud Sync Checklist Item Completed Status Toggle
        const currentUser = auth.currentUser;
        if (currentUser) {
          const updatedItem = get().todayPlan.find(item => item.id === id);
          if (updatedItem) {
            const itemRef = doc(db, 'users', currentUser.uid, 'planItems', id);
            setDoc(itemRef, {
              text: updatedItem.text,
              completed: updatedItem.completed
            }).catch(err => {
              handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/planItems/${id}`);
            });
          }
        }
      },

      addPlanItem: (text) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
          todayPlan: [
            ...state.todayPlan,
            { id, text, completed: false }
          ]
        }));

        // Cloud Sync New Checklist Item
        const currentUser = auth.currentUser;
        if (currentUser) {
          const itemRef = doc(db, 'users', currentUser.uid, 'planItems', id);
          setDoc(itemRef, {
            text,
            completed: false
          }).catch(err => {
            handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/planItems/${id}`);
          });
        }
      },

      deletePlanItem: (id) => {
        set((state) => ({
          todayPlan: state.todayPlan.filter((item) => item.id !== id)
        }));

        // Cloud Sync Delete Checklist Item
        const currentUser = auth.currentUser;
        if (currentUser) {
          const itemRef = doc(db, 'users', currentUser.uid, 'planItems', id);
          deleteDoc(itemRef).catch(err => {
            handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/planItems/${id}`);
          });
        }
      },

      unlockBadge: (badgeName) => {
        set((state) => {
          if (state.badges.includes(badgeName)) return {};
          return { badges: [...state.badges, badgeName] };
        });

        // Cloud Sync User Profile with New Badge
        const currentUser = auth.currentUser;
        if (currentUser) {
          const state = get();
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, {
            name: state.user.name,
            streak: state.streak,
            badges: state.badges,
            dailyHoursGoal: state.dailyHoursGoal,
            hoursLoggedToday: state.hoursLoggedToday,
            upcomingSession: state.upcomingSession,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
          });
        }
      },

      toggleBadge: (badgeName) => {
        set((state) => {
          const isUnlocked = state.badges.includes(badgeName);
          const updatedBadges = isUnlocked
            ? state.badges.filter((b) => b !== badgeName)
            : [...state.badges, badgeName];
          return { badges: updatedBadges };
        });

        // Cloud Sync User Profile with Toggled Badge
        const currentUser = auth.currentUser;
        if (currentUser) {
          const state = get();
          const userRef = doc(db, 'users', currentUser.uid);
          setDoc(userRef, {
            name: state.user.name,
            streak: state.streak,
            badges: state.badges,
            dailyHoursGoal: state.dailyHoursGoal,
            hoursLoggedToday: state.hoursLoggedToday,
            upcomingSession: state.upcomingSession,
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
          });
        }
      },

      resetAll: () => {
        const currentUser = auth.currentUser;
        const resetName = currentUser 
          ? (currentUser.displayName || currentUser.email?.split('@')[0] || 'Scholar') 
          : 'Guest';
        const resetAvatar = currentUser?.photoURL || '';

        set({
          theme: 'dark',
          user: { name: resetName, avatarUrl: resetAvatar },
          roadmaps: defaultRoadmaps,
          activeRoadmapId: null,
          currentQuiz: null,
          weakAreas: [],
          streak: 0,
          lastActiveDate: '',
          badges: [],
          dailyHoursGoal: 4.0,
          hoursLoggedToday: 0,
          upcomingSession: {
            time: '',
            topic: '',
            durationMin: 0
          },
          todayPlan: defaultTodayPlan,
        });
      }
    }),
    {
      name: 'skillbuilder-ai-storage',
      // only store plain properties
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
        roadmaps: state.roadmaps,
        activeRoadmapId: state.activeRoadmapId,
        weakAreas: state.weakAreas,
        streak: state.streak,
        lastActiveDate: state.lastActiveDate,
        badges: state.badges,
        dailyHoursGoal: state.dailyHoursGoal,
        hoursLoggedToday: state.hoursLoggedToday,
        upcomingSession: state.upcomingSession,
        todayPlan: state.todayPlan,
      }),
    }
  )
);
