import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

// O nome real do modelo nunca aparece na tela: mostramos o "motor" escolhido.
const TIER_LABELS: Record<string, string> = {
  quality: "Motor máxima qualidade",
  balanced: "Motor equilibrado",
  fast: "Motor rápido",
  cheap: "Motor econômico",
  code: "Motor técnico",
};

interface AuditLog {
  id: string;
  created_at: string;
  channel: string;
  task_category: string;
  complexity: string;
  strategy: string;
  engine: string;
  fallback_used: boolean;
  user_message: string | null;
  assistant_message: string | null;
  tokens_prompt: number | null;
  tokens_completion: number | null;
  cost_usd: number | null;
  cost_status: string | null;
  latency_ms: number | null;
  context_sources: string[] | null;
  error: string | null;
}

interface AdminPayload {
  company: { id: string; name: string };
  companies: Array<{ id: string; name: string }>;
  settings: {
    strategy: string;
    categoryStrategies: Record<string, string>;
    modelPrices: Record<string, { input: number; output: number }>;
    monthlyBudgetUsd: number | null;
  };
  settingsPersisted: boolean;
  settingsError: string | null;
  logs: AuditLog[];
  logsError: string | null;
  summary: {
    calls: number;
    tokens: number;
    costUsd: number;
    avgLatencyMs: number;
    byModel: Record<string, number>;
    byTask: Record<string, number>;
  };
  catalog: {
    models: Array<{ id: string; tier: string }>;
    tasks: Array<{ id: string; label: string }>;
    strategies: Array<{ id: string; label: string }>;
  };
}

export const Route = createFileRoute("/admin/ai-routing")({
  head: () => ({
    meta: [
      { title: "Auditoria de roteamento · Multiplex IA" },
      {
        name: "description",
        content:
          "Painel administrativo do Multiplex IA: logs de cada conversa, modelo escolhido, tokens, custo e prioridades de roteamento por empresa.",
      },
      { property: "og:title", content: "Auditoria de roteamento · Multiplex IA" },
      {
        property: "og:description",
        content: "Logs de conversas, modelo escolhido, custo e prioridades de roteamento por empresa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AiRoutingAdminPage,
});

function AiRoutingAdminPage() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState<AdminPayload["settings"] | null>(null);
  const [companyId, setCompanyId] = useState<string>("");
  const token = typeof window === "undefined" ? null : localStorage.getItem("multiplex_company_token");

  const load = useCallback(async (selected?: string) => {
    setLoading(true);
    setError(null);
    try {
       const response = await fetch(`/api/admin/ai-routing?limit=100`, {
         headers: token ? { Authorization: `Bearer ${token}` } : {},
       });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Falha ao carregar a auditoria.");
      setData(payload as AdminPayload);
      setDraft((payload as AdminPayload).settings);
      setCompanyId((payload as AdminPayload).company.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar a auditoria.");
    } finally {
      setLoading(false);
    }
   }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/ai-routing", {
        method: "POST",
         headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
         body: JSON.stringify({ settings: draft }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Falha ao salvar.");
      setNotice("Prioridades salvas.");
      await load(companyId);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const money = useMemo(
    () => (value: number | null) =>
      value === null || value === undefined
        ? "—"
        : `US$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 6, maximumFractionDigits: 6 })}`,
    [],
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Auditoria de roteamento</h1>
        <p className="text-sm text-muted-foreground">
          Visível apenas ao administrador: modelo real escolhido em cada conversa, tokens, custo, latência e as
          prioridades de roteamento da empresa.
        </p>

        {data && data.companies.length > 1 && (
          <label className="mt-4 block max-w-sm text-sm">
            <span className="mb-1 block font-medium">Empresa</span>
            <select
              className="w-full rounded-md border border-input bg-background p-2"
              value={companyId}
              onChange={(event) => {
                setCompanyId(event.target.value);
                void load(event.target.value);
              }}
            >
              {data.companies.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</p>
      )}

      {data && (
        <div className="space-y-8">
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card label="Empresa" value={data.company.name} />
            <Card label="Conversas registradas" value={String(data.summary.calls)} />
            <Card label="Tokens" value={data.summary.tokens.toLocaleString("pt-BR")} />
            <Card label="Latência média" value={`${data.summary.avgLatencyMs} ms`} />
          </section>

          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-1 text-lg font-medium">Prioridades de roteamento</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              O usuário nunca escolhe modelo. Aqui você define a prioridade geral e por tipo de tarefa.
            </p>

            {data.settingsError && (
              <p className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                As tabelas de auditoria ainda não existem no banco: {data.settingsError}
              </p>
            )}

            {draft && (
              <div className="space-y-4">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium">Prioridade geral</span>
                  <select
                    className="w-full rounded-md border border-input bg-background p-2"
                    value={draft.strategy}
                    onChange={(event) => setDraft({ ...draft, strategy: event.target.value })}
                  >
                    {data.catalog.strategies.map((strategy) => (
                      <option key={strategy.id} value={strategy.id}>
                        {strategy.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  {data.catalog.tasks.map((task) => (
                    <label key={task.id} className="block text-sm">
                      <span className="mb-1 block font-medium">{task.label}</span>
                      <select
                        className="w-full rounded-md border border-input bg-background p-2"
                        value={draft.categoryStrategies[task.id] ?? ""}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            categoryStrategies: {
                              ...draft.categoryStrategies,
                              [task.id]: event.target.value,
                            },
                          })
                        }
                      >
                        <option value="">Usar prioridade geral</option>
                        {data.catalog.strategies.map((strategy) => (
                          <option key={strategy.id} value={strategy.id}>
                            {strategy.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-medium">Preço por 1M de tokens (USD)</h3>
                  <p className="mb-2 text-xs text-muted-foreground">
                    O custo só é calculado com os preços que você informar aqui. Em branco, o log mostra os tokens
                    reais e o custo como não configurado.
                  </p>
                  <div className="space-y-2">
                    {data.catalog.models.map((model) => {
                      const price = draft.modelPrices[model.id] ?? { input: 0, output: 0 };
                      return (
                        <div key={model.id} className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="min-w-48 text-xs">{TIER_LABELS[model.tier] ?? model.tier}</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="entrada"
                            className="w-28 rounded-md border border-input bg-background p-1.5"
                            value={price.input || ""}
                            onChange={(event) =>
                              setDraft({
                                ...draft,
                                modelPrices: {
                                  ...draft.modelPrices,
                                  [model.id]: { ...price, input: Number(event.target.value) },
                                },
                              })
                            }
                          />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="saída"
                            className="w-28 rounded-md border border-input bg-background p-1.5"
                            value={price.output || ""}
                            onChange={(event) =>
                              setDraft({
                                ...draft,
                                modelPrices: {
                                  ...draft.modelPrices,
                                  [model.id]: { ...price, output: Number(event.target.value) },
                                },
                              })
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <label className="block max-w-xs text-sm">
                  <span className="mb-1 block font-medium">Orçamento mensal (USD)</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="w-full rounded-md border border-input bg-background p-2"
                    value={draft.monthlyBudgetUsd ?? ""}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        monthlyBudgetUsd: event.target.value === "" ? null : Number(event.target.value),
                      })
                    }
                  />
                </label>

                <div className="flex items-center gap-3">
                  <Button onClick={save} disabled={saving}>
                    {saving ? "Salvando…" : "Salvar prioridades"}
                  </Button>
                  {notice && <span className="text-sm text-muted-foreground">{notice}</span>}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 text-lg font-medium">Logs por conversa</h2>
            {data.logsError && (
              <p className="mb-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                {data.logsError}
              </p>
            )}
            {!data.logs.length && !data.logsError && (
              <p className="text-sm text-muted-foreground">Nenhuma conversa registrada ainda.</p>
            )}
            {!!data.logs.length && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-200 text-left text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="p-2">Quando</th>
                      <th className="p-2">Canal</th>
                      <th className="p-2">Tarefa</th>
                      <th className="p-2">Prioridade</th>
                      <th className="p-2">Modelo usado</th>
                      <th className="p-2">Tokens</th>
                      <th className="p-2">Custo</th>
                      <th className="p-2">Latência</th>
                      <th className="p-2">Mensagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.logs.map((log) => (
                      <tr key={log.id} className="border-t border-border align-top">
                        <td className="p-2 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          {log.channel === "whatsapp" ? "WhatsApp" : "Chat web"}
                        </td>
                        <td className="p-2">
                          {log.task_category} · {log.complexity}
                        </td>
                        <td className="p-2">{log.strategy}</td>
                        <td className="p-2">
                           {TIER_LABELS[log.engine] ?? "Motor interno"}
                          {log.fallback_used && <span className="ml-1 text-amber-500">(fallback)</span>}
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          {(log.tokens_prompt ?? 0) + (log.tokens_completion ?? 0)}
                        </td>
                        <td className="p-2 whitespace-nowrap">
                          {log.cost_usd === null ? log.cost_status : money(log.cost_usd)}
                        </td>
                        <td className="p-2 whitespace-nowrap">{log.latency_ms ?? 0} ms</td>
                        <td className="max-w-80 p-2">
                          <span className="line-clamp-2 block">{log.user_message}</span>
                          {log.error && <span className="text-destructive">{log.error}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-medium">{value}</p>
    </div>
  );
}
