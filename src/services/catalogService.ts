// src/services/catalogService.ts

let deptosMap: Record<string, string> | null = null;
let epsMap: Record<string, string> | null = null;

// Parser simple de CSV para 2 columnas (código, nombre)
function parseSimpleCsv(text: string): Record<string, string> {
  const map: Record<string, string> = {};
  const lines = text.split(/\r?\n/);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Manejo básico de comas (soporta comas simples o delimitadas)
    const parts = line.split(',');
    if (parts.length >= 2) {
      const code = parts[0].trim().replace(/^["']|["']$/g, '').toLowerCase();
      const label = parts.slice(1).join(',').trim().replace(/^["']|["']$/g, '');
      map[code] = label;
    }
  }
  return map;
}

export async function loadCatalogs(): Promise<{
  deptos: Record<string, string>;
  eps: Record<string, string>;
}> {
  if (deptosMap && epsMap) {
    return { deptos: deptosMap, eps: epsMap };
  }

  // Usar BASE_URL para respetar el subdirectorio /agenda-consulta/ de GitHub Pages
  const baseUrl = import.meta.env.BASE_URL;

  try {
    const [resDeptos, resEps] = await Promise.all([
      fetch(`${baseUrl}data/departamentos1.csv`),
      fetch(`${baseUrl}data/eps.csv`),
    ]);

    if (resDeptos.ok) {
      const text = await resDeptos.text();
      deptosMap = parseSimpleCsv(text);
    } else {
      deptosMap = {};
    }

    if (resEps.ok) {
      const text = await resEps.text();
      epsMap = parseSimpleCsv(text);
    } else {
      epsMap = {};
    }
  } catch (error) {
    console.warn('Error cargando catálogos CSV:', error);
    deptosMap = deptosMap || {};
    epsMap = epsMap || {};
  }

  return { deptos: deptosMap, eps: epsMap };
}

export function translateCode(code: string | undefined, catalog: Record<string, string> | null): string {
  if (!code) return '';
  const cleanCode = String(code).trim().toLowerCase();
  return catalog?.[cleanCode] || code;
}
