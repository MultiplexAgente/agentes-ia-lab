import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const TOKEN_KEY = "multiplex_company_token";

// O nome real do modelo nunca aparece: mostramos o "motor" escolhido.
const TIER_LABELS: Record<string, string> = {
  quality: "Motor máxima qualidade",
  balanced: "Motor equilibrado",
  fast: "Motor rápido",
  cheap: "Motor econômico",
  code: "Motor técnico",
};

interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number | null;
}

interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
  ingredients: string[] | null;
  preparation_time_minutes: number | null;
}

interface Settings {
  strategy: string;
  categoryStrategies: Record<string, string>;
  modelPrices: Record<string, { input: number; output: number }>;
  monthlyBudgetUsd: number | null;
  defaultModelAlias?: "gpt" | "claude" | "deepseek";
}

interface Workspace {
  company: { id: string; name: string };
  user: { email: string; role: string };
  settings: Settings;
  categories: Category[];
  products: Product[];
  usage: { calls: number; tokens: number; costUsd: number; byChannel: Record<string, number> };
  catalog: {
    models: Array<{ id: string; tier: string }>;
    tasks: Array<{ id: string; label: string }>;
    strategies: Array<{ id: string; label: string }>;
  };
}

export const Route = createFileRoute("/empresa")({
  head: () => ({
    meta: [
      { title: "Painel da empresa · Multiplex" },
      {
        name: "description",
        content:
          "Cada empresa configura seu próprio catálogo, prioridades de atendimento da Multiplex e preço por token.",
      },
      { property: "og:title", content: "Painel da empresa · Multiplex" },
      {
        property: "og:description",
        content: "Configure catálogo, prioridades de atendimento e preço por token da sua empresa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompanyPage,
});

function CompanyPage() {
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<Workspace | null>(null);
  const [draft, setDraft] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstAccess, setFirstAccess] = useState(false);

  const [form, setForm] = useState({
    id: "",
    name: "",
    price: "",
    categoryId: "",
    description: "",
    ingredients: "",
    prep: "20",
    available: true,
  });
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY));
  }, []);

  const load = useCallback(async (bearer: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/company/workspace", {
        headers: { Authorization: `Bearer ${bearer}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Não foi possível carregar seus dados.");
      setData(payload as Workspace);
      setDraft((payload as Workspace).settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar seus dados.");
      if (String(err).includes("login")) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) void load(token);
  }, [token, load]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/company/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, create: firstAccess }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "E-mail ou senha inválidos.");
      localStorage.setItem(TOKEN_KEY, payload.accessToken);
      setToken(payload.accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setData(null);
    setDraft(null);
  };

  const saveSettings = async () => {
    if (!token || !draft) return;
    setNotice(null);
    const response = await fetch("/api/company/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ settings: draft }),
    });
    const payload = await response.json();
    setNotice(response.ok ? "Configurações salvas." : (payload.error ?? "Falha ao salvar."));
    if (response.ok) await load(token);
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setNotice(null);
    const response = await fetch("/api/company/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        ...(form.id ? { id: form.id } : {}),
        name: form.name,
        price: form.price,
        categoryId: form.categoryId || null,
        description: form.description || null,
        available: form.available,
        ingredients: form.ingredients
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        preparationTimeMinutes: form.prep,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setNotice(payload.error ?? "Falha ao salvar o produto.");
      return;
    }
    setNotice(form.id ? "Produto atualizado." : "Produto adicionado.");
    setForm({ id: "", name: "", price: "", categoryId: "", description: "", ingredients: "", prep: "20", available: true });
    await load(token);
  };

  const addCategory = async () => {
    if (!token || !newCategory.trim()) return;
    const response = await fetch("/api/company/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ categoryName: newCategory }),
    });
    const payload = await response.json();
    setNotice(response.ok ? "Categoria criada." : (payload.error ?? "Falha ao criar categoria."));
    setNewCategory("");
    if (response.ok) await load(token);
  };

  const removeProduct = async (id: string) => {
    if (!token) return;
    const response = await fetch(`/api/company/products?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => ({}));
    setNotice(response.ok ? "Produto removido." : (payload.error ?? "Falha ao remover."));
    if (response.ok) await load(token);
  };

  if (!token || !data) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
        <h1 className="mb-1 text-2xl font-semibold">Painel da empresa</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Entre com o e-mail do responsável para configurar catálogo, prioridades de atendimento e preço por token.
        </p>
        <form onSubmit={signIn} className="space-y-3">
          <input
            type="email"
            required
            placeholder="E-mail"
            className="w-full rounded-md border border-input bg-background p-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            type="password"
            required
            placeholder="Senha"
            className="w-full rounded-md border border-input bg-background p-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={firstAccess}
              onChange={(event) => setFirstAccess(event.target.checked)}
            />
            É meu primeiro acesso: criar minha senha
          </label>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (firstAccess ? "Criando acesso…" : "Entrando…") : firstAccess ? "Criar senha e entrar" : "Entrar"}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{data.company.name}</h1>
          <p className="text-sm text-muted-foreground">{data.user.email}</p>
        </div>
        <Button variant="outline" onClick={signOut}>
          Sair
        </Button>
      </header>

      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
      {notice && <p className="mb-4 text-sm text-muted-foreground">{notice}</p>}

      <section className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Conversas" value={String(data.usage.calls)} />
        <Card label="Tokens" value={data.usage.tokens.toLocaleString("pt-BR")} />
        <Card label="Custo" value={`US$ ${data.usage.costUsd.toFixed(4)}`} />
        <Card label="Produtos" value={String(data.products.length)} />
      </section>

      <section className="mb-8 rounded-lg border border-border p-4">
        <h2 className="mb-1 text-lg font-medium">Catálogo</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          A Multiplex responde sobre preço e disponibilidade usando exatamente o que está aqui.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            placeholder="Nova categoria"
            className="rounded-md border border-input bg-background p-2 text-sm"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
          />
          <Button variant="outline" onClick={addCategory}>
            Criar categoria
          </Button>
        </div>

        <form onSubmit={saveProduct} className="mb-6 grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Nome do produto"
            className="rounded-md border border-input bg-background p-2 text-sm"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <input
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="Preço (R$)"
            className="rounded-md border border-input bg-background p-2 text-sm"
            value={form.price}
            onChange={(event) => setForm({ ...form, price: event.target.value })}
          />
          <select
            className="rounded-md border border-input bg-background p-2 text-sm"
            value={form.categoryId}
            onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
          >
            <option value="">Sem categoria</option>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            placeholder="Tempo de preparo (min)"
            className="rounded-md border border-input bg-background p-2 text-sm"
            value={form.prep}
            onChange={(event) => setForm({ ...form, prep: event.target.value })}
          />
          <input
            placeholder="Descrição"
            className="rounded-md border border-input bg-background p-2 text-sm"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <input
            placeholder="Ingredientes separados por vírgula"
            className="rounded-md border border-input bg-background p-2 text-sm"
            value={form.ingredients}
            onChange={(event) => setForm({ ...form, ingredients: event.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(event) => setForm({ ...form, available: event.target.checked })}
            />
            Disponível para venda
          </label>
          <div className="flex items-center gap-2">
            <Button type="submit">{form.id ? "Salvar alterações" : "Adicionar produto"}</Button>
            {form.id && (
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  setForm({ id: "", name: "", price: "", categoryId: "", description: "", ingredients: "", prep: "20", available: true })
                }
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>

        {!data.products.length && <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>}
        {!!data.products.length && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="p-2">Produto</th>
                  <th className="p-2">Categoria</th>
                  <th className="p-2">Preço</th>
                  <th className="p-2">Status</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody>
                {data.products.map((product) => (
                  <tr key={product.id} className="border-t border-border">
                    <td className="p-2">{product.name}</td>
                    <td className="p-2 text-xs text-muted-foreground">
                      {data.categories.find((category) => category.id === product.category_id)?.name ?? "—"}
                    </td>
                    <td className="p-2 whitespace-nowrap">
                      R$ {Number(product.price).toFixed(2).replace(".", ",")}
                    </td>
                    <td className="p-2 text-xs">{product.available ? "Disponível" : "Indisponível"}</td>
                    <td className="p-2 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setForm({
                            id: product.id,
                            name: product.name,
                            price: String(product.price),
                            categoryId: product.category_id ?? "",
                            description: product.description ?? "",
                            ingredients: (product.ingredients ?? []).join(", "),
                            prep: String(product.preparation_time_minutes ?? 20),
                            available: product.available,
                          })
                        }
                      >
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => removeProduct(product.id)}>
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {draft && (
        <section className="rounded-lg border border-border p-4">
          <h2 className="mb-1 text-lg font-medium">Prioridades de atendimento e custo</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Quem conversa nunca escolhe nada: a Multiplex decide sozinha. Aqui você define o que ela deve
            priorizar em cada tipo de pedido e o preço por 1 milhão de tokens.
          </p>

          <label className="mb-4 block max-w-sm text-sm">
            <span className="mb-1 block font-medium">Inteligência padrão da empresa</span>
            <select
              className="w-full rounded-md border border-input bg-background p-2"
              value={draft.defaultModelAlias ?? "gpt"}
              onChange={(event) =>
                setDraft({ ...draft, defaultModelAlias: event.target.value as Settings["defaultModelAlias"] })
              }
            >
              <option value="gpt">GPT</option>
              <option value="claude">CLAUDE</option>
              <option value="deepseek">DEEPSEEK</option>
            </select>
          </label>

          <label className="mb-4 block max-w-sm text-sm">
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

          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            {data.catalog.tasks.map((task) => (
              <label key={task.id} className="block text-sm">
                <span className="mb-1 block font-medium">{task.label}</span>
                <select
                  className="w-full rounded-md border border-input bg-background p-2"
                  value={draft.categoryStrategies[task.id] ?? ""}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      categoryStrategies: { ...draft.categoryStrategies, [task.id]: event.target.value },
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

          <h3 className="mb-2 text-sm font-medium">Preço por 1M de tokens (USD)</h3>
          <div className="mb-4 space-y-2">
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

          <label className="mb-4 block max-w-xs text-sm">
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

          <Button onClick={saveSettings}>Salvar configurações</Button>
        </section>
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
