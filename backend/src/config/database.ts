import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { 
  Company, Agent, AgentPersonality, AgentRule, Product, ProductCategory,
  Customer, Conversation, Message, StructuredKnowledgeItem, Order,
  AgentMemoryItem, KnowledgeSource, SourceSyncRun, SourceSyncChange, NormalizedCatalogItem
} from '../types/index.js';

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

  private constructor() {
    this.seedCleanWorkspace();
  }

  public static getInstance(): InMemoryStore {
    if (!InMemoryStore.instance) {
      InMemoryStore.instance = new InMemoryStore();
    }
    return InMemoryStore.instance;
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

    // 4. Listas totalmente vazias
    this.agentRules.set(agentId, []);
    this.categories.set(companyId, []);
    this.products.set(companyId, []);
    this.knowledgeItems.set(companyId, []);
    this.customers.set(companyId, []);
    this.orders.set(companyId, []);
  }
}

export const store = InMemoryStore.getInstance();
export const db = store;

