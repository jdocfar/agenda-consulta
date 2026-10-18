import type { KoboSettings, PatientKoBo } from '@/types';

interface KoboRawRecord {
  _id: string;
  name?: string;
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

function normalize(r: KoboRawRecord): PatientKoBo {
  return {
    _id: String(r._id ?? ''),
    name: r.name ?? '',
    id: r.id ?? '',
    telephone1: r.telephone1 ?? '',
    telephone2: r.telephone2 ?? '',
    email: r.email ?? '',
    borndate: r.borndate ?? '',
    age: r.age ?? '',
    eps: r.eps ?? '',
    department: r.department ?? '',
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

  const base = settings.baseUrl.replace(/\/+$/, '');
  const url = `${base}/api/v2/assets/${settings.assetUid}/data.json`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Token ${settings.apiToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`KoBo respondió ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const results: KoboRawRecord[] = data?.results ?? [];
  return results.map(normalize);
}
