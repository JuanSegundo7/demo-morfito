// Type declarations only — Phase 1 moved the combo data into
// lib/demo/presets/definitions/hamburgueseria.ts (PresetComboDef[]),
// resolved by presets/builder.ts into PresetCombo/PresetComboSlot/
// PresetComboSlotRule (lib/demo/presets/types.ts — structurally identical
// to the interfaces below). store.ts and mock-supabase.ts still import
// these three type names, so they stay here rather than moving into
// presets/types.ts, keeping lib/demo/presets/ decoupled from lib/demo/seed/.

export interface SeedCombo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  created_at: string;
}

export interface SeedComboSlot {
  id: string;
  combo_id: string;
  slot_type: "burger" | "drink" | "side" | "fries" | "nuggets";
  quantity: number;
  required: boolean;
  default_meat_quantity: number | null;
  created_at: string;
}

export interface SeedComboSlotRule {
  id: number;
  combo_slot_id: string;
  rule_type: string;
  rule_value: string;
  created_at: string;
}
