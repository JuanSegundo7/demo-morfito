// Churrería preset definition — Phase 4, fifth real vertical (plan §"Secuencia
// / Fase 4", following pizzeria.ts, cafeteria.ts, heladeria.ts and sushi.ts as
// templates). Authored from scratch, same calibration discipline as its four
// predecessors.
//
// Price calibration (deliberate, not a mistake): a churrería is naturally
// LOW-ticket-per-unit, high-volume (plan §5's risk analysis names churrería
// explicitly among the fries-analog examples — "churros sueltos"). Scaling to
// real-world pesos would look absurd next to the shared salary/rent figures
// in ../shared.ts, which are calibrated to hamburguesería's compressed price
// universe (burgers $4,500-$7,800, extras $350-$2,900, supply costs
// ~$900-$5,200/kg-equivalent). Individual churros stay cheap per unit
// (~$400-550/churro, well under a burger), docenas with filling climb into
// burger-comparable territory ($3,300-$6,300), and only the group combo
// approaches the top of the band ($7,200, under the $7,800 ceiling).
//
// DOMAIN MAPPING: products are modeled as CHURROS BY FILL/QUANTITY TIER — the
// same idea heladería used for kg and sushi used for piece-count. The "meat"
// multiplier maps to the CHURRO-COUNT/DOZEN-SCALING itself, not a single
// ingredient dose: "Media docena extra" (role: meat-unit) is tagged
// scales_with: "meat" on the base masa (harina) and aceite recipe lines, and
// default_meat_quantity counts how many "medias docenas" (half-dozens) a
// product represents —
//   Media docena de churros simples: default_meat_quantity 1 -> 1 media docena (6)
//   Docena de churros simples:       default_meat_quantity 2 -> 2 medias docenas (12)
// — the same masa/aceite recipe lines doubling automatically
// (resolveRecipeQuantities), exactly the "media docena extra" upsell the
// plan's domain-mapping guidance calls for. The "fries" multiplier is NOT
// exercised by any product recipe line here (matches pizzería/cafetería/
// heladería/sushi precedent — none of them scale a product by "fries"
// either); the ExtraCategory slot it feeds is relabeled via
// categoryLabels.fries -> "Para dipear" and holds "Dulce de leche para
// dipear" (role: default-side) and "Chocolate para dipear" — dips, never
// "Papas"/"Fainá"/"Coberturas"/"Acompañamientos" (those belong to other
// verticals). The ExtraCategory union value itself stays "fries", frozen at
// the type layer — only its label changes.
//
// Menu variety beyond churros: two other fried-dough items (buñuelos de
// manzana, facturas fritas) live as `sides` extras, not products — mirrors
// every other preset's convention of putting bulk shareable items
// (empanadas/facturas/sandwiches/edamame) in `extras`, not `products`.
//
// Drinks lean hot (chocolate caliente, café) since a churrería's natural
// drink pairing is a hot beverage, not a cold one — both have real recipes
// (chocolate-taza / cafe-molido), while the two bottled drinks (gaseosa,
// agua mineral) stay recipe-less like every other preset's bottled drinks.

import type { PresetDefinition } from "../types";

export const CHURRERIA_DEFINITION: PresetDefinition = {
  id: "churreria",
  label: "Churrería",

  lexicon: {
    product: { singular: "churro", plural: "churros", gender: "m", emoji: "🥖" },
    // The role: "meat-unit" extra is "Media docena extra" — this noun is
    // what edit-recipe-dialog.tsx / burger-item-card.tsx / the wizard
    // summary render next to the half-dozen-count scaling control.
    mainComponent: { singular: "media docena", plural: "medias docenas", gender: "f", emoji: "📦" },
    // The role: "default-side" extra is "Dulce de leche para dipear".
    sideComponent: { singular: "dulce de leche", plural: "dulces de leche", gender: "m", emoji: "🍯" },
    categoryLabels: {
      extra: "Extras",
      drink: "Bebidas",
      fries: "Para dipear",
      sides: "Para compartir",
    },
  },

  // ── Products ────────────────────────────────────────────────────────
  // Two scaling tiers (media docena / docena, sharing one masa+aceite
  // recipe) x simple/relleno, plus three fixed specialty items, same
  // 7-item count discipline as the other authored presets.
  products: [
    {
      key: "media-docena-simple",
      name: "Media docena de churros simples",
      description: "6 churros clásicos, fritos y pasados por azúcar y canela",
      base_price: 2500,
      ingredients: ["Harina", "Aceite", "Azúcar", "Canela"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "harina", quantity: 0.25, scales_with: "meat" },
        { supplyKey: "aceite-friar", quantity: 0.5, scales_with: "meat" },
        { supplyKey: "azucar", quantity: 0.05, scales_with: "meat" },
        { supplyKey: "canela", quantity: 6, scales_with: "meat" },
        { supplyKey: "sal", quantity: 0.003 },
        { supplyKey: "polvo-hornear", quantity: 3 },
      ],
    },
    {
      key: "docena-simple",
      name: "Docena de churros simples",
      description: "12 churros clásicos, fritos y pasados por azúcar y canela",
      base_price: 4600,
      ingredients: ["Harina", "Aceite", "Azúcar", "Canela"],
      default_meat_quantity: 2,
      default_fries_quantity: 1,
      // Same masa/aceite lines as Media docena — doubles automatically via
      // scales_with: "meat" × default_meat_quantity: 2
      // (resolveRecipeQuantities). This is the literal "media docena extra"
      // upsell the plan's domain-mapping guidance calls for.
      recipe: [
        { supplyKey: "harina", quantity: 0.25, scales_with: "meat" },
        { supplyKey: "aceite-friar", quantity: 0.5, scales_with: "meat" },
        { supplyKey: "azucar", quantity: 0.05, scales_with: "meat" },
        { supplyKey: "canela", quantity: 6, scales_with: "meat" },
        { supplyKey: "sal", quantity: 0.003 },
        { supplyKey: "polvo-hornear", quantity: 3 },
      ],
    },
    {
      key: "media-docena-rellena-dulce-de-leche",
      name: "Media docena rellenos (dulce de leche)",
      description: "6 churros rellenos de dulce de leche, fritos y pasados por azúcar y canela",
      base_price: 3300,
      ingredients: ["Harina", "Aceite", "Azúcar", "Canela", "Dulce de leche"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // dulce-de-leche is the deliberately LOW-STOCK supply (see supplies
      // below) — this is the product whose calculateMakeableCount() lands
      // in [1,30] (check #6): stock 900 / quantity 90 = 10 (verified with a
      // scratch vitest computation, not eyeballed).
      recipe: [
        { supplyKey: "harina", quantity: 0.25, scales_with: "meat" },
        { supplyKey: "aceite-friar", quantity: 0.5, scales_with: "meat" },
        { supplyKey: "azucar", quantity: 0.05, scales_with: "meat" },
        { supplyKey: "canela", quantity: 6, scales_with: "meat" },
        { supplyKey: "dulce-de-leche", quantity: 90 },
        { supplyKey: "sal", quantity: 0.003 },
      ],
    },
    {
      key: "docena-rellenos-surtidos",
      name: "Docena rellenos surtidos",
      description: "12 churros rellenos, mitad dulce de leche y mitad crema pastelera",
      base_price: 6300,
      ingredients: ["Harina", "Aceite", "Azúcar", "Canela", "Dulce de leche", "Crema pastelera"],
      default_meat_quantity: 2,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "harina", quantity: 0.25, scales_with: "meat" },
        { supplyKey: "aceite-friar", quantity: 0.5, scales_with: "meat" },
        { supplyKey: "azucar", quantity: 0.05, scales_with: "meat" },
        { supplyKey: "canela", quantity: 6, scales_with: "meat" },
        { supplyKey: "dulce-de-leche", quantity: 90 },
        { supplyKey: "crema-pastelera", quantity: 90 },
        { supplyKey: "sal", quantity: 0.003 },
      ],
    },
    {
      key: "churro-gigante-relleno",
      name: "Churro gigante relleno",
      description: "Un churro XL relleno de dulce de leche, para compartir o no",
      base_price: 1900,
      ingredients: ["Harina", "Aceite", "Azúcar", "Canela", "Dulce de leche"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      // Fixed quantities — no scales_with, unlike the docena tiers: one
      // giant churro doesn't scale by half-dozen.
      recipe: [
        { supplyKey: "harina", quantity: 0.08 },
        { supplyKey: "aceite-friar", quantity: 0.15 },
        { supplyKey: "azucar", quantity: 0.02 },
        { supplyKey: "canela", quantity: 2 },
        { supplyKey: "dulce-de-leche", quantity: 40 },
      ],
    },
    {
      key: "chocotorta-churros",
      name: "Chocotorta de churros (para compartir)",
      description: "Churros troceados, dulce de leche, chocolate y un toque de leche",
      base_price: 5800,
      ingredients: ["Churros", "Dulce de leche", "Chocolate", "Leche"],
      default_meat_quantity: 1,
      default_fries_quantity: 1,
      recipe: [
        { supplyKey: "harina", quantity: 0.15 },
        { supplyKey: "aceite-friar", quantity: 0.25 },
        { supplyKey: "dulce-de-leche", quantity: 120 },
        { supplyKey: "chocolate-taza", quantity: 2 },
        { supplyKey: "leche", quantity: 0.05 },
      ],
    },
    {
      key: "churro-sorpresa",
      name: "Docena sorpresa (según el relleno del día)",
      description: "12 churros con el relleno que decida el churrero ese día",
      base_price: 5200,
      ingredients: ["Según relleno disponible del día"],
      default_meat_quantity: 2,
      default_fries_quantity: 1,
      // DELIBERATELY no recipe — the "sin receta" product that
      // summarizeRecipes().withoutRecipeCount needs to prove that state
      // isn't just theoretical (mirrors hamburguesería's Veggie / pizzería's
      // Pizza del día / cafetería's Té / heladería's Helado de Palta /
      // sushi's Sushi del chef).
    },
  ],

  // ── Extras ──────────────────────────────────────────────────────────
  extras: [
    {
      key: "media-docena-extra",
      name: "Media docena extra",
      category: "extra",
      price: 2200,
      role: "meat-unit",
      recipe: [
        { supplyKey: "harina", quantity: 0.25 },
        { supplyKey: "aceite-friar", quantity: 0.5 },
        { supplyKey: "azucar", quantity: 0.05 },
        { supplyKey: "canela", quantity: 6 },
      ],
    },
    {
      key: "bano-chocolate-extra",
      name: "Baño de chocolate extra",
      category: "extra",
      price: 500,
      recipe: [{ supplyKey: "chocolate-taza", quantity: 1 }],
    },
    {
      key: "azucar-canela-extra",
      name: "Azúcar y canela extra",
      category: "extra",
      price: 380,
      recipe: [
        { supplyKey: "azucar", quantity: 0.02 },
        { supplyKey: "canela", quantity: 4 },
      ],
    },
    {
      key: "dulce-leche-extra",
      name: "Dulce de leche extra",
      category: "extra",
      price: 480,
      recipe: [{ supplyKey: "dulce-de-leche", quantity: 30 }],
    },
    {
      key: "crema-pastelera-extra",
      name: "Crema pastelera extra",
      category: "extra",
      price: 480,
      recipe: [{ supplyKey: "crema-pastelera", quantity: 30 }],
    },

    {
      key: "chocolate-caliente",
      name: "Chocolate caliente",
      category: "drink",
      price: 1800,
      recipe: [
        { supplyKey: "chocolate-taza", quantity: 3 },
        { supplyKey: "leche", quantity: 0.15 },
      ],
    },
    {
      key: "cafe",
      name: "Café",
      category: "drink",
      price: 1500,
      recipe: [{ supplyKey: "cafe-molido", quantity: 1 }],
    },
    { key: "gaseosa-350", name: "Gaseosa línea Coca-Cola 350ml", category: "drink", price: 1200 },
    { key: "agua-mineral", name: "Agua mineral 500ml", category: "drink", price: 800 },

    {
      key: "dulce-leche-dipear",
      name: "Dulce de leche para dipear",
      category: "fries",
      price: 700,
      role: "default-side",
      recipe: [{ supplyKey: "dulce-de-leche", quantity: 60 }],
    },
    {
      key: "chocolate-dipear",
      name: "Chocolate para dipear",
      category: "fries",
      price: 700,
      recipe: [{ supplyKey: "chocolate-taza", quantity: 2 }],
    },

    {
      key: "bunuelos-manzana-x6",
      name: "Buñuelos de manzana (x6)",
      category: "sides",
      price: 2400,
      recipe: [
        { supplyKey: "harina", quantity: 0.2 },
        { supplyKey: "manzana", quantity: 0.5 },
        { supplyKey: "azucar", quantity: 0.05 },
        { supplyKey: "canela", quantity: 5 },
        { supplyKey: "aceite-friar", quantity: 0.3 },
      ],
    },
    {
      key: "facturas-fritas-x4",
      name: "Facturas fritas surtidas (x4)",
      category: "sides",
      price: 2200,
      recipe: [
        { supplyKey: "harina", quantity: 0.18 },
        { supplyKey: "manteca", quantity: 40 },
        { supplyKey: "azucar", quantity: 0.04 },
        { supplyKey: "dulce-de-leche", quantity: 60 },
      ],
    },
  ],

  // ── Supplies ────────────────────────────────────────────────────────
  //
  // Three purchase modes covered: unit (harina, aceite-friar, azucar, sal,
  // manzana, leche), package (canela, polvo-hornear, manteca, dulce-de-leche,
  // crema-pastelera), and weight (chocolate-taza, cafe-molido — modeled
  // exactly like hamburguesería's medallón / pizzería's muzzarella /
  // cafetería's café en grano / heladería's base-crema / sushi's salmón:
  // bought by the kilo, tracked in discrete "porción" units of
  // unit_weight_grams each).
  //
  // dulce-de-leche is deliberately LOW on stock (900g) so
  // calculateMakeableCount reports a "makeable" count of 10 for Media docena
  // rellenos (dulce de leche) (900 / 90 = 10 — verified with a scratch
  // vitest computation, not eyeballed). 9 of 13 flagged purchasable: true
  // for the expense-generation feed.
  supplies: [
    {
      key: "harina",
      name: "Harina 000",
      unit: "kg",
      stock_quantity: 55,
      purchase_mode: "unit",
      purchase_price: 750,
      purchasable: true,
    },
    {
      key: "aceite-friar",
      name: "Aceite para freír",
      unit: "l",
      stock_quantity: 35,
      purchase_mode: "unit",
      purchase_price: 2000,
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
      key: "canela",
      name: "Canela en polvo",
      unit: "g",
      stock_quantity: 2500,
      purchase_mode: "package",
      purchase_price: 1800,
      purchase_units: 200, // -> cost_per_unit 9
      purchasable: false,
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
      key: "polvo-hornear",
      name: "Polvo de hornear",
      unit: "g",
      stock_quantity: 1800,
      purchase_mode: "package",
      purchase_price: 1600,
      purchase_units: 400, // -> cost_per_unit 4
      purchasable: false,
    },
    {
      key: "manteca",
      name: "Manteca",
      unit: "g",
      stock_quantity: 3500,
      purchase_mode: "package",
      purchase_price: 3200,
      purchase_units: 200, // -> cost_per_unit 16
      purchasable: true,
    },
    // ── Low stock (deliberate) ─────────────────────────────────────────
    {
      key: "dulce-de-leche",
      name: "Dulce de leche",
      unit: "g",
      stock_quantity: 900,
      purchase_mode: "package",
      purchase_price: 4200,
      purchase_units: 1000, // -> cost_per_unit 4.2
      purchasable: true,
    },
    // ── end low stock ────────────────────────────────────────────────
    {
      key: "crema-pastelera",
      name: "Crema pastelera",
      unit: "g",
      stock_quantity: 2800,
      purchase_mode: "package",
      purchase_price: 3800,
      purchase_units: 1000, // -> cost_per_unit 3.8
      purchasable: false,
    },
    {
      key: "chocolate-taza",
      name: "Chocolate para baño y taza",
      unit: "porción",
      stock_quantity: 500,
      unit_weight_grams: 25,
      purchase_mode: "weight",
      purchase_price: 6800, // price per kilo -> cost_per_unit 170
      purchasable: true,
    },
    {
      key: "manzana",
      name: "Manzana",
      unit: "kg",
      stock_quantity: 14,
      purchase_mode: "unit",
      purchase_price: 900,
      purchasable: true,
    },
    {
      key: "cafe-molido",
      name: "Café en grano",
      unit: "porción",
      stock_quantity: 450,
      unit_weight_grams: 8,
      purchase_mode: "weight",
      purchase_price: 5200, // price per kilo -> cost_per_unit 41.6
      purchasable: true,
    },
    {
      key: "leche",
      name: "Leche",
      unit: "l",
      stock_quantity: 25,
      purchase_mode: "unit",
      purchase_price: 1400,
      purchasable: true,
    },
  ],

  // ── Combos ──────────────────────────────────────────────────────────
  //
  // "burger" slots pick from the products array (unrestricted — no `allow`
  // possible there, matches every other authored preset). drink/fries slots
  // restrict via `allow` to keep the combo's identity coherent.
  combos: [
    {
      key: "combo-merienda",
      name: "Combo Merienda",
      description: "Media docena a elección + chocolate caliente o café",
      price: 3800,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        { slot_type: "drink", quantity: 1, required: true, allow: ["chocolate-caliente", "cafe"] },
      ],
    },
    {
      key: "combo-familiar",
      name: "Combo Familiar",
      description: "Docena a elección + 2 bebidas",
      price: 7200,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 2 },
        {
          slot_type: "drink",
          quantity: 2,
          required: true,
          allow: ["chocolate-caliente", "cafe", "gaseosa-350", "agua-mineral"],
        },
      ],
    },
    {
      key: "combo-especial",
      name: "Combo Especial",
      description: "Churro gigante relleno + dip a elección + bebida",
      price: 4300,
      slots: [
        { slot_type: "burger", quantity: 1, required: true, default_meat_quantity: 1 },
        { slot_type: "fries", quantity: 1, required: true, allow: ["dulce-leche-dipear", "chocolate-dipear"] },
        {
          slot_type: "drink",
          quantity: 1,
          required: true,
          allow: ["chocolate-caliente", "cafe", "gaseosa-350", "agua-mineral"],
        },
      ],
    },
  ],

  // ── Restock purchase descriptions (per-preset) ─────────────────────
  expenseDescriptions: [
    "Compra semanal de harina y aceite para freír",
    "Reposición de dulce de leche y crema pastelera",
    "Compra de chocolate para baño y taza",
    "Pedido de azúcar, canela y polvo de hornear",
    "Compra de manzanas frescas",
    "Pedido a distribuidora de bebidas",
  ],

  // ── External income descriptions (optional, per-preset) ────────────
  externalIncomeDescriptions: [
    "Catering de cumpleaños infantil",
    "Pedido grande para evento corporativo",
    "Depósito anticipo catering",
    "Venta de bandejas de churros para evento",
    "Evento privado fin de semana",
  ],
};
