import type { AgendaDay, SheetsSettings, TipoAtencion } from '@/types';
import {
  VALID_DURATIONS,
  normalizeTipoAtencion,
} from '@/utils/tipoAtencion';

function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

export async function fetchSheetsAgenda(
  settings: SheetsSettings,
): Promise<AgendaDay[]> {
  if (!settings.csvUrl) {
    throw new Error('Falta la URL de Google Sheets (CSV).');
  }

  const res = await fetch(settings.csvUrl);
  if (!res.ok) {
    throw new Error(`Sheets respondió ${res.status}: ${res.statusText}`);
  }
  const text = await res.text();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const idx = (name: string) => header.indexOf(name);

  const iFecha = idx('fecha');
  const iInicio = idx('hora_inicio');
  const iFin = idx('hora_fin');
  const iDur = idx('duracion_slot_min');
  const iTipo = idx('tipo_atencion');

  if (iFecha < 0 || iInicio < 0 || iFin < 0 || iDur < 0 || iTipo < 0) {
    throw new Error(
      'El CSV debe tener 5 columnas: fecha, hora_inicio, hora_fin, duracion_slot_min, tipo_atencion.',
    );
  }

  const days: AgendaDay[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const fecha = cols[iFecha];
    if (!fecha) continue;

    const tipo = normalizeTipoAtencion(cols[iTipo]);
    if (!tipo) continue;

    const dur = parseInt(cols[iDur], 10);
    const valid = VALID_DURATIONS[tipo as TipoAtencion];
    if (!valid.includes(dur)) continue;

    days.push({
      fecha,
      hora_inicio: cols[iInicio],
      hora_fin: cols[iFin],
      duracion_slot_min: dur,
      tipo_atencion: tipo as TipoAtencion,
    });
  }
  return days;
}
