import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch,
  Unsubscribe 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { 
  Athlete, 
  Coach, 
  TrainingSession, 
  AttendanceRecord, 
  RpeFeedback, 
  IndividualWorkout, 
  KickingLog, 
  PhysioNote, 
  TrainingTask 
} from '../types';
import { INITIAL_ATHLETES, INITIAL_COACHES } from '../data/initialData';
import { 
  saveAthletes, 
  saveCoaches, 
  saveSessions, 
  saveAttendance, 
  saveRpe, 
  saveIndividualWorkouts, 
  saveKickingLogs, 
  savePhysioNotes, 
  saveTrainingTasks 
} from './storage';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
}

// ---------------------------------------------------------------------------
// Cloud CRUD Functions
// ---------------------------------------------------------------------------

export const syncAthleteToCloud = async (athlete: Athlete) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'athletes', athlete.id);
    await setDoc(docRef, athlete, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `athletes/${athlete.id}`);
  }
};

export const deleteAthleteFromCloud = async (athleteId: string) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'athletes', athleteId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `athletes/${athleteId}`);
  }
};

export const syncCoachToCloud = async (coach: Coach) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'coaches', coach.id);
    await setDoc(docRef, coach, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `coaches/${coach.id}`);
  }
};

export const deleteCoachFromCloud = async (coachId: string) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'coaches', coachId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `coaches/${coachId}`);
  }
};

export const syncSessionToCloud = async (session: TrainingSession) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'sessions', session.id);
    await setDoc(docRef, session, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `sessions/${session.id}`);
  }
};

export const deleteSessionFromCloud = async (sessionId: string) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'sessions', sessionId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `sessions/${sessionId}`);
  }
};

export const syncAttendanceToCloud = async (record: AttendanceRecord) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'attendance', record.id);
    await setDoc(docRef, record, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `attendance/${record.id}`);
  }
};

export const syncRpeToCloud = async (rpe: RpeFeedback) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'rpe', rpe.id);
    await setDoc(docRef, rpe, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `rpe/${rpe.id}`);
  }
};

export const syncIndividualWorkoutToCloud = async (workout: IndividualWorkout) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'individualWorkouts', workout.id);
    await setDoc(docRef, workout, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `individualWorkouts/${workout.id}`);
  }
};

export const syncKickingLogToCloud = async (log: KickingLog) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'kickingLogs', log.id);
    await setDoc(docRef, log, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `kickingLogs/${log.id}`);
  }
};

export const syncPhysioNoteToCloud = async (note: PhysioNote) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'physioNotes', note.id);
    await setDoc(docRef, note, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `physioNotes/${note.id}`);
  }
};

export const deletePhysioNoteFromCloud = async (noteId: string) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'physioNotes', noteId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `physioNotes/${noteId}`);
  }
};

export const syncTrainingTaskToCloud = async (task: TrainingTask) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'trainingTasks', task.id);
    await setDoc(docRef, task, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `trainingTasks/${task.id}`);
  }
};

export const deleteTrainingTaskFromCloud = async (taskId: string) => {
  if (!auth.currentUser) return;
  try {
    const docRef = doc(db, 'trainingTasks', taskId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `trainingTasks/${taskId}`);
  }
};

// ---------------------------------------------------------------------------
// Cloud Bootstrap & Seeding if empty
// ---------------------------------------------------------------------------

export const bootstrapCloudDatabaseIfEmpty = async () => {
  if (!auth.currentUser) return;
  try {
    const athletesSnap = await getDocs(collection(db, 'athletes'));
    if (athletesSnap.empty) {
      console.log('Seeding initial athletes to Firestore...');
      const batch = writeBatch(db);
      INITIAL_ATHLETES.forEach(athlete => {
        batch.set(doc(db, 'athletes', athlete.id), athlete);
      });
      await batch.commit();
    }

    const coachesSnap = await getDocs(collection(db, 'coaches'));
    if (coachesSnap.empty) {
      console.log('Seeding initial coaches to Firestore...');
      const batch = writeBatch(db);
      INITIAL_COACHES.forEach(coach => {
        batch.set(doc(db, 'coaches', coach.id), coach);
      });
      await batch.commit();
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'bootstrap');
  }
};

// ---------------------------------------------------------------------------
// Realtime Subscriptions setup
// ---------------------------------------------------------------------------

export interface CloudSubscriptionsCallbacks {
  onAthletesChange: (athletes: Athlete[]) => void;
  onCoachesChange: (coaches: Coach[]) => void;
  onSessionsChange: (sessions: TrainingSession[]) => void;
  onAttendanceChange: (attendance: AttendanceRecord[]) => void;
  onRpeChange: (rpeList: RpeFeedback[]) => void;
  onIndividualWorkoutsChange: (workouts: IndividualWorkout[]) => void;
  onKickingLogsChange: (logs: KickingLog[]) => void;
  onPhysioNotesChange: (notes: PhysioNote[]) => void;
  onTrainingTasksChange: (tasks: TrainingTask[]) => void;
}

export const subscribeToAllCloudCollections = (callbacks: CloudSubscriptionsCallbacks): Unsubscribe => {
  const unsubs: Unsubscribe[] = [];

  // Athletes
  unsubs.push(
    onSnapshot(collection(db, 'athletes'), (snap) => {
      if (!snap.empty) {
        const list: Athlete[] = [];
        snap.forEach(d => list.push(d.data() as Athlete));
        callbacks.onAthletesChange(list);
        saveAthletes(list);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'athletes'))
  );

  // Coaches
  unsubs.push(
    onSnapshot(collection(db, 'coaches'), (snap) => {
      if (!snap.empty) {
        const list: Coach[] = [];
        snap.forEach(d => list.push(d.data() as Coach));
        callbacks.onCoachesChange(list);
        saveCoaches(list);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'coaches'))
  );

  // Sessions
  unsubs.push(
    onSnapshot(collection(db, 'sessions'), (snap) => {
      const list: TrainingSession[] = [];
      snap.forEach(d => list.push(d.data() as TrainingSession));
      // Sort sessions by date descending
      list.sort((a, b) => b.date.localeCompare(a.date));
      callbacks.onSessionsChange(list);
      saveSessions(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'sessions'))
  );

  // Attendance
  unsubs.push(
    onSnapshot(collection(db, 'attendance'), (snap) => {
      const list: AttendanceRecord[] = [];
      snap.forEach(d => list.push(d.data() as AttendanceRecord));
      callbacks.onAttendanceChange(list);
      saveAttendance(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'attendance'))
  );

  // RPE
  unsubs.push(
    onSnapshot(collection(db, 'rpe'), (snap) => {
      const list: RpeFeedback[] = [];
      snap.forEach(d => list.push(d.data() as RpeFeedback));
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callbacks.onRpeChange(list);
      saveRpe(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'rpe'))
  );

  // Individual Workouts
  unsubs.push(
    onSnapshot(collection(db, 'individualWorkouts'), (snap) => {
      const list: IndividualWorkout[] = [];
      snap.forEach(d => list.push(d.data() as IndividualWorkout));
      list.sort((a, b) => b.date.localeCompare(a.date));
      callbacks.onIndividualWorkoutsChange(list);
      saveIndividualWorkouts(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'individualWorkouts'))
  );

  // Kicking Logs
  unsubs.push(
    onSnapshot(collection(db, 'kickingLogs'), (snap) => {
      const list: KickingLog[] = [];
      snap.forEach(d => list.push(d.data() as KickingLog));
      list.sort((a, b) => b.date.localeCompare(a.date));
      callbacks.onKickingLogsChange(list);
      saveKickingLogs(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'kickingLogs'))
  );

  // Physio Notes
  unsubs.push(
    onSnapshot(collection(db, 'physioNotes'), (snap) => {
      const list: PhysioNote[] = [];
      snap.forEach(d => list.push(d.data() as PhysioNote));
      list.sort((a, b) => b.date.localeCompare(a.date));
      callbacks.onPhysioNotesChange(list);
      savePhysioNotes(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'physioNotes'))
  );

  // Training Tasks
  unsubs.push(
    onSnapshot(collection(db, 'trainingTasks'), (snap) => {
      const list: TrainingTask[] = [];
      snap.forEach(d => list.push(d.data() as TrainingTask));
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callbacks.onTrainingTasksChange(list);
      saveTrainingTasks(list);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'trainingTasks'))
  );

  return () => {
    unsubs.forEach(unsub => unsub());
  };
};
