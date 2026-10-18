import { CalendarClock, Users } from 'lucide-react';
import type { SyncState } from '@/types';

interface Props {
  syncSheets: SyncState;
  syncKobo: SyncState;
  onSyncSheets: () => void;
  onSyncKobo: () => void;
  onOpenSettings: () => void;
}

function Dot({ state }: { state: SyncState }) {
  const color =
    state.status === 'loading'
      ? 'bg-amber-400 animate-pulse'
      : state.status === 'success'
        ? 'bg-emerald-500'
        : state.status === 'error'
          ? 'bg-red-500'
          : 'bg-slate-300';
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

export default function TopBar({
  syncSheets,
  syncKobo,
  onSyncSheets,
  onSyncKobo,
  onOpenSettings,
}: Props) {
  return (
    <header className="sticky top-0 z-20 bg-teal-700 text-white shadow-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-semibold">Clínica Agenda</h1>
            <p className="text-[11px] text-teal-100">Offline-first</p>
          </div>
        </div>
        <button
          onClick={onOpenSettings}
          className="rounded-lg px-3 py-2 text-sm font-medium text-teal-50 hover:bg-teal-600 active:bg-teal-800"
          aria-label="Ajustes"
        >
          Ajustes
        </button>
      </div>

      <div className="mx-auto flex max-w-2xl gap-2 px-4 pb-3">
        <button
          onClick={onSyncSheets}
          disabled={syncSheets.status === 'loading'}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/20 disabled:opacity-60"
        >
          <Dot state={syncSheets} />
          <CalendarClock className="h-4 w-4" />
          <span className="truncate">
            {syncSheets.status === 'loading'
              ? 'Sincronizando…'
              : 'Sincronizar Horarios'}
          </span>
        </button>
        <button
          onClick={onSyncKobo}
          disabled={syncKobo.status === 'loading'}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-medium backdrop-blur transition hover:bg-white/20 disabled:opacity-60"
        >
          <Dot state={syncKobo} />
          <Users className="h-4 w-4" />
          <span className="truncate">
            {syncKobo.status === 'loading'
              ? 'Sincronizando…'
              : 'Sincronizar Pacientes'}
          </span>
        </button>
      </div>
    </header>
  );
}
