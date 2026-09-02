// Hamburguesería preset definition — a faithful, symbolic-key transcription
// of today's lib/demo/seed/{burgers,extras,combos,supplies,recipes}.ts.
// This is preset zero: DEFAULT_PRESET_ID (see ids.ts) and the frozen golden
// fixture in __tests__/hamburgueseria-golden.test.ts. Zero creative
// decisions here — every name/price/quantity/scales_with below must match
// what those seed files had before Phase 1.

import type { PresetDefinition } from "../types";

export const HAMBURGUESERIA_DEFINITION: PresetDefinition = {
  id: "hamburgueseria",
  label: "Hamburguesería",

  // Default lexicon (lexicon.ts's DEFAULT_LEXICON) already IS today's
  // hamburguesería vocabulary — nothing to override.
  lexicon: {},

  // ── Products ────────────────────────────────────────────────────────
  products: [
    {
      key: "clasica",
      name: "Clásica",
      description: "Medallón de carne, lechuga, tomate y cebolla",
      base_price: 4500,
      ingredients: ["Medallón de carne", "Lechuga", "Tomate", "Cebolla", "Pan brioche"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "medallon-carne", quantity: 1, scales_with: "meat" },
        { supplyKey: "pan-brioche", quantity: 1 },
        { supplyKey: "lechuga", quantity: 0.02 },
        { supplyKey: "tomate", quantity: 0.025 },
        { supplyKey: "cebolla", quantity: 0.015 },
      ],
    },
    {
      key: "cheese",
      name: "Cheese",
      description: "Medallón de carne con queso cheddar fundido",
      base_price: 4900,
      ingredients: ["Medallón de carne", "Queso cheddar", "Lechuga", "Tomate", "Pan brioche"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "medallon-carne", quantity: 1, scales_with: "meat" },
        { supplyKey: "pan-brioche", quantity: 1 },
        { supplyKey: "queso-cheddar", quantity: 2 },
        { supplyKey: "lechuga", quantity: 0.02 },
        { supplyKey: "tomate", quantity: 0.025 },
      ],
    },
    {
      key: "bacon",
      name: "Bacon",
      description: "Medallón de carne con panceta crocante y cheddar",
      base_price: 5500,
      ingredients: ["Medallón de carne", "Panceta", "Queso cheddar", "Lechuga", "Tomate", "Pan brioche"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "medallon-carne", quantity: 1, scales_with: "meat" },
        { supplyKey: "pan-brioche", quantity: 1 },
        { supplyKey: "panceta", quantity: 40 },
        { supplyKey: "queso-cheddar", quantity: 2 },
        { supplyKey: "lechuga", quantity: 0.02 },
        { supplyKey: "tomate", quantity: 0.025 },
      ],
    },
    {
      key: "bbq",
      name: "BBQ",
      description: "Medallón de carne con salsa BBQ y cebolla caramelizada",
      base_price: 5200,
      ingredients: ["Medallón de carne", "Salsa BBQ", "Cebolla caramelizada", "Queso cheddar", "Pan brioche"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "medallon-carne", quantity: 1, scales_with: "meat" },
        { supplyKey: "pan-brioche", quantity: 1 },
        { supplyKey: "salsa-bbq", quantity: 30 },
        { supplyKey: "cebolla-caramelizada", quantity: 20 },
        { supplyKey: "queso-cheddar", quantity: 2 },
      ],
    },
    {
      key: "doble-clasica",
      name: "Doble Clásica",
      description: "Dos medallones de carne con todos los clásicos",
      base_price: 6800,
      ingredients: ["Doble medallón de carne", "Lechuga", "Tomate", "Cebolla", "Pan brioche"],
      default_meat_quantity: 2,
      default_fries_quantity: 1,
      // Same lines as Clásica — the meat line doubles automatically via
      // scales_with: "meat" × default_meat_quantity: 2 (resolveRecipeQuantities).
      recipe: [
        { supplyKey: "medallon-carne", quantity: 1, scales_with: "meat" },
        { supplyKey: "pan-brioche", quantity: 1 },
        { supplyKey: "lechuga", quantity: 0.02 },
        { supplyKey: "tomate", quantity: 0.025 },
        { supplyKey: "cebolla", quantity: 0.015 },
      ],
    },
    {
      key: "doble-cheese-bacon",
      name: "Doble Cheese Bacon",
      description: "Dos medallones, doble cheddar y panceta",
      base_price: 7800,
      ingredients: ["Doble medallón", "Doble queso cheddar", "Panceta", "Lechuga", "Tomate", "Pan brioche"],
      default_meat_quantity: 2,
      default_fries_quantity: 1,
      // Cheese/panceta given as fixed "already doubled" amounts (matches
      // the product name literally); only the meat line scales automatically.
      recipe: [
        { supplyKey: "medallon-carne", quantity: 1, scales_with: "meat" },
        { supplyKey: "pan-brioche", quantity: 1 },
        { supplyKey: "queso-cheddar", quantity: 4 },
        { supplyKey: "panceta", quantity: 40 },
        { supplyKey: "lechuga", quantity: 0.02 },
        { supplyKey: "tomate", quantity: 0.025 },
      ],
    },
    {
      key: "crispy-chicken",
      name: "Crispy Chicken",
      description: "Medallón de pollo crocante con mayonesa de la casa",
      base_price: 5000,
      ingredients: ["Medallón de pollo", "Mayonesa de la casa", "Lechuga", "Tomate", "Pan brioche"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // Its own patty supply, still scales with "meat" — the burger's
      // default_meat_quantity is generic "patty count", not beef-only.
      recipe: [
        { supplyKey: "medallon-pollo", quantity: 1, scales_with: "meat" },
        { supplyKey: "pan-brioche", quantity: 1 },
        { supplyKey: "mayonesa-casa", quantity: 15 },
        { supplyKey: "lechuga", quantity: 0.02 },
        { supplyKey: "tomate", quantity: 0.025 },
      ],
    },
    {
      key: "veggie",
      name: "Veggie",
      description: "Medallón vegetal con guacamole y vegetales frescos",
      base_price: 4800,
      ingredients: ["Medallón vegetal", "Guacamole", "Lechuga", "Tomate", "Cebolla morada", "Pan integral"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // DELIBERATELY no recipe — the "sin receta" burger that
      // summarizeRecipes().withoutRecipeCount needs to prove that state
      // isn't just theoretical.
    },
  ],

  // ── Extras ──────────────────────────────────────────────────────────
  extras: [
    { key: "medallon", name: "Medallón", category: "extra", price: 1500, role: "meat-unit" },
    { key: "queso-cheddar-extra", name: "Queso cheddar extra", category: "extra", price: 600 },
    { key: "panceta-extra", name: "Panceta", category: "extra", price: 800 },
    { key: "huevo-frito", name: "Huevo frito", category: "extra", price: 500 },
    { key: "cebolla-caramelizada-extra", name: "Cebolla caramelizada", category: "extra", price: 400 },
    { key: "jalapenos", name: "Jalapeños", category: "extra", price: 350 },

    { key: "coca-cola", name: "Coca-Cola 500ml", category: "drink", price: 1200 },
    { key: "sprite", name: "Sprite 500ml", category: "drink", price: 1200 },
    { key: "fanta", name: "Fanta 500ml", category: "drink", price: 1200 },
    { key: "agua-mineral", name: "Agua mineral 500ml", category: "drink", price: 800 },
    { key: "limonada", name: "Limonada", category: "drink", price: 1400 },

    {
      key: "papas-chicas",
      name: "Papas fritas chicas",
      category: "fries",
      price: 1200,
      role: "default-side",
      recipe: [{ supplyKey: "papas", quantity: 0.12 }],
    },
    {
      key: "papas-grandes",
      name: "Papas fritas grandes",
      category: "fries",
      price: 1800,
      recipe: [{ supplyKey: "papas", quantity: 0.2 }],
    },
    {
      key: "papas-cheddar",
      name: "Papas con cheddar",
      category: "fries",
      price: 2400,
      recipe: [
        { supplyKey: "papas", quantity: 0.18 },
        { supplyKey: "queso-cheddar", quantity: 3 },
      ],
    },
    {
      key: "papas-bacon-cheddar",
      name: "Papas con bacon y cheddar",
      category: "fries",
      price: 2900,
      // No recipe today — not in seed/recipes.ts's FRIES_IDS, kept as-is.
    },
    {
      key: "papas-rusticas",
      name: "Papas rústicas",
      category: "fries",
      price: 2100,
      recipe: [{ supplyKey: "papas", quantity: 0.22 }],
    },

    {
      key: "aros-cebolla",
      name: "Aros de cebolla",
      category: "sides",
      price: 1800,
      recipe: [{ supplyKey: "aros-cebolla-prehecho", quantity: 8 }],
    },
    {
      key: "nuggets-x6",
      name: "Nuggets x6",
      category: "sides",
      price: 2200,
      recipe: [{ supplyKey: "nuggets-pollo", quantity: 6 }],
    },
  ],

  // ── Supplies ────────────────────────────────────────────────────────
  //
  // Three purchase modes on purpose (unit / package / weight). Three
  // supplies are deliberately left LOW on stock (Panceta, Salsa BBQ,
  // Cebolla caramelizada) so calculateMakeableCount reports a single-digit
  // "makeable" count. `purchasable` mirrors today's hand-copied
  // PURCHASABLE_SUPPLIES list in seed/expenses.ts exactly (10 of 20).
  supplies: [
    {
      key: "medallon-carne",
      name: "Medallón de carne",
      unit: "unidad",
      stock_quantity: 340,
      unit_weight_grams: 180,
      purchase_mode: "weight",
      purchase_price: 5200, // price per kilo -> cost_per_unit 936
      purchasable: true,
    },
    {
      key: "pan-brioche",
      name: "Pan brioche",
      unit: "unidad",
      stock_quantity: 260,
      purchase_mode: "package",
      purchase_price: 3600,
      purchase_units: 12, // -> cost_per_unit 300
      purchasable: true,
    },
    {
      key: "pan-integral",
      name: "Pan integral",
      unit: "unidad",
      stock_quantity: 40,
      purchase_mode: "package",
      purchase_price: 4200,
      purchase_units: 10, // -> cost_per_unit 420
      purchasable: false,
    },
    {
      key: "lechuga",
      name: "Lechuga",
      unit: "kg",
      stock_quantity: 8.5,
      purchase_mode: "unit",
      purchase_price: 1200,
      purchasable: true,
    },
    {
      key: "tomate",
      name: "Tomate",
      unit: "kg",
      stock_quantity: 12,
      purchase_mode: "unit",
      purchase_price: 1100,
      purchasable: true,
    },
    {
      key: "cebolla",
      name: "Cebolla",
      unit: "kg",
      stock_quantity: 15,
      purchase_mode: "unit",
      purchase_price: 900,
      purchasable: true,
    },
    {
      key: "cebolla-morada",
      name: "Cebolla morada",
      unit: "kg",
      stock_quantity: 6,
      purchase_mode: "unit",
      purchase_price: 1300,
      purchasable: false,
    },
    {
      key: "queso-cheddar",
      name: "Queso cheddar",
      unit: "fetas",
      stock_quantity: 480,
      purchase_mode: "package",
      purchase_price: 4500,
      purchase_units: 100, // -> cost_per_unit 45
      purchasable: true,
    },
    // ── Low stock (deliberate) ─────────────────────────────────────────
    {
      key: "panceta",
      name: "Panceta",
      unit: "g",
      stock_quantity: 180,
      purchase_mode: "unit",
      purchase_price: 3.8,
      purchasable: true,
    },
    {
      key: "salsa-bbq",
      name: "Salsa BBQ",
      unit: "ml",
      stock_quantity: 100,
      purchase_mode: "package",
      purchase_price: 2200,
      purchase_units: 1000, // -> cost_per_unit 2.2
      purchasable: false,
    },
    {
      key: "cebolla-caramelizada",
      name: "Cebolla caramelizada",
      unit: "g",
      stock_quantity: 90,
      purchase_mode: "unit",
      purchase_price: 1.5,
      purchasable: false,
    },
    // ── end low stock ────────────────────────────────────────────────
    {
      key: "medallon-pollo",
      name: "Medallón de pollo",
      unit: "unidad",
      stock_quantity: 150,
      unit_weight_grams: 150,
      purchase_mode: "weight",
      purchase_price: 4800, // -> cost_per_unit 720
      purchasable: true,
    },
    {
      key: "mayonesa-casa",
      name: "Mayonesa de la casa",
      unit: "ml",
      stock_quantity: 12000,
      purchase_mode: "package",
      purchase_price: 1800,
      purchase_units: 500, // -> cost_per_unit 3.6
      purchasable: false,
    },
    {
      key: "medallon-vegetal",
      name: "Medallón vegetal",
      unit: "unidad",
      stock_quantity: 60,
      unit_weight_grams: 160,
      purchase_mode: "weight",
      purchase_price: 3200, // -> cost_per_unit 512
      purchasable: false,
    },
    {
      key: "guacamole",
      name: "Guacamole",
      unit: "g",
      stock_quantity: 9000,
      purchase_mode: "package",
      purchase_price: 3500,
      purchase_units: 1000, // -> cost_per_unit 3.5
      purchasable: false,
    },
    {
      key: "papas",
      name: "Papas para freír",
      unit: "kg",
      stock_quantity: 90,
      purchase_mode: "unit",
      purchase_price: 950,
      purchasable: true,
    },
    {
      key: "aceite-fritura",
      name: "Aceite de fritura",
      unit: "l",
      stock_quantity: 40,
      purchase_mode: "unit",
      purchase_price: 1400,
      purchasable: false,
    },
    {
      key: "gaseosa-bidon",
      name: "Gaseosa (bidón)",
      unit: "l",
      stock_quantity: 150,
      purchase_mode: "unit",
      purchase_price: 900,
      purchasable: true,
    },
    {
      key: "aros-cebolla-prehecho",
      name: "Aros de cebolla (pre-hecho)",
      unit: "unidad",
      stock_quantity: 900,
      purchase_mode: "package",
      purchase_price: 5400,
      purchase_units: 60, // -> cost_per_unit 90
      purchasable: false,
    },
    {
      key: "nuggets-pollo",
      name: "Nuggets de pollo",
      unit: "unidad",
      stock_quantity: 1100,
      purchase_mode: "package",
      purchase_price: 6000,
      purchase_units: 100, // -> cost_per_unit 60
      purchasable: false,
    },
  ],

  // ── Combos ──────────────────────────────────────────────────────────
  //
  // Burger slots never restrict (no `allow` — and slot_type "burger" never
  // gets a rule row regardless, see builder.ts's SLOT_TYPE_TO_CATEGORY).
  // Fries/drink slots restrict exactly where today's SEED_COMBO_SLOT_RULES
  // did (seed/combos.ts:74-81) — no invented restrictions.
  combos: [
    {
      key: "combo-clasico",
      name: "Combo Clásico",
      description: "Burger a elección + papas fritas chicas + bebida",
      price: 7500,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        { slot_type: "fries", quantity: 1, required: true, allow: ["papas-chicas", "papas-grandes"] },
        {
          slot_type: "drink",
          quantity: 1,
          required: true,
          allow: ["coca-cola", "sprite", "fanta", "agua-mineral"],
        },
      ],
    },
    {
      key: "combo-familiar",
      name: "Combo Familiar",
      description: "2 burgers a elección + papas grandes + 2 bebidas",
      price: 14500,
      slots: [
        { slot_type: "burger", quantity: 2, required: true, default_meat_quantity: 1 },
        { slot_type: "fries", quantity: 1, required: true, allow: ["papas-grandes", "papas-cheddar"] },
        {
          slot_type: "drink",
          quantity: 2,
          required: true,
          allow: ["coca-cola", "sprite", "fanta", "agua-mineral"],
        },
      ],
    },
    {
      key: "combo-premium",
      name: "Combo Premium",
      description: "Burger especial + papas con cheddar + bebida",
      price: 9200,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        {
          slot_type: "fries",
          quantity: 1,
          required: true,
          allow: ["papas-cheddar", "papas-bacon-cheddar"],
        },
        {
          slot_type: "drink",
          quantity: 1,
          required: true,
          allow: ["coca-cola", "sprite", "fanta", "limonada"],
        },
      ],
    },
  ],

  // ── Restock purchase descriptions (per-preset) ─────────────────────
  expenseDescriptions: [
    "Compra semanal de carne",
    "Reposición de pan",
    "Verdulería",
    "Compra de lácteos",
    "Reposición de bebidas",
    "Compra de papas",
    "Pedido a distribuidora",
  ],

  // ── External income descriptions (optional, per-preset) ────────────
  externalIncomeDescriptions: [
    "Catering evento corporativo",
    "Catering cumpleaños privado",
    "Venta de merch",
    "Catering evento universitario",
    "Depósito anticipo catering",
    "Evento privado fin de semana",
  ],
};
