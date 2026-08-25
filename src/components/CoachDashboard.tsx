import React, { useState } from 'react';
import { 
  Shield, Users, Download, Calendar, CheckCircle, XCircle, AlertTriangle, 
  HeartPulse, Dumbbell, Target, Plus, Edit2, Filter, Lock, Unlock, 
  Search, AlertCircle, FileSpreadsheet, Eye, UserCheck, Activity, Trash2,
  KeyRound, Copy, Check, ChevronLeft, ChevronRight, Stethoscope, FileText, Clock, Info, UserPlus
} from 'lucide-react';
import { Athlete, Coach, TrainingSession, AttendanceRecord, RpeFeedback, IndividualWorkout, KickingLog, PhysioNote, HealthStatus, AttendanceStatus, MacroRole, TrainingTask } from '../types';
import { getCurrentWeekMonday, getMondayOfDate, getWeekLabel, formatItalianDate, getWeekDaysForMonday, getPrecedingSunday, isStaffSessionDeadlinePassed } from '../lib/dateUtils';
import { UserAdminPanel } from './UserAdminPanel';
import { TrainingTasksManager } from './TrainingTasksManager';

interface CoachDashboardProps {
  coaches: Coach[];
  currentCoach: Coach;
  athletes: Athlete[];
  sessions: TrainingSession[];
  attendance: AttendanceRecord[];
  rpeList: RpeFeedback[];
  individualWorkouts: IndividualWorkout[];
  kickingLogs: KickingLog[];
  physioNotes: PhysioNote[];
  deadlinePassed: boolean;
  deadlineOverride: 'AUTO' | 'FORCE_LOCKED' | 'FORCE_UNLOCKED';
  onToggleDeadlineOverride: (mode: 'AUTO' | 'FORCE_LOCKED' | 'FORCE_UNLOCKED') => void;
  onUpdateAttendanceByCoach: (athleteId: string, sessionId: string, status: AttendanceStatus, coachNote?: string) => void;
  onUpdateSessionFocus: (sessionId: string, newFocus: string) => void;
  onUpdateSession?: (session: TrainingSession) => void;
  onDeleteSession?: (sessionId: string) => void;
  onAddSession: (newSession: Omit<TrainingSession, 'id'>) => void;
  onSavePhysioNote: (noteData: Omit<PhysioNote, 'id' | 'authorId' | 'authorName' | 'authorTitle' | 'createdAt'>) => void;
  onDeletePhysioNote?: (noteId: string) => void;
  onExportExcel: () => void;
  onOpenRoleSwitcher: () => void;
  onUpdateAthleteRole: (athleteId: string, newMacroRole: MacroRole) => void;
  onRegisterAthlete: (newAthlete: Omit<Athlete, 'id' | 'createdAt' | 'active'>) => void;
  onRegisterCoach: (newCoach: Omit<Coach, 'id'>) => void;
  onUpdateAthlete?: (updatedAthlete: Athlete) => void;
  onUpdateCoach?: (updatedCoach: Coach) => void;
  onDeleteAthlete?: (athleteId: string) => void;
  onDeleteCoach?: (coachId: string) => void;
  onDeleteAllSessions: () => void;
  trainingTasks: TrainingTask[];
  onSaveTrainingTask: (task: Omit<TrainingTask, 'id' | 'createdAt' | 'completed'>) => void;
  onDeleteTrainingTask: (taskId: string) => void;
}

export const CoachDashboard: React.FC<CoachDashboardProps> = ({
  coaches,
  currentCoach,
  athletes,
  sessions,
  attendance,
  rpeList,
  individualWorkouts,
  kickingLogs,
  physioNotes,
  deadlinePassed,
  deadlineOverride,
  onToggleDeadlineOverride,
  onUpdateAttendanceByCoach,
  onUpdateSessionFocus,
  onUpdateSession,
  onDeleteSession,
  onAddSession,
  onSavePhysioNote,
  onDeletePhysioNote,
  onExportExcel,
  onOpenRoleSwitcher,
  onUpdateAthleteRole,
  onRegisterAthlete,
  onRegisterCoach,
  onUpdateAthlete,
  onUpdateCoach,
  onDeleteAthlete,
  onDeleteCoach,
  onDeleteAllSessions,
  trainingTasks,
  onSaveTrainingTask,
  onDeleteTrainingTask,
}) => {
  const isPhysio = currentCoach.title.toLowerCase().includes('fisio') || currentCoach.name.toLowerCase().includes('de franceschi') || currentCoach.name.toLowerCase().includes('pin');
  const isZizzola = currentCoach.email.toLowerCase().includes('fedezizzo10') || currentCoach.name.toLowerCase().includes('zizzola') || currentCoach.title.toLowerCase().includes('direttore');
  const isPreparatrice = currentCoach.title.toLowerCase().includes('preparatric') || currentCoach.name.toLowerCase().includes('chiavaroli') || currentCoach.name.toLowerCase().includes('magatti');

  const [activeTab, setActiveTab] = useState<'PRESENZE' | 'RPE_LOAD' | 'FASTIDI' | 'INDIVIDUALI' | 'CALCI' | 'ROSA' | 'SESSIONS' | 'PHYSIO' | 'USER_ADMIN' | 'COMPITI'>(
    isPhysio ? 'PHYSIO' : isPreparatrice ? 'PRESENZE' : 'PRESENZE'
  );

  // Physio Form & Filter State
  const [selectedAthleteForPhysio, setSelectedAthleteForPhysio] = useState<string>(athletes[0]?.id || '');
  const [physioDate, setPhysioDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [physioHealthStatus, setPhysioHealthStatus] = useState<HealthStatus>('IDONEA');
  const [physioSummary, setPhysioSummary] = useState<string>('');
  const [physioRecommendations, setPhysioRecommendations] = useState<string>('');
  const [physioSuccessMsg, setPhysioSuccessMsg] = useState<boolean>(false);

  // Physio History Search & Filter
  const [physioFilterAthleteId, setPhysioFilterAthleteId] = useState<string>('ALL');
  const [physioSearchTerm, setPhysioSearchTerm] = useState<string>('');

  const handleCreatePhysioNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteForPhysio) return;
    if (!physioSummary.trim() || !physioRecommendations.trim()) {
      alert('Inserisci sia il resoconto dello stato di salute che i suggerimenti per recupero e riposo.');
      return;
    }

    onSavePhysioNote({
      athleteId: selectedAthleteForPhysio,
      date: physioDate,
      healthStatus: physioHealthStatus,
      summary: physioSummary.trim(),
      recommendations: physioRecommendations.trim(),
    });

    setPhysioSummary('');
    setPhysioRecommendations('');
    setPhysioSuccessMsg(true);
    setTimeout(() => setPhysioSuccessMsg(false), 4000);
  };


  
  // Week Filter State
  const currentMonday = getCurrentWeekMonday();
  const [selectedWeekMonday, setSelectedWeekMonday] = useState<string>(currentMonday);

  const availableWeekMondays = Array.from(
    new Set([
      currentMonday,
      ...sessions.map(s => getMondayOfDate(s.date))
    ])
  ).sort();

  // Sessions filtered by selected week for Coach matrix and views
  const displayedSessions = selectedWeekMonday === 'ALL'
    ? sessions
    : sessions.filter(s => getMondayOfDate(s.date) === selectedWeekMonday);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'FORWARDS' | 'BACKS'>('ALL');

  // Edit Coach Override Modal
  const [editingAttendance, setEditingAttendance] = useState<{ athleteId: string; sessionId: string; status: AttendanceStatus; note: string } | null>(null);

  // Edit Session Focus Modal
  const [editingFocusSessionId, setEditingFocusSessionId] = useState<string | null>(null);
  const [newFocusText, setNewFocusText] = useState<string>('');

  // Edit Full Session Modal
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);

  // Add Session Modal
  const [showAddSession, setShowAddSession] = useState<boolean>(false);
  const [creationMode, setCreationMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');
  const [targetWeekMonday, setTargetWeekMonday] = useState<string>(() => getCurrentWeekMonday());
  const [selectedDayIndices, setSelectedDayIndices] = useState<number[]>([1, 2, 4]); // 1=Mar, 2=Mer, 4=Ven
  const [sessionDate, setSessionDate] = useState<string>('');
  const [sessionTime, setSessionTime] = useState<string>('19:30');
  const [sessionTitle, setSessionTitle] = useState<string>('Allenamento Campo');
  const [sessionLocation, setSessionLocation] = useState<string>('Impianto Campo Villorba Rugby');
  const [sessionFocus, setSessionFocus] = useState<string>('');

  const getNextWeekMonday = (mondayStr: string) => {
    const d = new Date(mondayStr + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  // Copy PINs state
  // Removed

  // Helper to count staff modifications/interventions for a specific athlete
  const getAthleteStaffChangesCount = (athleteId: string) => {
    return attendance.filter(att => att.athleteId === athleteId && (att.modifiedByCoachId || (att.staffEditCount && att.staffEditCount > 0))).length;
  };

  const totalStaffModifications = attendance.filter(att => att.modifiedByCoachId || (att.staffEditCount && att.staffEditCount > 0)).length;

  // handleCopyAllPins removed

  // Filtered Athletes
  const filteredAthletes = athletes.filter(a => {
    const matchesSearch = `${a.firstName} ${a.lastName} ${a.specificRole}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' ? true : a.macroRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Calculate quick stats
  const forwardsCount = athletes.filter(a => a.macroRole === 'FORWARDS').length;
  const backsCount = athletes.filter(a => a.macroRole === 'BACKS').length;
  const activeDiscomforts = rpeList.filter(r => r.hasDiscomfort);

  const handleSaveAttendanceOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttendance) return;

    onUpdateAttendanceByCoach(
      editingAttendance.athleteId,
      editingAttendance.sessionId,
      editingAttendance.status,
      editingAttendance.note
    );

    setEditingAttendance(null);
  };

  const handleSaveFocus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFocusSessionId) return;

    onUpdateSessionFocus(editingFocusSessionId, newFocusText);
    setEditingFocusSessionId(null);
  };

  const handleSaveEditedSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    if (onUpdateSession) {
      onUpdateSession(editingSession);
    } else {
      onUpdateSessionFocus(editingSession.id, editingSession.focusTopic || '');
    }
    setEditingSession(null);
  };

  const handleDeleteSingleSession = (sessionId: string, sessionTitle: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare la sessione "${sessionTitle}"? Verranno rimosse anche le relative presenze e RPE.`)) {
      if (onDeleteSession) {
        onDeleteSession(sessionId);
      }
    }
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();

    if (creationMode === 'SINGLE') {
      const activeDate = sessionDate || targetWeekMonday;
      if (!sessionTitle.trim()) return;

      onAddSession({
        date: activeDate,
        time: sessionTime,
        title: sessionTitle.trim(),
        focusTopic: sessionFocus.trim(),
        location: 'Impianto Campo Villorba Rugby',
        isCompleted: false,
      });
    } else {
      if (selectedDayIndices.length === 0) {
        alert('Seleziona almeno un giorno della settimana prima di confermare.');
        return;
      }
      const weekDays = getWeekDaysForMonday(targetWeekMonday);
      const sortedIndices = [...selectedDayIndices].sort((a, b) => a - b);
      
      sortedIndices.forEach((dayIdx) => {
        const dayInfo = weekDays[dayIdx];
        if (dayInfo) {
          onAddSession({
            date: dayInfo.dateStr,
            time: sessionTime,
            title: `${sessionTitle.trim()} - ${dayInfo.dayName}`,
            focusTopic: sessionFocus.trim(),
            location: 'Impianto Campo Villorba Rugby',
            isCompleted: false,
          });
        }
      });
    }

    setShowAddSession(false);
    setSessionTitle('Allenamento Campo');
    setSessionFocus('');
  };

  return (
    <div className="space-y-6">
      
      {/* Coach Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-yellow-500/40 rounded-2xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20 border border-yellow-300">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                  {isPhysio ? 'Area Riservata Staff Fisioterapia' : `Area Riservata Staff (${coaches.length} Componenti)`}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">• {currentCoach.title}</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                {isPhysio ? `Pannello Fisioterapia - ${currentCoach.name}` : `Pannello di Controllo Staff - ${currentCoach.name}`}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                {isPhysio
                  ? `Consultazione dedicata alle risposte sulla domanda "Hai avvertito fastidi fisici o dolori" e monitoraggio infortuni per tutte le ${athletes.length} atlete.`
                  : `Monitoraggio completo presenze, RPE post-allenamento, fastidi fisici e obiettivo calci Trequarti per tutte le ${athletes.length} atlete in rosa.`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onExportExcel}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/40 transition flex items-center gap-2 border border-emerald-400/30"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Scarica Dati Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Atlete in Rosa</div>
            <div className="text-xl font-black text-white mt-0.5">
              {athletes.length} <span className="text-xs text-slate-400 font-normal">({forwardsCount} A / {backsCount} T)</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Scadenza Presenze</div>
            <div className="text-sm font-black text-white mt-1 flex items-center gap-1.5">
              {deadlinePassed ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Bloccato
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Unlock className="w-3.5 h-3.5" /> Aperto
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-purple-900/50 bg-purple-950/20">
            <div className="text-[10px] text-purple-300 font-bold uppercase flex items-center gap-1">
              <span>Cambi Inseriti Staff</span>
            </div>
            <div className="text-xl font-black text-purple-300 mt-0.5">
              {totalStaffModifications} <span className="text-xs text-slate-400 font-normal">interventi</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-rose-500/30 bg-rose-950/20">
            <div className="text-[10px] text-rose-300 font-bold uppercase">Alert Fastidi Fisici</div>
            <div className="text-xl font-black text-rose-400 mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              <span>{activeDiscomforts.length} Segnalazioni</span>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Staff & Medicale</div>
            <div className="text-xl font-black text-yellow-400 mt-0.5">
              {coaches.length} Componenti
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        {/* If Physio, show restricted tabs focused on physical discomforts and pain */}
        {isPhysio ? (
          <>
            <button
              onClick={() => setActiveTab('PHYSIO')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'PHYSIO'
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'bg-slate-900 text-teal-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Note Fisioterapista & Schede Salute ({physioNotes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('FASTIDI')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition relative ${
                activeTab === 'FASTIDI'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'bg-slate-900 text-rose-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Fastidi / Infortuni</span>
              {activeDiscomforts.length > 0 && (
                <span className="bg-rose-950 text-rose-200 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-rose-500/50">
                  {activeDiscomforts.length}
                </span>
              )}
            </button>
          </>
        ) : isPreparatrice ? (
          <>
            <button
              onClick={() => setActiveTab('PRESENZE')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'PRESENZE'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Matrice Presenze & Modifiche Staff</span>
            </button>

            <button
              onClick={() => setActiveTab('FASTIDI')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition relative ${
                activeTab === 'FASTIDI'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'bg-slate-900 text-rose-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Report Fastidi / Infortuni</span>
              {activeDiscomforts.length > 0 && (
                <span className="bg-rose-950 text-rose-200 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-rose-500/50">
                  {activeDiscomforts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('PHYSIO')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'PHYSIO'
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'bg-slate-900 text-teal-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Note Fisioterapista & Schede Salute ({physioNotes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('INDIVIDUALI')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'INDIVIDUALI'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-slate-900 text-purple-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>Allenamenti Individuali ({individualWorkouts.length})</span>
            </button>
          </>
        ) : isZizzola ? (
          <>
            <button
              onClick={() => setActiveTab('PRESENZE')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'PRESENZE'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>1. Matrice Presenze & Modifiche Staff</span>
            </button>

            <button
              onClick={() => setActiveTab('FASTIDI')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition relative ${
                activeTab === 'FASTIDI'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'bg-slate-900 text-rose-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>2. Report Fastidi / Infortuni</span>
              {activeDiscomforts.length > 0 && (
                <span className="bg-rose-950 text-rose-200 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-rose-500/50">
                  {activeDiscomforts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('PHYSIO')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'PHYSIO'
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'bg-slate-900 text-teal-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>3. Note Fisioterapista & Schede Salute ({physioNotes.length})</span>
            </button>
          </>
        ) : (
          /* Full Coach / Staff Tabs */
          <>
            <button
              onClick={() => setActiveTab('PRESENZE')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'PRESENZE'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>1. Matrice Presenze & Modifiche Staff</span>
            </button>

            <button
              onClick={() => setActiveTab('RPE_LOAD')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'RPE_LOAD'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <HeartPulse className="w-4 h-4" />
              <span>2. Monitoraggio RPE & Focus</span>
            </button>

            <button
              onClick={() => setActiveTab('FASTIDI')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition relative ${
                activeTab === 'FASTIDI'
                  ? 'bg-rose-600 text-white shadow-lg'
                  : 'bg-slate-900 text-rose-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>3. Report Fastidi / Infortuni</span>
              {activeDiscomforts.length > 0 && (
                <span className="bg-rose-950 text-rose-200 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-rose-500/50">
                  {activeDiscomforts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('PHYSIO')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'PHYSIO'
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'bg-slate-900 text-teal-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>4. Note Fisioterapia & Schede Salute ({physioNotes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('INDIVIDUALI')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'INDIVIDUALI'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-slate-900 text-emerald-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>5. Allenamenti Individuali ({individualWorkouts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('CALCI')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'CALCI'
                  ? 'bg-cyan-600 text-white shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>6. Calci Trequarti (45 min)</span>
            </button>

            <button
              onClick={() => setActiveTab('ROSA')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'ROSA'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>7. Anagrafica Rosa ({athletes.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('SESSIONS')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'SESSIONS'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              <span>8. Gestione Sessioni & Focus</span>
            </button>

            <button
              onClick={() => setActiveTab('COMPITI')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'COMPITI'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>9. Assegna Compiti</span>
            </button>

            <button
              onClick={() => setActiveTab('USER_ADMIN')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
                activeTab === 'USER_ADMIN'
                  ? 'bg-yellow-500 text-slate-950 font-extrabold shadow-lg'
                  : 'bg-slate-900 text-yellow-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>9. Gestione Utenti & Credenziali</span>
            </button>
          </>
        )}
      </div>


      {/* TAB COMPITI */}
      {activeTab === 'COMPITI' && (
        <TrainingTasksManager
          tasks={trainingTasks}
          athletes={athletes}
          onSaveTask={onSaveTrainingTask}
          onDeleteTask={onDeleteTrainingTask}
        />
      )}

      {/* USER ADMIN PANEL */}
      {activeTab === 'USER_ADMIN' && (
        <UserAdminPanel 
          athletes={athletes} 
          coaches={coaches} 
          onRegisterAthlete={onRegisterAthlete}
          onRegisterCoach={onRegisterCoach}
          onUpdateAthlete={onUpdateAthlete}
          onUpdateCoach={onUpdateCoach}
          onDeleteAthlete={onDeleteAthlete}
          onDeleteCoach={onDeleteCoach}
        />
      )}


      {/* TAB 1: MATRICE PRESENZE */}
      {activeTab === 'PRESENZE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
          
          {/* Week Filter Bar for Coaches */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 shrink-0">
                <Calendar className="w-4 h-4 text-blue-400" />
                Filtra Settimana:
              </span>

              <select
                value={selectedWeekMonday}
                onChange={(e) => setSelectedWeekMonday(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Tutte le Settimane (Stagione Completa)</option>
                {availableWeekMondays.map(mStr => {
                  const label = getWeekLabel(mStr);
                  const isCurr = mStr === currentMonday;
                  return (
                    <option key={mStr} value={mStr}>
                      {label} {isCurr ? '★ (IN CORSO)' : mStr < currentMonday ? '(Passata)' : '(Futura)'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="bg-purple-950 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-500/30">
                {totalStaffModifications} Modifiche Staff Totali
              </span>
              {selectedWeekMonday !== 'ALL' && selectedWeekMonday !== currentMonday && (
                <button
                  onClick={() => setSelectedWeekMonday(currentMonday)}
                  className="text-xs font-bold text-blue-400 hover:underline"
                >
                  Vai a settimana in corso
                </button>
              )}
            </div>
          </div>

          {/* Controls & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cerca atleta..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                <option value="ALL">Tutti i Reparti</option>
                <option value="FORWARDS">Solo Avanti (Forwards)</option>
                <option value="BACKS">Solo Trequarti (Backs)</option>
              </select>
            </div>

            <div className="text-xs text-slate-400 italic">
              * Fai clic su uno stato per modificarlo come Staff
            </div>
          </div>

          {/* Attendance Matrix Table */}
          {displayedSessions.length === 0 ? (
            <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">Nessuna sessione di allenamento in programma per {selectedWeekMonday === 'ALL' ? 'la stagione' : getWeekLabel(selectedWeekMonday)}</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Nessun allenamento prestabilito. Tutto viene inserito manualmente dallo staff: programma gli orari e fissa i temi focus della settimana.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (selectedWeekMonday !== 'ALL') {
                    setTargetWeekMonday(selectedWeekMonday);
                    setSessionDate(selectedWeekMonday);
                  }
                  setShowAddSession(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Programma Allenamenti per questa Settimana</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4 font-bold">Atleta</th>
                  <th className="py-3 px-3 font-bold">Reparto</th>
                  <th className="py-3 px-3 font-bold text-purple-300">Cambi Staff</th>
                  {displayedSessions.map(s => (
                    <th key={s.id} className="py-3 px-3 font-bold">
                      <div className="text-white font-extrabold">{formatItalianDate(s.date)}</div>
                      <div className="text-[10px] text-yellow-400 font-normal">{s.title.substring(0, 22)}...</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredAthletes.map((a) => {
                  const staffChanges = getAthleteStaffChangesCount(a.id);

                  return (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        <span>{a.lastName} {a.firstName}</span>
                        {a.jerseyNumber && (
                          <span className="text-[10px] font-bold bg-slate-800 text-yellow-400 px-1.5 py-0.5 rounded">
                            #{a.jerseyNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          a.macroRole === 'FORWARDS' ? 'bg-amber-400/10 text-amber-400' : 'bg-cyan-400/10 text-cyan-400'
                        }`}>
                          {a.macroRole === 'FORWARDS' ? 'Avanti' : 'Trequarti'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {staffChanges > 0 ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                            {staffChanges} {staffChanges === 1 ? 'cambio' : 'cambi'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-mono px-2 py-0.5">0</span>
                        )}
                      </td>

                      {displayedSessions.map(s => {
                      const rec = attendance.find(att => att.athleteId === a.id && att.sessionId === s.id);
                      const status = rec?.status || 'NOT_SET';

                      return (
                        <td key={s.id} className="py-3 px-3">
                          <button
                            onClick={() => setEditingAttendance({
                              athleteId: a.id,
                              sessionId: s.id,
                              status,
                              note: rec?.reason || ''
                            })}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                              status === 'PRESENT'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                : status === 'ABSENT'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                                : status === 'DOUBTFUL'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                                : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {status === 'PRESENT' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                            {status === 'ABSENT' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                            {status === 'DOUBTFUL' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                            
                            <span>
                              {status === 'PRESENT' ? 'Presente' : status === 'ABSENT' ? 'Assente' : status === 'DOUBTFUL' ? 'In Dubbio' : 'Non Inserito'}
                            </span>

                            {rec?.modifiedByCoachId && (
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" title="Modificato da Staff" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* TAB 2: MONITORAGGIO RPE & LOAD */}
      {activeTab === 'RPE_LOAD' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-amber-400" />
              Report Sforzo RPE e Feedback Individuali per Sessione
            </h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4 font-bold">Atleta</th>
                  <th className="py-3 px-3 font-bold">Sessione</th>
                  <th className="py-3 px-3 font-bold">RPE (1-10)</th>
                  <th className="py-3 px-3 font-bold">Fastidio Fisico</th>
                  <th className="py-3 px-4 font-bold">Cosa ha funzionato bene</th>
                  <th className="py-3 px-4 font-bold">Miglioramento Focus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rpeList.map((item) => {
                  const athlete = athletes.find(a => a.id === item.athleteId);
                  const session = sessions.find(s => s.id === item.sessionId);

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-white">
                        {athlete ? `${athlete.lastName} ${athlete.firstName}` : item.athleteId}
                        <div className="text-[10px] text-slate-400">
                          {athlete?.macroRole === 'FORWARDS' ? 'Avanti' : 'Trequarti'}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-300">
                        {session?.title || item.date}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-lg font-black ${getRpeBadgeColor(item.rpeScore)}`}>
                          RPE {item.rpeScore}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {item.hasDiscomfort ? (
                          <span className="font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> {item.discomfortArea}: {item.discomfortDetails}
                          </span>
                        ) : (
                          <span className="text-emerald-400">Nessuno</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-300 max-w-xs">
                        {item.whatWentWell}
                      </td>

                      <td className="py-3 px-4 text-amber-200 font-medium max-w-xs">
                        {item.focusImprovement}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REPORT FASTIDI E INFORTUNI */}
      {activeTab === 'FASTIDI' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-base text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Registro Fastidi e Dolori Segnalati dalle Atlete
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Utilizza questo pannello per coordinare interventi immediati con la Preparatrice Atletica ed il Medico/Fisioterapista.
              </p>
            </div>
          </div>

          {activeDiscomforts.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-emerald-400">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="font-bold text-sm">Nessuna segnalazione di infortunio o fastidio attivo al momento!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeDiscomforts.map((item) => {
                const athlete = athletes.find(a => a.id === item.athleteId);
                const session = sessions.find(s => s.id === item.sessionId);

                return (
                  <div key={item.id} className="bg-slate-950 border border-rose-500/40 rounded-xl p-4 text-white shadow-lg space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="font-bold text-base text-white">
                        {athlete ? `${athlete.lastName} ${athlete.firstName}` : item.athleteId}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                        {item.discomfortArea}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300">
                      <strong>Sessione:</strong> {session?.title || item.date}
                    </div>

                    <div className="text-xs text-rose-200 bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/20 font-medium">
                      "{item.discomfortDetails}"
                    </div>

                    <div className="text-[11px] text-slate-400 flex justify-between items-center pt-1 border-t border-slate-800/60 mt-2">
                      <span>RPE Sessione: <strong className="text-amber-400">{item.rpeScore}/10</strong></span>
                      <span>{new Date(item.createdAt).toLocaleDateString('it-IT')}</span>
                    </div>

                    {/* Physio Note Preview for this Athlete */}
                    {(() => {
                      const athletePhysioNotes = physioNotes.filter(n => n.athleteId === item.athleteId);
                      const latestNote = athletePhysioNotes[0];
                      if (!latestNote) return null;

                      return (
                        <div className="bg-teal-950/40 border border-teal-500/30 rounded-lg p-2.5 mt-2 space-y-1 text-xs">
                          <div className="flex items-center justify-between text-[10px] font-bold text-teal-300">
                            <span className="flex items-center gap-1">
                              <Stethoscope className="w-3.5 h-3.5" /> Note Paola De Franceschi ({formatItalianDate(latestNote.date)})
                            </span>
                            <span className="bg-teal-900/80 text-teal-200 px-1.5 py-0.5 rounded font-mono text-[9px] border border-teal-500/30">
                              {latestNote.healthStatus}
                            </span>
                          </div>
                          <p className="text-slate-200 text-[11px]">
                            <strong>Resoconto:</strong> {latestNote.summary}
                          </p>
                          <p className="text-amber-200 text-[11px]">
                            <strong>Consigli:</strong> {latestNote.recommendations}
                          </p>
                        </div>
                      );
                    })()}

                    <button
                      onClick={() => {
                        setPhysioFilterAthleteId(item.athleteId);
                        setSelectedAthleteForPhysio(item.athleteId);
                        setActiveTab('PHYSIO');
                      }}
                      className="mt-2 text-[11px] font-bold text-teal-400 hover:text-teal-300 underline flex items-center gap-1"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      Consulta o Aggiungi Scheda Fisioterapica Atleta
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB PHYSIO: SCHEDE FISIOTERAPIA & NOTE SALUTE */}
      {activeTab === 'PHYSIO' && (
        <div className="space-y-6">
          {/* Header Description */}
          <div className="bg-slate-900 border border-teal-500/30 rounded-2xl p-5 text-white shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-teal-400 flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-teal-400" />
                  Note Fisioterapia & Schede Stato di Salute Atlete
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Pannello dedicato alle valutazioni della Fisioterapista <strong>Paola De Franceschi</strong> e visibile a tutto lo staff. Permette di registrare un breve resoconto sullo stato di salute e i suggerimenti di recupero/riposo per ogni singola atleta.
                </p>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-teal-500/20 text-xs flex items-center gap-3 whitespace-nowrap">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Note Totali</span>
                  <span className="font-black text-teal-300 text-sm">{physioNotes.length} Schede</span>
                </div>
                <div className="w-px h-6 bg-slate-800" />
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Infortuni / Recuperi</span>
                  <span className="font-black text-rose-400 text-sm">
                    {physioNotes.filter(n => n.healthStatus === 'INFORTUNATA' || n.healthStatus === 'IN_RECUPERO' || n.healthStatus === 'AFFATICATA').length} Atlete
                  </span>
                </div>
              </div>
            </div>

            {/* Form for Creating a Physio Note */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 text-white space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-teal-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  Nuova Scheda Fisioterapica / Valutazione Atleta
                </h4>
                <span className="text-[11px] text-slate-400 font-medium">
                  Autore: <strong className="text-teal-300">{currentCoach.name} ({currentCoach.title})</strong>
                </span>
              </div>

              {physioSuccessMsg && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Nota fisioterapica salvata con successo e storicizzata per l'atleta!
                </div>
              )}

              <form onSubmit={handleCreatePhysioNoteSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Atleta Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Seleziona Atleta *
                    </label>
                    <select
                      value={selectedAthleteForPhysio}
                      onChange={(e) => setSelectedAthleteForPhysio(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-medium"
                      required
                    >
                      <option value="" disabled>-- Seleziona un'atleta --</option>
                      {athletes.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.lastName} {a.firstName} ({a.macroRole === 'FORWARDS' ? 'Avanti' : 'Trequarti'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Data Visita */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Data Valutazione *
                    </label>
                    <input
                      type="date"
                      value={physioDate}
                      onChange={(e) => setPhysioDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-medium"
                      required
                    />
                  </div>

                  {/* Stato di Salute & Idoneità */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Stato di Salute & Idoneità *
                    </label>
                    <select
                      value={physioHealthStatus}
                      onChange={(e) => setPhysioHealthStatus(e.target.value as HealthStatus)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-bold"
                    >
                      <option value="IDONEA">🟩 Idonea (100%)</option>
                      <option value="IDONEA_LIMITATA">🟨 Idonea con Limitazioni (No contatto)</option>
                      <option value="AFFATICATA">🟧 Affaticata (Carichi ridotti / Scarico)</option>
                      <option value="IN_RECUPERO">🟦 In Recupero / Fisioterapia</option>
                      <option value="INFORTUNATA">🟥 Infortunata / Non Idonea</option>
                    </select>
                  </div>
                </div>

                {/* Resoconto Stato di Salute */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Resoconto Stato di Salute (Sintomi, Diagnosi, Valutazione Funzionale) *
                  </label>
                  <textarea
                    value={physioSummary}
                    onChange={(e) => setPhysioSummary(e.target.value)}
                    placeholder="Esempio: Risentimento al quadricipite sinistro avvertito durante l'ultimo allenamento. Test palpatorio positivo sul terzo medio, nessun ematoma visibile..."
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                {/* Suggerimenti Recupero e Riposo */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Suggerimenti Dati per Recupero, Riposo e Gestione Allenamenti *
                  </label>
                  <textarea
                    value={physioRecommendations}
                    onChange={(e) => setPhysioRecommendations(e.target.value)}
                    placeholder="Esempio: Consigliate 48h di riposo attivo, applicazione di ghiaccio 3 volte al giorno (15 min), seduta di tecarterapia giovedì. Evitare contatto e salti in touch fino a lunedì..."
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Registra Nota Fisioterapica
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Storicizzazione & Registro Note per Singola Atleta */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" />
                  Storico Schede e Registro Valutazioni Fisioterapiche
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Filtra per singola atleta per consultare l'intero storico clinico e di recupero.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Search text */}
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Cerca sintomo, consiglio..."
                    value={physioSearchTerm}
                    onChange={(e) => setPhysioSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Filter Athlete */}
                <select
                  value={physioFilterAthleteId}
                  onChange={(e) => setPhysioFilterAthleteId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">Tutte le Atlete ({athletes.length})</option>
                  {athletes.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.lastName} {a.firstName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note Cards List */}
            {(() => {
              const filteredNotes = physioNotes.filter(n => {
                if (physioFilterAthleteId !== 'ALL' && n.athleteId !== physioFilterAthleteId) return false;
                if (physioSearchTerm.trim()) {
                  const athlete = athletes.find(a => a.id === n.athleteId);
                  const searchLower = physioSearchTerm.toLowerCase();
                  const matchName = athlete ? `${athlete.firstName} ${athlete.lastName}`.toLowerCase().includes(searchLower) : false;
                  const matchSummary = n.summary.toLowerCase().includes(searchLower);
                  const matchRecs = n.recommendations.toLowerCase().includes(searchLower);
                  return matchName || matchSummary || matchRecs;
                }
                return true;
              }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              if (filteredNotes.length === 0) {
                return (
                  <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 space-y-2">
                    <Stethoscope className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
                    <p className="font-bold text-sm">Nessuna nota fisioterapica trovata per i filtri selezionati.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredNotes.map((note) => {
                    const athlete = athletes.find(a => a.id === note.athleteId);
                    const statusConfig = {
                      IDONEA: { label: 'Idonea (100%)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
                      IDONEA_LIMITATA: { label: 'Idonea con Limitazioni', bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
                      AFFATICATA: { label: 'Affaticata / Scarico', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
                      IN_RECUPERO: { label: 'In Recupero / Fisioterapia', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
                      INFORTUNATA: { label: 'Infortunata / Non Idonea', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
                    }[note.healthStatus];

                    return (
                      <div key={note.id} className="bg-slate-950 border border-slate-800 hover:border-teal-500/40 rounded-xl p-4 sm:p-5 text-white transition space-y-3">
                        {/* Header card */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center font-black text-xs">
                              {athlete?.jerseyNumber ? `#${athlete.jerseyNumber}` : '🏉'}
                            </div>
                            <div>
                              <h5 className="font-extrabold text-sm text-white">
                                {athlete ? `${athlete.lastName} ${athlete.firstName}` : note.athleteId}
                              </h5>
                              <div className="text-[10px] text-slate-400">
                                {athlete?.macroRole === 'FORWARDS' ? 'Reparto Avanti' : 'Reparto Trequarti'} • {athlete?.specificRole || 'Atleta'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusConfig.bg}`}>
                              {statusConfig.label}
                            </span>

                            {onDeletePhysioNote && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Eliminare questa nota fisioterapica dallo storico?')) {
                                    onDeletePhysioNote(note.id);
                                  }
                                }}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                title="Elimina nota"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Author & Date */}
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>Data Valutazione: <strong className="text-slate-200">{formatItalianDate(note.date)}</strong></span>
                          <span>•</span>
                          <span>Redatta da: <strong className="text-teal-300">{note.authorName} ({note.authorTitle})</strong></span>
                        </div>

                        {/* Summary & Recommendations */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                          {/* Resoconto */}
                          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
                            <div className="text-[10px] text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Stethoscope className="w-3 h-3" /> Resoconto Stato di Salute
                            </div>
                            <p className="text-slate-200 leading-relaxed font-medium">
                              {note.summary}
                            </p>
                          </div>

                          {/* Suggerimenti */}
                          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
                            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Activity className="w-3 h-3" /> Suggerimenti Recupero & Riposo
                            </div>
                            <p className="text-amber-100/90 leading-relaxed font-medium">
                              {note.recommendations}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}


      {/* TAB 4: ALLENAMENTI INDIVIDUALI (PALESTRA & ATLETICA) */}
      {activeTab === 'INDIVIDUALI' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-emerald-400 flex items-center gap-2">
                <Dumbbell className="w-5 h-5" />
                Monitoraggio Allenamenti Individuali (Palestra & Atletica)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Visualizza le sessioni extra-campo registrate dalle atlete (schede forza, cardio, intervallati).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cerca atleta o scheda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Sessioni Totali</div>
              <div className="text-xl font-black text-white mt-0.5">{individualWorkouts.length}</div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Totale Palestra</div>
              <div className="text-xl font-black text-amber-400 mt-0.5">
                {individualWorkouts.filter(w => w.type === 'PALESTRA').reduce((acc, curr) => acc + curr.durationMinutes, 0)} min
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Totale Atletica</div>
              <div className="text-xl font-black text-cyan-400 mt-0.5">
                {individualWorkouts.filter(w => w.type === 'ATLETICA').reduce((acc, curr) => acc + curr.durationMinutes, 0)} min
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 uppercase font-bold">% Medio Completamento</div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">
                {individualWorkouts.length > 0
                  ? Math.round(individualWorkouts.reduce((acc, curr) => acc + curr.completedPercentage, 0) / individualWorkouts.length)
                  : 0}%
              </div>
            </div>
          </div>

          {/* Table of Individual Workouts */}
          {individualWorkouts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
              <Dumbbell className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
              <p className="font-bold text-slate-400 text-sm">Nessun allenamento individuale registrato finora.</p>
              <p className="text-xs text-slate-500 mt-1">Le atlete vedranno la loro sezione personale per inserire schede forza e atletica.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-4 font-bold">Data</th>
                    <th className="py-3 px-4 font-bold">Atleta</th>
                    <th className="py-3 px-3 font-bold">Tipo</th>
                    <th className="py-3 px-4 font-bold">Scheda / Attività</th>
                    <th className="py-3 px-3 font-bold">Durata</th>
                    <th className="py-3 px-3 font-bold">Completamento</th>
                    <th className="py-3 px-4 font-bold">Note Atleta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {individualWorkouts
                    .filter(w => {
                      const athlete = athletes.find(a => a.id === w.athleteId);
                      const nameMatch = athlete ? `${athlete.firstName} ${athlete.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) : true;
                      const cardMatch = w.cardName.toLowerCase().includes(searchTerm.toLowerCase());
                      return nameMatch || cardMatch;
                    })
                    .map((workout) => {
                      const athlete = athletes.find(a => a.id === workout.athleteId);
                      return (
                        <tr key={workout.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 text-slate-300 font-medium whitespace-nowrap">
                            {workout.date}
                          </td>
                          <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                            {athlete ? `${athlete.lastName} ${athlete.firstName}` : 'Atleta Sconosciuta'}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {workout.type === 'PALESTRA' ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1 w-fit">
                                <Dumbbell className="w-3 h-3" /> PALESTRA
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] flex items-center gap-1 w-fit">
                                <Activity className="w-3 h-3" /> ATLETICA
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-200">
                            {workout.cardName}
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-300 whitespace-nowrap">
                            {workout.durationMinutes} min
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                                <div
                                  className="bg-emerald-500 h-full rounded-full"
                                  style={{ width: `${workout.completedPercentage}%` }}
                                />
                              </div>
                              <span className="font-black text-slate-200 text-[11px]">
                                {workout.completedPercentage}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400 italic">
                            {workout.notes || '—'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CALCI TREQUARTI (45 MIN) */}
      {activeTab === 'CALCI' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-cyan-400 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Verifica Obiettivo Calci Trequarti (Minimo 45 Minuti/Settimana)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tutte le giocate dei Trequarti (Backs) devono registrare autonomamente i minuti di calcio individuale svolti.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-4 font-bold">Atleta (Trequarti)</th>
                  <th className="py-3 px-3 font-bold">Ruolo Specifico</th>
                  <th className="py-3 px-3 font-bold">Minuti Totali</th>
                  <th className="py-3 px-3 font-bold">Stato Obiettivo (45m)</th>
                  <th className="py-3 px-4 font-bold">Dettagli Ultima Sessione</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {athletes.filter(a => a.macroRole === 'BACKS').map((a) => {
                  const logs = kickingLogs.filter(k => k.athleteId === a.id);
                  const totalMin = logs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
                  const isReached = totalMin >= 45;
                  const lastLog = logs[logs.length - 1];

                  return (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-white">
                        {a.lastName} {a.firstName}
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {a.specificRole || 'Trequarti'}
                      </td>

                      <td className="py-3 px-3 text-sm font-black text-cyan-300">
                        {totalMin} min
                      </td>

                      <td className="py-3 px-3">
                        {isReached ? (
                          <span className="font-extrabold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3.5 h-3.5" /> RAGGIUNTO (≥45m)
                          </span>
                        ) : (
                          <span className="font-extrabold text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3.5 h-3.5" /> Mancano {45 - totalMin} min
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {lastLog ? (
                          <span>{lastLog.date}: {lastLog.durationMinutes}m ({lastLog.kickTypes})</span>
                        ) : (
                          <span className="text-slate-600 font-italic">Nessuna sessione registrata</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: ANAGRAFICA ROSA */}
      {activeTab === 'ROSA' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-base text-white">Anagrafica Rosa ({athletes.length} Atlete)</h3>
              <p className="text-xs text-slate-400">
                Puoi cambiare il reparto di un'atleta (Avanti / Trequarti) in qualsiasi momento.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenRoleSwitcher}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Registra Nuova Atleta</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {athletes.map((a) => {
              const staffCount = getAthleteStaffChangesCount(a.id);

              return (
                <div key={a.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-white">
                      {a.lastName} {a.firstName} {a.jerseyNumber && <span className="text-yellow-400 text-xs">#{a.jerseyNumber}</span>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{a.specificRole || 'Giocatrice'}</div>
                    <div className="text-[11px] font-semibold text-purple-300 mt-1 flex items-center gap-1">
                      <span>Cambi Staff:</span>
                      <span className={`px-1.5 py-0.2 rounded font-mono font-bold ${staffCount > 0 ? 'bg-purple-900/60 text-purple-200 border border-purple-500/30' : 'text-slate-500'}`}>
                        {staffCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setPhysioFilterAthleteId(a.id);
                        setSelectedAthleteForPhysio(a.id);
                        setActiveTab('PHYSIO');
                      }}
                      className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold text-xs hover:bg-teal-500/30 transition flex items-center gap-1"
                      title="Apri o aggiungi note fisioterapiche per quest'atleta"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold">{physioNotes.filter(n => n.athleteId === a.id).length}</span>
                    </button>

                    <button
                      onClick={() => onUpdateAthleteRole(a.id, a.macroRole === 'FORWARDS' ? 'BACKS' : 'FORWARDS')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition ${
                        a.macroRole === 'FORWARDS'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                      title="Clicca per cambiare reparto (Avanti / Trequarti)"
                    >
                      {a.macroRole === 'FORWARDS' ? 'Avanti' : 'Trequarti'}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 6: GESTIONE SESSIONI & FOCUS */}
      {activeTab === 'SESSIONS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
            <div>
              <h3 className="font-bold text-base text-white">Programma Sessioni & Temi FOCUS</h3>
              <p className="text-xs text-slate-400">
                Inserisci gli allenamenti previsti e fissa il FOCUS tattico/tecnico su cui le atlete dovranno fornire il loro riscontro.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {sessions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Sei sicuro di voler eliminare TUTTI gli allenamenti in programma? Questa azione è irreversibile.')) {
                      onDeleteAllSessions();
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Elimina Tutti</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setTargetWeekMonday(getCurrentWeekMonday());
                  setSessionDate('');
                  setShowAddSession(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Programma Nuova Sessione</span>
              </button>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-3">
              <Calendar className="w-12 h-12 text-indigo-400/50 mx-auto" />
              <h4 className="text-base font-bold text-white">Nessun allenamento prestabilito</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Il database è pulito e pronto per la stagione. Gli allenatori possono fissare gli allenamenti previsti e i temi focus per ogni settimana, a partire dalla settimana del 17 Agosto o successive.
              </p>
              <button
                type="button"
                onClick={() => {
                  setTargetWeekMonday('2026-08-17');
                  setSessionDate('2026-08-18');
                  setShowAddSession(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Programma Allenamento (dal 17 Agosto)</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2.5 py-0.5 rounded-lg border border-yellow-400/20">
                        {formatItalianDate(s.date)} • Ore {s.time}
                      </span>
                      <h4 className="font-bold text-sm text-white">{s.title}</h4>
                      {s.location && (
                        <span className="text-[11px] text-slate-400 italic">
                          ({s.location})
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <strong className="text-yellow-400">FOCUS Sessione:</strong> {s.focusTopic || 'Nessun focus inserito'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingSession(s)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                      title="Modifica data, orario, titolo e focus"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Modifica</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingFocusSessionId(s.id);
                        setNewFocusText(s.focusTopic || '');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30 text-xs font-bold transition flex items-center gap-1.5"
                      title="Modifica rapida solo del tema FOCUS"
                    >
                      <span>Focus</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSingleSession(s.id, s.title)}
                      className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-bold transition"
                      title="Elimina questa sessione"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: EDIT FULL SESSION */}
      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" />
                Modifica Sessione di Allenamento
              </h3>
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-2 py-1 rounded-lg"
              >
                ✕ Chiudi
              </button>
            </div>

            <form onSubmit={handleSaveEditedSession} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Titolo Sessione *</label>
                <input
                  type="text"
                  required
                  value={editingSession.title}
                  onChange={(e) => setEditingSession({ ...editingSession, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={editingSession.date}
                    onChange={(e) => setEditingSession({ ...editingSession, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Orario *</label>
                  <input
                    type="time"
                    required
                    value={editingSession.time}
                    onChange={(e) => setEditingSession({ ...editingSession, time: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Luogo</label>
                <input
                  type="text"
                  value={editingSession.location}
                  onChange={(e) => setEditingSession({ ...editingSession, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tema FOCUS Sessione</label>
                <textarea
                  rows={3}
                  value={editingSession.focusTopic || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, focusTopic: e.target.value })}
                  placeholder="Es. Continuità diretta ed efficienza nei sostegni tattici..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg"
                >
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STAFF ATTENDANCE OVERRIDE */}
      {editingAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-white">Modifica Presenza (Staff Allenatori)</h3>
            <p className="text-xs text-slate-400">
              Modifica manuale riservata allo staff per problematiche dell'ultimo minuto.
            </p>

            <form onSubmit={handleSaveAttendanceOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Stato Presenza *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAttendance({ ...editingAttendance, status: 'PRESENT' })}
                    className={`py-2 px-2 rounded-xl text-xs font-bold ${
                      editingAttendance.status === 'PRESENT' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    Presente
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingAttendance({ ...editingAttendance, status: 'ABSENT' })}
                    className={`py-2 px-2 rounded-xl text-xs font-bold ${
                      editingAttendance.status === 'ABSENT' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    Assente
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingAttendance({ ...editingAttendance, status: 'DOUBTFUL' })}
                    className={`py-2 px-2 rounded-xl text-xs font-bold ${
                      editingAttendance.status === 'DOUBTFUL' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400'
                    }`}
                  >
                    In Dubbio
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nota Staff / Motivazione</label>
                <input
                  type="text"
                  value={editingAttendance.note}
                  onChange={(e) => setEditingAttendance({ ...editingAttendance, note: e.target.value })}
                  placeholder="Es. Avvisato via WhatsApp il coach per turno di lavoro..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAttendance(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Salva Modifica Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT FOCUS */}
      {editingFocusSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-white">Aggiorna FOCUS della Sessione</h3>

            <form onSubmit={handleSaveFocus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Testo FOCUS *</label>
                <textarea
                  rows={3}
                  required
                  value={newFocusText}
                  onChange={(e) => setNewFocusText(e.target.value)}
                  placeholder="Es. Salita difensiva coordinata e placcaggio avanzante..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFocusSessionId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-slate-950 font-black text-xs"
                >
                  Pubblica FOCUS per le Atlete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SESSION & FULL WEEK SCHEDULER */}
      {showAddSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 sm:p-6 text-white shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                  Programma Sessione / Allenamenti Settimanali
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Seleziona i giorni di allenamento della settimana per le atlete.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSession(false)}
                className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-2.5 py-1 rounded-lg"
              >
                ✕ Chiudi
              </button>
            </div>

            {/* RULE BANNER: SUNDAY DEADLINE */}
            <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-3.5 text-xs text-indigo-200 space-y-1.5">
              <div className="font-extrabold text-indigo-300 flex items-center gap-1.5 text-xs">
                <Clock className="w-4 h-4 text-amber-400" />
                Regolamento Staff: Scadenza Inserimento entro la Domenica
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Tutte le sessioni della settimana devono essere inserite <strong>entro la Domenica precedente</strong> (es. entro <strong>Domenica {formatItalianDate(getPrecedingSunday(targetWeekMonday))} ore 23:59</strong>).
              </p>
              <div className="text-[10px] text-amber-300 font-mono bg-indigo-900/60 p-2 rounded-lg border border-indigo-500/20 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Così facendo, al <strong>Lunedì mattina</strong> le atlete vedranno tutti i giorni programmati per confermare la presenza entro le ore 18:00.
                </span>
              </div>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              {/* Target Week Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Seleziona Settimana di Riferimento:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const curMon = getCurrentWeekMonday();
                      setTargetWeekMonday(curMon);
                      setSessionDate(curMon);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition text-left ${
                      targetWeekMonday === getCurrentWeekMonday()
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase opacity-80">In Corso</span>
                    <span className="truncate block">{getWeekLabel(getCurrentWeekMonday())}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextMon = getNextWeekMonday(getCurrentWeekMonday());
                      setTargetWeekMonday(nextMon);
                      setSessionDate(nextMon);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition text-left ${
                      targetWeekMonday === getNextWeekMonday(getCurrentWeekMonday())
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase opacity-80">Prossima Settimana</span>
                    <span className="truncate block">{getWeekLabel(getNextWeekMonday(getCurrentWeekMonday()))}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const followMon = getNextWeekMonday(getNextWeekMonday(getCurrentWeekMonday()));
                      setTargetWeekMonday(followMon);
                      setSessionDate(followMon);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition text-left col-span-2 sm:col-span-1 ${
                      targetWeekMonday === getNextWeekMonday(getNextWeekMonday(getCurrentWeekMonday()))
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase opacity-80">Tra 2 Settimane</span>
                    <span className="truncate block">{getWeekLabel(getNextWeekMonday(getNextWeekMonday(getCurrentWeekMonday())))}</span>
                  </button>
                </div>
              </div>

              {/* Creation Mode Toggle */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCreationMode('SINGLE')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    creationMode === 'SINGLE'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📌 Singola Sessione (Seleziona Giorno)
                </button>
                <button
                  type="button"
                  onClick={() => setCreationMode('BATCH')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    creationMode === 'BATCH'
                      ? 'bg-teal-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🗓️ Programmazione Multipla Settimanale
                </button>
              </div>

              {/* ALL 7 DAYS OF THE WEEK SELECTOR */}
              <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>
                    {creationMode === 'SINGLE'
                      ? 'Clicca su uno dei 7 giorni della settimana per impostare la data:'
                      : 'Seleziona i giorni di allenamento della settimana:'}
                  </span>
                  {creationMode === 'BATCH' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedDayIndices.length === 7) {
                          setSelectedDayIndices([]);
                        } else {
                          setSelectedDayIndices([0, 1, 2, 3, 4, 5, 6]);
                        }
                      }}
                      className="text-[11px] text-teal-400 hover:underline font-bold"
                    >
                      {selectedDayIndices.length === 7 ? 'Deseleziona tutti' : 'Seleziona tutti (7/7)'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {getWeekDaysForMonday(targetWeekMonday).map((dayInfo) => {
                    const isSelectedSingle = sessionDate === dayInfo.dateStr;
                    const isSelectedBatch = selectedDayIndices.includes(dayInfo.dayIndex);

                    if (creationMode === 'SINGLE') {
                      return (
                        <button
                          key={dayInfo.dayIndex}
                          type="button"
                          onClick={() => {
                            setSessionDate(dayInfo.dateStr);
                            setSessionTitle(`Allenamento Campo - ${dayInfo.dayName}`);
                          }}
                          className={`p-2 rounded-xl text-xs font-bold border transition text-center flex flex-col items-center justify-center gap-0.5 ${
                            isSelectedSingle
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400/30'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-black">{dayInfo.dayName}</span>
                          <span className="text-[10px] font-mono opacity-80">{dayInfo.formattedShort}</span>
                        </button>
                      );
                    } else {
                      return (
                        <button
                          key={dayInfo.dayIndex}
                          type="button"
                          onClick={() => {
                            if (selectedDayIndices.includes(dayInfo.dayIndex)) {
                              setSelectedDayIndices(selectedDayIndices.filter(i => i !== dayInfo.dayIndex));
                            } else {
                              setSelectedDayIndices([...selectedDayIndices, dayInfo.dayIndex]);
                            }
                          }}
                          className={`p-2 rounded-xl text-xs font-bold border transition text-center flex flex-col items-center justify-center gap-0.5 relative ${
                            isSelectedBatch
                              ? 'bg-teal-600 text-white border-teal-400 shadow-md ring-2 ring-teal-400/30'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {isSelectedBatch && <Check className="w-3.5 h-3.5 text-white" />}
                            <span className="text-xs font-black">{dayInfo.dayName}</span>
                          </div>
                          <span className="text-[10px] font-mono opacity-80">{dayInfo.formattedShort}</span>
                        </button>
                      );
                    }
                  })}
                </div>

                {creationMode === 'BATCH' && (
                  <p className="text-[11px] text-teal-300 font-bold text-center pt-1">
                    Verranno create {selectedDayIndices.length} sessioni per i giorni selezionati.
                  </p>
                )}
              </div>

              {/* Time & Date details */}
              <div className="grid grid-cols-2 gap-3">
                {creationMode === 'SINGLE' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Data Selezionata *</label>
                    <input
                      type="date"
                      required
                      value={sessionDate || targetWeekMonday}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                )}

                <div className={creationMode === 'BATCH' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Ora Inizio Allenamento *</label>
                  <input
                    type="time"
                    required
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {creationMode === 'SINGLE' ? 'Titolo Sessione *' : 'Prefisso Titolo Allenamenti *'}
                </label>
                <input
                  type="text"
                  required
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Es. Allenamento Campo / Preparazione Gara"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Focus Topic */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tema FOCUS Sessione (Opzionale)</label>
                <textarea
                  rows={2}
                  value={sessionFocus}
                  onChange={(e) => setSessionFocus(e.target.value)}
                  placeholder="Es. Continuità diretta ed efficienza nei sostegni tattici..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSession(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition shadow-lg ${
                    creationMode === 'SINGLE'
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-teal-600 hover:bg-teal-500 text-white'
                  }`}
                >
                  {creationMode === 'SINGLE'
                    ? 'Crea Singola Sessione'
                    : `Programma ${selectedDayIndices.length} Sessioni per la Settimana`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// Helper colors for RPE
function getRpeBadgeColor(score: number): string {
  if (score <= 2) return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
  if (score <= 4) return 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30';
  if (score <= 6) return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
  if (score <= 8) return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
  return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
}
