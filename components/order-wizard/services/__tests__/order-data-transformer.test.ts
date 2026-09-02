import { describe, it, expect } from "vitest";
import { OrderDataTransformer } from "../order-data-transformer";
import {
  makeSelectedBurger,
  makeSelectedCombo,
  makeSelectedComboSlot,
  makeSelectedSide,
  makeExtra,
  makeBurger,
} from "./test-fixtures";

// ---------------------------------------------------------------------------
// SPEC-06: transformBurgersToOrderItems
// ---------------------------------------------------------------------------
describe("OrderDataTransformer.transformBurgersToOrderItems", () => {
  it("transforma una burger con datos básicos correctamente", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ id: "b1", name: "Clásica", base_price: 500, default_fries_quantity: 1 }),
      meatPriceAdjustment: 100,
      quantity: 2,
      meatCount: 3,
      isVeggie: false,
      friesQuantity: 1,
      removedIngredients: ["lechuga"],
      selectedExtras: [
        { extra: makeExtra({ id: "e1", name: "Cheddar", price: 50 }), quantity: 1 },
      ],
    });

    const result = OrderDataTransformer.transformBurgersToOrderItems([burger], null);

    expect(result).toHaveLength(1);
    expect(result[0].burger_id).toBe("b1");
    expect(result[0].combo_id).toBeNull();
    expect(result[0].burger_name).toBe("Clásica");
    expect(result[0].quantity).toBe(2);
    // unitPrice = 500 + 100 = 600
    expect(result[0].unit_price).toBe(600);
  });

  it("customizations contiene los datos de personalización en JSON válido", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ id: "b1", name: "Clásica", base_price: 500, default_fries_quantity: 1 }),
      meatPriceAdjustment: 100,
      quantity: 2,
      meatCount: 3,
      isVeggie: false,
      friesQuantity: 1,
      removedIngredients: ["lechuga"],
      selectedExtras: [
        { extra: makeExtra({ id: "e1", name: "Cheddar", price: 50 }), quantity: 1 },
      ],
    });

    const result = OrderDataTransformer.transformBurgersToOrderItems([burger], null);
    const customizations = JSON.parse(result[0].customizations!);

    expect(customizations.meatCount).toBe(3);
    expect(customizations.isVeggie).toBe(false);
    expect(customizations.friesQuantity).toBe(1);
    expect(customizations.friesAdjustment).toBe(0);
    expect(customizations.removedIngredients).toEqual(["lechuga"]);
    expect(customizations.extras).toHaveLength(1);
    expect(customizations.extras[0].id).toBe("e1");
    expect(customizations.extras[0].name).toBe("Cheddar");
    expect(customizations.extras[0].quantity).toBe(1);
    expect(customizations.extras[0].price).toBe(50);
  });

  it("aplica friesAdjustment cuando friesQuantity > default: subtotal=600, friesAdjustment=100 en JSON", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ base_price: 500, default_fries_quantity: 1 }),
      meatPriceAdjustment: 0,
      quantity: 1,
      friesQuantity: 2,
      selectedExtras: [],
    });
    const friesExtra = { price: 100 };

    const result = OrderDataTransformer.transformBurgersToOrderItems([burger], friesExtra);
    const customizations = JSON.parse(result[0].customizations!);

    // subtotal = unitPrice * qty + friesAdj = 500*1 + (2-1)*100*1 = 600
    expect(result[0].subtotal).toBe(600);
    expect(customizations.friesAdjustment).toBe(100);
  });

  it("extras tienen extra_id, extra_name, quantity, unit_price y subtotal correctos", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ base_price: 500 }),
      meatPriceAdjustment: 0,
      quantity: 1,
      selectedExtras: [
        { extra: makeExtra({ id: "e1", name: "Cheddar", price: 50 }), quantity: 2 },
      ],
    });

    const result = OrderDataTransformer.transformBurgersToOrderItems([burger], null);

    expect(result[0].extras).toHaveLength(1);
    expect(result[0].extras[0].extra_id).toBe("e1");
    expect(result[0].extras[0].extra_name).toBe("Cheddar");
    expect(result[0].extras[0].quantity).toBe(2);
    expect(result[0].extras[0].unit_price).toBe(50);
    expect(result[0].extras[0].subtotal).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// SPEC-07: transformCombosToOrderItems
// ---------------------------------------------------------------------------
describe("OrderDataTransformer.transformCombosToOrderItems", () => {
  it("combo básico: combo_id correcto, burger_id null, extras vacíos", () => {
    const combo = makeSelectedCombo({
      combo: { id: "c1", name: "Combo Clásico", price: 1500 },
      quantity: 1,
      slots: [],
    });

    const result = OrderDataTransformer.transformCombosToOrderItems([combo as any]);

    expect(result).toHaveLength(1);
    expect(result[0].combo_id).toBe("c1");
    expect(result[0].burger_id).toBeNull();
    expect(result[0].extras).toEqual([]);
  });

  it("customizations es un JSON array con los slots del combo", () => {
    const slot = makeSelectedComboSlot({
      slotId: "slot-1",
      slotType: "burger",
      burgers: [],
      selectedExtras: [],
    });
    const combo = makeSelectedCombo({
      combo: { id: "c1", name: "Combo Clásico", price: 1500 },
      quantity: 1,
      slots: [slot],
    });

    const result = OrderDataTransformer.transformCombosToOrderItems([combo as any]);
    const customizations = JSON.parse(result[0].customizations!);

    expect(Array.isArray(customizations)).toBe(true);
    expect(customizations).toHaveLength(1);
    expect(customizations[0].slotId).toBe("slot-1");
    expect(customizations[0].slotType).toBe("burger");
    expect(customizations[0]).toHaveProperty("burgers");
    expect(customizations[0]).toHaveProperty("selectedExtras");
  });

  it("combo_id correcto y burger_id siempre null", () => {
    const combo = makeSelectedCombo({
      combo: { id: "c99", name: "Mega Combo", price: 2000 },
      quantity: 1,
      slots: [],
    });

    const result = OrderDataTransformer.transformCombosToOrderItems([combo as any]);

    expect(result[0].combo_id).toBe("c99");
    expect(result[0].burger_id).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// SPEC-08: transformSidesToOrderItems
// ---------------------------------------------------------------------------
describe("OrderDataTransformer.transformSidesToOrderItems", () => {
  it("side básico: extra_id correcto, burger_id y combo_id son null, customizations null", () => {
    const side = makeSelectedSide({
      extra: makeExtra({ id: "ex1", name: "Papas", category: "sides", price: 200 }),
      quantity: 2,
      selectedExtras: [],
    });

    const result = OrderDataTransformer.transformSidesToOrderItems([side]);

    expect(result).toHaveLength(1);
    expect(result[0].extra_id).toBe("ex1");
    expect(result[0].burger_id).toBeNull();
    expect(result[0].combo_id).toBeNull();
    expect(result[0].customizations).toBeUndefined();
  });

  it("subtotal usa solo precio base (sin sumar extras al subtotal)", () => {
    const side = makeSelectedSide({
      extra: makeExtra({ id: "ex1", name: "Papas", category: "sides", price: 200 }),
      quantity: 3,
      selectedExtras: [{ extra: makeExtra({ price: 50 }), quantity: 2 }],
    });

    const result = OrderDataTransformer.transformSidesToOrderItems([side]);

    // subtotal = 200 * 3 = 600 (solo base, no incluye extras)
    expect(result[0].subtotal).toBe(600);
  });

  it("selectedExtras se mapean a extras con extra_id, extra_name, qty, unit_price, subtotal", () => {
    const side = makeSelectedSide({
      extra: makeExtra({ id: "ex1", name: "Papas", category: "sides", price: 200 }),
      quantity: 1,
      selectedExtras: [
        { extra: makeExtra({ id: "ex2", name: "Cheddar", price: 50 }), quantity: 3 },
      ],
    });

    const result = OrderDataTransformer.transformSidesToOrderItems([side]);

    expect(result[0].extras).toHaveLength(1);
    expect(result[0].extras[0].extra_id).toBe("ex2");
    expect(result[0].extras[0].extra_name).toBe("Cheddar");
    expect(result[0].extras[0].quantity).toBe(3);
    expect(result[0].extras[0].unit_price).toBe(50);
    expect(result[0].extras[0].subtotal).toBe(150);
  });
});

// ---------------------------------------------------------------------------
// SPEC-09: transformToOrderPayload
// ---------------------------------------------------------------------------
describe("OrderDataTransformer.transformToOrderPayload", () => {
  it("1 burger + 1 combo + 1 side → array[3]: [0]=combo, [1]=burger, [2]=side", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ id: "b1", name: "Clásica", base_price: 500 }),
      meatPriceAdjustment: 0,
      quantity: 1,
      selectedExtras: [],
    });
    const combo = makeSelectedCombo({
      combo: { id: "c1", name: "Combo", price: 1500 },
      quantity: 1,
      slots: [],
    });
    const side = makeSelectedSide({
      extra: makeExtra({ id: "ex1", name: "Papas", category: "sides", price: 200 }),
      quantity: 1,
      selectedExtras: [],
    });

    const result = OrderDataTransformer.transformToOrderPayload(
      [burger],
      [combo as any],
      null,
      null,
      [side],
    );

    expect(result).toHaveLength(3);
    expect(result[0].combo_id).toBe("c1");   // combo primero
    expect(result[1].burger_id).toBe("b1");  // burger segundo
    expect(result[2].extra_id).toBe("ex1");  // side tercero
  });

  it("sides=undefined → array[2] con combo y burger", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ id: "b1", name: "Clásica", base_price: 500 }),
      meatPriceAdjustment: 0,
      quantity: 1,
      selectedExtras: [],
    });
    const combo = makeSelectedCombo({
      combo: { id: "c1", name: "Combo", price: 1500 },
      quantity: 1,
      slots: [],
    });

    const result = OrderDataTransformer.transformToOrderPayload(
      [burger],
      [combo as any],
      null,
      null,
      undefined,
    );

    expect(result).toHaveLength(2);
  });

  it("todo vacío → array vacío", () => {
    const result = OrderDataTransformer.transformToOrderPayload([], [], null, null, []);
    expect(result).toHaveLength(0);
  });
});
