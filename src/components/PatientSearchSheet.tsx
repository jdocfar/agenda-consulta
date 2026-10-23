import { useMemo, useState } from 'react';
import { Search, X, UserPlus, Phone } from 'lucide-react';
import type { PatientKoBo } from '@/types';

interface Props {
  open: boolean;
  patients: PatientKoBo[];
  slotLabel: string;
  onClose: () => void;
  onAssign: (patient: PatientKoBo) => void;
}

export default function PatientSearchSheet({
  open,
  patients,
  slotLabel,
  onClose,
  onAssign,
}: Props) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients.slice(0, 30);
    return patients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [query, patients]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[88vh] flex-col rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:mx-auto sm:w-full">
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="flex items-center justify-between px-5 pt-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Asignar paciente
            </h2>
            <p className="text-xs text-slate-400">Cupo: {slotLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o documento…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {results.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No se encontraron pacientes. Sincroniza desde KoBo primero.
            </p>
          ) : (
            <ul className="space-y-2">
              {results.map((p) => (
                <li
                  key={p._id}
                  className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {p.name || 'Sin nombre'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {p.tipo_documento || 'ID'}: {p.id || '—'} · {p.age || '—'} años · EPS:{' '}
                        {p.eps || '—'} · {p.city || '—'}
                      </p>
                      {p.telephone1 && (
                        <a
                          href={`tel:${p.telephone1}`}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-teal-600"
                        >
                          <Phone className="h-3 w-3" />
                          {p.telephone1}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => onAssign(p)}
                      className="flex shrink-0 items-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700 active:bg-teal-800"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Asignar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
