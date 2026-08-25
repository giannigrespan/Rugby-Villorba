// Helper functions for week management, date formatting, and deadlines

// Formats YYYY-MM-DD date to Italian readable format (e.g., "Martedì 4 Agosto")
export function formatItalianDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  
  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];
  
  return `${dayName} ${dayNum} ${monthName}`;
}

// Returns the Monday date string (YYYY-MM-DD) for a given date
export function getMondayOfDate(dateStrOrObj: string | Date): string {
  const d = typeof dateStrOrObj === 'string' ? new Date(dateStrOrObj + 'T12:00:00') : new Date(dateStrOrObj);
  const day = d.getDay();
  // day: 0 = Sun, 1 = Mon, 2 = Tue...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split('T')[0];
}

// Calculates the CURRENT ACTIVE week Monday based on real-time current date
// Rule: Every Monday at 01:00 AM, the new week opens and becomes the current week.
// Before Monday 01:00 AM (e.g. Sunday or Monday 00:30), it is still considered the previous week.
export function getCurrentWeekMonday(nowDate: Date = new Date()): string {
  const d = new Date(nowDate);
  // If it's Monday before 01:00 AM, subtract 1 day to stay in previous week
  if (d.getDay() === 1 && d.getHours() < 1) {
    d.setDate(d.getDate() - 1);
  }
  return getMondayOfDate(d);
}

// Returns human readable range label for a Monday date string
// e.g. "Settimana 3 Ago - 9 Ago 2026"
export function getWeekLabel(mondayStr: string): string {
  const mon = new Date(mondayStr + 'T12:00:00');
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const monthsShort = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
  
  const monDay = mon.getDate();
  const monMonth = monthsShort[mon.getMonth()];
  const sunDay = sun.getDate();
  const sunMonth = monthsShort[sun.getMonth()];
  const year = sun.getFullYear();

  if (mon.getMonth() === sun.getMonth()) {
    return `Settimana ${monDay} - ${sunDay} ${monMonth} ${year}`;
  } else {
    return `Settimana ${monDay} ${monMonth} - ${sunDay} ${sunMonth} ${year}`;
  }
}

// Check if deadline (Monday 18:00) has passed for the CURRENT week
export function isMondayDeadlinePassedForCurrentWeek(nowDate: Date = new Date()): boolean {
  const day = nowDate.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
  const hours = nowDate.getHours();

  if (day === 1) {
    return hours >= 18; // On Monday, open until 18:00
  }
  // Tuesday (2), Wednesday (3), Thursday (4), Friday (5), Saturday (6), Sunday (0)
  // All these days are past Monday 18:00 of the active week.
  return true;
}

// Evaluates athlete permissions for a given selected week (by its Monday date)
export type WeekAthleteStatus = {
  isCurrentWeek: boolean;
  isPastWeek: boolean;
  isFutureWeek: boolean;
  canEditAttendance: boolean;
  statusMessage: string;
};

export function getAthleteWeekStatus(selectedMondayStr: string, nowDate: Date = new Date(), overrideMode: 'AUTO' | 'FORCE_LOCKED' | 'FORCE_UNLOCKED' = 'AUTO'): WeekAthleteStatus {
  if (overrideMode === 'FORCE_LOCKED') {
    return {
      isCurrentWeek: false,
      isPastWeek: true,
      isFutureWeek: false,
      canEditAttendance: false,
      statusMessage: 'Modifica bloccata da impostazioni Staff.',
    };
  }

  if (overrideMode === 'FORCE_UNLOCKED') {
    return {
      isCurrentWeek: true,
      isPastWeek: false,
      isFutureWeek: false,
      canEditAttendance: true,
      statusMessage: 'Iscrizioni aperte (Sblocco manuale Staff).',
    };
  }

  const currentMondayStr = getCurrentWeekMonday(nowDate);

  if (selectedMondayStr === currentMondayStr) {
    const deadlinePassed = isMondayDeadlinePassedForCurrentWeek(nowDate);
    if (deadlinePassed) {
      return {
        isCurrentWeek: true,
        isPastWeek: false,
        isFutureWeek: false,
        canEditAttendance: false,
        statusMessage: 'Termine scaduto (Lunedì ore 18:00). Modifiche riservate allo Staff.',
      };
    } else {
      return {
        isCurrentWeek: true,
        isPastWeek: false,
        isFutureWeek: false,
        canEditAttendance: true,
        statusMessage: 'Iscrizioni aperte per la settimana in corso (Entro Lunedì ore 18:00).',
      };
    }
  } else if (selectedMondayStr < currentMondayStr) {
    return {
      isCurrentWeek: false,
      isPastWeek: true,
      isFutureWeek: false,
      canEditAttendance: false,
      statusMessage: 'Settimana precedente in sola lettura (non modificabile).',
    };
  } else {
    return {
      isCurrentWeek: false,
      isPastWeek: false,
      isFutureWeek: true,
      canEditAttendance: false,
      statusMessage: 'Le iscrizioni per questa settimana si apriranno il rispettivo Lunedì alle ore 01:00.',
    };
  }
}

export type WeekDayInfo = {
  dayIndex: number; // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  dayName: string;  // "Lunedì", "Martedì", ...
  shortDayName: string; // "Lun", "Mar", ...
  dateStr: string;  // "YYYY-MM-DD"
  formattedShort: string; // "Lun 3 Ago"
};

// Generates the 7 days of the week (Monday through Sunday) for a given week's Monday
export function getWeekDaysForMonday(mondayStr: string): WeekDayInfo[] {
  const mon = new Date(mondayStr + 'T12:00:00');
  const dayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const shortNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  const monthShorts = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

  return dayNames.map((dayName, idx) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + idx);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const formattedShort = `${shortNames[idx]} ${d.getDate()} ${monthShorts[d.getMonth()]}`;

    return {
      dayIndex: idx,
      dayName,
      shortDayName: shortNames[idx],
      dateStr,
      formattedShort,
    };
  });
}

// Returns the Sunday date string preceding the Monday of the target week
export function getPrecedingSunday(mondayStr: string): string {
  const mon = new Date(mondayStr + 'T12:00:00');
  const sun = new Date(mon);
  sun.setDate(mon.getDate() - 1);
  return sun.toISOString().split('T')[0];
}

// Check if staff session entry deadline (Sunday 23:59 preceding target Monday) has passed
export function isStaffSessionDeadlinePassed(targetMondayStr: string, nowDate: Date = new Date()): boolean {
  const mon = new Date(targetMondayStr + 'T00:00:00');
  const deadline = new Date(mon);
  deadline.setDate(mon.getDate() - 1);
  deadline.setHours(23, 59, 59, 999);
  return nowDate > deadline;
}
