const DEMO_EMAIL = "admin@morfito.app"
const DEMO_PASSWORD = "demo1234"
export const SESSION_COOKIE = "morfito_session"

export const DEMO_CREDENTIALS = {
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
}

export function login(email: string, password: string): boolean {
  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=86400`
    return true
  }
  return false
}

export function logout() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`
}
