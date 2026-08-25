import React, { useState } from 'react';
import { TrainingTask, Athlete } from '../types';
import { Plus, Target, CheckCircle, Trash2, Award } from 'lucide-react';

interface TrainingTasksManagerProps {
  tasks: TrainingTask[];
  athletes: Athlete[];
  onSaveTask: (task: Omit<TrainingTask, 'id' | 'createdAt' | 'completed'>) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TrainingTasksManager: React.FC<TrainingTasksManagerProps> = ({ tasks, athletes, onSaveTask, onDeleteTask }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [athleteId, setAthleteId] = useState<string>('ALL');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [targetCount, setTargetCount] = useState<string>('10');
  const [unit, setUnit] = useState<string>('Ripetizioni');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTask({
      assignedByCoachId: 'c0',
      assignedToAthleteId: athleteId.startsWith('ATHLETE_') ? athleteId.replace('ATHLETE_', '') : null,
      targetMacroRole: athleteId === 'ROLE_FORWARDS' ? 'FORWARDS' : athleteId === 'ROLE_BACKS' ? 'BACKS' : null,
      title,
      description,
      dueDate,
      targetCount: targetCount ? Number(targetCount) : undefined,
      unit: unit || 'Ripetizioni',
      progressMap: {},
    });
    setTitle('');
    setDescription('');
    setTargetCount('10');
    setUnit('Ripetizioni');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <h4 className="font-bold text-lg text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-500" /> Assegna Nuovo Compito / Obiettivo Settimanale
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Titolo Compito</label>
            <input type="text" placeholder="es. Esercizi Core Stability & Mobilità" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700" required />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Destinatari</label>
            <select value={athleteId} onChange={e => setAthleteId(e.target.value)} className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700">
              <option value="ALL">Tutte le atlete</option>
              <optgroup label="Reparti">
                <option value="ROLE_FORWARDS">Reparto: Avanti</option>
                <option value="ROLE_BACKS">Reparto: Trequarti</option>
              </optgroup>
              <optgroup label="Atlete Specifiche">
                {athletes.map(a => <option key={a.id} value={`ATHLETE_${a.id}`}>{a.lastName} {a.firstName}</option>)}
              </optgroup>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Descrizione & Istruzioni</label>
          <textarea placeholder="Descrivi i dettagli dell'esercizio..." value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700" rows={2} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Obiettivo Numerico (Contatore Target)</label>
            <input type="number" min="1" value={targetCount} onChange={e => setTargetCount(e.target.value)} className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700" required />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Unità di Misura</label>
            <input type="text" placeholder="es. Ripetizioni, Minuti, Serie" value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700" required />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Data di Scadenza</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full bg-slate-900 text-white p-3 rounded-xl border border-slate-700" required />
          </div>
        </div>

        <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg">
          <Plus className="w-5 h-5" /> Pubblica Compito con Contatore Obiettivo
        </button>
      </form>

      <div className="space-y-4">
        <h4 className="font-bold text-slate-300">Compiti Assegnati Attivi ({tasks.length})</h4>
        {tasks.map(t => {
          const target = t.targetCount || 0;
          const progressEntries = t.progressMap ? (Object.values(t.progressMap) as Array<{ currentCount: number; completed: boolean; updatedAt?: string }>) : [];
          const completedCount = progressEntries.filter(p => p.completed).length;

          return (
            <div key={t.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h5 className="font-bold text-white text-base">{t.title}</h5>
                  <span className="bg-orange-500/20 text-orange-300 text-xs px-2.5 py-0.5 rounded-full border border-orange-500/30 font-medium">
                    Scadenza: {t.dueDate}
                  </span>
                  {target > 0 && (
                    <span className="bg-teal-500/20 text-teal-300 text-xs px-2.5 py-0.5 rounded-full border border-teal-500/30 flex items-center gap-1 font-bold">
                      <Target className="w-3.5 h-3.5" /> Obiettivo: {target} {t.unit || 'unità'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-300">{t.description}</p>
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-4 pt-1">
                  <span>Destinatari: <strong className="text-slate-300">{t.assignedToAthleteId ? 'Atleta Specifica' : t.targetMacroRole ? `Reparto (${t.targetMacroRole})` : 'Tutte le Atlete'}</strong></span>
                  {target > 0 && (
                    <span className="text-teal-400 font-semibold">Atlete che hanno raggiunto l'obiettivo: {completedCount}</span>
                  )}
                </div>
              </div>
              <button onClick={() => onDeleteTask(t.id)} className="text-rose-400 hover:text-rose-300 p-2.5 bg-rose-500/10 rounded-xl transition self-end sm:self-center" title="Elimina compito">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center text-slate-500">
            Nessun compito assegnato al momento.
          </div>
        )}
      </div>
    </div>
  );
};
