// Type declaration only — Phase 1 moved the hamburguesería extras data into
// lib/demo/presets/definitions/hamburgueseria.ts (PresetExtraDef[]),
// resolved by presets/builder.ts into Extra[] via lib/types' own Extra
// interface. See seed/burgers.ts for the same note.
export type { Extra as SeedExtra } from "@/lib/types";
