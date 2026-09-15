import { createFileRoute } from "@tanstack/react-router";

import { runMultiplexTurn } from "@/lib/multiplex/pipeline.server";
import { getServiceClient } from "@/lib/multiplex/supabase.server";
import {
  ensureConversation,
  loadConversationHistory,
  recordMessage,
  resolveWhatsAppChannel,
  sendWhatsAppText,
  verifyMetaSignature,
} from "@/lib/multiplex/whatsapp.server";

interface IncomingMessage {
  from: string;
  id: string;
  type: string;
  text?: { body?: string };
  button?: { text?: string };
  interactive?: { list_reply?: { title?: string }; button_reply?: { title?: string } };
}

interface WebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: IncomingMessage[];
      };
    }>;
  }>;
}

function extractText(message: IncomingMessage): string | null {
  if (message.type === "text") return message.text?.body?.trim() ?? null;
  if (message.type === "button") return message.button?.text?.trim() ?? null;
  if (message.type === "interactive") {
    return (
      message.interactive?.list_reply?.title?.trim() ??
      message.interactive?.button_reply?.title?.trim() ??
      null
    );
  }
  return null;
}

export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  server: {
    handlers: {
      // Verificação do webhook exigida pela Meta ao cadastrar a URL.
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const expected = process.env["WHATSAPP_VERIFY_TOKEN"];

        if (!expected) return new Response("verify token não configurado", { status: 503 });
        if (mode === "subscribe" && token === expected && challenge) {
          return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
        }
        return new Response("Forbidden", { status: 403 });
      },

      POST: async ({ request }) => {
        const raw = await request.text();
        const signature = request.headers.get("x-hub-signature-256");

        let payload: WebhookPayload;
        try {
          payload = JSON.parse(raw) as WebhookPayload;
        } catch {
          return new Response("payload inválido", { status: 400 });
        }

        const supabase = getServiceClient();
        if (!supabase) return new Response("banco não configurado", { status: 503 });

        const value = payload.entry?.[0]?.changes?.[0]?.value;
        const phoneNumberId = value?.metadata?.phone_number_id;
        if (!phoneNumberId) return new Response("ok", { status: 200 });

        const channel = await resolveWhatsAppChannel(supabase, phoneNumberId);
        if (!channel) return new Response("canal não configurado", { status: 404 });

        // Assinatura da Meta é obrigatória: sem app secret não processamos nada.
        if (!channel.appSecret) return new Response("app secret não configurado", { status: 503 });
        if (!verifyMetaSignature(raw, signature, channel.appSecret)) {
          return new Response("assinatura inválida", { status: 401 });
        }

        const messages = value?.messages ?? [];
        if (messages.length === 0) return new Response("ok", { status: 200 });

        const profileName = value?.contacts?.[0]?.profile?.name ?? null;

        for (const message of messages) {
          const text = extractText(message);
          const { conversationId } = await ensureConversation(
            supabase,
            channel.companyId,
            message.from,
            profileName,
          );
          if (!conversationId) continue;

          if (!text) {
            await recordMessage(supabase, {
              companyId: channel.companyId,
              conversationId,
              senderType: "customer",
              text: `[mensagem ${message.type} recebida]`,
              externalMessageId: message.id,
              status: "received",
            });
            const notice =
              "Recebi seu envio, mas ainda consigo ler apenas mensagens de texto. Pode escrever o que precisa?";
            const sent = await sendWhatsAppText(channel, message.from, notice);
            if (sent.ok) {
              await recordMessage(supabase, {
                companyId: channel.companyId,
                conversationId,
                senderType: "agent",
                text: notice,
                externalMessageId: sent.messageId ?? null,
                status: "sent",
              });
            }
            continue;
          }

          const history = await loadConversationHistory(supabase, conversationId);

          await recordMessage(supabase, {
            companyId: channel.companyId,
            conversationId,
            senderType: "customer",
            text,
            externalMessageId: message.id,
            status: "received",
          });

          const turn = await runMultiplexTurn({
            supabase,
            company: { id: channel.companyId, name: channel.companyName },
            message: text,
            history,
            channel: "whatsapp",
            conversationId,
          });

          const reply = turn.ok ? turn.text : turn.error;

          const sent = await sendWhatsAppText(channel, message.from, reply);
          await recordMessage(supabase, {
            companyId: channel.companyId,
            conversationId,
            senderType: "agent",
            text: reply,
            externalMessageId: sent.messageId ?? null,
            status: sent.ok ? "sent" : "failed",
          });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
