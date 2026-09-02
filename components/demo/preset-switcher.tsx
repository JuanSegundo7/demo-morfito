"use client"

// Phase 3 of the presets plan: a live business-vertical switcher next to
// <DemoBanner> in the sidebar. Writes the preset cookie client-side (kept
// in sync with middleware.ts via writePresetCookie()), calls the store's
// reseed(), clears the react-query cache, and navigates to "/" if needed —
// no full page reload.
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Store } from "lucide-react"
import { isPresetId, PRESET_IDS, type PresetId } from "@/lib/demo/presets/ids"
import { PRESET_LABELS } from "@/lib/demo/presets/registry"
import { resolveActivePresetId, writePresetCookie } from "@/lib/demo/presets/resolve"
import { useDemoStore } from "@/lib/demo/store"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PresetSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const reseed = useDemoStore((s) => s.reseed)

  // resolveActivePresetId() reads document.cookie — it disagrees with the
  // server render (which always has no cookie access here) whenever a
  // non-default preset is active. Rendering nothing until mounted avoids a
  // hydration text mismatch on the visible <SelectValue> label.
  const [presetId, setPresetId] = useState<PresetId | null>(null)
  useEffect(() => {
    setPresetId(resolveActivePresetId())
  }, [])

  const handleChange = (value: string) => {
    if (!isPresetId(value) || value === presetId) return

    writePresetCookie(value)
    reseed(value)
    queryClient.clear()
    setPresetId(value)
    if (pathname !== "/") router.push("/")
  }

  if (!presetId) return null

  return (
    <Select value={presetId} onValueChange={handleChange}>
      <SelectTrigger size="sm" className="w-full text-xs">
        <Store className="size-3.5 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRESET_IDS.map((id) => (
          <SelectItem key={id} value={id} className="text-xs">
            {PRESET_LABELS[id]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
