import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, setToken } from "@/lib/multiplex/client";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar | VENDRA by BonaSoft" },
      { name: "description", content: "Acesse a conta da sua empresa no VENDRA by BonaSoft." },
      { property: "og:title", content: "Entrar | VENDRA by BonaSoft" },
      { property: "og:description", content: "Acesse a conta da sua empresa no VENDRA by BonaSoft." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ accessToken: string }>("/api/company/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password }),
      });
      setToken(data.accessToken);
      await navigate({ to: "/inicio" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center justify-center gap-1.5">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black text-lg tracking-wider shadow-md">
            V
          </div>
          <p className="font-display text-2xl font-black tracking-tight">VENDRA</p>
          <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">by BonaSoft</p>
          <p className="text-xs text-muted-foreground mt-0.5">Seu negócio. Seu próximo nível.</p>
        </div>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur">
          <h1 className="text-lg font-semibold">Entrar na sua conta</h1>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
            Entrar
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => void navigate({ to: "/" })}>
            Voltar para o chat
          </Button>
        </form>
      </div>
    </main>
  );
}
