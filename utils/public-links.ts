type PublicLink = {
  label: string;
  icon: string;
  url: string;
};

function toSafeText(v: unknown, max = 80): string {
  if (typeof v === 'number' && Number.isFinite(v)) v = String(v);
  if (typeof v !== 'string') return '';
  let out = '';
  for (let i = 0; i < v.length; i++) {
    const code = v.charCodeAt(i);
    if (code >= 32 && code !== 127) out += v[i];
  }
  return out.slice(0, max).trim();
}

export function toSafeHttpsUrl(v: unknown): string | null {
  if (typeof v !== 'string' || v.length > 500) return null;
  try {
    const url = new URL(v);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

export function normalizePublicLinks(raw: unknown, limit = 6): PublicLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, limit).flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    const label = toSafeText(record.label, 30);
    const icon = toSafeText(record.icon, 16);
    const url = toSafeHttpsUrl(record.url);
    return label && url ? [{ label, icon, url }] : [];
  });
}
