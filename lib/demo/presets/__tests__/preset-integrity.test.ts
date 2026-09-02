// Phase 0 — "la red de seguridad primero" (see the presets plan, section
// "Secuencia / Fase 0"). This file WILL fail to import: it depends on
// `getAllBuiltPresets()` from ../registry, which does not exist until
// Phase 1 writes builder.ts + registry.ts. That failure is expected and
// correct — this test is the safety net Phase 1 has to earn its way past,
// not a test to make pass by stubbing the registry out.
//
// The 10 checks below are transcribed from the plan's Phase 0 bullet list,
// parameterized over every PresetId in ids.ts.

import { describe, expect, it } from "vitest";
import { calculateMakeableCount } from "@/lib/utils/costing";
import { PRESET_IDS } from "../ids";
import type { BusinessPreset } from "../types";
import { getAllBuiltPresets } from "../registry";

function presetById(id: string, presets: BusinessPreset[]): BusinessPreset {
  const preset = presets.find((p) => p.id === id);
  if (!preset) throw new Error(`No built preset found for id "${id}"`);
  return preset;
}

describe("preset integrity", () => {
  const presets: BusinessPreset[] = getAllBuiltPresets();

  it("builds exactly one preset per PRESET_IDS entry", () => {
    expect(presets.map((p) => p.id).sort()).toEqual([...PRESET_IDS].sort());
  });

  describe.each(PRESET_IDS)("%s", (presetId) => {
    function getPreset(): BusinessPreset {
      return presetById(presetId, presets);
    }

    // 1. Every recipe line resolves to a declared supply.
    it("every recipe line resolves to a declared supply", () => {
      const preset = getPreset();
      const supplyIds = new Set(preset.supplies.map((s) => s.id));

      for (const line of preset.burgerSupplies) {
        expect(supplyIds.has(line.supply_id), `burger_supplies line references unknown supply_id ${line.supply_id}`).toBe(true);
      }
      for (const line of preset.extraSupplies) {
        expect(supplyIds.has(line.supply_id), `extra_supplies line references unknown supply_id ${line.supply_id}`).toBe(true);
      }
    });

    // 2. Every `allow` key resolves to an extra whose category matches the
    // slot type it's attached to.
    it("every combo slot rule resolves to extras matching the slot's category", () => {
      const preset = getPreset();
      const extrasById = new Map(preset.extras.map((e) => [e.id, e]));
      const slotsById = new Map(preset.comboSlots.map((s) => [s.id, s]));

      const slotTypeToCategory: Record<string, string> = {
        drink: "drink",
        fries: "fries",
        side: "sides",
        nuggets: "sides",
      };

      for (const rule of preset.comboSlotRules) {
        const slot = slotsById.get(rule.combo_slot_id);
        expect(slot, `rule references unknown combo_slot_id ${rule.combo_slot_id}`).toBeDefined();
        if (!slot || slot.slot_type === "burger") continue; // burger slots aren't extra-category-bound

        const expectedCategory = slotTypeToCategory[slot.slot_type];
        const ids = rule.rule_value.split(",").filter(Boolean);
        expect(ids.length, `rule for slot ${slot.id} has no allowed extras`).toBeGreaterThan(0);

        for (const extraId of ids) {
          const extra = extrasById.get(extraId);
          expect(extra, `rule references unknown extra id ${extraId}`).toBeDefined();
          if (extra) {
            expect(extra.category, `extra "${extra.name}" (${extra.category}) doesn't match slot type "${slot.slot_type}"`).toBe(
              expectedCategory
            );
          }
        }
      }
    });

    // 3. Exactly one extra with role meat-unit and one with default-side —
    // via BusinessPreset.roles, which builder.ts must resolve to exactly
    // one id each.
    it("has exactly one meat-unit role and one default-side role", () => {
      const preset = getPreset();
      expect(preset.roles.meatExtraId).toBeTruthy();
      expect(preset.roles.defaultSideExtraId).toBeTruthy();

      const extraIds = new Set(preset.extras.map((e) => e.id));
      expect(extraIds.has(preset.roles.meatExtraId)).toBe(true);
      expect(extraIds.has(preset.roles.defaultSideExtraId)).toBe(true);
    });

    // 4. At least one product with no recipe at all — preserves
    // summarizeRecipes()'s "sin receta" counter.
    it("has at least one product without a recipe", () => {
      const preset = getPreset();
      const recipeCountByBurgerId = new Map<string, number>();
      for (const line of preset.burgerSupplies) {
        recipeCountByBurgerId.set(line.burger_id, (recipeCountByBurgerId.get(line.burger_id) ?? 0) + 1);
      }
      const withoutRecipe = preset.burgers.filter((b) => !recipeCountByBurgerId.has(b.id));
      expect(withoutRecipe.length).toBeGreaterThanOrEqual(1);
    });

    // 5. At least one product with mainQty >= 2 and a "meat"-scaled line —
    // preserves the /costos scaling demo (0.18 × 2 = 0.36).
    it("has at least one product with default_meat_quantity >= 2 and a meat-scaled line", () => {
      const preset = getPreset();
      const meatScaledBurgerIds = new Set(
        preset.burgerSupplies.filter((l) => l.scales_with === "meat").map((l) => l.burger_id)
      );
      const qualifies = preset.burgers.some(
        (b) => b.default_meat_quantity >= 2 && meatScaledBurgerIds.has(b.id)
      );
      expect(qualifies).toBe(true);
    });

    // 6. calculateMakeableCount() over the BUILT preset gives a value in
    // [1, 30] for at least one product — the real, computed assertion, not
    // a `lowStock` flag. Protects the deliberate low-stock rows.
    it("calculateMakeableCount() reports a value in [1, 30] for at least one product", () => {
      const preset = getPreset();
      const suppliesById = new Map(preset.supplies.map((s) => [s.id, s]));

      const inRangeForAtLeastOneProduct = preset.burgers.some((burger) => {
        const lines = preset.burgerSupplies
          .filter((l) => l.burger_id === burger.id)
          .map((l) => {
            const supply = suppliesById.get(l.supply_id);
            if (!supply) throw new Error(`Missing supply ${l.supply_id} for burger ${burger.id}`);
            return { quantity: l.quantity, supply: { id: supply.id, stock_quantity: supply.stock_quantity } };
          });
        if (lines.length === 0) return false;
        const { count } = calculateMakeableCount(lines);
        return count !== null && count >= 1 && count <= 30;
      });

      expect(inRangeForAtLeastOneProduct).toBe(true);
    });

    // 7. Ids unique within the preset (checked here) and across presets
    // (checked once, outside this describe.each, below).
    it("has unique ids within the preset", () => {
      const preset = getPreset();
      const allIds = [
        ...preset.burgers.map((b) => b.id),
        ...preset.extras.map((e) => e.id),
        ...preset.supplies.map((s) => s.id),
        ...preset.burgerSupplies.map((l) => l.id),
        ...preset.extraSupplies.map((l) => l.id),
        ...preset.combos.map((c) => c.id),
        ...preset.comboSlots.map((s) => s.id),
      ];
      expect(new Set(allIds).size).toBe(allIds.length);
    });

    // 8. Every ExtraCategory has >= 1 row; fries >= 2 and drink >= 3 (slots
    // need alternatives to offer).
    it("has enough extras per category for combo slot alternatives", () => {
      const preset = getPreset();
      const byCategory = new Map<string, number>();
      for (const extra of preset.extras) {
        byCategory.set(extra.category, (byCategory.get(extra.category) ?? 0) + 1);
      }

      for (const category of ["extra", "drink", "fries", "sides"] as const) {
        expect(byCategory.get(category) ?? 0, `category "${category}" has no extras`).toBeGreaterThanOrEqual(1);
      }
      expect(byCategory.get("fries") ?? 0).toBeGreaterThanOrEqual(2);
      expect(byCategory.get("drink") ?? 0).toBeGreaterThanOrEqual(3);
    });

    // 9. Lexicon is complete after merging with the default.
    it("has a complete lexicon after merging with the default", () => {
      const preset = getPreset();
      expect(preset.lexicon.product.singular).toBeTruthy();
      expect(preset.lexicon.product.plural).toBeTruthy();
      expect(["f", "m"]).toContain(preset.lexicon.product.gender);
      for (const category of ["extra", "drink", "fries", "sides"] as const) {
        expect(preset.lexicon.categoryLabels[category]).toBeTruthy();
      }
    });

    // 10. Every price and cost_per_unit > 0 — catches a purchase.units typo
    // that would produce Infinity.
    it("has strictly positive prices and costs everywhere", () => {
      const preset = getPreset();
      for (const burger of preset.burgers) {
        expect(burger.base_price, `burger "${burger.name}" has base_price <= 0`).toBeGreaterThan(0);
      }
      for (const extra of preset.extras) {
        expect(extra.price, `extra "${extra.name}" has price <= 0`).toBeGreaterThan(0);
      }
      for (const supply of preset.supplies) {
        expect(Number(supply.cost_per_unit), `supply "${supply.name}" has cost_per_unit <= 0`).toBeGreaterThan(0);
        expect(Number.isFinite(Number(supply.cost_per_unit)), `supply "${supply.name}" has non-finite cost_per_unit`).toBe(true);
      }
      for (const combo of preset.combos) {
        expect(combo.price, `combo "${combo.name}" has price <= 0`).toBeGreaterThan(0);
      }
    });
  });

  // 7 (cross-preset half). Ids unique ACROSS presets — a naming collision
  // between two presets' builders would otherwise silently merge data on
  // reseed().
  it("has unique ids across every preset", () => {
    const allIds = presets.flatMap((preset) => [
      ...preset.burgers.map((b) => b.id),
      ...preset.extras.map((e) => e.id),
      ...preset.supplies.map((s) => s.id),
      ...preset.burgerSupplies.map((l) => l.id),
      ...preset.extraSupplies.map((l) => l.id),
      ...preset.combos.map((c) => c.id),
      ...preset.comboSlots.map((s) => s.id),
    ]);
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
