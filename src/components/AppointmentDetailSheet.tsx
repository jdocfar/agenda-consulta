import { X, Phone, Trash2, User, Mail, MapPin, Stethoscope } from 'lucide-react';
import type { Appointment } from '@/types';
import {
  TIPO_ATENCION_SHORT,
  TIPO_ATENCION_STYLE,
} from '@/utils/tipoAtencion';

interface Props {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onRelease: () => void;
}

export default function AppointmentDetailSheet({
  open,
  appointment,
  onClose,
  onRelease,
}: Props) {
  if (!open || !appointment) return null;
  const p = appointment.patient;
  const style = TIPO_ATENCION_STYLE[appointment.tipo_atencion];

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:mx-auto sm:w-full">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Cita asignada
            </h2>
            <p className="text-sm text-slate-500">
              {appointment.start} - {appointment.end} ·{' '}
              {appointment.duracion_slot_min} min
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${style.badge}`}
          >
            {TIPO_ATENCION_SHORT[appointment.tipo_atencion]}
          </span>
        </div>

        <div className="space-y-4">
          <Section icon={<User className="h-4 w-4" />} title="Datos del paciente">
            <Row label="Nombre" value={p.name} />
            <Row label="Documento / HC" value={p.id} />
            <Row label="Fecha de nacimiento" value={p.borndate} />
            <Row label="Edad" value={String(p.age)} />
            <Row label="EPS" value={p.eps} />
          </Section>

          <Section icon={<Phone className="h-4 w-4" />} title="Contacto">
            <div className="flex flex-wrap gap-2">
              {p.telephone1 && (
                <a
                  href={`tel:${p.telephone1}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-100"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {p.telephone1}
                </a>
              )}
              {p.telephone2 && (
                <a
                  href={`tel:${p.telephone2}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {p.telephone2}
                </a>
              )}
              {!p.telephone1 && !p.telephone2 && (
                <span className="text-sm text-slate-400">Sin teléfonos</span>
              )}
            </div>
            {p.email && <Row label="Correo" value={p.email} />}
          </Section>

          <Section icon={<MapPin className="h-4 w-4" />} title="Residencia">
            <Row label="Departamento" value={p.department} />
            <Row label="Ciudad" value={p.city} />
          </Section>

          <Section icon={<User className="h-4 w-4" />} title="Acudientes">
            <Row label="Madre / Acudiente 1" value={p.mothername} />
            <Row label="Padre / Acudiente 2" value={p.fathername} />
          </Section>

          <button
            onClick={onRelease}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 active:bg-red-200"
          >
            <Trash2 className="h-4 w-4" />
            Liberar Cupo / Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-2 flex items-center gap-2 text-teal-700">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-800">
        {value || '—'}
      </span>
    </div>
  );
}
