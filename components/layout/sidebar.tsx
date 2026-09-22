"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { DemoBanner } from "@/components/demo/demo-banner"
import { PresetSwitcher } from "@/components/demo/preset-switcher"
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  UtensilsCrossed,
  Plus,
  DollarSign,
  Component,
  User,
  Users,
  Wallet,
  LogOut,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Pacifico, Baloo_2 } from "next/font/google"
import { logout } from "@/lib/demo/auth"

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["600", "700"],
})

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: "400",
})

const navigation = [
  { name: "Pedidos",      href: "/",          icon: LayoutDashboard, adminOnly: false, operatorBlocked: false },
  { name: "Historial",   href: "/historial",   icon: ClipboardList,   adminOnly: false, operatorBlocked: false },
  { name: "Rendimiento", href: "/rendimiento", icon: BarChart3,       adminOnly: false, operatorBlocked: true  },
  { name: "Clientes",    href: "/clientes",   icon: User,            adminOnly: false, operatorBlocked: true  },
  { name: "Menú",        href: "/menu",       icon: UtensilsCrossed, adminOnly: false, operatorBlocked: false },
  { name: "Combos",      href: "/combos",     icon: Component,       adminOnly: false, operatorBlocked: false },
  { name: "Extras",      href: "/extras",     icon: Plus,            adminOnly: false, operatorBlocked: false },
  { name: "Precios",     href: "/precios",     icon: DollarSign,      adminOnly: false, operatorBlocked: true  },
  { name: "Finanzas",    href: "/finanzas",   icon: Wallet,          adminOnly: false, operatorBlocked: true  },
  { name: "Usuarios",    href: "/usuarios",   icon: Users,           adminOnly: true,  operatorBlocked: false },
]

export function AppSidebar({ role }: { role?: "admin" | "operator" }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const visibleNav = navigation.filter((item) => {
    if (item.adminOnly && role !== "admin") return false
    if (item.operatorBlocked && role === "operator") return false
    return true
  })

  return (
    <Sidebar collapsible="icon" variant="floating" className="ios-sidebar">
      <SidebarHeader className="pb-2">
        <div className="flex items-center gap-3 px-1 py-2 transition-all duration-300 ease-in-out overflow-hidden group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0">
          {/* Sin mx-auto/justify-center en el icono: no interpolan, saltan de
              golpe a mitad de la transicion. El icono se queda quieto a la
              izquierda todo el tiempo (mismo fix que jebbs-dashboard). */}
          <Image
            src="/solvify-icon.jpg"
            alt="Logo"
            width={56}
            height={56}
            className="rounded-lg shrink-0 size-8 object-cover"
          />
          {/* grid-template-columns 1fr -> 0fr, no max-width -> max-w-0: con
              max-width el ancho real queda pisado en el ancho natural del
              contenido mientras el techo (max-w-xs) todavia no lo alcanza,
              asi que la animacion queda "muerta" la mayor parte del tiempo y
              recien colapsa de golpe al final. El fr-units se achica en
              proporcion al contenido real desde el primer frame. La opacidad
              usa la MISMA duracion/easing que el ancho (300ms, sin delay) a
              proposito, para que el fade no deje una ventana de texto
              recortado pero visible. */}
          <div className="grid grid-cols-[1fr] transition-[grid-template-columns] duration-300 ease-in-out group-data-[collapsible=icon]:grid-cols-[0fr]">
            <div
              className={cn(
                "flex flex-col leading-tight overflow-hidden min-w-0",
                "transition-opacity duration-300 ease-in-out opacity-100",
                "group-data-[collapsible=icon]:opacity-0",
              )}
            >
              <span className={cn(baloo.className, "text-base font-bold tracking-wide whitespace-nowrap")}>
                Morfito
              </span>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out space-y-2",
            "max-h-32 opacity-100",
            "group-data-[collapsible=icon]:max-h-0 group-data-[collapsible=icon]:opacity-0",
          )}
        >
          <DemoBanner />
          <PresetSwitcher />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNav.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      className={cn(
                        "rounded-lg transition-all duration-200 h-9",
                        isActive
                          ? "nav-rail-active bg-primary/10 text-primary font-medium"
                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className={cn("size-4 shrink-0", isActive && "text-primary")} />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Cerrar sesión"
              className="rounded-lg transition-all duration-200 h-9 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer"
            >
              <LogOut className="size-4 shrink-0" />
              <span className="text-sm">Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
