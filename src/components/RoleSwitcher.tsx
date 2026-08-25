import React, { useState } from 'react';
import { X, Plus, UserPlus } from 'lucide-react';
import { Athlete, MacroRole, SpecificRole } from '../types';

interface RoleSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterAthlete: (newAthlete: Omit<Athlete, 'id' | 'createdAt' | 'active'>) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  isOpen,
  onClose,
  onRegisterAthlete,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [macroRole, setMacroRole] = useState<MacroRole>('FORWARDS');
  const [specificRole, setSpecificRole] = useState<SpecificRole>('Pilone');
  const [jerseyNumber, setJerseyNumber] = useState<string>('');

  if (!isOpen) return null;

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return;

    onRegisterAthlete({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      macroRole,
      specificRole,
      jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
    } as any);

    alert(`Atleta registrata con successo!`);

    // Reset form & close
    setFirstName('');
    setLastName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full text-white shadow-2xl overflow-hidden my-8 relative">
        
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Registra Nuova Atleta</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Es. Maria"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Cognome *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Es. Rossi"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Macro Role selection */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Reparto / Macro Ruolo *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMacroRole('FORWARDS')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition ${
                    macroRole === 'FORWARDS'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  AVANTI (FORWARDS)
                </button>

                <button
                  type="button"
                  onClick={() => setMacroRole('BACKS')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition ${
                    macroRole === 'BACKS'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-2 ring-cyan-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  TREQUARTI (BACKS)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Ruolo Specifico</label>
                <select
                  value={specificRole}
                  onChange={(e) => setSpecificRole(e.target.value as SpecificRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Pilone">Pilone</option>
                  <option value="Tallonatore">Tallonatore</option>
                  <option value="Seconda Linea">Seconda Linea</option>
                  <option value="Terza Linea Flanker">Terza Linea Flanker</option>
                  <option value="Terza Linea Centro">Terza Linea Centro</option>
                  <option value="Mediano di Mischia">Mediano di Mischia</option>
                  <option value="Apertura">Apertura</option>
                  <option value="Centro">Centro</option>
                  <option value="Ala">Ala</option>
                  <option value="Estremo">Estremo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">N° Maglia (Opzionale)</label>
                <input
                  type="number"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  placeholder="Es. 10"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Registra Atleta</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
