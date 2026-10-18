import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  dates: string[];
  selected: string;
  onSelect: (d: string) => void;
}

function formatLabel(iso: string): string {
  const [y, m, d] = iso.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  const wd = date.toLocaleDateString('es-CO', { weekday: 'short' });
  return `${wd.charAt(0).toUpperCase() + wd.slice(1)} ${d}/${m}`;
}

export default function DateSelector({ dates, selected, onSelect }: Props) {
  const ordered = useMemo(
    () => [...dates].sort((a, b) => a.localeCompare(b)),
    [dates],
  );

  if (ordered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-400">
        No hay jornadas cargadas. Sincroniza los horarios desde Google Sheets.
      </div>
    );
  }

  const idx = Math.max(0, ordered.indexOf(selected));

  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <button
        onClick={() => idx > 0 && onSelect(ordered[idx - 1])}
        disabled={idx <= 0}
        className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
        aria-label="Fecha anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex flex-1 gap-2 overflow-x-auto">
        {ordered.map((d) => (
          <button
            key={d}
            onClick={() => onSelect(d)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${
              d === selected
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {formatLabel(d)}
          </button>
        ))}
      </div>
      <button
        onClick={() =>
          idx < ordered.length - 1 && onSelect(ordered[idx + 1])
        }
        disabled={idx >= ordered.length - 1}
        className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
        aria-label="Fecha siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
