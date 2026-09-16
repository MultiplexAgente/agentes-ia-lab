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
  LogIn,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { CLOSE_SIDEBAR_EVENT, MultiplexMark, NEW_CHAT_EVENT } from "@/components/multiplex/ChatWorkspace";
import { ThemeToggle } from "@/components/multiplex/ThemeToggle";
import { api, clearToken, getToken } from "@/lib/multiplex/client";
import { cn } from "@/lib/utils";

const ENTERPRISE_NAV = [
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
  const { profile, loading } = useProfile();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = () => setNavOpen(false);
    window.addEventListener(CLOSE_SIDEBAR_EVENT, handler);
    return () => window.removeEventListener(CLOSE_SIDEBAR_EVENT, handler);
  }, []);

  // Proteção de rotas da empresa: visitantes são direcionados para /entrar
  useEffect(() => {
    const isProtected = ["/inicio", "/clientes", "/catalogo", "/pedidos", "/integracoes", "/empresa"].some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
    if (isProtected && !loading && !getToken()) {
      void navigate({ to: "/entrar" });
    }
  }, [pathname, loading, navigate]);

  const accountName = profile?.user.email?.split("@")[0] ?? null;
  const companyName = profile?.company.name ?? "Minha Empresa";
  const initials = (profile?.user.email ?? "?").slice(0, 2).toLocaleUpperCase("pt-BR");

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background text-foreground">
      {/* SIDEBAR */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] sm:w-[280px] flex-col border-r border-border/60 bg-card/60 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* TOPO DA SIDEBAR */}
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[0.12em] text-foreground">
            <MultiplexMark className="size-6 shadow-sm" />
            <span>MULTIPLEX</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setNavOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* BOTÃO NOVO CHAT */}
        <div className="px-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2.5 rounded-xl border-border/70 font-medium text-foreground hover:bg-muted/60 transition-colors"
            onClick={async () => {
              if (pathname !== "/") await navigate({ to: "/" });
              window.dispatchEvent(new Event(NEW_CHAT_EVENT));
            }}
          >
            <Plus className="size-4 text-muted-foreground" />
            <span>Novo chat</span>
          </Button>
        </div>

        {/* NAVEGAÇÃO OPERACIONAL — APENAS PARA USUÁRIO LOGADO */}
        {profile ? (
          <nav className="mt-3 flex shrink-0 flex-col gap-0.5 px-2">
            <p className="px-2.5 py-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              Operações
            </p>
            {ENTERPRISE_NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-primary/12 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  <item.icon className={cn("size-4", active && "text-primary")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        {/* ÁREA DE HISTÓRICO DE CONVERSAS */}
        {secondary ? (
          <div className="mt-3 flex min-h-0 flex-1 flex-col border-t border-border/40">
            {secondary}
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* RODAPÉ DA SIDEBAR */}
        <div className="mt-auto shrink-0 border-t border-border/50 p-3">
          {profile ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-muted/30 p-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">{accountName}</p>
                <p className="truncate text-[11px] text-muted-foreground">{companyName}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                title="Sair da conta"
                onClick={() => {
                  clearToken();
                  window.location.assign("/entrar");
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="text-xs font-semibold text-foreground">Acesse sua conta</p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Faça login para salvar suas conversas, personalizar respostas e acessar ferramentas.
              </p>
              <Button
                size="sm"
                className="mt-2.5 w-full justify-center gap-1.5 rounded-lg text-xs font-medium"
                onClick={() => navigate({ to: "/entrar" })}
              >
                <LogIn className="size-3.5" />
                <span>Entrar</span>
              </Button>
            </div>
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

      {/* ÁREA PRINCIPAL */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* HEADER MOBILE */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-3 lg:hidden">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setNavOpen(true)}>
              <Menu className="size-4" />
            </Button>
            <span className="text-sm font-semibold tracking-[0.12em]">MULTIPLEX</span>
          </div>
          {!profile && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full text-xs font-medium"
              onClick={() => navigate({ to: "/entrar" })}
            >
              <LogIn className="size-3" />
              <span>Entrar</span>
            </Button>
          )}
        </div>
        {children}
      </main>
    </div>
  );
}
