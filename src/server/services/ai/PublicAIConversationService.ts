import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';


export interface PublicChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  is_promo?: boolean;
}

export type PublicChatStatus = 
  | 'READY' 
  | 'THINKING' 
  | 'RESPONDING' 
  | 'WAITING_USER' 
  | 'LIMIT_REACHED' 
  | 'ERROR';

export interface PublicSession {
  id: string;
  user_message_count: number;
  max_messages: number;
  status: PublicChatStatus;
  messages: PublicChatMessage[];
  context: {
    company_type?: string;
    catalog_type?: string;
    catalog_count?: number;
    channel_interest?: string[];
    integration_interest?: string[];
  };
  created_at: string;
  updated_at: string;
  last_activity: number;
}

export class PublicAIConversationService {
  private static instance: PublicAIConversationService;
  private openai: OpenAI | null = null;
  public sessions: Map<string, PublicSession> = new Map();
  private readonly MAX_MESSAGES = 10;
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
  private readonly MAX_REQUESTS_PER_MINUTE = 15;
  private ipRequestCounts: Map<string, { count: number; windowStart: number }> = new Map();

  private constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (key && !key.includes('your_openai_api_key')) {
      this.openai = new OpenAI({ apiKey: key });
    }
  }

  public static getInstance(): PublicAIConversationService {
    if (!PublicAIConversationService.instance) {
      PublicAIConversationService.instance = new PublicAIConversationService();
    }
    return PublicAIConversationService.instance;
  }

  /**
   * Obtém ou inicializa uma sessão pública de demonstração
   */
  public getOrCreateSession(sessionId?: string): PublicSession {
    if (sessionId && this.sessions.has(sessionId)) {
      const existing = this.sessions.get(sessionId)!;
      existing.last_activity = Date.now();
      return existing;
    }

    const newId = sessionId || `public-${uuidv4()}`;
    const initialWelcomeMsg: PublicChatMessage = {
      id: `msg-${uuidv4()}`,
      role: 'assistant',
      content: 'Olá! Eu sou a IA do Multiplex.\nMe diga o que você gostaria de fazer na sua empresa.',
      created_at: new Date().toISOString()
    };

    const session: PublicSession = {
      id: newId,
      user_message_count: 0,
      max_messages: this.MAX_MESSAGES,
      status: 'READY',
      messages: [initialWelcomeMsg],
      context: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_activity: Date.now()
    };

    this.sessions.set(newId, session);
    return session;
  }

  /**
   * Reinicia a sessão (equivalente a Novo Chat)
   */
  public resetSession(sessionId?: string): PublicSession {
    const newId = `public-${uuidv4()}`;
    return this.getOrCreateSession(newId);
  }

  /**
   * Valida rate limit básico por IP ou identificador
   */
  public checkRateLimit(clientIp: string): boolean {
    const now = Date.now();
    const tracker = this.ipRequestCounts.get(clientIp);

    if (!tracker || now - tracker.windowStart > this.RATE_LIMIT_WINDOW_MS) {
      this.ipRequestCounts.set(clientIp, { count: 1, windowStart: now });
      return true;
    }

    if (tracker.count >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    tracker.count += 1;
    return true;
  }

  /**
   * Processa uma mensagem do visitante na tela pública
   */
  public async processMessage(params: {
    sessionId?: string;
    message: string;
    clientIp?: string;
  }): Promise<{
    session: PublicSession;
    assistantMessage: PublicChatMessage;
    limitReached: boolean;
    remainingMessages: number;
  }> {
    const { sessionId, message, clientIp = 'unknown' } = params;

    // 1. Rate limiting
    if (!this.checkRateLimit(clientIp)) {
      throw new Error('Muitas solicitações em sequência. Por favor, aguarde alguns segundos.');
    }

    // 2. Recupera ou cria sessão
    const session = this.getOrCreateSession(sessionId);

    // 3. Se o limite já foi atingido anteriormente, retorna a mensagem promocional elegante
    if (session.user_message_count >= session.max_messages) {
      session.status = 'LIMIT_REACHED';
      const promoMsg: PublicChatMessage = {
        id: `promo-${uuidv4()}`,
        role: 'assistant',
        content: this.getPromoMessage(),
        created_at: new Date().toISOString(),
        is_promo: true
      };
      session.messages.push(promoMsg);
      session.updated_at = new Date().toISOString();

      return {
        session,
        assistantMessage: promoMsg,
        limitReached: true,
        remainingMessages: 0
      };
    }

    // 4. Incrementa contador de mensagens do usuário visitante
    session.user_message_count += 1;
    const currentCount = session.user_message_count;

    // Registra mensagem do usuário
    const userMsg: PublicChatMessage = {
      id: `usr-${uuidv4()}`,
      role: 'user',
      content: message.trim(),
      created_at: new Date().toISOString()
    };
    session.messages.push(userMsg);
    session.status = 'THINKING';

    // 5. Deliberação da IA Pública (responde normalmente até a 10ª mensagem)
    const assistantText = await this.generatePublicAIResponse(session, message.trim());

    const assistantMsg: PublicChatMessage = {
      id: `ai-${uuidv4()}`,
      role: 'assistant',
      content: assistantText,
      created_at: new Date().toISOString()
    };
    session.messages.push(assistantMsg);

    // 6. Se acabou de completar a 10ª mensagem, atualiza status para LIMIT_REACHED
    const isLimitReachedNow = currentCount >= session.max_messages;
    if (isLimitReachedNow) {
      session.status = 'LIMIT_REACHED';
    } else {
      session.status = 'WAITING_USER';
    }

    session.updated_at = new Date().toISOString();
    session.last_activity = Date.now();

    return {
      session,
      assistantMessage: assistantMsg,
      limitReached: isLimitReachedNow,
      remainingMessages: Math.max(0, session.max_messages - currentCount)
    };
  }

  /**
   * Gera a resposta da IA Pública fundamentada na Base de Conhecimento do Multiplex
   */
  private async generatePublicAIResponse(session: PublicSession, userText: string): Promise<string> {
    const textLower = userText.toLowerCase();

    // Atualiza contexto contínuo da sessão
    if (textLower.includes('imobiliária') || textLower.includes('imobiliaria') || textLower.includes('imóveis') || textLower.includes('imoveis')) {
      session.context.company_type = 'imobiliária';
      session.context.catalog_type = 'imóveis';
    } else if (textLower.includes('restaurante') || textLower.includes('pizzaria') || textLower.includes('hamburgueria') || textLower.includes('delivery')) {
      session.context.company_type = 'delivery / alimentação';
      session.context.catalog_type = 'cardápio';
    } else if (textLower.includes('clínica') || textLower.includes('clinica') || textLower.includes('consultório') || textLower.includes('médico')) {
      session.context.company_type = 'saúde / clínica';
      session.context.catalog_type = 'serviços e consultas';
    } else if (textLower.includes('loja') || textLower.includes('e-commerce') || textLower.includes('ecommerce') || textLower.includes('roupas')) {
      session.context.company_type = 'e-commerce / varejo';
      session.context.catalog_type = 'produtos';
    }

    // Extrai números de itens se informado (ex: "tenho 200 imóveis")
    const matchCount = userText.match(/(\d+)\s*(imóveis|imoveis|produtos|itens|carros|veículos)/i);
    if (matchCount && matchCount[1]) {
      session.context.catalog_count = parseInt(matchCount[1], 10);
    }

    if (textLower.includes('whatsapp')) {
      session.context.channel_interest = session.context.channel_interest || [];
      if (!session.context.channel_interest.includes('WhatsApp')) session.context.channel_interest.push('WhatsApp');
    }
    if (textLower.includes('instagram')) {
      session.context.channel_interest = session.context.channel_interest || [];
      if (!session.context.channel_interest.includes('Instagram')) session.context.channel_interest.push('Instagram');
    }

    // Se a OpenAI estiver disponível e fora do ambiente de teste
    if (this.openai && process.env.NODE_ENV !== 'test') {
      try {
        const sysPrompt = this.buildPublicSystemPrompt(session);
        const historyForLLM: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          { role: 'system', content: sysPrompt },
          ...session.messages.slice(-8).map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content
          }))
        ];

        const completion = await this.openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: historyForLLM,
          temperature: 0.3
        });

        const reply = completion.choices[0]?.message?.content;
        if (reply) return reply.trim();
      } catch (err) {
        console.warn('Fallback para motor local de conhecimento público:', err);
      }
    }

    // MOTOR HEURÍSTICO DETERMINÍSTICO (GARANTIA DE DEMO E TESTES SEM FALHAS)

    // O que é o Multiplex?
    if (textLower.includes('o que é o multiplex') || textLower.includes('o que e o multiplex') || textLower.includes('quem é você') || textLower === 'o que você pode fazer?') {
      return `O Multiplex é uma plataforma de agentes de IA para empresas. Ele permite colocar uma IA para atender seus clientes em canais como WhatsApp, Instagram, Facebook e Telegram, além de conectar a IA ao site, catálogo e sistemas externos através de APIs.\n\nQue tipo de empresa você possui?`;
    }

    // WhatsApp
    if (textLower.includes('whatsapp') && !textLower.includes('corrida')) {
      return `Claro. O Multiplex pode conectar sua operação ao WhatsApp e permitir que a IA converse automaticamente com seus clientes em tempo real, tire dúvidas, consulte catálogo e colete leads.\n\nVocê já possui um número do WhatsApp Business ativo ou ainda vai configurar um?`;
    }

    // Instagram
    if (textLower.includes('instagram')) {
      return `O Multiplex se conecta diretamente ao Instagram Direct. A IA pode responder mensagens diretas (DMs) e interações de clientes 24 horas por dia, com a identidade visual e o tom de voz da sua marca.\n\nVocê costuma receber muitas perguntas sobre produtos ou serviços no Instagram?`;
    }

    // Imobiliária
    if (textLower.includes('imobiliária') || textLower.includes('imobiliaria')) {
      return `Perfeito. Nesse caso, posso ajudar sua empresa a atender clientes automaticamente, consultar imóveis do seu catálogo, responder dúvidas sobre locação e venda e encaminhar leads qualificados para seus corretores.\n\nVocê já possui um site ou CRM com os imóveis cadastrados atualmente?`;
    }

    // Quantidade de imóveis / catálogo
    if (session.context.company_type === 'imobiliária' && (textLower.includes('site') || textLower.includes('tenho') || textLower.includes('crm'))) {
      const countText = session.context.catalog_count ? `os seus ${session.context.catalog_count} imóveis` : 'seus imóveis';
      return `Ótimo! O Multiplex pode sincronizar ${countText} direto do seu site para que a IA consulte disponibilidades e valores durante o atendimento.\n\nVocê também quer que a IA atenda esses clientes pelo WhatsApp e Instagram?`;
    }

    // Corridas pelo WhatsApp / MT24 / Transporte
    if (textLower.includes('corrida') || textLower.includes('motorista') || textLower.includes('transporte')) {
      return `É possível integrar o agente do Multiplex ao seu sistema de corridas por API. O cliente solicita a corrida pelo WhatsApp, a IA confirma os endereços de partida e destino, calcula a estimativa e despacha o pedido para o aplicativo do motorista.\n\nVocê já possui o sistema de corridas ou precisa criar essa integração?`;
    }

    // Conectar Site / Catálogo
    if (textLower.includes('conectar meu site') || textLower.includes('site') || textLower.includes('sincronizar')) {
      return `O Multiplex possui um extrator inteligente de catálogo capaz de ler produtos, cardápios, imóveis ou serviços direto da URL do seu site, sem necessidade de cadastrar tudo manualmente.\n\nQual é o link do site da sua empresa?`;
    }

    // APIs e Integrações
    if (textLower.includes('api') || textLower.includes('integrar meu sistema') || textLower.includes('integração') || textLower.includes('erp') || textLower.includes('crm')) {
      return `O Multiplex foi projetado para se integrar facilmente a sistemas externos através de Webhooks, APIs REST e n8n. Isso permite sincronizar estoques, criar pedidos no seu ERP ou registrar contatos no seu CRM.\n\nQual sistema ou banco de dados você utiliza hoje?`;
    }

    // Automatizar atendimento
    if (textLower.includes('automatizar meu atendimento') || textLower.includes('atendimento')) {
      return `A automação do Multiplex vai além de um chatbot simples: a IA entende contexto, interpreta intenção do cliente, lembra preferências e sabe a hora certa de transferir para um atendente humano com todo o histórico preservado.\n\nQuantos atendimentos sua equipe realiza por dia em média?`;
    }

    // Resposta contextual padrão com pergunta inteligente
    const contextPrefix = session.context.company_type ? `Pensando na sua operação de **${session.context.company_type}**:\n\n` : '';
    return `${contextPrefix}Com o Multiplex, sua empresa conta com IA multicanal conectada a WhatsApp, Instagram, seu site e suas ferramentas internas.\n\nQual é o maior desafio que você enfrenta hoje no atendimento ou nas vendas?`;
  }

  /**
   * Prompt de sistema rigoroso para a IA pública
   */
  private buildPublicSystemPrompt(session: PublicSession): string {
    return `Você é a inteligência artificial pública oficial da plataforma MULTIPLEX.
Sua missão é apresentar o produto aos visitantes através de uma conversa amigável, consultiva e inteligente.

DIRETRIZES FUNDAMENTAIS:
1. NUNCA invente funcionalidades, preços, estatísticas fictícias, clientes ou integrações inexistentes.
2. NUNCA mencione nem acesse dados privados de empresas clientes.
3. CONVERSE e FAÇA PERGUNTAS. Não responda com blocos comerciais gigantes ou listas monótonas de FAQ. Conduza o visitante pelo diálogo.
4. Entenda o nicho do visitante (imobiliária, delivery, clínica, e-commerce, etc.) e mostre como o Multiplex resolve o problema dele.
5. Recursos reais do Multiplex:
   - Canais: WhatsApp Oficial, Instagram Direct, Facebook Messenger, Telegram, Webchat.
   - Sincronização de catálogo e leitura de sites.
   - Consulta inteligente de produtos, imóveis e cardápios em tempo real.
   - Handoff para humanos com preservação de memória.
   - Integração com sistemas externos via API REST, Webhooks e n8n.
   - "Criar com IA" (AI App Builder para construir módulos e relatórios).
6. Mantenha as respostas concisas, claras e convidativas.

Contexto acumulado da conversa atual:
${JSON.stringify(session.context, null, 2)}`;
  }

  /**
   * Mensagem promocional elegante após o limite de 10 mensagens
   */
  public getPromoMessage(): string {
    return `Gostei da nossa conversa. 😊\n\nVocê acabou de conhecer uma parte do que o Multiplex pode fazer pela sua empresa.\n\nO Multiplex conecta sua IA aos canais onde seus clientes estão — WhatsApp, Instagram, Facebook e Telegram — e pode trabalhar com seu site, catálogo, conhecimento da empresa e sistemas externos através de APIs.\n\nA IA pode atender clientes, consultar produtos ou imóveis, gerar leads, executar automações, encaminhar atendimentos para sua equipe e integrar processos do seu negócio.\n\nQuer continuar?\n\n**Crie sua conta gratuitamente e conecte sua empresa ao Multiplex.**`;
  }
}

export const publicAIConversationService = PublicAIConversationService.getInstance();
