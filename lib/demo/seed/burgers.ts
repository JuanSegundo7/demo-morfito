// Type declaration only — Phase 1 moved the hamburguesería product data
// into lib/demo/presets/definitions/hamburgueseria.ts (PresetProductDef[]),
// resolved by presets/builder.ts into Burger[] via lib/types' own Burger
// interface. There is no separate "seed shape" for a burger — the DB shape
// IS the seed shape — so this file exists only as a documented pointer for
// anything that used to look here for SEED_BURGERS.
export type { Burger as SeedBurger } from "@/lib/types";
