// Pizzería preset definition — Phase 4, first real vertical (plan §"Secuencia
// / Fase 4": "Pizzería primero como referencia"). Unlike hamburgueseria.ts
// (a faithful transcription of pre-existing seed data), this one is authored
// from scratch, so every name/price/quantity below is a deliberate content
// decision, not a transcription.
//
// Price calibration (deliberate, not a mistake): real 2026 Buenos Aires
// pizza prices run far higher (a muzzarella grande ~$27-30k) than this file
// uses. Scaling to real-world pesos would look absurd next to the shared
// salary/rent figures in ../shared.ts, which are calibrated to
// hamburguesería's compressed price universe (burgers $4,500-$7,800, supply
// costs ~$900-$5,200/kg-equivalent, extras $350-$2,900). Every number here
// stays inside that same band instead.
//
// Domain mapping for the two role-tagged multipliers (plan §6's risk
// analysis): the "meat" multiplier maps to a MUZZARELLA DOSE, not a patty —
// a "doble muzza" pizza sets default_meat_quantity: 2 and its cheese recipe
// line carries scales_with: "meat", so the wizard's meat-delta pricing
// becomes a real "con muzza extra" upsell. The "fries" multiplier maps to
// FAINÁ (the classic Argentine pizzería side), with categoryLabels.fries
// relabeled accordingly — the ExtraCategory union value itself stays "fries"
// (frozen at the type layer), only its label changes.

import type { PresetDefinition } from "../types";

export const PIZZERIA_DEFINITION: PresetDefinition = {
  id: "pizzeria",
  label: "Pizzería",

  lexicon: {
    product: { singular: "pizza", plural: "pizzas", gender: "f", emoji: "🍕" },
    // The role: "meat-unit" extra is "Porción de muzzarella extra" — this
    // noun is what edit-recipe-dialog.tsx / burger-item-card.tsx / the
    // wizard summary render next to the muzzarella-dose scaling control.
    mainComponent: { singular: "porción de muzzarella", plural: "porciones de muzzarella", gender: "f", emoji: "🧀" },
    // The role: "default-side" extra is "Fainá individual".
    sideComponent: { singular: "fainá", plural: "fainás", gender: "f", emoji: "🫓" },
    categoryLabels: {
      extra: "Extras",
      drink: "Bebidas",
      fries: "Fainá",
      sides: "Acompañamientos",
    },
  },

  // ── Products ────────────────────────────────────────────────────────
  products: [
    {
      key: "muzzarella",
      name: "Muzzarella",
      description: "La clásica: salsa de tomate y muzzarella a la piedra",
      base_price: 6500,
      ingredients: ["Masa de pizza", "Salsa de tomate", "Muzzarella", "Orégano"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "harina", quantity: 0.25 },
        { supplyKey: "levadura", quantity: 6 },
        { supplyKey: "salsa-tomate", quantity: 0.08 },
        { supplyKey: "muzzarella", quantity: 1, scales_with: "meat" },
        { supplyKey: "oregano", quantity: 2 },
      ],
    },
    {
      key: "napolitana",
      name: "Napolitana",
      description: "Muzzarella, tomate fresco, ajo y orégano en abundancia",
      base_price: 7200,
      ingredients: ["Masa de pizza", "Tomate fresco", "Muzzarella", "Ajo", "Orégano"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "harina", quantity: 0.25 },
        { supplyKey: "levadura", quantity: 6 },
        { supplyKey: "salsa-tomate", quantity: 0.12 },
        { supplyKey: "muzzarella", quantity: 1, scales_with: "meat" },
        { supplyKey: "oregano", quantity: 3 },
      ],
    },
    {
      key: "fugazzeta",
      name: "Fugazzeta",
      description: "Cebolla a la piedra y muzzarella, sin salsa de tomate",
      base_price: 7900,
      ingredients: ["Masa de pizza", "Cebolla", "Muzzarella", "Orégano"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "harina", quantity: 0.25 },
        { supplyKey: "levadura", quantity: 6 },
        { supplyKey: "cebolla", quantity: 0.12 },
        { supplyKey: "muzzarella", quantity: 1, scales_with: "meat" },
        { supplyKey: "oregano", quantity: 2 },
      ],
    },
    {
      key: "especial",
      name: "Especial",
      description: "Muzzarella con jamón y morrones",
      base_price: 8700,
      ingredients: ["Masa de pizza", "Salsa de tomate", "Muzzarella", "Jamón", "Morrones"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "harina", quantity: 0.25 },
        { supplyKey: "salsa-tomate", quantity: 0.08 },
        { supplyKey: "muzzarella", quantity: 1, scales_with: "meat" },
        { supplyKey: "jamon", quantity: 6 },
        { supplyKey: "morrones", quantity: 0.05 },
      ],
    },
    {
      key: "calabresa",
      name: "Calabresa",
      description: "Muzzarella con longaniza calabresa picante",
      base_price: 8600,
      ingredients: ["Masa de pizza", "Salsa de tomate", "Muzzarella", "Longaniza calabresa", "Orégano"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // longaniza-calabresa is the deliberately LOW-STOCK supply (see
      // supplies below) — this product is the one whose
      // calculateMakeableCount() lands single-digit (check #6).
      recipe: [
        { supplyKey: "harina", quantity: 0.25 },
        { supplyKey: "salsa-tomate", quantity: 0.08 },
        { supplyKey: "muzzarella", quantity: 1, scales_with: "meat" },
        { supplyKey: "longaniza-calabresa", quantity: 0.35 },
        { supplyKey: "oregano", quantity: 2 },
      ],
    },
    {
      key: "doble-muzza",
      name: "Doble Muzzarella",
      description: "El doble de muzzarella sobre salsa de tomate",
      base_price: 9200,
      ingredients: ["Masa de pizza", "Salsa de tomate", "Doble muzzarella", "Orégano"],
      default_meat_quantity: 2,
      default_fries_quantity: 1,
      // Same lines as Muzzarella — the cheese line doubles automatically
      // via scales_with: "meat" × default_meat_quantity: 2
      // (resolveRecipeQuantities). This is the literal "con muzza extra"
      // upsell the plan's risk analysis calls for.
      recipe: [
        { supplyKey: "harina", quantity: 0.25 },
        { supplyKey: "levadura", quantity: 6 },
        { supplyKey: "salsa-tomate", quantity: 0.08 },
        { supplyKey: "muzzarella", quantity: 1, scales_with: "meat" },
        { supplyKey: "oregano", quantity: 2 },
      ],
    },
    {
      key: "cuatro-quesos",
      name: "Cuatro Quesos",
      description: "Muzzarella, provolone y roquefort a la piedra",
      base_price: 9900,
      ingredients: ["Masa de pizza", "Muzzarella", "Provolone", "Roquefort"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "harina", quantity: 0.25 },
        { supplyKey: "muzzarella", quantity: 1, scales_with: "meat" },
        { supplyKey: "queso-provolone", quantity: 60 },
        { supplyKey: "queso-roquefort", quantity: 25 },
      ],
    },
    {
      key: "pizza-del-dia",
      name: "Pizza del día",
      description: "Combinación rotativa según lo que haya en la cocina",
      base_price: 7000,
      ingredients: ["Según disponibilidad del día"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // DELIBERATELY no recipe — the "sin receta" pizza that
      // summarizeRecipes().withoutRecipeCount needs to prove that state
      // isn't just theoretical (mirrors hamburguesería's Veggie).
    },
  ],

  // ── Extras ──────────────────────────────────────────────────────────
  extras: [
    {
      key: "porcion-muzzarella",
      name: "Porción de muzzarella extra",
      category: "extra",
      price: 1400,
      role: "meat-unit",
      recipe: [{ supplyKey: "muzzarella", quantity: 1 }],
    },
    {
      key: "aceitunas",
      name: "Aceitunas",
      category: "extra",
      price: 450,
      recipe: [{ supplyKey: "aceitunas", quantity: 20 }],
    },
    {
      key: "oregano-extra",
      name: "Orégano extra",
      category: "extra",
      price: 350,
      recipe: [{ supplyKey: "oregano", quantity: 3 }],
    },
    {
      key: "jamon-extra",
      name: "Jamón extra",
      category: "extra",
      price: 900,
      recipe: [{ supplyKey: "jamon", quantity: 4 }],
    },

    { key: "coca-cola", name: "Coca-Cola 500ml", category: "drink", price: 1200 },
    { key: "sprite", name: "Sprite 500ml", category: "drink", price: 1200 },
    { key: "agua-mineral", name: "Agua mineral 500ml", category: "drink", price: 800 },
    { key: "cerveza", name: "Cerveza Quilmes 1L", category: "drink", price: 2600 },

    {
      key: "faina-chica",
      name: "Fainá individual",
      category: "fries",
      price: 700,
      role: "default-side",
      recipe: [
        { supplyKey: "harina-garbanzo", quantity: 0.1 },
        { supplyKey: "aceite-oliva", quantity: 0.015 },
      ],
    },
    {
      key: "faina-grande",
      name: "Fainá grande",
      category: "fries",
      price: 1500,
      recipe: [
        { supplyKey: "harina-garbanzo", quantity: 0.2 },
        { supplyKey: "aceite-oliva", quantity: 0.03 },
      ],
    },
    {
      key: "faina-provolone",
      name: "Fainá con provolone",
      category: "fries",
      price: 1900,
      recipe: [
        { supplyKey: "harina-garbanzo", quantity: 0.15 },
        { supplyKey: "queso-provolone", quantity: 40 },
      ],
    },

    {
      key: "empanadas-carne-x6",
      name: "Empanadas de carne (x6)",
      category: "sides",
      price: 2900,
      recipe: [{ supplyKey: "empanadas-carne-prehecho", quantity: 6 }],
    },
    {
      key: "empanadas-jyq-x6",
      name: "Empanadas de jamón y queso (x6)",
      category: "sides",
      price: 2900,
      // No recipe — mirrors hamburguesería's "papas-bacon-cheddar" pattern
      // of one item per category left uncosted on purpose.
    },
    {
      key: "palitos-muzzarella-x8",
      name: "Palitos de muzzarella (x8)",
      category: "sides",
      price: 2400,
      recipe: [
        { supplyKey: "muzzarella", quantity: 2 },
        { supplyKey: "harina", quantity: 0.08 },
      ],
    },
  ],

  // ── Supplies ────────────────────────────────────────────────────────
  //
  // Three purchase modes covered: unit (harina, salsa-tomate, morrones,
  // cebolla, longaniza-calabresa, harina-garbanzo, aceite-oliva), package
  // (levadura, jamon, aceitunas, queso-provolone, queso-roquefort,
  // empanadas-carne-prehecho), and weight (muzzarella — modeled exactly
  // like hamburguesería's medallón: bought by the kilo, tracked in
  // discrete "porción" units of unit_weight_grams each, and the recipe
  // lines reference it in porciones scaled by default_meat_quantity).
  //
  // longaniza-calabresa is deliberately LOW on stock (2.5kg) so
  // calculateMakeableCount reports a single-digit "makeable" count for
  // Calabresa (2.5 / 0.35 = 7). 10 of 15 flagged purchasable: true for the
  // expense-generation feed.
  supplies: [
    {
      key: "harina",
      name: "Harina 000",
      unit: "kg",
      stock_quantity: 180,
      purchase_mode: "unit",
      purchase_price: 750,
      purchasable: true,
    },
    {
      key: "levadura",
      name: "Levadura",
      unit: "g",
      stock_quantity: 6000,
      purchase_mode: "package",
      purchase_price: 2400,
      purchase_units: 500, // -> cost_per_unit 4.8
      purchasable: true,
    },
    {
      key: "salsa-tomate",
      name: "Salsa de tomate",
      unit: "kg",
      stock_quantity: 45,
      purchase_mode: "unit",
      purchase_price: 1400,
      purchasable: true,
    },
    {
      key: "muzzarella",
      name: "Muzzarella",
      unit: "porción",
      stock_quantity: 320,
      unit_weight_grams: 140,
      purchase_mode: "weight",
      purchase_price: 5200, // price per kilo -> cost_per_unit 728
      purchasable: true,
    },
    {
      key: "oregano",
      name: "Orégano",
      unit: "g",
      stock_quantity: 4000,
      purchase_mode: "package",
      purchase_price: 1800,
      purchase_units: 200, // -> cost_per_unit 9
      purchasable: false,
    },
    {
      key: "jamon",
      name: "Jamón cocido",
      unit: "fetas",
      stock_quantity: 900,
      purchase_mode: "package",
      purchase_price: 4800,
      purchase_units: 100, // -> cost_per_unit 48
      purchasable: true,
    },
    {
      key: "morrones",
      name: "Morrones",
      unit: "kg",
      stock_quantity: 14,
      purchase_mode: "unit",
      purchase_price: 1900,
      purchasable: true,
    },
    {
      key: "aceitunas",
      name: "Aceitunas",
      unit: "g",
      stock_quantity: 15000,
      purchase_mode: "package",
      purchase_price: 3200,
      purchase_units: 1000, // -> cost_per_unit 3.2
      purchasable: false,
    },
    // ── Low stock (deliberate) ─────────────────────────────────────────
    {
      key: "longaniza-calabresa",
      name: "Longaniza calabresa",
      unit: "kg",
      stock_quantity: 2.5,
      purchase_mode: "unit",
      purchase_price: 6800,
      purchasable: true,
    },
    // ── end low stock ────────────────────────────────────────────────
    {
      key: "queso-provolone",
      name: "Queso provolone",
      unit: "g",
      stock_quantity: 8000,
      purchase_mode: "package",
      purchase_price: 5400,
      purchase_units: 1000, // -> cost_per_unit 5.4
      purchasable: false,
    },
    {
      key: "queso-roquefort",
      name: "Queso roquefort",
      unit: "g",
      stock_quantity: 3000,
      purchase_mode: "package",
      purchase_price: 7200,
      purchase_units: 1000, // -> cost_per_unit 7.2
      purchasable: false,
    },
    {
      key: "harina-garbanzo",
      name: "Harina de garbanzo",
      unit: "kg",
      stock_quantity: 30,
      purchase_mode: "unit",
      purchase_price: 1600,
      purchasable: true,
    },
    {
      key: "aceite-oliva",
      name: "Aceite de oliva",
      unit: "l",
      stock_quantity: 20,
      purchase_mode: "unit",
      purchase_price: 2800,
      purchasable: true,
    },
    {
      key: "empanadas-carne-prehecho",
      name: "Empanadas de carne (pre-hechas)",
      unit: "unidad",
      stock_quantity: 240,
      purchase_mode: "package",
      purchase_price: 7200,
      purchase_units: 24, // -> cost_per_unit 300
      purchasable: false,
    },
    {
      key: "cebolla",
      name: "Cebolla",
      unit: "kg",
      stock_quantity: 22,
      purchase_mode: "unit",
      purchase_price: 850,
      purchasable: true,
    },
  ],

  // ── Combos ──────────────────────────────────────────────────────────
  //
  // Pizza slots never restrict (no `allow` — slot_type "burger" never gets
  // a rule row regardless, see builder.ts's SLOT_TYPE_TO_CATEGORY). Fries
  // (fainá) / drink slots restrict deliberately, mirroring hamburguesería's
  // restraint (not every slot is over-restricted).
  combos: [
    {
      key: "combo-individual",
      name: "Combo Individual",
      description: "Pizza a elección + bebida",
      price: 7200,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        { slot_type: "drink", quantity: 1, required: true, allow: ["coca-cola", "sprite", "agua-mineral"] },
      ],
    },
    {
      key: "combo-familiar",
      name: "Combo Familiar",
      description: "Pizza grande a elección + fainá + 2 bebidas",
      price: 12800,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        { slot_type: "fries", quantity: 1, required: true, allow: ["faina-grande", "faina-provolone"] },
        {
          slot_type: "drink",
          quantity: 2,
          required: true,
          allow: ["coca-cola", "sprite", "agua-mineral", "cerveza"],
        },
      ],
    },
    {
      key: "combo-especial",
      name: "Combo Especial",
      description: "Pizza especial a elección + fainá + bebida",
      price: 10200,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        { slot_type: "fries", quantity: 1, required: true, allow: ["faina-chica", "faina-grande"] },
        {
          slot_type: "drink",
          quantity: 1,
          required: true,
          allow: ["coca-cola", "sprite", "agua-mineral", "cerveza"],
        },
      ],
    },
  ],

  // ── Restock purchase descriptions (per-preset) ─────────────────────
  expenseDescriptions: [
    "Compra semanal de harina y muzzarella",
    "Reposición de salsa de tomate",
    "Compra de fiambres (jamón y longaniza)",
    "Pedido de quesos especiales",
    "Compra de bebidas",
    "Pedido a distribuidora de insumos",
  ],

  // ── External income descriptions (optional, per-preset) ────────────
  externalIncomeDescriptions: [
    "Catering evento corporativo",
    "Pizza party cumpleaños infantil",
    "Catering evento universitario",
    "Depósito anticipo catering",
    "Evento privado fin de semana",
  ],
};
