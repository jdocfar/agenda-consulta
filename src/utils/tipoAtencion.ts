import type { TipoAtencion } from '@/types';

export const TIPO_ATENCION_LABELS: Record<TipoAtencion, string> = {
  'consulta habitual': 'HABITUAL',
  'consulta particular': 'PARTICULAR',
  'junta': 'JUNTA',
};

export const TIPO_ATENCION_SHORT: Record<TipoAtencion, string> = {
  'consulta habitual': 'Habitual',
  'consulta particular': 'Particular',
  'junta': 'Junta',
};

interface TipoAtencionStyle {
  badge: string;
  badgeAvailable: string;
  timeBlock: string;
  timeBlockOccupied: string;
  borderAccent: string;
  cardAvailable: string;
  text: string;
}

export const TIPO_ATENCION_STYLE: Record<TipoAtencion, TipoAtencionStyle> = {
  'consulta habitual': {
    badge: 'bg-sky-600 text-white',
    badgeAvailable: 'bg-sky-100 text-sky-700',
    timeBlock: 'bg-sky-100 text-sky-800',
    timeBlockOccupied: 'bg-sky-600 text-white',
    borderAccent: 'border-sky-500',
    cardAvailable: 'border-sky-200 bg-sky-50/40 hover:bg-sky-50',
    text: 'text-sky-700',
  },
  'consulta particular': {
    badge: 'bg-purple-600 text-white',
    badgeAvailable: 'bg-purple-100 text-purple-700',
    timeBlock: 'bg-purple-100 text-purple-800',
    timeBlockOccupied: 'bg-purple-600 text-white',
    borderAccent: 'border-purple-500',
    cardAvailable: 'border-purple-200 bg-purple-50/40 hover:bg-purple-50',
    text: 'text-purple-700',
  },
  'junta': {
    badge: 'bg-amber-600 text-white',
    badgeAvailable: 'bg-amber-100 text-amber-700',
    timeBlock: 'bg-amber-100 text-amber-800',
    timeBlockOccupied: 'bg-amber-600 text-white',
    borderAccent: 'border-amber-500',
    cardAvailable: 'border-amber-200 bg-amber-50/40 hover:bg-amber-50',
    text: 'text-amber-700',
  },
};

export const VALID_DURATIONS: Record<TipoAtencion, number[]> = {
  'consulta habitual': [25, 30],
  'consulta particular': [60],
  'junta': [45, 60],
};

export function normalizeTipoAtencion(raw: string): TipoAtencion | null {
  const v = raw.toLowerCase().trim();
  if (v === 'consulta habitual' || v === 'habitual') return 'consulta habitual';
  if (v === 'consulta particular' || v === 'particular')
    return 'consulta particular';
  if (v === 'junta') return 'junta';
  return null;
}
