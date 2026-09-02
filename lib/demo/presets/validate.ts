// validatePreset(built): structural checks over an already-BUILT preset.
// Cheaper, non-throwing sibling of what preset-integrity.test.ts asserts —
// used by builder.ts in dev (console.warn, non-fatal) so an author sees a
// problem immediately instead of waiting for `npm run test`. Returns an
// array of human-readable issue strings; empty means clean.

import type { BusinessPreset } from "./types";

const SLOT_TYPE_TO_CATEGORY: Record<string, string> = {
  drink: "drink",
  fries: "fries",
  side: "sides",
  nuggets: "sides",
};

export function validatePreset(built: BusinessPreset): string[] {
  const issues: string[] = [];

  const supplyIds = new Set(built.supplies.map((s) => s.id));
  const extraIds = new Set(built.extras.map((e) => e.id));
  const slotsById = new Map(built.comboSlots.map((s) => [s.id, s]));

  // Recipe lines resolve to declared supplies.
  for (const line of built.burgerSupplies) {
    if (!supplyIds.has(line.supply_id)) {
      issues.push(`burger_supplies line references unknown supply_id ${line.supply_id}`);
    }
  }
  for (const line of built.extraSupplies) {
    if (!supplyIds.has(line.supply_id)) {
      issues.push(`extra_supplies line references unknown supply_id ${line.supply_id}`);
    }
  }

  // Combo slot rules resolve to extras matching the slot's category.
  for (const rule of built.comboSlotRules) {
    const slot = slotsById.get(rule.combo_slot_id);
    if (!slot) {
      issues.push(`combo_slots_rules row references unknown combo_slot_id ${rule.combo_slot_id}`);
      continue;
    }
    if (slot.slot_type === "burger") continue;
    const expectedCategory = SLOT_TYPE_TO_CATEGORY[slot.slot_type];
    const ids = rule.rule_value.split(",").filter(Boolean);
    if (ids.length === 0) {
      issues.push(`combo slot ${slot.id} (${slot.slot_type}) has no allowed extras`);
    }
    for (const id of ids) {
      const extra = built.extras.find((e) => e.id === id);
      if (!extra) {
        issues.push(`combo slot ${slot.id} rule references unknown extra id ${id}`);
      } else if (extra.category !== expectedCategory) {
        issues.push(
          `combo slot ${slot.id} (${slot.slot_type}) allows extra "${extra.name}" of category "${extra.category}", expected "${expectedCategory}"`
        );
      }
    }
  }

  // Roles.
  if (!built.roles.meatExtraId || !extraIds.has(built.roles.meatExtraId)) {
    issues.push("roles.meatExtraId is missing or does not resolve to a declared extra");
  }
  if (!built.roles.defaultSideExtraId || !extraIds.has(built.roles.defaultSideExtraId)) {
    issues.push("roles.defaultSideExtraId is missing or does not resolve to a declared extra");
  }

  // Ids unique within the preset.
  const allIds = [
    ...built.burgers.map((b) => b.id),
    ...built.extras.map((e) => e.id),
    ...built.supplies.map((s) => s.id),
    ...built.burgerSupplies.map((l) => l.id),
    ...built.extraSupplies.map((l) => l.id),
    ...built.combos.map((c) => c.id),
    ...built.comboSlots.map((s) => s.id),
  ];
  if (new Set(allIds).size !== allIds.length) {
    issues.push("duplicate ids found within the preset");
  }

  // Category coverage for combo slot alternatives.
  const byCategory = new Map<string, number>();
  for (const extra of built.extras) {
    byCategory.set(extra.category, (byCategory.get(extra.category) ?? 0) + 1);
  }
  for (const category of ["extra", "drink", "fries", "sides"]) {
    if (!byCategory.get(category)) issues.push(`category "${category}" has no extras`);
  }
  if ((byCategory.get("fries") ?? 0) < 2) issues.push('category "fries" has fewer than 2 extras');
  if ((byCategory.get("drink") ?? 0) < 3) issues.push('category "drink" has fewer than 3 extras');

  // Positive prices/costs.
  for (const burger of built.burgers) {
    if (!(burger.base_price > 0)) issues.push(`burger "${burger.name}" has base_price <= 0`);
  }
  for (const extra of built.extras) {
    if (!(extra.price > 0)) issues.push(`extra "${extra.name}" has price <= 0`);
  }
  for (const supply of built.supplies) {
    const cost = Number(supply.cost_per_unit);
    if (!(cost > 0) || !Number.isFinite(cost)) {
      issues.push(`supply "${supply.name}" has invalid cost_per_unit (${supply.cost_per_unit})`);
    }
  }
  for (const combo of built.combos) {
    if (!(combo.price > 0)) issues.push(`combo "${combo.name}" has price <= 0`);
  }

  return issues;
}
