// Default lexicon — plan "Diseño" §6. This IS today's hamburguesería
// vocabulary; the hamburguesería PresetDefinition supplies an empty/partial
// lexicon override (nothing to override, it already matches) while every
// other preset overrides `product` and usually `categoryLabels` too.
//
// A PresetDefinition only ever supplies a PARTIAL lexicon
// (Partial<PresetLexicon>); builder.ts merges it over this default so
// BusinessPreset.lexicon is always fully populated (types.ts's contract).

import type { LexiconGender, PresetLexicon } from "./types";

export const DEFAULT_LEXICON: PresetLexicon = {
  product: { singular: "hamburguesa", plural: "hamburguesas", gender: "f", emoji: "🍔" },
  mainComponent: { singular: "medallón", plural: "medallones", gender: "m", emoji: "🥩" },
  sideComponent: { singular: "papa frita", plural: "papas fritas", gender: "f", emoji: "🍟" },
  categoryLabels: {
    extra: "Extras",
    drink: "Bebidas",
    fries: "Papas",
    sides: "Acompañamientos",
  },
};

// Shallow-merges a partial lexicon over DEFAULT_LEXICON. `product`,
// `mainComponent`, `sideComponent` and `categoryLabels` are each replaced
// wholesale when present on the partial (not merged key-by-key) — a preset
// author overriding one of them always means "this business's noun for the
// concept", never "patch one field of it"; `categoryLabels`, if overridden,
// is expected to supply all four keys (preset-integrity check #9 enforces
// that on the OUTPUT, not the input).
export function mergeLexicon(partial: Partial<PresetLexicon> | undefined): PresetLexicon {
  return {
    product: partial?.product ?? DEFAULT_LEXICON.product,
    mainComponent: partial?.mainComponent ?? DEFAULT_LEXICON.mainComponent,
    sideComponent: partial?.sideComponent ?? DEFAULT_LEXICON.sideComponent,
    categoryLabels: partial?.categoryLabels ?? DEFAULT_LEXICON.categoryLabels,
  };
}

// Grammatical-gender agreement helper (plan "Diseño" §6): pick the form
// that agrees with a noun's gender, e.g.
// `${agree(lexicon.product.gender, "Nueva", "Nuevo")} ${lexicon.product.singular}`
// -> "Nueva hamburguesa" (f) / "Nuevo helado" (m).
export function agree(gender: LexiconGender, feminine: string, masculine: string): string {
  return gender === "f" ? feminine : masculine;
}

// Capitalizes only the first character — used where a lexicon noun (stored
// lowercase, for mid-sentence use) is rendered standalone as a heading/label.
export function capitalize(word: string): string {
  return word.length === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1);
}
