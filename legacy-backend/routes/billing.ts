import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const billingRouter = Router();
const DEFAULT_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

// Abstração de Provedor de Faturamento (Pronto para Stripe, Pagar.me, Mercado Pago)
export interface BillingProvider {
  createSubscription(companyId: string, planId: string): Promise<any>;
  cancelSubscription(subscriptionId: string): Promise<any>;
  changePlan(subscriptionId: string, newPlanId: string): Promise<any>;
  getSubscription(subscriptionId: string): Promise<any>;
  getInvoices(companyId: string): Promise<any[]>;
  handleWebhook(payload: any, signature: string): Promise<any>;
}

// Planos Comerciais Oficiais
export const SUBSCRIPTION_PLANS = [
  {
    id: 'plan_basic',
    name: 'Básico',
    slug: 'basico',
    price_monthly: 149,
    currency: 'BRL',
    description: 'Para pequenos negócios iniciando no atendimento com IA.',
    popular: false,
    max_agents: 1,
    max_channels: 1,
    max_messages: 2500,
    max_users: 2,
    max_storage_gb: 2,
    features: [
      '1 agente de IA',
      '1 canal conectado',
      'WhatsApp ou Instagram',
      'Base de conhecimento',
      'Treinamento da IA',
      'Memória de clientes',
      'Inbox de atendimento',
      'Histórico de conversas',
      'Suporte básico'
    ]
  },
  {
    id: 'plan_pro',
    name: 'Profissional',
    slug: 'profissional',
    price_monthly: 299,
    currency: 'BRL',
    description: 'Para empresas que precisam de atendimento omnichannel e alta conversão.',
    popular: true,
    max_agents: 1,
    max_channels: 3,
    max_messages: 10000,
    max_users: 5,
    max_storage_gb: 10,
    features: [
      '1 agente de IA',
      'Até 3 canais conectados simultâneos',
      'WhatsApp Business',
      'Instagram Direct',
      'Facebook Messenger',
      'Telegram Bot',
      'Base de conhecimento avançada',
      'Treinamento da IA',
      'Memória de clientes',
      'Inbox omnichannel',
      'Automação avançada',
      'Ferramentas do agente (Function Calling)',
      'Handoff para atendente humano',
      'Analytics e métricas',
      'Suporte prioritário'
    ]
  },
  {
    id: 'plan_business',
    name: 'Business',
    slug: 'business',
    price_monthly: 599,
    currency: 'BRL',
    description: 'Para empresas com maior volume e equipes de atendimento.',
    popular: false,
    max_agents: 3,
    max_channels: 6,
    max_messages: 30000,
    max_users: 15,
    max_storage_gb: 30,
    features: [
      'Até 3 agentes de IA especializados',
      'Todos os canais conectados',
      'WhatsApp, Instagram, Facebook, Telegram, X e Site',
      'Maior limite de mensagens mensais',
      'Knowledge Base avançada com RAG vetorial',
      'Memória de longo prazo persistente',
      'Múltiplos usuários e equipes',
      'Gestão de permissões de acesso',
      'Automações e fluxos customizados',
      'Ferramentas personalizadas',
      'Analytics avançado e relatórios exportáveis',
      'Suporte prioritário via WhatsApp'
    ]
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    price_monthly: 1000,
    is_custom: true,
    currency: 'BRL',
    description: 'Para grandes operações corporativas e redes de franquias.',
    popular: false,
    max_agents: 999,
    max_channels: 999,
    max_messages: 100000,
    max_users: 999,
    max_storage_gb: 100,
    features: [
      'Agentes de IA ilimitados e customizados',
      'Canais ilimitados conforme contrato',
      'Volume massivo de mensagens sob demanda',
      'Múltiplas equipes e filiais',
      'Permissões avançadas e auditoria completa',
      'Integrações personalizadas via API dedicada',
      'Webhooks bidirecionais de alta vazão',
      'Automações sob medida',
      'SLA garantido de 99.9% e suporte dedicado',
      'Implantação e treinamento assistido'
    ]
  }
];

// Estado multi-tenant de assinaturas e utilização
const companySubscriptions: Map<string, {
  subscription: {
    id: string;
    company_id: string;
    plan_id: string;
    status: 'active' | 'trial' | 'cancel_scheduled' | 'pending' | 'expired';
    billing_cycle: 'monthly' | 'yearly';
    price: number;
    currency: string;
    started_at: string;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    canceled_at: string | null;
  };
  usage: {
    ai_messages: number;
    agents_count: number;
    channels_count: number;
    users_count: number;
    documents_count: number;
    storage_gb: number;
  };
  history: Array<{
    id: string;
    date: string;
    plan_name: string;
    amount: number;
    currency: string;
    status: 'Pago' | 'Pendente' | 'Falhou' | 'Reembolsado';
    invoice_url: string;
  }>;
}> = new Map();

// Inicializa dados do tenant padrão
companySubscriptions.set(DEFAULT_COMPANY_ID, {
  subscription: {
    id: 'sub_live_01',
    company_id: DEFAULT_COMPANY_ID,
    plan_id: 'plan_pro',
    status: 'active',
    billing_cycle: 'monthly',
    price: 299,
    currency: 'BRL',
    started_at: '2026-07-07T00:00:00.000Z',
    current_period_start: '2026-09-07T00:00:00.000Z',
    current_period_end: '2026-10-07T00:00:00.000Z',
    cancel_at_period_end: false,
    canceled_at: null
  },
  usage: {
    ai_messages: 8420,
    agents_count: 1,
    channels_count: 2,
    users_count: 3,
    documents_count: 28,
    storage_gb: 3.2
  },
  history: [
    {
      id: 'inv_03',
      date: '07/09/2026',
      plan_name: 'Profissional',
      amount: 299,
      currency: 'BRL',
      status: 'Pago',
      invoice_url: '#'
    },
    {
      id: 'inv_02',
      date: '07/08/2026',
      plan_name: 'Profissional',
      amount: 299,
      currency: 'BRL',
      status: 'Pago',
      invoice_url: '#'
    },
    {
      id: 'inv_01',
      date: '07/07/2026',
      plan_name: 'Profissional',
      amount: 299,
      currency: 'BRL',
      status: 'Pago',
      invoice_url: '#'
    }
  ]
});

// Listar todos os planos disponíveis
billingRouter.get('/plans', (req: Request, res: Response) => {
  return res.json(SUBSCRIPTION_PLANS);
});

// Obter dados da assinatura atual do tenant
billingRouter.get('/current', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || DEFAULT_COMPANY_ID;
  const data = companySubscriptions.get(companyId);

  if (!data) {
    return res.status(404).json({ error: 'Assinatura não encontrada para esta empresa.' });
  }

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === data.subscription.plan_id) || SUBSCRIPTION_PLANS[1];

  return res.json({
    subscription: data.subscription,
    plan: currentPlan,
    usage: data.usage,
    limits: {
      max_messages: currentPlan.max_messages,
      max_agents: currentPlan.max_agents,
      max_channels: currentPlan.max_channels,
      max_users: currentPlan.max_users,
      max_storage_gb: currentPlan.max_storage_gb
    },
    history: data.history
  });
});

// Alterar plano (Upgrade ou Downgrade)
billingRouter.post('/change-plan', (req: Request, res: Response) => {
  const companyId = (req.body.companyId as string) || DEFAULT_COMPANY_ID;
  const { plan_id } = req.body;

  const targetPlan = SUBSCRIPTION_PLANS.find(p => p.id === plan_id);
  if (!targetPlan) {
    return res.status(400).json({ error: 'Plano selecionado inválido.' });
  }

  const data = companySubscriptions.get(companyId);
  if (!data) {
    return res.status(404).json({ error: 'Assinatura não encontrada.' });
  }

  // Atualiza assinatura
  data.subscription.plan_id = targetPlan.id;
  data.subscription.price = targetPlan.price_monthly;
  data.subscription.status = 'active';
  data.subscription.cancel_at_period_end = false;
  data.subscription.canceled_at = null;

  // Registra no histórico se for upgrade
  data.history.unshift({
    id: `inv_${Date.now()}`,
    date: new Date().toLocaleDateString('pt-BR'),
    plan_name: targetPlan.name,
    amount: targetPlan.price_monthly,
    currency: 'BRL',
    status: 'Pago',
    invoice_url: '#'
  });

  companySubscriptions.set(companyId, data);

  return res.json({
    success: true,
    message: `Plano alterado para ${targetPlan.name} com sucesso!`,
    subscription: data.subscription,
    plan: targetPlan
  });
});

// Agendar cancelamento de assinatura
billingRouter.post('/cancel', (req: Request, res: Response) => {
  const companyId = (req.body.companyId as string) || DEFAULT_COMPANY_ID;
  const data = companySubscriptions.get(companyId);

  if (!data) {
    return res.status(404).json({ error: 'Assinatura não encontrada.' });
  }

  data.subscription.status = 'cancel_scheduled';
  data.subscription.cancel_at_period_end = true;
  data.subscription.canceled_at = new Date().toISOString();

  companySubscriptions.set(companyId, data);

  return res.json({
    success: true,
    message: 'Cancelamento agendado. Seu acesso permanecerá ativo até o final do período vigente.',
    subscription: data.subscription
  });
});

// Reativar assinatura
billingRouter.post('/reactivate', (req: Request, res: Response) => {
  const companyId = (req.body.companyId as string) || DEFAULT_COMPANY_ID;
  const data = companySubscriptions.get(companyId);

  if (!data) {
    return res.status(404).json({ error: 'Assinatura não encontrada.' });
  }

  data.subscription.status = 'active';
  data.subscription.cancel_at_period_end = false;
  data.subscription.canceled_at = null;

  companySubscriptions.set(companyId, data);

  return res.json({
    success: true,
    message: 'Assinatura reativada com sucesso!',
    subscription: data.subscription
  });
});
