"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import Image from "next/image";
import { PrintServiceIndicator } from "../order-wizard/components/print-service";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/demo/auth";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onCreateOrder?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  extraActions?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  onCreateOrder,
  onRefresh,
  isRefreshing,
  extraActions,
}: HeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:p-6 ios-glass rounded-md shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="md:hidden" />
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && (
            <p className="hidden text-sm text-muted-foreground sm:block">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <PrintServiceIndicator />

        {extraActions}

        <ThemeToggle />

        <Button variant="ghost" size="icon" onClick={handleLogout} title="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </Button>

        {onCreateOrder && (
          <Button onClick={onCreateOrder} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Crear Pedido
          </Button>
        )}
      </div>
      {/* {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="bg-card"
        >
          <RefreshCw
            className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
          />
          Actualizar
        </Button>
      )} */}
    </header>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
