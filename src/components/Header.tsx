import VillorbaLogo from '../assets/images/villorba_logo_1786007267364.jpg';
import React from 'react';
import { UserCheck, Users, Calendar, AlertCircle, Clock, Lock, Unlock, Download, UserPlus } from 'lucide-react';
import { Athlete, Coach } from '../types';

interface HeaderProps {
  currentRole: 'COACH' | 'ATHLETE';
  currentCoach?: Coach;
  currentAthlete?: Athlete;
  onOpenRoleSwitcher: () => void;
  deadlinePassed: boolean;
  deadlineOverride: 'AUTO' | 'FORCE_LOCKED' | 'FORCE_UNLOCKED';
  onToggleDeadlineOverride: (mode: 'AUTO' | 'FORCE_LOCKED' | 'FORCE_UNLOCKED') => void;
  onExportExcel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  currentCoach,
  currentAthlete,
  onOpenRoleSwitcher,
  deadlinePassed,
  deadlineOverride,
  onToggleDeadlineOverride,
  onExportExcel,
}) => {
  return (
    <header className="bg-slate-900 border-b border-yellow-500/30 text-white shadow-xl sticky top-0 z-40">
      {/* Top Banner accent line in Villorba Yellow & Royal Blue */}
      <div className="h-1.5 bg-gradient-to-r from-blue-700 via-yellow-400 to-blue-800" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-yellow-500/20 border border-yellow-300 overflow-hidden shrink-0">
              <img src={VillorbaLogo} alt="Villorba Rugby" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest text-yellow-400 uppercase bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/30">
                  Serie A Elite
                </span>
              </div>
              <h1 className="text-sm sm:text-xl font-black tracking-tight text-white truncate">
                VILLORBA RUGBY
              </h1>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Deadline Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span>Conferme Presenze:</span>
              {deadlinePassed ? (
                <span className="inline-flex items-center gap-1 font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  <Lock className="w-3 h-3" /> Termine Lunedì 18:00 Superato
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                  <Unlock className="w-3 h-3" /> Aperte (Entro Lunedì 18:00)
                </span>
              )}
            </div>

            {/* Coach-only deadline test controls */}
            {currentRole === 'COACH' && (
              <div className="hidden lg:flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400 px-2 font-medium">Test Scadenza:</span>
                <button
                  onClick={() => onToggleDeadlineOverride('AUTO')}
                  className={`px-2 py-1 rounded font-medium transition ${deadlineOverride === 'AUTO' ? 'bg-yellow-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
                  title="Usa orario automatico del sistema"
                >
                  Auto
                </button>
                <button
                  onClick={() => onToggleDeadlineOverride('FORCE_LOCKED')}
                  className={`px-2 py-1 rounded font-medium transition ${deadlineOverride === 'FORCE_LOCKED' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
                  title="Simula termine superato (> Lunedì 18:00)"
                >
                  Bloccato
                </button>
                <button
                  onClick={() => onToggleDeadlineOverride('FORCE_UNLOCKED')}
                  className={`px-2 py-1 rounded font-medium transition ${deadlineOverride === 'FORCE_UNLOCKED' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'}`}
                  title="Simula iscrizioni aperte (< Lunedì 18:00)"
                >
                  Aperto
                </button>
              </div>
            )}

            {/* Download Excel Button (For Coaches) */}
            {currentRole === 'COACH' && (
              <button
                onClick={onExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition border border-emerald-400/30"
                title="Scarica tutti i dati delle atlete in formato Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Scarica Excel</span>
                <span className="sm:hidden">Excel</span>
              </button>
            )}

            {/* Active Profile Switcher / Registration Button (For Coaches) */}
            {currentRole === 'COACH' && (
              <button
                onClick={onOpenRoleSwitcher}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 border border-emerald-400/30 transition"
              >
                <UserPlus className="w-4 h-4 text-emerald-100" />
                <span className="font-extrabold">Registra Atleta</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
