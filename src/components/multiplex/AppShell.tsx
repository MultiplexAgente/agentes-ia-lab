import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Menu,
  Plug,
  Plus,
  Settings,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { CLOSE_SIDEBAR_EVENT, MultiplexMark, NEW_CHAT_EVENT } from "@/components/multiplex/ChatWorkspace";
import { ThemeToggle } from "@/components/multiplex/ThemeToggle";
import { api, clearToken, getToken } from "@/lib/multiplex/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/inicio", label: "Início", icon: LayoutDashboard },
  { to: "/", label: "Conversas", icon: MessageSquare },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/catalogo", label: "Catálogo", icon: Boxes },
  { to: "/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/integracoes", label: "Integrações", icon: Plug },
  { to: "/empresa", label: "Configurações", icon: Settings },
] as const;

interface Profile {
  user: { email: string; role: string };
  company: { id: string; name: string };
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api<Profile>("/api/company/overview")
      .then((data) => setProfile({ user: data.user, company: data.company }))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  return { profile, loading };
}

export function AppShell({ children, secondary }: { children: ReactNode; secondary?: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { profile } = useProfile();
  const [navOpen, setNavOpen] = useState(false);

  const isChat = pathname === "/";

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = () => setNavOpen(false);
    window.addEventListener(CLOSE_SIDEBAR_EVENT, handler);
    return () => window.removeEventListener(CLOSE_SIDEBAR_EVENT, handler);
  }, []);

  const accountInitials = (profile?.user.email ?? "?").slice(0, 2).toLocaleUpperCase("pt-BR");
  const accountName = profile?.user.email?.split("@")[0] ?? null;
  const companyName = profile?.company.name ?? null;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">

      {/* ── MOBILE OVERLAY ────────────────────────────────────────────────── */}
      {navOpen && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-[oklch(0.115_0.018_240)] transition-transform duration-200 lg:static lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo + controls */}
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <MultiplexMark className="size-6" />
            <span className="text-[13px] font-semibold tracking-[0.15em] text-white/90">
              MULTIPLEX
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-white/50 hover:text-white lg:hidden"
              onClick={() => setNavOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* New chat */}
        <div className="shrink-0 px-3 pb-2">
          <button
            id="multiplex-new-chat"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/8 hover:text-white"
            onClick={async () => {
              if (pathname !== "/") await navigate({ to: "/" });
              window.dispatchEvent(new Event(NEW_CHAT_EVENT));
            }}
          >
            <Plus className="size-4" />
            Novo chat
          </button>
        </div>

        {/* Nav */}
        <nav className="shrink-0 px-3">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:bg-white/6 hover:text-white/85",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Conversation history (only injected on chat page) */}
        {isChat && secondary ? (
          <div className="mt-2 flex min-h-0 flex-1 flex-col border-t border-white/[0.06] pt-1 [&_input]:text-white/70 [&_input]:placeholder:text-white/35">
            {secondary}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.06] p-3">
          {profile ? (
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
              {/* Avatar */}
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/30 text-[11px] font-bold text-primary">
                {accountInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-white/80">{accountName}</p>
                {companyName && (
                  <p className="truncate text-[11px] text-white/40">{companyName}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                title="Sair"
                className="size-7 shrink-0 text-white/40 hover:text-white"
                onClick={() => {
                  clearToken();
                  window.location.assign("/entrar");
                }}
              >
                <LogOut className="size-3.5" />
              </Button>
            </div>
          ) : (
            <button
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[13px] font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white/90"
              onClick={() => navigate({ to: "/entrar" })}
            >
              Entrar na minha empresa
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/40 px-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setNavOpen(true)}
          >
            <Menu className="size-4" />
          </Button>
          <span className="text-[13px] font-semibold tracking-[0.15em]">MULTIPLEX</span>
        </div>

        {children}
      </main>
    </div>
  );
}
