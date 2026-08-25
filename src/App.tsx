import React, { useState, useEffect } from 'react';
import { 
  getStoredAthletes, saveAthletes, 
  getStoredCoaches, saveCoaches, 
  getStoredSessions, saveSessions, 
  getStoredAttendance, saveAttendance, 
  getStoredRpe, saveRpe, 
  getStoredIndividualWorkouts, saveIndividualWorkouts, 
  getStoredKickingLogs, saveKickingLogs, 
  getStoredPhysioNotes, savePhysioNotes, 
  getStoredTrainingTasks, saveTrainingTasks, 
  getActiveUser, setActiveUser, 
  getDeadlineOverride, setDeadlineOverride as saveDeadlineOverride, 
  isMondayDeadlinePassed, resetAllDataToDefault 
} from './lib/storage';
import { migrateAllData } from './lib/migration';
import { 
  subscribeToAllCloudCollections, 
  bootstrapCloudDatabaseIfEmpty, 
  syncAthleteToCloud, 
  deleteAthleteFromCloud, 
  syncCoachToCloud, 
  deleteCoachFromCloud, 
  syncSessionToCloud, 
  deleteSessionFromCloud, 
  syncAttendanceToCloud, 
  syncRpeToCloud, 
  syncIndividualWorkoutToCloud, 
  syncKickingLogToCloud, 
  syncPhysioNoteToCloud, 
  deletePhysioNoteFromCloud, 
  syncTrainingTaskToCloud, 
  deleteTrainingTaskFromCloud 
} from './lib/firestoreSync';
import { exportFullWorkbookToExcel } from './lib/excelExport';
import { Athlete, Coach, TrainingSession, AttendanceRecord, RpeFeedback, IndividualWorkout, KickingLog, PhysioNote, TrainingTask, AttendanceStatus, MacroRole } from './types';
import { auth, signOut, onAuthStateChanged, User as FirebaseUser } from './lib/firebase';

import { Header } from './components/Header';
import { RoleSwitcher } from './components/RoleSwitcher';
import { AthleteDashboard } from './components/AthleteDashboard';
import { CoachDashboard } from './components/CoachDashboard';
import { LoginScreen, normalizeEmail } from './components/LoginScreen';
import { Shield, RefreshCw } from 'lucide-react';

export default function App() {
  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // App State
  const [athletes, setAthletes] = useState<Athlete[]>(getStoredAthletes);
  const [coaches, setCoaches] = useState<Coach[]>(getStoredCoaches);
  const [sessions, setSessions] = useState<TrainingSession[]>(getStoredSessions);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(getStoredAttendance);
  const [rpeList, setRpeList] = useState<RpeFeedback[]>(getStoredRpe);
  const [individualWorkouts, setIndividualWorkouts] = useState<IndividualWorkout[]>(getStoredIndividualWorkouts);
  const [kickingLogs, setKickingLogs] = useState<KickingLog[]>(getStoredKickingLogs);
  const [physioNotes, setPhysioNotes] = useState<PhysioNote[]>(getStoredPhysioNotes);
  const [trainingTasks, setTrainingTasks] = useState<TrainingTask[]>(getStoredTrainingTasks);

  // User session state
  const activeUser = getActiveUser();
  const [currentRole, setCurrentRole] = useState<'COACH' | 'ATHLETE'>(activeUser.role);
  const [currentUserId, setCurrentUserId] = useState<string>(activeUser.userId);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState<boolean>(false);

  // Deadline test override state ('AUTO' | 'FORCE_LOCKED' | 'FORCE_UNLOCKED')
  const [deadlineOverride, setDeadlineOverrideState] = useState<'AUTO' | 'FORCE_LOCKED' | 'FORCE_UNLOCKED'>(getDeadlineOverride);

  const deadlinePassed = isMondayDeadlinePassed();

  // Active Coach / Athlete objects
  const currentCoach = coaches.find(c => c.id === currentUserId) || coaches[0];
  const currentAthlete = athletes.find(a => a.id === currentUserId) || athletes[0];

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Cloud Synchronization with Firestore
  useEffect(() => {
    if (!firebaseUser) return;

    // Bootstrap if database is fresh
    bootstrapCloudDatabaseIfEmpty();

    // Check if migration is needed
    const hasMigrated = localStorage.getItem('hasMigratedToFirebase');
    if (!hasMigrated) {
      migrateAllData().then(() => {
        localStorage.setItem('hasMigratedToFirebase', 'true');
      }).catch(err => {
        console.warn('Initial cloud migration notice:', err);
      });
    }

    // Subscribe to live Firestore updates across devices
    const unsubscribeCloud = subscribeToAllCloudCollections({
      onAthletesChange: (cloudAthletes) => setAthletes(cloudAthletes),
      onCoachesChange: (cloudCoaches) => setCoaches(cloudCoaches),
      onSessionsChange: (cloudSessions) => setSessions(cloudSessions),
      onAttendanceChange: (cloudAttendance) => setAttendance(cloudAttendance),
      onRpeChange: (cloudRpe) => setRpeList(cloudRpe),
      onIndividualWorkoutsChange: (cloudWorkouts) => setIndividualWorkouts(cloudWorkouts),
      onKickingLogsChange: (cloudLogs) => setKickingLogs(cloudLogs),
      onPhysioNotesChange: (cloudNotes) => setPhysioNotes(cloudNotes),
      onTrainingTasksChange: (cloudTasks) => setTrainingTasks(cloudTasks),
    });

    return () => {
      unsubscribeCloud();
    };
  }, [firebaseUser]);

  // Synchronize current user profile with Firebase Auth user email
  useEffect(() => {
    if (firebaseUser && firebaseUser.email) {
      const email = firebaseUser.email.trim();
      const norm = normalizeEmail(email);

      if (norm === normalizeEmail('gianni.grespan@gmail.com')) {
        const adminCoach = coaches.find(c => c.id === 'c0' || normalizeEmail(c.email) === norm) || coaches[0];
        if (adminCoach && (currentUserId !== adminCoach.id || currentRole !== 'COACH')) {
          setCurrentUserId(adminCoach.id);
          setCurrentRole('COACH');
          setActiveUser(adminCoach.id, 'COACH');
        }
      } else {
        const matchedCoach = coaches.find(c => c.email && normalizeEmail(c.email) === norm);
        if (matchedCoach) {
          if (currentUserId !== matchedCoach.id || currentRole !== 'COACH') {
            setCurrentUserId(matchedCoach.id);
            setCurrentRole('COACH');
            setActiveUser(matchedCoach.id, 'COACH');
          }
        } else {
          const matchedAthlete = athletes.find(a => (a as any).email && normalizeEmail((a as any).email) === norm);
          if (matchedAthlete) {
            if (currentUserId !== matchedAthlete.id || currentRole !== 'ATHLETE') {
              setCurrentUserId(matchedAthlete.id);
              setCurrentRole('ATHLETE');
              setActiveUser(matchedAthlete.id, 'ATHLETE');
            }
          }
        }
      }
    }
  }, [firebaseUser, coaches, athletes]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Cache changes to localStorage
  useEffect(() => {
    saveAthletes(athletes);
  }, [athletes]);

  useEffect(() => {
    saveCoaches(coaches);
  }, [coaches]);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    saveAttendance(attendance);
  }, [attendance]);

  useEffect(() => {
    saveRpe(rpeList);
  }, [rpeList]);

  useEffect(() => {
    saveIndividualWorkouts(individualWorkouts);
  }, [individualWorkouts]);

  useEffect(() => {
    saveKickingLogs(kickingLogs);
  }, [kickingLogs]);

  useEffect(() => {
    savePhysioNotes(physioNotes);
  }, [physioNotes]);

  useEffect(() => {
    saveTrainingTasks(trainingTasks);
  }, [trainingTasks]);

  // User Switcher handler
  const handleSelectUser = (userId: string, role: 'COACH' | 'ATHLETE') => {
    setCurrentUserId(userId);
    setCurrentRole(role);
    setActiveUser(userId, role);
  };

  // Toggle Deadline Override
  const handleToggleDeadlineOverride = (mode: 'AUTO' | 'FORCE_LOCKED' | 'FORCE_UNLOCKED') => {
    setDeadlineOverrideState(mode);
    saveDeadlineOverride(mode);
  };

  // Register New Athlete
  const handleRegisterAthlete = (newAthleteData: Omit<Athlete, 'id' | 'createdAt' | 'active'>) => {
    const newAthlete: Athlete = {
      ...newAthleteData,
      id: `a_${Date.now()}`,
      active: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setAthletes(prev => [...prev, newAthlete]);
    syncAthleteToCloud(newAthlete);
    handleSelectUser(newAthlete.id, 'ATHLETE');
  };

  // Register New Coach
  const handleRegisterCoach = (newCoachData: Omit<Coach, 'id'>) => {
    const newCoach: Coach = {
      ...newCoachData,
      id: `c_${Date.now()}`,
    };
    setCoaches(prev => [...prev, newCoach]);
    syncCoachToCloud(newCoach);
  };

  const handleUpdateAthlete = (updatedAthlete: Athlete) => {
    setAthletes(prev => prev.map(a => a.id === updatedAthlete.id ? updatedAthlete : a));
    syncAthleteToCloud(updatedAthlete);
  };

  const handleUpdateCoach = (updatedCoach: Coach) => {
    setCoaches(prev => prev.map(c => c.id === updatedCoach.id ? updatedCoach : c));
    syncCoachToCloud(updatedCoach);
  };

  const handleDeleteAthlete = (athleteId: string) => {
    setAthletes(prev => prev.filter(a => a.id !== athleteId));
    deleteAthleteFromCloud(athleteId);
  };

  const handleDeleteCoach = (coachId: string) => {
    if (coaches.length <= 1) {
      alert("Impossibile eliminare l'ultimo coach/amministratore rimasto.");
      return;
    }
    setCoaches(prev => prev.filter(c => c.id !== coachId));
    deleteCoachFromCloud(coachId);
  };

  // Athlete: Save Attendance Confirmation
  const handleSaveAttendance = (sessionId: string, status: AttendanceStatus, reason?: string) => {
    let targetRecord: AttendanceRecord;
    setAttendance(prev => {
      const existingIndex = prev.findIndex(a => a.athleteId === currentAthlete.id && a.sessionId === sessionId);
      if (existingIndex >= 0) {
        const copy = [...prev];
        targetRecord = {
          ...copy[existingIndex],
          status,
          reason,
          submittedAt: new Date().toISOString(),
        };
        copy[existingIndex] = targetRecord;
        return copy;
      } else {
        targetRecord = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          athleteId: currentAthlete.id,
          sessionId,
          status,
          reason,
          submittedAt: new Date().toISOString(),
        };
        return [...prev, targetRecord];
      }
    });
    // Sync to cloud
    setTimeout(() => {
      if (targetRecord) syncAttendanceToCloud(targetRecord);
    }, 0);
  };

  // Coach: Override Attendance
  const handleUpdateAttendanceByCoach = (
    athleteId: string, 
    sessionId: string, 
    status: AttendanceStatus, 
    coachNote?: string
  ) => {
    let targetRecord: AttendanceRecord;
    setAttendance(prev => {
      const existingIndex = prev.findIndex(a => a.athleteId === athleteId && a.sessionId === sessionId);
      if (existingIndex >= 0) {
        const copy = [...prev];
        const prevCount = copy[existingIndex].staffEditCount || 0;
        targetRecord = {
          ...copy[existingIndex],
          status,
          coachNote,
          modifiedByCoachId: currentCoach.id,
          staffEditCount: prevCount + 1,
          submittedAt: new Date().toISOString(),
        };
        copy[existingIndex] = targetRecord;
        return copy;
      } else {
        targetRecord = {
          id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          athleteId,
          sessionId,
          status,
          coachNote,
          modifiedByCoachId: currentCoach.id,
          staffEditCount: 1,
          submittedAt: new Date().toISOString(),
        };
        return [...prev, targetRecord];
      }
    });
    // Sync to cloud
    setTimeout(() => {
      if (targetRecord) syncAttendanceToCloud(targetRecord);
    }, 0);
  };

  // Save RPE
  const handleSaveRpe = (newRpeData: Omit<RpeFeedback, 'id' | 'athleteId' | 'createdAt'>) => {
    const newRpe: RpeFeedback = {
      ...newRpeData,
      id: `rpe_${Date.now()}`,
      athleteId: currentAthlete.id,
      createdAt: new Date().toISOString(),
    };
    setRpeList(prev => [newRpe, ...prev]);
    syncRpeToCloud(newRpe);
  };

  // Save Individual Workout
  const handleSaveIndividualWorkout = (workoutData: Omit<IndividualWorkout, 'id' | 'athleteId' | 'createdAt'>) => {
    const newWorkout: IndividualWorkout = {
      ...workoutData,
      id: `iw_${Date.now()}`,
      athleteId: currentAthlete.id,
      createdAt: new Date().toISOString(),
    };
    setIndividualWorkouts(prev => [newWorkout, ...prev]);
    syncIndividualWorkoutToCloud(newWorkout);
  };

  // Save Kicking Log
  const handleSaveKickingLog = (logData: Omit<KickingLog, 'id' | 'athleteId' | 'createdAt'>) => {
    const newLog: KickingLog = {
      ...logData,
      id: `kl_${Date.now()}`,
      athleteId: currentAthlete.id,
      createdAt: new Date().toISOString(),
    };
    setKickingLogs(prev => [newLog, ...prev]);
    syncKickingLogToCloud(newLog);
  };

  // Save Physio Note (Staff / Fisioterapista)
  const handleSavePhysioNote = (noteData: Omit<PhysioNote, 'id' | 'authorId' | 'authorName' | 'authorTitle' | 'createdAt'>) => {
    const newNote: PhysioNote = {
      ...noteData,
      id: `pn_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      authorId: currentCoach.id,
      authorName: currentCoach.name,
      authorTitle: currentCoach.title,
      createdAt: new Date().toISOString(),
    };
    setPhysioNotes(prev => [newNote, ...prev]);
    syncPhysioNoteToCloud(newNote);
  };

  // Delete Physio Note
  const handleDeletePhysioNote = (noteId: string) => {
    setPhysioNotes(prev => prev.filter(n => n.id !== noteId));
    deletePhysioNoteFromCloud(noteId);
  };

  const handleSaveTrainingTask = (taskData: Omit<TrainingTask, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: TrainingTask = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    setTrainingTasks(prev => [...prev, newTask]);
    syncTrainingTaskToCloud(newTask);
  };

  const handleDeleteTrainingTask = (taskId: string) => {
    setTrainingTasks(prev => prev.filter(t => t.id !== taskId));
    deleteTrainingTaskFromCloud(taskId);
  };

  const handleUpdateTaskProgress = (taskId: string, currentCount: number) => {
    let updatedTaskObj: TrainingTask | undefined;
    setTrainingTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const target = t.targetCount || 0;
      const completed = target > 0 ? currentCount >= target : true;
      const progressMap = t.progressMap || {};
      updatedTaskObj = {
        ...t,
        progressMap: {
          ...progressMap,
          [currentAthlete.id]: {
            currentCount,
            completed,
            updatedAt: new Date().toISOString(),
          }
        }
      };
      return updatedTaskObj;
    }));
    setTimeout(() => {
      if (updatedTaskObj) syncTrainingTaskToCloud(updatedTaskObj);
    }, 0);
  };

  // Coach: Update Session Focus
  const handleUpdateSessionFocus = (sessionId: string, newFocus: string) => {
    let updatedSession: TrainingSession | undefined;
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        updatedSession = { ...s, focusTopic: newFocus };
        return updatedSession;
      }
      return s;
    }));
    setTimeout(() => {
      if (updatedSession) syncSessionToCloud(updatedSession);
    }, 0);
  };

  // Coach: Update Full Session
  const handleUpdateSession = (updatedSession: TrainingSession) => {
    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    syncSessionToCloud(updatedSession);
  };

  // Coach: Delete Single Session
  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setAttendance(prev => prev.filter(a => a.sessionId !== sessionId));
    setRpeList(prev => prev.filter(r => r.sessionId !== sessionId));
    deleteSessionFromCloud(sessionId);
  };

  const handleDeleteAllSessions = () => {
    sessions.forEach(s => deleteSessionFromCloud(s.id));
    setSessions([]);
  };

  // Coach: Add Session
  const handleAddSession = (newSessionData: Omit<TrainingSession, 'id'>) => {
    const newSession: TrainingSession = {
      ...newSessionData,
      id: `s_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    setSessions(prev => [...prev, newSession]);
    syncSessionToCloud(newSession);
  };

  // Coach: Update Athlete Macro Role
  const handleUpdateAthleteRole = (athleteId: string, newMacroRole: MacroRole) => {
    let updatedAthlete: Athlete | undefined;
    setAthletes(prev => prev.map(a => {
      if (a.id === athleteId) {
        updatedAthlete = { ...a, macroRole: newMacroRole };
        return updatedAthlete;
      }
      return a;
    }));
    setTimeout(() => {
      if (updatedAthlete) syncAthleteToCloud(updatedAthlete);
    }, 0);
  };

  // Excel Export
  const handleExportExcel = () => {
    exportFullWorkbookToExcel({
      athletes,
      coaches,
      sessions,
      attendance,
      rpeList,
      individualWorkouts,
      kickingLogs,
    });
  };

  // Reset to default sample data
  const handleResetDemoData = () => {
    if (window.confirm('Vuoi ripristinare i dati di esempio iniziali del Villorba Rugby?')) {
      resetAllDataToDefault();
      window.location.reload();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-400">Caricamento Sicurezza & Firebase Auth...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <LoginScreen
        coaches={coaches}
        athletes={athletes}
        onLoginSuccess={(userId, role, firebaseUserEmail) => {
          setCurrentUserId(userId);
          setCurrentRole(role);
          setActiveUser(userId, role);

          if (firebaseUserEmail) {
            if (role === 'COACH') {
              const c = coaches.find(item => item.id === userId);
              if (c && c.email !== firebaseUserEmail) {
                const updated = { ...c, email: firebaseUserEmail };
                setCoaches(prev => prev.map(item => item.id === userId ? updated : item));
                syncCoachToCloud(updated);
              }
            } else {
              const a = athletes.find(item => item.id === userId);
              if (a && (a as any).email !== firebaseUserEmail) {
                const updated = { ...a, email: firebaseUserEmail };
                setAthletes(prev => prev.map(item => item.id === userId ? updated : item));
                syncAthleteToCloud(updated);
              }
            }
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-yellow-400 selection:text-slate-950">
      
      {/* Top Header Navigation */}
      <Header
        currentRole={currentRole}
        currentCoach={currentCoach}
        currentAthlete={currentAthlete}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        deadlinePassed={deadlinePassed}
        deadlineOverride={deadlineOverride}
        onToggleDeadlineOverride={handleToggleDeadlineOverride}
        onExportExcel={handleExportExcel}
      />

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentRole === 'ATHLETE' ? (
          <AthleteDashboard
            athlete={currentAthlete}
            sessions={sessions}
            attendance={attendance}
            rpeList={rpeList}
            individualWorkouts={individualWorkouts}
            kickingLogs={kickingLogs}
            deadlinePassed={deadlinePassed}
            onSaveAttendance={handleSaveAttendance}
            onSaveRpe={handleSaveRpe}
            onSaveIndividualWorkout={handleSaveIndividualWorkout}
            onSaveKickingLog={handleSaveKickingLog}
            trainingTasks={trainingTasks}
            onUpdateTaskProgress={handleUpdateTaskProgress}
          />
        ) : (
          <CoachDashboard
            coaches={coaches}
            currentCoach={currentCoach}
            athletes={athletes}
            sessions={sessions}
            attendance={attendance}
            rpeList={rpeList}
            individualWorkouts={individualWorkouts}
            kickingLogs={kickingLogs}
            physioNotes={physioNotes}
            trainingTasks={trainingTasks}
            onSaveTrainingTask={handleSaveTrainingTask}
            onDeleteTrainingTask={handleDeleteTrainingTask}
            deadlinePassed={deadlinePassed}
            deadlineOverride={deadlineOverride}
            onToggleDeadlineOverride={handleToggleDeadlineOverride}
            onUpdateAttendanceByCoach={handleUpdateAttendanceByCoach}
            onUpdateSessionFocus={handleUpdateSessionFocus}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
            onAddSession={handleAddSession}
            onDeleteAllSessions={handleDeleteAllSessions}
            onSavePhysioNote={handleSavePhysioNote}
            onDeletePhysioNote={handleDeletePhysioNote}
            onExportExcel={handleExportExcel}
            onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
            onUpdateAthleteRole={handleUpdateAthleteRole}
            onRegisterAthlete={handleRegisterAthlete}
            onRegisterCoach={handleRegisterCoach}
            onUpdateAthlete={handleUpdateAthlete}
            onUpdateCoach={handleUpdateCoach}
            onDeleteAthlete={handleDeleteAthlete}
            onDeleteCoach={handleDeleteCoach}
          />
        )}
      </main>

      {/* Role Switcher Modal */}
      <RoleSwitcher
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        onRegisterAthlete={handleRegisterAthlete}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-slate-400">Villorba Rugby Femminile - Serie A Elite</span>
            <span>• Gestione Presenze, RPE e Performance</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Cloud Firebase Sincronizzato
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 transition flex items-center gap-1 text-[11px] font-bold"
              title="Disconnetti account Firebase"
            >
              Esci (Firebase Auth)
            </button>
            <button
              onClick={handleResetDemoData}
              className="text-slate-500 hover:text-slate-300 transition flex items-center gap-1 text-[11px]"
              title="Ripristina dati iniziali di esempio"
            >
              <RefreshCw className="w-3 h-3" /> Ripristina Dati Esempio
            </button>
            <span>© {new Date().getFullYear()} Villorba Rugby</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
