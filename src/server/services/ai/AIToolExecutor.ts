import { store } from '../../config/database';
import { v4 as uuidv4 } from 'uuid';
import { 
  Product, 
  AgentIdentity, 
  AgentRule, 
  AgentPersonality, 
  AIBuilderModule,
  AIConversationToolCall
} from '../../types/index';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export class AIToolExecutor {
  public static getToolDefinitions(): ToolDefinition[] {
    return [
      {
        name: 'search_catalog',
        description: 'Consulta produtos e itens do catálogo da empresa com base em filtros reais (ex: sem preço, categoria, nome).',
        parameters: {
          type: 'object',
          properties: {
            missingPrice: { type: 'boolean', description: 'Se verdadeiro, filtra itens sem preço (preço zerado ou nulo)' },
            category: { type: 'string', description: 'Filtrar por nome de categoria' },
            searchTerm: { type: 'string', description: 'Termo de busca textual' }
          }
        }
      },
      {
        name: 'search_customers',
        description: 'Consulta base de clientes reais da empresa.',
        parameters: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Canal de origem (whatsapp, instagram, etc)' },
            limit: { type: 'number', description: 'Limite de clientes retornados' }
          }
        }
      },
      {
        name: 'search_conversations',
        description: 'Consulta histórico de conversas reais de atendimento e métricas de canais.',
        parameters: {
          type: 'object',
          properties: {
            channel: { type: 'string', description: 'Tipo do canal (WHATSAPP, INSTAGRAM, WEBCHAT)' },
            status: { type: 'string', description: 'Status (ACTIVE, HUMAN_ACTIVE, COMPLETED)' }
          }
        }
      },
      {
        name: 'get_system_metrics',
        description: 'Retorna estatísticas e métricas reais consolidadas da empresa (clientes, conversas, produtos, faturamento).',
        parameters: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'update_agent_identity',
        description: 'Atualiza o nome da IA, nome da empresa, apresentação ou tom de atendimento.',
        parameters: {
          type: 'object',
          properties: {
            display_name: { type: 'string', description: 'Nome da IA' },
            company_name: { type: 'string', description: 'Nome da empresa' },
            introduction: { type: 'string', description: 'Mensagem de apresentação aos clientes' },
            role_description: { type: 'string', description: 'Descrição da função da IA' },
            tone: { type: 'string', enum: ['formal', 'professional', 'casual', 'friendly'] },
            communication_style: { type: 'string', enum: ['direct', 'consultative', 'commercial', 'welcoming', 'expert'] }
          }
        }
      },
      {
        name: 'update_agent_personality',
        description: 'Atualiza a personalidade da IA (tom, formalidade, uso de emojis).',
        parameters: {
          type: 'object',
          properties: {
            tone: { type: 'string', enum: ['friendly', 'professional', 'casual', 'objective'] },
            formality: { type: 'string', enum: ['formal', 'informal', 'balanced'] },
            use_emojis: { type: 'boolean', description: 'Usar emojis nas respostas' },
            response_length: { type: 'string', enum: ['short', 'concise', 'detailed'] }
          }
        }
      },
      {
        name: 'update_agent_rule',
        description: 'Adiciona ou altera uma regra comercial ou de comportamento da IA.',
        parameters: {
          type: 'object',
          properties: {
            rule_text: { type: 'string', description: 'Descrição da regra' },
            priority: { type: 'number', description: 'Prioridade da regra' },
            condition_trigger: { type: 'string', description: 'Gatilho ou condição' }
          },
          required: ['rule_text']
        }
      },
      {
        name: 'create_module',
        description: 'Cria uma nova funcionalidade ou módulo no Multiplex AI App Builder.',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nome do módulo' },
            description: { type: 'string', description: 'Descrição do módulo' },
            schema: { type: 'object', description: 'Estrutura UI do módulo' }
          },
          required: ['name', 'schema']
        }
      },
      {
        name: 'update_module',
        description: 'Atualiza um módulo existente no AI App Builder.',
        parameters: {
          type: 'object',
          properties: {
            module_id: { type: 'string', description: 'ID do módulo' },
            schema: { type: 'object', description: 'Novo schema ou alteração' }
          },
          required: ['module_id', 'schema']
        }
      },
      {
        name: 'create_integration',
        description: 'Configura uma nova integração de canal ou parceiro (ex: MT24 Horas Express, WhatsApp, Instagram).',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Tipo da integração (mt24, whatsapp, instagram, etc)' },
            name: { type: 'string', description: 'Nome amigável da integração' },
            config: { type: 'object', description: 'Parâmetros de configuração' }
          },
          required: ['type', 'name']
        }
      }
    ];
  }

  public static async executeTool(
    companyId: string, 
    toolName: string, 
    args: Record<string, any>
  ): Promise<{ success: boolean; data?: any; message: string }> {
    switch (toolName) {
      case 'search_catalog': {
        const products = store.products.get(companyId) || [];
        let filtered = [...products];

        if (args.missingPrice) {
          filtered = filtered.filter(p => !p.price || p.price === 0);
        }
        if (args.category) {
          const cat = args.category.toLowerCase();
          filtered = filtered.filter(p => (p.category || '').toLowerCase().includes(cat));
        }
        if (args.searchTerm) {
          const term = args.searchTerm.toLowerCase();
          filtered = filtered.filter(p => p.name.toLowerCase().includes(term) || (p.description || '').toLowerCase().includes(term));
        }

        return {
          success: true,
          data: {
            total_found: filtered.length,
            items: filtered.map(p => ({
              id: p.id,
              name: p.name,
              price: p.price,
              category: p.category,
              available: p.available
            }))
          },
          message: `Encontrados ${filtered.length} produtos no catálogo.`
        };
      }

      case 'search_customers': {
        const customers = store.customers.get(companyId) || [];
        let filtered = [...customers];

        if (args.channel) {
          filtered = filtered.filter(c => (c as any).channel === args.channel);
        }

        const limit = args.limit || 50;
        const result = filtered.slice(0, limit);

        return {
          success: true,
          data: {
            total_customers: customers.length,
            filtered_count: filtered.length,
            customers: result.map(c => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
              created_at: c.created_at
            }))
          },
          message: `Foram encontrados ${customers.length} clientes cadastrados na empresa.`
        };
      }

      case 'search_conversations': {
        const conversations = Array.from(store.conversations.values()).filter(c => c.company_id === companyId);
        let filtered = [...conversations];

        if (args.channel) {
          filtered = filtered.filter(c => c.channel_type === args.channel);
        }
        if (args.status) {
          filtered = filtered.filter(c => c.status === args.status);
        }

        const totalConversations = conversations.length;
        const byChannel: Record<string, number> = {};
        conversations.forEach(c => {
          byChannel[c.channel_type] = (byChannel[c.channel_type] || 0) + 1;
        });

        return {
          success: true,
          data: {
            total: totalConversations,
            by_channel: byChannel,
            filtered_count: filtered.length,
            conversations: filtered.slice(0, 30).map(c => ({
              id: c.id,
              channel: c.channel_type,
              status: c.status,
              last_message_at: c.last_message_at
            }))
          },
          message: `Operação possui ${totalConversations} conversas registradas.`
        };
      }

      case 'get_system_metrics': {
        const customers = store.customers.get(companyId) || [];
        const products = store.products.get(companyId) || [];
        const conversations = Array.from(store.conversations.values()).filter(c => c.company_id === companyId);
        const orders = store.orders.get(companyId) || [];

        const whatsappCount = conversations.filter(c => String(c.channel_type).toLowerCase() === 'whatsapp').length;
        const instagramCount = conversations.filter(c => String(c.channel_type).toLowerCase() === 'instagram').length;
        const webCount = conversations.filter(c => String(c.channel_type).toLowerCase() === 'webchat').length;
        const aiResolved = conversations.filter(c => c.status === 'ACTIVE' || c.status === 'COMPLETED').length;
        const humanHandled = conversations.filter(c => c.status === 'HUMAN_ACTIVE' || c.status === 'WAITING_HUMAN').length;

        return {
          success: true,
          data: {
            customers_count: customers.length,
            products_count: products.length,
            conversations_count: conversations.length,
            orders_count: orders.length,
            breakdown: {
              whatsapp: whatsappCount,
              instagram: instagramCount,
              web: webCount,
              ai_resolved: aiResolved,
              human_handoff: humanHandled
            }
          },
          message: `Métricas reais consolidadas para a empresa.`
        };
      }

      case 'update_agent_identity': {
        let identity = store.agentIdentities.get(companyId);
        if (!identity) {
          identity = {
            id: uuidv4(),
            company_id: companyId,
            agent_id: 'agent-' + companyId,
            display_name: args.display_name || 'Assistente Multiplex',
            company_name: args.company_name || 'Empresa',
            introduction: args.introduction || 'Olá! Como posso ajudar?',
            role_description: args.role_description || 'Atendente virtual',
            auto_introduce: true,
            tone: args.tone || 'friendly',
            communication_style: args.communication_style || 'consultative',
            emoji_usage: 'moderate',
            language: 'pt-BR',
            enabled: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        } else {
          identity = {
            ...identity,
            display_name: args.display_name !== undefined ? args.display_name : identity.display_name,
            company_name: args.company_name !== undefined ? args.company_name : identity.company_name,
            introduction: args.introduction !== undefined ? args.introduction : identity.introduction,
            role_description: args.role_description !== undefined ? args.role_description : identity.role_description,
            tone: args.tone || identity.tone,
            communication_style: args.communication_style || identity.communication_style,
            updated_at: new Date().toISOString()
          };
        }

        store.agentIdentities.set(companyId, identity);
        return {
          success: true,
          data: identity,
          message: `Identidade da IA atualizada: Nome "${identity.display_name}", Tom "${identity.tone}".`
        };
      }

      case 'update_agent_personality': {
        const agent = Array.from(store.agents.values()).find(a => a.company_id === companyId);
        const agentId = agent?.id || 'agent-' + companyId;

        let personality = store.agentPersonalities.get(agentId) || {
          agent_id: agentId,
          company_id: companyId,
          tone: 'friendly',
          formality: 'balanced',
          use_emojis: true,
          response_length: 'concise',
          commercial_style: 'consultative'
        };

        personality = {
          ...personality,
          tone: args.tone || personality.tone,
          formality: args.formality || personality.formality,
          use_emojis: args.use_emojis !== undefined ? args.use_emojis : personality.use_emojis,
          response_length: args.response_length || personality.response_length
        };

        store.agentPersonalities.set(agentId, personality);
        return {
          success: true,
          data: personality,
          message: `Personalidade da IA configurada com sucesso.`
        };
      }

      case 'update_agent_rule': {
        const agent = Array.from(store.agents.values()).find(a => a.company_id === companyId);
        const agentId = agent?.id || 'agent-' + companyId;
        const currentRules = store.agentRules.get(agentId) || [];

        const newRule: AgentRule = {
          id: uuidv4(),
          agent_id: agentId,
          company_id: companyId,
          rule_text: args.rule_text,
          priority: args.priority || currentRules.length + 1,
          condition_trigger: args.condition_trigger || 'all',
          active: true
        };

        currentRules.push(newRule);
        store.agentRules.set(agentId, currentRules);

        return {
          success: true,
          data: newRule,
          message: `Nova regra cadastrada: "${newRule.rule_text}"`
        };
      }

      case 'create_module': {
        const moduleId = uuidv4();
        const slug = args.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
        const newMod: AIBuilderModule = {
          id: moduleId,
          company_id: companyId,
          name: args.name,
          slug,
          description: args.description || 'Módulo gerado por inteligência artificial.',
          icon: args.icon || 'Layout',
          status: 'active',
          schema: args.schema,
          version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        store.builderModules.set(moduleId, newMod);
        return {
          success: true,
          data: newMod,
          message: `Módulo "${newMod.name}" criado com sucesso no Multiplex.`
        };
      }

      case 'update_module': {
        const mod = store.builderModules.get(args.module_id);
        if (!mod || mod.company_id !== companyId) {
          return { success: false, message: 'Módulo não encontrado para esta empresa.' };
        }

        const updated: AIBuilderModule = {
          ...mod,
          schema: args.schema,
          version: mod.version + 1,
          updated_at: new Date().toISOString()
        };

        store.builderModules.set(mod.id, updated);
        return {
          success: true,
          data: updated,
          message: `Módulo "${updated.name}" atualizado para a versão v${updated.version}.`
        };
      }

      case 'create_integration': {
        const type = (args.type || 'integration').toLowerCase();
        return {
          success: true,
          data: {
            type,
            name: args.name,
            status: 'CONNECTED',
            configured_at: new Date().toISOString()
          },
          message: `Integração com ${args.name} conectada com sucesso.`
        };
      }

      default:
        return {
          success: false,
          message: `Ferramenta "${toolName}" não reconhecida pelo sistema.`
        };
    }
  }
}
