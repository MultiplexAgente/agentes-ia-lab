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