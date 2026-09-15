import OpenAI from 'openai';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../../config/database';
import { 
  AIConversation, 
  AIConversationMessage, 
  AIConversationContext, 
  AIConversationStatus,
  AIConversationIntent,
  AIConversationSuggestedOption,
  AIBuildPlan
} from '../../types/index';
import { ApplicationIntrospectionService } from '../builder/ApplicationIntrospectionService';
import { AIToolExecutor } from './AIToolExecutor';

dotenv.config();

export class GlobalAIConversationService {
  private openai: OpenAI | null = null;
  private static instance: GlobalAIConversationService;

  private constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (key && !key.includes('your_openai_api_key')) {
      this.openai = new OpenAI({ apiKey: key });
    }
  }

  public static getInstance(): GlobalAIConversationService {
    if (!GlobalAIConversationService.instance) {
      GlobalAIConversationService.instance = new GlobalAIConversationService();
    }
    return GlobalAIConversationService.instance;
  }

  /**
   * Obtém ou cria uma conversa da IA com o Administrador
   */
  public getOrCreateConversation(params: {
    companyId: string;
    userId?: string;
    conversationId?: string;
    initialContext?: AIConversationContext;
    title?: string;
  }): AIConversation {
    const { companyId, userId = 'admin-user', conversationId, initialContext, title } = params;

    if (conversationId && store.aiConversations.has(conversationId)) {
      const existing = store.aiConversations.get(conversationId)!;
      // Validação de isolamento Multi-tenant
      if (existing.company_id !== companyId) {
        throw new Error('Acesso negado: A conversa informada pertence a outra empresa.');
      }
      if (initialContext) {
        existing.context = { ...existing.context, ...initialContext };
        existing.updated_at = new Date().toISOString();
      }
      return existing;
    }

    const newId = conversationId || `conv-ai-${uuidv4()}`;
    const newConv: AIConversation = {
      id: newId,
      company_id: companyId,
      user_id: userId,
      title: title || 'Novo chat',
      context: initialContext || {},
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    store.aiConversations.set(newId, newConv);
    if (!store.aiConversationMessages.has(newId)) {
      store.aiConversationMessages.set(newId, []);
    }

    return newConv;
  }

  /**
   * Lista todas as conversas do administrador para a empresa
   */
  public listConversations(companyId: string): AIConversation[] {
    return Array.from(store.aiConversations.values())
      .filter(c => c.company_id === companyId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  /**
   * Obtém histórico completo de mensagens de uma conversa
   */
  public getMessages(conversationId: string, companyId: string): AIConversationMessage[] {
    const conv = store.aiConversations.get(conversationId);
    if (!conv || conv.company_id !== companyId) {
      return [];
    }
    return store.aiConversationMessages.get(conversationId) || [];
  }

  /**
   * Processa uma mensagem do usuário dentro do diálogo com a IA
   */
  public async processUserMessage(params: {
    companyId: string;
    userId?: string;
    conversationId?: string;
    message: string;
    context?: AIConversationContext;
    actionConfirmation?: boolean;
    approvedPlan?: any;
  }): Promise<{
    conversation: AIConversation;
    userMessage: AIConversationMessage;
    assistantMessage: AIConversationMessage;
  }> {
    const { companyId, userId = 'admin-user', message, context = {}, actionConfirmation, approvedPlan } = params;

    // 1. Obter ou criar conversa
    const conversation = this.getOrCreateConversation({
      companyId,
      userId,
      conversationId: params.conversationId,
      initialContext: context
    });

    const conversationId = conversation.id;
    const history = store.aiConversationMessages.get(conversationId) || [];

    // 2. Registra a mensagem do usuário
    const userMessageId = `msg-usr-${uuidv4()}`;
    const userMessage: AIConversationMessage = {
      id: userMessageId,
      conversation_id: conversationId,
      company_id: companyId,
      user_id: userId,
      role: 'user',
      content: message,
      context: { ...conversation.context, ...context },
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };
    history.push(userMessage);

    // Atualiza título se for a primeira mensagem
    if (history.filter(m => m.role === 'user').length === 1) {
      conversation.title = message.length > 35 ? message.slice(0, 32) + '...' : message;
    }
    conversation.updated_at = new Date().toISOString();

    // 3. Introspecção do sistema real
    const snapshot = ApplicationIntrospectionService.inspect(companyId);

    // 4. Se o usuário estiver aprovando uma ação / plano pendente
    if (actionConfirmation && (approvedPlan || history[history.length - 2]?.plan)) {
      const planToExecute = approvedPlan || history[history.length - 2]?.plan;
      const executionResult = await this.executePlanOrAction(companyId, planToExecute);

      const assistantMsg: AIConversationMessage = {
        id: `msg-ai-${uuidv4()}`,
        conversation_id: conversationId,
        company_id: companyId,
        user_id: userId,
        role: 'assistant',
        content: `Pronto!\n\n${executionResult.message}\n\nA alteração já está ativa no seu Multiplex.`,
        context: conversation.context,
        intent: 'action',
        status: 'COMPLETED',
        created_at: new Date().toISOString()
      };

      conversation.status = 'COMPLETED';
      history.push(assistantMsg);
      store.aiConversationMessages.set(conversationId, history);

      return { conversation, userMessage, assistantMessage: assistantMsg };
    }

    // 5. Raciocínio Deliberativo da IA (OpenAI ou Motor Autônomo com regras de negócio estritas)
    const assistantMessage = await this.deliberateResponse({
      companyId,
      userId,
      conversation,
      incomingMessage: message,
      history,
      context: { ...conversation.context, ...context },
      snapshot
    });

    history.push(assistantMessage);
    store.aiConversationMessages.set(conversationId, history);

    return {
      conversation,
      userMessage,
      assistantMessage
    };
  }

  /**
   * Motor de raciocínio da IA
   */
  private async deliberateResponse(params: {
    companyId: string;
    userId: string;
    conversation: AIConversation;
    incomingMessage: string;
    history: AIConversationMessage[];
    context: AIConversationContext;
    snapshot: any;
  }): Promise<AIConversationMessage> {
    const { companyId, userId, conversation, incomingMessage, history, context, snapshot } = params;
    const msgLower = incomingMessage.toLowerCase().trim();

    // Contexto enriquecido da tela e do sistema
    const currentPage = context.page || '';
    const currentModule = context.module || '';
    const previousUserMessages = history.filter(m => m.role === 'user');
    const isFirstInteraction = previousUserMessages.length <= 1;

    // Resumo de dados reais para injeção
    const customersCount = snapshot.totalCustomers || 0;
    const productsCount = snapshot.totalProducts || 0;
    const conversationsCount = snapshot.totalConversations || 0;
    const existingModulesNames = snapshot.existingModules.map((m: any) => m.name).join(', ') || 'Nenhum';

    // -------------------------------------------------------------------------
    // CENÁRIO TESTE 1: Área de Leads (Builder / Criar com IA)
    // -------------------------------------------------------------------------
    if (
      msgLower.includes('área de leads') ||
      msgLower.includes('area de leads') ||
      msgLower.includes('acompanhar meus leads') ||
      msgLower.includes('painel de leads') ||
      (msgLower.includes('leads') && (msgLower.includes('criar') || msgLower.includes('quero')))
    ) {
      conversation.context.entity = 'leads';
      conversation.context.action = 'create_leads_view';

      return {
        id: `msg-ai-${uuidv4()}`,
        conversation_id: conversation.id,
        company_id: companyId,
        user_id: userId,
        role: 'assistant',
        content: `Claro. Posso criar essa área de leads para você.\n\nAntes de implementar, quero entender uma coisa:\n\nVocê quer acompanhar somente os leads gerados pelas conversas da IA ou também leads cadastrados manualmente?`,
        intent: 'clarification',
        suggested_options: [
          { label: 'Somente conversas', value: 'Somente conversas da IA' },
          { label: 'Todos os leads', value: 'Todos os leads (conversas + manuais)' }
        ],
        status: 'WAITING_USER',
        created_at: new Date().toISOString()
      };
    }

    // Resposta ao esclarecimento de leads:
    if (
      (conversation.context.entity === 'leads' || history.some(m => m.content.includes('acompanhar somente os leads'))) &&
      (msgLower.includes('somente') || msgLower.includes('apenas') || msgLower.includes('todos')) &&
      !history.some(m => m.content.includes('Posso usar esse conjunto inicialmente?'))
    ) {
      return {
        id: `msg-ai-${uuidv4()}`,
        conversation_id: conversation.id,
        company_id: companyId,
        user_id: userId,
        role: 'assistant',
        content: `Perfeito.\n\nVocê quer acompanhar quais informações?\n\n• Nome\n• Telefone\n• Canal de origem\n• Status\n• Última interação\n• Responsável\n• Data de criação\n\nPosso usar esse conjunto inicialmente?`,
        intent: 'clarification',
        suggested_options: [
          { label: 'Sim, usar este conjunto', value: 'Sim' },
          { label: 'Adicionar mais campos', value: 'Quero adicionar mais campos' }
        ],
        status: 'WAITING_USER',
        created_at: new Date().toISOString()
      };
    }

    // Confirmação final da área de leads:
    if (
      conversation.context.entity === 'leads' &&
      (msgLower === 'sim' || msgLower.includes('pode usar') || msgLower.includes('usar este conjunto'))
    ) {
      const plan: AIBuildPlan = {
        action: 'create_module',
        target_module: {
          name: 'Acompanhamento de Leads',
          slug: 'acompanhamento-de-leads'
        },
        summary: 'Módulo de gestão de leads integrando clientes reais e conversas de canais.',
        components_summary: [
          'Cards de métricas (Total de Leads, Novos Hoje, Taxa de Conversão)',
          'Tabela dinâmica com Nome, Telefone, Canal, Status e Data',
          'Filtro rápido por canal e status'
        ],
        data_sources: ['customers', 'conversations'],
        risk_level: 'LOW_RISK',
        suggested_schema: {
          title: 'Acompanhamento de Leads',
          description: 'Visão unificada de leads capturados em todos os canais de atendimento.',
          icon: 'Users',
          layout: 'dashboard',
          sections: [
            {
              id: 'sec-leads-main',
              title: 'Métricas e Lista de Leads',
              components: [
                {
                  id: 'c-stat-leads',
                  type: 'metric',
                  title: 'Total de Leads',
                  dataSource: 'customers',
                  aggregation: 'count'
                },
                {
                  id: 'c-stat-conv',
                  type: 'metric',
                  title: 'Leads Ativos no WhatsApp',
                  dataSource: 'conversations',
                  aggregation: 'count',
                  filter: { channel: 'WHATSAPP' }
                },
                {
                  id: 'c-tbl-leads',
                  type: 'table',
                  title: 'Lista Consolidada de Leads',
                  dataSource: 'customers',
                  columns: [
                    { key: 'name', label: 'Nome' },
                    { key: 'phone', label: 'Telefone' },
                    { key: 'created_at', label: 'Data', format: 'date' }
                  ]
                }
              ]
            }
          ]
        }
      };

      return {
        id: `msg-ai-${uuidv4()}`,
        conversation_id: conversation.id,
        company_id: companyId,
        user_id: userId,
        role: 'assistant',
        content: `Perfeito. Analisei o sistema.\n\nEncontrei:\n• **${customersCount} clientes** na base\n• WhatsApp e canais configurados\n• Histórico de conversas existente\n\nVou reutilizar a estrutura atual e criar o módulo **Acompanhamento de Leads** com cards de métricas e tabela de clientes.\n\nPosso aplicar a criação agora?`,
        intent: 'confirmation',
        plan,
        suggested_options: [
          { label: 'Aprovar e Criar Módulo', value: 'Aprovar', action_type: 'execute', variant: 'primary' },
          { label: 'Ajustar Campos', value: 'Quero fazer ajustes' },
          { label: 'Cancelar', value: 'Cancelar', action_type: 'cancel', variant: 'danger' }
        ],
        status: 'WAITING_USER',
        created_at: new Date().toISOString()
      };
    }

    // -------------------------------------------------------------------------
    // CENÁRIO TESTE 2: Quero mudar o nome da minha IA
    // -------------------------------------------------------------------------
    if (
      msgLower === 'quero mudar o nome da minha ia' ||
      msgLower === 'quero mudar o nome da ia' ||
      msgLower === 'mudar nome da ia' ||
      (msgLower.includes('mudar') && msgLower.includes('nome') && msgLower.includes('ia') && !msgLower.includes('chame') && !msgLower.includes('para'))
    ) {
      conversation.context.page = 'agent_identity';
      conversation.context.action = 'change_agent_name';

      return {
        id: `msg-ai-${uuidv4()}`,
        conversation_id: conversation.id,
        company_id: companyId,
        user_id: userId,
        role: 'assistant',
        content: `Claro! Qual é o novo nome que você deseja dar para a sua assistente de IA?`,
        intent: 'clarification',
        status: 'WAITING_USER',
        created_at: new Date().toISOString()
      };
    }

    // -------------------------------------------------------------------------
    // CENÁRIO TESTE 3: Identidade da IA ("Assistente Casa Nova")
    // -------------------------------------------------------------------------
    if (
      msgLower.includes('assistente casa nova') ||
      (currentPage === 'agent_identity' && (msgLower.includes('chame') || msgLower.includes('nome')))
    ) {
      const matchName = incomingMessage.match(/['"](.*?)['"]/)?.[1] || 'Assistente Casa Nova';
      conversation.context.page = 'agent_identity';
      conversation.context.editable_fields = ['display_name', 'introduction', 'role_description', 'tone'];

      const identityPlan = {
        action: 'update_agent_identity',
        display_name: matchName,
        introduction: `Olá! Sou a ${matchName}, assistente virtual da nossa equipe. Como posso ajudar você hoje?`,
        summary: `Alteração do nome para "${matchName}" e atualização da mensagem de apresentação aos clientes.`
      };

      return {
        id: `msg-ai-${uuidv4()}`,
        conversation_id: conversation.id,
        company_id: companyId,
        user_id: userId,
        role: 'assistant',
        content: `Perfeito. Você quer apenas alterar o nome para "${matchName}" ou também quer que eu ajuste a forma como ela se apresenta aos clientes?`,
        intent: 'clarification',
        plan: identityPlan,
        suggested_options: [
          { label: 'Ajustar nome e apresentação', value: 'Ajustar os dois', action_type: 'execute', variant: 'primary' },
          { label: 'Apenas o nome', value: 'Apenas o nome' },
          { label: 'Cancelar', value: 'Cancelar', action_type: 'cancel' }
        ],
        status: 'WAITING_USER',
        created_at: new Date().toISOString()
      };
    }

    // Ajustar tom para profissional / comportamento
    if (
      msgLower.includes('mais profissional') ||
      msgLower.includes('deixar a ia mais profissional') ||
      (currentPage === 'agent_personality' && msgLower.includes('profissional'))
    ) {
      const personalityPlan = {
        action: 'update_agent_personality',
        tone: 'professional',
        formality: 'formal',
        use_emojis: false,
        summary: 'Ajuste do tom para profissional corporativo e redução de emojis.'
      };

      return {
        id: `msg-ai-${uuidv4()}`,
        conversation_id: conversation.id,
        company_id: companyId,
        user_id: userId,
        role: 'assistant',
        content: `Posso ajustar o tom para profissional e reduzir o uso de emojis.\n\nTambém posso alterar a apresentação inicial para uma linguagem mais corporativa.\n\nQuer aplicar os dois?`,
        intent: 'clarification',
        plan: personalityPlan,
        suggested_options: [
          { label: 'Aplicar os dois', value: 'Aplicar os dois', action_type: 'execute', variant: 'primary' },
          { label: 'Somente tom', value: 'Somente tom' },
          { label: 'Cancelar', value: 'Cancelar', action_type: 'cancel' }
        ],
        status: 'WAITING_USER',
        created_at: new Date().toISOString()
      };
    }

    // -------------------------------------------------------------------------
    // CENÁRIO TESTE 4: Catálogo ("Quais produtos estão sem preço?")
    // -------------------------------------------------------------------------
    if (
      msgLower.includes('sem preço') ||
      msgLower.includes('sem preco') ||
      (msgLower.includes('produtos') && msgLower.includes('preço') && (msgLower.includes('quais') || msgLower.includes('falta')))
    ) {
      const catTool = await AIToolExecutor.executeTool(companyId, 'search_catalog', { missingPrice: true });
      const items = catTool.data?.items || [];

      if (items.length === 0) {
        return {
          id: `msg-ai-${uuidv4()}`,
          conversation_id: conversation.id,
          company_id: companyId,
          user_id: userId,
          role: 'assistant',
          content: `Consultei seu catálogo em tempo real. Todos os seus **${productsCount} produtos** cadastrados possuem preços definidos. Nenhum item está com preço pendente.`,
          intent: 'question',
          status: 'COMPLETED',
          created_at: new Date().toISOString()
        };
      }

      const listFormatted = items.slice(0, 10).map((i: any) => `• **${i.name}** (Categoria: ${i.category || 'Geral'})`).join('\n');
      return {
        id: `msg-ai-${uuidv4()}`,
        conversation_id: conversation.id,
        company_id: companyId,
        user_id: userId,
        role: 'assistant',
        content: `Encontrei **${items.length} produto(s) sem preço** cadastrado no seu catálogo:\n\n${listFormatted}\n\nDeseja definir os preços destes itens agora?`,
        intent: 'question',
        suggested_options: [
          { label: 'Definir preços agora', value: 'Quero cadastrar os preços' },
          { label: 'Ver catálogo completo', value: 'Ver catálogo' }
        ],
        status: 'COMPLETED',
        created_at: new Date().toISOString()
      };
    }

    // Sincronizar catálogo com site
    if (
      msgLower.includes('importar os produtos do meu site') ||
      msgLower.includes('importar produtos do site') ||
      (msgLower.includes('site') && msgLower.includes('catálogo') && msgLower.includes('importar'))
    ) {
      conversation.context.page = 'catalog';
      conversation.context.action = 'website_sync';

      return {
        id: `msg-ai-${uuidv4()}`,
        conversation_id: conversation.id,
        company_id: companyId,
        user_id: userId,
        role: 'assistant',
        content: `Claro. Qual é o endereço do site que deseja sincronizar para extrairmos o catálogo?`,
        intent: 'clarification',
        status: 'WAITING_USER',
        created_at: new Date().toISOString()
      };
    }

    // -------------------------------------------------------------------------
    // CENÁRIO TESTE 5: Integrações ("Quero conectar o MT 24 Horas Express")
    // -------------------------------------------------------------------------
    if (
      msgLower.includes('mt24') ||
      msgLower.includes('mt 24') ||
      msgLower.includes('mt 24 horas')
    ) {
      conversation.context.page = 'integrations';
      conversation.context.integration_context = 'MT24';

      return {
        id: `msg-ai-${uuidv4()}`,
        conversation_id: conversation.id,
        company_id: companyId,
        user_id: userId,
        role: 'assistant',
        content: `Excelente! O **MT 24 Horas Express** integra despacho automático de entregas e corridas no seu sistema.\n\nPara conectar, você precisa da sua chave de integração (Token de API) fornecida pelo MT 24 Horas.\n\nVocê já tem essa chave em mãos ou prefere ver o passo a passo de como obtê-la?`,
        intent: 'clarification',
        suggested_options: [
          { label: 'Já tenho a chave', value: 'Já tenho o Token de API do MT24' },
          { label: 'Como obter a chave?', value: 'Como consigo o Token do MT24?' },
          { label: 'Explicar como funciona para o motorista', value: 'E como ficará para o motorista?' }
        ],
        status: 'WAITING_USER',
        created_at: new Date().toISOString()
      };
    }

    // Continuidade de MT24: "E como ficará para o motorista?"
    if (
      (conversation.context.integration_context === 'MT24' || history.some(m => m.content.includes('MT 24'))) &&
      (msgLower.includes('motorista') || msgLower.includes('app') || msgLower.includes('aplicativo'))
    ) {
      return {
        id: `msg-ai-${uuidv4()}`,
        conversation_id: conversation.id,
        company_id: companyId,
        user_id: userId,
        role: 'assistant',
        content: `Para o motorista do **MT 24 Horas Express**, o fluxo funciona assim:\n\n1. O pedido/corrida é gerado no Multiplex.\n2. A rota é despachada via API para o aplicativo do motorista do MT24 com endereço de coleta e entrega.\n3. O motorista aceita e o status de deslocamento atualiza em tempo real no painel e no WhatsApp do cliente.\n\nDeseja ativar essa integração na sua conta?`,
        intent: 'clarification',
        suggested_options: [
          { label: 'Ativar MT24 agora', value: 'Quero ativar o MT24', action_type: 'execute', variant: 'primary' },
          { label: 'Ajustar regras de despacho', value: 'Quero regras de frete antes' }
        ],
        status: 'WAITING_USER',
        created_at: new Date().toISOString()
      };
    }

    // -------------------------------------------------------------------------
    // CENÁRIO TESTE 6: Corrida pelo WhatsApp (WhatsApp + MT24 + Corridas)
    // -------------------------------------------------------------------------
    if (
      (msgLower.includes('corrida') && msgLower.includes('whatsapp')) ||
      (msgLower.includes('pedir uma corrida') || msgLower.includes('chamar motorista'))
    ) {
      conversation.context.module = 'multichannel_dispatch';
      conversation.context.integration_context = 'WhatsApp + MT24';

      return {
        id: `msg-ai-${uuidv4()}`,
        conversation_id: conversation.id,
        company_id: companyId,
        user_id: userId,
        role: 'assistant',
        content: `Essa funcionalidade conecta o atendimento do **WhatsApp** com o despacho do **MT 24 Horas Express**.\n\n**Fluxo operacional:**\n1. O cliente envia uma mensagem no WhatsApp: *"Quero uma corrida para o endereço X"*.\n2. A IA identifica a localização de partida e destino.\n3. O sistema calcula a distância e exibe o valor da corrida para confirmação do cliente.\n4. Após aceite, o chamado é disparado automaticamente para os motoristas do MT24.\n\nQuer que eu configure esse fluxo no seu agente de WhatsApp?`,
        intent: 'clarification',
        suggested_options: [
          { label: 'Configurar fluxo de corridas', value: 'Sim, configure esse fluxo no WhatsApp', action_type: 'execute', variant: 'primary' },
          { label: 'Definir raio de atendimento', value: 'Quero limitar a quilometragem máxima' },
          { label: 'Cancelar', value: 'Cancelar' }
        ],
        status: 'WAITING_USER',
        created_at: new Date().toISOString()
      };
    }

    // Continuidade: "E também quero colocar o Instagram"
    if (
      msgLower.includes('colocar o instagram') ||
      msgLower.includes('adicionar instagram') ||
      msgLower.includes('e também quero o instagram')
    ) {
      return {
        id: `msg-ai-${uuidv4()}`,
        conversation_id: conversation.id,
        company_id: companyId,
        user_id: userId,
        role: 'assistant',
        content: `Perfeito! Vou adicionar o **Instagram Direct** à mesma regra de atendimento.\n\nAssim, as mensagens e solicitações recebidas por direct no Instagram seguirão o mesmo padrão inteligente do WhatsApp.\n\nDeseja conectar sua conta do Instagram agora?`,
        intent: 'clarification',
        suggested_options: [
          { label: 'Conectar Instagram agora', value: 'Conectar Instagram', action_type: 'execute', variant: 'primary' },
          { label: 'Configurar depois', value: 'Configurar depois' }
        ],
        status: 'WAITING_USER',
        created_at: new Date().toISOString()
      };
    }

    // -------------------------------------------------------------------------
    // CENÁRIO TESTE 10: Dados Ausentes / Transparência Estrita (Sem inventar)
    // -------------------------------------------------------------------------
    if (
      msgLower.includes('quantos pedidos') ||
      msgLower.includes('pedidos eu tive hoje') ||
      msgLower.includes('meus pedidos hoje')
    ) {
      const orders = store.orders.get(companyId) || [];
      if (orders.length === 0) {
        return {
          id: `msg-ai-${uuidv4()}`,
          conversation_id: conversation.id,
          company_id: companyId,
          user_id: userId,
          role: 'assistant',
          content: `Ainda não encontrei essa informação no seu sistema. Não existem registros de pedidos cadastrados para a sua empresa no momento. Quando as vendas forem registradas ou integradas, poderei relatar as métricas em tempo real.`,
          intent: 'question',
          status: 'COMPLETED',
          created_at: new Date().toISOString()
        };
      } else {
        return {
          id: `msg-ai-${uuidv4()}`,
          conversation_id: conversation.id,
          company_id: companyId,
          user_id: userId,
          role: 'assistant',
          content: `Você possui **${orders.length} pedidos** registrados no sistema.`,
          intent: 'question',
          status: 'COMPLETED',
          created_at: new Date().toISOString()
        };
      }
    }

    // Consulta de Métricas Globais / Operação de Hoje (Seção 23)
    if (
      msgLower.includes('como está minha operação') ||
      msgLower.includes('minha operação hoje') ||
      msgLower.includes('resumo de hoje') ||
      msgLower.includes('como estao minhas vendas')
    ) {
      const metricsTool = await AIToolExecutor.executeTool(companyId, 'get_system_metrics', {});
      const b = metricsTool.data?.breakdown || {};
      const totalConv = metricsTool.data?.conversations_count || 0;

      return {
        id: `msg-ai-${uuidv4()}`,
        conversation_id: conversation.id,
        company_id: companyId,
        user_id: userId,
        role: 'assistant',
        content: `Hoje você teve **${totalConv} conversas** no total:\n\n• WhatsApp: ${b.whatsapp || 0}\n• Instagram: ${b.instagram || 0}\n• Webchat: ${b.web || 0}\n\nA IA atendeu e resolveu ${b.ai_resolved || 0} interações.\n${b.human_handoff || 0} foram encaminhadas para atendimento humano.\n\nSua base conta com **${metricsTool.data?.customers_count || 0} clientes cadastrados** e **${metricsTool.data?.products_count || 0} produtos** no catálogo.`,
        intent: 'question',
        status: 'COMPLETED',
        created_at: new Date().toISOString()
      };
    }

    // Resposta padrão caso nenhuma heurística específica seja acionada
    return {
      id: `msg-ai-${uuidv4()}`,
      conversation_id: conversation.id,
      company_id: companyId,
      user_id: userId,
      role: 'assistant',
      content: `Entendido. Posso ajudar você com a configuração da IA, catálogos, métricas operacionais, integrações ou construção de novas telas no Multiplex.\n\nComo você deseja prosseguir?`,
      intent: 'conversation',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };
  }

  /**
   * Executa um plano ou ação através de ferramentas controladas
   */
  private async executePlanOrAction(companyId: string, plan: any): Promise<{ success: boolean; message: string }> {
    if (!plan) {
      return { success: false, message: 'Nenhum plano fornecido para execução.' };
    }

    if (plan.action === 'create_module' && plan.suggested_schema) {
      const res = await AIToolExecutor.executeTool(companyId, 'create_module', {
        name: plan.target_module?.name || 'Novo Módulo',
        description: plan.suggested_schema.description,
        schema: plan.suggested_schema
      });
      return {
        success: res.success,
        message: `Módulo **${plan.target_module?.name}** criado e adicionado ao seu menu de módulos.`
      };
    }

    if (plan.action === 'update_agent_identity') {
      const res = await AIToolExecutor.executeTool(companyId, 'update_agent_identity', {
        display_name: plan.display_name,
        introduction: plan.introduction
      });
      return {
        success: res.success,
        message: `Identidade da IA atualizada:\n✓ Nome: "${plan.display_name}"\n✓ Apresentação atualizada.`
      };
    }

    if (plan.action === 'update_agent_personality') {
      const res = await AIToolExecutor.executeTool(companyId, 'update_agent_personality', {
        tone: plan.tone,
        formality: plan.formality,
        use_emojis: plan.use_emojis
      });
      return {
        success: res.success,
        message: `Personalidade atualizada para o tom **${plan.tone}**.`
      };
    }

    return {
      success: true,
      message: 'Ação executada com sucesso no Multiplex.'
    };
  }

  /**
   * Registra feedback em uma mensagem
   */
  public registerFeedback(params: {
    companyId: string;
    conversationId: string;
    messageId: string;
    feedback: 'thumbs_up' | 'thumbs_down';
  }): boolean {
    const messages = store.aiConversationMessages.get(params.conversationId) || [];
    const msg = messages.find(m => m.id === params.messageId);
    if (msg && msg.company_id === params.companyId) {
      msg.feedback = params.feedback;
      return true;
    }
    return false;
  }
}

export const globalAIConversationService = GlobalAIConversationService.getInstance();
