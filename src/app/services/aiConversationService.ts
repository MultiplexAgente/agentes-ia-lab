import { 
  AIConversation, 
  AIConversationMessage, 
  AIConversationContext 
} from '../types/conversation';

const DEFAULT_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

export class AIConversationService {
  private apiBase: string;

  constructor(apiBase: string = '') {
    this.apiBase = apiBase;
  }

  public setApiBase(url: string) {
    this.apiBase = url;
  }

  /**
   * Envia uma mensagem do usuário enriquecida com o contexto da tela
   */
  public async sendMessage(params: {
    message: string;
    conversationId?: string;
    companyId?: string;
    context?: AIConversationContext;
    actionConfirmation?: boolean;
    approvedPlan?: any;
  }): Promise<{
    conversation: AIConversation;
    userMessage: AIConversationMessage;
    assistantMessage: AIConversationMessage;
  }> {
    const { 
      message, 
      conversationId, 
      companyId = DEFAULT_COMPANY_ID, 
      context = {},
      actionConfirmation,
      approvedPlan
    } = params;

    const res = await fetch(`${this.apiBase}/api/ai/conversation/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId,
        conversationId,
        message,
        context,
        actionConfirmation,
        approvedPlan
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Falha na comunicação com a IA.' }));
      throw new Error(err.error || 'Erro ao conversar com a IA do Multiplex.');
    }

    return await res.json();
  }

  /**
   * Lista histórico de conversas do administrador
   */
  public async listConversations(companyId: string = DEFAULT_COMPANY_ID): Promise<AIConversation[]> {
    const res = await fetch(`${this.apiBase}/api/ai/conversation/conversations?companyId=${companyId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.conversations || [];
  }

  /**
   * Cria uma nova conversa distinta (+ Novo chat)
   */
  public async createNewChat(params: {
    companyId?: string;
    title?: string;
    initialContext?: AIConversationContext;
  }): Promise<AIConversation> {
    const { companyId = DEFAULT_COMPANY_ID, title = 'Novo chat', initialContext } = params;
    const res = await fetch(`${this.apiBase}/api/ai/conversation/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, title, initialContext })
    });

    if (!res.ok) {
      throw new Error('Falha ao iniciar novo chat.');
    }

    const data = await res.json();
    return data.conversation;
  }

  /**
   * Carrega histórico de mensagens de uma conversa existente
   */
  public async getMessages(conversationId: string, companyId: string = DEFAULT_COMPANY_ID): Promise<AIConversationMessage[]> {
    const res = await fetch(`${this.apiBase}/api/ai/conversation/conversations/${conversationId}/messages?companyId=${companyId}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.messages || [];
  }

  /**
   * Aprova e executa um plano de ação
   */
  public async executePlan(params: {
    conversationId: string;
    plan: any;
    companyId?: string;
  }): Promise<{
    conversation: AIConversation;
    assistantMessage: AIConversationMessage;
  }> {
    const { conversationId, plan, companyId = DEFAULT_COMPANY_ID } = params;
    const res = await fetch(`${this.apiBase}/api/ai/conversation/conversations/${conversationId}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, plan })
    });

    if (!res.ok) {
      throw new Error('Falha ao executar plano com a IA.');
    }

    return await res.json();
  }

  /**
   * Envia feedback 👍 / 👎
   */
  public async sendFeedback(params: {
    conversationId: string;
    messageId: string;
    feedback: 'thumbs_up' | 'thumbs_down';
    companyId?: string;
  }): Promise<boolean> {
    const { conversationId, messageId, feedback, companyId = DEFAULT_COMPANY_ID } = params;
    const res = await fetch(`${this.apiBase}/api/ai/conversation/messages/${messageId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, conversationId, feedback })
    });
    return res.ok;
  }
}

export const aiConversationService = new AIConversationService();
