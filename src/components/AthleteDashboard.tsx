import React, { useState } from 'react';
import { 
  Calendar, CheckCircle, XCircle, AlertTriangle, Clock, Activity, 
  Dumbbell, Flame, Target, Lock, MessageSquare, Plus, Zap, Award, 
  ChevronRight, ChevronLeft, Shield, HeartPulse, Sparkles, Info
} from 'lucide-react';
import { Athlete, TrainingSession, AttendanceRecord, RpeFeedback, IndividualWorkout, KickingLog, AttendanceStatus, TrainingTask } from '../types';
import { 
  getCurrentWeekMonday, 
  getMondayOfDate, 
  getWeekLabel, 
  getAthleteWeekStatus, 
  formatItalianDate 
} from '../lib/dateUtils';

interface AthleteDashboardProps {
  athlete: Athlete;
  sessions: TrainingSession[];
  attendance: AttendanceRecord[];
  rpeList: RpeFeedback[];
  individualWorkouts: IndividualWorkout[];
  kickingLogs: KickingLog[];
  deadlinePassed: boolean;
  onSaveAttendance: (sessionId: string, status: AttendanceStatus, reason?: string) => void;
  onSaveRpe: (newRpe: Omit<RpeFeedback, 'id' | 'athleteId' | 'createdAt'>) => void;
  onSaveIndividualWorkout: (workout: Omit<IndividualWorkout, 'id' | 'athleteId' | 'createdAt'>) => void;
  onSaveKickingLog: (log: Omit<KickingLog, 'id' | 'athleteId' | 'createdAt'>) => void;
  trainingTasks: TrainingTask[];
  onUpdateTaskProgress?: (taskId: string, currentCount: number) => void;
}

export const AthleteDashboard: React.FC<AthleteDashboardProps> = ({
  athlete,
  sessions,
  attendance,
  rpeList,
  individualWorkouts,
  kickingLogs,
  deadlinePassed,
  onSaveAttendance,
  onSaveRpe,
  onSaveIndividualWorkout,
  onSaveKickingLog,
  trainingTasks,
  onUpdateTaskProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'ATTENDANCE' | 'RPE' | 'INDIVIDUAL' | 'KICKING' | 'COMPITI'>('ATTENDANCE');

  // Active Week State
  const currentMonday = getCurrentWeekMonday();
  const [selectedWeekMonday, setSelectedWeekMonday] = useState<string>(currentMonday);

  const availableWeekMondays = Array.from(
    new Set([
      currentMonday,
      ...sessions.map(s => getMondayOfDate(s.date))
    ])
  ).sort();

  const weekStatus = getAthleteWeekStatus(selectedWeekMonday);
  const weekSessions = sessions.filter(s => getMondayOfDate(s.date) === selectedWeekMonday);

  const handlePrevWeek = () => {
    const currentIndex = availableWeekMondays.indexOf(selectedWeekMonday);
    if (currentIndex > 0) {
      setSelectedWeekMonday(availableWeekMondays[currentIndex - 1]);
    } else {
      const prev = new Date(selectedWeekMonday + 'T12:00:00');
      prev.setDate(prev.getDate() - 7);
      setSelectedWeekMonday(prev.toISOString().split('T')[0]);
    }
  };

  const handleNextWeek = () => {
    const currentIndex = availableWeekMondays.indexOf(selectedWeekMonday);
    if (currentIndex >= 0 && currentIndex < availableWeekMondays.length - 1) {
      setSelectedWeekMonday(availableWeekMondays[currentIndex + 1]);
    } else {
      const next = new Date(selectedWeekMonday + 'T12:00:00');
      next.setDate(next.getDate() + 7);
      setSelectedWeekMonday(next.toISOString().split('T')[0]);
    }
  };

  // Attendance Form state for selected session
  const [attendanceReasons, setAttendanceReasons] = useState<{ [sessionId: string]: string }>({});

  // RPE Form state
  const [selectedRpeSessionId, setSelectedRpeSessionId] = useState<string>(sessions[0]?.id || '');

  React.useEffect(() => {
    if (!selectedRpeSessionId || !sessions.some(s => s.id === selectedRpeSessionId)) {
      if (sessions.length > 0) {
        setSelectedRpeSessionId(sessions[0].id);
      } else {
        setSelectedRpeSessionId('');
      }
    }
  }, [sessions, selectedRpeSessionId]);

  const [rpeScore, setRpeScore] = useState<number>(7);
  const [hasDiscomfort, setHasDiscomfort] = useState<boolean>(false);
  const [discomfortArea, setDiscomfortArea] = useState<string>('Muscolare');
  const [discomfortDetails, setDiscomfortDetails] = useState<string>('');
  const [whatWentWell, setWhatWentWell] = useState<string>('');
  const [focusImprovement, setFocusImprovement] = useState<string>('');
  const [rpeSubmittedSuccess, setRpeSubmittedSuccess] = useState<boolean>(false);

  // Individual Workout state
  const [indType, setIndType] = useState<'PALESTRA' | 'ATLETICA'>('PALESTRA');
  const [indCardName, setIndCardName] = useState<string>('');
  const [indDuration, setIndDuration] = useState<number>(45);
  const [indNotes, setIndNotes] = useState<string>('');
  const [indCompleted, setIndCompleted] = useState<number>(100);
  const [indSuccessMsg, setIndSuccessMsg] = useState<boolean>(false);

  // Kicking Log state (For Backs)
  const [kickDuration, setKickDuration] = useState<number>(20);
  const [kickTypes, setKickTypes] = useState<string>('Piazzati e calci di spostamento');
  const [kickNotes, setKickNotes] = useState<string>('');
  const [kickSuccessMsg, setKickSuccessMsg] = useState<boolean>(false);

  const isBack = athlete.macroRole === 'BACKS';

  // Calculate total weekly kicking minutes for this Back athlete
  const myKickingLogs = kickingLogs.filter(k => k.athleteId === athlete.id);
  const totalKickingMinutes = myKickingLogs.reduce((sum, log) => sum + log.durationMinutes, 0);
  const kickingProgress = Math.min(100, Math.round((totalKickingMinutes / 45) * 100));

  // Alerts Calculation
  const today = new Date().toISOString().split('T')[0];
  const pastSessions = sessions.filter(s => s.date < today);
  const sessionsNeedingRpe = pastSessions.filter(s => 
    !rpeList.some(r => r.sessionId === s.id && r.athleteId === athlete.id)
  );

  const upcomingSessions = sessions.filter(s => s.date >= today);
  const sessionCloseToDeadline = upcomingSessions.find(s => {
    const sessionDate = new Date(s.date);
    const todayDate = new Date(today);
    const diffTime = sessionDate.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 2;
  });

  // Handler for RPE submit
  const handleRpeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRpeSessionId) return;

    const targetSession = sessions.find(s => s.id === selectedRpeSessionId);

    onSaveRpe({
      sessionId: selectedRpeSessionId,
      date: targetSession ? targetSession.date : new Date().toISOString().split('T')[0],
      rpeScore,
      hasDiscomfort,
      discomfortArea: hasDiscomfort ? discomfortArea : undefined,
      discomfortDetails: hasDiscomfort ? discomfortDetails : undefined,
      whatWentWell,
      focusImprovement,
    });

    setRpeSubmittedSuccess(true);
    setTimeout(() => setRpeSubmittedSuccess(false), 3000);
    setWhatWentWell('');
    setFocusImprovement('');
    setDiscomfortDetails('');
    setHasDiscomfort(false);
  };

  // Handler for Individual Workout submit
  const handleIndividualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!indCardName.trim()) return;

    onSaveIndividualWorkout({
      date: new Date().toISOString().split('T')[0],
      type: indType,
      cardName: indCardName.trim(),
      durationMinutes: Number(indDuration),
      notes: indNotes,
      completedPercentage: Number(indCompleted),
    });

    setIndSuccessMsg(true);
    setTimeout(() => setIndSuccessMsg(false), 3000);
    setIndCardName('');
    setIndNotes('');
  };

  // Handler for Kicking Log submit
  const handleKickingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kickDuration <= 0) return;

    onSaveKickingLog({
      date: new Date().toISOString().split('T')[0],
      durationMinutes: Number(kickDuration),
      kickTypes: kickTypes.trim(),
      notes: kickNotes,
    });

    setKickSuccessMsg(true);
    setTimeout(() => setKickSuccessMsg(false), 3000);
    setKickNotes('');
  };

  return (
    <div className="space-y-6">
      
      {/* Athlete Welcome Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 rounded-2xl p-5 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-yellow-500/20 border border-yellow-300">
              #{athlete.jerseyNumber || 'V'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  {athlete.macroRole === 'FORWARDS' ? 'Avanti (Forwards)' : 'Trequarti (Backs)'}
                </span>
                <span className="text-xs text-slate-400">• {athlete.specificRole || 'Giocatrice'}</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Ciao, {athlete.firstName} {athlete.lastName}!
              </h2>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>I tuoi dati sono riservati e visibili soltanto a te e al gruppo di 4 allenatori.</span>
              </p>
            </div>
          </div>

          {/* Special Backs Kicking Widget Preview if athlete is a Back */}
          {isBack && (
            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-3.5 flex items-center gap-4 min-w-[240px]">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="20" className="stroke-slate-800" strokeWidth="4" fill="transparent" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    className="stroke-cyan-400 transition-all duration-500"
                    strokeWidth="4"
                    strokeDasharray={125.6}
                    strokeDashoffset={125.6 - (125.6 * kickingProgress) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute text-xs font-extrabold text-cyan-300">{kickingProgress}%</span>
              </div>
              <div>
                <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Obiettivo Calci Trequarti</div>
                <div className="text-sm font-extrabold text-white">
                  {totalKickingMinutes} / 45 <span className="text-xs font-normal text-slate-400">minuti</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5 font-medium">
                  {totalKickingMinutes >= 45 ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Obiettivo Raggiunto!
                    </span>
                  ) : (
                    <span>Mancano {45 - totalKickingMinutes} min questa settimana</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Avvisi Section */}
      {(sessionsNeedingRpe.length > 0 || sessionCloseToDeadline) && (
        <div className="bg-slate-900 border-l-4 border-amber-500 rounded-xl p-4 sm:p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Avvisi Importanti
          </h3>
          
          {sessionsNeedingRpe.length > 0 && (
            <div className="text-xs text-slate-300">
              <span className="font-bold text-rose-400">⚠️ RPE Mancanti:</span> Hai {sessionsNeedingRpe.length} sessione{sessionsNeedingRpe.length > 1 ? 'i' : ''} passata{sessionsNeedingRpe.length > 1 ? 'e' : ''} senza feedback RPE. 
              <button onClick={() => setActiveTab('RPE')} className="ml-2 font-bold text-amber-400 underline hover:text-amber-300">
                Compila ora
              </button>
            </div>
          )}
          
          {sessionCloseToDeadline && (
            <div className="text-xs text-slate-300">
              <span className="font-bold text-cyan-400">📅 Prossima Sessione:</span> La sessione <strong>"{sessionCloseToDeadline.title}"</strong> è tra {Math.ceil((new Date(sessionCloseToDeadline.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} giorni.
            </div>
          )}
        </div>
      )}

      {/* Main Feature Tabs */}
      <div className="flex flex-row overflow-x-auto gap-2 border-b border-slate-800 pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab('ATTENDANCE')}
          className={`min-h-[44px] py-2 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition whitespace-nowrap ${
            activeTab === 'ATTENDANCE'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span>1. Presenze</span>
        </button>

        <button
          onClick={() => setActiveTab('RPE')}
          className={`min-h-[44px] py-2 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition whitespace-nowrap ${
            activeTab === 'RPE'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-extrabold shadow-lg shadow-amber-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <HeartPulse className="w-4 h-4 shrink-0" />
          <span>2. RPE & Focus</span>
        </button>

        <button
          onClick={() => setActiveTab('INDIVIDUAL')}
          className={`min-h-[44px] py-2 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition whitespace-nowrap ${
            activeTab === 'INDIVIDUAL'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Dumbbell className="w-4 h-4 shrink-0" />
          <span>3. Individuali</span>
        </button>

        {isBack && (
          <button
            onClick={() => setActiveTab('KICKING')}
            className={`min-h-[44px] py-2 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition whitespace-nowrap ${
              activeTab === 'KICKING'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40'
                : 'bg-slate-900 text-cyan-400 hover:text-white hover:bg-slate-800 border border-cyan-500/30'
            }`}
          >
            <Target className="w-4 h-4 shrink-0" />
            <span>4. Calci</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('COMPITI')}
          className={`min-h-[44px] py-2 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition whitespace-nowrap ${
            activeTab === 'COMPITI'
              ? 'bg-orange-600 text-white shadow-lg'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Target className="w-4 h-4 shrink-0" />
          <span>5. Compiti</span>
        </button>
      </div>

      {/* SECTION 1: PRESENZE SETTIMANALI */}
      {activeTab === 'ATTENDANCE' && (
        <div className="space-y-4">
          
          {/* Week Selection Control Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handlePrevWeek}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                title="Settimana Precedente"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 sm:w-72">
                <select
                  value={selectedWeekMonday}
                  onChange={(e) => setSelectedWeekMonday(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                >
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

              <button
                onClick={handleNextWeek}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
                title="Settimana Successiva"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {selectedWeekMonday !== currentMonday && (
              <button
                onClick={() => setSelectedWeekMonday(currentMonday)}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 transition flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Torna alla Settimana In Corso</span>
              </button>
            )}
          </div>

          {/* Week Status Banner */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            weekStatus.canEditAttendance
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : weekStatus.isPastWeek
              ? 'bg-slate-900 border-slate-700 text-slate-300'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                weekStatus.canEditAttendance 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : weekStatus.isPastWeek
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}>
                {weekStatus.canEditAttendance ? <Clock className="w-5 h-5" /> : weekStatus.isPastWeek ? <Info className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>{getWeekLabel(selectedWeekMonday)}</span>
                  {weekStatus.isCurrentWeek && (
                    <span className="text-[10px] font-extrabold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                      SETTIMANA ATTIVA
                    </span>
                  )}
                  {weekStatus.isPastWeek && (
                    <span className="text-[10px] font-extrabold bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      SOLA LETTURA
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {weekStatus.statusMessage}
                </p>
              </div>
            </div>

            <div className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 shrink-0">
              {weekStatus.canEditAttendance ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Conferma Presenze Entro Lunedì 18:00
                </span>
              ) : weekStatus.isPastWeek ? (
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Info className="w-4 h-4" /> Archivio Storico (Sola Lettura)
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" /> Inserimento Disabilitato
                </span>
              )}
            </div>
          </div>

          {/* Session Cards */}
          {weekSessions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-2">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">Nessun allenamento programmato per questa settimana</h4>
              <p className="text-xs text-slate-500">
                Lo staff inserisce il programma degli allenamenti della settimana entro la domenica precedente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weekSessions.map((session) => {
                const myRecord = attendance.find(a => a.athleteId === athlete.id && a.sessionId === session.id);
                const currentStatus = myRecord?.status || 'NOT_SET';
                const reason = attendanceReasons[session.id] !== undefined 
                  ? attendanceReasons[session.id] 
                  : (myRecord?.reason || '');

                return (
                  <div key={session.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2.5 py-1 rounded-lg border border-yellow-400/20">
                          {formatItalianDate(session.date)} • Ore {session.time}
                        </span>
                        {myRecord?.modifiedByCoachId && (
                          <span className="text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded border border-purple-500/30">
                            Modificato da Staff
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-base text-white mb-1">{session.title}</h4>
                      <p className="text-xs text-slate-400 mb-3">{session.location}</p>

                      {session.focusTopic && (
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 mb-4 text-xs text-slate-300">
                          <span className="text-yellow-400 font-bold block mb-0.5">Focus della Sessione:</span>
                          {session.focusTopic}
                        </div>
                      )}
                    </div>

                    {/* Attendance Controls */}
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                      <label className="block text-xs font-bold text-slate-300">
                        {weekStatus.canEditAttendance ? 'La tua presenza:' : 'Stato presenza registrato:'}
                      </label>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          disabled={!weekStatus.canEditAttendance}
                          onClick={() => onSaveAttendance(session.id, 'PRESENT', reason)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
                            currentStatus === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 ring-2 ring-emerald-400/30'
                              : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                          } ${!weekStatus.canEditAttendance ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Presente</span>
                        </button>

                        <button
                          disabled={!weekStatus.canEditAttendance}
                          onClick={() => onSaveAttendance(session.id, 'ABSENT', reason)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
                            currentStatus === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50 ring-2 ring-rose-400/30'
                              : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                          } ${!weekStatus.canEditAttendance ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Assente</span>
                        </button>

                        <button
                          disabled={!weekStatus.canEditAttendance}
                          onClick={() => onSaveAttendance(session.id, 'DOUBTFUL', reason)}
                          className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
                            currentStatus === 'DOUBTFUL'
                              ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50 ring-2 ring-amber-400/30'
                              : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                          } ${!weekStatus.canEditAttendance ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span>In Dubbio</span>
                        </button>
                      </div>

                      {/* Reason input for Absent or Doubtful */}
                      {(currentStatus === 'ABSENT' || currentStatus === 'DOUBTFUL') && (
                        <div>
                          <input
                            disabled={!weekStatus.canEditAttendance}
                            type="text"
                            value={reason}
                            onChange={(e) => {
                              setAttendanceReasons(prev => ({ ...prev, [session.id]: e.target.value }));
                              onSaveAttendance(session.id, currentStatus, e.target.value);
                            }}
                            placeholder="Motivazione (lavoro, studio, infortunio...)"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                          />
                        </div>
                      )}

                      {!weekStatus.canEditAttendance && (
                        <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800 text-center">
                          {weekStatus.isPastWeek 
                            ? 'Settimana conclusa (sola lettura).' 
                            : 'Termine scaduto (Lunedì ore 18:00). Per variazioni, avvisa lo Staff.'}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: RPE E FEEDBACK POST-ALLENAMENTO */}
      {activeTab === 'RPE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-amber-400" />
                Monitoraggio Sforzo (RPE) & Feedback Sessione
              </h3>
              <p className="text-xs text-slate-400">
                Compila questo modulo al termine di ogni allenamento di squadra per informare lo staff.
              </p>
            </div>
          </div>

          {rpeSubmittedSuccess && (
            <div className="p-4 bg-emerald-950 border border-emerald-500 rounded-xl text-emerald-200 text-sm font-bold flex items-center gap-2 animate-pulse">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <span>Feedback RPE registrato con successo! I dati sono stati aggiornati per lo staff.</span>
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="p-8 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-3">
              <HeartPulse className="w-10 h-10 text-amber-500/50 mx-auto" />
              <h4 className="text-base font-bold text-white">Nessuna sessione di allenamento disponibile</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Non appena lo staff degli allenatori programmerà e svolgerà le sessioni di campo per la settimana, potrai registrare qui la tua percezione dello sforzo (RPE) e il feedback sul tema FOCUS.
              </p>
            </div>
          ) : (
          <form onSubmit={handleRpeSubmit} className="space-y-6">
            
            {/* Select Session */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">Seleziona Allenamento da Valutare *</label>
              <select
                value={selectedRpeSessionId}
                onChange={(e) => setSelectedRpeSessionId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.date} - {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Display session focus */}
            {selectedRpeSessionId && (
              <div className="bg-slate-950 p-3.5 rounded-xl border border-yellow-500/30">
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider block mb-1">
                  Focus indicato dagli allenatori per questa sessione:
                </span>
                <p className="text-sm font-medium text-white italic">
                  "{sessions.find(s => s.id === selectedRpeSessionId)?.focusTopic || 'Nessun tema specifico'}"
                </p>
              </div>
            )}

            {/* RPE 1 to 10 Selector */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-300">
                  Scala RPE (Rating of Perceived Exertion) *
                </label>
                <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${getRpeBadgeColor(rpeScore)}`}>
                  RPE {rpeScore}/10 - {getRpeText(rpeScore)}
                </span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setRpeScore(num)}
                    className={`py-3 rounded-xl font-black text-sm border transition flex flex-col items-center gap-0.5 ${
                      rpeScore === num
                        ? `${getRpeButtonActiveColor(num)} ring-2 ring-white`
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{num}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Physical Discomfort / Fastidi */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-bold text-sm text-white block">Hai avvertito fastidi fisici o dolori?</label>
                  <span className="text-xs text-slate-400">Segnala subito qualsiasi risentimento muscolare o articolare.</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setHasDiscomfort(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      !hasDiscomfort ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    No, Nessun fastidio
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasDiscomfort(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      hasDiscomfort ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    Sì, Ho un fastidio
                  </button>
                </div>
              </div>

              {hasDiscomfort && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Zona del Corpo *</label>
                    <select
                      value={discomfortArea}
                      onChange={(e) => setDiscomfortArea(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="Caviglia / Piede">Caviglia / Piede</option>
                      <option value="Ginocchio">Ginocchio</option>
                      <option value="Coscia / Flessori / Quadricipite">Coscia / Flessori / Quadricipite</option>
                      <option value="Polpaccio / Tendenza d'Achille">Polpaccio / Tendenza d'Achille</option>
                      <option value="Spalla / Braccio">Spalla / Braccio</option>
                      <option value="Schiena / Lombare / Cervicale">Schiena / Lombare / Cervicale</option>
                      <option value="Addome / Core">Addome / Core</option>
                      <option value="Altro">Altro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Dettagli & Sensazioni *</label>
                    <input
                      type="text"
                      required={hasDiscomfort}
                      value={discomfortDetails}
                      onChange={(e) => setDiscomfortDetails(e.target.value)}
                      placeholder="Es. Lieve fitta al polpaccio durante i cambi direzione..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Individual Feedback Text Questions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Cosa ha funzionato bene a livello individuale? *
                </label>
                <textarea
                  required
                  rows={3}
                  value={whatWentWell}
                  onChange={(e) => setWhatWentWell(e.target.value)}
                  placeholder="Es. Pressione costante in difesa, ottima comunicazione sui punti d'incontro..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Cosa richiede miglioramento sul FOCUS indicato? *
                </label>
                <textarea
                  required
                  rows={3}
                  value={focusImprovement}
                  onChange={(e) => setFocusImprovement(e.target.value)}
                  placeholder="Es. Devo velocizzare la salita difensiva coordinata con la compagna esterna..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <HeartPulse className="w-5 h-5" />
              <span>Invia Feedback Post-Allenamento agli Allenatori</span>
            </button>

          </form>
          )}

          {/* History of submitted RPEs */}
          <div className="pt-6 border-t border-slate-800 space-y-3">
            <h4 className="font-bold text-sm text-slate-300">I tuoi ultimi RPE registrati:</h4>
            <div className="space-y-2">
              {rpeList.filter(r => r.athleteId === athlete.id).map((rpe) => {
                const session = sessions.find(s => s.id === rpe.sessionId);
                return (
                  <div key={rpe.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-white">{session?.title || rpe.date}</div>
                      <div className="text-slate-400 mt-0.5">
                        <strong className="text-emerald-400">Positivo:</strong> {rpe.whatWentWell}
                      </div>
                      <div className="text-slate-400">
                        <strong className="text-amber-400">Focus da migliorare:</strong> {rpe.focusImprovement}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {rpe.hasDiscomfort && (
                        <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                          Fastidio: {rpe.discomfortArea}
                        </span>
                      )}
                      <span className={`font-black px-2.5 py-1 rounded-lg ${getRpeBadgeColor(rpe.rpeScore)}`}>
                        RPE {rpe.rpeScore}/10
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* SECTION 3: ALLENAMENTI INDIVIDUALI */}
      {activeTab === 'INDIVIDUAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-purple-400" />
                Registra Allenamento Individuale
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Segna le sessioni extra svolte sulle schede della preparatrice atletica.
              </p>
            </div>

            {indSuccessMsg && (
              <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-xl text-emerald-200 text-xs font-bold">
                Allenamento individuale registrato con successo!
              </div>
            )}

            <form onSubmit={handleIndividualSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tipologia Attività *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIndType('PALESTRA')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      indType === 'PALESTRA'
                        ? 'bg-purple-600 text-white border-purple-400 ring-2 ring-purple-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" /> Palestra
                  </button>

                  <button
                    type="button"
                    onClick={() => setIndType('ATLETICA')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      indType === 'ATLETICA'
                        ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Flame className="w-4 h-4" /> Atletica
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nome Scheda / Esercizio *</label>
                <input
                  type="text"
                  required
                  value={indCardName}
                  onChange={(e) => setIndCardName(e.target.value)}
                  placeholder="Es. Scheda Forza A, Corsa Intervallata..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Durata (Minuti) *</label>
                  <input
                    type="number"
                    min="10"
                    max="180"
                    required
                    value={indDuration}
                    onChange={(e) => setIndDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">% Completamento</label>
                  <select
                    value={indCompleted}
                    onChange={(e) => setIndCompleted(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value={100}>100% Completo</option>
                    <option value={75}>75% Parziale</option>
                    <option value={50}>50% Parziale</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Note & Sensazioni</label>
                <textarea
                  rows={2}
                  value={indNotes}
                  onChange={(e) => setIndNotes(e.target.value)}
                  placeholder="Es. Carichi utilizzati, livello di stanchezza..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Registra Sessione Individuale</span>
              </button>

            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white">Storico Allenamenti Individuali</h3>

            <div className="space-y-2.5">
              {individualWorkouts.filter(w => w.athleteId === athlete.id).map((item) => (
                <div key={item.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      item.type === 'PALESTRA' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {item.type === 'PALESTRA' ? <Dumbbell className="w-5 h-5" /> : <Flame className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{item.cardName}</span>
                        <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                          {item.type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Data: {item.date} • Durata: <strong>{item.durationMinutes} min</strong> • Completato: <strong className="text-emerald-400">{item.completedPercentage}%</strong>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-slate-300 mt-1 bg-slate-900 p-2 rounded-lg italic">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SECTION 4: OBIETTIVO CALCI TREQUARTI (BACKS) */}
      {isBack && activeTab === 'KICKING' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Progress & Form */}
          <div className="lg:col-span-1 bg-slate-900 border border-cyan-500/30 rounded-2xl p-5 text-white shadow-xl space-y-5">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Target className="w-4 h-4" /> Obiettivo Settimanale Trequarti
              </div>
              <h3 className="font-black text-xl text-white">45 Minuti di Calci Individuali</h3>
              <p className="text-xs text-slate-400 mt-1">
                Obiettivo individuale obbligatorio per le giocatrici dei Trequarti (Backs).
              </p>
            </div>

            {/* Gauge Display */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
              <div className="text-3xl font-black text-cyan-300">
                {totalKickingMinutes} <span className="text-lg text-slate-400 font-medium">/ 45 min</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-500"
                  style={{ width: `${kickingProgress}%` }}
                />
              </div>

              <div className="text-xs font-bold">
                {totalKickingMinutes >= 45 ? (
                  <span className="text-emerald-400 flex items-center justify-center gap-1">
                    <Sparkles className="w-4 h-4" /> Obiettivo Settimanale RAGGIUNTO! 🎉
                  </span>
                ) : (
                  <span className="text-amber-400">
                    Mancano {45 - totalKickingMinutes} minuti per completare l'obiettivo
                  </span>
                )}
              </div>
            </div>

            {kickSuccessMsg && (
              <div className="p-3 bg-emerald-950 border border-emerald-500 rounded-xl text-emerald-200 text-xs font-bold">
                Sessione di calci registrata!
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleKickingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Minuti di Calcio Svolti *</label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  required
                  value={kickDuration}
                  onChange={(e) => setKickDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tipologia di Calci *</label>
                <input
                  type="text"
                  required
                  value={kickTypes}
                  onChange={(e) => setKickTypes(e.target.value)}
                  placeholder="Es. Piazzati dalla piazzola, calci di spostamento, grubber..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Note & Sensazioni</label>
                <textarea
                  rows={2}
                  value={kickNotes}
                  onChange={(e) => setKickNotes(e.target.value)}
                  placeholder="Es. % di realizzazione, sensazioni sul contatto col pallone..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Registra Minuti di Calcio</span>
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white">Le tue sessioni di Calcio di questa settimana</h3>

            <div className="space-y-2.5">
              {myKickingLogs.map((item) => (
                <div key={item.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{item.kickTypes}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Data: {item.date} • Durata: <strong className="text-cyan-300">{item.durationMinutes} minuti</strong>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-slate-300 mt-1 italic">"{item.notes}"</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* SECTION 5: COMPITI */}
      {activeTab === 'COMPITI' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-xl flex items-center gap-2">
                <Target className="w-6 h-6 text-orange-500" /> I tuoi compiti e obiettivi
              </h3>
              <p className="text-sm text-slate-400 mt-1">Alimenta il contatore per verificare il raggiungimento degli obiettivi assegnati dallo staff.</p>
            </div>
          </div>

          <div className="grid gap-4">
            {trainingTasks
              .filter(t => 
                (!t.assignedToAthleteId || t.assignedToAthleteId === athlete.id) &&
                (!t.targetMacroRole || t.targetMacroRole === athlete.macroRole)
              )
              .map(t => {
                const target = t.targetCount || 0;
                const athleteProgress = t.progressMap?.[athlete.id] || { currentCount: 0, completed: false };
                const currentCount = athleteProgress.currentCount || 0;
                const percentage = target > 0 ? Math.min(100, Math.round((currentCount / target) * 100)) : (athleteProgress.completed ? 100 : 0);

                const handleIncrement = (delta: number) => {
                  const nextVal = Math.max(0, currentCount + delta);
                  if (onUpdateTaskProgress) {
                    onUpdateTaskProgress(t.id, nextVal);
                  }
                };

                const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val) && onUpdateTaskProgress) {
                    onUpdateTaskProgress(t.id, Math.max(0, val));
                  }
                };

                return (
                  <div key={t.id} className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-lg text-white">{t.title}</h4>
                          <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full border border-slate-700">
                            Scadenza: {t.dueDate}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mt-1">{t.description}</p>
                      </div>
                      {target > 0 && (
                        <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                          athleteProgress.completed
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                        }`}>
                          <Award className="w-4 h-4" />
                          {athleteProgress.completed ? 'Obiettivo Raggiunto! 🎉' : `${percentage}% Completato`}
                        </div>
                      )}
                    </div>

                    {target > 0 && (
                      <div className="space-y-3 pt-3 border-t border-slate-900">
                        <div className="flex justify-between text-xs text-slate-400 font-medium">
                          <span>Obiettivo Staff: <strong className="text-white">{target} {t.unit || 'unità'}</strong></span>
                          <span>Progresso Attuale: <strong className="text-teal-400">{currentCount} / {target} {t.unit || ''}</strong></span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                          <div 
                            className={`h-full transition-all duration-500 ${athleteProgress.completed ? 'bg-emerald-500' : 'bg-gradient-to-r from-orange-500 to-amber-400'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        {/* Controls to feed counter */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-semibold">Aggiorna Contatore:</span>
                            <input 
                              type="number" 
                              min="0"
                              value={currentCount}
                              onChange={handleInputChange}
                              className="w-24 bg-slate-900 text-white font-bold p-2.5 rounded-xl border border-slate-700 text-center text-sm"
                            />
                            <span className="text-xs text-slate-400">{t.unit || 'unità'}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleIncrement(1)}
                              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleIncrement(5)}
                              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              onClick={() => handleIncrement(10)}
                              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition"
                            >
                              +10
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
            })}
            {trainingTasks.filter(t => 
                (!t.assignedToAthleteId || t.assignedToAthleteId === athlete.id) &&
                (!t.targetMacroRole || t.targetMacroRole === athlete.macroRole)
              ).length === 0 && (
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center text-slate-500">
                Nessun compito assegnato al momento.
              </div>
            )}
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

function getRpeButtonActiveColor(score: number): string {
  if (score <= 4) return 'bg-emerald-600 text-white border-emerald-400';
  if (score <= 6) return 'bg-yellow-500 text-slate-950 border-yellow-300';
  if (score <= 8) return 'bg-amber-600 text-white border-amber-400';
  return 'bg-rose-600 text-white border-rose-400';
}

function getRpeText(score: number): string {
  if (score <= 2) return 'Molto Leggero';
  if (score <= 4) return 'Moderato / Facile';
  if (score <= 6) return 'Impegnativo';
  if (score <= 8) return 'Duro / Forte Sforzo';
  return 'Sforzo Estremo (10/10)';
}
