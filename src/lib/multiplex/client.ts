/** Cliente de sessão do Multiplex. Nenhum dado de empresa é enviado pelo navegador. */

const TOKEN_KEY = "multiplex.session.token";
const PUBLIC_SESSION_KEY = "multiplex.public.session";

export interface SessionUser {
  email: string;
  role: string;
  companyName: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

/** Sessão pública estável: mantida entre recargas para preservar a conversa. */
export function getPublicSessionId(): string {
  if (typeof window === "undefined") return "00000000-0000-4000-8000-000000000000";
  const existing = window.localStorage.getItem(PUBLIC_SESSION_KEY);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(PUBLIC_SESSION_KEY, created);
  return created;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit & { auth?: boolean }): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token && init?.auth !== false) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(path, { ...init, headers });
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    throw new ApiError(payload?.error ?? `Falha na requisição (${response.status}).`, response.status);
  }
  return payload as T;
}

export function money(value: unknown): string {
  return Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function relativeGroup(iso: string): "Hoje" | "Ontem" | "Esta semana" | "Mais antigas" {
  const date = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const time = date.getTime();
  if (time >= startOfToday) return "Hoje";
  if (time >= startOfToday - 86_400_000) return "Ontem";
  if (time >= startOfToday - 7 * 86_400_000) return "Esta semana";
  return "Mais antigas";
}

export function shortTime(iso: string): string {
  const date = new Date(iso);
  const group = relativeGroup(iso);
  return group === "Hoje"
    ? date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
