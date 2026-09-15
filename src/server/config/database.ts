import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { 
  Company, Agent, AgentPersonality, AgentRule, Product, ProductCategory,
  Customer, Conversation, Message, StructuredKnowledgeItem, Order,
  AgentMemoryItem, KnowledgeSource, SourceSyncRun, SourceSyncChange, NormalizedCatalogItem,
  AIBuilderModule, AIBuilderModuleVersion, Expense, UISchema,
  SearchSession, CatalogConsultantSettings, CatalogSearchLog, CatalogClickLog,
  AgentIdentity, AgentIdentityAudit,
  AIConversation, AIConversationMessage
} from '../types/index';

dotenv.config();

const FORBIDDEN_DB = 'nptkxlrhrlssdsevpgqe';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

// Validação de segurança estrita contra a regra global
if (supabaseUrl.includes(FORBIDDEN_DB) || supabaseKey.includes(FORBIDDEN_DB)) {
  throw new Error(`VIOLAÇÃO DE SEGURANÇA: Tentativa de conexão ao banco proibido ${FORBIDDEN_DB}`);
}

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project'))
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// =========================================================================
// IN-MEMORY MULTI-TENANT REPOSITORY (Limpo e pronto para o usuário começar)
// =========================================================================
export class InMemoryStore {
  private static instance: InMemoryStore;

  public companies: Map<string, Company> = new Map();
  public agents: Map<string, Agent> = new Map();
  public agentPersonalities: Map<string, AgentPersonality> = new Map();
  public agentRules: Map<string, AgentRule[]> = new Map(); // key = agent_id
  public products: Map<string, Product[]> = new Map(); // key = company_id
  public categories: Map<string, ProductCategory[]> = new Map(); // key = company_id
  public customers: Map<string, Customer[]> = new Map(); // key = company_id
  public conversations: Map<string, Conversation> = new Map(); // key = conversation_id
  public messages: Map<string, Message[]> = new Map(); // key = conversation_id
  public knowledgeItems: Map<string, StructuredKnowledgeItem[]> = new Map(); // key = company_id
  public orders: Map<string, Order[]> = new Map(); // key = company_id
  public memories: Map<string, AgentMemoryItem[]> = new Map(); // key = customer_id
  public webhookEvents: Set<string> = new Set(); // companyId:channel:externalMessageId
  public sources: Map<string, KnowledgeSource> = new Map(); // key = source_id
  public syncRuns: Map<string, SourceSyncRun> = new Map(); // key = run_id
  public syncChanges: Map<string, SourceSyncChange> = new Map(); // key = change_id
  public catalogItems: Map<string, NormalizedCatalogItem> = new Map(); // key = item_id

  // AI App Builder Collections
  public builderModules: Map<string, AIBuilderModule> = new Map(); // key = module_id
  public builderModuleVersions: Map<string, AIBuilderModuleVersion[]> = new Map(); // key = module_id
  public builderActions: any[] = [];
  public expenses: Map<string, Expense[]> = new Map(); // key = company_id

  // AI Catalog Consultant Collections
  public searchSessions: Map<string, SearchSession> = new Map(); // key = conversation_id
  public catalogSettings: Map<string, CatalogConsultantSettings> = new Map(); // key = company_id
  public catalogSearches: CatalogSearchLog[] = [];
  public catalogClicks: CatalogClickLog[] = [];

  // Agent Identity & Audits
  public agentIdentities: Map<string, AgentIdentity> = new Map(); // key = company_id
  public agentIdentityAudits: AgentIdentityAudit[] = [];

  // Global AI Conversation Layer (Admin Multiplex)
  public aiConversations: Map<string, AIConversation> = new Map(); // key = conversation_id
  public aiConversationMessages: Map<string, AIConversationMessage[]> = new Map(); // key = conversation_id

  private constructor() {
    this.seedCleanWorkspace();
  }

  public static getInstance(): InMemoryStore {
    if (!InMemoryStore.instance) {
      InMemoryStore.instance = new InMemoryStore();
    }
    return InMemoryStore.instance;
  }

  public reset() {
    this.resetAll();
  }

  public resetAll() {
    this.companies.clear();
    this.agents.clear();
    this.agentPersonalities.clear();
    this.agentRules.clear();
    this.products.clear();
    this.categories.clear();
    this.customers.clear();
    this.conversations.clear();
    this.messages.clear();
    this.knowledgeItems.clear();
    this.orders.clear();
    this.memories.clear();
    this.webhookEvents.clear();
    this.sources.clear();
    this.syncRuns.clear();
    this.syncChanges.clear();
    this.catalogItems.clear();
    this.builderModules.clear();
    this.builderModuleVersions.clear();
    this.builderActions = [];
    this.expenses.clear();
    this.searchSessions.clear();
    this.catalogSettings.clear();
    this.catalogSearches = [];
    this.catalogClicks = [];
    this.agentIdentities.clear();
    this.agentIdentityAudits = [];
    this.aiConversations.clear();
    this.aiConversationMessages.clear();
    this.seedCleanWorkspace();
  }

  private seedCleanWorkspace() {
    const companyId = '11111111-1111-1111-1111-111111111111';
    const agentId = '22222222-2222-2222-2222-222222222222';

    // 1. Empresa limpa pronta para o usuário
    this.companies.set(companyId, {
      id: companyId,
      name: 'Minha Empresa',
      slug: 'minha-empresa',
      phone: '',
      email: '',
      plan: 'pro',
      active: true,
      created_at: new Date().toISOString()
    });

    // 2. Agente limpo pronto para aprender
    this.agents.set(agentId, {
      id: agentId,
      company_id: companyId,
      name: 'Multiplex',
      description: 'Atendente virtual Multiplex pronto para ser treinado',
      system_prompt: 'Você é o atendente virtual Multiplex da empresa. Responda com base no conhecimento e regras cadastradas.',
      language: 'pt-BR',
      active: true,
      auto_reply: true,
      human_handoff_enabled: true,
      model: 'gpt-4o-mini',
      temperature: 0.3
    });

    // 3. Personalidade padrão
    this.agentPersonalities.set(agentId, {
      agent_id: agentId,
      company_id: companyId,
      tone: 'friendly',
      formality: 'informal',
      use_emojis: true,
      response_length: 'concise',
      commercial_style: 'consultative',
      custom_instructions: 'Chame o cliente pelo nome quando souber.'
    });

    // 4. Regras e listas reais (ZERO dados fake)
    this.agentRules.set(agentId, []);
    this.categories.set(companyId, []);
    this.products.set(companyId, []);
    this.knowledgeItems.set(companyId, []);
    this.customers.set(companyId, []);
    this.orders.set(companyId, []);
    this.expenses.set(companyId, []);

    // 4.1. Configurações Padrão do Consultor Inteligente de Catálogo
    this.catalogSettings.set(companyId, {
      company_id: companyId,
      max_results: 3,
      send_images: true,
      send_prices: true,
      send_descriptions: true,
      send_links: true,
      show_stock: true,
      ask_before_search: true,
      presentation_style: 'cards',
      default_sort: 'relevance',
      custom_consultant_rules: 'Aja como um vendedor e consultor especialista. Faça perguntas esclarecedoras pertinentes antes de despejar produtos. Apresente os itens com foto, preço real, detalhes e o link oficial verificado.'
    });

    // 4.2. Identidade Oficial da IA
    this.agentIdentities.set(companyId, {
      id: 'id-default',
      company_id: companyId,
      agent_id: agentId,
      display_name: 'Multiplex',
      company_name: 'Minha Empresa',
      introduction: 'Olá! Eu sou o assistente virtual da Minha Empresa. Como posso ajudar você hoje?',
      role_description: 'Atendimento inteligente ao cliente, suporte e informações.',
      auto_introduce: true,
      tone: 'friendly',
      communication_style: 'consultative',
      emoji_usage: 'never',
      language: 'pt-BR',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
}

export const store = InMemoryStore.getInstance();
export const db = store;


