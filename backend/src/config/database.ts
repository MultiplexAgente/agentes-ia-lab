import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { 
  Company, Agent, AgentPersonality, AgentRule, Product, ProductCategory,
  Customer, Conversation, Message, StructuredKnowledgeItem, Order,
  AgentMemoryItem
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
// IN-MEMORY MULTI-TENANT REPOSITORY (Garante funcionamento offline/local)
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

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): InMemoryStore {
    if (!InMemoryStore.instance) {
      InMemoryStore.instance = new InMemoryStore();
    }
    return InMemoryStore.instance;
  }

  private seedDemoData() {
    const companyId = '11111111-1111-1111-1111-111111111111';
    const agentId = '22222222-2222-2222-2222-222222222222';
    const customerId = '55555555-5555-5555-5555-555555555555';
    const convId = '66666666-6666-6666-6666-666666666666';

    // 1. Empresa
    this.companies.set(companyId, {
      id: companyId,
      name: 'Hamburgueria Artesanal Anthony',
      slug: 'hamburgueria-anthony',
      phone: '+5511999998888',
      email: 'contato@anthonyburgers.com',
      plan: 'pro',
      active: true,
      created_at: new Date().toISOString()
    });

    // 2. Agente
    this.agents.set(agentId, {
      id: agentId,
      company_id: companyId,
      name: 'AnthonyBot Atendente',
      description: 'Atendente virtual especialista no cardápio e atendimento omnichannel',
      system_prompt: 'Você é o atendente virtual da Hamburgueria Artesanal Anthony. Seja prestativo, ágil e garanta precisão total nos preços e cardápio.',
      language: 'pt-BR',
      active: true,
      auto_reply: true,
      human_handoff_enabled: true,
      model: 'gpt-4o-mini',
      temperature: 0.3
    });

    // 3. Personalidade
    this.agentPersonalities.set(agentId, {
      agent_id: agentId,
      company_id: companyId,
      tone: 'friendly',
      formality: 'informal',
      use_emojis: true,
      response_length: 'concise',
      commercial_style: 'consultative',
      custom_instructions: 'Sempre chame o cliente pelo primeiro nome. Use emojis de hambúrguer 🍔 e batata 🍟 com moderação.'
    });

    // 4. Regras de Negócio
    this.agentRules.set(agentId, [
      {
        id: 'r1',
        agent_id: agentId,
        company_id: companyId,
        rule_text: 'Quando o cliente pedir hambúrguer, ofereça batata frita como acompanhamento adicional.',
        priority: 5,
        condition_trigger: 'order_burger',
        action_type: 'offer_fries',
        active: true
      },
      {
        id: 'r2',
        agent_id: agentId,
        company_id: companyId,
        rule_text: 'Nunca conceder descontos não cadastrados sob hipótese alguma.',
        priority: 10,
        condition_trigger: 'ask_discount',
        action_type: 'block_discount',
        active: true
      },
      {
        id: 'r3',
        agent_id: agentId,
        company_id: companyId,
        rule_text: 'Não aceitar pedidos fora do horário de funcionamento.',
        priority: 9,
        condition_trigger: 'out_of_hours',
        action_type: 'reject_order',
        active: true
      },
      {
        id: 'r4',
        agent_id: agentId,
        company_id: companyId,
        rule_text: 'Transferir para humano imediatamente quando o cliente solicitar expressamente ou fizer reclamação.',
        priority: 10,
        condition_trigger: 'complaint',
        action_type: 'transfer_to_human',
        active: true
      },
      {
        id: 'r5',
        agent_id: agentId,
        company_id: companyId,
        rule_text: 'Nunca inventar preços, produtos ou taxas de entrega ausentes na base de dados.',
        priority: 10,
        condition_trigger: 'price_inquiry',
        action_type: 'strict_knowledge',
        active: true
      }
    ]);

    // 5. Categorias
    this.categories.set(companyId, [
      { id: 'cat-1', company_id: companyId, name: 'Hambúrgueres Artesanais', slug: 'hamburgueres', sort_order: 1 },
      { id: 'cat-2', company_id: companyId, name: 'Porções & Acompanhamentos', slug: 'porcoes', sort_order: 2 },
      { id: 'cat-3', company_id: companyId, name: 'Bebidas Geladas', slug: 'bebidas', sort_order: 3 }
    ]);

    // 6. Produtos
    this.products.set(companyId, [
      {
        id: 'prod-1',
        company_id: companyId,
        category_id: 'cat-1',
        name: 'X-Bacon Artesanal',
        description: 'Pão brioche, hambúrguer 160g na brasa, queijo cheddar, fatias generosas de bacon crocante e molho especial da casa.',
        price: 25.00,
        available: true,
        ingredients: ['pão brioche', 'blend 160g', 'queijo cheddar', 'bacon crocante', 'molho especial'],
        preparation_time_minutes: 20,
        variations: [
          { id: 'v1', product_id: 'prod-1', name: 'Bacon Extra em Tiras', variation_type: 'addon', additional_price: 5.00, available: true },
          { id: 'v2', product_id: 'prod-1', name: 'Queijo Cheddar Extra', variation_type: 'addon', additional_price: 3.00, available: true }
        ]
      },
      {
        id: 'prod-2',
        company_id: companyId,
        category_id: 'cat-1',
        name: 'X-Salada Tradicional',
        description: 'Pão com gergelim, hambúrguer 160g, queijo prato, alface americana fresca, tomate e maionese artesanal.',
        price: 22.00,
        available: true,
        ingredients: ['pão gergelim', 'blend 160g', 'queijo prato', 'alface', 'tomate', 'maionese artesanal'],
        preparation_time_minutes: 15
      },
      {
        id: 'prod-3',
        company_id: companyId,
        category_id: 'cat-2',
        name: 'Batata Frita Rústica Média',
        description: 'Batatas cortadas em gomos crocantes temperadas com páprica doce e sal fino.',
        price: 12.00,
        available: true,
        ingredients: ['batata', 'páprica', 'sal fino'],
        preparation_time_minutes: 10
      },
      {
        id: 'prod-4',
        company_id: companyId,
        category_id: 'cat-3',
        name: 'Coca-Cola Lata 350ml',
        description: 'Lata gelada 350ml tradicional.',
        price: 6.00,
        available: true,
        ingredients: ['refrigerante']
      }
    ]);

    // 7. Base de Conhecimento Estruturada
    this.knowledgeItems.set(companyId, [
      {
        id: 'ki-1',
        company_id: companyId,
        item_type: 'delivery_fee',
        subject: 'taxa_entrega_centro',
        data: { region: 'centro', fee: 5.00, estimated_time_min: 30 },
        source: 'chat_training',
        history: [],
        active: true
      },
      {
        id: 'ki-2',
        company_id: companyId,
        item_type: 'delivery_fee',
        subject: 'taxa_entrega_bairros',
        data: { region: 'bairros_proximos', fee: 8.00, estimated_time_min: 45 },
        source: 'chat_training',
        history: [],
        active: true
      },
      {
        id: 'ki-3',
        company_id: companyId,
        item_type: 'business_hour',
        subject: 'horario_funcionamento',
        data: { days: 'Terça a Domingo', open: '18:00', close: '23:00', closed_days: ['Segunda'] },
        source: 'manual',
        history: [],
        active: true
      },
      {
        id: 'ki-4',
        company_id: companyId,
        item_type: 'policy',
        subject: 'formas_pagamento',
        data: { accepted: ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'], pix_key: 'pix@anthonyburgers.com' },
        source: 'manual',
        history: [],
        active: true
      }
    ]);

    // 8. Cliente
    const customer: Customer = {
      id: customerId,
      company_id: companyId,
      name: 'João Victor',
      phone: '+5511987654321',
      email: 'joao.victor@exemplo.com',
      address: { street: 'Rua das Flores', number: '120', neighborhood: 'Centro' },
      notes: 'Gosta de hambúrguer bem passado e é fã de batata rústica.',
      total_orders: 3,
      lifetime_value: 115.00
    };
    this.customers.set(companyId, [customer]);

    // 9. Memória do Cliente
    this.memories.set(customerId, [
      { id: 'mem-1', company_id: companyId, customer_id: customerId, memory_type: 'preference', key: 'ponto_da_carne', value: 'bem_passado', confidence: 1.0 },
      { id: 'mem-2', company_id: companyId, customer_id: customerId, memory_type: 'address', key: 'endereco_padrao', value: 'Rua das Flores, 120 - Centro', confidence: 1.0 }
    ]);

    // 10. Conversa & Histórico Omnichannel
    this.conversations.set(convId, {
      id: convId,
      company_id: companyId,
      customer_id: customerId,
      agent_id: agentId,
      channel_type: 'instagram',
      status: 'ACTIVE',
      last_message_text: 'A taxa de entrega para o Centro custa apenas R$ 5,00 e o prazo estimado é de 30 minutos! Total do pedido até agora: R$ 42,00. Qual o endereço completo para eu gerar o pedido?',
      last_message_at: new Date().toISOString(),
      tags: ['lead_quente', 'delivery'],
      customer: customer
    });

    this.messages.set(convId, [
      {
        id: 'm1',
        conversation_id: convId,
        company_id: companyId,
        sender_type: 'customer',
        text: 'Olá! Quanto custa o X-Bacon?',
        media_type: 'text',
        status: 'received',
        created_at: new Date(Date.now() - 3 * 60000).toISOString()
      },
      {
        id: 'm2',
        conversation_id: convId,
        company_id: companyId,
        sender_type: 'agent',
        text: 'Olá João! 🍔 O nosso X-Bacon Artesanal custa R$ 25,00. Quer adicionar uma batatinha rústica média para acompanhar por R$ 12,00?',
        media_type: 'text',
        status: 'sent',
        created_at: new Date(Date.now() - 2 * 60000).toISOString()
      },
      {
        id: 'm3',
        conversation_id: convId,
        company_id: companyId,
        sender_type: 'customer',
        text: 'Sim, quero com batata! Qual a taxa de entrega para o Centro?',
        media_type: 'text',
        status: 'received',
        created_at: new Date(Date.now() - 60000).toISOString()
      },
      {
        id: 'm4',
        conversation_id: convId,
        company_id: companyId,
        sender_type: 'agent',
        text: 'A taxa de entrega para o Centro custa apenas R$ 5,00 e o prazo estimado é de 30 minutos! Total do pedido até agora: R$ 42,00. Qual o endereço completo para eu gerar o pedido?',
        media_type: 'text',
        status: 'sent',
        created_at: new Date().toISOString()
      }
    ]);
  }
}

export const store = InMemoryStore.getInstance();
