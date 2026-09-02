"use client";

import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { useDemoStore } from "@/lib/demo/store";

// Demo equivalent of jebbs' components/onboarding/help-button.tsx. The demo
// has a single linear tour (lib/demo/tour-steps.ts) instead of jebbs' named
// per-section nextstepjs tours, so there's no `tour` id to pass — clicking
// this always (re)starts the tour from the beginning via the store action.
export function HelpButton() {
  const startTour = useDemoStore((s) => s.startTour);
  return (
    <Button variant="outline" size="icon" onClick={() => startTour()} aria-label="Ayuda">
      <HelpCircle className="h-4 w-4" />
    </Button>
  );
}
