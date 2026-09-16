import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const GRAPH_VERSION = "v21.0";

export interface WhatsAppChannel {
  companyId: string;
  companyName: string;
  channelId: string | null;
  phoneNumberId: string;
  accessToken: string;
  appSecret: string | null;
}

/** Verifica a assinatura X-Hub-Signature-256 da Meta sobre o corpo cru. */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const received = header.slice("sha256=".length);
  const a = Buffer.from(received, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Resolve o canal WhatsApp pelo phone_number_id recebido no webhook.
 * Prioriza as credenciais gravadas no banco; cai para as variáveis do servidor.
 */
export async function resolveWhatsAppChannel(
  supabase: SupabaseClient,
  phoneNumberId: string,
): Promise<WhatsAppChannel | null> {
  const { data } = await supabase
    .from("channel_credentials")
    .select("channel_id, company_id, phone_number_id, access_token, app_secret")
    .eq("phone_number_id", phoneNumberId)
    .maybeSingle();

  const envToken = process.env["WHATSAPP_ACCESS_TOKEN"] ?? null;
  const envSecret = process.env["WHATSAPP_APP_SECRET"] ?? null;
  const envPhoneId = process.env["WHATSAPP_PHONE_NUMBER_ID"] ?? null;

  let companyId: string | null = (data as { company_id?: string } | null)?.company_id ?? null;
  let channelId: string | null = (data as { channel_id?: string } | null)?.channel_id ?? null;
  let accessToken: string | null = (data as { access_token?: string } | null)?.access_token ?? null;
  let appSecret: string | null = (data as { app_secret?: string } | null)?.app_secret ?? null;

  if (!companyId) {
    // Sem mapeamento no banco: só aceitamos o número configurado no servidor.
    if (envPhoneId && envPhoneId !== phoneNumberId) return null;
    const { data: company } = await supabase
      .from("companies")
      .select("id, name")
      .eq("active", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!company) return null;
    companyId = (company as { id: string }).id;
  }

  accessToken = accessToken || envToken;
  appSecret = appSecret || envSecret;
  if (!accessToken) return null;

  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", companyId)
    .maybeSingle();
  if (!company) return null;

  return {
    companyId: (company as { id: string }).id,
    companyName: (company as { name: string }).name,
    channelId,
    phoneNumberId,
    accessToken,
    appSecret,
  };
}

/** Envia o texto de resposta pela Cloud API da Meta. */
export async function sendWhatsAppText(
  channel: WhatsAppChannel,
  to: string,
  body: string,
): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${channel.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${channel.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { preview_url: false, body: body.slice(0, 4000) },
      }),
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | { messages?: Array<{ id: string }>; error?: { message?: string } }
    | null;

  if (!response.ok) {
    return { ok: false, error: payload?.error?.message ?? `HTTP ${response.status}` };
  }
  return { ok: true, messageId: payload?.messages?.[0]?.id };
}

/** Cliente + conversa persistidos, para a mensagem do canal aparecer no chat. */
export async function ensureConversation(
  supabase: SupabaseClient,
  companyId: string,
  waId: string,
  profileName: string | null,
): Promise<{ conversationId: string | null; customerId: string | null }> {
  const { data: link } = await supabase
    .from("customer_channels")
    .select("customer_id")
    .eq("company_id", companyId)
    .eq("channel_type", "whatsapp")
    .eq("external_id", waId)
    .maybeSingle();

  let customerId = (link as { customer_id?: string } | null)?.customer_id ?? null;

  if (!customerId) {
    const { data: customer } = await supabase
      .from("customers")
      .insert({ company_id: companyId, name: profileName ?? waId, phone: waId })
      .select("id")
      .maybeSingle();
    customerId = (customer as { id?: string } | null)?.id ?? null;
    if (customerId) {
      await supabase.from("customer_channels").insert({
        customer_id: customerId,
        company_id: companyId,
        channel_type: "whatsapp",
        external_id: waId,
        profile_name: profileName,
      });
    }
  }

  if (!customerId) return { conversationId: null, customerId: null };

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("company_id", companyId)
    .eq("customer_id", customerId)
    .eq("channel_type", "whatsapp")
    .in("status", ["NEW", "ACTIVE", "WAITING_CUSTOMER"])
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversationId = (existing as { id?: string } | null)?.id ?? null;
  if (!conversationId) {
    const { data: created } = await supabase
      .from("conversations")
      .insert({
        company_id: companyId,
        customer_id: customerId,
        channel_type: "whatsapp",
        status: "ACTIVE",
      })
      .select("id")
      .maybeSingle();
    conversationId = (created as { id?: string } | null)?.id ?? null;
  }

  return { conversationId, customerId };
}

export async function recordMessage(
  supabase: SupabaseClient,
  args: {
    companyId: string;
    conversationId: string;
    senderType: "customer" | "agent";
    text: string;
    externalMessageId?: string | null;
    status: string;
  },
): Promise<void> {
  await supabase.from("messages").insert({
    conversation_id: args.conversationId,
    company_id: args.companyId,
    sender_type: args.senderType,
    external_message_id: args.externalMessageId ?? null,
    text: args.text,
    media_type: "text",
    status: args.status,
  });

  await supabase
    .from("conversations")
    .update({
      last_message_text: args.text.slice(0, 500),
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", args.conversationId);
}

/** Histórico real da conversa do canal, para o roteador ter contexto. */
export async function loadConversationHistory(
  supabase: SupabaseClient,
  conversationId: string,
  limit = 12,
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const { data } = await supabase
    .from("messages")
    .select("sender_type, text, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  const rows = ((data ?? []) as Array<{ sender_type: string; text: string | null }>).reverse();
  return rows
    .filter((row) => Boolean(row.text))
    .map((row) => ({
      role: row.sender_type === "customer" ? ("user" as const) : ("assistant" as const),
      content: row.text as string,
    }));
}
