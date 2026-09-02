"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useDemoStore } from "@/lib/demo/store"
import { getTourSteps } from "@/lib/demo/tour-steps"
import { getActivePreset } from "@/lib/demo/presets/resolve"

export function DemoTourOverlay() {
  const router = useRouter()
  const pathname = usePathname()
  const {
    tourActive, tourStep, tourCompleted,
    startTour, skipTour, nextTourStep, prevTourStep,
    setWizardTourState,
  } = useDemoStore()

  // Auto-start once per session (after a short delay so the page settles)
  const started = useRef(false)
  useEffect(() => {
    if (started.current || tourCompleted) return
    started.current = true
    const t = setTimeout(() => startTour(), 1200)
    return () => clearTimeout(t)
  }, [])

  const preset = getActivePreset()
  const TOUR_STEPS = getTourSteps(preset.lexicon, preset.label)
  const TOTAL = TOUR_STEPS.length
  const step = TOUR_STEPS[tourStep]

  // Navigate + control wizard whenever step changes
  useEffect(() => {
    if (!tourActive || !step) return

    if (step.route !== pathname) {
      router.push(step.route)
    }

    if (step.wizardStep) {
      setWizardTourState(true, step.wizardStep)
    } else {
      setWizardTourState(false, null)
    }
  }, [tourActive, tourStep])

  // Pulse-highlight the target element
  useEffect(() => {
    if (!tourActive || !step?.target) return
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null
    if (!el) return
    el.classList.add("tour-highlight")
    return () => el.classList.remove("tour-highlight")
  }, [tourActive, tourStep])

  if (!tourActive || !step) return null

  const isFirst = tourStep === 0
  const isLast  = tourStep === TOTAL - 1
  const posClass = step.position === "bottom-left"
    ? "bottom-6 left-6"
    : "bottom-6 right-6"

  const handleNext = () => {
    if (isLast) {
      skipTour()
    } else {
      nextTourStep()
    }
  }

  return (
    <>
      {/* Pulse highlight keyframes — injected once */}
      <style>{`
        .tour-highlight {
          outline: 2px solid hsl(var(--primary));
          outline-offset: 4px;
          border-radius: 8px;
          animation: tour-pulse 1.8s ease-in-out infinite;
        }
        @keyframes tour-pulse {
          0%, 100% { outline-color: hsl(var(--primary) / 1); }
          50%       { outline-color: hsl(var(--primary) / 0.2); }
        }
      `}</style>

      <div className={`fixed z-[200] ${posClass} w-80`}>
        <Card className="shadow-2xl border-border bg-card/95 backdrop-blur-sm p-5 space-y-3">

          {/* Top row: step counter + close */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {tourStep + 1} / {TOTAL}
            </span>
            <button
              onClick={skipTour}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cerrar tour"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${((tourStep + 1) / TOTAL) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <p className="font-semibold text-sm leading-snug">{step.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={skipTour}
              className="text-muted-foreground text-xs h-8 px-2"
            >
              Saltar tour
            </Button>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={prevTourStep}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" className="h-8 gap-1" onClick={handleNext}>
                {isLast ? "¡Listo!" : "Siguiente"}
                {!isLast && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>

        </Card>
      </div>
    </>
  )
}
