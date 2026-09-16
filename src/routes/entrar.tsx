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
      { title: "Entrar | Multiplex" },
      { name: "description", content: "Acesse a conta da sua empresa no Multiplex." },
      { property: "og:title", content: "Entrar | Multiplex" },
      { property: "og:description", content: "Acesse a conta da sua empresa no Multiplex." },
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
        <p className="mb-8 text-center font-display text-xl font-semibold tracking-[0.16em]">MULTIPLEX</p>
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border/60 bg-card/50 p-6 backdrop-blur">
          <h1 className="text-lg font-semibold">Entrar na sua empresa</h1>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
