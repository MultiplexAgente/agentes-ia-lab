import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { 
  Company, Agent, AgentPersonality, AgentRule, Product, ProductCategory,
  Customer, Conversation, Message, StructuredKnowledgeItem, Order,
  AgentMemoryItem, KnowledgeSource, SourceSyncRun, SourceSyncChange, NormalizedCatalogItem,
  AIBuilderModule, AIBuilderModuleVersion, Expense, UISchema
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

  // AI App Builder Collections
  public builderModules: Map<string, AIBuilderModule> = new Map(); // key = module_id
  public builderModuleVersions: Map<string, AIBuilderModuleVersion[]> = new Map(); // key = module_id
  public builderActions: any[] = [];
  public expenses: Map<string, Expense[]> = new Map(); // key = company_id

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
    this.builderModules.clear();
    this.builderModuleVersions.clear();
    this.builderActions = [];
    this.expenses.clear();
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

    // 4. Regras e listas
    this.agentRules.set(agentId, []);
    this.categories.set(companyId, []);
    this.products.set(companyId, []);
    this.knowledgeItems.set(companyId, []);

    // 5. Clientes Reais da Empresa
    const customersList: Customer[] = [
      { id: 'c-01', company_id: companyId, name: 'Carlos Eduardo Silva', phone: '+55 11 98822-1100', email: 'carlos.silva@gmail.com', total_orders: 8, created_at: '2026-08-10T14:20:00Z' },
      { id: 'c-02', company_id: companyId, name: 'Mariana Souza Dias', phone: '+55 11 97711-2233', email: 'mariana.souza@outlook.com', total_orders: 5, created_at: '2026-08-14T18:30:00Z' },
      { id: 'c-03', company_id: companyId, name: 'Roberto Ferreira Neto', phone: '+55 21 99123-4567', email: 'roberto.neto@empresa.com', total_orders: 3, created_at: '2026-08-20T11:15:00Z' },
      { id: 'c-04', company_id: companyId, name: 'Fernanda Rocha Lima', phone: '+55 11 98111-9988', email: 'fernanda.lima@uol.com.br', total_orders: 11, created_at: '2026-08-25T09:40:00Z' },
      { id: 'c-05', company_id: companyId, name: 'Lucas Andrade Ramos', phone: '+55 41 99222-3344', email: 'lucas.andrade@gmail.com', total_orders: 4, created_at: '2026-09-01T16:00:00Z' },
      { id: 'c-06', company_id: companyId, name: 'Beatriz Martins Alencar', phone: '+55 11 99555-7788', email: 'beatriz.martins@hotmail.com', total_orders: 6, created_at: '2026-09-03T12:10:00Z' }
    ];
    this.customers.set(companyId, customersList);

    // 6. Pedidos Reais da Empresa
    const ordersList: Order[] = [
      { id: 'ped-101', company_id: companyId, customer_id: 'c-01', status: 'delivered', payment_status: 'paid', total_amount: 148.50, payment_method: 'PIX', delivery_address: 'Av. Paulista, 1000 - Bela Vista', created_at: '2026-09-01T19:30:00Z', updated_at: '2026-09-01T20:15:00Z' },
      { id: 'ped-102', company_id: companyId, customer_id: 'c-02', status: 'delivered', payment_status: 'paid', total_amount: 92.00, payment_method: 'Cartão de Crédito', delivery_address: 'Rua Augusta, 450 - Consolação', created_at: '2026-09-02T20:10:00Z', updated_at: '2026-09-02T20:50:00Z' },
      { id: 'ped-103', company_id: companyId, customer_id: 'c-04', status: 'delivered', payment_status: 'paid', total_amount: 215.00, payment_method: 'PIX', delivery_address: 'Rua Oscar Freire, 800 - Jardins', created_at: '2026-09-03T21:00:00Z', updated_at: '2026-09-03T21:45:00Z' },
      { id: 'ped-104', company_id: companyId, customer_id: 'c-03', status: 'delivered', payment_status: 'paid', total_amount: 118.00, payment_method: 'PIX', delivery_address: 'Alameda Santos, 200 - Paraíso', created_at: '2026-09-04T19:15:00Z', updated_at: '2026-09-04T20:00:00Z' },
      { id: 'ped-105', company_id: companyId, customer_id: 'c-05', status: 'delivered', payment_status: 'paid', total_amount: 86.50, payment_method: 'Cartão de Débito', delivery_address: 'Rua Bela Cintra, 120 - Consolação', created_at: '2026-09-05T12:30:00Z', updated_at: '2026-09-05T13:10:00Z' },
      { id: 'ped-106', company_id: companyId, customer_id: 'c-06', status: 'delivered', payment_status: 'paid', total_amount: 164.00, payment_method: 'PIX', delivery_address: 'Rua da Consolação, 2500 - Cerqueira César', created_at: '2026-09-05T20:45:00Z', updated_at: '2026-09-05T21:30:00Z' },
      { id: 'ped-107', company_id: companyId, customer_id: 'c-01', status: 'delivered', payment_status: 'paid', total_amount: 135.00, payment_method: 'Cartão de Crédito', delivery_address: 'Av. Paulista, 1000 - Bela Vista', created_at: '2026-09-06T19:50:00Z', updated_at: '2026-09-06T20:30:00Z' },
      { id: 'ped-108', company_id: companyId, customer_id: 'c-04', status: 'delivered', payment_status: 'paid', total_amount: 189.00, payment_method: 'PIX', delivery_address: 'Rua Oscar Freire, 800 - Jardins', created_at: '2026-09-06T21:10:00Z', updated_at: '2026-09-06T21:55:00Z' },
      { id: 'ped-109', company_id: companyId, customer_id: 'c-02', status: 'confirmed', payment_status: 'paid', total_amount: 124.00, payment_method: 'PIX', delivery_address: 'Rua Augusta, 450 - Consolação', created_at: '2026-09-07T14:15:00Z', updated_at: '2026-09-07T14:40:00Z' },
      { id: 'ped-110', company_id: companyId, customer_id: 'c-05', status: 'pending', payment_status: 'pending', total_amount: 78.00, payment_method: 'Aguardando PIX', delivery_address: 'Rua Bela Cintra, 120', created_at: '2026-09-07T16:00:00Z', updated_at: '2026-09-07T16:00:00Z' }
    ];
    this.orders.set(companyId, ordersList);

    // 7. Despesas Operacionais Reais
    const expensesList: Expense[] = [
      { id: 'exp-01', company_id: companyId, title: 'Aluguel Comercial do Ponto', category: 'Instalações', amount: 2400.00, status: 'paid', due_date: '2026-09-05', paid_at: '2026-09-05T10:00:00Z', created_at: '2026-09-01T08:00:00Z' },
      { id: 'exp-02', company_id: companyId, title: 'Insumos e Matéria-Prima de Cozinha', category: 'Insumos', amount: 1650.00, status: 'paid', due_date: '2026-09-04', paid_at: '2026-09-04T15:30:00Z', created_at: '2026-09-02T09:00:00Z' },
      { id: 'exp-03', company_id: companyId, title: 'Software de Atendimento e IA (Multiplex)', category: 'Tecnologia', amount: 299.00, status: 'paid', due_date: '2026-09-07', paid_at: '2026-09-07T11:00:00Z', created_at: '2026-09-03T10:00:00Z' },
      { id: 'exp-04', company_id: companyId, title: 'Energia Elétrica & Gás Industrial', category: 'Utilidades', amount: 480.00, status: 'paid', due_date: '2026-09-06', paid_at: '2026-09-06T14:00:00Z', created_at: '2026-09-04T08:00:00Z' },
      { id: 'exp-05', company_id: companyId, title: 'Embalagens Térmicas para Delivery', category: 'Logística', amount: 350.00, status: 'paid', due_date: '2026-09-03', paid_at: '2026-09-03T16:00:00Z', created_at: '2026-09-01T12:00:00Z' }
    ];
    this.expenses.set(companyId, expensesList);

    // 8. MÓDULO PADRÃO INICIAL: GESTÃO FINANCEIRA
    const defaultFinanceId = 'mod-gestao-financeira';
    const defaultFinanceSchema: UISchema = {
      title: 'Gestão Financeira',
      description: 'Acompanhamento consolidado de faturamento, despesas operacionais, lucro e pedidos pagos.',
      icon: 'DollarSign',
      layout: 'dashboard',
      period_filter_enabled: true,
      sections: [
        {
          id: 'sec-metrics',
          title: 'Indicadores Principais',
          columns: 4,
          components: [
            {
              id: 'm-01',
              type: 'metric',
              title: 'Faturamento Total',
              description: 'Total recebido de pedidos',
              dataSource: 'payments',
              aggregation: 'sum',
              format: 'currency'
            },
            {
              id: 'm-02',
              type: 'metric',
              title: 'Despesas Operacionais',
              description: 'Custos lançados da empresa',
              dataSource: 'expenses',
              aggregation: 'sum',
              format: 'currency'
            },
            {
              id: 'm-03',
              type: 'metric',
              title: 'Lucro Líquido',
              description: 'Receita líquida deduzida das despesas',
              dataSource: 'payments',
              aggregation: 'sum',
              format: 'currency'
            },
            {
              id: 'm-04',
              type: 'metric',
              title: 'Pedidos Pagos',
              description: 'Volume de vendas concluídas',
              dataSource: 'orders',
              aggregation: 'count',
              format: 'number'
            }
          ]
        },
        {
          id: 'sec-charts',
          title: 'Desempenho Financeiro e Canais',
          columns: 2,
          components: [
            {
              id: 'ch-01',
              type: 'chart',
              title: 'Faturamento x Despesas',
              description: 'Evolução comparativa por período',
              chartType: 'line',
              dataSource: 'payments'
            },
            {
              id: 'ch-02',
              type: 'chart',
              title: 'Distribuição por Método de Pagamento',
              description: 'PIX, Cartão e Dinheiro',
              chartType: 'donut',
              dataSource: 'payments'
            }
          ]
        },
        {
          id: 'sec-table',
          title: 'Transações e Pedidos Pagos',
          columns: 1,
          components: [
            {
              id: 'tb-01',
              type: 'table',
              title: 'Extrato de Pedidos Concluídos',
              dataSource: 'orders',
              columns: [
                { key: 'id', label: 'Cód. Pedido' },
                { key: 'customer_name', label: 'Cliente' },
                { key: 'total_amount', label: 'Valor' },
                { key: 'payment_method', label: 'Método' },
                { key: 'status', label: 'Status' },
                { key: 'date', label: 'Data & Hora' }
              ]
            }
          ]
        }
      ]
    };

    const defaultFinanceModule: AIBuilderModule = {
      id: defaultFinanceId,
      company_id: companyId,
      name: 'Gestão Financeira',
      slug: 'gestao-financeira',
      description: 'Dashboard financeiro com faturamento, despesas, lucro e pedidos pagos.',
      icon: 'DollarSign',
      status: 'active',
      schema: defaultFinanceSchema,
      version: 1,
      created_by: 'Multiplex IA',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.builderModules.set(defaultFinanceId, defaultFinanceModule);
    this.builderModuleVersions.set(defaultFinanceId, [
      {
        id: 'ver-default-01',
        module_id: defaultFinanceId,
        version: 1,
        schema: defaultFinanceSchema,
        prompt: 'Crie uma área financeira detalhada com faturamento, despesas, lucro e gráficos.',
        created_by: 'Multiplex IA',
        created_at: new Date().toISOString()
      }
    ]);
  }
}

export const store = InMemoryStore.getInstance();
export const db = store;


