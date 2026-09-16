import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Plug,
  Settings,
  ShoppingBag,
  Users,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NEW_CHAT_EVENT } from "@/components/multiplex/ChatWorkspace";
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
  const [listOpen, setListOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
    setListOpen(false);
  }, [pathname]);

  const initials = (profile?.user.email ?? "?").slice(0, 2).toLocaleUpperCase("pt-BR");

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      {/* SIDEBAR */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-border/60 bg-card/60 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <span className="font-display text-lg font-semibold tracking-[0.14em] text-foreground">MULTIPLEX</span>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setNavOpen(false)}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="px-3">
          <Button
            className="w-full justify-start gap-2"
            onClick={async () => {
              if (pathname !== "/") await navigate({ to: "/" });
              window.dispatchEvent(new Event(NEW_CHAT_EVENT));
            }}
          >
            <MessageSquare className="size-4" />
            Novo chat
          </Button>
        </div>

        <ScrollArea className="mt-4 flex-1 px-2">
          <nav className="flex flex-col gap-0.5 pb-4">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
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
        </ScrollArea>

        <Separator />
        <div className="p-3">
          {profile ? (
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{profile.company.name}</p>
                <p className="truncate text-xs text-muted-foreground">{profile.user.email}</p>
                <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground/70">
                  {profile.user.role}
                </p>
              </div>
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
            <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/entrar" })}>
              Entrar na minha empresa
            </Button>
          )}
        </div>
      </aside>

      {(navOpen || listOpen) && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden"
          onClick={() => {
            setNavOpen(false);
            setListOpen(false);
          }}
        />
      )}

      {/* COLUNA SECUNDÁRIA */}
      {secondary && (
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-[300px] flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 xl:w-[300px]",
            listOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {secondary}
        </div>
      )}

      {/* CONTEÚDO */}
      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-border/60 px-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setNavOpen(true)}>
            <Menu className="size-4" />
          </Button>
          {secondary && (
            <Button variant="ghost" size="sm" onClick={() => setListOpen(true)}>
              Conversas
            </Button>
          )}
          <span className="font-display text-sm font-semibold tracking-[0.14em]">MULTIPLEX</span>
        </div>
        {children}
      </main>
    </div>
  );
}
