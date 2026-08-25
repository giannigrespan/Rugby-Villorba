import { Athlete, Coach, TrainingSession, AttendanceRecord, RpeFeedback, IndividualWorkout, KickingLog, PhysioNote } from '../types';


export const INITIAL_COACHES: Coach[] = [
  { id: 'c0', name: 'Gianni Grespan', title: 'Administrator & Head Coach', email: 'gianni.grespan@gmail.com' },
  { id: 'c1', name: 'Federico Zizzola', title: 'Direttore Sportivo', email: 'fedezizzo10@gmail.com' },
  { id: 'c2', name: 'Stefano Tonetto', title: 'Head Coach', email: 'stefano.tonetto1969@gmail.com' },
  { id: 'c3', name: 'Alberto Tonetto', title: 'Assistant Coach', email: 'alberto.tonetto@gmail.com' },
  { id: 'c4', name: 'Federico Maso', title: 'Assistant Coach', email: 'federico.l.maso@gmail.com' },
  { id: 'c5', name: 'Marco Geraci', title: 'Assistant Coach', email: 'marcogeraci82@gmail.com' },
  { id: 'c6', name: 'Serena Chiavaroli', title: 'Preparatrice Atletica', email: 'Serenachiavaroli@gmail.com' },
  { id: 'c7', name: 'Maria Magatti', title: 'Preparatrice Atletica', email: 'mariamagatti92@gmail.com' },
  { id: 'c8', name: 'Paola De Franceschi', title: 'Fisioterapista', email: 'defranceschipaola22@gmail.com' },
  { id: 'c9', name: 'Leonardo Pin', title: 'Fisioterapista', email: 'leonardo.pin.00@gmail.com' },
];

export const INITIAL_ATHLETES: Athlete[] = [
  // FORWARDS (AVANTI)
  { id: 'a1', firstName: 'Benedetta', lastName: 'Corò', email: 'coro.benedetta08@gmail.com', macroRole: 'FORWARDS', specificRole: 'Terza Linea', jerseyNumber: 1, active: true, createdAt: '2026-01-10' },
  { id: 'a2', firstName: 'Sara', lastName: 'Scandiuzzi', email: '2001.scandiuzzi@gmail.com', macroRole: 'FORWARDS', specificRole: 'Terza Linea', jerseyNumber: 2, active: true, createdAt: '2026-01-10' },
  { id: 'a3', firstName: 'Irene', lastName: 'Nave', email: 'iri.turtle@yahoo.com', macroRole: 'FORWARDS', specificRole: 'Seconda Linea', jerseyNumber: 3, active: true, createdAt: '2026-01-10' },
  { id: 'a4', firstName: 'Laura', lastName: 'Gurioli', email: 'lauragurioli@live.it', macroRole: 'FORWARDS', specificRole: 'Tallonatore', jerseyNumber: 4, active: true, createdAt: '2026-01-10' },
  { id: 'a5', firstName: 'Lucia', lastName: 'Bonfiglio', email: 'bonfiglio.lucia7@gmail.com', macroRole: 'FORWARDS', specificRole: 'Terza Linea', jerseyNumber: 5, active: true, createdAt: '2026-01-10' },
  { id: 'a6', firstName: 'Teresa Sofia', lastName: 'Blaskovic', email: 'teresablaskovic@gmail.com', macroRole: 'FORWARDS', specificRole: 'Seconda Linea', jerseyNumber: 6, active: true, createdAt: '2026-01-10' },
  { id: 'a7', firstName: 'Daria', lastName: 'Costantini', email: 'dcostantini.graphics@gmail.com', macroRole: 'FORWARDS', specificRole: 'Tallonatore', jerseyNumber: 7, active: true, createdAt: '2026-01-10' },
  { id: 'a8', firstName: 'Greta', lastName: 'Copat', email: 'copatgreta@gmail.com', macroRole: 'FORWARDS', specificRole: 'Terza Linea', jerseyNumber: 8, active: true, createdAt: '2026-01-10' },
  { id: 'a9', firstName: 'Sofia', lastName: 'Stefanini', email: 'sofiab.stefanini@gmail.com', macroRole: 'FORWARDS', specificRole: 'Terza Linea', jerseyNumber: 9, active: true, createdAt: '2026-01-10' },
  { id: 'a10', firstName: 'Vittoria', lastName: 'Zoppè', email: 'vittoriazoppe@gmail.com', macroRole: 'FORWARDS', specificRole: 'Tallonatore', jerseyNumber: 10, active: true, createdAt: '2026-01-10' },
  { id: 'a11', firstName: 'Sofia', lastName: 'Nascimben', email: 'nascimben91.sn@gmail.com', macroRole: 'FORWARDS', specificRole: 'Seconda Linea', jerseyNumber: 11, active: true, createdAt: '2026-01-10' },
  { id: 'a12', firstName: 'Rebecca', lastName: 'Crivellaro', email: 'crivellaro.rebecca@gmail.com', macroRole: 'FORWARDS', specificRole: 'Pilone', jerseyNumber: 12, active: true, createdAt: '2026-01-10' },
  { id: 'a13', firstName: 'Letizia', lastName: 'Pegorer', email: 'letizia.pegorer@gmail.com', macroRole: 'FORWARDS', specificRole: 'Pilone', jerseyNumber: 13, active: true, createdAt: '2026-01-10' },
  { id: 'a14', firstName: 'Alice', lastName: 'Puppin', email: 'alicepuppin92@gmail.com', macroRole: 'FORWARDS', specificRole: 'Tallonatore', jerseyNumber: 14, active: true, createdAt: '2026-01-10' },
  { id: 'a15', firstName: 'Giulia', lastName: 'Casagrande', email: 'casagrande.giulia@gmail.com', macroRole: 'FORWARDS', specificRole: 'Pilone', jerseyNumber: 15, active: true, createdAt: '2026-01-10' },
  { id: 'a16', firstName: 'Manuela', lastName: 'De-Fato', email: 'defatomanuela@gmail.com', macroRole: 'FORWARDS', specificRole: 'Seconda Linea', jerseyNumber: 16, active: true, createdAt: '2026-01-10' },
  { id: 'a17', firstName: 'Sara', lastName: 'Geromel', email: 'borea85@gmail.com', macroRole: 'FORWARDS', specificRole: 'Pilone', jerseyNumber: 17, active: true, createdAt: '2026-01-10' },
  { id: 'a18', firstName: 'Valeria', lastName: 'Pin', email: 'valeria.pin.98@gmail.com', macroRole: 'FORWARDS', specificRole: 'Terza Linea', jerseyNumber: 18, active: true, createdAt: '2026-01-10' },
  { id: 'a19', firstName: 'Gaia', lastName: 'Simeon', email: 'gaiasimeon@gmail.com', macroRole: 'FORWARDS', specificRole: 'Pilone', jerseyNumber: 19, active: true, createdAt: '2026-01-10' },
  { id: 'a20', firstName: 'Emanuela', lastName: 'Stecca', email: 'stecca.emanuela@gmail.com', macroRole: 'FORWARDS', specificRole: 'Pilone', jerseyNumber: 20, active: true, createdAt: '2026-01-10' },
  { id: 'a21', firstName: 'Rebecca', lastName: 'Triolo', email: 'triolorebecca@gmail.com', macroRole: 'FORWARDS', specificRole: 'Terza Linea', jerseyNumber: 21, active: true, createdAt: '2026-01-10' },
  { id: 'a22', firstName: 'Sara', lastName: 'Scuderi', email: 'scuderisara04@gmail.com', macroRole: 'FORWARDS', specificRole: 'Terza Linea', jerseyNumber: 22, active: true, createdAt: '2026-01-10' },
  { id: 'a23', firstName: 'Chiara', lastName: 'Cheli', email: 'chiaracheli3@gmail.com', macroRole: 'FORWARDS', specificRole: 'Tallonatore', jerseyNumber: 23, active: true, createdAt: '2026-01-10' },
  { id: 'a24', firstName: 'Catalina Alexandra', lastName: 'Marcon', email: 'rugbycata@gmail.com', macroRole: 'FORWARDS', specificRole: 'Pilone', jerseyNumber: 24, active: true, createdAt: '2026-01-10' },
  { id: 'a25', firstName: 'Alessandra Lucrezia', lastName: 'Frangipani', email: 'Frangipani.alessandra03@gmail.com', macroRole: 'FORWARDS', specificRole: 'Terza Linea', jerseyNumber: 25, active: true, createdAt: '2026-01-10' },
  { id: 'a26', firstName: 'Elisabetta', lastName: 'Giuriato', email: 'elisabetta.giuriato08@gmail.com', macroRole: 'FORWARDS', specificRole: 'Seconda Linea', jerseyNumber: 26, active: true, createdAt: '2026-01-10' },
  { id: 'a27', firstName: 'Aurora', lastName: 'Abiti', email: 'aurora.abiti006@gmail.com', macroRole: 'FORWARDS', specificRole: 'Terza Linea', jerseyNumber: 27, active: true, createdAt: '2026-01-10' },
  { id: 'a28', firstName: 'Cindy', lastName: 'Crepaldy', email: 'cindy.crepaldi09@gmail.com', macroRole: 'FORWARDS', specificRole: 'Terza Linea', jerseyNumber: 28, active: true, createdAt: '2026-01-10' },

  // BACKS (TREQUARTI)
  { id: 'a29', firstName: 'Giorgia', lastName: 'Quinto', email: 'giorgiaquinto17@gmail.com', macroRole: 'BACKS', specificRole: 'Ala', jerseyNumber: 29, active: true, createdAt: '2026-01-10' },
  { id: 'a30', firstName: 'Gaia', lastName: 'Buso', email: 'gaia.busopb@gmail.com', macroRole: 'BACKS', specificRole: 'Mediano di Mischia', jerseyNumber: 30, active: true, createdAt: '2026-01-10' },
  { id: 'a31', firstName: 'Beatrice', lastName: 'Capomaggi', email: 'beacapos@gmail.com', macroRole: 'BACKS', specificRole: 'Apertura', jerseyNumber: 31, active: true, createdAt: '2026-01-10' },
  { id: 'a32', firstName: 'Emily', lastName: 'Brugnerotto', email: 'Brugnerottoemily@gmail.com', macroRole: 'BACKS', specificRole: 'Mediano di Mischia', jerseyNumber: 32, active: true, createdAt: '2026-01-10' },
  { id: 'a33', firstName: 'Elisa', lastName: 'Pilat', email: 'elipilat06@yahoo.com', macroRole: 'BACKS', specificRole: 'Ala', jerseyNumber: 33, active: true, createdAt: '2026-01-10' },
  { id: 'a34', firstName: 'Teiria', lastName: 'Jensen', email: 'teiriajensen@icloud.com', macroRole: 'BACKS', specificRole: 'Centro', jerseyNumber: 34, active: true, createdAt: '2026-01-10' },
  { id: 'a35', firstName: 'Alice', lastName: 'Visman', email: 'alicevisman@gmail.com', macroRole: 'BACKS', specificRole: 'Apertura', jerseyNumber: 35, active: true, createdAt: '2026-01-10' },
  { id: 'a36', firstName: 'Alessia', lastName: 'Liziero', email: 'alessia.liziero@gmail.com', macroRole: 'BACKS', specificRole: 'Ala', jerseyNumber: 36, active: true, createdAt: '2026-01-10' },
  { id: 'a37', firstName: 'Federica', lastName: 'Cipolla', email: 'federicacipolla7@gmail.com', macroRole: 'BACKS', specificRole: 'Centro', jerseyNumber: 37, active: true, createdAt: '2026-01-10' },
  { id: 'a38', firstName: 'Sara', lastName: 'Barattin', email: 'sarabarattin9@gmail.com', macroRole: 'BACKS', specificRole: 'Mediano di Mischia', jerseyNumber: 38, active: true, createdAt: '2026-01-10' },
  { id: 'a39', firstName: 'Giorgia', lastName: 'Pratelli', email: 'giorgia.prate98@gmail.com', macroRole: 'BACKS', specificRole: 'Estremo', jerseyNumber: 39, active: true, createdAt: '2026-01-10' },
  { id: 'a40', firstName: 'Vittoria', lastName: 'Francolini', email: 'vittoriafrancolini6@gmail.com', macroRole: 'BACKS', specificRole: 'Estremo', jerseyNumber: 40, active: true, createdAt: '2026-01-10' },
  { id: 'a41', firstName: 'Jessica', lastName: 'Facchin', email: 'jessicafacchin01@gmail.com', macroRole: 'BACKS', specificRole: 'Ala', jerseyNumber: 41, active: true, createdAt: '2026-01-10' },
  { id: 'a42', firstName: 'Martina', lastName: 'Busana', email: 'tina.busana02@gmail.com', macroRole: 'BACKS', specificRole: 'Ala', jerseyNumber: 42, active: true, createdAt: '2026-01-10' },
  { id: 'a43', firstName: 'Agata', lastName: 'Busetto', email: 'busettoagata07@icloud.com', macroRole: 'BACKS', specificRole: 'Ala', jerseyNumber: 43, active: true, createdAt: '2026-01-10' },
  { id: 'a44', firstName: 'Martina', lastName: 'Strassner', email: 'martina.strassner190206@gmail.com', macroRole: 'BACKS', specificRole: 'Ala', jerseyNumber: 44, active: true, createdAt: '2026-01-10' },
];

// Nessun allenamento prestabilito: tutto viene inserito manualmente dallo staff
export const INITIAL_SESSIONS: TrainingSession[] = [];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_RPE: RpeFeedback[] = [];

export const INITIAL_INDIVIDUAL_WORKOUTS: IndividualWorkout[] = [];

export const INITIAL_KICKING_LOGS: KickingLog[] = [];

export const INITIAL_PHYSIO_NOTES: PhysioNote[] = [];


