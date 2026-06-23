// ---------------------------------------------------------------------------
// Shared validation & normalization — single source of truth.
// Pure functions only (no server imports) → works in both client and server.
// ---------------------------------------------------------------------------

// ─── Text ───────────────────────────────────────────────────────────────────

export function toSafeText(v: unknown, max = 80): string {
  if (typeof v === "number" && Number.isFinite(v)) v = String(v);
  if (typeof v !== "string") return "";
  let out = "";
  for (let i = 0; i < v.length; i++) {
    const code = v.charCodeAt(i);
    if (code >= 32 && code !== 127) out += v[i];
  }
  return out.slice(0, max).trim();
}

// ─── URL ────────────────────────────────────────────────────────────────────

export function toSafeHttpsUrl(v: unknown): string | null {
  if (typeof v !== "string" || v.length > 500) return null;
  try {
    const url = new URL(v);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

// ─── Color ──────────────────────────────────────────────────────────────────

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function toSafeHex(v: unknown, fallback: string): string {
  return typeof v === "string" && HEX_COLOR.test(v) ? v : fallback;
}

// ─── Type guard ─────────────────────────────────────────────────────────────

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// ─── Email ──────────────────────────────────────────────────────────────────

export function normalizeEmail(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

// ─── Slug ───────────────────────────────────────────────────────────────────

export function sanitizeSlug(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// ─── Password rules (shared between client UX and server validation) ────────

export const PASSWORD_MIN = 10;

export const PASSWORD_RULES = [
  { key: "length",  label: "10+ caractères",        test: (p: string) => p.length >= PASSWORD_MIN },
  { key: "lower",   label: "une minuscule",          test: (p: string) => /[a-z]/.test(p) },
  { key: "upper",   label: "une majuscule",          test: (p: string) => /[A-Z]/.test(p) },
  { key: "digit",   label: "un chiffre",             test: (p: string) => /[0-9]/.test(p) },
  { key: "special", label: "un caractère spécial",   test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export function passwordError(pw: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(pw)) return `Mot de passe : ${rule.label}.`;
  }
  return null;
}

// ─── Text field limits ──────────────────────────────────────────────────────

export const FIELD_LIMITS = {
  first: 60,
  last: 60,
  sport: 40,
  discipline: 60,
  location: 80,
  tagline: 160,
  bio: 2000,
  fullName: 80,
} as const;

// ─── JSONB safety ───────────────────────────────────────────────────────────

export const JSON_MAX_BYTES = 20_000;

export function isSafeJson(v: unknown): boolean {
  if (!Array.isArray(v)) return false;
  try {
    return JSON.stringify(v).length <= JSON_MAX_BYTES;
  } catch {
    return false;
  }
}

// ─── JSONB display parsers (shared between ProfileView and CineView) ────────

export interface ParsedStat     { label: string; value: string; unit: string }
export interface ParsedPalmares { icon: string;  name: string;  count: string }
export interface ParsedCareer   { year: string;  club: string;  detail: string }
export interface ParsedLink     { label: string; url: string }

export function parseStats(raw: unknown): ParsedStat[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 6).flatMap((item) => {
    if (!isRecord(item)) return [];
    const label = toSafeText(item.label);
    const value = toSafeText(item.value, 20);
    const unit  = toSafeText(item.unit, 8);
    return label && value ? [{ label, value, unit }] : [];
  });
}

export function parsePalmares(raw: unknown): ParsedPalmares[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 8).flatMap((item) => {
    if (!isRecord(item)) return [];
    const icon  = toSafeText(item.icon, 8);
    const name  = toSafeText(item.name);
    const count = toSafeText(item.count, 12);
    return name ? [{ icon, name, count }] : [];
  });
}

export function parseCareer(raw: unknown): ParsedCareer[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 12).flatMap((item) => {
    if (!isRecord(item)) return [];
    const year   = toSafeText(item.year, 12);
    const club   = toSafeText(item.club);
    const detail = toSafeText(item.detail);
    return year || club ? [{ year, club, detail }] : [];
  });
}

export function parseLinks(raw: unknown): ParsedLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 6).flatMap((item) => {
    if (!isRecord(item)) return [];
    const label = toSafeText(item.label, 30);
    const url   = toSafeHttpsUrl(item.url);
    return label && url ? [{ label, url }] : [];
  });
}
