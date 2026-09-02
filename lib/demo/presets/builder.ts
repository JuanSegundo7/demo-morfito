// buildPreset(def): resolves a PresetDefinition's symbolic keys into a
// concrete BusinessPreset — deterministic UUIDs, combo-slot rule_value CSVs,
// roles, purchasableSupplies, cost_per_unit derivation. See the presets
// plan, "Diseño" §1.

import {
  calculateCostPerUnitFromPackage,
  calculateCostPerUnitFromWeight,
} from "@/lib/utils/costing";
import type { Burger, BurgerSupply, Extra, ExtraCategory, ExtraSupply, Supply } from "@/lib/types";
import { mergeLexicon } from "./lexicon";
import { validatePreset } from "./validate";
import type {
  BusinessPreset,
  PresetComboSlot,
  PresetComboSlotRule,
  PresetComboSlotType,
  PresetCombo,
  PresetDefinition,
  PresetRecipeLineDef,
} from "./types";

const CREATED_AT = "2025-01-01T00:00:00Z";

// ─── Deterministic id minting ──────────────────────────────────────────────
//
// A PresetDefinition never writes a UUID (plan §1's central decision). Ids
// are minted from a stable hash of `presetId + kind + key`, so the same
// definition always produces the same ids (reproducible across builds/
// tests) while different presets/kinds/keys never collide (128 bits of
// hash, 4 independent 32-bit FNV-1a digests salted differently).

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function hex8(input: string): string {
  return fnv1a(input).toString(16).padStart(8, "0");
}

// Not a real (spec-compliant) UUID — just a deterministic, collision-safe,
// UUID-SHAPED string. Nothing in this codebase validates UUID format; ids
// are compared for equality only.
export function mintId(presetId: string, kind: string, key: string): string {
  const base = `${presetId}::${kind}::${key}`;
  const a = hex8(base + "#a");
  const b = hex8(base + "#b");
  const c = hex8(base + "#c");
  const d = hex8(base + "#d");
  return `${a}-${b.slice(0, 4)}-${b.slice(4, 8)}-${c.slice(0, 4)}-${c.slice(4, 8)}${d}`;
}

// ─── Supply cost derivation ────────────────────────────────────────────────
//
// PresetSupplyDef never states cost_per_unit — it's derived from the
// purchase inputs, matching lib/utils/costing.ts's own conversions exactly
// (calculateCostPerUnitFromPackage / calculateCostPerUnitFromWeight), so a
// preset author writes ONE number (purchase_price) instead of two that have
// to agree by hand.
function deriveCostPerUnit(def: {
  purchase_mode: Supply["purchase_mode"];
  purchase_price: number;
  purchase_units?: number | null;
  unit_weight_grams?: number | null;
}): number {
  switch (def.purchase_mode) {
    case "package": {
      const cost = calculateCostPerUnitFromPackage(def.purchase_price, def.purchase_units ?? 0);
      if (cost === null) {
        throw new Error(
          `Cannot derive cost_per_unit for a "package" supply: purchase_price=${def.purchase_price}, purchase_units=${def.purchase_units}`
        );
      }
      return cost;
    }
    case "weight": {
      const cost = calculateCostPerUnitFromWeight(def.purchase_price, def.unit_weight_grams ?? 0);
      if (cost === null) {
        throw new Error(
          `Cannot derive cost_per_unit for a "weight" supply: purchase_price=${def.purchase_price}, unit_weight_grams=${def.unit_weight_grams}`
        );
      }
      return cost;
    }
    case "unit":
    default:
      return def.purchase_price;
  }
}

// Slot type -> ExtraCategory, used to admit "every extra of the slot's
// category" when a combo slot omits `allow`, and to resolve `allow` keys.
// "burger" intentionally has no entry: burger slots are never
// extra-category-bound and never get a combo_slots_rules row (matches
// preset-integrity.test.ts's `slot.slot_type === "burger"` skip).
const SLOT_TYPE_TO_CATEGORY: Partial<Record<PresetComboSlotType, ExtraCategory>> = {
  drink: "drink",
  fries: "fries",
  side: "sides",
  nuggets: "sides",
};

export function buildPreset(def: PresetDefinition): BusinessPreset {
  const presetId = def.id;

  // ── Supplies ──────────────────────────────────────────────────────────
  const supplyIdByKey = new Map<string, string>();
  const supplies: Supply[] = def.supplies.map((s) => {
    const id = mintId(presetId, "supply", s.key);
    supplyIdByKey.set(s.key, id);
    return {
      id,
      name: s.name,
      unit: s.unit,
      cost_per_unit: deriveCostPerUnit(s),
      stock_quantity: s.stock_quantity,
      is_active: s.is_active ?? true,
      created_at: CREATED_AT,
      unit_weight_grams: s.unit_weight_grams ?? null,
      purchase_mode: s.purchase_mode,
      purchase_price: s.purchase_price,
      purchase_units: s.purchase_units ?? null,
    };
  });

  function resolveRecipeLines(
    lines: PresetRecipeLineDef[] | undefined,
    ownerKey: string,
    ownerKind: "burger" | "extra"
  ): { supply_id: string; quantity: number; scales_with?: PresetRecipeLineDef["scales_with"] }[] {
    if (!lines) return [];
    return lines.map((line) => {
      const supply_id = supplyIdByKey.get(line.supplyKey);
      if (!supply_id) {
        throw new Error(
          `Preset "${presetId}": ${ownerKind} "${ownerKey}" recipe references unknown supply key "${line.supplyKey}"`
        );
      }
      return { supply_id, quantity: line.quantity, scales_with: line.scales_with };
    });
  }

  // ── Products (burgers) + burger_supplies ────────────────────────────────
  const burgerIdByKey = new Map<string, string>();
  const burgers: Burger[] = def.products.map((p) => {
    const id = mintId(presetId, "burger", p.key);
    burgerIdByKey.set(p.key, id);
    return {
      id,
      name: p.name,
      description: p.description,
      base_price: p.base_price,
      ingredients: p.ingredients,
      is_available: p.is_available ?? true,
      image_url: null,
      default_meat_quantity: p.default_meat_quantity,
      default_fries_quantity: p.default_fries_quantity,
      created_at: CREATED_AT,
    };
  });

  const burgerSupplies: BurgerSupply[] = def.products.flatMap((p) => {
    const burger_id = burgerIdByKey.get(p.key)!;
    return resolveRecipeLines(p.recipe, p.key, "burger").map((line, idx) => ({
      id: mintId(presetId, "burger_supply", `${p.key}:${idx}`),
      burger_id,
      supply_id: line.supply_id,
      quantity: line.quantity,
      scales_with: line.scales_with ?? null,
      created_at: CREATED_AT,
    }));
  });

  // ── Extras + extra_supplies ─────────────────────────────────────────────
  const extraIdByKey = new Map<string, string>();
  const extras: Extra[] = def.extras.map((e) => {
    const id = mintId(presetId, "extra", e.key);
    extraIdByKey.set(e.key, id);
    return {
      id,
      name: e.name,
      category: e.category,
      price: e.price,
      is_available: e.is_available ?? true,
      created_at: CREATED_AT,
    };
  });

  const extraSupplies: ExtraSupply[] = def.extras.flatMap((e) => {
    const extra_id = extraIdByKey.get(e.key)!;
    return resolveRecipeLines(e.recipe, e.key, "extra").map((line, idx) => ({
      id: mintId(presetId, "extra_supply", `${e.key}:${idx}`),
      extra_id,
      supply_id: line.supply_id,
      quantity: line.quantity,
      created_at: CREATED_AT,
    }));
  });

  // ── Roles ────────────────────────────────────────────────────────────
  const meatUnitExtra = def.extras.find((e) => e.role === "meat-unit");
  const defaultSideExtra = def.extras.find((e) => e.role === "default-side");
  if (!meatUnitExtra) {
    throw new Error(`Preset "${presetId}": no extra declares role "meat-unit"`);
  }
  if (!defaultSideExtra) {
    throw new Error(`Preset "${presetId}": no extra declares role "default-side"`);
  }
  const roles = {
    meatExtraId: extraIdByKey.get(meatUnitExtra.key)!,
    defaultSideExtraId: extraIdByKey.get(defaultSideExtra.key)!,
  };

  // ── Combos / slots / rules ───────────────────────────────────────────
  let _ruleId = 1;
  const combos: PresetCombo[] = [];
  const comboSlots: PresetComboSlot[] = [];
  const comboSlotRules: PresetComboSlotRule[] = [];

  for (const c of def.combos) {
    const combo_id = mintId(presetId, "combo", c.key);
    combos.push({
      id: combo_id,
      name: c.name,
      description: c.description,
      price: c.price,
      is_available: true,
      created_at: CREATED_AT,
    });

    c.slots.forEach((slot, idx) => {
      const slot_id = mintId(presetId, "combo_slot", `${c.key}:${idx}`);
      comboSlots.push({
        id: slot_id,
        combo_id,
        slot_type: slot.slot_type,
        quantity: slot.quantity,
        required: slot.required,
        default_meat_quantity: slot.default_meat_quantity ?? null,
        created_at: CREATED_AT,
      });

      const category = SLOT_TYPE_TO_CATEGORY[slot.slot_type];
      if (!category) return; // "burger" slots never get a rule row

      const allowKeys =
        slot.allow ?? def.extras.filter((e) => e.category === category).map((e) => e.key);

      const ruleValue = allowKeys
        .map((key) => {
          const id = extraIdByKey.get(key);
          if (!id) {
            throw new Error(
              `Preset "${presetId}": combo "${c.key}" slot #${idx} allow references unknown extra key "${key}"`
            );
          }
          return id;
        })
        .join(",");

      comboSlotRules.push({
        id: _ruleId++,
        combo_slot_id: slot_id,
        rule_type: "allowed_ids",
        rule_value: ruleValue,
        created_at: CREATED_AT,
      });
    });
  }

  // ── purchasableSupplies ─────────────────────────────────────────────
  const purchasableSupplies = def.supplies
    .filter((s) => s.purchasable !== false)
    .map((s) => supplyIdByKey.get(s.key)!);

  const built: BusinessPreset = {
    id: presetId,
    label: def.label,
    lexicon: mergeLexicon(def.lexicon),
    burgers,
    extras,
    supplies,
    burgerSupplies,
    extraSupplies,
    combos,
    comboSlots,
    comboSlotRules,
    roles,
    purchasableSupplies,
    expenseDescriptions: def.expenseDescriptions ?? [],
    externalIncomeDescriptions: def.externalIncomeDescriptions ?? [],
  };

  // Dev-time sanity net — non-fatal. preset-integrity.test.ts is the real
  // gate; this just surfaces the same class of problem earlier, while
  // iterating on a definition.
  if (process.env.NODE_ENV !== "production") {
    const issues = validatePreset(built);
    if (issues.length > 0) {
      console.warn(`[presets] "${presetId}" has ${issues.length} validation issue(s):`, issues);
    }
  }

  return built;
}
