import { CalendarCheck, Clipboard, Share2, Clock } from 'lucide-react';
import type { AgendaDay, Appointment, TimeSlot } from '@/types';
import { slotKey } from '@/utils/slotCalculator';

interface Props {
  blocks: AgendaDay[];
  slots: TimeSlot[];
  appointments: Record<string, Appointment>;
  onCopy: () => void;
  onShare: () => void;
}

export default function DaySummary({
  blocks,
  slots,
  appointments,
  onCopy,
  onShare,
}: Props) {
  const total = slots.length;
  const assigned = slots.filter(
    (s) => appointments[slotKey(s.fecha, s.start)],
  ).length;
  const free = total - assigned;

  const blocksInfo = [...blocks]
    .sort(
      (a, b) =>
        a.hora_inicio.localeCompare(b.hora_inicio) ||
        a.tipo_atencion.localeCompare(b.tipo_atencion),
    )
    .map(
      (b) =>
        `${b.hora_inicio}-${b.hora_fin} · ${b.duracion_slot_min}min`,
    );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-slate-700">
        <CalendarCheck className="h-5 w-5 text-teal-600" />
        <h2 className="text-sm font-semibold">Resumen del día</h2>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat label="Turnos" value={total} accent="text-slate-800" />
        <Stat label="Asignados" value={assigned} accent="text-teal-700" />
        <Stat label="Disponibles" value={free} accent="text-emerald-600" />
      </div>

      <div className="mb-4 space-y-1">
        {blocksInfo.map((info, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs text-slate-500"
          >
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span>{info}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCopy}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 active:bg-teal-800"
        >
          <Clipboard className="h-4 w-4" />
          Copiar Agenda
        </button>
        <button
          onClick={onShare}
          className="flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
        >
          <Share2 className="h-4 w-4" />
          Compartir
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
    </div>
  );
}
