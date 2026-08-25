import React, { useState } from 'react';
import { Shield, UserPlus, Mail, Key, CheckCircle2, AlertTriangle, Lock, Users, Check, RefreshCw, UserCheck, Send, Edit3, X, Trash2 } from 'lucide-react';
import { Athlete, Coach, MacroRole, SpecificRole } from '../types';
import { auth, createUserWithEmailAndPassword, sendPasswordResetEmail } from '../lib/firebase';
import { INITIAL_ATHLETES } from '../data/initialData';

interface UserAdminPanelProps {
  athletes: Athlete[];
  coaches: Coach[];
  onRegisterAthlete: (newAthlete: Omit<Athlete, 'id' | 'createdAt' | 'active'>) => void;
  onRegisterCoach: (newCoach: Omit<Coach, 'id'>) => void;
  onUpdateAthlete?: (updatedAthlete: Athlete) => void;
  onUpdateCoach?: (updatedCoach: Coach) => void;
  onDeleteAthlete?: (athleteId: string) => void;
  onDeleteCoach?: (coachId: string) => void;
}

export const UserAdminPanel: React.FC<UserAdminPanelProps> = ({
  athletes,
  coaches,
  onRegisterAthlete,
  onRegisterCoach,
  onUpdateAthlete,
  onUpdateCoach,
  onDeleteAthlete,
  onDeleteCoach,
}) => {
  const [userType, setUserType] = useState<'ATHLETE' | 'COACH'>('ATHLETE');
  
  // Editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserType, setEditingUserType] = useState<'ATHLETE' | 'COACH' | null>(null);

  // Deletion confirmation state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState<'ATHLETE' | 'COACH' | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [macroRole, setMacroRole] = useState<MacroRole>('FORWARDS');
  const [specificRole, setSpecificRole] = useState<SpecificRole>('Pilone');
  const [jerseyNumber, setJerseyNumber] = useState('');
  const [coachTitle, setCoachTitle] = useState('Assistente Tecnico');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isEmailInUseError, setIsEmailInUseError] = useState(false);

  const handleSendResetEmail = async (targetEmail?: string) => {
    if (!targetEmail) {
      alert('Questo utente non ha un indirizzo email associato.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setResetMessage(`Email di reset password inviata con successo a ${targetEmail}`);
      setTimeout(() => setResetMessage(null), 5000);
    } catch (err: any) {
      alert(`Errore invio email reset: ${err.message}`);
    }
  };

  const [manualResetTarget, setManualResetTarget] = useState<{ id: string; name: string; email: string; type: 'COACH' | 'ATHLETE' } | null>(null);
  const [manualPassword, setManualPassword] = useState('');
  const [manualGeneratedCredentials, setManualGeneratedCredentials] = useState<{ email: string; pass: string; name: string } | null>(null);

  // Bulk import state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkType, setBulkType] = useState<'ATHLETE' | 'COACH'>('ATHLETE');

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkCsvText.trim()) return;
    const lines = bulkCsvText.split('\n');
    let importedCount = 0;

    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.split(/[,\t;|]/).map(p => p.trim());
      if (parts.length >= 2) {
        if (bulkType === 'ATHLETE') {
          // Format: Nome, Cognome, Email, [MacroRole], [SpecificRole], [JerseyNumber]
          const firstName = parts[0] || 'Atleta';
          const lastName = parts[1] || '';
          const email = parts[2] || '';
          const macroRoleStr = (parts[3] || 'FORWARDS').toUpperCase();
          const macroRole: MacroRole = macroRoleStr.includes('BACK') || macroRoleStr.includes('TRE') ? 'BACKS' : 'FORWARDS';
          const specificRole = (parts[4] as SpecificRole) || (macroRole === 'FORWARDS' ? 'Pilone' : 'Mediano di Mischia');
          const jerseyNumber = parts[5] ? parseInt(parts[5], 10) || undefined : undefined;

          onRegisterAthlete({
            firstName,
            lastName,
            email,
            macroRole,
            specificRole,
            jerseyNumber,
          });
          importedCount++;
        } else {
          // Format: Nome, Email, [Title]
          const name = parts[0] || 'Staff';
          const email = parts[1] || '';
          const title = parts[2] || 'Assistente Tecnico';

          onRegisterCoach({
            name,
            email,
            title,
          });
          importedCount++;
        }
      }
    });

    setSuccessMessage(`Importati con successo ${importedCount} utenti in massa!`);
    setBulkCsvText('');
    setShowBulkImport(false);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleOpenManualReset = (id: string, name: string, email: string, type: 'COACH' | 'ATHLETE') => {
    if (!email) {
      alert('Questo utente non ha un indirizzo email associato.');
      return;
    }
    setManualResetTarget({ id, name, email, type });
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setManualPassword(pass);
  };

  const handleConfirmManualReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualResetTarget || !manualPassword) return;
    if (manualPassword.length < 6) {
      alert('La password deve contenere almeno 6 caratteri.');
      return;
    }

    setManualGeneratedCredentials({
      email: manualResetTarget.email,
      pass: manualPassword,
      name: manualResetTarget.name
    });

    setResetMessage(`Password manuale impostata con successo per ${manualResetTarget.name} (${manualResetTarget.email}). Comunica le credenziali all'utente.`);
    setManualResetTarget(null);
  };

  // Credentials mapping state
  const [credentialsMap, setCredentialsMap] = useState<Record<string, { email: string; createdAt: string }>>(() => {
    try {
      const saved = localStorage.getItem('vr_credentials_map_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pass);
  };

  const handleSyncEmails = () => {
    if (onUpdateAthlete) {
      let count = 0;
      INITIAL_ATHLETES.forEach(ia => {
        const found = athletes.find(a => a.id === ia.id || (a.firstName.trim().toLowerCase() === ia.firstName.trim().toLowerCase() && a.lastName.trim().toLowerCase() === ia.lastName.trim().toLowerCase()));
        if (found) {
          if ((!found.email || found.email !== ia.email) && ia.email) {
            onUpdateAthlete({ ...found, email: ia.email });
            count++;
          }
        }
      });
      setSuccessMessage(`Sincronizzate con successo le email per ${count} atlete dal foglio Google Sheets ufficiale!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  const handleStartEditAthlete = (athlete: Athlete) => {
    setEditingUserId(athlete.id);
    setEditingUserType('ATHLETE');
    setUserType('ATHLETE');
    setFirstName(athlete.firstName || '');
    setLastName(athlete.lastName || '');
    setMacroRole(athlete.macroRole || 'FORWARDS');
    setSpecificRole(athlete.specificRole || 'Pilone');
    setJerseyNumber(athlete.jerseyNumber ? athlete.jerseyNumber.toString() : '');
    setEmail((athlete as any).email || '');
    setPassword('');
    setError('');
    setConfirmDeleteId(null);
    setSuccessMessage(`Modifica in corso per l'atleta: ${athlete.lastName} ${athlete.firstName}`);
  };

  const handleStartEditCoach = (coach: Coach) => {
    setEditingUserId(coach.id);
    setEditingUserType('COACH');
    setUserType('COACH');
    setFirstName(coach.name || '');
    setLastName('');
    setCoachTitle(coach.title || 'Staff Tecnico');
    setEmail(coach.email || '');
    setPassword('');
    setError('');
    setConfirmDeleteId(null);
    setSuccessMessage(`Modifica in corso per il membro staff: ${coach.name}`);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingUserType(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setJerseyNumber('');
    setCoachTitle('Assistente Tecnico');
    setSuccessMessage('');
    setError('');
  };

  const executeDeleteCoach = (coachId: string, coachName: string) => {
    if (coaches.length <= 1) {
      setError("Impossibile eliminare l'ultimo coach/amministratore rimasto.");
      setConfirmDeleteId(null);
      return;
    }
    if (window.confirm(`Sei sicuro di voler eliminare definitivamente il membro dello staff "${coachName}"?`)) {
      if (onDeleteCoach) {
        onDeleteCoach(coachId);
        if (editingUserId === coachId) handleCancelEdit();
        setSuccessMessage(`Membro dello staff "${coachName}" eliminato con successo.`);
        setConfirmDeleteId(null);
      }
    }
  };

  const executeDeleteAthlete = (athleteId: string, athleteName: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare definitivamente l'atleta "${athleteName}"?`)) {
      if (onDeleteAthlete) {
        onDeleteAthlete(athleteId);
        if (editingUserId === athleteId) handleCancelEdit();
        setSuccessMessage(`Atleta "${athleteName}" eliminata con successo.`);
        setConfirmDeleteId(null);
      }
    }
  };

  const registerUserInState = () => {
    setError('');

    let newUserId = '';

    if (userType === 'ATHLETE') {
      newUserId = `a_${Date.now()}`;
      onRegisterAthlete({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        macroRole,
        specificRole,
        jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
        email: email.trim(),
      } as any);
    } else {
      newUserId = `c_${Date.now()}`;
      onRegisterCoach({
        name: firstName.trim(),
        title: coachTitle.trim() || 'Staff Tecnico',
        email: email.trim(),
      } as any);
    }

    const updated = {
      ...credentialsMap,
      [newUserId]: { email: email.trim(), createdAt: new Date().toISOString() }
    };
    setCredentialsMap(updated);
    localStorage.setItem('vr_credentials_map_v1', JSON.stringify(updated));

    setSuccessMessage(`Utente ${firstName} ${lastName || ''} associato con successo al roster ufficiale!`);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setJerseyNumber('');
    setIsEmailInUseError(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsEmailInUseError(false);

    // If editing existing user
    if (editingUserId) {
      if (editingUserType === 'ATHLETE' && onUpdateAthlete) {
        const target = athletes.find(a => a.id === editingUserId);
        if (target) {
          onUpdateAthlete({
            ...target,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            macroRole,
            specificRole,
            jerseyNumber: jerseyNumber ? parseInt(jerseyNumber, 10) : undefined,
            email: email.trim(),
          });
          setSuccessMessage(`Atleta ${lastName} ${firstName} aggiornata con successo!`);
          handleCancelEdit();
        }
        return;
      }

      if (editingUserType === 'COACH' && onUpdateCoach) {
        const target = coaches.find(c => c.id === editingUserId);
        if (target) {
          onUpdateCoach({
            ...target,
            name: firstName.trim(),
            title: coachTitle.trim() || 'Staff Tecnico',
            email: email.trim(),
          });
          setSuccessMessage(`Staff ${firstName} aggiornato con successo!`);
          handleCancelEdit();
        }
        return;
      }
    }

    // Creating new user
    if (!email || !password) {
      setError('Inserisci email e password per l\'accesso Firebase Auth.');
      return;
    }

    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri.');
      return;
    }

    if (userType === 'ATHLETE' && (!firstName.trim() || !lastName.trim())) {
      setError('Inserisci nome e cognome della giocatrice.');
      return;
    }

    if (userType === 'COACH' && !firstName.trim()) {
      setError('Inserisci il nome del membro dello staff.');
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      registerUserInState();
    } catch (err: any) {
      console.error('Error creating user in Firebase Auth:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Questa email è già registrata in Firebase Auth. Se l\'utente ha dimenticato la password, puoi inviargli un link di ripristino, oppure registrare comunque l\'anagrafica nel roster.');
        setIsEmailInUseError(true);
      } else {
        setError(err.message || 'Errore durante la creazione dell\'utente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!email) {
      setError('Inserisci prima l\'indirizzo email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMessage(`Email di ripristino password inviata con successo a ${email.trim()}! L'utente potrà reimpostare la propria password.`);
    } catch (err: any) {
      setError(err.message || 'Errore durante l\'invio dell\'email di reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-yellow-400" />
              {editingUserId ? `Modifica Anagrafica: ${firstName} ${lastName || ''}` : 'Inserimento Nuovo Utente & Credenziali (Firebase Auth)'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {editingUserId ? 'Aggiorna i dati anagrafici e l\'email dell\'utente selezionato.' : 'Crea un nuovo account nel database dell\'applicazione e registralo contestualmente in Firebase Authentication.'}
            </p>
          </div>
          {editingUserId ? (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition border border-slate-700"
            >
              <X className="w-4 h-4" />
              <span>Annulla Modifica</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncEmails}
                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                title="Sincronizza tutte le email dal foglio Google Sheets"
              >
                <RefreshCw className="w-4 h-4" />
                <span>🔄 Sincronizza Email</span>
              </button>
              <button
                type="button"
                onClick={() => setShowBulkImport(true)}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <Users className="w-4 h-4" />
                <span>📥 Importa Lista da Excel/CSV</span>
              </button>
              <div className="bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 rounded-xl text-yellow-400 text-xs font-bold hidden sm:block">
                Pannello Admin
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl text-xs font-medium space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>

            {isEmailInUseError && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-red-500/20">
                <button
                  type="button"
                  onClick={handleSendPasswordReset}
                  disabled={loading}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Invia Email Reset Password</span>
                </button>
                <button
                  type="button"
                  onClick={registerUserInState}
                  disabled={loading}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs transition border border-slate-700"
                >
                  Associa Anagrafica al Roster (Ignora Auth)
                </button>
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-medium space-y-1 whitespace-pre-line">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Operazione Completata con Successo!</span>
            </div>
            <p>{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* User Type Switcher (only when creating or switching) */}
          {!editingUserId && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Tipo di Utente da Creare</label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setUserType('ATHLETE')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    userType === 'ATHLETE'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Nuova Atleta (Rosa)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('COACH')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    userType === 'COACH'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Nuovo Staff / Coach</span>
                </button>
              </div>
            </div>
          )}

          {/* Anagrafica Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {userType === 'ATHLETE' ? 'Nome Atleta' : 'Nome e Cognome Staff'}
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={userType === 'ATHLETE' ? 'es. Anna' : 'es. Marco Rossi'}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                required
              />
            </div>

            {userType === 'ATHLETE' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Cognome Atleta</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="es. Bianchi"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
            )}

            {userType === 'COACH' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ruolo / Titolo Staff</label>
                <input
                  type="text"
                  value={coachTitle}
                  onChange={(e) => setCoachTitle(e.target.value)}
                  placeholder="es. Head Coach, Fisioterapista, Preparatore"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
            )}
          </div>

          {userType === 'ATHLETE' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Macro Reparto</label>
                <select
                  value={macroRole}
                  onChange={(e) => setMacroRole(e.target.value as MacroRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="FORWARDS">Avanti (Forwards)</option>
                  <option value="BACKS">Trequarti (Backs)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Ruolo Specifico</label>
                <select
                  value={specificRole}
                  onChange={(e) => setSpecificRole(e.target.value as SpecificRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Numero Maglia (Opzionale)</label>
                <input
                  type="number"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value)}
                  placeholder="es. 10"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
            </div>
          )}

          {/* Firebase Auth Credentials & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Email (Login & Notifiche)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="utente@villorbarugby.it"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                  required
                />
              </div>
            </div>

            {!editingUserId && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Password Iniziale</label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[11px] text-yellow-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Genera Casuale</span>
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimo 6 caratteri"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-yellow-500"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {editingUserId ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span>{loading ? 'Elaborazione...' : editingUserId ? 'Salva Modifiche Anagrafica' : 'Crea Nuovo Utente & Credenziali'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Existing Roster Overview with Edit, Reset PIN & Inline Delete actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-yellow-400" />
          Seleziona Utente da Modificare o Eliminare (Roster & Staff Tecnico - {coaches.length + athletes.length} totali)
        </h4>

        {resetMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-medium">
            {resetMessage}
          </div>
        )}

        {manualGeneratedCredentials && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Credenziali Generate per {manualGeneratedCredentials.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setManualGeneratedCredentials(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Chiudi
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Copia queste credenziali e comunicale all'utente in autonomia (es. WhatsApp, SMS o a voce). Puoi anche impostarla direttamente nella console Firebase (Authentication ➔ Utenti ➔ tre puntini ➔ Reimposta password).
            </p>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 font-mono text-xs text-white">
              <div>Email: <span className="text-yellow-300">{manualGeneratedCredentials.email}</span></div>
              <div>Password Manuale: <span className="text-emerald-300">{manualGeneratedCredentials.pass}</span></div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${manualGeneratedCredentials.email}\nPassword: ${manualGeneratedCredentials.pass}`);
                  alert('Credenziali copiate negli appunti!');
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition"
              >
                📋 Copia Credenziali negli Appunti
              </button>
            </div>
          </div>
        )}

        {manualResetTarget && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-yellow-400" />
                Imposta Password Manuale ({manualResetTarget.name})
              </h3>
              <p className="text-xs text-slate-300">
                Imposta una nuova password temporanea per l'utente <span className="font-mono text-yellow-300">{manualResetTarget.email}</span>. Potrai comunicarla direttamente all'utente in autonomia senza dipendere dall'invio email.
              </p>
              <form onSubmit={handleConfirmManualReset} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nuova Password Temporanea</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualPassword}
                      onChange={(e) => setManualPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-yellow-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
                        let pass = '';
                        for (let i = 0; i < 10; i++) {
                          pass += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        setManualPassword(pass);
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition shrink-0"
                    >
                      Genera
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setManualResetTarget(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-yellow-500/20"
                  >
                    Conferma e Mostra Credenziali
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {confirmDeleteId && (
          <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>Confermi l'eliminazione definitiva dell'utente selezionato? L'azione è irreversibile.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (confirmDeleteType === 'COACH') {
                    const c = coaches.find(item => item.id === confirmDeleteId);
                    if (c) executeDeleteCoach(c.id, c.name);
                  } else if (confirmDeleteType === 'ATHLETE') {
                    const a = athletes.find(item => item.id === confirmDeleteId);
                    if (a) executeDeleteAthlete(a.id, `${a.lastName} ${a.firstName}`);
                  }
                }}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition"
              >
                Conferma Eliminazione
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-lg border border-slate-700 transition"
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Staff */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Staff ({coaches.length})</h5>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {coaches.map(c => (
                <div key={c.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{c.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{c.title} • {c.email || 'Nessuna email'}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSendResetEmail(c.email)}
                      className="px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border border-yellow-500/30"
                      title="Invia email reset password"
                    >
                      <Key className="w-3 h-3 text-yellow-400" />
                      <span>Reset Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenManualReset(c.id, c.name, c.email, 'COACH')}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border border-emerald-500/30"
                      title="Imposta password manuale e comunica in autonomia"
                    >
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Pass. Manuale</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEditCoach(c)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 border border-slate-700"
                    >
                      <Edit3 className="w-3 h-3 text-yellow-400" />
                      <span>Modifica</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteId(c.id);
                        setConfirmDeleteType('COACH');
                      }}
                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                      title="Elimina Utente"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Athletes */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Atlete Rosa ({athletes.length})</h5>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {athletes.map(a => (
                <div key={a.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{a.lastName} {a.firstName} {a.jerseyNumber ? `#${a.jerseyNumber}` : ''}</div>
                    <div className="text-[10px] text-slate-400 truncate">{a.macroRole === 'FORWARDS' ? 'Avanti' : 'Trequarti'} {a.specificRole ? `• ${a.specificRole}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSendResetEmail(a.email)}
                      className="px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border border-yellow-500/30"
                      title="Invia email reset password"
                    >
                      <Key className="w-3 h-3 text-yellow-400" />
                      <span>Reset Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenManualReset(a.id, `${a.firstName} ${a.lastName}`, a.email, 'ATHLETE')}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border border-emerald-500/30"
                      title="Imposta password manuale e comunica in autonomia"
                    >
                      <Lock className="w-3 h-3 text-emerald-400" />
                      <span>Pass. Manuale</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEditAthlete(a)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 border border-slate-700"
                    >
                      <Edit3 className="w-3 h-3 text-yellow-400" />
                      <span>Modifica</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDeleteId(a.id);
                        setConfirmDeleteType('ATHLETE');
                      }}
                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                      title="Elimina Utente"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showBulkImport && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Importazione Massiva Utenti da Excel / CSV
            </h3>
            <p className="text-xs text-slate-300">
              Incolla qui la lista degli utenti (copiata direttamente da Excel, Fogli Google o file CSV). Ciascuna riga corrisponde a un utente.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBulkType('ATHLETE')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
                  bulkType === 'ATHLETE' ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                Atlete (Rosa)
              </button>
              <button
                type="button"
                onClick={() => setBulkType('COACH')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
                  bulkType === 'COACH' ? 'bg-amber-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                Staff Tecnico
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">
                {bulkType === 'ATHLETE' 
                  ? 'Formato riga: Nome, Cognome, Email, Reparto (Avanti/Trequarti), Ruolo Specifico, N. Maglia'
                  : 'Formato riga: Nome Staff, Email, Qualifica/Titolo'}
              </label>
              <textarea
                value={bulkCsvText}
                onChange={(e) => setBulkCsvText(e.target.value)}
                rows={6}
                placeholder={bulkType === 'ATHLETE' 
                  ? "Maria, Rossi, maria.rossi@villorbarugby.it, Avanti, Pilone, 1\nLaura, Bianchi, laura.bianchi@villorbarugby.it, Trequarti, Apertura, 10"
                  : "Mario Rossi, mario@villorbarugby.it, Capo Allenatore\nGianni Verdi, gianni@villorbarugby.it, Preparatore Atletico"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkImport(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleBulkImport}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20"
              >
                Importa Utenti Nel Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
