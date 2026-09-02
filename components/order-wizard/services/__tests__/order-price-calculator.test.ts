import { describe, it, expect } from "vitest";
import { OrderPriceCalculator } from "../order-price-calculator";
import {
  makeSelectedBurger,
  makeSelectedCombo,
  makeSelectedComboSlot,
  makeSelectedSide,
  makeExtra,
  makeBurger,
  type TestSelectedCombo,
} from "./test-fixtures";

// ---------------------------------------------------------------------------
// SPEC-01: calculateDiscountAmount
// ---------------------------------------------------------------------------
describe("OrderPriceCalculator.calculateDiscountAmount", () => {
  it("devuelve 0 cuando discountType es 'none'", () => {
    expect(OrderPriceCalculator.calculateDiscountAmount(1000, "none", 50)).toBe(0);
  });

  it("devuelve el monto exacto para type='amount'", () => {
    expect(OrderPriceCalculator.calculateDiscountAmount(1000, "amount", 200)).toBe(200);
  });

  it("capea el descuento al subtotal cuando amount > subtotal", () => {
    expect(OrderPriceCalculator.calculateDiscountAmount(500, "amount", 800)).toBe(500);
  });

  it("calcula porcentaje correctamente", () => {
    expect(OrderPriceCalculator.calculateDiscountAmount(1000, "percentage", 20)).toBe(200);
  });

  it("capea el porcentaje a 100%", () => {
    expect(OrderPriceCalculator.calculateDiscountAmount(1000, "percentage", 100)).toBe(1000);
  });

  it("devuelve 0 cuando discountValue es 0 con type='amount'", () => {
    expect(OrderPriceCalculator.calculateDiscountAmount(1000, "amount", 0)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// SPEC-02: calculateBurgersTotal
// ---------------------------------------------------------------------------
describe("OrderPriceCalculator.calculateBurgersTotal", () => {
  it("burger base sin extras ni fries adjustment → base_price * qty", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ base_price: 500, default_fries_quantity: 1 }),
      meatPriceAdjustment: 0,
      quantity: 1,
      friesQuantity: 1,
      selectedExtras: [],
    });
    expect(OrderPriceCalculator.calculateBurgersTotal([burger], null)).toBe(500);
  });

  it("incluye meatPriceAdjustment y multiplica por quantity", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ base_price: 500 }),
      meatPriceAdjustment: 150,
      quantity: 2,
      selectedExtras: [],
    });
    expect(OrderPriceCalculator.calculateBurgersTotal([burger], null)).toBe(1300);
  });

  it("suma friesAdjustment cuando friesQuantity > default_fries_quantity", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ base_price: 500, default_fries_quantity: 1 }),
      meatPriceAdjustment: 0,
      quantity: 1,
      friesQuantity: 2,
      selectedExtras: [],
    });
    const friesExtra = { price: 100 };
    // burgerTotal=500, friesAdjust=(2-1)*100*1=100 → 600
    expect(OrderPriceCalculator.calculateBurgersTotal([burger], friesExtra)).toBe(600);
  });

  it("no aplica friesAdjustment cuando friesQuantity == default_fries_quantity", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ base_price: 500, default_fries_quantity: 1 }),
      meatPriceAdjustment: 0,
      quantity: 1,
      friesQuantity: 1,
      selectedExtras: [],
    });
    const friesExtra = { price: 100 };
    expect(OrderPriceCalculator.calculateBurgersTotal([burger], friesExtra)).toBe(500);
  });

  it("suma extras (sin multiplicar por item.quantity)", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ base_price: 500 }),
      meatPriceAdjustment: 0,
      quantity: 1,
      friesQuantity: 1,
      selectedExtras: [{ extra: makeExtra({ price: 50 }), quantity: 2 }],
    });
    // burgerTotal=500, extrasTotal=50*2=100 → 600
    expect(OrderPriceCalculator.calculateBurgersTotal([burger], null)).toBe(600);
  });
});

// ---------------------------------------------------------------------------
// SPEC-03: calculateCombosTotal
// ---------------------------------------------------------------------------
describe("OrderPriceCalculator.calculateCombosTotal", () => {
  it("combo básico sin slots → combo.price * quantity", () => {
    const combo = makeSelectedCombo({
      combo: { id: "c1", name: "Combo", price: 1500 },
      quantity: 1,
      slots: [],
    });
    expect(OrderPriceCalculator.calculateCombosTotal([combo as any], null, null)).toBe(1500);
  });

  it("aplica meatAdjustment en slot burger cuando meatCount > defaultMeatCount", () => {
    const burger = makeSelectedBurger({
      meatCount: 3,
      quantity: 1,
      selectedExtras: [],
      meatPriceAdjustment: 0,
    });
    const slot = makeSelectedComboSlot({
      slotType: "burger",
      defaultMeatCount: 2,
      burgers: [burger],
      selectedExtras: [],
    });
    const combo = makeSelectedCombo({
      combo: { id: "c1", name: "Combo", price: 1500 },
      quantity: 1,
      slots: [slot],
    });
    const meatExtra = { price: 200 };
    // base=1500, meatAdj=(3-2)*200*1=200 → 1700
    expect(OrderPriceCalculator.calculateCombosTotal([combo as any], meatExtra, null)).toBe(1700);
  });

  it("slot drink con selectedExtras[0].price=300: la elección NO suma cargo, ya está incluida en el precio del combo", () => {
    // Deliberate design (commit 7f8aa20 "update combos logic and fries"):
    // a drink/fries/side slot's selectedExtras only records WHICH allowed
    // option fills the slot ("Elegir Bebida" picker in combos-step.tsx) —
    // it is never an upcharge, regardless of that extra's own catalog price.
    const slot = makeSelectedComboSlot({
      slotType: "drink",
      burgers: [],
      selectedExtras: [{ id: "ex1", name: "Bebida", price: 300 }],
    });
    const combo = makeSelectedCombo({
      combo: { id: "c1", name: "Combo", price: 1500 },
      quantity: 2,
      slots: [slot],
    });
    // comboBase=1500*2=3000, la bebida elegida no agrega nada → 3000
    expect(OrderPriceCalculator.calculateCombosTotal([combo as any], null, null)).toBe(3000);
  });

  it("devuelve 0 para array vacío", () => {
    expect(OrderPriceCalculator.calculateCombosTotal([], null, null)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// SPEC-04: calculateSubtotal
// ---------------------------------------------------------------------------
describe("OrderPriceCalculator.calculateSubtotal", () => {
  it("suma burgers + combos + sides correctamente", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ base_price: 500 }),
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
      extra: makeExtra({ price: 200, category: "sides" }),
      quantity: 1,
      selectedExtras: [],
    });
    expect(
      OrderPriceCalculator.calculateSubtotal([burger], [combo as any], [side], null, null)
    ).toBe(2200);
  });

  it("devuelve 0 para arrays vacíos", () => {
    expect(OrderPriceCalculator.calculateSubtotal([], [], [], null, null)).toBe(0);
  });

  it("side con extras suma base + extras de side", () => {
    const side = makeSelectedSide({
      extra: makeExtra({ price: 200, category: "sides" }),
      quantity: 1,
      selectedExtras: [{ extra: makeExtra({ price: 50 }), quantity: 2 }],
    });
    // 200*1 + 50*2 = 300
    expect(OrderPriceCalculator.calculateSubtotal([], [], [side], null, null)).toBe(300);
  });
});

// ---------------------------------------------------------------------------
// SPEC-05: calculateOrderTotal
// ---------------------------------------------------------------------------
describe("OrderPriceCalculator.calculateOrderTotal", () => {
  it("burger subtotal=500, pickup, sin descuento → 500", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ base_price: 500 }),
      meatPriceAdjustment: 0,
      quantity: 1,
      selectedExtras: [],
    });
    expect(
      OrderPriceCalculator.calculateOrderTotal({
        selectedBurgers: [burger],
        selectedCombos: [],
        selectedSides: [],
        deliveryType: "pickup",
        deliveryFee: 0,
      })
    ).toBe(500);
  });

  it("burger subtotal=1000, pickup, descuento amount=200 → 800", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ base_price: 1000 }),
      meatPriceAdjustment: 0,
      quantity: 1,
      selectedExtras: [],
    });
    expect(
      OrderPriceCalculator.calculateOrderTotal({
        selectedBurgers: [burger],
        selectedCombos: [],
        selectedSides: [],
        deliveryType: "pickup",
        deliveryFee: 0,
        discountType: "amount",
        discountValue: 200,
      })
    ).toBe(800);
  });

  it("burger subtotal=1000, delivery con fee=150 → 1150", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ base_price: 1000 }),
      meatPriceAdjustment: 0,
      quantity: 1,
      selectedExtras: [],
    });
    expect(
      OrderPriceCalculator.calculateOrderTotal({
        selectedBurgers: [burger],
        selectedCombos: [],
        selectedSides: [],
        deliveryType: "delivery",
        deliveryFee: 150,
      })
    ).toBe(1150);
  });

  it("selectedBurgers=undefined as any → devuelve 0", () => {
    expect(
      OrderPriceCalculator.calculateOrderTotal({
        selectedBurgers: undefined as any,
        selectedCombos: [],
        selectedSides: [],
        deliveryType: "pickup",
        deliveryFee: 0,
      })
    ).toBe(0);
  });

  it("discountType='invalid' as any con discountValue=500, subtotal=1000 → 1000 (descuento ignorado)", () => {
    const burger = makeSelectedBurger({
      burger: makeBurger({ base_price: 1000 }),
      meatPriceAdjustment: 0,
      quantity: 1,
      selectedExtras: [],
    });
    expect(
      OrderPriceCalculator.calculateOrderTotal({
        selectedBurgers: [burger],
        selectedCombos: [],
        selectedSides: [],
        deliveryType: "pickup",
        deliveryFee: 0,
        discountType: "invalid" as any,
        discountValue: 500,
      })
    ).toBe(1000);
  });
});
