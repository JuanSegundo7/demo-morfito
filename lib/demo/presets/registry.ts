// Record<PresetId, () => BusinessPreset> — LAZY factories, per the plan's
// "Diseño" §1. All 8 verticals have real content (Phase 4 complete).

import { buildPreset } from "./builder";
import { CAFETERIA_DEFINITION } from "./definitions/cafeteria";
import { CHURRERIA_DEFINITION } from "./definitions/churreria";
import { HAMBURGUESERIA_DEFINITION } from "./definitions/hamburgueseria";
import { HELADERIA_DEFINITION } from "./definitions/heladeria";
import { PARRILLA_DEFINITION } from "./definitions/parrilla";
import { PIZZERIA_DEFINITION } from "./definitions/pizzeria";
import { ROTISERIA_DEFINITION } from "./definitions/rotiseria";
import { SUSHI_DEFINITION } from "./definitions/sushi";
import { PRESET_IDS, type PresetId } from "./ids";
import type { BusinessPreset } from "./types";

export const PRESET_LABELS: Record<PresetId, string> = {
  hamburgueseria: "Hamburguesería",
  pizzeria: "Pizzería",
  cafeteria: "Cafetería",
  heladeria: "Heladería",
  sushi: "Sushi",
  churreria: "Churrería",
  rotiseria: "Rotisería",
  parrilla: "Parrilla",
};

const REGISTRY: Record<PresetId, () => BusinessPreset> = {
  hamburgueseria: () => buildPreset(HAMBURGUESERIA_DEFINITION),
  pizzeria: () => buildPreset(PIZZERIA_DEFINITION),
  cafeteria: () => buildPreset(CAFETERIA_DEFINITION),
  heladeria: () => buildPreset(HELADERIA_DEFINITION),
  sushi: () => buildPreset(SUSHI_DEFINITION),
  churreria: () => buildPreset(CHURRERIA_DEFINITION),
  rotiseria: () => buildPreset(ROTISERIA_DEFINITION),
  parrilla: () => buildPreset(PARRILLA_DEFINITION),
};

// Memoized per id: buildPreset() re-joins every product/recipe/supply from
// scratch, and this is now called on every server request (app/layout.tsx's
// generateMetadata reads it per request via resolve-server.ts). Safe to
// cache — store.ts's insertRow/updateRow/deleteRow are all immutable
// (map/filter/spread), so nothing ever mutates a built preset's arrays in
// place; every call for the same id can safely return the same object.
const BUILT_CACHE = new Map<PresetId, BusinessPreset>();

export function getPreset(id: PresetId): BusinessPreset {
  const cached = BUILT_CACHE.get(id);
  if (cached) return cached;
  const built = REGISTRY[id]();
  BUILT_CACHE.set(id, built);
  return built;
}

export function getAllBuiltPresets(): BusinessPreset[] {
  return PRESET_IDS.map((id) => getPreset(id));
}
