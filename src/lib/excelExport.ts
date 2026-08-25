import * as XLSX from 'xlsx';
import { Athlete, Coach, TrainingSession, AttendanceRecord, RpeFeedback, IndividualWorkout, KickingLog } from '../types';

export function exportFullWorkbookToExcel(data: {
  athletes: Athlete[];
  coaches: Coach[];
  sessions: TrainingSession[];
  attendance: AttendanceRecord[];
  rpeList: RpeFeedback[];
  individualWorkouts: IndividualWorkout[];
  kickingLogs: KickingLog[];
}) {
  const wb = XLSX.utils.book_new();

  // 1. PRESENZE
  const presenzeRows: any[] = [];
  data.athletes.forEach(athlete => {
    const row: any = {
      'Cognome': athlete.lastName,
      'Nome': athlete.firstName,
      'Ruolo Macro': athlete.macroRole === 'FORWARDS' ? 'Avanti (Forwards)' : 'Trequarti (Backs)',
      'Ruolo Specifico': athlete.specificRole || '-',
      'N° Maglia': athlete.jerseyNumber || '-',
    };

    data.sessions.forEach(session => {
      const rec = data.attendance.find(a => a.athleteId === athlete.id && a.sessionId === session.id);
      let statusStr = 'Non Inserito';
      if (rec) {
        if (rec.status === 'PRESENT') statusStr = 'PRESENT';
        else if (rec.status === 'ABSENT') statusStr = `ASSENTE (${rec.reason || 'Nessuna nota'})`;
        else if (rec.status === 'DOUBTFUL') statusStr = `IN DUBBIO (${rec.reason || 'Nessuna nota'})`;

        if (rec.modifiedByCoachId) {
          statusStr += ' [Modificato da Staff]';
        }
      }
      row[`${session.date} - ${session.title}`] = statusStr;
    });

    presenzeRows.push(row);
  });
  const wsPresenze = XLSX.utils.json_to_sheet(presenzeRows);
  XLSX.utils.book_append_sheet(wb, wsPresenze, 'Presenze Settimanali');

  // 2. RPE E MONITORAGGIO POST-ALLENAMENTO
  const rpeRows = data.rpeList.map(item => {
    const athlete = data.athletes.find(a => a.id === item.athleteId);
    const session = data.sessions.find(s => s.id === item.sessionId);
    return {
      'Data Sessione': item.date,
      'Sessione / Allenamento': session ? session.title : '-',
      'Atleta': athlete ? `${athlete.lastName} ${athlete.firstName}` : item.athleteId,
      'Ruolo': athlete ? (athlete.macroRole === 'FORWARDS' ? 'Avanti' : 'Trequarti') : '-',
      'RPE (1-10)': item.rpeScore,
      'Intensita Sforzo': getRpeLabel(item.rpeScore),
      'Fastidi / Dolori': item.hasDiscomfort ? 'SI' : 'NO',
      'Zona Corpo': item.discomfortArea || '-',
      'Dettagli Fastidio': item.discomfortDetails || '-',
      'Cosa ha funzionato bene': item.whatWentWell || '-',
      'Miglioramento FOCUS Sessione': item.focusImprovement || '-',
      'Data Ora Registrazione': item.createdAt ? new Date(item.createdAt).toLocaleString('it-IT') : '-',
    };
  });
  const wsRpe = XLSX.utils.json_to_sheet(rpeRows);
  XLSX.utils.book_append_sheet(wb, wsRpe, 'Monitoraggio RPE & Focus');

  // 3. ALLENAMENTI INDIVIDUALI (PALESTRA / ATLETICA)
  const indRows = data.individualWorkouts.map(item => {
    const athlete = data.athletes.find(a => a.id === item.athleteId);
    return {
      'Data': item.date,
      'Atleta': athlete ? `${athlete.lastName} ${athlete.firstName}` : item.athleteId,
      'Ruolo': athlete ? (athlete.macroRole === 'FORWARDS' ? 'Avanti' : 'Trequarti') : '-',
      'Tipologia': item.type === 'PALESTRA' ? 'Palestra (Forza/Core)' : 'Atletica (Corsa/Cardio)',
      'Nome Scheda': item.cardName,
      'Durata (Minuti)': item.durationMinutes,
      '% Completamento': `${item.completedPercentage}%`,
      'Note / Sensazioni': item.notes || '-',
    };
  });
  const wsInd = XLSX.utils.json_to_sheet(indRows);
  XLSX.utils.book_append_sheet(wb, wsInd, 'Allenamenti Individuali');

  // 4. REPORT CALCI TREQUARTI (BACKS)
  const backsList = data.athletes.filter(a => a.macroRole === 'BACKS');
  const kickingRows = backsList.map(athlete => {
    const logs = data.kickingLogs.filter(k => k.athleteId === athlete.id);
    const totalMinutes = logs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
    const targetReached = totalMinutes >= 45;
    return {
      'Cognome': athlete.lastName,
      'Nome': athlete.firstName,
      'Ruolo Specifico': athlete.specificRole || 'Trequarti',
      'Minuti Calcio Totali (Settimana)': totalMinutes,
      'Obiettivo 45 Minuti': targetReached ? 'RAGGIUNTO (>=45m)' : `NON RAGGIUNTO (Mancano ${45 - totalMinutes}m)`,
      'Numero Sessioni': logs.length,
      'Dettaglio Sessioni': logs.map(l => `${l.date}: ${l.durationMinutes}m (${l.kickTypes})`).join(' | ') || 'Nessuna sessione',
    };
  });
  const wsKicking = XLSX.utils.json_to_sheet(kickingRows);
  XLSX.utils.book_append_sheet(wb, wsKicking, 'Calci Trequarti (45m)');

  // 5. ANAGRAFICA ROSA & STAFF
  const rosaRows = data.athletes.map(a => ({
    'Cognome': a.lastName,
    'Nome': a.firstName,
    'Ruolo Macro': a.macroRole === 'FORWARDS' ? 'Avanti (Forwards)' : 'Trequarti (Backs)',
    'Ruolo Specifico': a.specificRole || '-',
    'N° Maglia': a.jerseyNumber || '-',
    'Stato': a.active ? 'Attiva' : 'Inattiva',
  }));
  const wsRosa = XLSX.utils.json_to_sheet(rosaRows);
  XLSX.utils.book_append_sheet(wb, wsRosa, 'Anagrafica Rosa');

  // Generate binary filename
  const fileName = `Villorba_Rugby_Report_Settimanale_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

function getRpeLabel(score: number): string {
  if (score <= 2) return 'Molto Facile';
  if (score <= 4) return 'Facile / Moderato';
  if (score <= 6) return 'Impegnativo';
  if (score <= 8) return 'Duro';
  return 'Sforzo Estremo (10/10)';
}
