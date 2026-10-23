import { useEffect, useMemo, useState } from 'react';
import type {
  AgendaDay,
  Appointment,
  PatientKoBo,
  SyncState,
  TimeSlot,
} from '@/types';
import { storage } from '@/services/storage';
import { fetchKoboPatients } from '@/services/koboService';
import { fetchSheetsAgenda } from '@/services/sheetsService';
import { generateSlotsForDate, slotKey } from '@/utils/slotCalculator';
import {
  buildAgendaText,
  copyAgendaToClipboard,
  shareAgenda,
} from '@/utils/exportAgenda';

import TopBar from '@/components/TopBar';
import DateSelector from '@/components/DateSelector';
import DaySummary from '@/components/DaySummary';
import SlotList from '@/components/SlotList';
import SettingsSheet from '@/components/SettingsSheet';
import PatientSearchSheet from '@/components/PatientSearchSheet';
import AppointmentDetailSheet from '@/components/AppointmentDetailSheet';
import Toast from '@/components/Toast';

export default function App() {
  const [agenda, setAgenda] = useState<AgendaDay[]>(storage.getAgenda());
  const [patients, setPatients] = useState<PatientKoBo[]>(storage.getPatients());
  const [appointments, setAppointments] = useState<Record<string, Appointment>>(
    storage.getAppointments(),
  );

  const [syncSheets, setSyncSheets] = useState<SyncState>(storage.getSyncState('sheets'));
  const [syncKobo, setSyncKobo] = useState<SyncState>(storage.getSyncState('kobo'));

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<TimeSlot | null>(null);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);

  const [toast, setToast] = useState<{
    message: string | null;
    type: 'success' | 'error';
  }>({ message: null, type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') =>
    setToast({ message, type });

  // === LÓGICA DE FILTROS Y ORDENAMIENTO ===
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // 1. Convertidor inteligente de fechas (entiende DD/MM/YYYY de Google Sheets o YYYY-MM-DD)
  const parseDateStr = (dateStr: string): Date => {
    if (!dateStr) return new Date(0);
    const s = dateStr.trim();
    if (s.includes('/')) {
      // Formato latino: 2/2/2026 o 02/02/2026
      const [d, m, y] = s.split('/');
      const year = y ? (y.length === 2 ? 2000 + parseInt(y) : parseInt(y)) : new Date().getFullYear();
      return new Date(year, parseInt(m) - 1, parseInt(d));
    }
    if (s.includes('-')) {
      // Formato internacional: 2026-02-02
      const [y, m, d] = s.split('-');
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d || '1'));
    }
    return new Date(s);
  };

  // 2. Extraer "YYYY-MM" para agrupar por mes correctamente (ej. Enero 2026 siempre es "2026-01")
  const getMonthKey = (dateStr: string) => {
    const d = parseDateStr(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // 3. Fechas únicas ordenadas matemáticamente por tiempo real
  const allDates = useMemo(() => {
    const unique = agenda
      .map((a) => (a.fecha || '').trim())
      .filter((v, i, arr) => arr.indexOf(v) === i && v !== '');
    
    // getTime() ordena por milisegundos desde 1970, garantizando orden cronológico absoluto
    return unique.sort((a, b) => parseDateStr(a).getTime() - parseDateStr(b).getTime());
  }, [agenda]);

  const availableMonths = useMemo(() => {
    const months = allDates.map(getMonthKey);
    return Array.from(new Set(months)).sort((a, b) => a.localeCompare(b)); 
  }, [allDates]);

  const availableTypes = useMemo(() => {
    const types = agenda.map((a) => {
      const val = (a as any).modalidad || (a as any).tipo_atencion;
      return (val || 'Consulta').trim();
    });
    return Array.from(new Set(types)).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [agenda]);

  const filteredDates = useMemo(() => {
    return allDates.filter((date) => {
      const passMonth = filterMonth === 'all' || getMonthKey(date) === filterMonth;
      const passType =
        filterType === 'all' ||
        agenda.some((a) => {
          const val = (a as any).modalidad || (a as any).tipo_atencion;
          const type = (val || 'Consulta').trim();
          return (a.fecha || '').trim() === date && type === filterType;
        });
      return passMonth && passType;
    });
  }, [allDates, agenda, filterMonth, filterType]);

  const [selectedDate, setSelectedDate] = useState<string>(filteredDates[0] ?? '');

  useEffect(() => {
    if (!filteredDates.includes(selectedDate) && filteredDates.length > 0) {
      setSelectedDate(filteredDates[0]);
    }
  }, [filteredDates, selectedDate]);

  const dayBlocks = useMemo<AgendaDay[]>(() => {
    let blocks = agenda.filter((a) => (a.fecha || '').trim() === selectedDate);
    if (filterType !== 'all') {
      blocks = blocks.filter((a) => {
        const val = (a as any).modalidad || (a as any).tipo_atencion;
        return (val || 'Consulta').trim() === filterType;
      });
    }
    // Ordenar los bloques del mismo día por hora cronológicamente
    return blocks.sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));
  }, [agenda, selectedDate, filterType]);

  const formatMonth = (yyyyMm: string) => {
    const [y, m] = yyyyMm.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 15);
    const str = date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  // ========================================

  const slots = useMemo<TimeSlot[]>(() => {
    if (dayBlocks.length === 0) return [];
    const base = generateSlotsForDate(dayBlocks);
    return base.map((s) => {
      const key = slotKey(s.fecha, s.start);
      return appointments[key] ? { ...s, status: 'occupied' as const } : s;
    });
  }, [dayBlocks, appointments]);

  const persistAppointments = (next: Record<string, Appointment>) => {
    setAppointments(next);
    storage.setAppointments(next);
  };

  const doSyncSheets = async () => {
    setSyncSheets({ status: 'loading' });
    storage.setSyncState('sheets', { status: 'loading' });
    try {
      const days = await fetchSheetsAgenda(storage.getSheetsSettings());
      days.sort(
        (a, b) =>
          a.fecha.localeCompare(b.fecha) ||
          a.hora_inicio.localeCompare(b.hora_inicio),
      );
      setAgenda(days);
      storage.setAgenda(days);
      const ok: SyncState = { status: 'success', lastSync: new Date().toISOString() };
      setSyncSheets(ok);
      storage.setSyncState('sheets', ok);
      showToast(`Horarios sincronizados (${days.length} bloques)`);
    } catch (e) {
      const err: SyncState = {
        status: 'error',
        message: e instanceof Error ? e.message : 'Error desconocido',
      };
      setSyncSheets(err);
      storage.setSyncState('sheets', err);
      showToast('Error al sincronizar horarios', 'error');
    }
  };

  const doSyncKobo = async () => {
    setSyncKobo({ status: 'loading' });
    storage.setSyncState('kobo', { status: 'loading' });
    try {
      const list = await fetchKoboPatients(storage.getKoboSettings());
      setPatients(list);
      storage.setPatients(list);
      const ok: SyncState = { status: 'success', lastSync: new Date().toISOString() };
      setSyncKobo(ok);
      storage.setSyncState('kobo', ok);
      showToast(`Pacientes sincronizados (${list.length})`);
    } catch (e) {
      const err: SyncState = {
        status: 'error',
        message: e instanceof Error ? e.message : 'Error desconocido',
      };
      setSyncKobo(err);
      storage.setSyncState('kobo', err);
      showToast('Error al sincronizar pacientes', 'error');
    }
  };

  const handleSlotClick = (slot: TimeSlot) => {
    const key = slotKey(slot.fecha, slot.start);
    const appt = appointments[key];
    if (appt) {
      setActiveAppointment(appt);
      setDetailOpen(true);
    } else {
      setActiveSlot(slot);
      setSearchOpen(true);
    }
  };

  const handleAssign = (patient: PatientKoBo) => {
    if (!activeSlot) return;
    const key = slotKey(activeSlot.fecha, activeSlot.start);
    const appt: Appointment = {
      slotKey: key,
      fecha: activeSlot.fecha,
      start: activeSlot.start,
      end: activeSlot.end,
      duracion_slot_min: activeSlot.duracion_slot_min,
      tipo_atencion: activeSlot.tipo_atencion,
      hora_inicio_jornada: activeSlot.hora_inicio,
      hora_fin_jornada: activeSlot.hora_fin,
      patientId: patient._id,
      patient,
      createdAt: new Date().toISOString(),
    };
    const next = { ...appointments, [key]: appt };
    persistAppointments(next);
    setSearchOpen(false);
    setActiveSlot(null);
    showToast('Cita asignada correctamente');
  };

  const handleRelease = () => {
    if (!activeAppointment) return;
    const next = { ...appointments };
    delete next[activeAppointment.slotKey];
    persistAppointments(next);
    setDetailOpen(false);
    setActiveAppointment(null);
    showToast('Cupo liberado');
  };

  const handleCopy = async () => {
    if (dayBlocks.length === 0) return;
    const text = buildAgendaText(selectedDate, slots, appointments);
    const ok = await copyAgendaToClipboard(text);
    showToast(ok ? 'Copiado al portapapeles' : 'No se pudo copiar', ok ? 'success' : 'error');
  };

  const handleShare = async () => {
    if (dayBlocks.length === 0) return;
    const text = buildAgendaText(selectedDate, slots, appointments);
    const ok = await shareAgenda(text);
    if (!ok) {
      const copied = await copyAgendaToClipboard(text);
      showToast(copied ? 'Copiado (share no disponible)' : 'No se pudo compartir', copied ? 'success' : 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-20">
      <TopBar
        syncSheets={syncSheets}
        syncKobo={syncKobo}
        onSyncSheets={doSyncSheets}
        onSyncKobo={doSyncKobo}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        {allDates.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <div className="flex-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Filtrar por Mes
              </label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
              >
                <option value="all">Todos los meses</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>{formatMonth(m)}</option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Tipo de Cita
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium capitalize outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
              >
                <option value="all">Todas las modalidades</option>
                {availableTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {filteredDates.length > 0 ? (
          <DateSelector
            dates={filteredDates}
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
        ) : allDates.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
            No hay horarios que coincidan con los filtros actuales.
          </div>
        ) : null}

        {dayBlocks.length > 0 ? (
          <>
            <DaySummary
              blocks={dayBlocks}
              slots={slots}
              appointments={appointments}
              onCopy={handleCopy}
              onShare={handleShare}
            />
            <SlotList
              slots={slots}
              appointments={appointments}
              onSlotClick={handleSlotClick}
            />
          </>
        ) : allDates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-600">Bienvenido a Clínica Agenda</p>
            <p className="mt-1 text-sm text-slate-400">
              Configura tus credenciales en Ajustes y sincroniza horarios y pacientes para comenzar.
            </p>
            <button
              onClick={() => setSettingsOpen(true)}
              className="mt-4 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-teal-700"
            >
              Abrir Ajustes
            </button>
          </div>
        ) : null}
      </main>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => showToast('Credenciales guardadas')}
      />

      <PatientSearchSheet
        open={searchOpen}
        patients={patients}
        slotLabel={activeSlot ? `${activeSlot.start} - ${activeSlot.end}` : ''}
        onClose={() => {
          setSearchOpen(false);
          setActiveSlot(null);
        }}
        onAssign={handleAssign}
      />

      <AppointmentDetailSheet
        open={detailOpen}
        appointment={activeAppointment}
        onClose={() => {
          setDetailOpen(false);
          setActiveAppointment(null);
        }}
        onRelease={handleRelease}
      />

      <Toast
        message={toast.message}
        type={toast.type}
        onDismiss={() => setToast({ message: null, type: 'success' })}
      />
    </div>
  );
}
