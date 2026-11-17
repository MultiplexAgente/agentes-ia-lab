import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { COMMERCE_SEGMENTS, getSegmentConfig, type CommerceSegment, type SegmentConfig } from "@/lib/commerce/segments";
import { type CompanySegmentSettings, DEFAULT_SEGMENT_SETTINGS } from "@/lib/commerce/company-segments";
import { BonaParticleAtom } from "@/components/bonasoft/BonaLogo";

const TOKEN_KEY = "multiplex_company_token";

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
  segment?: CommerceSegment | null;
  barcode_ean?: string | null;
  sku?: string | null;
  unit_of_measure?: string | null;
  current_stock?: number | null;
  min_stock?: number | null;
  ingredients?: string[] | null;
  preparation_time_minutes?: number | null;
  segment_attributes?: Record<string, unknown> | null;
}

interface Settings {
  strategy: string;
  categoryStrategies: Record<string, string>;
  modelPrices: Record<string, { input: number; output: number }>;
  monthlyBudgetUsd: number | null;
  defaultModelAlias?: "gpt" | "claude" | "deepseek";
}

interface Workspace {
  company: {
    id: string;
    name: string;
    segment?: CommerceSegment;
    secondarySegments?: CommerceSegment[];
    activeSegments?: CommerceSegment[];
  };
  user: { email: string; role: string };
  settings: Settings;
  segmentSettings?: CompanySegmentSettings;
  availableSegments: SegmentConfig[];
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
      { title: "Configurações da Empresa | HUG ERP" },
      {
        name: "description",
        content:
          "Configurações da empresa, segmentos comerciais, catálogo e HUG AI no HUG by BonaSoft.",
      },
      { property: "og:title", content: "Configurações da Empresa | HUG ERP" },
      {
        property: "og:description",
        content: "Configurações da empresa, segmentos comerciais, catálogo e HUG AI no HUG by BonaSoft.",
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
  const [segmentsDraft, setSegmentsDraft] = useState<CompanySegmentSettings>(DEFAULT_SEGMENT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstAccess, setFirstAccess] = useState(false);

  // Formulário Dinâmico de Produtos por Segmento
  const [form, setForm] = useState({
    id: "",
    name: "",
    price: "",
    categoryId: "",
    description: "",
    segment: "food_service" as CommerceSegment,
    barcodeEan: "",
    sku: "",
    unitOfMeasure: "UN",
    currentStock: "0",
    minStock: "0",
    available: true,
    // Farmácia
    activeIngredient: "",
    dosage: "",
    manufacturer: "",
    anvisaRegistration: "",
    lotNumber: "",
    expirationDate: "",
    isControlled: false,
    requiresPrescription: false,
    isGeneric: false,
    // Mercado
    allowFractionalSale: false,
    tareWeightKg: "0",
    netWeightKg: "",
    // Moda
    size: "",
    color: "",
    fabricComposition: "",
    brand: "",
    collection: "",
    // Restaurante
    ingredients: "",
    prep: "20",
    servesPeople: "1",
    allergens: "",
    // Beleza
    serviceDurationMinutes: "30",
    professionalRequired: true,
    suggestedReturnDays: "",
    // Petshop
    targetSpecies: "cachorro" as any,
    petSize: "todos" as any,
    lifeStage: "adulta" as any,
    packageWeightKg: "",
    requiresVeterinaryPrescription: false,
    // Eletrônicos
    modelNumber: "",
    voltage: "bivolt" as any,
    warrantyMonths: "12",
    requiresSerialNumber: true,
    anatelHomologation: "",
    // Construção
    unitOfSale: "UN" as any,
    weightKgPerUnit: "",
    coverageYieldM2: "",
    heavyFreight: false,
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
      if (payload.segmentSettings) {
        setSegmentsDraft(payload.segmentSettings);
        setForm((prev) => ({ ...prev, segment: payload.segmentSettings.primarySegment }));
      }
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

  const saveSegmentSettings = async () => {
    if (!token) return;
    setNotice(null);
    const response = await fetch("/api/company/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ segmentSettings: segmentsDraft }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setNotice(payload.error ?? "Falha ao salvar os segmentos da empresa.");
      return;
    }
    setNotice("Segmentos da empresa atualizados com sucesso.");
    await load(token);
  };

  const toggleSecondarySegment = (seg: CommerceSegment) => {
    if (seg === segmentsDraft.primarySegment) return;
    const current = [...segmentsDraft.secondarySegments];
    const index = current.indexOf(seg);
    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(seg);
    }
    setSegmentsDraft({
      ...segmentsDraft,
      secondarySegments: current,
      activeSegments: [segmentsDraft.primarySegment, ...current],
    });
  };

  const resetForm = (targetSegment?: CommerceSegment) => {
    const seg = targetSegment || segmentsDraft.primarySegment;
    const cfg = getSegmentConfig(seg);
    setForm({
      id: "",
      name: "",
      price: "",
      categoryId: "",
      description: "",
      segment: seg,
      barcodeEan: "",
      sku: "",
      unitOfMeasure: cfg.defaultUnit,
      currentStock: "0",
      minStock: "0",
      available: true,
      activeIngredient: "",
      dosage: "",
      manufacturer: "",
      anvisaRegistration: "",
      lotNumber: "",
      expirationDate: "",
      isControlled: false,
      requiresPrescription: false,
      isGeneric: false,
      allowFractionalSale: false,
      tareWeightKg: "0",
      netWeightKg: "",
      size: "",
      color: "",
      fabricComposition: "",
      brand: "",
      collection: "",
      ingredients: "",
      prep: "20",
      servesPeople: "1",
      allergens: "",
      serviceDurationMinutes: "30",
      professionalRequired: true,
      suggestedReturnDays: "",
      targetSpecies: "cachorro",
      petSize: "todos",
      lifeStage: "adulta",
      packageWeightKg: "",
      requiresVeterinaryPrescription: false,
      modelNumber: "",
      voltage: "bivolt",
      warrantyMonths: "12",
      requiresSerialNumber: true,
      anatelHomologation: "",
      unitOfSale: "UN",
      weightKgPerUnit: "",
      coverageYieldM2: "",
      heavyFreight: false,
    });
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setNotice(null);

    // Monta atributos específicos baseado no segmento do produto
    let segmentAttributes: Record<string, unknown> = {};

    if (form.segment === "pharmacy") {
      segmentAttributes = {
        active_ingredient: form.activeIngredient.trim() || null,
        dosage: form.dosage.trim() || null,
        manufacturer: form.manufacturer.trim() || null,
        anvisa_registration: form.anvisaRegistration.trim() || null,
        lot_number: form.lotNumber.trim() || null,
        expiration_date: form.expirationDate || null,
        is_controlled: form.isControlled,
        requires_prescription: form.requiresPrescription,
        is_generic: form.isGeneric,
      };
    } else if (form.segment === "grocery") {
      segmentAttributes = {
        barcode_ean: form.barcodeEan.trim() || null,
        unit_of_measure: form.unitOfMeasure,
        allow_fractional_sale: form.allowFractionalSale,
        tare_weight_kg: Number(form.tareWeightKg) || 0,
        net_weight_kg: form.netWeightKg ? Number(form.netWeightKg) : null,
      };
    } else if (form.segment === "fashion") {
      segmentAttributes = {
        size: form.size.trim() || null,
        color: form.color.trim() || null,
        fabric_composition: form.fabricComposition.trim() || null,
        brand: form.brand.trim() || null,
        collection: form.collection.trim() || null,
      };
    } else if (form.segment === "food_service") {
      segmentAttributes = {
        ingredients: form.ingredients.split(",").map((s) => s.trim()).filter(Boolean),
        preparation_time_minutes: Number(form.prep) || 20,
        serves_people: Number(form.servesPeople) || 1,
        allergens: form.allergens.split(",").map((s) => s.trim()).filter(Boolean),
      };
    } else if (form.segment === "beauty") {
      segmentAttributes = {
        service_duration_minutes: Number(form.serviceDurationMinutes) || 30,
        professional_required: form.professionalRequired,
        suggested_return_days: form.suggestedReturnDays ? Number(form.suggestedReturnDays) : null,
      };
    } else if (form.segment === "pet_shop") {
      segmentAttributes = {
        target_species: form.targetSpecies,
        pet_size: form.petSize,
        life_stage: form.lifeStage,
        package_weight_kg: form.packageWeightKg ? Number(form.packageWeightKg) : null,
        requires_veterinary_prescription: form.requiresVeterinaryPrescription,
      };
    } else if (form.segment === "electronics") {
      segmentAttributes = {
        model_number: form.modelNumber.trim() || null,
        voltage: form.voltage,
        warranty_months: Number(form.warrantyMonths) || 12,
        requires_serial_number: form.requiresSerialNumber,
        anatel_homologation: form.anatelHomologation.trim() || null,
      };
    } else if (form.segment === "construction") {
      segmentAttributes = {
        unit_of_sale: form.unitOfSale,
        weight_kg_per_unit: form.weightKgPerUnit ? Number(form.weightKgPerUnit) : null,
        coverage_yield_m2: form.coverageYieldM2 ? Number(form.coverageYieldM2) : null,
        heavy_freight: form.heavyFreight,
      };
    } else {
      segmentAttributes = {
        barcode_ean: form.barcodeEan.trim() || null,
        brand: form.brand.trim() || null,
        model: form.modelNumber.trim() || null,
        unit_of_measure: form.unitOfMeasure,
      };
    }

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
        segment: form.segment,
        barcodeEan: form.barcodeEan || null,
        sku: form.sku || null,
        unitOfMeasure: form.unitOfMeasure,
        currentStock: Number(form.currentStock) || 0,
        minStock: Number(form.minStock) || 0,
        ingredients: form.ingredients.split(",").map((s) => s.trim()).filter(Boolean),
        preparationTimeMinutes: form.prep ? Number(form.prep) : 20,
        segmentAttributes,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setNotice(payload.error ?? "Falha ao salvar o produto.");
      return;
    }
    setNotice(form.id ? "Produto atualizado com sucesso." : "Produto adicionado ao catálogo.");
    resetForm();
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
        <div className="mb-6 flex flex-col items-center text-center">
          <BonaParticleAtom className="h-9 w-9 text-emerald-400 mb-2" />
          <h1 className="text-2xl font-black tracking-widest">HUG ERP</h1>
          <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">BONASOFT HUG</p>
          <p className="text-xs text-muted-foreground mt-1">Configurações da Empresa e Catálogo</p>
        </div>
        <form onSubmit={signIn} className="space-y-3 rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="E-mail corporativo"
            className="w-full rounded-md border border-input bg-background p-2 text-sm"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Senha de acesso"
            className="w-full rounded-md border border-input bg-background p-2 text-sm"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={firstAccess}
              onChange={(event) => setFirstAccess(event.target.checked)}
            />
            Primeiro acesso: cadastrar senha
          </label>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (firstAccess ? "Criando acesso…" : "Entrando…") : firstAccess ? "Criar senha e entrar" : "Entrar"}
          </Button>
        </form>
        {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}
      </main>
    );
  }

  const isManagerOrOwner = ["owner", "admin"].includes(data.user.role.toLowerCase());
  const activeSegmentsList = segmentsDraft.activeSegments || [segmentsDraft.primarySegment];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 space-y-8">
      {/* HEADER DA EMPRESA */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{data.company.name}</h1>
            <Badge variant="outline" className="text-xs font-semibold uppercase">
              {getSegmentConfig(segmentsDraft.primarySegment).shortLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data.user.email} · Nível: <span className="font-semibold uppercase">{data.user.role}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={signOut}>
          Sair da Conta
        </Button>
      </header>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
      {notice && (
        <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-2.5 text-xs font-medium text-foreground">
          {notice}
        </div>
      )}

      {/* METRICAS DA OPERAÇÃO */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="Conversas de Atendimento" value={String(data.usage.calls)} />
        <Card label="Tokens Processados" value={data.usage.tokens.toLocaleString("pt-BR")} />
        <Card label="Custo Estimado IA" value={`US$ ${data.usage.costUsd.toFixed(4)}`} />
        <Card label="Itens no Catálogo" value={String(data.products.length)} />
      </section>

      {/* SEÇÃO 1: SEGMENTOS COMERCIAIS DA EMPRESA */}
      <section className="rounded-xl border border-border/70 bg-card/40 p-5 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Segmentos Comerciais da Empresa</h2>
            <p className="text-xs text-muted-foreground">
              Configure em quais verticais de negócio sua empresa opera. Uma mesma loja pode ter múltiplos segmentos ativos (ex: Supermercado com Padaria e Açougue).
            </p>
          </div>
          <Badge variant={isManagerOrOwner ? "default" : "secondary"}>
            {isManagerOrOwner ? "Permissão: Gerente / Dono" : "Apenas Leitura"}
          </Badge>
        </div>

        {/* SEGMENTO PRINCIPAL */}
        <div>
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Segmento Principal da Empresa
          </label>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {COMMERCE_SEGMENTS.map((segKey) => {
              const cfg = getSegmentConfig(segKey);
              const isSelected = segmentsDraft.primarySegment === segKey;
              return (
                <button
                  key={segKey}
                  type="button"
                  disabled={!isManagerOrOwner}
                  onClick={() => {
                    setSegmentsDraft({
                      ...segmentsDraft,
                      primarySegment: segKey,
                      secondarySegments: segmentsDraft.secondarySegments.filter((s) => s !== segKey),
                      activeSegments: [segKey, ...segmentsDraft.secondarySegments.filter((s) => s !== segKey)],
                    });
                  }}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-border/60 bg-background/50 hover:border-border"
                  }`}
                >
                  <span className="font-semibold text-xs text-foreground">{cfg.name}</span>
                  <span className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                    {cfg.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SEGMENTOS SECUNDÁRIOS ADICIONAIS */}
        <div className="pt-2 border-t border-border/50">
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
            Segmentos Secundários Adicionais (Opcional)
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Marque caso este estabelecimento também ofereça produtos ou serviços de outros segmentos.
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMERCE_SEGMENTS.filter((s) => s !== segmentsDraft.primarySegment).map((segKey) => {
              const cfg = getSegmentConfig(segKey);
              const isActive = segmentsDraft.secondarySegments.includes(segKey);
              return (
                <button
                  key={segKey}
                  type="button"
                  disabled={!isManagerOrOwner}
                  onClick={() => toggleSecondarySegment(segKey)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground font-semibold"
                      : "border-border/70 bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{isActive ? "✓" : "+"}</span>
                  <span>{cfg.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CAPACIDADES ATIVAS */}
        <div className="rounded-lg bg-muted/20 p-3 border border-border/40">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Capacidades Operacionais Habilitadas
          </p>
          <div className="flex flex-wrap gap-1.5">
            {segmentsDraft.capabilities.hasTablesOrTabs && <Badge variant="secondary">Comandas e Mesas</Badge>}
            {segmentsDraft.capabilities.hasLotAndExpiration && <Badge variant="secondary">Lote e Validade</Badge>}
            {segmentsDraft.capabilities.hasPrescriptionControl && <Badge variant="secondary">Controle de Receitas</Badge>}
            {segmentsDraft.capabilities.hasGridVariants && <Badge variant="secondary">Grade de Tamanhos / Cores</Badge>}
            {segmentsDraft.capabilities.hasSerialOrImei && <Badge variant="secondary">Rastreio Serial / IMEI</Badge>}
            {segmentsDraft.capabilities.hasWeightedMeasurement && <Badge variant="secondary">Venda por Peso / Balança</Badge>}
            {segmentsDraft.capabilities.hasAppointmentBooking && <Badge variant="secondary">Agenda de Horários</Badge>}
            {segmentsDraft.capabilities.hasTechnicalDeliveryFreight && <Badge variant="secondary">Cálculo de Frete Pesado</Badge>}
          </div>
        </div>

        {isManagerOrOwner && (
          <Button onClick={saveSegmentSettings} className="font-semibold text-xs">
            Salvar Segmentos Comerciais
          </Button>
        )}
      </section>

      {/* SEÇÃO 2: CATÁLOGO MULTISSEGMENTO & FORMULÁRIO DINÂMICO */}
      <section className="rounded-xl border border-border/70 bg-card/40 p-5 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Catálogo Universal de Produtos & Serviços</h2>
          <p className="text-xs text-muted-foreground">
            Cadastre itens com atributos específicos validados de acordo com os segmentos autorizados para sua empresa.
          </p>
        </div>

        {/* CRIAÇÃO DE CATEGORIA */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            placeholder="Nova categoria do catálogo"
            className="rounded-md border border-input bg-background p-2 text-xs min-w-56"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
          />
          <Button variant="outline" size="sm" onClick={addCategory}>
            Criar categoria
          </Button>
        </div>

        {/* FORMULÁRIO DINÂMICO ADAPTATIVO */}
        <form onSubmit={saveProduct} className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <h3 className="font-semibold text-sm">
              {form.id ? "Editar Produto / Serviço" : "Novo Cadastro Comercial"}
            </h3>
            {/* SELETOR DO SEGMENTO DO PRODUTO */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Segmento do item:</span>
              <select
                className="rounded-md border border-input bg-background px-2.5 py-1 text-xs font-semibold"
                value={form.segment}
                onChange={(e) => {
                  const targetSeg = e.target.value as CommerceSegment;
                  setForm({ ...form, segment: targetSeg, unitOfMeasure: getSegmentConfig(targetSeg).defaultUnit });
                }}
              >
                {activeSegmentsList.map((segKey) => (
                  <option key={segKey} value={segKey}>
                    {getSegmentConfig(segKey).name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CAMPOS BASE COMUNS */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Nome Comercial / Descrição</label>
              <input
                required
                placeholder="Ex: Amoxicilina 500mg ou Camiseta Lisa"
                className="w-full rounded-md border border-input bg-background p-2 text-xs"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Preço de Venda (R$)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className="w-full rounded-md border border-input bg-background p-2 text-xs"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Categoria</label>
              <select
                className="w-full rounded-md border border-input bg-background p-2 text-xs"
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
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Código de Barras (EAN / GTIN)</label>
              <input
                placeholder="Ex: 7891000315507"
                className="w-full rounded-md border border-input bg-background p-2 text-xs font-mono"
                value={form.barcodeEan}
                onChange={(event) => setForm({ ...form, barcodeEan: event.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Código Interno (SKU)</label>
              <input
                placeholder="Ex: MED-001 ou MOD-102"
                className="w-full rounded-md border border-input bg-background p-2 text-xs font-mono"
                value={form.sku}
                onChange={(event) => setForm({ ...form, sku: event.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Unidade de Medida</label>
              <input
                placeholder="UN, KG, CX, M2, PEÇA"
                className="w-full rounded-md border border-input bg-background p-2 text-xs uppercase"
                value={form.unitOfMeasure}
                onChange={(event) => setForm({ ...form, unitOfMeasure: event.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground">Estoque Atual / Mínimo</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Atual"
                  className="w-1/2 rounded-md border border-input bg-background p-2 text-xs"
                  value={form.currentStock}
                  onChange={(event) => setForm({ ...form, currentStock: event.target.value })}
                />
                <input
                  type="number"
                  placeholder="Mínimo"
                  className="w-1/2 rounded-md border border-input bg-background p-2 text-xs"
                  value={form.minStock}
                  onChange={(event) => setForm({ ...form, minStock: event.target.value })}
                />
              </div>
            </div>
          </div>

          {/* CAMPOS ESPECÍFICOS: FARMÁCIA */}
          {form.segment === "pharmacy" && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Atributos Farmacêuticos</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  placeholder="Princípio Ativo (obrigatório)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.activeIngredient}
                  onChange={(e) => setForm({ ...form, activeIngredient: e.target.value })}
                />
                <input
                  placeholder="Dosagem (ex: 500mg, 10mg/ml)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.dosage}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                />
                <input
                  placeholder="Fabricante / Laboratório"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.manufacturer}
                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  placeholder="Registro Anvisa / MS"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.anvisaRegistration}
                  onChange={(e) => setForm({ ...form, anvisaRegistration: e.target.value })}
                />
                <input
                  placeholder="Número do Lote"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.lotNumber}
                  onChange={(e) => setForm({ ...form, lotNumber: e.target.value })}
                />
                <input
                  type="date"
                  placeholder="Validade"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.expirationDate}
                  onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                />
              </div>
              <div className="flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresPrescription}
                    onChange={(e) => setForm({ ...form, requiresPrescription: e.target.checked })}
                  />
                  <span>Exige Retenção de Receita</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isControlled}
                    onChange={(e) => setForm({ ...form, isControlled: e.target.checked })}
                  />
                  <span>Medicamento Controlado</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isGeneric}
                    onChange={(e) => setForm({ ...form, isGeneric: e.target.checked })}
                  />
                  <span>Medicamento Genérico</span>
                </label>
              </div>
            </div>
          )}

          {/* CAMPOS ESPECÍFICOS: MERCADO */}
          {form.segment === "grocery" && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Atributos de Mercado e Pesagem</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-[11px] text-muted-foreground">Peso Líquido (kg)</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Ex: 1.000"
                    className="w-full rounded-md border border-input bg-background p-2 text-xs"
                    value={form.netWeightKg}
                    onChange={(e) => setForm({ ...form, netWeightKg: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground">Tara da Embalagem (kg)</label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Ex: 0.015"
                    className="w-full rounded-md border border-input bg-background p-2 text-xs"
                    value={form.tareWeightKg}
                    onChange={(e) => setForm({ ...form, tareWeightKg: e.target.value })}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.allowFractionalSale}
                      onChange={(e) => setForm({ ...form, allowFractionalSale: e.target.checked })}
                    />
                    <span>Venda Fracionada / Pesada na Balança</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* CAMPOS ESPECÍFICOS: MODA */}
          {form.segment === "fashion" && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Atributos de Moda & Vestuário</p>
              <div className="grid gap-3 sm:grid-cols-4">
                <input
                  placeholder="Tamanho / Grade (P, M, G, 42)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                />
                <input
                  placeholder="Cor (ex: Azul Marinho)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
                <input
                  placeholder="Marca / Grife"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                />
                <input
                  placeholder="Coleção (ex: Verão 2026)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.collection}
                  onChange={(e) => setForm({ ...form, collection: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* CAMPOS ESPECÍFICOS: GASTRONOMIA */}
          {form.segment === "food_service" && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Atributos Gastronômicos</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="number"
                  placeholder="Tempo de preparo (minutos)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.prep}
                  onChange={(e) => setForm({ ...form, prep: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Serve quantas pessoas"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.servesPeople}
                  onChange={(e) => setForm({ ...form, servesPeople: e.target.value })}
                />
                <input
                  placeholder="Alérgenos (glúten, lactose...)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.allergens}
                  onChange={(e) => setForm({ ...form, allergens: e.target.value })}
                />
              </div>
              <input
                placeholder="Ingredientes separados por vírgula (ex: Pão brioche, Carne 180g, Queijo)"
                className="w-full rounded-md border border-input bg-background p-2 text-xs"
                value={form.ingredients}
                onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
              />
            </div>
          )}

          {/* CAMPOS ESPECÍFICOS: BELEZA */}
          {form.segment === "beauty" && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Atributos de Serviços e Beleza</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="number"
                  placeholder="Duração da Sessão (minutos)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.serviceDurationMinutes}
                  onChange={(e) => setForm({ ...form, serviceDurationMinutes: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Retorno sugerido (dias)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.suggestedReturnDays}
                  onChange={(e) => setForm({ ...form, suggestedReturnDays: e.target.value })}
                />
                <label className="flex items-center gap-1.5 text-xs cursor-pointer pb-1">
                  <input
                    type="checkbox"
                    checked={form.professionalRequired}
                    onChange={(e) => setForm({ ...form, professionalRequired: e.target.checked })}
                  />
                  <span>Exige Profissional Vinculado</span>
                </label>
              </div>
            </div>
          )}

          {/* CAMPOS ESPECÍFICOS: PETSHOP */}
          {form.segment === "pet_shop" && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Atributos Pet & Veterinários</p>
              <div className="grid gap-3 sm:grid-cols-4">
                <select
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.targetSpecies}
                  onChange={(e) => setForm({ ...form, targetSpecies: e.target.value as any })}
                >
                  <option value="cachorro">Cachorro</option>
                  <option value="gato">Gato</option>
                  <option value="aves">Aves</option>
                  <option value="geral">Geral / Todas</option>
                </select>
                <input
                  placeholder="Porte (pequeno, médio...)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.petSize}
                  onChange={(e) => setForm({ ...form, petSize: e.target.value as any })}
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Peso embalagem (kg)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.packageWeightKg}
                  onChange={(e) => setForm({ ...form, packageWeightKg: e.target.value })}
                />
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresVeterinaryPrescription}
                    onChange={(e) => setForm({ ...form, requiresVeterinaryPrescription: e.target.checked })}
                  />
                  <span>Receita Veterinária</span>
                </label>
              </div>
            </div>
          )}

          {/* CAMPOS ESPECÍFICOS: ELETRÔNICOS */}
          {form.segment === "electronics" && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Atributos Técnicos & Eletrônicos</p>
              <div className="grid gap-3 sm:grid-cols-4">
                <input
                  placeholder="Modelo (ex: SM-S928B)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.modelNumber}
                  onChange={(e) => setForm({ ...form, modelNumber: e.target.value })}
                />
                <select
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.voltage}
                  onChange={(e) => setForm({ ...form, voltage: e.target.value as any })}
                >
                  <option value="bivolt">Bivolt</option>
                  <option value="110v">110V</option>
                  <option value="220v">220V</option>
                  <option value="nao_aplica">Não se aplica</option>
                </select>
                <input
                  type="number"
                  placeholder="Garantia (meses)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.warrantyMonths}
                  onChange={(e) => setForm({ ...form, warrantyMonths: e.target.value })}
                />
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresSerialNumber}
                    onChange={(e) => setForm({ ...form, requiresSerialNumber: e.target.checked })}
                  />
                  <span>Exige Rastreio Serial/IMEI</span>
                </label>
              </div>
            </div>
          )}

          {/* CAMPOS ESPECÍFICOS: CONSTRUÇÃO */}
          {form.segment === "construction" && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Atributos de Construção & Carga</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Peso por unidade (kg)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.weightKgPerUnit}
                  onChange={(e) => setForm({ ...form, weightKgPerUnit: e.target.value })}
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Rendimento por unidade (m²)"
                  className="rounded-md border border-input bg-background p-2 text-xs"
                  value={form.coverageYieldM2}
                  onChange={(e) => setForm({ ...form, coverageYieldM2: e.target.value })}
                />
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.heavyFreight}
                    onChange={(e) => setForm({ ...form, heavyFreight: e.target.checked })}
                  />
                  <span>Requer Transporte de Carga Pesada</span>
                </label>
              </div>
            </div>
          )}

          {/* AÇÕES DO FORMULÁRIO */}
          <div className="flex items-center gap-2 pt-2">
            <Button type="submit" size="sm" className="font-semibold text-xs">
              {form.id ? "Salvar Alterações do Produto" : "Adicionar ao Catálogo"}
            </Button>
            {form.id && (
              <Button type="button" variant="ghost" size="sm" onClick={() => resetForm()}>
                Cancelar Edição
              </Button>
            )}
          </div>
        </form>

        {/* LISTAGEM DE PRODUTOS */}
        {!data.products.length && (
          <p className="text-xs text-muted-foreground py-4 text-center">Nenhum produto cadastrado no catálogo.</p>
        )}
        {!!data.products.length && (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Segmento</th>
                  <th className="p-2.5">Produto</th>
                  <th className="p-2.5">Código / EAN</th>
                  <th className="p-2.5">Categoria</th>
                  <th className="p-2.5">Preço</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.products.map((product) => {
                  const segCfg = getSegmentConfig(product.segment);
                  return (
                    <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-2.5">
                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                          {segCfg.shortLabel}
                        </Badge>
                      </td>
                      <td className="p-2.5 font-medium text-foreground">
                        <div>{product.name}</div>
                        {product.description && (
                          <div className="text-[11px] text-muted-foreground line-clamp-1">{product.description}</div>
                        )}
                      </td>
                      <td className="p-2.5 font-mono text-[11px] text-muted-foreground">
                        {product.barcode_ean || product.sku || "—"}
                      </td>
                      <td className="p-2.5 text-muted-foreground">
                        {data.categories.find((c) => c.id === product.category_id)?.name ?? "—"}
                      </td>
                      <td className="p-2.5 font-semibold text-foreground whitespace-nowrap">
                        R$ {Number(product.price).toFixed(2).replace(".", ",")}
                      </td>
                      <td className="p-2.5">
                        <Badge variant={product.available ? "default" : "secondary"} className="text-[10px]">
                          {product.available ? "Disponível" : "Indisponível"}
                        </Badge>
                      </td>
                      <td className="p-2.5 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            const seg = (product.segment as CommerceSegment) || "food_service";
                            const attrs = (product.segment_attributes as any) || {};
                            setForm({
                              id: product.id,
                              name: product.name,
                              price: String(product.price),
                              categoryId: product.category_id ?? "",
                              description: product.description ?? "",
                              segment: seg,
                              barcodeEan: product.barcode_ean ?? attrs.barcode_ean ?? "",
                              sku: product.sku ?? "",
                              unitOfMeasure: product.unit_of_measure ?? attrs.unit_of_measure ?? "UN",
                              currentStock: String(product.current_stock ?? 0),
                              minStock: String(product.min_stock ?? 0),
                              available: product.available,
                              activeIngredient: attrs.active_ingredient ?? "",
                              dosage: attrs.dosage ?? "",
                              manufacturer: attrs.manufacturer ?? "",
                              anvisaRegistration: attrs.anvisa_registration ?? "",
                              lotNumber: attrs.lot_number ?? "",
                              expirationDate: attrs.expiration_date ?? "",
                              isControlled: Boolean(attrs.is_controlled),
                              requiresPrescription: Boolean(attrs.requires_prescription),
                              isGeneric: Boolean(attrs.is_generic),
                              allowFractionalSale: Boolean(attrs.allow_fractional_sale),
                              tareWeightKg: String(attrs.tare_weight_kg ?? 0),
                              netWeightKg: String(attrs.net_weight_kg ?? ""),
                              size: attrs.size ?? "",
                              color: attrs.color ?? "",
                              fabricComposition: attrs.fabric_composition ?? "",
                              brand: attrs.brand ?? "",
                              collection: attrs.collection ?? "",
                              ingredients: (product.ingredients ?? attrs.ingredients ?? []).join(", "),
                              prep: String(product.preparation_time_minutes ?? attrs.preparation_time_minutes ?? 20),
                              servesPeople: String(attrs.serves_people ?? 1),
                              allergens: (attrs.allergens ?? []).join(", "),
                              serviceDurationMinutes: String(attrs.service_duration_minutes ?? 30),
                              professionalRequired: attrs.professional_required !== false,
                              suggestedReturnDays: String(attrs.suggested_return_days ?? ""),
                              targetSpecies: attrs.target_species ?? "cachorro",
                              petSize: attrs.pet_size ?? "todos",
                              lifeStage: attrs.life_stage ?? "adulta",
                              packageWeightKg: String(attrs.package_weight_kg ?? ""),
                              requiresVeterinaryPrescription: Boolean(attrs.requires_veterinary_prescription),
                              modelNumber: attrs.model_number ?? attrs.model ?? "",
                              voltage: attrs.voltage ?? "bivolt",
                              warrantyMonths: String(attrs.warranty_months ?? 12),
                              requiresSerialNumber: attrs.requires_serial_number !== false,
                              anatelHomologation: attrs.anatel_homologation ?? "",
                              unitOfSale: attrs.unit_of_sale ?? "UN",
                              weightKgPerUnit: String(attrs.weight_kg_per_unit ?? ""),
                              coverageYieldM2: String(attrs.coverage_yield_m2 ?? ""),
                              heavyFreight: Boolean(attrs.heavy_freight),
                            });
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => removeProduct(product.id)}
                        >
                          Remover
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* SEÇÃO 3: INTELIGÊNCIA ARTIFICIAL MULTIPLEX */}
      {draft && (
        <section className="rounded-xl border border-border/70 bg-card/40 p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">HUG AI · Motor Multiplex · Estratégia de Atendimento</h2>
            <p className="text-xs text-muted-foreground">
              Configure as prioridades e o motor de inteligência artificial da empresa no HUG by BonaSoft.
            </p>
          </div>

          <label className="block max-w-sm text-xs">
            <span className="mb-1 block font-semibold text-foreground">Provedor Padrão</span>
            <select
              className="w-full rounded-md border border-input bg-background p-2 text-xs"
              value={draft.defaultModelAlias ?? "gpt"}
              onChange={(event) =>
                setDraft({ ...draft, defaultModelAlias: event.target.value as Settings["defaultModelAlias"] })
              }
            >
              <option value="gpt">GPT (OpenAI)</option>
              <option value="claude">CLAUDE (Anthropic)</option>
              <option value="deepseek">DEEPSEEK</option>
            </select>
          </label>

          <label className="block max-w-sm text-xs">
            <span className="mb-1 block font-semibold text-foreground">Prioridade Operacional Geral</span>
            <select
              className="w-full rounded-md border border-input bg-background p-2 text-xs"
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

          {isManagerOrOwner && (
            <Button onClick={saveSettings} size="sm" className="font-semibold text-xs">
              Salvar Estratégia de IA
            </Button>
          )}
        </section>
      )}
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3.5 shadow-sm">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-1 font-display text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
