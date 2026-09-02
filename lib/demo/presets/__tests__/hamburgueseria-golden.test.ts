// Golden test for the hamburguesería preset (plan, "Secuencia / Fase 0",
// last bullet): "el preset construido debe reproducir los datos de hoy...
// Este test es lo que hace la fase 1 demostrablemente inocua."
//
// Expected values below are a FROZEN transcription of today's
// lib/demo/seed/{burgers,extras,supplies,recipes,combos}.ts — captured by
// hand from those files as of Phase 0, not imported from them. That's
// deliberate: Phase 1 deletes seed/recipes.ts and guts burgers.ts/extras.ts
// /combos.ts down to type declarations, so this file cannot depend on those
// arrays surviving. Assertions are on names/prices/quantities/scales_with,
// never on ids — ids may change freely once presets exist (plan §1).
//
import { describe, expect, it } from "vitest";
import type { BusinessPreset } from "../types";
import { getAllBuiltPresets } from "../registry";

function getHamburgueseria(): BusinessPreset {
  const presets: BusinessPreset[] = getAllBuiltPresets();
  const preset = presets.find((p) => p.id === "hamburgueseria");
  if (!preset) throw new Error('No built preset found for id "hamburgueseria"');
  return preset;
}

// ─── Golden fixtures (frozen from today's seed/*.ts) ────────────────────

const GOLDEN_BURGERS: { name: string; base_price: number; default_meat_quantity: number; default_fries_quantity: number }[] = [
  { name: "Clásica", base_price: 4500, default_meat_quantity: 1, default_fries_quantity: 1 },
  { name: "Cheese", base_price: 4900, default_meat_quantity: 1, default_fries_quantity: 1 },
  { name: "Bacon", base_price: 5500, default_meat_quantity: 1, default_fries_quantity: 1 },
  { name: "BBQ", base_price: 5200, default_meat_quantity: 1, default_fries_quantity: 1 },
  { name: "Doble Clásica", base_price: 6800, default_meat_quantity: 2, default_fries_quantity: 1 },
  { name: "Doble Cheese Bacon", base_price: 7800, default_meat_quantity: 2, default_fries_quantity: 1 },
  { name: "Crispy Chicken", base_price: 5000, default_meat_quantity: 1, default_fries_quantity: 1 },
  { name: "Veggie", base_price: 4800, default_meat_quantity: 1, default_fries_quantity: 1 }, // deliberately no recipe
];

const GOLDEN_EXTRAS: { name: string; category: string; price: number }[] = [
  { name: "Medallón", category: "extra", price: 1500 }, // role: meat-unit
  { name: "Queso cheddar extra", category: "extra", price: 600 },
  { name: "Panceta", category: "extra", price: 800 },
  { name: "Huevo frito", category: "extra", price: 500 },
  { name: "Cebolla caramelizada", category: "extra", price: 400 },
  { name: "Jalapeños", category: "extra", price: 350 },
  { name: "Coca-Cola 500ml", category: "drink", price: 1200 },
  { name: "Sprite 500ml", category: "drink", price: 1200 },
  { name: "Fanta 500ml", category: "drink", price: 1200 },
  { name: "Agua mineral 500ml", category: "drink", price: 800 },
  { name: "Limonada", category: "drink", price: 1400 },
  { name: "Papas fritas chicas", category: "fries", price: 1200 }, // role: default-side
  { name: "Papas fritas grandes", category: "fries", price: 1800 },
  { name: "Papas con cheddar", category: "fries", price: 2400 },
  { name: "Papas con bacon y cheddar", category: "fries", price: 2900 },
  { name: "Papas rústicas", category: "fries", price: 2100 },
  { name: "Aros de cebolla", category: "sides", price: 1800 },
  { name: "Nuggets x6", category: "sides", price: 2200 },
];

const GOLDEN_EXTRA_CATEGORY_COUNTS: Record<string, number> = {
  extra: 6,
  drink: 5,
  fries: 5,
  sides: 2,
};

const GOLDEN_SUPPLY_NAMES_WITH_COST: { name: string; cost_per_unit: number; stock_quantity: number }[] = [
  { name: "Medallón de carne", cost_per_unit: 936, stock_quantity: 340 },
  { name: "Pan brioche", cost_per_unit: 300, stock_quantity: 260 },
  { name: "Pan integral", cost_per_unit: 420, stock_quantity: 40 },
  { name: "Lechuga", cost_per_unit: 1200, stock_quantity: 8.5 },
  { name: "Tomate", cost_per_unit: 1100, stock_quantity: 12 },
  { name: "Cebolla", cost_per_unit: 900, stock_quantity: 15 },
  { name: "Cebolla morada", cost_per_unit: 1300, stock_quantity: 6 },
  { name: "Queso cheddar", cost_per_unit: 45, stock_quantity: 480 },
  { name: "Panceta", cost_per_unit: 3.8, stock_quantity: 180 }, // deliberate low stock
  { name: "Salsa BBQ", cost_per_unit: 2.2, stock_quantity: 100 }, // deliberate low stock
  { name: "Cebolla caramelizada", cost_per_unit: 1.5, stock_quantity: 90 }, // deliberate low stock
  { name: "Medallón de pollo", cost_per_unit: 720, stock_quantity: 150 },
  { name: "Mayonesa de la casa", cost_per_unit: 3.6, stock_quantity: 12000 },
  { name: "Medallón vegetal", cost_per_unit: 512, stock_quantity: 60 },
  { name: "Guacamole", cost_per_unit: 3.5, stock_quantity: 9000 },
  { name: "Papas para freír", cost_per_unit: 950, stock_quantity: 90 },
  { name: "Aceite de fritura", cost_per_unit: 1400, stock_quantity: 40 },
  { name: "Gaseosa (bidón)", cost_per_unit: 900, stock_quantity: 150 },
  { name: "Aros de cebolla (pre-hecho)", cost_per_unit: 90, stock_quantity: 900 },
  { name: "Nuggets de pollo", cost_per_unit: 60, stock_quantity: 1100 },
];

// name -> number of recipe lines, per today's seed/recipes.ts
// (Veggie deliberately has 0, drinks deliberately have none listed here).
const GOLDEN_BURGER_RECIPE_LINE_COUNTS: Record<string, number> = {
  "Clásica": 5,
  "Cheese": 5,
  "Bacon": 6,
  "BBQ": 5,
  "Doble Clásica": 5,
  "Doble Cheese Bacon": 6,
  "Crispy Chicken": 5,
  "Veggie": 0,
};

const GOLDEN_COMBOS: { name: string; price: number; description: string | null; slotCount: number }[] = [
  { name: "Combo Clásico", price: 7500, description: "Burger a elección + papas fritas chicas + bebida", slotCount: 3 },
  { name: "Combo Familiar", price: 14500, description: "2 burgers a elección + papas grandes + 2 bebidas", slotCount: 3 },
  { name: "Combo Premium", price: 9200, description: "Burger especial + papas con cheddar + bebida", slotCount: 3 },
];

describe("hamburguesería golden preset", () => {
  const preset = getHamburgueseria();

  it("has 8 products matching today's names, prices and meat/fries defaults", () => {
    expect(preset.burgers).toHaveLength(8);
    const actual = preset.burgers
      .map((b) => ({
        name: b.name,
        base_price: b.base_price,
        default_meat_quantity: b.default_meat_quantity,
        default_fries_quantity: b.default_fries_quantity,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const expected = [...GOLDEN_BURGERS].sort((a, b) => a.name.localeCompare(b.name));
    expect(actual).toEqual(expected);
  });

  it("has 18 extras matching today's names, categories and prices", () => {
    expect(preset.extras).toHaveLength(18);
    const actual = preset.extras
      .map((e) => ({ name: e.name, category: e.category, price: e.price }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const expected = [...GOLDEN_EXTRAS].sort((a, b) => a.name.localeCompare(b.name));
    expect(actual).toEqual(expected);

    const byCategory: Record<string, number> = {};
    for (const e of preset.extras) byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;
    expect(byCategory).toEqual(GOLDEN_EXTRA_CATEGORY_COUNTS);
  });

  it("has 20 supplies matching today's names, costs and stock", () => {
    expect(preset.supplies).toHaveLength(20);
    const actual = preset.supplies
      .map((s) => ({ name: s.name, cost_per_unit: Number(s.cost_per_unit), stock_quantity: Number(s.stock_quantity) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const expected = [...GOLDEN_SUPPLY_NAMES_WITH_COST].sort((a, b) => a.name.localeCompare(b.name));
    expect(actual).toEqual(expected);
  });

  it("has 37 burger-recipe lines distributed as today (Veggie has none)", () => {
    expect(preset.burgerSupplies).toHaveLength(37);

    const burgersByName = new Map(preset.burgers.map((b) => [b.id, b.name]));
    const countsByName: Record<string, number> = {};
    for (const b of preset.burgers) countsByName[b.name] = 0;
    for (const line of preset.burgerSupplies) {
      const name = burgersByName.get(line.burger_id);
      if (name) countsByName[name] = (countsByName[name] ?? 0) + 1;
    }
    expect(countsByName).toEqual(GOLDEN_BURGER_RECIPE_LINE_COUNTS);
  });

  it("has 7 extra-recipe lines", () => {
    expect(preset.extraSupplies).toHaveLength(7);
  });

  it("scales the meat line with quantity >= 2 for the doble products (the /costos scaling demo)", () => {
    const dobles = preset.burgers.filter((b) => b.name.startsWith("Doble"));
    expect(dobles).toHaveLength(2);
    for (const doble of dobles) {
      expect(doble.default_meat_quantity).toBeGreaterThanOrEqual(2);
      const meatLine = preset.burgerSupplies.find((l) => l.burger_id === doble.id && l.scales_with === "meat");
      expect(meatLine, `no meat-scaled line for "${doble.name}"`).toBeDefined();
    }
  });

  it("has exactly one meat-unit role resolving to the extra named 'Medallón'", () => {
    const meatExtra = preset.extras.find((e) => e.id === preset.roles.meatExtraId);
    expect(meatExtra?.name).toBe("Medallón");
  });

  it("has exactly one default-side role resolving to the extra named 'Papas fritas chicas'", () => {
    const sideExtra = preset.extras.find((e) => e.id === preset.roles.defaultSideExtraId);
    expect(sideExtra?.name).toBe("Papas fritas chicas");
  });

  it("has 3 combos / 9 slots / 6 rules matching today's names, prices and quantities", () => {
    expect(preset.combos).toHaveLength(3);
    expect(preset.comboSlots).toHaveLength(9);
    expect(preset.comboSlotRules).toHaveLength(6);

    const actual = preset.combos
      .map((c) => {
        const slotCount = preset.comboSlots.filter((s) => s.combo_id === c.id).length;
        return { name: c.name, price: c.price, description: c.description, slotCount };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    const expected = [...GOLDEN_COMBOS].sort((a, b) => a.name.localeCompare(b.name));
    expect(actual).toEqual(expected);
  });

  it("gives the Combo Familiar 2 burger slots and 2 drink slots (only golden combo with quantity > 1)", () => {
    const familiar = preset.combos.find((c) => c.name === "Combo Familiar");
    expect(familiar).toBeDefined();
    const slots = preset.comboSlots.filter((s) => s.combo_id === familiar!.id);
    const burgerSlot = slots.find((s) => s.slot_type === "burger");
    const drinkSlot = slots.find((s) => s.slot_type === "drink");
    expect(burgerSlot?.quantity).toBe(2);
    expect(drinkSlot?.quantity).toBe(2);
  });
});
