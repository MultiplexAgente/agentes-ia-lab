import type { SupabaseClient } from "@supabase/supabase-js";
import { tool } from "ai";
import { z } from "zod";

/**
 * Ferramentas reais do Agent Core.
 *
 * Regras invioláveis:
 * - company_id vem SEMPRE do escopo do servidor (sessão/canal), nunca do modelo.
 * - Nenhuma ferramenta inventa dado: sem linhas no banco, devolve lista vazia.
 * - Toda escrita exige `scope: "authenticated"`; o chat público só lê catálogo.
 */

export type ToolScope = "authenticated" | "public" | "channel";

export interface ToolCallRecord {
  name: string;
  ok: boolean;
  detail: string;
}

interface ToolContext {
  supabase: SupabaseClient;
  companyId: string;
  scope: ToolScope;
  conversationId?: string | null;
  calls: ToolCallRecord[];
}

function money(value: unknown): string {
  return Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function record(ctx: ToolContext, name: string, ok: boolean, detail: string) {
  ctx.calls.push({ name, ok, detail });
}

const WRITE_DENIED =
  "Esta ação exige um usuário autenticado da empresa. Informe ao usuário que ele precisa entrar na conta para executar.";

export function buildTools(ctx: ToolContext) {
  const canWrite = ctx.scope === "authenticated";

  const searchProducts = tool({
    description:
      "Busca produtos reais no catálogo da empresa. Use sempre antes de falar de preço, disponibilidade ou quantidade de produtos.",
    inputSchema: z.object({
      query: z.string().nullable().describe("Termo de busca por nome ou descrição. null lista o catálogo."),
      only_available: z.boolean().nullable().describe("true retorna apenas produtos disponíveis."),
      limit: z.number().int().min(1).max(50).nullable().describe("Máximo de itens. null usa 20."),
    }),
    execute: async ({ query, only_available, limit }) => {
      let request = ctx.supabase
        .from("products")
        .select("id, name, description, price, available, image_url, preparation_time_minutes, product_categories(name)")
        .eq("company_id", ctx.companyId)
        .order("name", { ascending: true })
        .limit(limit ?? 20);
      if (query && query.trim()) request = request.or(`name.ilike.%${query.trim()}%,description.ilike.%${query.trim()}%`);
      if (only_available) request = request.eq("available", true);

      const { data, error } = await request;
      if (error) {
        record(ctx, "search_products", false, error.message);
        return { error: "Não foi possível consultar o catálogo agora.", products: [] };
      }
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      record(ctx, "search_products", true, `${rows.length} produto(s)`);
      return {
        total: rows.length,
        products: rows.map((row) => ({
          id: row["id"],
          name: row["name"],
          description: row["description"],
          price: Number(row["price"] ?? 0),
          price_formatted: money(row["price"]),
          available: row["available"] !== false,
          image_url: row["image_url"],
          category: (row["product_categories"] as { name?: string } | null)?.name ?? null,
        })),
        note: rows.length === 0 ? "Nenhum produto cadastrado corresponde à busca. Não invente itens." : null,
      };
    },
  });

  const getProduct = tool({
    description: "Detalha um produto real pelo identificador retornado por search_products.",
    inputSchema: z.object({ product_id: z.string().describe("UUID do produto.") }),
    execute: async ({ product_id }) => {
      const { data, error } = await ctx.supabase
        .from("products")
        .select("id, name, description, price, available, image_url, ingredients, preparation_time_minutes")
        .eq("company_id", ctx.companyId)
        .eq("id", product_id)
        .maybeSingle();
      if (error || !data) {
        record(ctx, "get_product", false, error?.message ?? "não encontrado");
        return { error: "Produto não encontrado no catálogo desta empresa." };
      }
      record(ctx, "get_product", true, String((data as { name?: string }).name ?? product_id));
      return { product: { ...(data as Record<string, unknown>), price_formatted: money((data as { price?: unknown }).price) } };
    },
  });

  const searchCustomers = tool({
    description: "Busca clientes reais da empresa por nome, telefone ou e-mail.",
    inputSchema: z.object({
      query: z.string().nullable().describe("Termo de busca. null lista os mais recentes."),
      limit: z.number().int().min(1).max(50).nullable(),
    }),
    execute: async ({ query, limit }) => {
      if (!canWrite) {
        record(ctx, "search_customers", false, "escopo público");
        return { error: WRITE_DENIED, customers: [] };
      }
      let request = ctx.supabase
        .from("customers")
        .select("id, name, phone, email, total_orders, lifetime_value, created_at")
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false })
        .limit(limit ?? 20);
      const term = query?.trim();
      if (term) request = request.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);

      const { data, error } = await request;
      if (error) {
        record(ctx, "search_customers", false, error.message);
        return { error: "Não foi possível consultar os clientes agora.", customers: [] };
      }
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      record(ctx, "search_customers", true, `${rows.length} cliente(s)`);
      return {
        total: rows.length,
        customers: rows,
        note: rows.length === 0 ? "Nenhum cliente encontrado. Não invente clientes." : null,
      };
    },
  });

  const createCustomer = tool({
    description:
      "Cadastra um cliente real. Só chame quando tiver o NOME confirmado pelo usuário. Se faltar nome, pergunte antes em vez de chamar.",
    inputSchema: z.object({
      name: z.string().min(2).describe("Nome do cliente, obrigatório."),
      phone: z.string().nullable().describe("Telefone, ou null se o usuário não informou."),
      email: z.string().nullable().describe("E-mail, ou null se o usuário não informou."),
      notes: z.string().nullable(),
    }),
    execute: async ({ name, phone, email, notes }) => {
      if (!canWrite) {
        record(ctx, "create_customer", false, "escopo público");
        return { error: WRITE_DENIED };
      }
      const { data, error } = await ctx.supabase
        .from("customers")
        .insert({ company_id: ctx.companyId, name: name.trim(), phone, email, notes })
        .select("id, name, phone, email, created_at")
        .maybeSingle();
      if (error || !data) {
        record(ctx, "create_customer", false, error?.message ?? "falha ao inserir");
        return { error: `Não foi possível cadastrar o cliente: ${error?.message ?? "erro desconhecido"}` };
      }
      record(ctx, "create_customer", true, String((data as { id?: string }).id));
      return { created: true, customer: data };
    },
  });

  const updateCustomer = tool({
    description: "Atualiza dados de um cliente real existente.",
    inputSchema: z.object({
      customer_id: z.string().describe("UUID do cliente."),
      name: z.string().nullable(),
      phone: z.string().nullable(),
      email: z.string().nullable(),
      notes: z.string().nullable(),
    }),
    execute: async ({ customer_id, name, phone, email, notes }) => {
      if (!canWrite) {
        record(ctx, "update_customer", false, "escopo público");
        return { error: WRITE_DENIED };
      }
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (name !== null) patch["name"] = name;
      if (phone !== null) patch["phone"] = phone;
      if (email !== null) patch["email"] = email;
      if (notes !== null) patch["notes"] = notes;

      const { data, error } = await ctx.supabase
        .from("customers")
        .update(patch)
        .eq("company_id", ctx.companyId)
        .eq("id", customer_id)
        .select("id, name, phone, email")
        .maybeSingle();
      if (error || !data) {
        record(ctx, "update_customer", false, error?.message ?? "não encontrado");
        return { error: "Cliente não encontrado nesta empresa ou atualização recusada." };
      }
      record(ctx, "update_customer", true, customer_id);
      return { updated: true, customer: data };
    },
  });

  const createOrder = tool({
    description:
      "Cria um pedido real. Exige cliente existente e itens do catálogo. Se faltar cliente ou item, pergunte antes em vez de chamar.",
    inputSchema: z.object({
      customer_id: z.string().describe("UUID de um cliente já cadastrado (use search_customers/create_customer antes)."),
      items: z
        .array(
          z.object({
            product_id: z.string().describe("UUID do produto do catálogo."),
            quantity: z.number().int().min(1),
          }),
        )
        .min(1),
      delivery_fee: z.number().min(0).nullable(),
      payment_method: z.string().nullable(),
      notes: z.string().nullable(),
    }),
    execute: async ({ customer_id, items, delivery_fee, payment_method, notes }) => {
      if (!canWrite) {
        record(ctx, "create_order", false, "escopo público");
        return { error: WRITE_DENIED };
      }

      const { data: customer } = await ctx.supabase
        .from("customers")
        .select("id, name")
        .eq("company_id", ctx.companyId)
        .eq("id", customer_id)
        .maybeSingle();
      if (!customer) {
        record(ctx, "create_order", false, "cliente inexistente");
        return { error: "Cliente não encontrado nesta empresa. Cadastre o cliente antes de criar o pedido." };
      }

      const { data: products } = await ctx.supabase
        .from("products")
        .select("id, name, price")
        .eq("company_id", ctx.companyId)
        .in("id", items.map((item) => item.product_id));
      const catalog = new Map(
        ((products ?? []) as Array<{ id: string; name: string; price: number | string }>).map((row) => [row.id, row]),
      );
      const missing = items.filter((item) => !catalog.has(item.product_id));
      if (missing.length) {
        record(ctx, "create_order", false, "produto inexistente");
        return { error: "Um ou mais produtos não existem no catálogo desta empresa. Confirme os itens com o usuário." };
      }

      const lines = items.map((item) => {
        const product = catalog.get(item.product_id)!;
        const unit = Number(product.price ?? 0);
        return {
          company_id: ctx.companyId,
          product_id: product.id,
          product_name: product.name,
          unit_price: unit,
          quantity: item.quantity,
          item_total: Number((unit * item.quantity).toFixed(2)),
        };
      });
      const subtotal = Number(lines.reduce((sum, line) => sum + line.item_total, 0).toFixed(2));
      const fee = Number(delivery_fee ?? 0);

      const { data: order, error: orderError } = await ctx.supabase
        .from("orders")
        .insert({
          company_id: ctx.companyId,
          customer_id,
          conversation_id: ctx.conversationId ?? null,
          status: "PENDING",
          subtotal,
          delivery_fee: fee,
          total: Number((subtotal + fee).toFixed(2)),
          payment_method,
          notes,
        })
        .select("id, status, subtotal, delivery_fee, total, created_at")
        .maybeSingle();
      if (orderError || !order) {
        record(ctx, "create_order", false, orderError?.message ?? "falha ao inserir");
        return { error: `Não foi possível criar o pedido: ${orderError?.message ?? "erro desconhecido"}` };
      }

      const orderId = (order as { id: string }).id;
      const { error: itemsError } = await ctx.supabase
        .from("order_items")
        .insert(lines.map((line) => ({ ...line, order_id: orderId })));
      if (itemsError) {
        await ctx.supabase.from("orders").delete().eq("id", orderId).eq("company_id", ctx.companyId);
        record(ctx, "create_order", false, itemsError.message);
        return { error: `Não foi possível gravar os itens do pedido: ${itemsError.message}` };
      }

      record(ctx, "create_order", true, orderId);
      return {
        created: true,
        order: { ...(order as Record<string, unknown>), total_formatted: money((order as { total?: unknown }).total) },
        customer,
        items: lines.map((line) => ({ product_name: line.product_name, quantity: line.quantity, item_total: line.item_total })),
      };
    },
  });

  const getOrder = tool({
    description: "Detalha um pedido real da empresa, com itens.",
    inputSchema: z.object({ order_id: z.string().describe("UUID do pedido.") }),
    execute: async ({ order_id }) => {
      if (!canWrite) {
        record(ctx, "get_order", false, "escopo público");
        return { error: WRITE_DENIED };
      }
      const { data, error } = await ctx.supabase
        .from("orders")
        .select("id, status, subtotal, delivery_fee, total, payment_method, notes, created_at, customers(id, name, phone), order_items(product_name, quantity, unit_price, item_total)")
        .eq("company_id", ctx.companyId)
        .eq("id", order_id)
        .maybeSingle();
      if (error || !data) {
        record(ctx, "get_order", false, error?.message ?? "não encontrado");
        return { error: "Pedido não encontrado nesta empresa." };
      }
      record(ctx, "get_order", true, order_id);
      return { order: data };
    },
  });

  const searchOrders = tool({
    description: "Lista pedidos reais da empresa, com filtro opcional por situação ou cliente.",
    inputSchema: z.object({
      status: z.string().nullable().describe("Situação do pedido, ou null para todas."),
      customer_id: z.string().nullable(),
      limit: z.number().int().min(1).max(50).nullable(),
    }),
    execute: async ({ status, customer_id, limit }) => {
      if (!canWrite) {
        record(ctx, "search_orders", false, "escopo público");
        return { error: WRITE_DENIED, orders: [] };
      }
      let request = ctx.supabase
        .from("orders")
        .select("id, status, subtotal, delivery_fee, total, created_at, customers(id, name)")
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false })
        .limit(limit ?? 20);
      if (status) request = request.eq("status", status);
      if (customer_id) request = request.eq("customer_id", customer_id);

      const { data, error } = await request;
      if (error) {
        record(ctx, "search_orders", false, error.message);
        return { error: "Não foi possível consultar os pedidos agora.", orders: [] };
      }
      const rows = (data ?? []) as Array<Record<string, unknown>>;
      record(ctx, "search_orders", true, `${rows.length} pedido(s)`);
      return {
        total: rows.length,
        orders: rows,
        note: rows.length === 0 ? "Nenhum pedido registrado. Não invente pedidos." : null,
      };
    },
  });

  const summarizeOperations = tool({
    description: "Resumo real da operação: contagem de produtos, clientes, pedidos e faturamento registrado.",
    inputSchema: z.object({
      days: z.number().int().min(1).max(365).nullable().describe("Janela em dias. null considera todo o histórico."),
    }),
    execute: async ({ days }) => {
      if (!canWrite) {
        record(ctx, "summarize_operations", false, "escopo público");
        return { error: WRITE_DENIED };
      }
      const since = days ? new Date(Date.now() - days * 86_400_000).toISOString() : null;
      let ordersQuery = ctx.supabase
        .from("orders")
        .select("total, status, created_at")
        .eq("company_id", ctx.companyId);
      if (since) ordersQuery = ordersQuery.gte("created_at", since);

      const [{ count: products }, { count: customers }, { data: orders, error }] = await Promise.all([
        ctx.supabase.from("products").select("id", { count: "exact", head: true }).eq("company_id", ctx.companyId),
        ctx.supabase.from("customers").select("id", { count: "exact", head: true }).eq("company_id", ctx.companyId),
        ordersQuery,
      ]);
      if (error) {
        record(ctx, "summarize_operations", false, error.message);
        return { error: "Não foi possível consultar a operação agora." };
      }
      const rows = (orders ?? []) as Array<{ total: number | string | null; status: string | null }>;
      const revenue = Number(rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0).toFixed(2));
      record(ctx, "summarize_operations", true, `${rows.length} pedido(s)`);
      return {
        window_days: days ?? null,
        products_count: products ?? 0,
        customers_count: customers ?? 0,
        orders_count: rows.length,
        revenue,
        revenue_formatted: money(revenue),
        by_status: rows.reduce<Record<string, number>>((acc, row) => {
          const key = row.status ?? "SEM_STATUS";
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {}),
      };
    },
  });

  return {
    search_products: searchProducts,
    get_product: getProduct,
    ...(canWrite
      ? {
          search_customers: searchCustomers,
          create_customer: createCustomer,
          update_customer: updateCustomer,
          create_order: createOrder,
          get_order: getOrder,
          search_orders: searchOrders,
          summarize_operations: summarizeOperations,
        }
      : {}),
  };
}

export const TOOL_GUIDANCE = `FERRAMENTAS REAIS — REGRAS DE USO OBRIGATÓRIO

QUANDO USAR FERRAMENTAS
- Qualquer afirmação sobre produto, preço, disponibilidade, estoque, cliente, pedido ou número operacional EXIGE uma chamada de ferramenta ANTES de responder. Nunca estime ou use dados do contexto como resposta definitiva.
- Se a ferramenta devolver lista vazia: informe exatamente que não há registros. Nunca invente itens, quantidades ou valores.
- Só afirme que algo foi criado ou alterado se a ferramenta tiver retornado sucesso.

CATÁLOGO (search_products / get_product)
- Quando o usuário pedir para ver produtos, listar catálogo, saber preços ou verificar disponibilidade: chame search_products PRIMEIRO.
- Não use o catálogo pré-injetado no contexto como resposta final a uma pergunta dinâmica. O catálogo de contexto é um atalho informativo, não substitui a consulta real.
- Se o usuário perguntar sobre um produto específico (ex: "Quanto custa o X-Bacon?"): chame search_products com o nome do produto e retorne o preço real.
- Se a busca retornar resultado, apresente apenas os dados retornados. Não adicione preços ou disponibilidade inventados.

CLIENTES (search_customers / create_customer / update_customer)
- Antes de cadastrar cliente ou criar pedido: confirme os dados obrigatórios fazendo UMA pergunta por vez (nome, depois telefone, etc).
- Não chame create_customer com dados inventados ou incompletos.

PEDIDOS (create_order / search_orders / get_order)
- Exige cliente existente e itens do catálogo confirmados. Se faltar cliente ou item: pergunte antes de chamar.

OPERAÇÕES (summarize_operations)
- Use para resumir a operação real com dados do banco. Nunca invente métricas.

CLARIFICAÇÃO ANTES DE FERRAMENTAS DE ESCRITA
- Antes de qualquer ferramenta de criação/edição (create_customer, create_order, update_customer): confirme todos os dados necessários com o usuário fazendo uma pergunta de cada vez.`;

