import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Plug,
  Plus,
  Settings,
  ShoppingBag,
  Users,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = () => setNavOpen(false);
    window.addEventListener(CLOSE_SIDEBAR_EVENT, handler);
    return () => window.removeEventListener(CLOSE_SIDEBAR_EVENT, handler);
  }, []);

  const accountName = profile?.user.email?.split("@")[0] ?? null;
  const initials = (profile?.user.email ?? "?").slice(0, 2).toLocaleUpperCase("pt-BR");

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      {/* SIDEBAR */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-border/60 bg-card/50 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <span className="flex items-center gap-2 text-[15px] font-semibold tracking-[0.12em] text-foreground">
            <MultiplexMark className="size-6" />
            MULTIPLEX
          </span>
          <div className="flex items-center">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setNavOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="px-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 font-medium"
            onClick={async () => {
              if (pathname !== "/") await navigate({ to: "/" });
              window.dispatchEvent(new Event(NEW_CHAT_EVENT));
            }}
          >
            <Plus className="size-4" />
            Novo chat
          </Button>
        </div>

        <nav className="mt-3 flex shrink-0 flex-col gap-0.5 px-2">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-primary/12 text-foreground"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                )}
              >
                <item.icon className={cn("size-4", active && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* HISTÓRICO DENTRO DA SIDEBAR */}
        {secondary ? (
          <div className="mt-3 flex min-h-0 flex-1 flex-col border-t border-border/50">{secondary}</div>
        ) : (
          <div className="flex-1" />
        )}

        <Separator />
        <div className="p-2">
          {profile ? (
            <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                {initials}
              </div>
              <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{accountName}</p>
              <Button
                variant="ghost"
                size="icon"
                title="Sair"
                onClick={() => {
                  clearToken();
                  window.location.assign("/entrar");
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" className="w-full text-[13px]" onClick={() => navigate({ to: "/entrar" })}>
              Entrar na minha empresa
            </Button>
          )}
        </div>
      </aside>

      {navOpen && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* CONTEÚDO */}
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setNavOpen(true)}>
            <Menu className="size-4" />
          </Button>
          <span className="text-sm font-semibold tracking-[0.12em]">MULTIPLEX</span>
        </div>
        {children}
      </main>
    </div>
  );
}
