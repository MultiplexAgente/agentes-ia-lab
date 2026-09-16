import type { SupabaseClient } from "@supabase/supabase-js";

import { isUuid } from "./supabase.server";

export interface ConversationActor {
  kind: "authenticated" | "public" | "channel";
  userId?: string;
  email?: string;
  publicSessionId?: string;
  customerId?: string;
}

async function resolveAgentId(supabase: SupabaseClient, companyId: string): Promise<string | null> {
  const { data } = await supabase
    .from("agents")
    .select("id")
    .eq("company_id", companyId)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

async function resolveCustomerId(
  supabase: SupabaseClient,
  companyId: string,
  actor: ConversationActor,
): Promise<string | null> {
  if (actor.customerId && isUuid(actor.customerId)) return actor.customerId;

  const matchColumn = actor.kind === "authenticated" ? "email" : "phone";
  const matchValue = actor.kind === "authenticated" ? actor.email : "public-web-chat";
  if (!matchValue) return null;

  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("company_id", companyId)
    .eq(matchColumn, matchValue)
    .limit(1)
    .maybeSingle();
  const existingId = (existing as { id?: string } | null)?.id;
  if (existingId) return existingId;

  const { data: created, error } = await supabase
    .from("customers")
    .insert({
      company_id: companyId,
      name: actor.kind === "authenticated" ? actor.email ?? "Usuário" : "Visitante do chat público",
      email: actor.kind === "authenticated" ? actor.email ?? null : null,
      phone: actor.kind === "public" ? "public-web-chat" : null,
      notes: actor.kind === "public" ? "Registro técnico do canal público web." : null,
    })
    .select("id")
    .maybeSingle();
  if (error) return null;
  return (created as { id?: string } | null)?.id ?? null;
}

function actorMatches(metadata: unknown, actor: ConversationActor): boolean {
  const value = (metadata ?? {}) as Record<string, unknown>;
  if (actor.kind === "authenticated") return value["user_id"] === actor.userId;
  if (actor.kind === "public") return value["public_session_id"] === actor.publicSessionId;
  return true;
}

export async function ensureWebConversation(
  supabase: SupabaseClient,
  args: {
    companyId: string;
    requestedConversationId?: string | null;
    actor: ConversationActor;
  },
): Promise<{ id: string; agentId: string | null } | null> {
  if (isUuid(args.requestedConversationId)) {
    const { data } = await supabase
      .from("conversations")
      .select("id, agent_id, metadata")
      .eq("id", args.requestedConversationId)
      .eq("company_id", args.companyId)
      .eq("channel_type", "web")
      .maybeSingle();
    const row = data as { id: string; agent_id: string | null; metadata: unknown } | null;
    if (row && actorMatches(row.metadata, args.actor)) return { id: row.id, agentId: row.agent_id };
  }

  const customerId = await resolveCustomerId(supabase, args.companyId, args.actor);
  if (!customerId) return null;
  const agentId = await resolveAgentId(supabase, args.companyId);
  const metadata =
    args.actor.kind === "authenticated"
      ? { actor: "authenticated", user_id: args.actor.userId }
      : { actor: "public", public_session_id: args.actor.publicSessionId };
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      company_id: args.companyId,
      customer_id: customerId,
      agent_id: agentId,
      channel_type: "web",
      status: "ACTIVE",
      metadata,
    })
    .select("id")
    .maybeSingle();
  if (error) return null;
  const id = (data as { id?: string } | null)?.id;
  return id ? { id, agentId } : null;
}

export async function loadPersistedHistory(
  supabase: SupabaseClient,
  companyId: string,
  conversationId: string,
  limit = 12,
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const { data } = await supabase
    .from("messages")
    .select("sender_type, text, created_at")
    .eq("company_id", companyId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as Array<{ sender_type: string; text: string | null }>)
    .reverse()
    .filter((row) => Boolean(row.text))
    .map((row) => ({
      role: row.sender_type === "customer" ? "user" : "assistant",
      content: row.text ?? "",
    }));
}

export async function persistMessage(
  supabase: SupabaseClient,
  args: {
    companyId: string;
    conversationId: string;
    senderType: "customer" | "agent";
    text: string;
    metadata?: Record<string, unknown>;
    status?: string;
  },
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      company_id: args.companyId,
      conversation_id: args.conversationId,
      sender_type: args.senderType,
      text: args.text,
      media_type: "text",
      status: args.status ?? "sent",
      metadata: args.metadata ?? {},
    })
    .select("id")
    .maybeSingle();
  if (error) return null;
  const id = (data as { id?: string } | null)?.id;
  if (!id) return null;
  await supabase
    .from("conversations")
    .update({
      last_message_text: args.text.slice(0, 500),
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", args.conversationId)
    .eq("company_id", args.companyId);
  return { id };
}

/**
 * Gera o título da conversa a partir do conteúdo REAL da primeira mensagem do usuário.
 * Só grava uma vez; nunca sobrescreve um título já definido.
 */
export async function ensureConversationTitle(
  supabase: SupabaseClient,
  args: { companyId: string; conversationId: string; firstUserMessage: string },
): Promise<string | null> {
  const { data } = await supabase
    .from("conversations")
    .select("metadata")
    .eq("company_id", args.companyId)
    .eq("id", args.conversationId)
    .maybeSingle();
  const metadata = ((data as { metadata: Record<string, unknown> | null } | null)?.metadata ?? {}) as Record<string, unknown>;
  const current = metadata["title"];
  const currentTitle = typeof current === "string" ? current.trim() : "";
  const aiTitled = metadata["title_ai"] === true;

  if (aiTitled && currentTitle) return currentTitle;

  // Após algumas mensagens, o título passa a ser gerado a partir do conteúdo real da conversa.
  const { data: recent } = await supabase
    .from("messages")
    .select("role, content")
    .eq("company_id", args.companyId)
    .eq("conversation_id", args.conversationId)
    .order("created_at", { ascending: true })
    .limit(6);
  const rows = (recent ?? []) as Array<{ role: string; content: string | null }>;
  console.log("[multiplex] titulo: mensagens carregadas =", rows.length);
  if (rows.length >= 4) {
    const aiTitle = await generateConversationTitle(rows);
    if (aiTitle) {
      await supabase
        .from("conversations")
        .update({
          metadata: { ...metadata, title: aiTitle, title_ai: true },
          updated_at: new Date().toISOString(),
        })
        .eq("company_id", args.companyId)
        .eq("id", args.conversationId);
      return aiTitle;
    }
  }

  if (currentTitle && currentTitle !== "Novo chat") return currentTitle;

  const source = args.firstUserMessage.replace(/\s+/g, " ").trim();
  if (!source) return null;
  const words = source.split(" ").slice(0, 7).join(" ");
  const title = (words.length > 48 ? `${words.slice(0, 48).trim()}…` : words).replace(/[.!?,;:]+$/, "");
  const finalTitle = title.charAt(0).toLocaleUpperCase("pt-BR") + title.slice(1);

  await supabase
    .from("conversations")
    .update({ metadata: { ...metadata, title: finalTitle }, updated_at: new Date().toISOString() })
    .eq("company_id", args.companyId)
    .eq("id", args.conversationId);
  return finalTitle;
}
/**
 * Gera um título curto a partir do conteúdo REAL da conversa.
 * Sem fallback textual: se a chamada falhar, retorna null e o título anterior é mantido.
 */
async function generateConversationTitle(
  rows: Array<{ role: string; content: string | null }>,
): Promise<string | null> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) return null;

  const transcript = rows
    .filter((r) => (r.content ?? "").trim())
    .slice(0, 6)
    .map((r) => `${r.role === "user" ? "Usuário" : "Assistente"}: ${(r.content ?? "").slice(0, 400)}`)
    .join("\n");
  if (!transcript) return null;

  try {
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");
    const openai = createOpenAI({ apiKey });
    const result = streamText({
      model: openai.responses("gpt-5.4-nano"),
      system:
        "Gere um título curto em português (2 a 5 palavras, sem aspas, sem ponto final) que resuma o assunto real da conversa.",
      prompt: transcript,
      providerOptions: { openai: { store: false } },
    });
    const raw = (await result.text).trim();
    if (!raw) return null;
    const title = raw.split("\n")[0]!.replace(/^["'“”\s]+|["'“”\s.]+$/g, "").slice(0, 60);
    return title || null;
  } catch (error) {
    console.error("[multiplex] falha ao gerar titulo:", error instanceof Error ? error.message : error);
    return null;
  }
}
