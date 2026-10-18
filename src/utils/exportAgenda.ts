import type { Appointment, TimeSlot } from '@/types';
import { TIPO_ATENCION_LABELS } from '@/utils/tipoAtencion';

function formatDateDDMMYYYY(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function patientLine(slot: TimeSlot, appt: Appointment): string {
  const label = TIPO_ATENCION_LABELS[slot.tipo_atencion];
  const p = appt.patient;
  const timeRange = `[${slot.start} - ${slot.end}]`;
  const typeTag = `[${label}]`;

  switch (slot.tipo_atencion) {
    case 'consulta habitual':
      return `• ${timeRange} ${typeTag} - ${p.name} (ID: ${p.id}, Tel: ${p.telephone1}, EPS: ${p.eps})`;
    case 'consulta particular':
      return `• ${timeRange} ${typeTag} - ${p.name} (ID: ${p.id}, Tel: ${p.telephone1})`;
    case 'junta':
      return `• ${timeRange} ${typeTag} - ${p.name} (ID: ${p.id}, Tel: ${p.telephone1}, EPS: ${p.eps})`;
  }
}

export function buildAgendaText(
  fecha: string,
  slots: TimeSlot[],
  appointments: Record<string, Appointment>,
): string {
  const fechaFmt = formatDateDDMMYYYY(fecha);
  const lines: string[] = [];
  lines.push(`📋 AGENDA CLÍNICA - ${fechaFmt}`);

  let citados = 0;
  let libres = 0;

  for (const s of slots) {
    const key = `${s.fecha}_${s.start}`;
    const appt = appointments[key];
    const label = TIPO_ATENCION_LABELS[s.tipo_atencion];
    if (appt) {
      citados++;
      lines.push(patientLine(s, appt));
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
