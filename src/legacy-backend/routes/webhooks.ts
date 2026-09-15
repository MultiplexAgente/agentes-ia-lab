import { Router, Request, Response } from 'express';
import { store } from '../config/database.js';
import { channelAdapters } from '../services/channels/Adapters.js';
import { aiService } from '../services/ai/AIService.js';
import { n8nService } from '../services/n8n/N8nService.js';
import { ChannelType, Customer, Conversation } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export const webhookRouter = Router();

/**
 * Verificação de Webhook Meta (WhatsApp, Instagram, Facebook)
 */
const handleMetaVerification = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || process.env.INSTAGRAM_VERIFY_TOKEN || 'agentes_ia_verify_token';

  if (mode === 'subscribe' && token === expectedToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
};

webhookRouter.get('/whatsapp', handleMetaVerification);
webhookRouter.get('/instagram', handleMetaVerification);
webhookRouter.get('/facebook', handleMetaVerification);

/**
 * Handler genérico e idempotente para processamento de mensagens dos canais
 */
async function processIncomingChannelMessage(channel: ChannelType, req: Request, res: Response) {
  const adapter = channelAdapters[channel];
  if (!adapter) {
    return res.status(400).json({ error: `Canal '${channel}' não suportado.` });
  }

  const parsed = adapter.parseWebhookPayload(req.body);
  if (!parsed) {
    // Responde 200 para a plataforma não reenviar eventos de status (ex: status 'read', 'delivered')
    return res.status(200).json({ status: 'ignored_non_message_event' });
  }

  const companyId = (req.query.companyId as string) || '11111111-1111-1111-1111-111111111111';
  const idempotencyKey = `${companyId}:${channel}:${parsed.externalMessageId}`;

  // REGRA 40: IDEMPOTÊNCIA OBRIGATÓRIA
  if (store.webhookEvents.has(idempotencyKey)) {
    console.log(`[Idempotência] Mensagem duplicada ignorada: ${idempotencyKey}`);
    return res.status(200).json({ status: 'ignored_duplicate' });
  }
  store.webhookEvents.add(idempotencyKey);

  try {
    // 1. Localiza ou cria cliente
    let customers = store.customers.get(companyId) || [];
    let customer = customers.find(c => c.phone === parsed.senderExternalId || c.name === parsed.senderName);

    if (!customer) {
      customer = {
        id: uuidv4(),
        company_id: companyId,
        name: parsed.senderName || `Cliente ${channel}`,
        phone: parsed.senderExternalId,
        total_orders: 0,
        lifetime_value: 0
      };
      customers.push(customer);
      store.customers.set(companyId, customers);
    }

    // 2. Localiza ou cria conversa
    let conversation: Conversation | undefined;
    for (const conv of store.conversations.values()) {
      if (conv.company_id === companyId && conv.customer_id === customer.id && conv.channel_type === channel && conv.status !== 'CLOSED') {
        conversation = conv;
        break;
      }
    }

    if (!conversation) {
      conversation = {
        id: uuidv4(),
        company_id: companyId,
        customer_id: customer.id,
        channel_type: channel,
        status: 'ACTIVE',
        tags: [channel],
        customer
      };
      store.conversations.set(conversation.id, conversation);
      await n8nService.dispatchEvent('conversation.created', { conversationId: conversation.id, channel, customer });
    }

    // 3. Notifica n8n sobre a mensagem recebida
    await n8nService.dispatchEvent('message.received', {
      channel,
      messageId: parsed.externalMessageId,
      sender: parsed.senderExternalId,
      text: parsed.text
    });

    // 4. Executa raciocínio do Agente de IA
    const agentResult = await aiService.processMessage({
      companyId,
      conversationId: conversation.id,
      incomingText: parsed.text,
      externalMessageId: parsed.externalMessageId
    });

    // 5. Envia resposta de volta para o canal através do adapter
    if (agentResult.response_text) {
      await adapter.sendMessage({
        recipientExternalId: parsed.senderExternalId,
        text: agentResult.response_text,
        companyId
      });

      await n8nService.dispatchEvent('message.sent', {
        channel,
        recipient: parsed.senderExternalId,
        text: agentResult.response_text
      });
    }

    return res.status(200).json({
      status: 'success',
      conversationId: conversation.id,
      reply: agentResult.response_text,
      toolsCalled: agentResult.tools_called.map(t => t.tool_name)
    });
  } catch (err: any) {
    console.error(`Erro ao processar webhook do ${channel}:`, err);
    return res.status(500).json({ error: err.message });
  }
}

webhookRouter.post('/whatsapp', (req, res) => processIncomingChannelMessage('whatsapp', req, res));
webhookRouter.post('/instagram', (req, res) => processIncomingChannelMessage('instagram', req, res));
webhookRouter.post('/facebook', (req, res) => processIncomingChannelMessage('facebook', req, res));
webhookRouter.post('/telegram', (req, res) => processIncomingChannelMessage('telegram', req, res));
webhookRouter.post('/:channel', (req, res) => processIncomingChannelMessage(req.params.channel as ChannelType, req, res));
