import { db, auth } from './firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { 
  getStoredAthletes, getStoredCoaches, getStoredSessions, getStoredAttendance, 
  getStoredRpe, getStoredIndividualWorkouts, getStoredKickingLogs, getStoredPhysioNotes,
  getStoredTrainingTasks 
} from './storage';

export const migrateAllData = async () => {
  if (!auth.currentUser) {
    console.warn('Migration postponed: No authenticated user present.');
    return;
  }

  const batch = writeBatch(db);
  let writeCount = 0;

  const dataMap = [
    { key: 'athletes', data: getStoredAthletes() },
    { key: 'coaches', data: getStoredCoaches() },
    { key: 'sessions', data: getStoredSessions() },
    { key: 'attendance', data: getStoredAttendance() },
    { key: 'rpe', data: getStoredRpe() },
    { key: 'individualWorkouts', data: getStoredIndividualWorkouts() },
    { key: 'kickingLogs', data: getStoredKickingLogs() },
    { key: 'physioNotes', data: getStoredPhysioNotes() },
    { key: 'trainingTasks', data: getStoredTrainingTasks() },
  ];

  for (const { key, data } of dataMap) {
    if (!Array.isArray(data) || data.length === 0) continue;
    const colRef = collection(db, key);
    for (const item of data) {
      if (!item) continue;
      const docId = (item as any).id || `${(item as any).athleteId || 'item'}_${(item as any).sessionId || Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const docRef = doc(colRef, String(docId));
      batch.set(docRef, item, { merge: true });
      writeCount++;
    }
  }

  if (writeCount > 0) {
    await batch.commit();
  }
  console.log(`Migration completed successfully with ${writeCount} records.`);
};

