import { useEffect, useState } from 'react';
import { X, Server, FileSpreadsheet } from 'lucide-react';
import type { KoboSettings, SheetsSettings } from '@/types';
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
