'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getDocs, setDoc, collection, getDocFromServer } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useLearningStore } from '@/lib/store';
import { showToast } from '@/components/NotificationToaster';

export default function FirebaseSyncManager() {
  const { setUser } = useLearningStore();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // 1. Connection check on application initial boot as mandated by the instructions
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error('Please check your Firebase configuration.');
        }
      }
    };
    testConnection();

    // 2. Watch auth state and sync data
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsSyncing(true);
        try {
          const userId = firebaseUser.uid;

          // A. Sync User Profile
          const userRef = doc(db, 'users', userId);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${userId}`);
            return;
          }

          if (userSnap && userSnap.exists()) {
            const profile = userSnap.data();
            useLearningStore.setState({
              user: {
                name: profile.name || firebaseUser.displayName || 'Scholar',
                avatarUrl: profile.avatarUrl || firebaseUser.photoURL || '',
              },
              streak: typeof profile.streak === 'number' ? profile.streak : 0,
              badges: Array.isArray(profile.badges) ? profile.badges : [],
              dailyHoursGoal: typeof profile.dailyHoursGoal === 'number' ? profile.dailyHoursGoal : 4.0,
              hoursLoggedToday: typeof profile.hoursLoggedToday === 'number' ? profile.hoursLoggedToday : 0,
              upcomingSession: profile.upcomingSession || {
                time: '',
                topic: '',
                durationMin: 0,
              },
            });
          } else {
            // Document doesn't exist, initialize Firestore with the current local state
            const localState = useLearningStore.getState();
            const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Scholar';
            try {
              await setDoc(userRef, {
                name: localState.user.name === 'Ezza' ? displayName : localState.user.name,
                avatarUrl: firebaseUser.photoURL || '',
                streak: localState.streak,
                badges: localState.badges,
                dailyHoursGoal: localState.dailyHoursGoal,
                hoursLoggedToday: localState.hoursLoggedToday,
                upcomingSession: localState.upcomingSession,
                updatedAt: new Date().toISOString(),
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `users/${userId}`);
              return;
            }
            
            // Sync locally as well
            setUser(displayName);
          }

          // B. Sync Learning Roadmaps
          const roadmapsColRef = collection(db, 'users', userId, 'roadmaps');
          let roadmapsSnap;
          try {
            roadmapsSnap = await getDocs(roadmapsColRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, `users/${userId}/roadmaps`);
            return;
          }

          if (roadmapsSnap && !roadmapsSnap.empty) {
            const cloudRoadmaps: any[] = [];
            roadmapsSnap.forEach((doc) => {
              cloudRoadmaps.push({ id: doc.id, ...doc.data() });
            });
            useLearningStore.setState({
              roadmaps: cloudRoadmaps,
              activeRoadmapId: cloudRoadmaps[0]?.id || null,
            });
          } else {
            // Upload current local roadmaps to cloud
            const localState = useLearningStore.getState();
            for (const rm of localState.roadmaps) {
              try {
                await setDoc(doc(db, 'users', userId, 'roadmaps', rm.id), {
                  title: rm.title,
                  description: rm.description,
                  durationHrs: rm.durationHrs,
                  milestones: rm.milestones,
                  createdAt: rm.createdAt || new Date().toISOString(),
                });
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, `users/${userId}/roadmaps/${rm.id}`);
              }
            }
          }

          // C. Sync Daily Checklist (Plan Items)
          const planColRef = collection(db, 'users', userId, 'planItems');
          let planSnap;
          try {
            planSnap = await getDocs(planColRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, `users/${userId}/planItems`);
            return;
          }

          if (planSnap && !planSnap.empty) {
            const cloudPlan: any[] = [];
            planSnap.forEach((doc) => {
              cloudPlan.push({ id: doc.id, ...doc.data() });
            });
            useLearningStore.setState({
              todayPlan: cloudPlan,
            });
          } else {
            // Upload current local plan items to cloud
            const localState = useLearningStore.getState();
            for (const item of localState.todayPlan) {
              try {
                await setDoc(doc(db, 'users', userId, 'planItems', item.id), {
                  text: item.text,
                  completed: item.completed,
                });
              } catch (err) {
                handleFirestoreError(err, OperationType.CREATE, `users/${userId}/planItems/${item.id}`);
              }
            }
          }

          showToast('Synced and backed up all data in the cloud successfully!', 'success');
        } catch (error) {
          console.error('Initial sync error:', error);
          showToast('Failed to synchronize with cloud database', 'warning');
        } finally {
          setIsSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  return null;
}
