import type {
  AgendaDay,
  Appointment,
  KoboSettings,
  PatientKoBo,
  SheetsSettings,
  SyncState,
} from '@/types';

const KEYS = {
  kobo: 'clinica_kobo_settings',
  sheets: 'clinica_sheets_settings',
  patients: 'clinica_patients_cache',
  agenda: 'clinica_agenda_cache',
  appointments: 'clinica_appointments',
  syncKobo: 'clinica_sync_kobo',
  syncSheets: 'clinica_sync_sheets',
} as const;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage lleno o no disponible */
  }
}

export const storage = {
  getKoboSettings(): KoboSettings {
    return safeGet<KoboSettings>(KEYS.kobo, {
      baseUrl: '',
      apiToken: '',
      assetUid: '',
    });
  },
  setKoboSettings(s: KoboSettings): void {
    safeSet(KEYS.kobo, s);
  },

  getSheetsSettings(): SheetsSettings {
    return safeGet<SheetsSettings>(KEYS.sheets, { csvUrl: '' });
  },
  setSheetsSettings(s: SheetsSettings): void {
    safeSet(KEYS.sheets, s);
  },

  getPatients(): PatientKoBo[] {
    return safeGet<PatientKoBo[]>(KEYS.patients, []);
  },
  setPatients(p: PatientKoBo[]): void {
    safeSet(KEYS.patients, p);
  },

  getAgenda(): AgendaDay[] {
    return safeGet<AgendaDay[]>(KEYS.agenda, []);
  },
  setAgenda(a: AgendaDay[]): void {
    safeSet(KEYS.agenda, a);
  },

  getAppointments(): Record<string, Appointment> {
    return safeGet<Record<string, Appointment>>(KEYS.appointments, {});
  },
  setAppointments(a: Record<string, Appointment>): void {
    safeSet(KEYS.appointments, a);
  },

  getSyncState(key: 'kobo' | 'sheets'): SyncState {
    const k = key === 'kobo' ? KEYS.syncKobo : KEYS.syncSheets;
    return safeGet<SyncState>(k, { status: 'idle' });
  },
  setSyncState(key: 'kobo' | 'sheets', s: SyncState): void {
    const k = key === 'kobo' ? KEYS.syncKobo : KEYS.syncSheets;
    safeSet(k, s);
  },
};
