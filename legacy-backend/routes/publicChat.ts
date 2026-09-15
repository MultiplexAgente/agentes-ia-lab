import { Router, Request, Response } from 'express';
import { publicAIConversationService } from '../services/ai/PublicAIConversationService.js';

export const publicChatRouter = Router();

/**
 * POST /api/public/chat
 * Processa uma mensagem do visitante na landing page pública.
 * Usa o PublicAIConversationService que chama OpenAI diretamente.
 */
publicChatRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || req.socket.remoteAddress
      || 'unknown';

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'Mensagem não pode estar vazia.' });
    }

    const result = await publicAIConversationService.processMessage({
      sessionId,
      message: String(message).trim(),
      clientIp
    });

    console.log(`[PUBLIC_CHAT] session=${result.session.id} count=${result.session.user_message_count}/${result.session.max_messages}`);

    return res.json({
      sessionId: result.session.id,
      assistantMessage: result.assistantMessage,
      limitReached: result.limitReached,
      remainingMessages: result.remainingMessages,
      userMessageCount: result.session.user_message_count,
      maxMessages: result.session.max_messages
    });

  } catch (err: any) {
    console.error('[PUBLIC_CHAT] Erro:', err?.message);

    if (err?.message?.includes('Muitas solicitações')) {
      return res.status(429).json({ error: err.message });
    }

    return res.status(500).json({
      error: 'Tive um problema para responder agora. Tente novamente.'
    });
  }
});

/**
 * POST /api/public/chat/new
 * Cria uma nova sessão (equivalente a "Novo Chat")
 */
publicChatRouter.post('/chat/new', (req: Request, res: Response) => {
  const newSession = publicAIConversationService.resetSession();
  return res.json({
    sessionId: newSession.id,
    welcomeMessage: newSession.messages[0]
  });
});

/**
 * GET /api/public/chat/session/:sessionId
 * Recupera o estado atual de uma sessão
 */
publicChatRouter.get('/chat/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = publicAIConversationService.sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Sessão não encontrada.' });
  }

  return res.json({
    sessionId: session.id,
    messages: session.messages,
    userMessageCount: session.user_message_count,
    maxMessages: session.max_messages,
    limitReached: session.user_message_count >= session.max_messages,
    remainingMessages: Math.max(0, session.max_messages - session.user_message_count)
  });
});

