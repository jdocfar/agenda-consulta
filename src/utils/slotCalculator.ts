import type { AgendaDay, TimeSlot } from '@/types';

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Genera franjas consecutivas. Un slot es válido solo si (start + duracion) <= hora_fin.
 * El residuo que sobrepase hora_fin se descarta.
 */
export function generateSlots(day: AgendaDay): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const start = timeToMinutes(day.hora_inicio);
  const end = timeToMinutes(day.hora_fin);
  const dur = day.duracion_slot_min;

  if (dur <= 0 || end <= start) return slots;

  let cursor = start;
  while (cursor + dur <= end) {
    const slotEnd = cursor + dur;
    slots.push({
      fecha: day.fecha,
      hora_inicio: day.hora_inicio,
      hora_fin: day.hora_fin,
      duracion_slot_min: dur,
      tipo_atencion: day.tipo_atencion,
      start: minutesToTime(cursor),
      end: minutesToTime(slotEnd),
      status: 'available',
    });
    cursor = slotEnd;
  }
  return slots;
}

/**
 * Genera slots para múltiples bloques de una misma fecha,
 * ordenados cronológicamente por hora de inicio.
 */
export function generateSlotsForDate(blocks: AgendaDay[]): TimeSlot[] {
  const sorted = [...blocks].sort(
    (a, b) =>
      timeToMinutes(a.hora_inicio) - timeToMinutes(b.hora_inicio),
  );
  return sorted.flatMap(generateSlots);
}

export function slotKey(fecha: string, start: string): string {
  return `${fecha}_${start}`;
}
