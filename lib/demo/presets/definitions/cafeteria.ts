// Cafetería preset definition — Phase 4, second real vertical (plan §6's
// flagged risk: "Cafetería es la incómoda — ahí las bebidas SON los
// productos"). Authored from scratch, same calibration discipline as
// pizzeria.ts.
//
// Price calibration (deliberate, not a mistake): real 2026 café prices run
// far higher than this file uses. Scaling to real-world pesos would look
// absurd next to the shared salary/rent figures in ../shared.ts, which are
// calibrated to hamburguesería's compressed price universe (burgers
// $4,500-$7,800, extras $350-$2,900, supply costs ~$900-$5,200/kg-
// equivalent). Every number here stays inside that same band: coffees
// $1,500-$2,900 (an "extra" tier item, cheaper than a meal), and the one
// substantial food item (Tostado completo) reaches into burger territory
// ($5,200) the way the plan allows.
//
// THE HARD PART (plan §6's risk analysis, spelled out explicitly): in every
// other vertical, `drink`-category extras are a side purchase (a Coca-Cola
// next to a burger). In a cafetería the coffee itself IS the thing being
// ordered. So coffees/tés live in `products` (the same array hamburguesería
// uses for burgers, pizzería for pizzas) — NOT as `drink`-category extras.
// `drink` here is reserved for genuinely secondary bottled/cold drinks
// (agua mineral, jugo envasado, gaseosa) someone adds alongside their
// coffee — a plausible cafetería add-on, just never the main event.
//
// Domain mapping for the two role-tagged multipliers (plan §6): the "meat"
// multiplier maps to a COFFEE SHOT — "Café doble" sets
// default_meat_quantity: 2 and its cafe-molido recipe line carries
// scales_with: "meat", so the wizard's meat-delta pricing becomes a real
// "shot extra" upsell (mirrors hamburguesería's medallón / pizzería's
// muzzarella dose). The "fries" multiplier maps to MEDIALUNA — the
// classic Argentine café accompaniment — with categoryLabels.fries
// relabeled to "Acompañamientos" (never "Papas"/"Fainá"); the
// ExtraCategory union value itself stays "fries" (frozen at the type
// layer), only its label changes.

import type { PresetDefinition } from "../types";

export const CAFETERIA_DEFINITION: PresetDefinition = {
  id: "cafeteria",
  label: "Cafetería",

  lexicon: {
    product: { singular: "café", plural: "cafés", gender: "m", emoji: "☕" },
    // The role: "meat-unit" extra is "Shot extra de espresso" — the noun
    // edit-recipe-dialog.tsx / burger-item-card.tsx / the wizard summary
    // render next to the shot-count scaling control.
    mainComponent: { singular: "shot de café", plural: "shots de café", gender: "m", emoji: "☕" },
    // The role: "default-side" extra is "Medialuna".
    sideComponent: { singular: "medialuna", plural: "medialunas", gender: "f", emoji: "🥐" },
    categoryLabels: {
      extra: "Extras",
      drink: "Bebidas",
      fries: "Acompañamientos",
      sides: "Para compartir",
    },
  },

  // ── Products ────────────────────────────────────────────────────────
  // Cafés + té + one substantial food item — same 8-item count discipline
  // as hamburguesería/pizzería. Every coffee's cafe-molido line carries
  // scales_with: "meat" (a shot count), even where default_meat_quantity
  // is 1 — Café doble is the only one that sets it to 2.
  products: [
    {
      key: "espresso",
      name: "Espresso",
      description: "Shot de café en grano recién molido",
      base_price: 1500,
      ingredients: ["Café en grano", "Agua"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [{ supplyKey: "cafe-molido", quantity: 1, scales_with: "meat" }],
    },
    {
      key: "cortado",
      name: "Cortado",
      description: "Espresso cortado con un toque de leche",
      base_price: 1800,
      ingredients: ["Café en grano", "Leche"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "cafe-molido", quantity: 1, scales_with: "meat" },
        { supplyKey: "leche", quantity: 0.03 },
      ],
    },
    {
      key: "cafe-con-leche",
      name: "Café con leche",
      description: "Café en grano con leche vaporizada",
      base_price: 2000,
      ingredients: ["Café en grano", "Leche"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "cafe-molido", quantity: 1, scales_with: "meat" },
        { supplyKey: "leche", quantity: 0.12 },
      ],
    },
    {
      key: "cappuccino",
      name: "Cappuccino",
      description: "Espresso, leche espumada y cacao en polvo",
      base_price: 2400,
      ingredients: ["Café en grano", "Leche espumada", "Cacao en polvo"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "cafe-molido", quantity: 1, scales_with: "meat" },
        { supplyKey: "leche", quantity: 0.1 },
        { supplyKey: "cacao", quantity: 2 },
      ],
    },
    {
      key: "latte",
      name: "Latte",
      description: "Espresso suave con mucha leche vaporizada",
      base_price: 2600,
      ingredients: ["Café en grano", "Leche"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "cafe-molido", quantity: 1, scales_with: "meat" },
        { supplyKey: "leche", quantity: 0.15 },
      ],
    },
    {
      key: "cafe-doble",
      name: "Café doble",
      description: "Doble shot de espresso con un toque de leche",
      base_price: 2900,
      ingredients: ["Doble café en grano", "Leche"],
      default_meat_quantity: 2,
      default_fries_quantity: 1,
      // Same single cafe-molido line as the others — it doubles
      // automatically via scales_with: "meat" × default_meat_quantity: 2
      // (resolveRecipeQuantities). This is the "shot extra" upsell the
      // plan's risk analysis calls for.
      recipe: [
        { supplyKey: "cafe-molido", quantity: 1, scales_with: "meat" },
        { supplyKey: "leche", quantity: 0.08 },
      ],
    },
    {
      key: "te",
      name: "Té",
      description: "Té negro, verde o manzanilla, según disponibilidad",
      base_price: 1600,
      ingredients: ["Según variedad disponible"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // DELIBERATELY no recipe — the "sin receta" product that
      // summarizeRecipes().withoutRecipeCount needs to prove that state
      // isn't just theoretical (mirrors hamburguesería's Veggie / pizzería's
      // Pizza del día).
    },
    {
      key: "tostado-completo",
      name: "Tostado completo",
      description: "Pan de miga tostado con jamón, queso tybo y manteca",
      base_price: 5200,
      ingredients: ["Pan de miga", "Jamón", "Queso tybo", "Manteca"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // jamon is the deliberately LOW-STOCK supply (see supplies below) —
      // this is the product whose calculateMakeableCount() lands
      // single-digit (check #6): stock 20 / quantity 3 = 6.
      recipe: [
        { supplyKey: "pan-tostado", quantity: 2 },
        { supplyKey: "jamon", quantity: 3 },
        { supplyKey: "queso-tybo", quantity: 2 },
        { supplyKey: "manteca", quantity: 5 },
      ],
    },
  ],

  // ── Extras ──────────────────────────────────────────────────────────
  // `drink` here means genuinely secondary bottled/cold drinks (agua,
  // jugo envasado, gaseosa) — never the coffees, which live in `products`
  // above. `fries` is relabeled "Acompañamientos" and holds the
  // medialuna-family accompaniments (role: "default-side" lives here).
  extras: [
    {
      key: "shot-extra-espresso",
      name: "Shot extra de espresso",
      category: "extra",
      price: 900,
      role: "meat-unit",
      recipe: [{ supplyKey: "cafe-molido", quantity: 1 }],
    },
    { key: "crema-chantilly", name: "Crema chantilly", category: "extra", price: 500 },
    { key: "canela", name: "Canela en polvo", category: "extra", price: 350 },
    {
      key: "dulce-de-leche-extra",
      name: "Dulce de leche extra",
      category: "extra",
      price: 600,
      recipe: [{ supplyKey: "dulce-de-leche", quantity: 20 }],
    },
    { key: "chocolate-rallado", name: "Chocolate rallado", category: "extra", price: 450 },

    { key: "agua-mineral", name: "Agua mineral 500ml", category: "drink", price: 900 },
    { key: "jugo-naranja", name: "Jugo de naranja envasado", category: "drink", price: 1100 },
    { key: "gaseosa-350", name: "Gaseosa línea Coca-Cola 350ml", category: "drink", price: 1200 },

    {
      key: "medialuna",
      name: "Medialuna",
      category: "fries",
      price: 500,
      role: "default-side",
      recipe: [
        { supplyKey: "harina", quantity: 0.02 },
        { supplyKey: "manteca", quantity: 8 },
        { supplyKey: "azucar", quantity: 3 },
      ],
    },
    {
      key: "medialuna-grasa",
      name: "Medialuna de grasa",
      category: "fries",
      price: 550,
      recipe: [
        { supplyKey: "harina", quantity: 0.02 },
        { supplyKey: "manteca", quantity: 6 },
        { supplyKey: "sal", quantity: 0.001 },
      ],
    },

    {
      key: "factura-surtida-x4",
      name: "Facturas surtidas (x4)",
      category: "sides",
      price: 1800,
      recipe: [
        { supplyKey: "harina", quantity: 0.06 },
        { supplyKey: "manteca", quantity: 20 },
        { supplyKey: "dulce-de-leche", quantity: 15 },
        { supplyKey: "levadura", quantity: 8 },
      ],
    },
    {
      key: "sandwich-miga-x3",
      name: "Sandwiches de miga (x3)",
      category: "sides",
      price: 2600,
      recipe: [
        { supplyKey: "pan-tostado", quantity: 6 },
        { supplyKey: "jamon", quantity: 6 },
        { supplyKey: "queso-tybo", quantity: 6 },
      ],
    },
  ],

  // ── Supplies ────────────────────────────────────────────────────────
  //
  // Three purchase modes covered: unit (leche, azúcar, harina, sal),
  // package (manteca, dulce-de-leche, pan-tostado, jamón, queso-tybo,
  // levadura, cacao), and weight (café en grano — modeled exactly like
  // hamburguesería's medallón / pizzería's muzzarella: bought by the kilo,
  // tracked in discrete "shot" units of unit_weight_grams each, and the
  // recipe lines reference it in shots scaled by default_meat_quantity).
  //
  // jamón is deliberately LOW on stock (20 fetas) so
  // calculateMakeableCount reports a single-digit "makeable" count for
  // Tostado completo (20 / 3 = 6). 8 of 12 flagged purchasable: true for
  // the expense-generation feed.
  supplies: [
    {
      key: "cafe-molido",
      name: "Café en grano",
      unit: "shot",
      stock_quantity: 900,
      unit_weight_grams: 8,
      purchase_mode: "weight",
      purchase_price: 5200, // price per kilo -> cost_per_unit 41.6
      purchasable: true,
    },
    {
      key: "leche",
      name: "Leche",
      unit: "l",
      stock_quantity: 45,
      purchase_mode: "unit",
      purchase_price: 1400,
      purchasable: true,
    },
    {
      key: "azucar",
      name: "Azúcar",
      unit: "kg",
      stock_quantity: 30,
      purchase_mode: "unit",
      purchase_price: 1100,
      purchasable: true,
    },
    {
      key: "harina",
      name: "Harina 000",
      unit: "kg",
      stock_quantity: 40,
      purchase_mode: "unit",
      purchase_price: 750,
      purchasable: true,
    },
    {
      key: "sal",
      name: "Sal fina",
      unit: "kg",
      stock_quantity: 8,
      purchase_mode: "unit",
      purchase_price: 950,
      purchasable: false,
    },
    {
      key: "manteca",
      name: "Manteca",
      unit: "g",
      stock_quantity: 6000,
      purchase_mode: "package",
      purchase_price: 3200,
      purchase_units: 200, // -> cost_per_unit 16
      purchasable: true,
    },
    {
      key: "dulce-de-leche",
      name: "Dulce de leche",
      unit: "g",
      stock_quantity: 5000,
      purchase_mode: "package",
      purchase_price: 4200,
      purchase_units: 1000, // -> cost_per_unit 4.2
      purchasable: false,
    },
    {
      key: "pan-tostado",
      name: "Pan de miga",
      unit: "fetas",
      stock_quantity: 300,
      purchase_mode: "package",
      purchase_price: 2800,
      purchase_units: 20, // -> cost_per_unit 140
      purchasable: true,
    },
    // ── Low stock (deliberate) ─────────────────────────────────────────
    {
      key: "jamon",
      name: "Jamón cocido",
      unit: "fetas",
      stock_quantity: 20,
      purchase_mode: "package",
      purchase_price: 4800,
      purchase_units: 100, // -> cost_per_unit 48
      purchasable: true,
    },
    // ── end low stock ────────────────────────────────────────────────
    {
      key: "queso-tybo",
      name: "Queso tybo",
      unit: "fetas",
      stock_quantity: 220,
      purchase_mode: "package",
      purchase_price: 4500,
      purchase_units: 100, // -> cost_per_unit 45
      purchasable: true,
    },
    {
      key: "levadura",
      name: "Levadura",
      unit: "g",
      stock_quantity: 3000,
      purchase_mode: "package",
      purchase_price: 2400,
      purchase_units: 500, // -> cost_per_unit 4.8
      purchasable: false,
    },
    {
      key: "cacao",
      name: "Cacao en polvo",
      unit: "g",
      stock_quantity: 2500,
      purchase_mode: "package",
      purchase_price: 2600,
      purchase_units: 250, // -> cost_per_unit 10.4
      purchasable: false,
    },
  ],

  // ── Combos ──────────────────────────────────────────────────────────
  //
  // "burger" slots pick from the products array (unrestricted — no `allow`
  // possible there, matches hamburguesería/pizzería). fries/side slots
  // restrict via `allow` to keep the combo's identity coherent.
  combos: [
    {
      key: "combo-desayuno",
      name: "Combo Desayuno",
      description: "Café a elección + medialuna",
      price: 2300,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        { slot_type: "fries", quantity: 1, required: true, allow: ["medialuna", "medialuna-grasa"] },
      ],
    },
    {
      key: "combo-merienda",
      name: "Combo Merienda",
      description: "2 productos a elección (café + tostado) + medialuna",
      price: 6800,
      slots: [
        { slot_type: "burger", quantity: 2, required: true, default_meat_quantity: 1 },
        { slot_type: "fries", quantity: 1, required: true, allow: ["medialuna", "medialuna-grasa"] },
      ],
    },
    {
      key: "combo-vianda",
      name: "Combo Vianda",
      description: "2 cafés a elección + vianda de facturas surtidas",
      price: 5400,
      slots: [
        { slot_type: "burger", quantity: 2, required: true, default_meat_quantity: 1 },
        { slot_type: "side", quantity: 1, required: true, allow: ["factura-surtida-x4"] },
      ],
    },
  ],

  // ── Restock purchase descriptions (per-preset) ─────────────────────
  expenseDescriptions: [
    "Compra semanal de café en grano",
    "Reposición de leche y lácteos",
    "Compra de harina y manteca",
    "Pedido de fiambres y quesos",
    "Reposición de facturas y pan de miga",
    "Pedido a distribuidora de bebidas",
  ],

  // ── External income descriptions (optional, per-preset) ────────────
  externalIncomeDescriptions: [
    "Catering de oficina (desayunos)",
    "Vianda de facturas para evento",
    "Catering merienda corporativa",
    "Evento privado fin de semana",
    "Depósito anticipo catering",
  ],
};
