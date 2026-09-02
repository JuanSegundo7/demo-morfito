// resolveActivePresetId() / getActivePreset() — reads the preset cookie
// synchronously (client-only), guarded for SSR. See the presets plan,
// "Diseño" §3-4. middleware.ts (Phase 3) is the only writer of the cookie;
// this module is the reader.

import { DEFAULT_PRESET_ID, isPresetId, PRESET_COOKIE, PRESET_COOKIE_MAX_AGE_SECONDS, type PresetId } from "./ids";
import { getPreset } from "./registry";
import type { BusinessPreset } from "./types";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function resolveActivePresetId(): PresetId {
  const raw = readCookie(PRESET_COOKIE);
  return isPresetId(raw) ? raw : DEFAULT_PRESET_ID;
}

export function getActivePreset(): BusinessPreset {
  return getPreset(resolveActivePresetId());
}

// Client-side counterpart to middleware.ts's Set-Cookie — used by
// <PresetSwitcher> so switching presets in the UI doesn't require a full
// reload/redirect through the middleware. Keep name/path/maxAge in sync
// with middleware.ts; both read PRESET_COOKIE / PRESET_COOKIE_MAX_AGE_SECONDS
// from ids.ts so they can't drift.
export function writePresetCookie(id: PresetId): void {
  if (typeof document === "undefined") return;
  document.cookie = `${PRESET_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=${PRESET_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}
