// Sushi preset definition — Phase 4, fourth real vertical (plan §"Secuencia
// / Fase 4", following pizzeria.ts, cafeteria.ts and heladeria.ts as
// templates). Authored from scratch, same calibration discipline as its
// three predecessors.
//
// Price calibration (deliberate, not a mistake): real 2026 Buenos Aires
// sushi combinados run much higher than this file uses. Scaling to
// real-world pesos would look absurd next to the shared salary/rent figures
// in ../shared.ts, which are calibrated to hamburguesería's compressed price
// universe (burgers $4,500-$7,800, extras $350-$2,900, supply costs
// ~$900-$5,200/kg-equivalent). The plan's own risk analysis (§5) flags sushi
// as naturally HIGH-ticket relative to the other verticals ("ticket alto,
// fuerte en delivery"), so the largest combinados sit at the TOP of
// hamburguesería's band or slightly above it (~$7,000-$9,500) instead of
// real-world combo prices ($15k-30k+); individual pieces/small rolls stay
// comparable to a burger extra (~$1,800-$3,500 for an 8-piece roll).
//
// DOMAIN MAPPING: sushi doesn't map to a single "meat portion" like a
// burger patty, so products are modeled as COMBINADOS BY PIECE-COUNT TIER —
// the same idea heladería used for kg — plus fixed specialty items (niguiri,
// sashimi, tempura/hot rolls) for menu variety. The "meat" multiplier maps
// to SALMÓN (the fish itself, direct analog of patty/muzzarella-dose/
// coffee-shot/crema-scoop): every combinado's salmón recipe line carries
// `scales_with: "meat"`, and `default_meat_quantity` is how many "base
// rations of 8 piezas" the combinado contains —
//   Combinado 8 piezas:            default_meat_quantity 1 -> 1 ración
//   Combinado 15 piezas:           default_meat_quantity 2 -> ~2 raciones
//   Combinado 25 piezas Familiar:  default_meat_quantity 3 -> ~3 raciones
// (2/3 raciones round to 16/24 piezas of raw fish, sold under the rounder
// "15"/"25" menu names — the same cosmetic rounding pizzería's "doble
// muzza" and heladería's pote ladder already use). This is the literal
// "piezas extra" upsell the plan's risk analysis calls for (see extras:
// "Piezas extra (x4)", role "meat-unit"). The "fries" multiplier is NOT
// exercised by any product recipe line here (matches pizzería/cafetería/
// heladería precedent — none of them scale a product by "fries" either);
// the ExtraCategory slot it feeds is relabeled via categoryLabels.fries ->
// "Acompañamientos" and holds Gyozas (role: "default-side", the plan's own
// named fries-analog) and Sunomono. The ExtraCategory union value itself
// stays "fries", frozen at the type layer — only its label changes.

import type { PresetDefinition } from "../types";

export const SUSHI_DEFINITION: PresetDefinition = {
  id: "sushi",
  label: "Sushi",

  lexicon: {
    product: { singular: "combinado", plural: "combinados", gender: "m", emoji: "🍣" },
    // The role: "meat-unit" extra is "Piezas extra (x4)" — this noun is
    // what edit-recipe-dialog.tsx / burger-item-card.tsx / the wizard
    // summary render next to the salmón-ración scaling control.
    mainComponent: { singular: "pieza", plural: "piezas", gender: "f", emoji: "🍣" },
    // The role: "default-side" extra is "Gyozas".
    sideComponent: { singular: "gyoza", plural: "gyozas", gender: "f", emoji: "🥟" },
    categoryLabels: {
      extra: "Extras",
      drink: "Bebidas",
      fries: "Acompañamientos",
      sides: "Para compartir",
    },
  },

  // ── Products ────────────────────────────────────────────────────────
  // Three combinado sizes (the meat-scaling ladder) + four fixed specialty
  // items, same 8-item count discipline as pizzería/cafetería/heladería.
  products: [
    {
      key: "combinado-8",
      name: "Combinado 8 piezas",
      description: "8 piezas surtidas de salmón, avocado roll y niguiri",
      base_price: 3400,
      ingredients: ["Arroz para sushi", "Salmón", "Nori", "Palta"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "salmon", quantity: 4, scales_with: "meat" },
        { supplyKey: "arroz-sushi", quantity: 0.09 },
        { supplyKey: "nori", quantity: 1 },
        { supplyKey: "palta", quantity: 0.2 },
        { supplyKey: "vinagre-arroz", quantity: 0.015 },
      ],
    },
    {
      key: "combinado-15",
      name: "Combinado 15 piezas",
      description: "15 piezas surtidas: niguiris, rolls y sashimi de salmón",
      base_price: 5800,
      ingredients: ["Arroz para sushi", "Salmón", "Nori", "Palta"],
      default_meat_quantity: 2,
      default_fries_quantity: 1,
      // Same salmón line as Combinado 8 — doubles automatically via
      // scales_with: "meat" × default_meat_quantity: 2
      // (resolveRecipeQuantities). This is the literal "piezas extra"
      // upsell the plan's risk analysis calls for.
      recipe: [
        { supplyKey: "salmon", quantity: 4, scales_with: "meat" },
        { supplyKey: "arroz-sushi", quantity: 0.09 },
        { supplyKey: "nori", quantity: 1 },
        { supplyKey: "palta", quantity: 0.2 },
        { supplyKey: "vinagre-arroz", quantity: 0.015 },
      ],
    },
    {
      key: "combinado-25-familiar",
      name: "Combinado 25 piezas Familiar",
      description: "25 piezas familiares: niguiris, rolls, sashimi y hot rolls",
      base_price: 8900,
      ingredients: ["Arroz para sushi", "Salmón", "Nori", "Palta"],
      default_meat_quantity: 3,
      default_fries_quantity: 1,
      // Same salmón line again — triples via scales_with: "meat" ×
      // default_meat_quantity: 3. Together with Combinado 8 and Combinado
      // 15 this is the full sizing ladder (1/2/3 raciones de salmón).
      recipe: [
        { supplyKey: "salmon", quantity: 4, scales_with: "meat" },
        { supplyKey: "arroz-sushi", quantity: 0.09 },
        { supplyKey: "nori", quantity: 1 },
        { supplyKey: "palta", quantity: 0.2 },
        { supplyKey: "vinagre-arroz", quantity: 0.015 },
      ],
    },
    {
      key: "niguiri-salmon",
      name: "Niguiri de salmón (8 piezas)",
      description: "8 piezas de niguiri de salmón fresco sobre arroz",
      base_price: 3200,
      ingredients: ["Arroz para sushi", "Salmón"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "salmon", quantity: 6 },
        { supplyKey: "arroz-sushi", quantity: 0.1 },
      ],
    },
    {
      key: "sashimi-tabla",
      name: "Sashimi Tabla (12 piezas)",
      description: "Tabla de sashimi variado: salmón y atún fresco, sin arroz",
      base_price: 4600,
      ingredients: ["Salmón", "Atún"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "salmon", quantity: 5 },
        { supplyKey: "atun", quantity: 90 },
      ],
    },
    {
      key: "tempura-roll",
      name: "Tempura Roll (8 piezas)",
      description: "Roll frito relleno de langostinos tempura y palta",
      base_price: 3600,
      ingredients: ["Arroz para sushi", "Nori", "Langostinos", "Panko", "Palta"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // langostinos is the deliberately LOW-STOCK supply (see supplies
      // below) — this is the product whose calculateMakeableCount() lands
      // in [1,30] (check #6): stock 90 / quantity 4 = 22.
      recipe: [
        { supplyKey: "arroz-sushi", quantity: 0.08 },
        { supplyKey: "nori", quantity: 1 },
        { supplyKey: "langostinos", quantity: 4 },
        { supplyKey: "panko", quantity: 25 },
        { supplyKey: "palta", quantity: 0.25 },
        { supplyKey: "aceite", quantity: 0.05 },
      ],
    },
    {
      key: "hot-roll",
      name: "Hot Roll (8 piezas)",
      description: "Roll frito de salmón y queso philadelphia, crocante por fuera",
      base_price: 3400,
      ingredients: ["Arroz para sushi", "Nori", "Salmón", "Queso philadelphia", "Panko"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "arroz-sushi", quantity: 0.08 },
        { supplyKey: "nori", quantity: 1 },
        { supplyKey: "salmon", quantity: 3 },
        { supplyKey: "queso-philadelphia", quantity: 30 },
        { supplyKey: "panko", quantity: 20 },
        { supplyKey: "sesamo", quantity: 3 },
      ],
    },
    {
      key: "sushi-del-chef",
      name: "Sushi del chef",
      description: "Selección rotativa según lo mejor del día, a elección del chef",
      base_price: 3900,
      ingredients: ["Según disponibilidad del día"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // DELIBERATELY no recipe — the "sin receta" product that
      // summarizeRecipes().withoutRecipeCount needs to prove that state
      // isn't just theoretical (mirrors hamburguesería's Veggie / pizzería's
      // Pizza del día / cafetería's Té / heladería's Helado de Palta).
    },
  ],

  // ── Extras ──────────────────────────────────────────────────────────
  extras: [
    {
      key: "piezas-extra-x4",
      name: "Piezas extra (x4)",
      category: "extra",
      price: 2400,
      role: "meat-unit",
      recipe: [
        { supplyKey: "salmon", quantity: 8 },
        { supplyKey: "arroz-sushi", quantity: 0.12 },
      ],
    },
    {
      key: "wasabi-extra",
      name: "Wasabi extra",
      category: "extra",
      price: 350,
      recipe: [{ supplyKey: "wasabi", quantity: 10 }],
    },
    {
      key: "jengibre-extra",
      name: "Jengibre extra",
      category: "extra",
      price: 300,
      recipe: [{ supplyKey: "jengibre", quantity: 20 }],
    },
    {
      key: "salsa-teriyaki-extra",
      name: "Salsa teriyaki extra",
      category: "extra",
      price: 450,
      // No recipe — mirrors pizzería's "empanadas-jyq-x6" pattern of one
      // item per category left uncosted on purpose.
    },
    { key: "salsa-spicy-extra", name: "Salsa spicy extra", category: "extra", price: 450 },

    { key: "te-verde", name: "Té verde", category: "drink", price: 1300 },
    { key: "agua-mineral", name: "Agua mineral 500ml", category: "drink", price: 800 },
    { key: "gaseosa-350", name: "Gaseosa línea Coca-Cola 350ml", category: "drink", price: 1200 },
    { key: "cerveza-japonesa", name: "Cerveza Asahi 340ml", category: "drink", price: 2200 },

    {
      key: "gyozas",
      name: "Gyozas (x5)",
      category: "fries",
      price: 2100,
      role: "default-side",
      recipe: [
        { supplyKey: "gyozas-prehechas", quantity: 5 },
        { supplyKey: "aceite", quantity: 0.02 },
      ],
    },
    {
      key: "sunomono",
      name: "Sunomono",
      category: "fries",
      price: 900,
      recipe: [
        { supplyKey: "vinagre-arroz", quantity: 0.02 },
        { supplyKey: "sesamo", quantity: 2 },
      ],
    },

    { key: "edamame", name: "Edamame", category: "sides", price: 1600 },
    {
      key: "sopa-miso",
      name: "Sopa miso",
      category: "sides",
      price: 1400,
      recipe: [{ supplyKey: "salsa-soja", quantity: 0.01 }],
    },
  ],

  // ── Supplies ────────────────────────────────────────────────────────
  //
  // Three purchase modes covered: unit (arroz-sushi, vinagre-arroz, palta,
  // salsa-soja, aceite), package (atún, queso-philadelphia, nori, panko,
  // langostinos, sésamo, wasabi, jengibre, gyozas-prehechas), and weight
  // (salmón — modeled exactly like hamburguesería's medallón / pizzería's
  // muzzarella / cafetería's café en grano / heladería's base-crema: bought
  // by the kilo, tracked in discrete "porción" units of unit_weight_grams
  // each, and the combinado recipe lines reference it in porciones scaled
  // by default_meat_quantity).
  //
  // langostinos is deliberately LOW on stock (90 unidades) so
  // calculateMakeableCount reports a "makeable" count of 22 for Tempura
  // Roll (90 / 4 = 22 — verified with a scratch vitest computation, not
  // eyeballed). 10 of 15 flagged purchasable: true for the
  // expense-generation feed.
  supplies: [
    {
      key: "arroz-sushi",
      name: "Arroz para sushi",
      unit: "kg",
      stock_quantity: 60,
      purchase_mode: "unit",
      purchase_price: 2200,
      purchasable: true,
    },
    {
      key: "vinagre-arroz",
      name: "Vinagre de arroz",
      unit: "l",
      stock_quantity: 15,
      purchase_mode: "unit",
      purchase_price: 3200,
      purchasable: true,
    },
    {
      key: "salmon",
      name: "Salmón fresco",
      unit: "porción",
      stock_quantity: 900,
      unit_weight_grams: 12,
      purchase_mode: "weight",
      purchase_price: 9800, // price per kilo -> cost_per_unit 117.6
      purchasable: true,
    },
    {
      key: "atun",
      name: "Atún fresco",
      unit: "g",
      stock_quantity: 4000,
      purchase_mode: "package",
      purchase_price: 8500,
      purchase_units: 1000, // -> cost_per_unit 8.5
      purchasable: true,
    },
    {
      key: "palta",
      name: "Palta",
      unit: "unidad",
      stock_quantity: 80,
      purchase_mode: "unit",
      purchase_price: 900,
      purchasable: true,
    },
    {
      key: "queso-philadelphia",
      name: "Queso philadelphia",
      unit: "g",
      stock_quantity: 6000,
      purchase_mode: "package",
      purchase_price: 4800,
      purchase_units: 1000, // -> cost_per_unit 4.8
      purchasable: false,
    },
    {
      key: "nori",
      name: "Nori (hojas de alga)",
      unit: "hoja",
      stock_quantity: 800,
      purchase_mode: "package",
      purchase_price: 3600,
      purchase_units: 50, // -> cost_per_unit 72
      purchasable: true,
    },
    {
      key: "panko",
      name: "Panko (pan rallado japonés)",
      unit: "g",
      stock_quantity: 5000,
      purchase_mode: "package",
      purchase_price: 2200,
      purchase_units: 1000, // -> cost_per_unit 2.2
      purchasable: false,
    },
    // ── Low stock (deliberate) ─────────────────────────────────────────
    {
      key: "langostinos",
      name: "Langostinos",
      unit: "unidad",
      stock_quantity: 90,
      purchase_mode: "package",
      purchase_price: 8200,
      purchase_units: 200, // -> cost_per_unit 41
      purchasable: true,
    },
    // ── end low stock ────────────────────────────────────────────────
    {
      key: "sesamo",
      name: "Sésamo tostado",
      unit: "g",
      stock_quantity: 3000,
      purchase_mode: "package",
      purchase_price: 2600,
      purchase_units: 500, // -> cost_per_unit 5.2
      purchasable: false,
    },
    {
      key: "salsa-soja",
      name: "Salsa de soja",
      unit: "l",
      stock_quantity: 20,
      purchase_mode: "unit",
      purchase_price: 2400,
      purchasable: true,
    },
    {
      key: "wasabi",
      name: "Wasabi",
      unit: "g",
      stock_quantity: 800,
      purchase_mode: "package",
      purchase_price: 1800,
      purchase_units: 100, // -> cost_per_unit 18
      purchasable: false,
    },
    {
      key: "jengibre",
      name: "Jengibre encurtido",
      unit: "g",
      stock_quantity: 1500,
      purchase_mode: "package",
      purchase_price: 2100,
      purchase_units: 300, // -> cost_per_unit 7
      purchasable: false,
    },
    {
      key: "aceite",
      name: "Aceite para frituras",
      unit: "l",
      stock_quantity: 25,
      purchase_mode: "unit",
      purchase_price: 2600,
      purchasable: true,
    },
    {
      key: "gyozas-prehechas",
      name: "Gyozas (pre-hechas)",
      unit: "unidad",
      stock_quantity: 300,
      purchase_mode: "package",
      purchase_price: 6600,
      purchase_units: 60, // -> cost_per_unit 110
      purchasable: true,
    },
  ],

  // ── Combos ──────────────────────────────────────────────────────────
  //
  // "burger" slots pick from the products array (unrestricted — no `allow`
  // possible there, matches every other authored preset). fries/drink/side
  // slots restrict via `allow` to keep the combo's identity coherent.
  combos: [
    {
      key: "combo-individual",
      name: "Combo Individual",
      description: "Combinado 8 piezas + bebida",
      price: 3900,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        { slot_type: "drink", quantity: 1, required: true, allow: ["te-verde", "agua-mineral", "gaseosa-350"] },
      ],
    },
    {
      key: "combo-para-dos",
      name: "Combo Para Dos",
      description: "Combinado 15 piezas + gyozas o sunomono + 2 bebidas",
      price: 9800,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        { slot_type: "fries", quantity: 1, required: true, allow: ["gyozas", "sunomono"] },
        {
          slot_type: "drink",
          quantity: 2,
          required: true,
          allow: ["te-verde", "agua-mineral", "gaseosa-350", "cerveza-japonesa"],
        },
      ],
    },
    {
      key: "combo-familiar",
      name: "Combo Familiar",
      description: "Combinado 25 piezas Familiar + gyozas + sopa miso + 2 bebidas",
      price: 13800,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        { slot_type: "fries", quantity: 1, required: true, allow: ["gyozas"] },
        { slot_type: "side", quantity: 1, required: true, allow: ["sopa-miso"] },
        {
          slot_type: "drink",
          quantity: 2,
          required: true,
          allow: ["te-verde", "agua-mineral", "gaseosa-350", "cerveza-japonesa"],
        },
      ],
    },
  ],

  // ── Restock purchase descriptions (per-preset) ─────────────────────
  expenseDescriptions: [
    "Compra semanal de salmón y atún fresco",
    "Reposición de arroz para sushi y vinagre de arroz",
    "Pedido de nori, panko y langostinos",
    "Compra de queso philadelphia y salsas importadas",
    "Reposición de bebidas y cerveza japonesa",
    "Pedido a distribuidora de insumos asiáticos",
  ],

  // ── External income descriptions (optional, per-preset) ────────────
  externalIncomeDescriptions: [
    "Catering de evento corporativo",
    "Pedido grande para cumpleaños",
    "Catering evento universitario",
    "Depósito anticipo catering",
    "Evento privado fin de semana",
  ],
};
