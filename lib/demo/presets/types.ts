// PresetDefinition (what a preset author writes) and BusinessPreset (what
// builder.ts produces from it) — see "Diseño" sections 1 and 2 in the
// presets plan.
//
// PHASE 0 NOTE: this file is a skeleton. builder.ts, validate.ts,
// registry.ts and definitions/*.ts do not exist yet (Phase 1). The shapes
// below are the contract Phase 1 builds against; preset-integrity.test.ts
// and hamburgueseria-golden.test.ts are written against them.
//
// Central decision (plan, "Diseño" §1): a PresetDefinition never writes a
// UUID. Every product/extra/supply/combo declares a symbolic `key`, and
// recipes/combo-slot `allow` lists reference those keys. builder.ts mints
// deterministic UUIDs from the keys. This is what kills the positional
// destructuring in the old seed/recipes.ts and the raw-UUID CSV in
// seed/combos.ts's rule_value.

import type {
  BurgerSupply,
  Extra,
  ExtraCategory,
  ExtraSupply,
  Burger,
  RecipeScaling,
  Supply,
  SupplyPurchaseMode,
} from "@/lib/types";
import type { PresetId } from "./ids";

// ─── Lexicon ────────────────────────────────────────────────────────────
//
// Plan "Diseño" §6: grammatical gender matters ("Nueva hamburguesa" vs
// "Nueva helado" is wrong). A PresetDefinition supplies a PARTIAL lexicon
// (~5-6 overrides); the rest falls back to lexicon.ts's DEFAULT_LEXICON
// (not built in Phase 0). categoryLabels unifies the three duplicated
// copies in extras/page.tsx, precios/page.tsx and costos/recipes-tab.tsx —
// note ExtraCategory has 4 members ("extra" | "drink" | "fries" | "sides"),
// which is the bug precios/page.tsx:19 gets wrong today (invented "combo"
// key, missing "sides") — see Phase 0 report / engram for details. That fix
// is Phase 2 territory (plan §"Secuencia"), not Phase 0.

export type LexiconGender = "f" | "m";

export interface LexiconNounEntry {
  singular: string;
  plural: string;
  gender: LexiconGender;
  // Optional — only the handful of nouns actually rendered next to an
  // emoji (menu/rendimiento stat tiles) declare one; DEFAULT_LEXICON's
  // three entries all do since today's UI happens to show all three.
  emoji?: string;
}

export interface PresetLexicon {
  // The main product noun ("hamburguesa" / "pizza" / "helado" / ...), used
  // in copy like "Nueva {noun}" / "primera {noun}" / "No hay {nouns}"
  // (app/(dashboard)/menu/page.tsx).
  product: LexiconNounEntry;
  // The noun for the extra tagged role "meat-unit" (roles.meatExtraId) —
  // "medallón"/"medallones" today. Phase 2 sites: edit-recipe-dialog.tsx's
  // scaling labels, burger-item-card.tsx's meat-count heading,
  // rendimiento/page.tsx's stat tile, order-wizard summary diff lines.
  mainComponent: LexiconNounEntry;
  // The noun for the extra tagged role "default-side" (roles.defaultSideExtraId)
  // — "papa frita"/"papas fritas" today. Same call sites as mainComponent's
  // sibling headings/labels.
  sideComponent: LexiconNounEntry;
  // Replaces the three ad-hoc `categoryLabels` maps.
  categoryLabels: Record<ExtraCategory, string>;
}

// ─── Recipes (inline in the product/extra definition) ──────────────────
//
// Plan "Diseño" §1: recipes live INLINE in the product, not in a sibling
// file — seed/recipes.ts is deleted in Phase 1, not ported.

export interface PresetRecipeLineDef {
  // References a PresetSupplyDef.key declared in the same PresetDefinition.
  supplyKey: string;
  quantity: number;
  // See lib/utils/costing.ts scalingFactor(): "meat" multiplies by the
  // product's default_meat_quantity, "fries" by default_fries_quantity.
  // Omit/null for a fixed-quantity line.
  scales_with?: RecipeScaling | null;
}

// ─── Products ────────────────────────────────────────────────────────────

export interface PresetProductDef {
  key: string;
  name: string;
  description: string | null;
  base_price: number;
  ingredients: string[];
  is_available?: boolean; // defaults to true in the builder
  default_meat_quantity: number;
  default_fries_quantity: number;
  // Omitting this entirely (undefined, not []) is what preserves
  // summarizeRecipes().withoutRecipeCount — check #4 in preset-integrity.
  recipe?: PresetRecipeLineDef[];
}

// ─── Extras ──────────────────────────────────────────────────────────────

// The role replacement for order-wizard-drawer.tsx's name lookups
// (`extras?.find((e) => e.name === "Medallón")` etc. — plan's "riesgo que
// manda sobre todo el diseño"). Exactly one extra per preset must declare
// each role (preset-integrity check #3).
export type PresetExtraRole = "meat-unit" | "default-side";

export interface PresetExtraDef {
  key: string;
  name: string;
  category: ExtraCategory;
  price: number;
  is_available?: boolean;
  role?: PresetExtraRole;
  // Extras can have a recipe too (e.g. papas fritas -> papas + aceite).
  recipe?: PresetRecipeLineDef[];
}

// ─── Supplies ──────────────────────────────────────────────────────────────

export interface PresetSupplyDef {
  key: string;
  name: string;
  unit: string;
  stock_quantity: number;
  is_active?: boolean;
  unit_weight_grams?: number | null;
  purchase_mode: SupplyPurchaseMode;
  purchase_price: number;
  purchase_units?: number | null;
  // Feeds BusinessPreset.purchasableSupplies (plan §1: "purchasableSupplies
  // derivado de un flag en los insumos") — replaces seed/expenses.ts's
  // hand-copied PURCHASABLE_SUPPLIES array.
  purchasable?: boolean;
}

// ─── Combos ──────────────────────────────────────────────────────────────
//
// These mirror lib/demo/seed/combos.ts's SeedCombo/SeedComboSlot/
// SeedComboSlotRule shapes (kept local here, not imported, so presets/
// stays decoupled from lib/demo/seed/ — Phase 1 owns reconciling the two).

export type PresetComboSlotType = "burger" | "drink" | "side" | "fries" | "nuggets";

export interface PresetComboSlotDef {
  slot_type: PresetComboSlotType;
  quantity: number;
  required: boolean;
  default_meat_quantity?: number | null;
  // Extra keys allowed in this slot. Omitting `allow` entirely admits every
  // extra of the slot's matching category (plan §1's "detalle que abarata
  // mucho") — the 6 hand-written rules in today's seed/combos.ts disappear.
  allow?: string[];
}

export interface PresetComboDef {
  key: string;
  name: string;
  description: string | null;
  price: number;
  slots: PresetComboSlotDef[];
}

// ─── The definition (authored) ──────────────────────────────────────────

export interface PresetDefinition {
  id: PresetId;
  label: string;
  lexicon: Partial<PresetLexicon>;
  products: PresetProductDef[];
  extras: PresetExtraDef[];
  supplies: PresetSupplyDef[];
  combos: PresetComboDef[];
  // Restock purchase descriptions (5-7) — plan §2, "por preset".
  expenseDescriptions?: string[];
  // Optional external-income descriptions — plan §2 marks these optional.
  externalIncomeDescriptions?: string[];
}

// ─── The built preset (what builder.ts produces) ────────────────────────
//
// Plain data in the exact shapes the existing seed generators / hooks
// already consume (Burger, Extra, Supply, BurgerSupply, ExtraSupply from
// lib/types; combo shapes local to this file) — so Phase 1's generators can
// hand these arrays straight to the store without another translation
// layer.

export interface PresetCombo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  created_at: string;
}

export interface PresetComboSlot {
  id: string;
  combo_id: string;
  slot_type: PresetComboSlotType;
  quantity: number;
  required: boolean;
  default_meat_quantity: number | null;
  created_at: string;
}

export interface PresetComboSlotRule {
  id: number;
  combo_slot_id: string;
  rule_type: string;
  // Comma-separated resolved extra UUIDs — kept as a string to match
  // use-combos.ts's `rule_value.split(",")` consumer. Built from `allow`
  // keys (or, when `allow` is omitted, every extra of the slot's category).
  rule_value: string;
  created_at: string;
}

export interface BusinessPreset {
  id: PresetId;
  label: string;
  // Fully merged with lexicon.ts's DEFAULT_LEXICON — never partial.
  lexicon: PresetLexicon;

  burgers: Burger[];
  extras: Extra[];
  supplies: Supply[];
  burgerSupplies: BurgerSupply[];
  extraSupplies: ExtraSupply[];

  combos: PresetCombo[];
  comboSlots: PresetComboSlot[];
  comboSlotRules: PresetComboSlotRule[];

  // Replaces order-wizard-drawer.tsx:64-72's and burger-item-card.tsx:329's
  // name-based lookups. Resolved from the extra(s) declaring `role` in the
  // definition — see PresetExtraRole above.
  roles: {
    meatExtraId: string;
    defaultSideExtraId: string;
  };

  // Supply ids with `purchasable: true` in their PresetSupplyDef — replaces
  // seed/expenses.ts's hand-copied PURCHASABLE_SUPPLIES array.
  purchasableSupplies: string[];

  expenseDescriptions: string[];
  externalIncomeDescriptions: string[];
}
