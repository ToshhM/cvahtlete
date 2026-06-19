export function siteOriginFromConfig(fallback = "http://localhost:3000"): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Ignore malformed values and fall back to the caller-provided default.
    }
  }
  return new URL(fallback).origin;
}
