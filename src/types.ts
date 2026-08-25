export interface TrainingTask {
  id: string;
  assignedByCoachId: string;
  assignedToAthleteId: string | null; // null if assigned to a whole department
  targetMacroRole: MacroRole | null; // null if assigned to individual
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  targetCount?: number; // Target counter objective (e.g. 50, 100)
  unit?: string; // Unit of measurement (e.g. "Ripetizioni", "Minuti", "Sessioni", "Calci")
  progressMap?: Record<string, { currentCount: number; completed: boolean; updatedAt?: string }>; // athleteId -> progress tracking
  completed: boolean;
  createdAt: string;
}

export type MacroRole = 'FORWARDS' | 'BACKS'; // Forwards = Avanti, Backs = Trequarti

export type SpecificRole = 
  | 'Pilone'
  | 'Tallonatore'
  | 'Seconda Linea'
  | 'Terza Linea'
  | 'Terza Linea Flanker'
  | 'Terza Linea Centro'
  | 'Mediano di Mischia'
  | 'Apertura'
  | 'Centro'
  | 'Ala'
  | 'Estremo';

export type UserRole = 'COACH' | 'ATHLETE';

export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  macroRole: MacroRole;
  specificRole?: SpecificRole;
  jerseyNumber?: number;
  email?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export interface Coach {
  id: string;
  name: string;
  title: string; // e.g. "Head Coach", "Assistente", "Preparatrice Atletica", "Staff Medico"
  email: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'DOUBTFUL' | 'NOT_SET';

export interface AttendanceRecord {
  id: string;
  athleteId: string;
  sessionId: string;
  status: AttendanceStatus;
  reason?: string;
  submittedAt?: string;
  modifiedByCoachId?: string; // If overridden by coach
  coachNote?: string;
  staffEditCount?: number; // Contatore modifiche/inserimenti effettuati dallo staff
}

export interface TrainingSession {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string; // e.g. "Allenamento Campo Martedì"
  focusTopic?: string; // Focus della sessione indicato dall'allenatore
  location?: string;
  isCompleted?: boolean;
}

export interface RpeFeedback {
  id: string;
  athleteId: string;
  sessionId: string;
  date: string;
  rpeScore: number; // 1 to 10
  hasDiscomfort: boolean;
  discomfortDetails?: string; // Eventuali fastidi emersi
  discomfortArea?: string; // e.g. Caviglia, Ginocchio, Spalla, Muscolare
  whatWentWell: string; // Cosa ha funzionato bene individualmente
  focusImprovement: string; // Cosa richiede miglioramento sul tema FOCUS
  createdAt: string;
}

export type IndividualWorkoutType = 'PALESTRA' | 'ATLETICA';

export interface IndividualWorkout {
  id: string;
  athleteId: string;
  date: string;
  type: IndividualWorkoutType;
  durationMinutes: number;
  cardName: string; // Nome della scheda (es. "Scheda Forza A", "Corsa Intervallata 15'")
  notes?: string;
  completedPercentage: number; // 0 - 100
  createdAt: string;
}

export interface KickingLog {
  id: string;
  athleteId: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  kickTypes: string; // e.g. "Piazzati, Spostamento"
  notes?: string;
  createdAt: string;
}

export interface WeekPeriod {
  weekNumber: number;
  year: number;
  startDate: string; // Monday date YYYY-MM-DD
  endDate: string; // Sunday date YYYY-MM-DD
  deadlineDateTime: string; // Monday 18:00 ISO string
}

export type HealthStatus = 'IDONEA' | 'IDONEA_LIMITATA' | 'AFFATICATA' | 'IN_RECUPERO' | 'INFORTUNATA';

export interface PhysioNote {
  id: string;
  athleteId: string;
  authorId: string;
  authorName: string;
  authorTitle: string;
  date: string; // YYYY-MM-DD
  healthStatus: HealthStatus;
  summary: string; // Resoconto dello stato di salute
  recommendations: string; // Suggerimenti dati per recupero e riposo
  createdAt: string; // ISO string timestamp
}
