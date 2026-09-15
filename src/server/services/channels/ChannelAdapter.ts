import { ChannelType } from '../../types/index';

export interface StandardIncomingMessage {
  channel: ChannelType;
  externalMessageId: string;
  senderExternalId: string;
  senderName?: string;
  text: string;
  mediaType?: 'text' | 'image' | 'audio' | 'document';
  mediaUrl?: string;
  timestamp: string;
  rawPayload: any;
}

export interface ChannelAdapter {
  channelType: ChannelType;
  parseWebhookPayload(body: any): StandardIncomingMessage | null;
  sendMessage(params: {
    recipientExternalId: string;
    text: string;
    companyId: string;
    accessToken?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendImage?(params: {
    recipientExternalId: string;
    imageUrl: string;
    caption?: string;
    companyId: string;
  }): Promise<{ success: boolean }>;
}
