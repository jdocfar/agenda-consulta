import { useEffect, useState } from 'react';
import { X, Server, FileSpreadsheet } from 'lucide-react';
import type { KoboSettings, SheetsSettings } from '@/types';
import { storage } from '@/services/storage';

import { useRef } from 'react';
import {
  exportFullBackupJSON,
  exportAppointmentsToExcel,
  importBackupFromFile,
  AppBackupData,
} from '@/utils/exportAgenda';
import { storage } from '@/services/storage';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function SettingsSheet({ open, onClose, onSaved }: Props) {
  const [kobo, setKobo] = useState<KoboSettings>(storage.getKoboSettings());
  const [sheets, setSheets] = useState<SheetsSettings>(storage.getSheetsSettings());

  useEffect(() => {
    if (open) {
      setKobo(storage.getKoboSettings());
      setSheets(storage.getSheetsSettings());
    }
  }, [open]);

  if (!open) return null;

  const save = () => {
    storage.setKoboSettings(kobo);
    storage.setSheetsSettings(sheets);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:mx-auto sm:w-full">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Ajustes</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-teal-700">
            <Server className="h-4 w-4" />
            <h3 className="text-sm font-semibold">KoBoToolbox</h3>
          </div>
          <div className="space-y-3">
            <Field
              label="URL base del servidor"
              placeholder="https://kf.kobotoolbox.org"
              value={kobo.baseUrl}
              onChange={(v) => setKobo({ ...kobo, baseUrl: v })}
            />
            <Field
              label="API Token"
              type="password"
              placeholder="Token de usuario"
              value={kobo.apiToken}
              onChange={(v) => setKobo({ ...kobo, apiToken: v })}
            />
            <Field
              label="Asset UID del formulario"
              placeholder="abcdef123456"
              value={kobo.assetUid}
              onChange={(v) => setKobo({ ...kobo, assetUid: v })}
            />
          </div>
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-teal-700">
            <FileSpreadsheet className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Google Sheets (CSV)</h3>
          </div>
          <Field
            label="URL de publicación CSV"
            placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
            value={sheets.csvUrl}
            onChange={(v) => setSheets({ ...sheets, csvUrl: v })}
          />
        </section>

        <button
          onClick={save}
          className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 active:bg-teal-800"
        >
          Guardar credenciales
        </button>
        <p className="mt-3 text-center text-[11px] text-slate-400">
          Los datos se guardan únicamente en este dispositivo.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
      />
    </label>
  );
}

// Aquí agregue todo

export default function SettingsSheet({
  // Tus props actuales...
  onDataRestored, // opcional: callback para refrescar el estado de App.tsx
}: {
  onDataRestored?: () => void;
  [key: string]: any;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportExcel = () => {
    exportAppointmentsToExcel(storage.getAppointments(), storage.getPatients());
  };

  const handleExportBackup = () => {
    exportFullBackupJSON({
      agenda: storage.getAgenda(),
      patients: storage.getPatients(),
      appointments: storage.getAppointments(),
      sheetsSettings: storage.getSheetsSettings(),
      koboSettings: storage.getKoboSettings(),
    });
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('¿Restaurar esta copia de seguridad? Se sobreescribirán los datos locales actuales.')) {
      e.target.value = '';
      return;
    }

    importBackupFromFile(
      file,
      (restored) => {
        if (restored.agenda) storage.setAgenda(restored.agenda);
        if (restored.patients) storage.setPatients(restored.patients);
        if (restored.appointments) storage.setAppointments(restored.appointments);
        if (restored.sheetsSettings) storage.setSheetsSettings(restored.sheetsSettings);
        if (restored.koboSettings) storage.setKoboSettings(restored.koboSettings);

        alert('¡Copia de seguridad restaurada con éxito!');
        // Recargar la ventana para refrescar todos los estados de React limpiamente
        window.location.reload();
      },
      (errMsg) => {
        alert(`Error al importar: ${errMsg}`);
      }
    );
    e.target.value = '';
  };

  return (
    <div>
      {/* ... Tus campos existentes de KoBo y Sheets ... */}

      {/* SECCIÓN GESTIÓN DE DATOS */}
      <div className="pt-5 border-t border-slate-700/60 mt-6 space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Datos y Copias de Seguridad
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-medium bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2 transition"
          >
            <span>📊</span> Exportar a Excel (CSV)
          </button>

          <button
            type="button"
            onClick={handleExportBackup}
            className="px-3 py-2 text-xs font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center gap-2 transition"
          >
            <span>💾</span> Descargar Backup (JSON)
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 text-xs font-medium bg-amber-700 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center gap-2 transition sm:col-span-2"
          >
            <span>📥</span> Restaurar Copia (Importar JSON)
          </button>

          {/* Input oculto para cargar archivo */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
      </div>
    </div>
  );
}
