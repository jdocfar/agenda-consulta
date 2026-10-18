import { CheckCircle2, Plus, User } from 'lucide-react';
import type { Appointment, TimeSlot } from '@/types';
import { slotKey } from '@/utils/slotCalculator';
import {
  TIPO_ATENCION_SHORT,
  TIPO_ATENCION_STYLE,
} from '@/utils/tipoAtencion';

interface Props {
  slots: TimeSlot[];
  appointments: Record<string, Appointment>;
  onSlotClick: (slot: TimeSlot) => void;
}

export default function SlotList({ slots, appointments, onSlotClick }: Props) {
  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
        No hay franjas generadas para esta jornada.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {slots.map((slot) => {
        const key = slotKey(slot.fecha, slot.start);
        const appt = appointments[key];
        const occupied = !!appt;
        const style = TIPO_ATENCION_STYLE[slot.tipo_atencion];

        return (
          <li key={key} className="relative">
            <button
              onClick={() => onSlotClick(slot)}
              className={`relative flex w-full items-center gap-3 overflow-hidden rounded-xl border p-3 pl-4 text-left shadow-sm transition active:scale-[0.99] ${
                occupied
                  ? 'border-slate-200 bg-slate-100'
                  : style.cardAvailable
              }`}
            >
              {occupied ? (
                <span
                  className={`absolute left-0 top-0 h-full w-1 ${style.borderAccent} border-l-4`}
                />
              ) : null}
              <div
                className={`flex h-11 w-16 shrink-0 flex-col items-center justify-center rounded-lg text-center ${
                  occupied ? style.timeBlockOccupied : style.timeBlock
                }`}
              >
                <span className="text-[11px] font-semibold leading-tight">
                  {slot.start}
                </span>
                <span className="text-[9px] opacity-80 leading-tight">
                  {slot.end}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      occupied
                        ? 'bg-slate-200 text-slate-600'
                        : style.badgeAvailable
                    }`}
                  >
                    {TIPO_ATENCION_SHORT[slot.tipo_atencion]}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {slot.duracion_slot_min} min
                  </span>
                </div>

                {occupied ? (
                  <>
                    <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-800">
                      <User className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      {appt!.patient.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      ID: {appt!.patient.id} · EPS:{' '}
                      {appt!.patient.eps || '—'}
                    </p>
                  </>
                ) : (
                  <>
                    <p
                      className={`flex items-center gap-1.5 text-sm font-medium ${style.text}`}
                    >
                      <Plus className="h-4 w-4" />
                      Disponible
                    </p>
                    <p className="text-xs text-slate-400">
                      Toca para asignar paciente
                    </p>
                  </>
                )}
              </div>

              {occupied ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-500" />
              ) : (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.badgeAvailable}`}
                >
                  Libre
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
