// Server-side counterpart to resolve.ts's resolveActivePresetId()/
// getActivePreset(). resolve.ts's readCookie() is client-only
// (`document.cookie`, guarded for SSR to always fall back to
// DEFAULT_PRESET_ID) — that's correct for client components, but a Server
// Component (app/layout.tsx's generateMetadata) or a "use server" action
// (lib/actions/users.ts) needs the cookie the CURRENT request actually
// carries, via next/headers. Kept as a separate module (not merged into
// resolve.ts) so client components never pull `next/headers` into their
// bundle — importing it outside a Server Component/Action throws at build
// time.
//
// Phase 2 note: nothing writes the preset cookie yet (middleware.ts is
// Phase 3), so this always resolves to DEFAULT_PRESET_ID today — but the
// call sites (metadata, /usuarios) are written against the cookie now so
// Phase 3 lights them up for free.

import { cookies } from "next/headers";
import { DEFAULT_PRESET_ID, isPresetId, PRESET_COOKIE, type PresetId } from "./ids";
import { getPreset } from "./registry";
import type { BusinessPreset } from "./types";

export async function resolveActivePresetIdServer(): Promise<PresetId> {
  const store = await cookies();
  const raw = store.get(PRESET_COOKIE)?.value ?? null;
  return isPresetId(raw) ? raw : DEFAULT_PRESET_ID;
}

export async function getActivePresetServer(): Promise<BusinessPreset> {
  return getPreset(await resolveActivePresetIdServer());
}
