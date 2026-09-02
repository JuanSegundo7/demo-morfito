// Parrilla preset definition — Phase 4, SEVENTH and FINAL real vertical (plan
// §"Secuencia / Fase 4", following pizzeria.ts, cafeteria.ts, heladeria.ts,
// sushi.ts, churreria.ts and rotiseria.ts as templates). Authored from
// scratch, same calibration discipline as its six predecessors. Once this
// file lands and registry.ts's `parrilla` entry points at it, all 8 presets
// (hamburgueseria + 7 authored verticals) have real content.
//
// Price calibration (deliberate, not a mistake): real 2026 Buenos Aires
// parrilla prices (individual cuts, and especially a shared parrillada) run
// much higher than this file uses. Scaling to real-world pesos would look
// absurd next to the shared salary/rent figures in ../shared.ts, which are
// calibrated to hamburguesería's compressed price universe (burgers
// $4,500-$7,800, extras $350-$2,900, supply costs ~$900-$5,200/
// kg-equivalent). A parrilla sells substantial cuts with guarnición, so
// individual cuts/milanesas track hamburguesería's own band directly
// ($4,500-$6,900), and the one shared item — Parrillada para 2 — sits at the
// TOP of that band ($9,400) rather than a real-world parrillada's $20k+,
// mirroring how sushi's biggest combinado ($8,900) tops out its own band
// instead of chasing real combo prices.
//
// DOMAIN MAPPING (plan §5 names parrilla explicitly for this): "porción
// simple vs doble" — the cleaner option the plan itself calls out, given
// parrilla's cut variety makes a single product's "simple/doble" naming pair
// (like hamburguesería's own Clásica/Doble) awkward to generalize across 4
// different cuts. Instead: "Bife de chorizo" (default_meat_quantity: 1) and
// "Parrillada para 2" (default_meat_quantity: 2) share the IDENTICAL
// bife-de-chorizo recipe line tagged scales_with: "meat" — the base-cut line
// doubles automatically via resolveRecipeQuantities, exactly mirroring
// rotisería's medio/entero pollo pairing and sushi's combinado ladder. This
// is the plan's own suggested mapping: "meat" = literal cut weight/portion
// count, not a stand-in ingredient. Parrillada para 2 additionally carries
// FIXED (non-scaling) lines for chorizo, morcilla and vacío, representing
// the "surtido" nature of a shared platter — only the bife-de-chorizo line
// is the scaling exercise; the rest is realism, not part of check #5. The
// role: "meat-unit" extra is "Porción de carne extra", tagged
// scales_with: "meat" is NOT needed on the extra itself (extras never scale,
// per costing.ts's scalingFactor) but it references the same bife-de-chorizo
// supply, giving the wizard a real "corte extra" upsell (the plan's risk
// analysis names parrilla explicitly for this). The "fries" multiplier is
// NOT exercised by any product recipe line here (matches every other
// authored preset's precedent — none of them scale a product by "fries"
// either); the ExtraCategory slot it feeds keeps its categoryLabels.fries ->
// "Guarniciones" relabeling and holds "Papas fritas" (role: "default-side")
// and "Puré de papas" — the ExtraCategory union value itself stays "fries",
// frozen at the type layer, only its label changes.
//
// Menu variety beyond the cut ladder: Choripán (a lower-ticket sandwich
// item, like every other preset's cheaper anchor), Milanesa de carne (a la
// parrilla — most parrillas carry at least one milanesa), and Corte del día
// (the "sin receta" item) round out the menu.

import type { PresetDefinition } from "../types";

export const PARRILLA_DEFINITION: PresetDefinition = {
  id: "parrilla",
  label: "Parrilla",

  lexicon: {
    // "corte" (generic-but-accurate, m): most products in this preset ARE
    // literally cuts of meat (bife, entraña, vacío, asado), so — unlike
    // rotisería's "plato" umbrella, needed because pollo/milanesas/tarta
    // share no single noun — "corte" fits the majority of the menu
    // naturally ("Nuevo corte", "primer corte", "No hay cortes", "Cantidad
    // de cortes" all read naturally in the ~25 call sites that render
    // preset.lexicon.product standalone: menu/page.tsx, combos/page.tsx,
    // precios/page.tsx, order-wizard-drawer.tsx). It stretches slightly for
    // Choripán/Parrillada/Corte del día, same acceptable looseness as
    // rotisería's "plato" stretching to cover tarta de verdura.
    product: { singular: "corte", plural: "cortes", gender: "m", emoji: "🥩" },
    // The role: "meat-unit" extra is "Porción de carne extra" — this noun is
    // what edit-recipe-dialog.tsx / burger-item-card.tsx / the wizard
    // summary render next to the bife-de-chorizo-ración scaling control.
    mainComponent: { singular: "porción de carne", plural: "porciones de carne", gender: "f", emoji: "🍖" },
    // The role: "default-side" extra is "Papas fritas" — parrillas
    // genuinely serve papas fritas as the standard guarnición, so this one
    // (unlike rotisería/churrería's fries-analog) needs no relabeling away
    // from the literal noun.
    sideComponent: { singular: "papa frita", plural: "papas fritas", gender: "f", emoji: "🍟" },
    categoryLabels: {
      extra: "Extras",
      drink: "Bebidas",
      fries: "Guarniciones",
      sides: "Para compartir",
    },
  },

  // ── Products ────────────────────────────────────────────────────────
  // Bife de chorizo / Parrillada para 2 (the meat-scaling pair, sharing the
  // identical bife-de-chorizo line) + 3 more individual cuts (entraña,
  // vacío, asado de tira) + choripán + milanesa + corte del día, same 8-item
  // count discipline as every other authored preset.
  products: [
    {
      key: "bife-simple",
      name: "Bife de chorizo",
      description: "Bife de chorizo a la parrilla, servido con guarnición de papas",
      base_price: 5900,
      ingredients: ["Bife de chorizo", "Sal parrillera", "Papas"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "bife-de-chorizo", quantity: 1, scales_with: "meat" },
        { supplyKey: "sal-parrillera", quantity: 8 },
        { supplyKey: "papas", quantity: 0.2 },
      ],
    },
    {
      key: "parrillada-para-2",
      name: "Parrillada para 2",
      description: "Bife de chorizo, vacío, chorizo y morcilla para compartir, servida con guarnición de papas",
      base_price: 9400,
      ingredients: ["Bife de chorizo", "Vacío", "Chorizo", "Morcilla", "Papas"],
      default_meat_quantity: 2,
      default_fries_quantity: 1,
      // Same bife-de-chorizo line as Bife de chorizo — doubles automatically
      // via scales_with: "meat" × default_meat_quantity: 2
      // (resolveRecipeQuantities). This is the plan's own "porción simple
      // vs doble" domain mapping (§5), the cleanest way to exercise the
      // meat-scaling demo without forcing every cut into a simple/doble
      // pair. chorizo/morcilla/vacío below are FIXED (no scales_with) —
      // they represent the platter's surtido, not part of the scaling
      // exercise.
      recipe: [
        { supplyKey: "bife-de-chorizo", quantity: 1, scales_with: "meat" },
        { supplyKey: "chorizo-parrillero", quantity: 0.3 },
        { supplyKey: "morcilla", quantity: 0.2 },
        { supplyKey: "vacio", quantity: 0.25 },
        { supplyKey: "papas", quantity: 0.4 },
      ],
    },
    {
      key: "entrana-simple",
      name: "Entraña",
      description: "Entraña a la parrilla, servida con guarnición de papas",
      base_price: 6300,
      ingredients: ["Entraña", "Sal parrillera", "Papas"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // entrana is the deliberately LOW-STOCK supply (see supplies below) —
      // this is the product whose calculateMakeableCount() lands in [1,30]
      // (check #6): stock 6kg / quantity 0.3kg = 20 (verified with a
      // scratch vitest computation, not eyeballed).
      recipe: [
        { supplyKey: "entrana", quantity: 0.3 },
        { supplyKey: "sal-parrillera", quantity: 8 },
        { supplyKey: "papas", quantity: 0.2 },
      ],
    },
    {
      key: "vacio-simple",
      name: "Vacío",
      description: "Vacío a la parrilla, servido con guarnición de papas",
      base_price: 6900,
      ingredients: ["Vacío", "Sal parrillera", "Papas"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "vacio", quantity: 0.35 },
        { supplyKey: "sal-parrillera", quantity: 8 },
        { supplyKey: "papas", quantity: 0.2 },
      ],
    },
    {
      key: "asado-simple",
      name: "Asado de tira",
      description: "Asado de tira a la parrilla, servido con guarnición de papas",
      base_price: 6500,
      ingredients: ["Asado de tira", "Sal parrillera", "Papas"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "asado-de-tira", quantity: 0.45 },
        { supplyKey: "sal-parrillera", quantity: 8 },
        { supplyKey: "papas", quantity: 0.2 },
      ],
    },
    {
      key: "choripan",
      name: "Choripán",
      description: "Chorizo parrillero en pan casero, con chimichurri a gusto",
      base_price: 4500,
      ingredients: ["Chorizo parrillero", "Pan para choripán"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // Fixed quantities — no scales_with, unlike the bife pair: a
      // choripán doesn't scale by meat portions.
      recipe: [
        { supplyKey: "chorizo-parrillero", quantity: 0.12 },
        { supplyKey: "pan-choripan", quantity: 1 },
      ],
    },
    {
      key: "milanesa-parrillera",
      name: "Milanesa de carne (a la parrilla)",
      description: "Milanesa de carne empanada, servida con guarnición de papas",
      base_price: 5700,
      ingredients: ["Carne para milanesa", "Pan rallado", "Huevo", "Papas"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "carne-milanesa", quantity: 0.15 },
        { supplyKey: "pan-rallado", quantity: 40 },
        { supplyKey: "huevo", quantity: 1 },
        { supplyKey: "aceite", quantity: 0.05 },
        { supplyKey: "papas", quantity: 0.15 },
      ],
    },
    {
      key: "corte-del-dia",
      name: "Corte del día",
      description: "El mejor corte disponible ese día, según lo que trajo el proveedor",
      base_price: 5500,
      ingredients: ["Según disponibilidad del día"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // DELIBERATELY no recipe — the "sin receta" product that
      // summarizeRecipes().withoutRecipeCount needs to prove that state
      // isn't just theoretical (mirrors hamburguesería's Veggie / pizzería's
      // Pizza del día / cafetería's Té / heladería's Helado de Palta /
      // sushi's Sushi del chef / churrería's Docena sorpresa / rotisería's
      // Plato del día).
    },
  ],

  // ── Extras ──────────────────────────────────────────────────────────
  extras: [
    {
      key: "porcion-carne-extra",
      name: "Porción de carne extra",
      category: "extra",
      price: 3400,
      role: "meat-unit",
      recipe: [{ supplyKey: "bife-de-chorizo", quantity: 1 }],
    },
    {
      key: "provoleta",
      name: "Provoleta",
      category: "extra",
      price: 1900,
      recipe: [{ supplyKey: "queso-provolone", quantity: 150 }],
    },
    {
      key: "chimichurri-extra",
      name: "Chimichurri extra",
      category: "extra",
      price: 350,
      // No recipe — mirrors sushi's "salsa-teriyaki-extra" / rotisería's
      // "empanadas-carne-x6" pattern of one item left uncosted on purpose.
    },
    {
      key: "morcilla-extra",
      name: "Morcilla extra",
      category: "extra",
      price: 1600,
      recipe: [{ supplyKey: "morcilla", quantity: 0.15 }],
    },

    { key: "vino-copa", name: "Copa de vino tinto", category: "drink", price: 1800 },
    { key: "gaseosa-500", name: "Gaseosa línea Coca-Cola 500ml", category: "drink", price: 1200 },
    { key: "agua-mineral", name: "Agua mineral 500ml", category: "drink", price: 800 },
    { key: "cerveza", name: "Cerveza Quilmes 1L", category: "drink", price: 2600 },

    {
      key: "papas-fritas",
      name: "Papas fritas",
      category: "fries",
      price: 900,
      role: "default-side",
      recipe: [
        { supplyKey: "papas", quantity: 0.25 },
        { supplyKey: "aceite", quantity: 0.02 },
      ],
    },
    {
      key: "pure-papas",
      name: "Puré de papas",
      category: "fries",
      price: 850,
      recipe: [{ supplyKey: "papas", quantity: 0.25 }],
    },

    {
      key: "ensalada-mixta",
      name: "Ensalada mixta",
      category: "sides",
      price: 1600,
      recipe: [
        { supplyKey: "verduras-ensalada", quantity: 0.2 },
        { supplyKey: "aceite", quantity: 0.02 },
      ],
    },
    {
      key: "empanadas-carne-x6",
      name: "Empanadas de carne (x6)",
      category: "sides",
      price: 2900,
      // No recipe — same "one uncosted item per category" convention as
      // pizzería/sushi/rotisería.
    },
  ],

  // ── Supplies ────────────────────────────────────────────────────────
  //
  // Three purchase modes covered: unit (entrana, vacio, asado-de-tira,
  // chorizo-parrillero, morcilla, carne-milanesa, aceite, papas,
  // verduras-ensalada), package (pan-choripan, pan-rallado, huevo,
  // sal-parrillera, queso-provolone), and weight (bife-de-chorizo — modeled
  // exactly like hamburguesería's medallón / rotisería's pollo / sushi's
  // salmón: bought by the kilo, tracked in discrete "porción" units of
  // unit_weight_grams each, and the recipe lines reference it in porciones
  // scaled by default_meat_quantity).
  //
  // entrana is deliberately LOW on stock (6kg) so calculateMakeableCount
  // reports a "makeable" count of 20 for Entraña (6 / 0.3 = 20 — verified
  // with a scratch vitest computation, not eyeballed). 12 of 15 flagged
  // purchasable: true for the expense-generation feed.
  supplies: [
    {
      key: "bife-de-chorizo",
      name: "Bife de chorizo (crudo)",
      unit: "porción",
      stock_quantity: 900,
      unit_weight_grams: 350,
      purchase_mode: "weight",
      purchase_price: 6800, // price per kilo -> cost_per_unit 2380
      purchasable: true,
    },
    // ── Low stock (deliberate) ─────────────────────────────────────────
    {
      key: "entrana",
      name: "Entraña",
      unit: "kg",
      stock_quantity: 6,
      purchase_mode: "unit",
      purchase_price: 7200,
      purchasable: true,
    },
    // ── end low stock ────────────────────────────────────────────────
    {
      key: "vacio",
      name: "Vacío",
      unit: "kg",
      stock_quantity: 35,
      purchase_mode: "unit",
      purchase_price: 6200,
      purchasable: true,
    },
    {
      key: "asado-de-tira",
      name: "Asado de tira",
      unit: "kg",
      stock_quantity: 30,
      purchase_mode: "unit",
      purchase_price: 4800,
      purchasable: true,
    },
    {
      key: "chorizo-parrillero",
      name: "Chorizo parrillero",
      unit: "kg",
      stock_quantity: 40,
      purchase_mode: "unit",
      purchase_price: 3800,
      purchasable: true,
    },
    {
      key: "morcilla",
      name: "Morcilla",
      unit: "kg",
      stock_quantity: 25,
      purchase_mode: "unit",
      purchase_price: 3200,
      purchasable: true,
    },
    {
      key: "pan-choripan",
      name: "Pan para choripán",
      unit: "unidad",
      stock_quantity: 300,
      purchase_mode: "package",
      purchase_price: 2400,
      purchase_units: 20, // -> cost_per_unit 120
      purchasable: true,
    },
    {
      key: "carne-milanesa",
      name: "Carne para milanesa",
      unit: "kg",
      stock_quantity: 35,
      purchase_mode: "unit",
      purchase_price: 5200,
      purchasable: true,
    },
    {
      key: "pan-rallado",
      name: "Pan rallado",
      unit: "g",
      stock_quantity: 8000,
      purchase_mode: "package",
      purchase_price: 1800,
      purchase_units: 1000, // -> cost_per_unit 1.8
      purchasable: false,
    },
    {
      key: "huevo",
      name: "Huevo",
      unit: "unidad",
      stock_quantity: 480,
      purchase_mode: "package",
      purchase_price: 4200,
      purchase_units: 30, // -> cost_per_unit 140
      purchasable: true,
    },
    {
      key: "aceite",
      name: "Aceite",
      unit: "l",
      stock_quantity: 25,
      purchase_mode: "unit",
      purchase_price: 2600,
      purchasable: true,
    },
    {
      key: "sal-parrillera",
      name: "Sal parrillera",
      unit: "g",
      stock_quantity: 4000,
      purchase_mode: "package",
      purchase_price: 1600,
      purchase_units: 1000, // -> cost_per_unit 1.6
      purchasable: false,
    },
    {
      key: "papas",
      name: "Papas",
      unit: "kg",
      stock_quantity: 70,
      purchase_mode: "unit",
      purchase_price: 900,
      purchasable: true,
    },
    {
      key: "verduras-ensalada",
      name: "Lechuga y tomate",
      unit: "kg",
      stock_quantity: 22,
      purchase_mode: "unit",
      purchase_price: 1200,
      purchasable: true,
    },
    {
      key: "queso-provolone",
      name: "Queso provolone",
      unit: "g",
      stock_quantity: 6000,
      purchase_mode: "package",
      purchase_price: 4800,
      purchase_units: 1000, // -> cost_per_unit 4.8
      purchasable: false,
    },
  ],

  // ── Combos ──────────────────────────────────────────────────────────
  //
  // "burger" slots pick from the products array (unrestricted — no `allow`
  // possible there, matches every other authored preset). fries/drink slots
  // restrict via `allow` to keep the combo's identity coherent.
  combos: [
    {
      key: "combo-choripan",
      name: "Combo Choripán",
      description: "Choripán + bebida",
      price: 4900,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        { slot_type: "drink", quantity: 1, required: true, allow: ["gaseosa-500", "agua-mineral"] },
      ],
    },
    {
      key: "combo-ejecutivo",
      name: "Combo Ejecutivo",
      description: "Corte a elección + guarnición + bebida",
      price: 8200,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        { slot_type: "fries", quantity: 1, required: true, allow: ["papas-fritas", "pure-papas"] },
        { slot_type: "drink", quantity: 1, required: true, allow: ["gaseosa-500", "agua-mineral"] },
      ],
    },
    {
      key: "combo-parrillada",
      name: "Combo Parrillada para 2",
      description: "Parrillada para 2 + 2 guarniciones + 2 bebidas",
      price: 13800,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 2 },
        { slot_type: "fries", quantity: 2, required: true, allow: ["papas-fritas", "pure-papas"] },
        {
          slot_type: "drink",
          quantity: 2,
          required: true,
          allow: ["gaseosa-500", "agua-mineral", "cerveza", "vino-copa"],
        },
      ],
    },
  ],

  // ── Restock purchase descriptions (per-preset) ─────────────────────
  expenseDescriptions: [
    "Compra semanal de cortes de carne (bife, vacío, asado, entraña)",
    "Reposición de chorizo y morcilla para choripanes y parrilladas",
    "Compra de pan para choripán y pan rallado para milanesas",
    "Pedido de papas y verduras frescas",
    "Compra de bebidas, vino y cerveza",
    "Pedido a distribuidora de insumos",
  ],

  // ── External income descriptions (optional, per-preset) ────────────
  externalIncomeDescriptions: [
    "Catering evento corporativo",
    "Parrillada para cumpleaños",
    "Catering evento universitario",
    "Depósito anticipo catering",
    "Evento privado fin de semana",
  ],
};
