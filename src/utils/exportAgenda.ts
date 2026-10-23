import type { AgendaDay, Appointment, KoboSettings, PatientKoBo, SheetsSettings, TimeSlot } from '@/types';
import { TIPO_ATENCION_LABELS } from '@/utils/tipoAtencion';

// Estructura formal del archivo de copia de seguridad
export interface AppBackupData {
  version: number;
  exportedAt: string;
  agenda?: AgendaDay[];
  patients?: PatientKoBo[];
  appointments?: Record<string, Appointment>;
  sheetsSettings?: SheetsSettings;
  koboSettings?: KoboSettings;
}

function downloadBlob(content: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDateDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// Ahora recibe el paciente fusionado y no la cita vieja
function patientLine(slot: TimeSlot, p: PatientKoBo): string {
  const label = TIPO_ATENCION_LABELS[slot.tipo_atencion];
  const timeRange = `[${slot.start} - ${slot.end}]`;
  const typeTag = `[${label}]`;
  const docPrefix = p.tipo_documento || 'ID';

  switch (slot.tipo_atencion) {
    case 'consulta habitual':
      return `• ${timeRange} ${typeTag} - ${p.name} (${docPrefix}: ${p.id}, Tel: ${p.telephone1}, EPS: ${p.eps})`;
    case 'consulta particular':
      return `• ${timeRange} ${typeTag} - ${p.name} (${docPrefix}: ${p.id}, Tel: ${p.telephone1})`;
    case 'junta':
      return `• ${timeRange} ${typeTag} - ${p.name} (${docPrefix}: ${p.id}, Tel: ${p.telephone1}, EPS: ${p.eps})`;
    default:
      return `• ${timeRange} ${typeTag} - ${p.name} (${docPrefix}: ${p.id}, Tel: ${p.telephone1})`;
  }
}

export function buildAgendaText(
  fecha: string,
  slots: TimeSlot[],
  appointments: Record<string, Appointment>,
  patientsList: PatientKoBo[] = [] // Se añade la lista fresca
): string {
  const fechaFmt = formatDateDDMMYYYY(fecha);
  const lines: string[] = [];
  lines.push(`📋 AGENDA CLÍNICA - ${fechaFmt}`);

  let citados = 0;
  let libres = 0;

  // Mapa rápido de pacientes frescos
  const patientMap = new Map<string, PatientKoBo>();
  patientsList.forEach((p) => {
    if (p._id) patientMap.set(String(p._id), p);
    if (p.id) patientMap.set(String(p.id), p);
  });

  for (const s of slots) {
    const key = `${s.fecha}_${s.start}`;
    const appt = appointments[key];
    const label = TIPO_ATENCION_LABELS[s.tipo_atencion];
    
    if (appt) {
      citados++;
      const pId = appt.patientId || appt.patient?._id || appt.patient?.id;
      const freshPatient = pId ? patientMap.get(String(pId)) : {};
      
      // Fusiona la cita vieja con el paciente fresco
      const mergedPatient = { ...(appt.patient || {}), ...(freshPatient || {}) } as PatientKoBo;
      
      lines.push(patientLine(s, mergedPatient));
    } else {
      libres++;
      lines.push(`• [${s.start} - ${s.end}] [${label}] - DISPONIBLE`);
    }
  }

  lines.push(`Total: ${citados} pacientes citados | ${libres} disponibles`);
  return lines.join('\n');
}

export async function copyAgendaToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function shareAgenda(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: 'Agenda Clínica', text });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * 1. Exportar Backup JSON completo
 */
export function exportFullBackupJSON(backupData: {
  agenda: AgendaDay[];
  patients: PatientKoBo[];
  appointments: Record<string, Appointment>;
  sheetsSettings?: SheetsSettings;
  koboSettings?: KoboSettings;
}) {
  const payload: AppBackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...backupData,
  };
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `agenda_backup_${dateStr}.json`;
  downloadBlob(JSON.stringify(payload, null, 2), filename, 'application/json;charset=utf-8;');
}

/**
 * 2. Exportar Citas Agendadas a CSV (Excel con BOM UTF-8 y separador ';')
 */
export function exportAppointmentsToExcel(
  appointments: Record<string, Appointment>,
  patientsList: PatientKoBo[] = []
) {
  const apptList = Object.values(appointments);
  if (apptList.length === 0) {
    alert('No hay citas asignadas para exportar.');
    return;
  }

  const patientMap = new Map<string, PatientKoBo>();
  patientsList.forEach((p) => {
    if (p._id) patientMap.set(String(p._id), p);
    if (p.id) patientMap.set(String(p.id), p);
  });

  const headers = [
    'Fecha',
    'Hora',
    'Paciente',
    'Tipo Doc',
    'Documento',
    'Edad',
    'Teléfono',
    'EPS',
    'Departamento',
    'Ciudad',
    'Modalidad',
    'Lugar',
  ];

  const escapeCsv = (val: unknown) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows: string[] = [headers.map(escapeCsv).join(';')];

  apptList.sort((a: any, b: any) => {
    const dateA = a.fecha || a.date || '';
    const dateB = b.fecha || b.date || '';
    const timeA = a.hora || a.start || a.time || '';
    const timeB = b.hora || b.start || b.time || '';
    return dateA.localeCompare(dateB) || timeA.localeCompare(timeB);
  });

  for (const appt of apptList as any[]) {
    const pId = appt.patientId || appt.patient?._id || appt.patient?.id;
    const freshPatient = pId ? patientMap.get(String(pId)) : {};
    const p: Partial<PatientKoBo> = { ...(appt.patient || {}), ...(freshPatient || {}) };

    const line = [
      appt.fecha || appt.date || '',
      appt.hora || appt.start || appt.time || '',
      p.name || appt.patientName || '',
      p.tipo_documento || '', 
      p.id || appt.patientId || '',
      p.age ?? '',
      p.telephone1 || appt.telephone || '',
      p.eps || '',
      p.department || '',
      p.city || '',
      appt.modalidad || appt.modality || '',
      appt.lugar || appt.location || '',
    ];
    rows.push(line.map(escapeCsv).join(';'));
  }

  const csvContent = '\uFEFF' + rows.join('\r\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadBlob(csvContent, `citas_agendadas_${dateStr}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * 3. Importar y restaurar Backup JSON
 */
export function importBackupFromFile(
  file: File,
  onSuccess: (data: AppBackupData) => void,
  onError: (errMessage: string) => void
) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      const parsed = JSON.parse(text) as AppBackupData;

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('El archivo no tiene un formato JSON válido.');
      }

      onSuccess(parsed);
    } catch (err: any) {
      onError(err.message || 'Error al procesar el archivo de copia de seguridad.');
    }
  };
  reader.onerror = () => onError('No se pudo leer el archivo seleccionado.');
  reader.readAsText(file);
}
