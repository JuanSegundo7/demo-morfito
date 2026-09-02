import type { PresetLexicon } from "./presets/types"
import { capitalize } from "./presets/lexicon"

export type WizardStepKey = "customer" | "combos" | "burgers" | "sides" | "summary"
export type TourPosition = "bottom-right" | "bottom-left"

export interface TourStep {
  title: string
  description: string
  route: string
  wizardStep?: WizardStepKey
  target?: string        // value of data-tour attribute to pulse-highlight
  position: TourPosition
}

// Plan "Diseño" §6 / "Secuencia / Fase 2": 7 of 11 steps mention the
// product noun, the meat/side component nouns, or the business label —
// built from `lexicon` (+ `businessLabel`, the preset's own `label`, e.g.
// "Hamburguesería") instead of a frozen "hamburguesas" literal. A function
// (not a const) because tour-overlay.tsx needs it re-evaluated against
// whichever preset is active — see that file for how it's called.
export function getTourSteps(lexicon: PresetLexicon, businessLabel: string): TourStep[] {
  const product = lexicon.product
  const meat = lexicon.mainComponent
  const fries = lexicon.categoryLabels.fries.toLowerCase()
  const sides = lexicon.categoryLabels.sides.toLowerCase()

  return [
    {
      title: "¡Bienvenido a Dishflow! 👋",
      description: `Este es el sistema de operaciones de tu ${businessLabel.toLowerCase()}. En menos de 2 minutos te mostramos cómo funciona cada sección.`,
      route: "/",
      position: "bottom-right",
    },
    {
      title: "Tablero de pedidos en vivo",
      description: "Los pedidos activos aparecen acá organizados por estado. Arrastrá las tarjetas entre columnas para cambiar su estado, o usá los botones de cada tarjeta.",
      route: "/",
      target: "kanban",
      position: "bottom-right",
    },
    {
      title: "Demo en vivo 🔔",
      description: "Cada ~60 segundos aparece un pedido nuevo automáticamente, simulando actividad real. Podés pausar o reactivar la simulación desde el botón del header.",
      route: "/",
      target: "generator-toggle",
      position: "bottom-right",
    },
    {
      title: "Historial de pedidos",
      description: "Consultá todos los pedidos con filtros por fecha. Controlá el estado de pago, imprimí tickets y copiá el resumen de cada pedido para WhatsApp.",
      route: "/historial",
      position: "bottom-right",
    },
    {
      title: "Gestión del menú",
      description: `Administrá la carta completa: agregá ${product.plural}, editá precios y descripciones, subí fotos y activá o desactivá ítems con un click.`,
      route: "/menu",
      position: "bottom-right",
    },
    {
      title: "Combos armables",
      description: `Creá combos con reglas específicas: qué ${product.singular} incluye, si lleva bebida, ${fries} y en qué cantidades. El precio del combo se aplica automáticamente.`,
      route: "/combos",
      position: "bottom-right",
    },
    {
      title: "Extras y bebidas",
      description: `Gestioná ingredientes extra, bebidas, ${fries} y ${sides}. Cada ítem tiene precio propio y se puede activar o desactivar de forma independiente.`,
      route: "/extras",
      position: "bottom-right",
    },
    {
      title: "Rendimiento del negocio",
      description: "Analizá ingresos por período, identificá los productos más vendidos y controlá el rendimiento del negocio con gráficos interactivos.",
      route: "/rendimiento",
      position: "bottom-right",
    },
    {
      title: "Gestión de precios",
      description: `Actualizá los precios de ${product.plural} y extras desde un panel centralizado. Los cambios se reflejan de inmediato en el wizard y en los nuevos pedidos.`,
      route: "/precios",
      position: "bottom-right",
    },
    {
      title: "Finanzas del negocio",
      description: `Controlá gastos, insumos y recetas en un solo lugar. Mirá el neto del período, las comisiones de PedidosYa y el costo/margen real de cada ${product.singular}.`,
      route: "/finanzas",
      position: "bottom-right",
    },
    {
      title: "Crear pedido (1/5): Cliente",
      description: "El wizard tiene 5 pasos. Primero seleccionás un cliente existente con búsqueda por nombre o teléfono, o registrás uno nuevo con su dirección de entrega.",
      route: "/",
      wizardStep: "customer",
      position: "bottom-left",
    },
    {
      title: "Crear pedido (2/5): Combos",
      description: `Agregá combos al pedido. Cada combo muestra sus slots: elegís la ${product.singular}, la bebida y las ${fries} según las reglas que configuraste.`,
      route: "/",
      wizardStep: "combos",
      position: "bottom-left",
    },
    {
      title: `Crear pedido (3/5): ${capitalize(product.plural)}`,
      description: `Agregá ${product.plural} individuales. Personalizá cada una: cantidad de ${meat.plural}, ${fries}, ingredientes a remover y extras adicionales con sus precios.`,
      route: "/",
      wizardStep: "burgers",
      position: "bottom-left",
    },
    {
      title: "Crear pedido (4/5): Acompañamientos",
      description: `Sumá bebidas, ${fries} u otros extras sueltos al pedido, por fuera de una ${product.singular} específica. Ideal para pedidos grupales o antojos extra.`,
      route: "/",
      wizardStep: "sides",
      position: "bottom-left",
    },
    {
      title: "Crear pedido (5/5): Resumen",
      description: "Revisá el pedido completo: método de pago, tipo de entrega, fee de envío, descuentos y el total final. Confirmá y el pedido aparece en el tablero.",
      route: "/",
      wizardStep: "summary",
      position: "bottom-left",
    },
    {
      title: "¡Tour completado! 🎉",
      description: "Ya conocés todo el sistema. Los datos de la demo se resetean al cerrar esta pestaña. ¡Ahora creá tu primer pedido de prueba!",
      route: "/",
      position: "bottom-right",
    },
  ]
}
