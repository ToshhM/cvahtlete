import { toSafeText, toSafeHttpsUrl, isRecord } from "@/lib/validation";

export { toSafeHttpsUrl };

type PublicLink = {
  label: string;
  icon: string;
  url: string;
};

export function normalizePublicLinks(raw: unknown, limit = 6): PublicLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, limit).flatMap((item) => {
    if (!isRecord(item)) return [];
    const label = toSafeText(item.label, 30);
    const icon = toSafeText(item.icon, 16);
    const url = toSafeHttpsUrl(item.url);
    return label && url ? [{ label, icon, url }] : [];
  });
}
