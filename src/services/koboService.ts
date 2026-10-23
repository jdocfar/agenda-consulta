import type { KoboSettings, PatientKoBo } from '@/types';
import { loadCatalogs, translateCode } from './catalogService';

interface KoboRawRecord {
  _id: string;
  name?: string;
  tipo_documento?: string;
  id?: string;
  telephone1?: string;
  telephone2?: string;
  email?: string;
  borndate?: string;
  age?: string | number;
  eps?: string;
  department?: string;
  city?: string;
  mothername?: string;
  fathername?: string;
}

function normalize(
  r: KoboRawRecord,
  deptosMap: Record<string, string>,
  epsMap: Record<string, string>
): PatientKoBo {
  return {
    _id: String(r._id ?? ''),
    name: r.name ?? '',
    id: r.id ?? '',
    tipo_documento: r.tipo_documento ?? '',
    telephone1: r.telephone1 ?? '',
    telephone2: r.telephone2 ?? '',
    email: r.email ?? '',
    borndate: r.borndate ?? '',
    age: r.age ?? '',
    eps: translateCode(r.eps, epsMap),
    department: translateCode(r.department, deptosMap),
    city: r.city ?? '',
    mothername: r.mothername ?? '',
    fathername: r.fathername ?? '',
  };
}

export async function fetchKoboPatients(
  settings: KoboSettings,
): Promise<PatientKoBo[]> {
  if (!settings.baseUrl || !settings.apiToken || !settings.assetUid) {
    throw new Error('Faltan credenciales de KoBoToolbox.');
  }

  // 1. Cargar los mapas CSV
  const { deptos, eps } = await loadCatalogs();

  // 2. Consulta a KoBo vía Worker
  const base = settings.baseUrl.trim().replace(/\/+$/, '');
  const targetUrl = `${base}/api/v2/assets/${settings.assetUid.trim()}/data.json`;
  const workerBase = 'https://microcors.jdocfar.workers.dev/';
  const proxyUrl = `${workerBase}/?url=${encodeURIComponent(targetUrl)}`;

  const res = await fetch(proxyUrl, {
    method: 'GET',
    headers: {
      Authorization: `Token ${settings.apiToken.trim()}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`KoBo respondió ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const results: KoboRawRecord[] = data?.results ?? [];

  // 3. Normalizar usando las etiquetas cargadas desde los CSV
  return results.map((r) => normalize(r, deptos, eps));
}
