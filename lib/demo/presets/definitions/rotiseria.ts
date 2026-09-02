// Rotisería preset definition — Phase 4, sixth real vertical (plan
// §"Secuencia / Fase 4", following pizzeria.ts, cafeteria.ts, heladeria.ts,
// sushi.ts and churreria.ts as templates). Authored from scratch, same
// calibration discipline as its five predecessors.
//
// Price calibration (deliberate, not a mistake): real 2026 Buenos Aires
// rotisería prices (pollo al spiedo, milanesas) run higher than this file
// uses. Scaling to real-world pesos would look absurd next to the shared
// salary/rent figures in ../shared.ts, which are calibrated to
// hamburguesería's compressed price universe (burgers $4,500-$7,800, extras
// $350-$2,900, supply costs ~$900-$5,200/kg-equivalent). A rotisería sells
// prepared food by weight/portion, and a portion is comparably substantial
// to a burger meal, so the mainline items ($5,200-$7,900 for pollo/
// milanesas) sit directly inside hamburguesería's own band; smaller units
// (guarniciones, empanadas, tarta) stay in the $500-$1,800 range like a
// burger extra.
//
// DOMAIN MAPPING: the "meat" multiplier maps MOST LITERALLY of any vertical
// authored so far — directly to MEAT/CHICKEN PORTION COUNT, not a stand-in
// ingredient. "Medio pollo al spiedo" (default_meat_quantity: 1) and "Pollo
// entero al spiedo" (default_meat_quantity: 2) share the exact same pollo
// recipe line tagged scales_with: "meat" — the chicken line doubles
// automatically via resolveRecipeQuantities, exactly mirroring
// hamburguesería's own Doble Clásica (a burger's meat multiplier scaling a
// literal meat line). This is the cleanest "meat" mapping of any preset:
// every other vertical had to substitute cheese doses, scoops, piece-counts
// or dozens — here it's actually meat. The role: "meat-unit" extra is
// "Porción de pollo extra", tagged scales_with: "meat" on the same pollo
// supply, giving the wizard a real "pollo extra" upsell (plan's risk
// analysis names rotisería explicitly for this reason). The "fries"
// multiplier is NOT exercised by any product recipe line here (matches
// pizzería/cafetería/heladería/sushi/churrería precedent — none of them
// scale a product by "fries" either); the ExtraCategory slot it feeds is
// relabeled via categoryLabels.fries -> "Guarniciones" and holds "Papas al
// horno" (role: default-side) and "Puré de papas" — the ExtraCategory union
// value itself stays "fries", frozen at the type layer, only its label
// changes.
//
// Menu variety beyond pollo/milanesas: tarta de verdura (porción) and
// matambre relleno (porción) round out the menu as fixed specialty items,
// same convention as every other preset's fixed items alongside its scaling
// ladder.

import type { PresetDefinition } from "../types";

export const ROTISERIA_DEFINITION: PresetDefinition = {
  id: "rotiseria",
  label: "Rotisería",

  lexicon: {
    // "plato" (generic, m) instead of a single-food noun like "pizza"/
    // "helado": the products array holds pollo AND milanesas AND tartas, so
    // no single dish noun covers it — "plato" is the natural umbrella
    // ("Nuevo plato", "primer plato", "No hay platos", "Cantidad de
    // platos", "Carnes por plato" all read naturally in the ~25 call sites
    // that render preset.lexicon.product standalone, see menu/page.tsx,
    // combos/page.tsx, precios/page.tsx, order-wizard-drawer.tsx).
    product: { singular: "plato", plural: "platos", gender: "m", emoji: "🍽️" },
    // The role: "meat-unit" extra is "Porción de pollo extra" — this noun
    // is what edit-recipe-dialog.tsx / burger-item-card.tsx / the wizard
    // summary render next to the pollo-count scaling control.
    mainComponent: { singular: "porción de pollo", plural: "porciones de pollo", gender: "f", emoji: "🍗" },
    // The role: "default-side" extra is "Papas al horno".
    sideComponent: { singular: "papa al horno", plural: "papas al horno", gender: "f", emoji: "🥔" },
    categoryLabels: {
      extra: "Extras",
      drink: "Bebidas",
      fries: "Guarniciones",
      sides: "Para compartir",
    },
  },

  // ── Products ────────────────────────────────────────────────────────
  // Pollo entero/medio (the meat-scaling pair, literal meat this time) +
  // 3 milanesas + tarta + matambre relleno + plato del día, same 8-item
  // count discipline as every other authored preset.
  products: [
    {
      key: "medio-pollo",
      name: "Medio pollo al spiedo",
      description: "Medio pollo dorado al spiedo con limón y sal, servido con papas al horno",
      base_price: 5200,
      ingredients: ["Pollo", "Limón", "Sal", "Papas"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "pollo", quantity: 1, scales_with: "meat" },
        { supplyKey: "limon", quantity: 0.05 },
        { supplyKey: "sal", quantity: 5 },
        { supplyKey: "papas", quantity: 0.2 },
      ],
    },
    {
      key: "pollo-entero",
      name: "Pollo entero al spiedo",
      description: "Pollo entero dorado al spiedo, ideal para compartir, servido con papas al horno",
      base_price: 7900,
      ingredients: ["Pollo", "Limón", "Sal", "Papas"],
      default_meat_quantity: 2,
      default_fries_quantity: 1,
      // Same pollo/limón/sal/papas lines as Medio pollo — the pollo line
      // doubles automatically via scales_with: "meat" ×
      // default_meat_quantity: 2 (resolveRecipeQuantities). This is the
      // literal "medio pollo vs pollo entero" scaling the plan's domain
      // mapping calls for — the cleanest "meat" mapping of any preset
      // authored so far, since it's actual meat, not a stand-in.
      recipe: [
        { supplyKey: "pollo", quantity: 1, scales_with: "meat" },
        { supplyKey: "limon", quantity: 0.05 },
        { supplyKey: "sal", quantity: 5 },
        { supplyKey: "papas", quantity: 0.2 },
      ],
    },
    {
      key: "milanesa-simple",
      name: "Milanesa de carne simple",
      description: "Milanesa de carne empanada, servida con guarnición de papas",
      base_price: 5200,
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
      key: "milanesa-caballo",
      name: "Milanesa a caballo",
      description: "Milanesa de carne empanada coronada con huevo frito, servida con guarnición de papas",
      base_price: 5900,
      ingredients: ["Carne para milanesa", "Pan rallado", "Huevo", "Huevo frito", "Papas"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "carne-milanesa", quantity: 0.15 },
        { supplyKey: "pan-rallado", quantity: 40 },
        { supplyKey: "huevo", quantity: 1 }, // breading
        { supplyKey: "huevo", quantity: 1 }, // fried egg on top
        { supplyKey: "aceite", quantity: 0.06 },
        { supplyKey: "papas", quantity: 0.15 },
      ],
    },
    {
      key: "milanesa-napolitana",
      name: "Milanesa napolitana",
      description: "Milanesa de carne con salsa de tomate, jamón y queso gratinado, servida con guarnición de papas",
      base_price: 6700,
      ingredients: ["Carne para milanesa", "Pan rallado", "Huevo", "Jamón", "Queso", "Salsa de tomate", "Papas"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "carne-milanesa", quantity: 0.15 },
        { supplyKey: "pan-rallado", quantity: 40 },
        { supplyKey: "huevo", quantity: 1 },
        { supplyKey: "aceite", quantity: 0.05 },
        { supplyKey: "jamon", quantity: 3 },
        { supplyKey: "queso", quantity: 40 },
        { supplyKey: "salsa-tomate", quantity: 0.06 },
        { supplyKey: "papas", quantity: 0.15 },
      ],
    },
    {
      key: "tarta-verdura",
      name: "Tarta de verdura (porción)",
      description: "Porción de tarta de acelga y queso con masa casera",
      base_price: 3600,
      ingredients: ["Harina", "Huevo", "Verduras", "Queso"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // Fixed quantities — no scales_with, unlike the pollo pair: a slice
      // of tarta doesn't scale by meat portions.
      recipe: [
        { supplyKey: "harina", quantity: 0.1 },
        { supplyKey: "huevo", quantity: 1 },
        { supplyKey: "verduras-variadas", quantity: 0.15 },
        { supplyKey: "queso", quantity: 25 },
        { supplyKey: "aceite", quantity: 0.02 },
      ],
    },
    {
      key: "matambre-relleno",
      name: "Matambre relleno (porción)",
      description: "Porción de matambre relleno con huevo y verduras, cocido a fuego lento",
      base_price: 6900,
      ingredients: ["Matambre", "Huevo", "Verduras"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // matambre is the deliberately LOW-STOCK supply (see supplies below)
      // — this is the product whose calculateMakeableCount() lands in
      // [1,30] (check #6): stock 4kg / quantity 0.2kg = 20 (verified with a
      // scratch vitest computation, not eyeballed).
      recipe: [
        { supplyKey: "matambre", quantity: 0.2 },
        { supplyKey: "huevo", quantity: 1 },
        { supplyKey: "verduras-variadas", quantity: 0.08 },
        { supplyKey: "sal", quantity: 3 },
      ],
    },
    {
      key: "plato-del-dia",
      name: "Plato del día",
      description: "Combinación rotativa según lo que preparó el rotisero ese día",
      base_price: 5000,
      ingredients: ["Según disponibilidad del día"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // DELIBERATELY no recipe — the "sin receta" product that
      // summarizeRecipes().withoutRecipeCount needs to prove that state
      // isn't just theoretical (mirrors hamburguesería's Veggie / pizzería's
      // Pizza del día / cafetería's Té / heladería's Helado de Palta /
      // sushi's Sushi del chef / churrería's Docena sorpresa).
    },
  ],

  // ── Extras ──────────────────────────────────────────────────────────
  extras: [
    {
      key: "porcion-pollo-extra",
      name: "Porción de pollo extra",
      category: "extra",
      price: 2900,
      role: "meat-unit",
      recipe: [{ supplyKey: "pollo", quantity: 1 }],
    },
    {
      key: "salsa-criolla-extra",
      name: "Salsa criolla extra",
      category: "extra",
      price: 480,
      recipe: [{ supplyKey: "verduras-variadas", quantity: 0.05 }],
    },
    {
      key: "queso-rallado-extra",
      name: "Queso rallado extra",
      category: "extra",
      price: 550,
      recipe: [{ supplyKey: "queso", quantity: 30 }],
    },
    {
      key: "huevo-frito-extra",
      name: "Huevo frito extra",
      category: "extra",
      price: 500,
      recipe: [{ supplyKey: "huevo", quantity: 1 }],
    },

    { key: "gaseosa-500", name: "Gaseosa línea Coca-Cola 500ml", category: "drink", price: 1200 },
    { key: "agua-mineral", name: "Agua mineral 500ml", category: "drink", price: 800 },
    { key: "cerveza", name: "Cerveza Quilmes 1L", category: "drink", price: 2600 },
    { key: "vino-copa", name: "Copa de vino tinto", category: "drink", price: 1800 },

    {
      key: "papas-horno",
      name: "Papas al horno",
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
      recipe: [
        { supplyKey: "papas", quantity: 0.25 },
        { supplyKey: "leche", quantity: 0.05 },
      ],
    },

    {
      key: "empanadas-carne-x6",
      name: "Empanadas de carne (x6)",
      category: "sides",
      price: 2900,
      // No recipe — mirrors pizzería's "empanadas-jyq-x6" / sushi's
      // "salsa-teriyaki-extra" pattern of one item per category left
      // uncosted on purpose.
    },
    {
      key: "ensalada-mixta",
      name: "Ensalada mixta",
      category: "sides",
      price: 1600,
      recipe: [
        { supplyKey: "verduras-variadas", quantity: 0.2 },
        { supplyKey: "aceite", quantity: 0.02 },
      ],
    },
    {
      key: "pan-casero",
      name: "Pan casero (unidad)",
      category: "sides",
      price: 700,
      recipe: [{ supplyKey: "harina", quantity: 0.15 }],
    },
  ],

  // ── Supplies ────────────────────────────────────────────────────────
  //
  // Three purchase modes covered: unit (carne-milanesa, aceite, papas,
  // harina, verduras-variadas, salsa-tomate, matambre, limon, leche),
  // package (pan-rallado, huevo, jamon, queso, sal), and weight (pollo —
  // modeled exactly like hamburguesería's medallón / pizzería's muzzarella
  // / heladería's base-crema / sushi's salmón: bought by the kilo, tracked
  // in discrete "porción" units of unit_weight_grams each, and the recipe
  // lines reference it in porciones scaled by default_meat_quantity).
  //
  // matambre is deliberately LOW on stock (4kg) so calculateMakeableCount
  // reports a "makeable" count of 20 for Matambre relleno (4 / 0.2 = 20 —
  // verified with a scratch vitest computation, not eyeballed). 12 of 15
  // flagged purchasable: true for the expense-generation feed.
  supplies: [
    {
      key: "pollo",
      name: "Pollo entero (crudo)",
      unit: "porción",
      stock_quantity: 90,
      unit_weight_grams: 850,
      purchase_mode: "weight",
      purchase_price: 1800, // price per kilo -> cost_per_unit 1530
      purchasable: true,
    },
    {
      key: "carne-milanesa",
      name: "Carne para milanesa",
      unit: "kg",
      stock_quantity: 40,
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
      purchasable: true,
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
      key: "papas",
      name: "Papas",
      unit: "kg",
      stock_quantity: 70,
      purchase_mode: "unit",
      purchase_price: 900,
      purchasable: true,
    },
    {
      key: "harina",
      name: "Harina 000",
      unit: "kg",
      stock_quantity: 35,
      purchase_mode: "unit",
      purchase_price: 750,
      purchasable: true,
    },
    {
      key: "jamon",
      name: "Jamón cocido",
      unit: "fetas",
      stock_quantity: 400,
      purchase_mode: "package",
      purchase_price: 4800,
      purchase_units: 100, // -> cost_per_unit 48
      purchasable: false,
    },
    {
      key: "queso",
      name: "Queso de máquina",
      unit: "g",
      stock_quantity: 5000,
      purchase_mode: "package",
      purchase_price: 5400,
      purchase_units: 1000, // -> cost_per_unit 5.4
      purchasable: false,
    },
    {
      key: "verduras-variadas",
      name: "Verduras variadas",
      unit: "kg",
      stock_quantity: 22,
      purchase_mode: "unit",
      purchase_price: 1200,
      purchasable: true,
    },
    {
      key: "salsa-tomate",
      name: "Salsa de tomate",
      unit: "kg",
      stock_quantity: 18,
      purchase_mode: "unit",
      purchase_price: 1400,
      purchasable: true,
    },
    {
      key: "sal",
      name: "Sal fina",
      unit: "g",
      stock_quantity: 4000,
      purchase_mode: "package",
      purchase_price: 1600,
      purchase_units: 1000, // -> cost_per_unit 1.6
      purchasable: false,
    },
    // ── Low stock (deliberate) ─────────────────────────────────────────
    {
      key: "matambre",
      name: "Matambre",
      unit: "kg",
      stock_quantity: 4,
      purchase_mode: "unit",
      purchase_price: 5200,
      purchasable: true,
    },
    // ── end low stock ────────────────────────────────────────────────
    {
      key: "limon",
      name: "Limón",
      unit: "kg",
      stock_quantity: 10,
      purchase_mode: "unit",
      purchase_price: 1100,
      purchasable: true,
    },
    {
      key: "leche",
      name: "Leche",
      unit: "l",
      stock_quantity: 18,
      purchase_mode: "unit",
      purchase_price: 1400,
      purchasable: true,
    },
  ],

  // ── Combos ──────────────────────────────────────────────────────────
  //
  // "burger" slots pick from the products array (unrestricted — no `allow`
  // possible there, matches every other authored preset). fries/drink slots
  // restrict via `allow` to keep the combo's identity coherent.
  combos: [
    {
      key: "combo-individual",
      name: "Combo Individual",
      description: "Milanesa a elección + guarnición + bebida",
      price: 7200,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        { slot_type: "fries", quantity: 1, required: true, allow: ["papas-horno", "pure-papas"] },
        { slot_type: "drink", quantity: 1, required: true, allow: ["gaseosa-500", "agua-mineral"] },
      ],
    },
    {
      key: "combo-familiar",
      name: "Combo Familiar",
      description: "Pollo entero al spiedo + 2 guarniciones + 2 bebidas",
      price: 12800,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 2 },
        { slot_type: "fries", quantity: 2, required: true, allow: ["papas-horno", "pure-papas"] },
        {
          slot_type: "drink",
          quantity: 2,
          required: true,
          allow: ["gaseosa-500", "agua-mineral", "cerveza", "vino-copa"],
        },
      ],
    },
    {
      key: "combo-oficina",
      name: "Combo Oficina",
      description: "Tarta de verdura a elección + bebida",
      price: 4800,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        { slot_type: "drink", quantity: 1, required: true, allow: ["gaseosa-500", "agua-mineral"] },
      ],
    },
  ],

  // ── Restock purchase descriptions (per-preset) ─────────────────────
  expenseDescriptions: [
    "Compra semanal de pollo y carne para milanesas",
    "Reposición de pan rallado y aceite para freír",
    "Compra de fiambres y quesos",
    "Pedido de verduras frescas para tartas y guarniciones",
    "Compra de bebidas y cerveza",
    "Pedido a distribuidora de insumos",
  ],

  // ── External income descriptions (optional, per-preset) ────────────
  externalIncomeDescriptions: [
    "Catering evento corporativo",
    "Pedido grande para cumpleaños",
    "Catering evento universitario",
    "Depósito anticipo catering",
    "Evento privado fin de semana",
  ],
};
