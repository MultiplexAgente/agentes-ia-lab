import { Router, Request, Response } from 'express';
import { globalAIConversationService } from '../services/ai/GlobalAIConversationService.js';

export const aiConversationRouter = Router();

const DEFAULT_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

/**
 * 1. Diálogo com a IA do Multiplex (Envio de Mensagem com Contexto Completo)
 */
aiConversationRouter.post('/chat', async (req: Request, res: Response) => {
  const { 
    companyId = DEFAULT_COMPANY_ID, 
    userId = 'admin-user',
    conversationId,
    message,
    context,
    actionConfirmation,
    approvedPlan
  } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A mensagem do usuário é obrigatória.' });
  }

  try {
    const result = await globalAIConversationService.processUserMessage({
      companyId,
      userId,
      conversationId,
      message: message.trim(),
      context: context || {},
      actionConfirmation,
      approvedPlan
    });

    return res.json(result);
  } catch (err: any) {
    console.error('Erro na conversa com a IA:', err);
    return res.status(err.message?.includes('Acesso negado') ? 403 : 500).json({ 
      error: err.message || 'Falha ao processar mensagem com a IA do Multiplex.' 
    });
  }
});

/**
 * 2. Listar Conversas do Administrador com a IA
 */
aiConversationRouter.get('/conversations', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || DEFAULT_COMPANY_ID;
  const list = globalAIConversationService.listConversations(companyId);
  return res.json({ conversations: list });
});

/**
 * 3. Criar Novo Chat (+ Novo chat)
 */
aiConversationRouter.post('/conversations', (req: Request, res: Response) => {
  const { companyId = DEFAULT_COMPANY_ID, userId = 'admin-user', initialContext, title } = req.body;

  const conv = globalAIConversationService.getOrCreateConversation({
    companyId,
    userId,
    initialContext,
    title: title || 'Novo chat'
  });

  return res.status(201).json({ conversation: conv });
});

/**
 * 4. Obter Histórico de Mensagens de uma Conversa
 */
aiConversationRouter.get('/conversations/:id/messages', (req: Request, res: Response) => {
  const conversationId = req.params.id as string;
  const companyId = (req.query.companyId as string) || DEFAULT_COMPANY_ID;

  const messages = globalAIConversationService.getMessages(conversationId, companyId);
  return res.json({ messages });
});

/**
 * 5. Executar Plano ou Ação Aprovada pelo Usuário
 */
aiConversationRouter.post('/conversations/:id/execute', async (req: Request, res: Response) => {
  const conversationId = req.params.id as string;
  const { companyId = DEFAULT_COMPANY_ID, userId = 'admin-user', plan } = req.body;

  try {
    const result = await globalAIConversationService.processUserMessage({
      companyId,
      userId,
      conversationId,
      message: 'Aprovar e executar',
      actionConfirmation: true,
      approvedPlan: plan
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Falha ao executar plano.' });
  }
});

/**
 * 6. Feedback na Mensagem (👍 / 👎)
 */
aiConversationRouter.post('/messages/:id/feedback', (req: Request, res: Response) => {
  const messageId = req.params.id as string;
  const { companyId = DEFAULT_COMPANY_ID, conversationId, feedback } = req.body;

  if (!conversationId || !feedback) {
    return res.status(400).json({ error: 'conversationId e feedback são obrigatórios.' });
  }

  const ok = globalAIConversationService.registerFeedback({
    companyId,
    conversationId,
    messageId,
    feedback
  });

  return res.json({ success: ok });
});

/**
 * 7. Gerar Título Automático para Conversa (baseado no conteúdo real)
 */
aiConversationRouter.post('/generate-title', async (req: Request, res: Response) => {
  const { userMessage, assistantResponse } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: 'userMessage é obrigatório.' });
  }

  try {
    // Geração de título inteligente baseada nas primeiras mensagens
    const combined = `${userMessage} ${assistantResponse || ''}`.toLowerCase();

    // Palavras-chave para categorização rápida
    const keywordMap: Record<string, string> = {
      'catálogo|produto|item|estoque|preço|valor': 'Consulta de Catálogo',
      'cliente|contato|cadastro|lead': 'Gestão de Clientes',
      'pedido|compra|encomenda|venda': 'Pedido de Compra',
      'campanha|marketing|instagram|post': 'Campanha de Marketing',
      'imóvel|apartamento|casa|terreno|aluguel': 'Catálogo de Imóveis',
      'veículo|carro|moto|caminhão': 'Catálogo de Veículos',
      'hotel|hospedagem|quarto|diária': 'Busca de Hospedagem',
      'curso|treinamento|capacitação|aula': 'Cursos e Treinamentos',
      'vaga|emprego|contratação|currículo': 'Vagas de Emprego',
      'financeiro|pagamento|boleto|fatura': 'Financeiro',
      'agendamento|reserva|horário|consulta': 'Agendamento',
      'configuração|ajuste|personalizar|regra': 'Configurações',
      'relatório|métricas|análise|dashboard': 'Análise e Relatórios',
      'integração|canal|whatsapp|telegram|instagram': 'Integração de Canal',
      'automação|fluxo|n8n|webhook': 'Automação',
    };

    let title = '';
    for (const [pattern, label] of Object.entries(keywordMap)) {
      if (new RegExp(pattern).test(combined)) {
        title = label;
        break;
      }
    }

    // Fallback: usa as primeiras palavras significativas da mensagem
    if (!title) {
      const words = userMessage
        .replace(/[^\w\sáàãâéêíóôõúüçÁÀÃÂÉÊÍÓÔÕÚÜÇ]/g, ' ')
        .trim()
        .split(/\s+/)
        .filter((w: string) => w.length > 3)
        .slice(0, 4)
        .join(' ');
      title = words.charAt(0).toUpperCase() + words.slice(1) || 'Nova Conversa';
    }

    return res.json({ title });
  } catch (err: any) {
    console.error('Erro ao gerar título:', err);
    return res.status(500).json({ error: 'Falha ao gerar título.' });
  }
});

