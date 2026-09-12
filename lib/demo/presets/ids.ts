// Preset identity — the ONLY module in lib/demo/presets/ that middleware.ts
// is allowed to import. Keep this file at ZERO imports: middleware.ts runs
// on Vercel's Edge runtime, and importing anything that pulls in preset
// DATA (definitions/*, builder.ts, registry.ts) would ship all 8 datasets
// into the edge bundle. See "Diseño" section 3 in the presets plan.

export const PRESET_IDS = [
  "hamburgueseria",
  "pizzeria",
  "cafeteria",
  "heladeria",
  "sushi",
  "churreria",
  "rotiseria",
  "parrilla",
] as const;

export type PresetId = (typeof PRESET_IDS)[number];

// Existing hardcoded data (today's hamburguesería) is preset zero — the
// fallback when no cookie/query param is present.
export const DEFAULT_PRESET_ID: PresetId = "hamburgueseria";

// Name of the cookie the middleware sets from `?negocio=` and that
// resolve.ts reads back synchronously on the client.
export const PRESET_COOKIE = "morfito_preset";

// ~30 days — long enough to survive across visits during a sales trip.
// Shared by middleware.ts (Set-Cookie on the response) and resolve.ts's
// writePresetCookie() (client-side write from <PresetSwitcher>) so the two
// writers never drift out of sync.
export const PRESET_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function isPresetId(value: unknown): value is PresetId {
  return typeof value === "string" && (PRESET_IDS as readonly string[]).includes(value);
}
