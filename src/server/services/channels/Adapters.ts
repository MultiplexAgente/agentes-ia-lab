import axios from 'axios';
import { ChannelAdapter, StandardIncomingMessage } from './ChannelAdapter';
import { ChannelType } from '../../types/index';

// =========================================================================
// WHATSAPP ADAPTER (WhatsApp Business Platform / Cloud API)
// =========================================================================
export class WhatsAppAdapter implements ChannelAdapter {
  public channelType: ChannelType = 'whatsapp';

  public parseWebhookPayload(body: any): StandardIncomingMessage | null {
    try {
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];
      const contact = change?.contacts?.[0];

      if (!message || !message.text?.body) return null;

      return {
        channel: 'whatsapp',
        externalMessageId: message.id,
        senderExternalId: message.from,
        senderName: contact?.profile?.name || 'Cliente WhatsApp',
        text: message.text.body,
        mediaType: 'text',
        timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
        rawPayload: body
      };
    } catch {
      return null;
    }
  }

  public async sendMessage(params: {
    recipientExternalId: string;
    text: string;
    companyId: string;
    accessToken?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const token = params.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
      console.log(`[WhatsAppAdapter MOCK] Mensagem simulada para ${params.recipientExternalId}: "${params.text}"`);
      return { success: true, messageId: `wam_${Date.now()}` };
    }

    try {
      const res = await axios.post(
        `https://graph.facebook.com/v21.0/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: params.recipientExternalId,
          type: 'text',
          text: { body: params.text }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, messageId: res.data?.messages?.[0]?.id };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error?.message || err.message };
    }
  }
}

// =========================================================================
// INSTAGRAM ADAPTER (Instagram Graph API / Direct)
// =========================================================================
export class InstagramAdapter implements ChannelAdapter {
  public channelType: ChannelType = 'instagram';

  public parseWebhookPayload(body: any): StandardIncomingMessage | null {
    try {
      const messaging = body?.entry?.[0]?.messaging?.[0];
      if (!messaging || !messaging.message?.text) return null;

      return {
        channel: 'instagram',
        externalMessageId: messaging.message.mid,
        senderExternalId: messaging.sender.id,
        senderName: 'Cliente Instagram',
        text: messaging.message.text,
        mediaType: 'text',
        timestamp: new Date(messaging.timestamp).toISOString(),
        rawPayload: body
      };
    } catch {
      return null;
    }
  }

  public async sendMessage(params: {
    recipientExternalId: string;
    text: string;
    companyId: string;
    accessToken?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const token = params.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!token) {
      console.log(`[InstagramAdapter MOCK] Resposta Direct para ${params.recipientExternalId}: "${params.text}"`);
      return { success: true, messageId: `ig_mid_${Date.now()}` };
    }

    try {
      const res = await axios.post(
        `https://graph.facebook.com/v21.0/me/messages`,
        {
          recipient: { id: params.recipientExternalId },
          message: { text: params.text }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, messageId: res.data?.message_id };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error?.message || err.message };
    }
  }
}

// =========================================================================
// FACEBOOK ADAPTER (Messenger Platform)
// =========================================================================
export class FacebookAdapter implements ChannelAdapter {
  public channelType: ChannelType = 'facebook';

  public parseWebhookPayload(body: any): StandardIncomingMessage | null {
    try {
      const messaging = body?.entry?.[0]?.messaging?.[0];
      if (!messaging || !messaging.message?.text) return null;

      return {
        channel: 'facebook',
        externalMessageId: messaging.message.mid,
        senderExternalId: messaging.sender.id,
        senderName: 'Usuário Facebook',
        text: messaging.message.text,
        mediaType: 'text',
        timestamp: new Date(messaging.timestamp).toISOString(),
        rawPayload: body
      };
    } catch {
      return null;
    }
  }

  public async sendMessage(params: {
    recipientExternalId: string;
    text: string;
    companyId: string;
    accessToken?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const token = params.accessToken || process.env.FACEBOOK_ACCESS_TOKEN;

    if (!token) {
      console.log(`[FacebookAdapter MOCK] Mensagem Messenger para ${params.recipientExternalId}: "${params.text}"`);
      return { success: true, messageId: `fb_mid_${Date.now()}` };
    }

    try {
      const res = await axios.post(
        `https://graph.facebook.com/v21.0/me/messages`,
        {
          recipient: { id: params.recipientExternalId },
          message: { text: params.text }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { success: true, messageId: res.data?.message_id };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.error?.message || err.message };
    }
  }
}

// =========================================================================
// TELEGRAM ADAPTER (Telegram Bot API)
// =========================================================================
export class TelegramAdapter implements ChannelAdapter {
  public channelType: ChannelType = 'telegram';

  public parseWebhookPayload(body: any): StandardIncomingMessage | null {
    try {
      const msg = body?.message;
      if (!msg || !msg.text) return null;

      return {
        channel: 'telegram',
        externalMessageId: String(msg.message_id),
        senderExternalId: String(msg.chat.id),
        senderName: [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(' ') || 'Usuário Telegram',
        text: msg.text,
        mediaType: 'text',
        timestamp: new Date(msg.date * 1000).toISOString(),
        rawPayload: body
      };
    } catch {
      return null;
    }
  }

  public async sendMessage(params: {
    recipientExternalId: string;
    text: string;
    companyId: string;
    accessToken?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const token = params.accessToken || process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.log(`[TelegramAdapter MOCK] Mensagem Telegram para ChatID ${params.recipientExternalId}: "${params.text}"`);
      return { success: true, messageId: `tg_${Date.now()}` };
    }

    try {
      const res = await axios.post(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          chat_id: params.recipientExternalId,
          text: params.text
        }
      );
      return { success: true, messageId: String(res.data?.result?.message_id) };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.description || err.message };
    }
  }
}

export const channelAdapters: Record<ChannelType, ChannelAdapter> = {
  whatsapp: new WhatsAppAdapter(),
  instagram: new InstagramAdapter(),
  facebook: new FacebookAdapter(),
  telegram: new TelegramAdapter()
};
