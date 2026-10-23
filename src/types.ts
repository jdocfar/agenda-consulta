export interface PatientKoBo {
  _id: string;
  name: string;
  tipo_documento: string;
  id: string;
  telephone1: string;
  telephone2: string;
  email: string;
  borndate: string;
  age: string | number;
  eps: string;
  department: string;
  city: string;
  mothername: string;
  fathername: string;
}

export type TipoAtencion = 'consulta habitual' | 'consulta particular' | 'junta';

export interface AgendaDay {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_slot_min: number;
  tipo_atencion: TipoAtencion;
}

export type SlotStatus = 'available' | 'occupied';

export interface TimeSlot {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_slot_min: number;
  tipo_atencion: TipoAtencion;
  start: string;
  end: string;
  status: SlotStatus;
}

export interface Appointment {
  slotKey: string;
  fecha: string;
  start: string;
  end: string;
  duracion_slot_min: number;
  tipo_atencion: TipoAtencion;
  hora_inicio_jornada: string;
  hora_fin_jornada: string;
  patientId: string;
  patient: PatientKoBo;
  createdAt: string;
}

export interface KoboSettings {
  baseUrl: string;
  apiToken: string;
  assetUid: string;
}

export interface SheetsSettings {
  csvUrl: string;
}

export type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface SyncState {
  status: SyncStatus;
  message?: string;
  lastSync?: string;
}
