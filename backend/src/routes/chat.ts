import { Router, Request, Response } from 'express';
import { store } from '../config/database.js';
import { aiService } from '../services/ai/AIService.js';
import { memoryService } from '../services/memory/MemoryService.js';
import { channelAdapters } from '../services/channels/Adapters.js';
import { n8nService } from '../services/n8n/N8nService.js';
import { v4 as uuidv4 } from 'uuid';

export const chatRouter = Router();

const DEFAULT_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

/**
 * Lista conversas unificadas (Inbox Omnichannel) com filtros
 */
chatRouter.get('/conversations', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || DEFAULT_COMPANY_ID;
  const channelFilter = req.query.channel as string;
  const statusFilter = req.query.status as string;

  let list = Array.from(store.conversations.values()).filter(c => c.company_id === companyId);

  if (channelFilter) {
    list = list.filter(c => c.channel_type === channelFilter);
  }

  if (statusFilter) {
    list = list.filter(c => c.status === statusFilter);
  }

  // Anexa dados atualizados do cliente em cada conversa
  const customers = store.customers.get(companyId) || [];
  const enriched = list.map(c => ({
    ...c,
    customer: customers.find(cust => cust.id === c.customer_id) || c.customer
  }));

  // Ordena pelas mensagens mais recentes
  enriched.sort((a, b) => {
    const timeA = new Date(a.last_message_at || 0).getTime();
    const timeB = new Date(b.last_message_at || 0).getTime();
    return timeB - timeA;
  });

  return res.json(enriched);
});

/**
 * Retorna o histórico de mensagens de uma conversa
 */
chatRouter.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  const conversationId = req.params.id;
  const messages = store.messages.get(conversationId) || [];
  return res.json(messages);
});

/**
 * Atendente humano envia mensagem direta para o cliente
 */
chatRouter.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  const conversationId = req.params.id;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Texto da mensagem é obrigatório.' });
  }

  const conversation = store.conversations.get(conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversa não encontrada.' });
  }

  // Registra mensagem humana
  const message = await memoryService.addMessage(
    conversationId,
    conversation.company_id,
    'human',
    text
  );

  // Despacha para a rede social correspondente se houver adapter
  const adapter = channelAdapters[conversation.channel_type];
  if (adapter && conversation.customer?.phone) {
    await adapter.sendMessage({
      recipientExternalId: conversation.customer.phone,
      text,
      companyId: conversation.company_id
    });
  }

  return res.json({ success: true, message });
});

/**
 * Handoff Humano: Alterna entre Assumir Conversa (Humano) e Devolver para IA
 */
chatRouter.post('/conversations/:id/handoff', async (req: Request, res: Response) => {
  const conversationId = req.params.id;
  const { action } = req.body; // 'takeover' (humano assume) ou 'release' (devolve para IA)

  const conversation = store.conversations.get(conversationId);
  if (!conversation) {
    return res.status(404).json({ error: 'Conversa não encontrada.' });
  }

  if (action === 'takeover') {
    conversation.status = 'HUMAN_ACTIVE';
    await n8nService.dispatchEvent('human.handoff', {
      conversationId,
      action: 'takeover',
      customer: conversation.customer
    });
  } else {
    conversation.status = 'ACTIVE';
    await n8nService.dispatchEvent('human.handoff', {
      conversationId,
      action: 'release',
      customer: conversation.customer
    });
  }

  store.conversations.set(conversationId, conversation);
  return res.json({ success: true, status: conversation.status });
});

/**
 * Playground e simulador interativo de mensagens
 */
chatRouter.post('/message', async (req: Request, res: Response) => {
  const { companyId, conversationId, message, channel } = req.body;

  const targetCompanyId = companyId || DEFAULT_COMPANY_ID;
  let targetConvId = conversationId;

  // Se não foi fornecida conversa (ex: Playground), cria ou usa conversa teste
  if (!targetConvId) {
    const defaultConv = Array.from(store.conversations.values()).find(c => c.company_id === targetCompanyId);
    targetConvId = defaultConv ? defaultConv.id : '66666666-6666-6666-6666-666666666666';
  }

  try {
    const result = await aiService.processMessage({
      companyId: targetCompanyId,
      conversationId: targetConvId,
      incomingText: message || ''
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
