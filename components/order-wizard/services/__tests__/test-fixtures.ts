import type { Extra, Burger } from "@/lib/types";
import type { SelectedBurger } from "@/lib/types/combo-types";
import type { SelectedSide } from "../../hooks/use-side-selection";

export interface TestSelectedComboSlot {
  slotId: string;
  slotType: "burger" | "drink" | "side" | "nuggets";
  maxQuantity: number;
  defaultMeatCount?: number;
  burgers: SelectedBurger[];
  selectedExtras: Array<{ id: string; name: string; price: number }>;
}

export interface TestSelectedCombo {
  id: string;
  combo: { id: string; name: string; price: number };
  quantity: number;
  slots: TestSelectedComboSlot[];
}

export function makeExtra(overrides?: Partial<Extra>): Extra {
  return {
    id: "extra-1",
    name: "Extra genérico",
    category: "extra",
    price: 50,
    is_available: true,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeBurger(overrides?: Partial<Burger>): Burger {
  return {
    id: "burger-1",
    name: "Clásica",
    description: null,
    base_price: 500,
    ingredients: ["carne", "lechuga", "tomate"],
    is_available: true,
    image_url: null,
    default_meat_quantity: 1,
    default_fries_quantity: 1,
    created_at: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeSelectedBurger(overrides?: Partial<SelectedBurger>): SelectedBurger {
  return {
    id: "sb-1",
    burger: makeBurger(),
    quantity: 1,
    meatCount: 1,
    friesQuantity: 1,
    isVeggie: false,
    removedIngredients: [],
    selectedExtras: [],
    meatPriceAdjustment: 0,
    ...overrides,
  };
}

export function makeSelectedSide(overrides?: Partial<SelectedSide>): SelectedSide {
  return {
    id: "side-1",
    extra: makeExtra({ id: "extra-side-1", name: "Papas fritas", category: "sides", price: 200 }),
    quantity: 1,
    selectedExtras: [],
    expanded: false,
    ...overrides,
  };
}

export function makeSelectedComboSlot(overrides?: Partial<TestSelectedComboSlot>): TestSelectedComboSlot {
  return {
    slotId: "slot-1",
    slotType: "burger",
    maxQuantity: 1,
    defaultMeatCount: undefined,
    burgers: [],
    selectedExtras: [],
    ...overrides,
  };
}

export function makeSelectedCombo(overrides?: Partial<TestSelectedCombo>): TestSelectedCombo {
  return {
    id: "sc-1",
    combo: { id: "combo-1", name: "Combo Clásico", price: 1500 },
    quantity: 1,
    slots: [],
    ...overrides,
  };
}
