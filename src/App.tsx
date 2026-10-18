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

  const [syncSheets, setSyncSheets] = useState<SyncState>(
    storage.getSyncState('sheets'),
  );
  const [syncKobo, setSyncKobo] = useState<SyncState>(
    storage.getSyncState('kobo'),
  );

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<TimeSlot | null>(null);
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(
    null,
  );

  const [toast, setToast] = useState<{
    message: string | null;
    type: 'success' | 'error';
  }>({ message: null, type: 'success' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') =>
    setToast({ message, type });

  const dates = useMemo(
    () => agenda.map((a) => a.fecha).filter((v, i, arr) => arr.indexOf(v) === i),
    [agenda],
  );

  const [selectedDate, setSelectedDate] = useState<string>(dates[0] ?? '');

  useEffect(() => {
    if (!dates.includes(selectedDate) && dates.length > 0) {
      setSelectedDate(dates[0]);
    }
  }, [dates, selectedDate]);

  const dayBlocks = useMemo<AgendaDay[]>(
    () => agenda.filter((a) => a.fecha === selectedDate),
    [agenda, selectedDate],
  );

  const slots = useMemo<TimeSlot[]>(() => {
    if (dayBlocks.length === 0) return [];
    const base = generateSlotsForDate(dayBlocks);
    return base.map((s) => {
      const key = slotKey(s.fecha, s.start);
      return appointments[key]
        ? { ...s, status: 'occupied' as const }
        : s;
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
      const ok: SyncState = {
        status: 'success',
        lastSync: new Date().toISOString(),
      };
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
      const ok: SyncState = {
        status: 'success',
        lastSync: new Date().toISOString(),
      };
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
    showToast(
      ok ? 'Copiado al portapapeles' : 'No se pudo copiar',
      ok ? 'success' : 'error',
    );
  };

  const handleShare = async () => {
    if (dayBlocks.length === 0) return;
    const text = buildAgendaText(selectedDate, slots, appointments);
    const ok = await shareAgenda(text);
    if (!ok) {
      const copied = await copyAgendaToClipboard(text);
      showToast(
        copied ? 'Copiado (share no disponible)' : 'No se pudo compartir',
        copied ? 'success' : 'error',
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <TopBar
        syncSheets={syncSheets}
        syncKobo={syncKobo}
        onSyncSheets={doSyncSheets}
        onSyncKobo={doSyncKobo}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        <DateSelector
          dates={dates}
          selected={selectedDate}
          onSelect={setSelectedDate}
        />

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
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-sm font-medium text-slate-600">
              Bienvenido a Clínica Agenda
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Configura tus credenciales en Ajustes y sincroniza horarios y
              pacientes para comenzar.
            </p>
            <button
              onClick={() => setSettingsOpen(true)}
              className="mt-4 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Abrir Ajustes
            </button>
          </div>
        )}
      </main>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => showToast('Credenciales guardadas')}
      />

      <PatientSearchSheet
        open={searchOpen}
        patients={patients}
        slotLabel={
          activeSlot ? `${activeSlot.start} - ${activeSlot.end}` : ''
        }
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
