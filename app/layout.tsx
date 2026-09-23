import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { getActivePresetServer } from "@/lib/demo/presets/resolve-server";
import "./globals.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// Server Component: reads the preset cookie server-side so the description
// always matches what's about to render — no static string frozen on
// "hamburguesas". buildPreset()'s own dev-time validation is intentionally
// non-fatal (registry.ts/builder.ts — tests are the real gate), but metadata
// generation runs on every route on every request, so a genuine crash here
// (a malformed preset definition, not just a validation warning) must not
// take down the whole site — fall back to a generic description instead.
export async function generateMetadata(): Promise<Metadata> {
  let productPlural = "restaurante";
  try {
    const preset = await getActivePresetServer();
    productPlural = `restaurante de ${preset.lexicon.product.plural}`;
  } catch (error) {
    console.error("[presets] generateMetadata: failed to resolve active preset", error);
  }
  return {
    title: "Morfito - Sistema de Operaciones",
    description: `Sistema de operaciones para ${productPlural}`,
    generator: "v0.app",
    icons: {
      icon: [
        {
          url: "/favicon.png",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: "/favicon.png",
          media: "(prefers-color-scheme: dark)",
        },
        {
          url: "/favicon.png",
          type: "image/png",
        },
      ],
      apple: "/favicon.png",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
