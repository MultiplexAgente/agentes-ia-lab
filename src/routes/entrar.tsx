import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, setToken } from "@/lib/multiplex/client";
import hugLogo from "@/assets/hug-icon.jpg";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar | HUG" },
      { name: "description", content: "Acesse a conta da sua empresa no HUG." },
      { property: "og:title", content: "Entrar | HUG" },
      { property: "og:description", content: "Acesse a conta da sua empresa no HUG." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [codigoEmpresa, setCodigoEmpresa] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Carrega automaticamente o código da loja salvo no dispositivo
  useEffect(() => {
    const salvo =
      localStorage.getItem("hug_codigo_loja") ||
      localStorage.getItem("hug_codigo_farmacia") ||
      "0001";
    if (salvo) setCodigoEmpresa(salvo);
  }, []);

  const handleCodigoChange = (valor: string) => {
    const limpo = valor.trim();
    setCodigoEmpresa(limpo);
    if (limpo) {
      localStorage.setItem("hug_codigo_loja", limpo);
    }
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (codigoEmpresa) {
        localStorage.setItem("hug_codigo_loja", codigoEmpresa);
      }
      const data = await api<{ accessToken: string }>("/api/company/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password, companyCode: codigoEmpresa }),
      });
      setToken(data.accessToken);
      await navigate({ to: "/inicio" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar no HUG.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center justify-center text-center">
          <img
            src={hugLogo}
            alt="HUG"
            className="size-16 rounded-3xl object-cover shadow-2xl ring-2 ring-primary/40 shrink-0 mb-3"
          />
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">HUG</h1>
          <p className="text-xs text-muted-foreground">Seu negócio, em outra órbita.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border/80 bg-card/90 backdrop-blur p-6 shadow-xl">
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Acesso Empresarial</h2>
            <p className="text-xs text-muted-foreground">Informe o código da sua unidade e suas credenciais.</p>
          </div>

          {/* Campo Pequeno de Código da Empresa com Memória Local */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="codigo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cód. Empresa / Loja
              </Label>
              <span className="text-[10px] text-muted-foreground font-mono">Salvo no aparelho</span>
            </div>
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="codigo"
                type="text"
                value={codigoEmpresa}
                onChange={(e) => handleCodigoChange(e.target.value)}
                placeholder="Ex: 1056 ou 0001"
                className="pl-9 font-mono text-sm tracking-wide bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                required
                className="pl-9 text-sm bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="pl-9 text-sm bg-background/50"
              />
            </div>
          </div>

          {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-md">{error}</p>}

          <Button type="submit" className="w-full font-semibold shadow-lg shadow-primary/20" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Acessando...
              </>
            ) : (
              <>
                Entrar no HUG
                <ArrowRight className="ml-2 size-4" />
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => void navigate({ to: "/" })}
          >
            Voltar para o início
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          © 2026 BonaSoft. Todos os direitos reservados.
        </p>
      </div>
    </main>
  );
}
