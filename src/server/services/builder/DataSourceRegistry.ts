import { store } from '../../config/database';

export interface RegisteredDataSource {
  id: string;
  name: string;
  displayName: string;
  category: 'core_ai' | 'omnichannel' | 'catalog' | 'commercial';
  description: string;
  fields: Array<{ key: string; label: string; type: 'string' | 'number' | 'date' | 'boolean' }>;
  supportedMetrics: Array<'count' | 'sum' | 'avg' | 'min' | 'max'>;
  requiresIntegration?: boolean;
}

export class DataSourceRegistry {
  private static readonly DATA_SOURCES: Record<string, RegisteredDataSource> = {
    conversations: {
      id: 'conversations',
      name: 'conversations',
      displayName: 'Conversas e Atendimentos',
      category: 'core_ai',
      description: 'Sessões de atendimento e conversas com clientes nos canais.',
      fields: [
        { key: 'id', label: 'ID da Conversa', type: 'string' },
        { key: 'customer_id', label: 'ID do Cliente', type: 'string' },
        { key: 'channel_type', label: 'Canal', type: 'string' },
        { key: 'status', label: 'Status do Atendimento', type: 'string' },
        { key: 'created_at', label: 'Início', type: 'date' },
        { key: 'updated_at', label: 'Última Atividade', type: 'date' }
      ],
      supportedMetrics: ['count']
    },
    customers: {
      id: 'customers',
      name: 'customers',
      displayName: 'Clientes e Contatos',
      category: 'omnichannel',
      description: 'Base de contatos e clientes atendidos pela IA nos canais.',
      fields: [
        { key: 'id', label: 'ID do Cliente', type: 'string' },
        { key: 'name', label: 'Nome', type: 'string' },
        { key: 'phone', label: 'Telefone / WhatsApp', type: 'string' },
        { key: 'email', label: 'E-mail', type: 'string' },
        { key: 'total_orders', label: 'Total de Pedidos', type: 'number' },
        { key: 'created_at', label: 'Data de Cadastro', type: 'date' }
      ],
      supportedMetrics: ['count', 'sum', 'avg']
    },
    messages: {
      id: 'messages',
      name: 'messages',
      displayName: 'Mensagens Trocadas',
      category: 'core_ai',
      description: 'Histórico de mensagens enviadas e recebidas pela IA e operadores.',
      fields: [
        { key: 'id', label: 'ID da Mensagem', type: 'string' },
        { key: 'conversation_id', label: 'ID da Conversa', type: 'string' },
        { key: 'sender', label: 'Remetente (customer/agent/human)', type: 'string' },
        { key: 'content', label: 'Conteúdo', type: 'string' },
        { key: 'created_at', label: 'Data e Hora', type: 'date' }
      ],
      supportedMetrics: ['count']
    },
    knowledge_base: {
      id: 'knowledge_base',
      name: 'knowledge_base',
      displayName: 'Base de Conhecimento e RAG',
      category: 'core_ai',
      description: 'Artigos, documentos e regras indexadas para a inteligência da IA.',
      fields: [
        { key: 'id', label: 'ID do Item', type: 'string' },
        { key: 'title', label: 'Título', type: 'string' },
        { key: 'category', label: 'Categoria', type: 'string' },
        { key: 'source_type', label: 'Tipo de Origem', type: 'string' },
        { key: 'created_at', label: 'Data', type: 'date' }
      ],
      supportedMetrics: ['count']
    },
    catalog_items: {
      id: 'catalog_items',
      name: 'catalog_items',
      displayName: 'Catálogo de Produtos, Imóveis e Serviços',
      category: 'catalog',
      description: 'Itens reais sincronizados do site ou cadastrados no catálogo oficial.',
      fields: [
        { key: 'id', label: 'ID do Item', type: 'string' },
        { key: 'name', label: 'Nome / Título', type: 'string' },
        { key: 'price', label: 'Preço Oficial', type: 'number' },
        { key: 'category', label: 'Categoria', type: 'string' },
        { key: 'entity_type', label: 'Tipo (produto/imóvel/serviço)', type: 'string' },
        { key: 'available', label: 'Disponibilidade', type: 'boolean' },
        { key: 'source_url', label: 'Link Oficial', type: 'string' }
      ],
      supportedMetrics: ['count', 'avg', 'min', 'max']
    },
    channels: {
      id: 'channels',
      name: 'channels',
      displayName: 'Canais de Atendimento Conectados',
      category: 'omnichannel',
      description: 'Status e conexões de WhatsApp, Instagram Direct, Web Chat e Telegram.',
      fields: [
        { key: 'type', label: 'Tipo do Canal', type: 'string' },
        { key: 'name', label: 'Nome', type: 'string' },
        { key: 'connected', label: 'Conectado (true/false)', type: 'boolean' }
      ],
      supportedMetrics: ['count']
    },
    human_handoffs: {
      id: 'human_handoffs',
      name: 'human_handoffs',
      displayName: 'Transbordos para Atendimento Humano',
      category: 'core_ai',
      description: 'Conversas em que a IA transferiu para operador humano.',
      fields: [
        { key: 'conversation_id', label: 'ID da Conversa', type: 'string' },
        { key: 'reason', label: 'Motivo do Transbordo', type: 'string' },
        { key: 'created_at', label: 'Data/Hora', type: 'date' }
      ],
      supportedMetrics: ['count']
    },
    orders: {
      id: 'orders',
      name: 'orders',
      displayName: 'Pedidos Comerciais (Integração)',
      category: 'commercial',
      description: 'Pedidos gerados por integrações de e-commerce, delivery ou vendas.',
      fields: [
        { key: 'id', label: 'ID do Pedido', type: 'string' },
        { key: 'customer_id', label: 'ID do Cliente', type: 'string' },
        { key: 'total_amount', label: 'Valor Total', type: 'number' },
        { key: 'status', label: 'Status', type: 'string' },
        { key: 'payment_method', label: 'Forma de Pagamento', type: 'string' },
        { key: 'created_at', label: 'Data', type: 'date' }
      ],
      supportedMetrics: ['count', 'sum', 'avg'],
      requiresIntegration: true
    }
  };

  public static listDataSources(): RegisteredDataSource[] {
    return Object.values(this.DATA_SOURCES);
  }

  public static getDataSource(id: string): RegisteredDataSource | undefined {
    return this.DATA_SOURCES[id.toLowerCase()];
  }

  public static validateDataSource(sourceId: string, companyId: string): {
    valid: boolean;
    hasData: boolean;
    count: number;
    reason?: string;
  } {
    const ds = this.getDataSource(sourceId);
    if (!ds) {
      return {
        valid: false,
        hasData: false,
        count: 0,
        reason: `Essa métrica ou fonte "${sourceId}" ainda não possui uma fonte de dados configurada no sistema.`
      };
    }

    // Verifica contagem real no tenant
    let count = 0;
    if (sourceId === 'conversations') {
      count = Array.from(store.conversations.values()).filter(c => c.company_id === companyId).length;
    } else if (sourceId === 'customers') {
      count = (store.customers.get(companyId) || []).length;
    } else if (sourceId === 'messages') {
      for (const [convId, msgs] of store.messages.entries()) {
        const conv = store.conversations.get(convId);
        if (conv && conv.company_id === companyId) count += msgs.length;
      }
    } else if (sourceId === 'catalog_items') {
      const items = Array.from(store.catalogItems.values()).filter(i => i.company_id === companyId);
      const prods = store.products.get(companyId) || [];
      count = items.length + prods.length;
    } else if (sourceId === 'orders') {
      count = (store.orders.get(companyId) || []).length;
    }

    return {
      valid: true,
      hasData: count > 0,
      count
    };
  }

  public static validatePlanSources(sources: string[], companyId: string): {
    valid: boolean;
    invalidSources: string[];
    reasons: string[];
  } {
    const invalidSources: string[] = [];
    const reasons: string[] = [];

    for (const src of sources) {
      const check = this.validateDataSource(src, companyId);
      if (!check.valid) {
        invalidSources.push(src);
        reasons.push(check.reason || `Fonte ${src} não reconhecida.`);
      }
    }

    return {
      valid: invalidSources.length === 0,
      invalidSources,
      reasons
    };
  }
}
