import { Athlete, Coach, TrainingSession, AttendanceRecord, RpeFeedback, IndividualWorkout, KickingLog, PhysioNote, TrainingTask } from '../types';
import { INITIAL_ATHLETES, INITIAL_COACHES, INITIAL_SESSIONS, INITIAL_ATTENDANCE, INITIAL_RPE, INITIAL_INDIVIDUAL_WORKOUTS, INITIAL_KICKING_LOGS, INITIAL_PHYSIO_NOTES } from '../data/initialData';
import { isMondayDeadlinePassedForCurrentWeek } from './dateUtils';
import { encryptStorageData, decryptStorageData } from './security';

const KEYS = {
  ATHLETES: 'villorba_rugby_athletes_v7_clean',
  COACHES: 'villorba_rugby_coaches_v7_clean',
  SESSIONS: 'villorba_rugby_sessions_v7_clean',
  ATTENDANCE: 'villorba_rugby_attendance_v7_clean',
  RPE: 'villorba_rugby_rpe_v7_clean',
  INDIVIDUAL: 'villorba_rugby_individual_v7_clean',
  KICKING: 'villorba_rugby_kicking_v7_clean',
  PHYSIO_NOTES: 'villorba_rugby_physio_notes_v7_clean',
  TRAINING_TASKS: 'villorba_rugby_tasks_v7_clean',
  CURRENT_USER_ID: 'villorba_rugby_current_user_id_v7',
  CURRENT_USER_ROLE: 'villorba_rugby_current_user_role_v7',
  DEADLINE_OVERRIDE: 'villorba_rugby_deadline_override_v7',
};

// Cifratura automatica in scrittura & decifratura/migrazione in lettura (GDPR Art. 9 e Art. 32)
function getEncryptedItem<T>(key: string, defaultVal: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return defaultVal;
  try {
    const decrypted = decryptStorageData(raw);
    return JSON.parse(decrypted);
  } catch {
    try {
      // Fallback per migrazione trasparente da dati in chiaro preesistenti
      return JSON.parse(raw);
    } catch {
      return defaultVal;
    }
  }
}

function setEncryptedItem<T>(key: string, val: T): void {
  try {
    const serialized = JSON.stringify(val);
    const encrypted = encryptStorageData(serialized);
    localStorage.setItem(key, encrypted);
  } catch (err) {
    console.error(`Error saving encrypted ${key}:`, err);
  }
}

export const getStoredAthletes = (): Athlete[] => {
  let list: Athlete[] = getEncryptedItem(KEYS.ATHLETES, INITIAL_ATHLETES);
  let modified = false;

  INITIAL_ATHLETES.forEach(ia => {
    const existingIndex = list.findIndex(a => a.id === ia.id || (a.firstName.trim().toLowerCase() === ia.firstName.trim().toLowerCase() && a.lastName.trim().toLowerCase() === ia.lastName.trim().toLowerCase()));
    if (existingIndex === -1) {
      list.push(ia);
      modified = true;
    } else {
      if (!list[existingIndex].email && ia.email) {
        list[existingIndex] = { ...list[existingIndex], email: ia.email };
        modified = true;
      } else if (ia.email && list[existingIndex].email !== ia.email) {
        list[existingIndex] = { ...list[existingIndex], email: ia.email };
        modified = true;
      }
    }
  });

  if (modified) {
    setEncryptedItem(KEYS.ATHLETES, list);
  }

  return list;
};

export const saveAthletes = (athletes: Athlete[]) => {
  setEncryptedItem(KEYS.ATHLETES, athletes);
};

export const getStoredCoaches = (): Coach[] => {
  let list: Coach[] = getEncryptedItem(KEYS.COACHES, INITIAL_COACHES);
  let modified = false;

  // Ensure c0 (Gianni Grespan) is always present
  if (!list.some(c => c.id === 'c0' || (c.email && c.email.toLowerCase() === 'gianni.grespan@gmail.com'))) {
    list.unshift(INITIAL_COACHES[0]);
    modified = true;
  }

  // Ensure any newly added initial coaches are present or updated
  INITIAL_COACHES.forEach(ic => {
    const existingIndex = list.findIndex(c => c.id === ic.id);
    if (existingIndex === -1) {
      list.push(ic);
      modified = true;
    } else {
      // Check if details changed
      if (list[existingIndex].email !== ic.email) {
        list[existingIndex] = { ...list[existingIndex], email: ic.email };
        modified = true;
      }
    }
  });

  if (modified) {
    setEncryptedItem(KEYS.COACHES, list);
  }

  return list;
};

export const saveCoaches = (coaches: Coach[]) => {
  setEncryptedItem(KEYS.COACHES, coaches);
};

export const getStoredSessions = (): TrainingSession[] => {
  return getEncryptedItem(KEYS.SESSIONS, INITIAL_SESSIONS);
};

export const saveSessions = (sessions: TrainingSession[]) => {
  setEncryptedItem(KEYS.SESSIONS, sessions);
};

export const getStoredAttendance = (): AttendanceRecord[] => {
  return getEncryptedItem(KEYS.ATTENDANCE, INITIAL_ATTENDANCE);
};

export const saveAttendance = (attendance: AttendanceRecord[]) => {
  setEncryptedItem(KEYS.ATTENDANCE, attendance);
};

export const getStoredRpe = (): RpeFeedback[] => {
  return getEncryptedItem(KEYS.RPE, INITIAL_RPE);
};

export const saveRpe = (rpe: RpeFeedback[]) => {
  setEncryptedItem(KEYS.RPE, rpe);
};

export const getStoredIndividualWorkouts = (): IndividualWorkout[] => {
  return getEncryptedItem(KEYS.INDIVIDUAL, INITIAL_INDIVIDUAL_WORKOUTS);
};

export const saveIndividualWorkouts = (workouts: IndividualWorkout[]) => {
  setEncryptedItem(KEYS.INDIVIDUAL, workouts);
};

export const getStoredKickingLogs = (): KickingLog[] => {
  return getEncryptedItem(KEYS.KICKING, INITIAL_KICKING_LOGS);
};

export const saveKickingLogs = (logs: KickingLog[]) => {
  setEncryptedItem(KEYS.KICKING, logs);
};

export const getStoredPhysioNotes = (): PhysioNote[] => {
  return getEncryptedItem(KEYS.PHYSIO_NOTES, INITIAL_PHYSIO_NOTES);
};

export const savePhysioNotes = (notes: PhysioNote[]) => {
  setEncryptedItem(KEYS.PHYSIO_NOTES, notes);
};

export const getStoredTrainingTasks = (): TrainingTask[] => {
  return getEncryptedItem(KEYS.TRAINING_TASKS, []);
};

export const saveTrainingTasks = (tasks: TrainingTask[]) => {
  setEncryptedItem(KEYS.TRAINING_TASKS, tasks);
};

export const getActiveUser = (): { userId: string; role: 'COACH' | 'ATHLETE' } => {

  const userId = localStorage.getItem(KEYS.CURRENT_USER_ID) || 'c1'; // Default Head Coach
  const role = (localStorage.getItem(KEYS.CURRENT_USER_ROLE) as 'COACH' | 'ATHLETE') || 'COACH';
  return { userId, role };
};

export const setActiveUser = (userId: string, role: 'COACH' | 'ATHLETE') => {
  localStorage.setItem(KEYS.CURRENT_USER_ID, userId);
  localStorage.setItem(KEYS.CURRENT_USER_ROLE, role);
};

export const getDeadlineOverride = (): 'AUTO' | 'FORCE_LOCKED' | 'FORCE_UNLOCKED' => {
  return (localStorage.getItem(KEYS.DEADLINE_OVERRIDE) as any) || 'AUTO';
};

export const setDeadlineOverride = (mode: 'AUTO' | 'FORCE_LOCKED' | 'FORCE_UNLOCKED') => {
  localStorage.setItem(KEYS.DEADLINE_OVERRIDE, mode);
};

export const resetAllDataToDefault = () => {
  localStorage.removeItem(KEYS.ATHLETES);
  localStorage.removeItem(KEYS.COACHES);
  localStorage.removeItem(KEYS.SESSIONS);
  localStorage.removeItem(KEYS.ATTENDANCE);
  localStorage.removeItem(KEYS.RPE);
  localStorage.removeItem(KEYS.INDIVIDUAL);
  localStorage.removeItem(KEYS.KICKING);
  localStorage.removeItem(KEYS.PHYSIO_NOTES);
  localStorage.removeItem(KEYS.TRAINING_TASKS);
  localStorage.removeItem(KEYS.DEADLINE_OVERRIDE);
  localStorage.removeItem('hasMigratedToFirebase');
};


// Helper to check if Monday 18:00 deadline is passed for the current week
export const isMondayDeadlinePassed = (): boolean => {
  const override = getDeadlineOverride();
  if (override === 'FORCE_LOCKED') return true;
  if (override === 'FORCE_UNLOCKED') return false;

  return isMondayDeadlinePassedForCurrentWeek();
};
