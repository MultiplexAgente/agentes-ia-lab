import { Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { api, getToken } from "@/lib/multiplex/client";

export function useCompanyData<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!getToken()) {
      setError("Entre na conta da sua empresa para ver estes dados.");
      setLoading(false);
      return;
    }
    setLoading(true);
    api<T>(path)
      .then((result) => {
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Falha ao carregar."))
      .finally(() => setLoading(false));
  }, [path, reloadKey]);

  return { data, error, loading, reload: () => setReloadKey((key) => key + 1) };
}

export function PageFrame({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border/60 px-5">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-medium">{title}</h1>
          {description && <p className="truncate text-xs text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">{children}</div>
    </div>
  );
}

export function StateBlock({
  loading,
  error,
  empty,
  emptyText,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Carregando dados reais...
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={() => window.location.assign("/entrar")}>
            Entrar
          </Button>
        </div>
      </div>
    );
  }
  if (empty) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return <>{children}</>;
}
