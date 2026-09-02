// Heladería preset definition — Phase 4, third real vertical (plan §"Secuencia
// / Fase 4", following pizzeria.ts and cafeteria.ts as templates). Authored
// from scratch, same calibration discipline as its two predecessors.
//
// Price calibration (deliberate, not a mistake): real 2026 heladería prices
// run far higher than this file uses. Scaling to real-world pesos would look
// absurd next to the shared salary/rent figures in ../shared.ts, which are
// calibrated to hamburguesería's compressed price universe (burgers
// $4,500-$7,800, extras $350-$2,900, supply costs ~$900-$5,200/kg-
// equivalent). Every number here stays inside that same band: a 1/2kg pote
// lands in burger territory ($3,500-$6,500), a 1/4kg pote scales down
// ($1,800-$2,800), and topping/extra items sit in the $300-$1,000 band.
//
// DOMAIN MAPPING (plan §5's risk analysis names heladería explicitly: "1/4kg
// vs 1/2kg"): products are modeled as POTES DE HELADO BY WEIGHT, not one
// product per flavor (that would need dozens). The "meat" multiplier maps to
// PORTION SIZE via a shared "bocha" (scoop) recipe line: every pote's
// base-crema line carries `scales_with: "meat"` at a fixed base of 2 bochas,
// and `default_meat_quantity` does the sizing —
//   Pote 1/4kg: default_meat_quantity 1 -> effective 2 bochas
//   Pote 1/2kg: default_meat_quantity 2 -> effective 4 bochas (double)
//   Pote 1kg:   default_meat_quantity 4 -> effective 8 bochas (quadruple)
// — a clean, literal "1/4kg vs 1/2kg vs 1kg" scaling ladder using the exact
// mechanism the plan calls out, and the same "con muzza/shot extra" upsell
// shape as pizzería/cafetería (see extras: "Bocha extra", role "meat-unit").
// The "fries" multiplier maps to a topping/cobertura accompaniment; see the
// role: "default-side" extra below (categoryLabels.fries relabeled
// "Coberturas" — the ExtraCategory union value itself stays "fries", frozen
// at the type layer, only its label changes).

import type { PresetDefinition } from "../types";

export const HELADERIA_DEFINITION: PresetDefinition = {
  id: "heladeria",
  label: "Heladería",

  lexicon: {
    product: { singular: "helado", plural: "helados", gender: "m", emoji: "🍦" },
    // The role: "meat-unit" extra is "Bocha extra" — this noun is what
    // edit-recipe-dialog.tsx / burger-item-card.tsx / the wizard summary
    // render next to the scoop-count scaling control.
    mainComponent: { singular: "bocha", plural: "bochas", gender: "f", emoji: "🍨" },
    // The role: "default-side" extra is "Cobertura de chocolate".
    sideComponent: { singular: "cobertura", plural: "coberturas", gender: "f", emoji: "🍫" },
    categoryLabels: {
      extra: "Extras",
      drink: "Bebidas",
      fries: "Coberturas",
      sides: "Para compartir",
    },
  },

  // ── Products ────────────────────────────────────────────────────────
  // Three pote sizes (the meat-scaling ladder) + four fixed specialty
  // items, same 7-item count discipline as pizzería's 8 / cafetería's 8.
  products: [
    {
      key: "pote-cuarto",
      name: "Pote 1/4kg (hasta 2 gustos)",
      description: "Un cuarto kilo de helado, a elección entre dos gustos",
      base_price: 2200,
      ingredients: ["Base de crema", "Saborizante a elección"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "base-crema", quantity: 2, scales_with: "meat" },
        { supplyKey: "potes-descartables-cuarto", quantity: 1 },
        { supplyKey: "azucar", quantity: 0.02 },
      ],
    },
    {
      key: "pote-medio",
      name: "Pote 1/2kg (hasta 3 gustos)",
      description: "Medio kilo de helado, a elección entre tres gustos",
      base_price: 4500,
      ingredients: ["Base de crema", "Saborizantes a elección"],
      default_meat_quantity: 2,
      default_fries_quantity: 1,
      // Same base-crema line as Pote 1/4kg — doubles automatically via
      // scales_with: "meat" x default_meat_quantity: 2
      // (resolveRecipeQuantities). This is the literal "1/4kg vs 1/2kg"
      // scaling the plan's risk analysis calls for.
      recipe: [
        { supplyKey: "base-crema", quantity: 2, scales_with: "meat" },
        { supplyKey: "potes-descartables-medio", quantity: 1 },
        { supplyKey: "saborizante-chocolate", quantity: 25 },
        { supplyKey: "saborizante-frutilla", quantity: 20 },
      ],
    },
    {
      key: "pote-kilo",
      name: "Pote 1kg Familiar (hasta 4 gustos)",
      description: "Un kilo de helado familiar, a elección entre cuatro gustos",
      base_price: 8200,
      ingredients: ["Base de crema", "Saborizantes a elección"],
      default_meat_quantity: 4,
      default_fries_quantity: 1,
      // Same base-crema line again — quadruples via
      // scales_with: "meat" x default_meat_quantity: 4. Together with Pote
      // 1/4kg and Pote 1/2kg this is the full sizing ladder (2/4/8 bochas).
      recipe: [
        { supplyKey: "base-crema", quantity: 2, scales_with: "meat" },
        { supplyKey: "potes-descartables-kilo", quantity: 1 },
        { supplyKey: "saborizante-dulce-de-leche", quantity: 40 },
        { supplyKey: "saborizante-vainilla", quantity: 35 },
        { supplyKey: "saborizante-chocolate", quantity: 35 },
      ],
    },
    {
      key: "cucurucho-simple",
      name: "Cucurucho (1 bocha)",
      description: "Una bocha de helado a elección, servida en cucurucho crocante",
      base_price: 1400,
      ingredients: ["Base de crema", "Cucurucho"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // Fixed at 1 bocha always — no scales_with, unlike the pote sizes.
      recipe: [
        { supplyKey: "base-crema", quantity: 1 },
        { supplyKey: "conos", quantity: 1 },
      ],
    },
    {
      key: "copa-brownie",
      name: "Copa Brownie",
      description: "Brownie tibio, dos bochas de helado, cobertura y crema chantilly",
      base_price: 5800,
      ingredients: ["Brownie", "Base de crema", "Cobertura de chocolate", "Crema chantilly"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "base-crema", quantity: 2, scales_with: "meat" },
        { supplyKey: "brownie", quantity: 1 },
        { supplyKey: "cobertura-chocolate", quantity: 0.05 },
        { supplyKey: "crema-chantilly", quantity: 15 },
      ],
    },
    {
      key: "banana-split",
      name: "Banana Split",
      description: "Banana, tres bochas de helado, cobertura de chocolate y crema chantilly",
      base_price: 6200,
      ingredients: ["Banana", "Base de crema", "Cobertura de chocolate", "Crema chantilly"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // banana is the deliberately LOW-STOCK supply (see supplies below) —
      // this is the product whose calculateMakeableCount() lands
      // single-digit-to-moderate (check #6): stock 18 / quantity 1 = 18.
      recipe: [
        { supplyKey: "base-crema", quantity: 3, scales_with: "meat" },
        { supplyKey: "banana", quantity: 1 },
        { supplyKey: "cobertura-chocolate", quantity: 0.04 },
        { supplyKey: "crema-chantilly", quantity: 15 },
      ],
    },
    {
      key: "palta-crema",
      name: "Helado de Palta",
      description: "El gusto especial de la casa, según lo que preparó el heladero ese día",
      base_price: 2600,
      ingredients: ["Según disponibilidad de la heladería"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // DELIBERATELY no recipe — the "sin receta" product that
      // summarizeRecipes().withoutRecipeCount needs to prove that state
      // isn't just theoretical (mirrors hamburguesería's Veggie / pizzería's
      // Pizza del día / cafetería's Té).
    },
  ],

  // ── Extras ──────────────────────────────────────────────────────────
  extras: [
    {
      key: "bocha-extra",
      name: "Bocha extra",
      category: "extra",
      price: 800,
      role: "meat-unit",
      recipe: [{ supplyKey: "base-crema", quantity: 1 }],
    },
    { key: "chispas-chocolate", name: "Chispas de chocolate", category: "extra", price: 400 },
    {
      key: "dulce-leche-extra",
      name: "Dulce de leche extra",
      category: "extra",
      price: 500,
      recipe: [{ supplyKey: "saborizante-dulce-de-leche", quantity: 20 }],
    },
    { key: "mani-garrapinado", name: "Maní garrapiñado", category: "extra", price: 450 },
    {
      key: "crema-chantilly-extra",
      name: "Crema chantilly",
      category: "extra",
      price: 400,
      recipe: [{ supplyKey: "crema-chantilly", quantity: 15 }],
    },

    { key: "agua-mineral", name: "Agua mineral 500ml", category: "drink", price: 900 },
    { key: "gaseosa-350", name: "Gaseosa línea Coca-Cola 350ml", category: "drink", price: 1200 },
    { key: "jugo-naranja", name: "Jugo de naranja exprimido", category: "drink", price: 1300 },

    {
      key: "cobertura-chocolate",
      name: "Cobertura de chocolate",
      category: "fries",
      price: 500,
      role: "default-side",
      recipe: [{ supplyKey: "cobertura-chocolate", quantity: 0.03 }],
    },
    {
      key: "cobertura-frutilla",
      name: "Cobertura de frutilla",
      category: "fries",
      price: 500,
      recipe: [{ supplyKey: "saborizante-frutilla", quantity: 15 }],
    },
    { key: "barquillo", name: "Barquillo crocante", category: "fries", price: 350 },

    {
      key: "bombones-x6",
      name: "Bombones helados (x6)",
      category: "sides",
      price: 2600,
      recipe: [
        { supplyKey: "base-crema", quantity: 4 },
        { supplyKey: "cobertura-chocolate", quantity: 0.08 },
      ],
    },
    {
      key: "tortita-helada",
      name: "Tortita helada individual",
      category: "sides",
      price: 2900,
      recipe: [
        { supplyKey: "base-crema", quantity: 2 },
        { supplyKey: "cobertura-chocolate", quantity: 0.03 },
        { supplyKey: "leche", quantity: 0.1 },
        { supplyKey: "azucar", quantity: 0.05 },
      ],
    },
  ],

  // ── Supplies ────────────────────────────────────────────────────────
  //
  // Three purchase modes covered: unit (leche, azúcar, cobertura-chocolate,
  // banana), package (los 4 saborizantes, conos, los 3 potes descartables,
  // brownie, crema-chantilly), and weight (base-crema — modeled exactly
  // like hamburguesería's medallón / pizzería's muzzarella / cafetería's
  // café en grano: bought by the kilo, tracked in discrete "bocha" units of
  // unit_weight_grams each, and the recipe lines reference it in bochas
  // scaled by default_meat_quantity).
  //
  // banana is deliberately LOW on stock (18 unidades) so
  // calculateMakeableCount reports a moderate "makeable" count for Banana
  // Split (18 / 1 = 18). 9 of 15 flagged purchasable: true for the
  // expense-generation feed.
  supplies: [
    {
      key: "base-crema",
      name: "Base de crema para helado",
      unit: "bocha",
      stock_quantity: 2400,
      unit_weight_grams: 100,
      purchase_mode: "weight",
      purchase_price: 4200, // price per kilo -> cost_per_unit 420
      purchasable: true,
    },
    {
      key: "leche",
      name: "Leche",
      unit: "l",
      stock_quantity: 60,
      purchase_mode: "unit",
      purchase_price: 1400,
      purchasable: true,
    },
    {
      key: "azucar",
      name: "Azúcar",
      unit: "kg",
      stock_quantity: 40,
      purchase_mode: "unit",
      purchase_price: 1100,
      purchasable: true,
    },
    {
      key: "saborizante-dulce-de-leche",
      name: "Saborizante dulce de leche",
      unit: "g",
      stock_quantity: 4000,
      purchase_mode: "package",
      purchase_price: 3800,
      purchase_units: 1000, // -> cost_per_unit 3.8
      purchasable: true,
    },
    {
      key: "saborizante-chocolate",
      name: "Saborizante chocolate",
      unit: "g",
      stock_quantity: 4000,
      purchase_mode: "package",
      purchase_price: 3600,
      purchase_units: 1000, // -> cost_per_unit 3.6
      purchasable: false,
    },
    {
      key: "saborizante-frutilla",
      name: "Saborizante frutilla",
      unit: "g",
      stock_quantity: 3500,
      purchase_mode: "package",
      purchase_price: 4000,
      purchase_units: 1000, // -> cost_per_unit 4
      purchasable: false,
    },
    {
      key: "saborizante-vainilla",
      name: "Saborizante vainilla",
      unit: "g",
      stock_quantity: 4500,
      purchase_mode: "package",
      purchase_price: 3400,
      purchase_units: 1000, // -> cost_per_unit 3.4
      purchasable: false,
    },
    {
      key: "conos",
      name: "Conos",
      unit: "unidad",
      stock_quantity: 500,
      purchase_mode: "package",
      purchase_price: 3500,
      purchase_units: 100, // -> cost_per_unit 35
      purchasable: true,
    },
    {
      key: "potes-descartables-cuarto",
      name: "Potes descartables 1/4kg",
      unit: "unidad",
      stock_quantity: 300,
      purchase_mode: "package",
      purchase_price: 4500,
      purchase_units: 100, // -> cost_per_unit 45
      purchasable: true,
    },
    {
      key: "potes-descartables-medio",
      name: "Potes descartables 1/2kg",
      unit: "unidad",
      stock_quantity: 220,
      purchase_mode: "package",
      purchase_price: 6000,
      purchase_units: 100, // -> cost_per_unit 60
      purchasable: true,
    },
    {
      key: "potes-descartables-kilo",
      name: "Potes descartables 1kg",
      unit: "unidad",
      stock_quantity: 120,
      purchase_mode: "package",
      purchase_price: 8000,
      purchase_units: 100, // -> cost_per_unit 80
      purchasable: false,
    },
    {
      key: "cobertura-chocolate",
      name: "Cobertura de chocolate",
      unit: "kg",
      stock_quantity: 15,
      purchase_mode: "unit",
      purchase_price: 3200,
      purchasable: true,
    },
    // ── Low stock (deliberate) ─────────────────────────────────────────
    {
      key: "banana",
      name: "Banana",
      unit: "unidad",
      stock_quantity: 18,
      purchase_mode: "unit",
      purchase_price: 250,
      purchasable: true,
    },
    // ── end low stock ────────────────────────────────────────────────
    {
      key: "brownie",
      name: "Brownie",
      unit: "unidad",
      stock_quantity: 80,
      purchase_mode: "package",
      purchase_price: 9600,
      purchase_units: 24, // -> cost_per_unit 400
      purchasable: false,
    },
    {
      key: "crema-chantilly",
      name: "Crema chantilly",
      unit: "g",
      stock_quantity: 3000,
      purchase_mode: "package",
      purchase_price: 2600,
      purchase_units: 250, // -> cost_per_unit 10.4
      purchasable: false,
    },
  ],

  // ── Combos ──────────────────────────────────────────────────────────
  //
  // "burger" slots pick from the products array (unrestricted — no `allow`
  // possible there, matches hamburguesería/pizzería/cafetería). drink/fries
  // slots restrict via `allow` to keep the combo's identity coherent.
  combos: [
    {
      key: "combo-pareja",
      name: "Combo Pareja",
      description: "2 potes 1/4kg a elección + 2 bebidas",
      price: 4800,
      slots: [
        { slot_type: "burger", quantity: 2, required: true, default_meat_quantity: 1 },
        {
          slot_type: "drink",
          quantity: 2,
          required: true,
          allow: ["agua-mineral", "gaseosa-350", "jugo-naranja"],
        },
      ],
    },
    {
      key: "combo-familiar",
      name: "Combo Familiar",
      description: "Pote 1kg familiar + cucuruchos + cobertura a elección",
      price: 9800,
      slots: [
        { slot_type: "burger", quantity: 2, required: true, default_meat_quantity: 1 },
        {
          slot_type: "fries",
          quantity: 1,
          required: true,
          allow: ["cobertura-chocolate", "cobertura-frutilla"],
        },
      ],
    },
    {
      key: "combo-especial",
      name: "Combo Especial",
      description: "Copa especial a elección + bebida",
      price: 6800,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        {
          slot_type: "drink",
          quantity: 1,
          required: true,
          allow: ["agua-mineral", "gaseosa-350", "jugo-naranja"],
        },
      ],
    },
  ],

  // ── Restock purchase descriptions (per-preset) ─────────────────────
  expenseDescriptions: [
    "Compra semanal de base de crema para helado",
    "Reposición de saborizantes y esencias",
    "Compra de conos y potes descartables",
    "Pedido de frutas frescas (banana, frutilla)",
    "Compra de coberturas y crema chantilly",
    "Pedido a distribuidora de insumos",
  ],

  // ── External income descriptions (optional, per-preset) ────────────
  externalIncomeDescriptions: [
    "Catering de cumpleaños infantil",
    "Servicio de heladera para evento corporativo",
    "Depósito anticipo catering",
    "Venta de tortas heladas para evento",
    "Evento privado fin de semana",
  ],
};
