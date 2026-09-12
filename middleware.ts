import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
// Edge-runtime constraint (presets plan, "Diseño" §3): middleware.ts may
// ONLY import ids.ts, which has ZERO further imports. Never import
// registry.ts, builder.ts, or definitions/* here — those pull all 8
// presets' data into the edge bundle.
import { PRESET_COOKIE, PRESET_COOKIE_MAX_AGE_SECONDS, isPresetId } from "./lib/demo/presets/ids"

const SESSION_COOKIE = "morfito_session"
const PRESET_QUERY_PARAM = "negocio"

export function middleware(request: NextRequest) {
  const isLoggedIn = request.cookies.get(SESSION_COOKIE)?.value === "1"
  const { pathname, searchParams } = request.nextUrl

  const rawPreset = searchParams.get(PRESET_QUERY_PARAM)
  const presetId = isPresetId(rawPreset) ? rawPreset : null

  let response: NextResponse

  if (!isLoggedIn && pathname !== "/login") {
    // `new URL("/login", request.url)` builds a clean URL with no search
    // params, so the redirect target is already stripped of `?negocio=`.
    response = NextResponse.redirect(new URL("/login", request.url))
  } else if (isLoggedIn && pathname === "/login") {
    response = NextResponse.redirect(new URL("/", request.url))
  } else if (presetId) {
    // Neither auth redirect applies but a valid `?negocio=` is present —
    // strip it from the URL so it doesn't linger after being consumed.
    const cleanUrl = request.nextUrl.clone()
    cleanUrl.searchParams.delete(PRESET_QUERY_PARAM)
    response = NextResponse.redirect(cleanUrl)
  } else {
    response = NextResponse.next()
  }

  // Set the cookie on whichever response we were already going to return
  // (including the /login redirect) — this is what makes a cold-session
  // deep link like `/?negocio=pizzeria` survive the login redirect: the
  // Set-Cookie header rides on the very 307 that sends the user to /login.
  // An invalid/missing value is silently ignored — never clears an existing
  // cookie, never crashes.
  if (presetId) {
    response.cookies.set(PRESET_COOKIE, presetId, {
      httpOnly: false,
      path: "/",
      sameSite: "lax",
      maxAge: PRESET_COOKIE_MAX_AGE_SECONDS,
    })
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.jpg|.*\\.png|.*\\.svg|.*\\.webp).*)"],
}
