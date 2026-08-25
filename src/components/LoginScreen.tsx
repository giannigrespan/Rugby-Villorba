import React, { useState, useEffect } from 'react';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, HelpCircle, Sparkles } from 'lucide-react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from '../lib/firebase';
import { Athlete, Coach } from '../types';

interface LoginScreenProps {
  coaches: Coach[];
  athletes: Athlete[];
  onLoginSuccess: (userId: string, role: 'COACH' | 'ATHLETE', firebaseUserEmail?: string) => void;
}

// Normalize email for comparison (handles trim, lowerCase, Gmail dot aliases and tags)
export const normalizeEmail = (e?: string): string => {
  if (!e) return '';
  const clean = e.trim().toLowerCase();
  if (clean.endsWith('@gmail.com')) {
    const [user, domain] = clean.split('@');
    const normUser = user.replace(/\./g, '').split('+')[0];
    return `${normUser}@${domain}`;
  }
  if (clean.endsWith('@googlemail.com')) {
    const [user] = clean.split('@');
    const normUser = user.replace(/\./g, '').split('+')[0];
    return `${normUser}@gmail.com`;
  }
  return clean;
};

export const translateFirebaseError = (err: any): string => {
  const code = err?.code || '';
  const msg = err?.message || '';

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return 'Password non corretta. Se è la prima volta che accedi con questa email, clicca su "Primo accesso? Clicca qui per creare la tua password" in basso per impostarla.';
  }
  if (code === 'auth/user-not-found') {
    return 'Nessun account con questa email registrato in Firebase. Clicca su "Primo accesso? Clicca qui per creare la tua password" per registrarti.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'Questa email è già registrata in Firebase. Clicca su "Accedi" oppure recupera la password con "Password dimenticata?".';
  }
  if (code === 'auth/weak-password') {
    return 'La password deve contenere almeno 6 caratteri.';
  }
  if (code === 'auth/invalid-email') {
    return 'Indirizzo email non valido.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Finestra Google chiusa prima di completare il login. Puoi riprovare o usare il pulsante "Accedi con Redirect Google" sotto.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Il browser ha bloccato la finestra popup di Google. Clicca su "Accedi con Redirect Google" per autenticarti a schermo intero senza popup.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Errore di connessione a internet. Verifica la rete e riprova.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Troppi tentativi consecutivi. Attendi qualche istante o reimposta la password.';
  }

  return msg || 'Errore durante l\'autenticazione. Riprova.';
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ coaches, athletes, onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'INITIAL' | 'EMAIL_PASS' | 'SELECT_PROFILE'>('INITIAL');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRedirectOption, setShowRedirectOption] = useState(false);

  // Profile linking state if email is authenticated but not matched automatically
  const [authenticatedFirebaseEmail, setAuthenticatedFirebaseEmail] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'COACH' | 'ATHLETE'>('COACH');
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const processAuthenticatedEmail = (authEmail: string) => {
    const cleanEmail = authEmail.trim();
    const normalizedAuth = normalizeEmail(cleanEmail);

    // 1. Gianni Grespan (Admin Super User)
    if (normalizedAuth === normalizeEmail('gianni.grespan@gmail.com') || cleanEmail.toLowerCase().includes('grespan')) {
      const defaultAdmin = coaches.find(c => c.id === 'c0' || normalizeEmail(c.email) === normalizedAuth) || coaches[0];
      onLoginSuccess(defaultAdmin.id, 'COACH', cleanEmail);
      return;
    }

    // 2. Direct Coach Match (including Alberto Tonetto specifically)
    const matchedCoach = coaches.find(c => {
      if (!c.email) return false;
      const cNorm = normalizeEmail(c.email);
      if (cNorm === normalizedAuth) return true;
      if (c.name.toLowerCase() === 'alberto tonetto' && normalizedAuth.includes('tonetto')) return true;
      return false;
    });

    if (matchedCoach) {
      onLoginSuccess(matchedCoach.id, 'COACH', cleanEmail);
      return;
    }

    // 3. Direct Athlete Match by normalized email
    const matchedAthlete = athletes.find(a => {
      if (!a.email) return false;
      return normalizeEmail(a.email) === normalizedAuth;
    });

    if (matchedAthlete) {
      onLoginSuccess(matchedAthlete.id, 'ATHLETE', cleanEmail);
      return;
    }

    // 4. Fallback: Authenticated in Firebase Auth, but email not yet matched directly in roster
    // Let user link their profile seamlessly
    setAuthenticatedFirebaseEmail(cleanEmail);
    setAuthMode('SELECT_PROFILE');
    
    // Auto-select if name matches partially (e.g. "alberto" or "tonetto")
    const emailLower = cleanEmail.toLowerCase();
    const guessedCoach = coaches.find(c => {
      const parts = c.name.toLowerCase().split(' ');
      return parts.some(p => p.length > 3 && emailLower.includes(p));
    });

    if (guessedCoach) {
      setSelectedRole('COACH');
      setSelectedUserId(guessedCoach.id);
    } else {
      const guessedAthlete = athletes.find(a => {
        return (a.firstName.length > 3 && emailLower.includes(a.firstName.toLowerCase())) ||
               (a.lastName.length > 3 && emailLower.includes(a.lastName.toLowerCase()));
      });
      if (guessedAthlete) {
        setSelectedRole('ATHLETE');
        setSelectedUserId(guessedAthlete.id);
      }
    }
  };

  // Check if returning from Google Redirect
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result && result.user && result.user.email) {
        processAuthenticatedEmail(result.user.email);
      }
    }).catch((err) => {
      console.warn('Redirect auth check:', err);
      if (err?.code && err.code !== 'auth/null-user') {
        setError(translateFirebaseError(err));
      }
    });
  }, []);

  const handleGoogleSignInPopup = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user && user.email) {
        processAuthenticatedEmail(user.email);
      } else {
        setError('Nessun indirizzo email restituito da Google.');
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError(translateFirebaseError(err));
      // Show redirect fallback option if popup failed
      setShowRedirectOption(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInRedirect = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Redirect error:', err);
      setError(translateFirebaseError(err));
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Inserisci sia l\'email che la password.');
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      if (isRegistering) {
        userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      }
      processAuthenticatedEmail(userCredential.user.email || cleanEmail);
    } catch (err: any) {
      console.error('Email Auth error:', err);
      setError(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setSuccessMessage('');
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Inserisci prima la tua email nel campo sopra per ricevere il link di recupero password.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      setSuccessMessage(`Email di ripristino inviata a ${cleanEmail}. Controlla la tua casella di posta.`);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(translateFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfileLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Seleziona il tuo profilo dal roster o staff.');
      return;
    }
    onLoginSuccess(selectedUserId, selectedRole, authenticatedFirebaseEmail || email);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-yellow-500/10 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-500 to-amber-400 p-0.5 mx-auto shadow-xl shadow-yellow-500/10">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Villorba Rugby Femminile</h1>
          <p className="text-xs text-yellow-400 font-bold uppercase tracking-widest">Serie A Elite • Accesso Sicuro Firebase</p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-2xl text-xs font-medium space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Notifica Accesso</span>
              </div>
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-2xl text-xs font-medium space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Operazione riuscita</span>
              </div>
              <p className="leading-relaxed">{successMessage}</p>
            </div>
          )}

          {/* MODE: LINK PROFILE */}
          {authMode === 'SELECT_PROFILE' ? (
            <form onSubmit={handleCompleteProfileLink} className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">Google Auth Riuscito: {authenticatedFirebaseEmail}</span>
                </div>
                <h2 className="text-base font-bold text-white pt-2">Associa il tuo Profilo</h2>
                <p className="text-xs text-slate-400">Seleziona il tuo nome nello staff o roster per completare l'accesso.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedRole('COACH'); setSelectedUserId(''); }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    selectedRole === 'COACH'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Staff / Allenatori
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedRole('ATHLETE'); setSelectedUserId(''); }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    selectedRole === 'ATHLETE'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Giocatrice Rosa
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Seleziona Nominativo</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                  required
                >
                  <option value="">-- Seleziona Nominativo --</option>
                  {selectedRole === 'COACH' ? (
                    coaches.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.title})</option>
                    ))
                  ) : (
                    athletes.map(a => (
                      <option key={a.id} value={a.id}>{a.lastName} {a.firstName} {a.jerseyNumber ? `#${a.jerseyNumber}` : ''}</option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedUserId}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>Conferma e Accedi alla Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : authMode === 'EMAIL_PASS' ? (
            /* MODE: EMAIL & PASSWORD */
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">
                    {isRegistering ? 'Imposta Password (Registrazione)' : 'Accesso Email e Password'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isRegistering 
                      ? 'Inserisci la tua email e crea una password personale' 
                      : 'Inserisci le tue credenziali'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthMode('INITIAL')}
                  className="text-xs text-yellow-400 hover:underline shrink-0"
                >
                  &larr; Indietro
                </button>
              </div>

              {/* Quick staff email suggestion chips */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Account Staff Rapidi:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEmail('alberto.tonetto@gmail.com')}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-1 rounded-lg border border-slate-700 transition"
                  >
                    Alberto Tonetto
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmail('gianni.grespan@gmail.com')}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-1 rounded-lg border border-slate-700 transition"
                  >
                    Gianni Grespan
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alberto.tonetto@gmail.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isRegistering ? 'Crea una password (min 6 caratteri)' : '••••••••'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Verifica in corso...' : isRegistering ? 'Crea Password e Accedi' : 'Accedi'}</span>
              </button>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setError('');
                    }}
                    className="text-yellow-400 hover:text-yellow-300 font-semibold transition"
                  >
                    {isRegistering 
                      ? 'Hai già la password? Clicca per Accedere' 
                      : 'Primo accesso? Clicca qui per creare la tua password'}
                  </button>
                  {!isRegistering && (
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="text-slate-400 hover:text-white transition underline"
                    >
                      Password dimenticata?
                    </button>
                  )}
                </div>
              </div>
            </form>
          ) : (
            /* MODE: INITIAL OPTIONS */
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-white">Accesso Utente & Staff</h2>
                <p className="text-xs text-slate-400">Scegli come accedere al gestionale Villorba Rugby:</p>
              </div>

              {/* Primary Google Login Button */}
              <button
                onClick={handleGoogleSignInPopup}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl text-sm transition flex items-center justify-center gap-3 shadow-lg active:scale-[0.99]"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.18 21.32 7.24 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.1 0 9.99 0 12s.43 3.9 1.19 5.42l4.09-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.24 0 3.18 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>{loading ? 'Accesso Google in corso...' : 'Accedi con Google'}</span>
              </button>

              {/* Redirect Alternative if Popup Blocked or on Mobile */}
              {showRedirectOption && (
                <button
                  onClick={handleGoogleSignInRedirect}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold border border-blue-500/40 rounded-xl text-xs transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Popup bloccato? Clicca qui per Redirect Google</span>
                </button>
              )}

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-500 text-xs uppercase tracking-wider font-semibold">oppure</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                onClick={() => {
                  setAuthMode('EMAIL_PASS');
                  setIsRegistering(false);
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-sm transition flex items-center justify-center gap-2 border border-slate-700 active:scale-[0.99]"
              >
                <Mail className="w-4 h-4 text-yellow-400" />
                <span>Accedi con Email e Password</span>
              </button>

              <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 font-bold text-slate-300">
                  <HelpCircle className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Accesso per Alberto Tonetto e lo Staff:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  • Clicca su <strong>"Accedi con Google"</strong> con qualsiasi tuo account Google. L'app riconoscerà automaticamente il profilo di Alberto Tonetto.<br />
                  • Se il browser blocca i popup (es. su iPhone/Safari), usa il pulsante <strong>"Redirect Google"</strong> o <strong>"Email e Password"</strong>.
                </p>
              </div>

            </div>
          )}

        </div>

        <div className="text-center text-[11px] text-slate-500">
          Villorba Rugby Femminile • Serie A Elite • Database Cloud Firebase
        </div>

      </div>
    </div>
  );
};
