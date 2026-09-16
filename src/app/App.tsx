import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, UtensilsCrossed, Sliders, BookOpen, 
  Activity, Send, Sparkles, RefreshCw, Plus, Trash2,
  Smartphone, Instagram, MessageCircle, AlertCircle,
  Sun, Moon, Folder, FolderPlus, Pin, PinOff, Search, PanelLeft,
  Edit3, Check, X, ArrowUp, PlayCircle, LayoutDashboard,
  Globe, Facebook, Twitter, Copy, ExternalLink, HelpCircle, CheckCircle2,
  User, Shield, Bell, CreditCard, LogOut, ChevronRight, Settings,
  Lock, Mail, Phone, Building2, UserPlus, LogIn, ArrowRight, ArrowLeft, Zap, Star, ShieldCheck, Key,
  Mic, MicOff, Volume2, VolumeX, ThumbsUp, ThumbsDown, FileText, Paperclip, ChevronDown, Bot, Cpu, ShoppingBag, Truck, Calendar, Clock, DollarSign, Share2, Download, Terminal, Layers, Wand2, BarChart3, History as HistoryIcon
} from 'lucide-react';
import atomLogo from '@/assets/multiplex-atom.jpg';
import { AIBuilderView } from './components/builder/AIBuilderView';
import { DynamicModuleView } from './components/builder/DynamicModuleView';
import { AIBuilderModule } from './types/builder';
import { ExecutiveDashboardView, DashboardData } from './components/dashboard/ExecutiveDashboardView';
import { ContextualAIChatCard } from './components/conversation/ContextualAIChatCard';
import { aiConversationService } from './services/aiConversationService';
import { LandingChatPage } from './components/landing/LandingChatPage';
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageActions, MessageAction, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { PromptInput, PromptInputButton, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool';
import { Button } from '@/components/ui/button';

interface FolderItem {
  id: string;
  name: string;
  isPinned: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: Array<{ tool: string; input?: any; result?: any }>;
  catalogCards?: any[];
  timestamp: string;
}

interface ChatSession {
  id: string;
  serverConversationId?: string;
  title: string;
  folderId?: string | null;
  isPinned: boolean;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173' ? 'http://localhost:3000' : '';

const DEFAULT_PLANS = [
  {
    id: 'plan_basic',
    name: 'Básico',
    slug: 'basico',
    price_monthly: 149,
    price_yearly_monthly: 119,
    currency: 'BRL',
    description: 'Para pequenos negócios iniciando no atendimento com IA.',
    popular: false,
    max_agents: 1,
    max_channels: 1,
    max_messages: 2500,
    features: [
      '1 agente de IA dedicado',
      '1 canal conectado (WhatsApp ou Instagram)',
      'Até 2.500 mensagens de IA / mês',
      'Base de conhecimento e FAQ da empresa',
      'Treinamento e instruções do agente',
      'Painel de conversas e métricas'
    ]
  },
  {
    id: 'plan_pro',
    name: 'Profissional',
    slug: 'profissional',
    price_monthly: 299,
    price_yearly_monthly: 239,
    currency: 'BRL',
    description: 'Para empresas que precisam de atendimento multicanal simultâneo e alta conversão.',
    popular: true,
    max_agents: 1,
    max_channels: 3,
    max_messages: 10000,
    features: [
      '1 agente de IA com raciocínio avançado',
      'Até 3 canais conectados simultâneos',
      'WhatsApp Business, Instagram Direct e Telegram',
      'Até 10.000 mensagens de IA / mês',
      'Importação em massa de produtos com IA',
      'Memória de clientes e preferências',
      'Handoff para atendente humano',
      'Suporte prioritário'
    ]
  },
  {
    id: 'plan_business',
    name: 'Business',
    slug: 'business',
    price_monthly: 599,
    price_yearly_monthly: 479,
    currency: 'BRL',
    description: 'Para operações em crescimento com múltiplos canais e alta demanda.',
    popular: false,
    max_agents: 3,
    max_channels: 6,
    max_messages: 30000,
    features: [
      'Até 3 agentes de IA especializados',
      'Todos os canais conectados (WhatsApp, Insta, FB, Telegram, X)',
      'Até 30.000 mensagens de IA / mês',
      'Base de conhecimento avançada com busca vetorial',
      'Múltiplos usuários e operadores',
      'Automações e integrações customizadas',
      'Analytics avançado e relatórios exportáveis',
      'Suporte via canal exclusivo'
    ]
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    slug: 'enterprise',
    price_monthly: 1200,
    price_yearly_monthly: 960,
    currency: 'BRL',
    is_custom: true,
    description: 'Para grandes redes, franquias e operações corporativas.',
    popular: false,
    max_agents: 999,
    max_channels: 999,
    max_messages: 100000,
    features: [
      'Agentes de IA ilimitados e customizados',
      'Canais ilimitados conforme projeto',
      'Volume massivo de mensagens sob demanda',
      'Treinamento e fine-tuning com dados da marca',
      'SLA de disponibilidade 99.9%',
      'Gerente de sucesso do cliente dedicado'
    ]
  }
];

const SLASH_COMMANDS = [
  { cmd: '/cardapio', desc: 'Consultar todos os produtos e preços', prompt: 'Quais são todos os produtos cadastrados no cardápio e os seus preços?' },
  { cmd: '/frete', desc: 'Calcular taxa de entrega e raio', prompt: 'Qual é a taxa de entrega, raio de atendimento e tempo estimado de entrega?' },
  { cmd: '/horarios', desc: 'Verificar horário de funcionamento', prompt: 'Qual é o horário de funcionamento e atendimento da loja hoje?' },
  { cmd: '/agendar', desc: 'Simular agendamento de cliente', prompt: 'Gostaria de agendar um atendimento para amanhã à tarde.' },
  { cmd: '/promocao', desc: 'Criar promoção ou combo especial', prompt: 'Sugira um combo promocional com desconto e sobremesa para hoje.' },
  { cmd: '/regras', desc: 'Listar regras de negócio ativas', prompt: 'Quais regras de negócio e diretrizes de atendimento você segue obrigatoriamente?' }
];


export default function App() {
  // Limpeza de residuos mockados anteriores
  useEffect(() => {
    const rawFolders = localStorage.getItem('multiplex_folders');
    if (rawFolders && rawFolders.includes('Pa-Ja')) {
      localStorage.removeItem('multiplex_folders');
    }
    const rawChats = localStorage.getItem('multiplex_chats');
    if (rawChats && rawChats.includes('Retirada Da Queixa')) {
      localStorage.removeItem('multiplex_chats');
    }
  }, []);

  // Tema Claro e Escuro (Apenas bolinha com icones)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('multiplex_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('multiplex_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // A conversa é a tela principal
  const [activeView, setActiveView] = useState<'chat' | 'teach' | 'menu' | 'personality' | 'knowledge' | 'channels' | 'playground' | 'logs' | 'dashboard' | 'builder' | 'dynamic_module'>('chat');
  const [currentDynamicModule, setCurrentDynamicModule] = useState<AIBuilderModule | null>(null);
  const [sidebarModules, setSidebarModules] = useState<AIBuilderModule[]>([]);

  const loadSidebarModules = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/builder/modules`);
      if (res.ok) {
        const json = await res.json();
        setSidebarModules(json.modules || []);
      }
    } catch (e) {
      console.warn('Falha ao sincronizar módulos na sidebar:', e);
    }
  };

  useEffect(() => {
    loadSidebarModules();
  }, [activeView]);

  // Pastas criadas pelo usuario (Inicia vazio)
  const [folders, setFolders] = useState<FolderItem[]>(() => {
    const saved = localStorage.getItem('multiplex_folders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.some(f => f.name === 'Pa-Ja')) {
          return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('multiplex_folders', JSON.stringify(folders));
  }, [folders]);

  // Chats criados pelo usuario (Inicia com um chat limpo)
  const [chats, setChats] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('multiplex_chats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.some(c => c.title.includes('Retirada Da Queixa'))) {
          return parsed;
        }
      } catch (e) {}
    }
    return [
      {
        id: 'c-padrao',
        title: 'Novo chat',
        folderId: null,
        isPinned: false,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('multiplex_chats', JSON.stringify(chats));
  }, [chats]);

  const [activeChatId, setActiveChatId] = useState<string>(() => chats[0]?.id || 'c-padrao');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth <= 768);
  const [chatNavigationOpen, setChatNavigationOpen] = useState(false);

  // Pastas
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  // Chats
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editChatTitle, setEditChatTitle] = useState('');
  const [chatFolderMenuId, setChatFolderMenuId] = useState<string | null>(null);

  // Chat input
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Modal de Confirmação de Exclusão Unificado (Chats e Módulos)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'chat' | 'module';
    id: string;
    title: string;
  } | null>(null);

  // Backend
  const [products, setProducts] = useState<any[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');

  // Importacao de Cardapio e Catalogo com Multiplex (Texto, Web Scraper, Configuracoes e Analytics)
  const [catalogImportMode, setCatalogImportMode] = useState<'url' | 'text' | 'settings' | 'analytics'>('url');
  const [clientWebsiteUrl, setClientWebsiteUrl] = useState('');
  const [isScrapingWebsite, setIsScrapingWebsite] = useState(false);
  const [scrapeStatusText, setScrapeStatusText] = useState('');
  const [scrapedSiteTitle, setScrapedSiteTitle] = useState('');
  const [rawMenuText, setRawMenuText] = useState('');
  const [isParsingMenu, setIsParsingMenu] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<Array<{ name: string; price: number; description: string; category?: string; ingredients?: string[] }>>([]);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState('');
  const [showManualAdd, setShowManualAdd] = useState(false);

  // Configurações do Consultor Inteligente de Catálogo
  const [consultantSettings, setConsultantSettings] = useState({
    company_id: '11111111-1111-1111-1111-111111111111',
    max_results: 3,
    send_images: true,
    send_prices: true,
    send_descriptions: true,
    send_links: true,
    show_stock: true,
    ask_before_search: true,
    presentation_style: 'cards' as 'cards' | 'concise' | 'detailed',
    default_sort: 'relevance' as 'relevance' | 'price_asc' | 'price_desc' | 'newest',
    custom_consultant_rules: 'Aja como um vendedor e consultor especialista. Faça perguntas inteligentes e apresente fotos, preços reais e links oficiais.'
  });
  const [isSavingConsultantSettings, setIsSavingConsultantSettings] = useState(false);
  const [consultantSaveSuccess, setConsultantSaveSuccess] = useState(false);
  const [catalogAnalytics, setCatalogAnalytics] = useState<any>(null);

  // Testador / Simulador da Busca do Catálogo
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [testSearchResults, setTestSearchResults] = useState<any>(null);
  const [isTestingSearch, setIsTestingSearch] = useState(false);

  const loadConsultantSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/catalog/settings`);
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setConsultantSettings(data.settings);
      }
    } catch (e) {
      console.warn('Erro ao carregar configurações de catálogo:', e);
    }
  };

  const saveConsultantSettings = async () => {
    setIsSavingConsultantSettings(true);
    try {
      const res = await fetch(`${API_BASE}/api/catalog/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(consultantSettings)
      });
      if (res.ok) {
        setConsultantSaveSuccess(true);
        setTimeout(() => setConsultantSaveSuccess(false), 3500);
      }
    } catch (e) {
      console.error('Erro ao salvar configurações do catálogo:', e);
    } finally {
      setIsSavingConsultantSettings(false);
    }
  };

  const loadCatalogAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/catalog/analytics`);
      if (res.ok) {
        const data = await res.json();
        if (data.analytics) setCatalogAnalytics(data.analytics);
      }
    } catch (e) {
      console.warn('Erro ao carregar analytics de catálogo:', e);
    }
  };

  const handleCatalogClick = async (itemId: string, sourceUrl: string, itemName?: string) => {
    try {
      await fetch(`${API_BASE}/api/catalog/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalog_item_id: itemId,
          source_url: sourceUrl,
          item_name: itemName
        })
      });
    } catch (e) {}
    if (sourceUrl) {
      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRunTestSearch = async () => {
    if (!testSearchQuery.trim()) return;
    setIsTestingSearch(true);
    try {
      const res = await fetch(`${API_BASE}/api/catalog/search?query=${encodeURIComponent(testSearchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setTestSearchResults(data);
      }
    } catch (e) {
      console.error('Erro no teste de busca:', e);
    } finally {
      setIsTestingSearch(false);
    }
  };

  const [rules, setRules] = useState<any[]>([]);
  const [newRuleText, setNewRuleText] = useState('');
  const [newRulePriority, setNewRulePriority] = useState(5);

  // Identidade e Nome da IA (Personalização por Empresa)
  const [identityTab, setIdentityTab] = useState<'identity' | 'rules'>('identity');
  const [agentIdentity, setAgentIdentity] = useState<{
    display_name: string;
    company_name: string;
    introduction: string;
    role_description: string;
    auto_introduce: boolean;
    tone: string;
    communication_style: string;
    emoji_usage: string;
  }>({
    display_name: 'Multiplex',
    company_name: 'Minha Empresa',
    introduction: 'Olá! Eu sou o assistente virtual da Minha Empresa. Como posso ajudar você hoje?',
    role_description: 'Atendimento inteligente ao cliente, informações de produtos/serviços e suporte.',
    auto_introduce: true,
    tone: 'friendly',
    communication_style: 'consultative',
    emoji_usage: 'never'
  });
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [identitySaveSuccess, setIdentitySaveSuccess] = useState(false);

  const handleSaveIdentity = async () => {
    setIsSavingIdentity(true);
    setIdentitySaveSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/api/agent/identity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...agentIdentity,
          changed_by: currentUser?.name || 'Administrador'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAgentIdentity(data);
        setIdentitySaveSuccess(true);
        setTimeout(() => setIdentitySaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error('Erro ao salvar identidade da IA:', err);
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [newKbSubject, setNewKbSubject] = useState('');
  const [newKbContent, setNewKbContent] = useState('');

  // Sincronização Automática de Sites & Fontes de Conhecimento
  const [knowledgeTab, setKnowledgeTab] = useState<'sources' | 'catalog' | 'faq'>('sources');
  const [sourcesList, setSourcesList] = useState<any[]>([]);
  const [catalogList, setCatalogList] = useState<any[]>([]);
  const [showAddSourceModal, setShowAddSourceModal] = useState(false);
  const [selectedSourceType, setSelectedSourceType] = useState<'SITE' | 'DOCUMENT' | 'TEXT' | 'FILE' | 'OTHER'>('SITE');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceSegment, setNewSourceSegment] = useState<'AUTO' | 'RESTAURANTE' | 'IMOBILIÁRIA' | 'LOJA' | 'ECOMMERCE' | 'CONCESSIONÁRIA' | 'HOTEL' | 'SERVIÇOS' | 'EMPRESA_GERAL'>('AUTO');
  const [newSourceFrequency, setNewSourceFrequency] = useState<'1h' | '6h' | '12h' | '24h' | 'semanal'>('24h');
  const [newSourceAutoSync, setNewSourceAutoSync] = useState(true);
  const [isSyncingSourceId, setIsSyncingSourceId] = useState<string | null>(null);
  const [syncStepText, setSyncStepText] = useState('');
  const [syncProgressPercent, setSyncProgressPercent] = useState(0);
  const [syncDetailText, setSyncDetailText] = useState('');
  const [syncSummaryData, setSyncSummaryData] = useState<any | null>(null);
  const [historyModalSource, setHistoryModalSource] = useState<any | null>(null);
  const [historyRuns, setHistoryRuns] = useState<any[]>([]);
  const [selectedRunChanges, setSelectedRunChanges] = useState<any[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogSegmentFilter, setCatalogSegmentFilter] = useState('ALL');
  const [sourceFormError, setSourceFormError] = useState<string | null>(null);

  const [channels, setChannels] = useState<any[]>([]);

  // Assistente de Conexao de Canais com IA
  const [selectedChannel, setSelectedChannel] = useState<any | null>(null);
  const [channelModalTab, setChannelModalTab] = useState<'guide' | 'ai_chat' | 'credentials'>('guide');
  const [channelCreds, setChannelCreds] = useState<Record<string, string>>({});
  const [channelAiPrompt, setChannelAiPrompt] = useState('');
  const [channelAiReply, setChannelAiReply] = useState('');
  const [isAskingChannelAi, setIsAskingChannelAi] = useState(false);
  const [isTestingChannel, setIsTestingChannel] = useState(false);
  const [channelTestSuccess, setChannelTestSuccess] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Perfil e Assinatura (Plano e Mensalidade)
  const [showUserPopup, setShowUserPopup] = useState(false);
  const [showHelpSubmenu, setShowHelpSubmenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'personal' | 'security' | 'notifications' | 'plan'>('plan');
  const [billingData, setBillingData] = useState<any>(null);
  const [billingPlans, setBillingPlans] = useState<any[]>([]);
  const [confirmModal, setConfirmModal] = useState<{ type: 'cancel' | 'downgrade' | 'upgrade' | 'logout'; plan?: any } | null>(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [planActionMessage, setPlanActionMessage] = useState<string | null>(null);

  // Autenticacao, Login, Cadastro e Aba de Planos
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('multiplex_company_token'));
  });

  // Landing page: exibida antes do formulário de auth
  const [showLandingPage, setShowLandingPage] = useState<boolean>(() => {
    return !localStorage.getItem('multiplex_company_token');
  });

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'plans'>('login');
  const [authStep, setAuthStep] = useState<1 | 2>(1);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authCompany, setAuthCompany] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPlanId, setAuthPlanId] = useState('plan_pro');
  const [authBillingCycle, setAuthBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('multiplex_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      name: 'Anthony Both',
      email: 'anthony@amboth.com.br',
      company_name: 'Anthony Burgers & Delivery',
      phone: '+55 11 99999-8888',
      plan_id: 'plan_pro',
      avatar_initials: 'AN',
      billing_cycle: 'monthly'
    };
  });

  // Multiplex: o usuário conversa com UMA IA. A escolha do modelo é feita
  // automaticamente pelo roteador no servidor e nunca aparece na interface.
  const [lastRouting, setLastRouting] = useState<{ taskLabel: string; complexity: string } | null>(null);
  const [promptCategory, setPromptCategory] = useState<'destaques' | 'cardapio' | 'frete' | 'horarios' | 'agendamento' | 'promocoes'>('destaques');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'liked' | 'disliked'>>({});
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);

  const [metrics, setMetrics] = useState<any>({
    conversations_today: 0,
    messages_today: 0,
    customers_served: 0,
    ai_assisted_chats: 0,
    orders_created: 0,
    revenue_brl: 0.00
  });

  const [dashboardData, setDashboardData] = useState<any>({
    metrics: {
      conversations_today: 0,
      messages_today: 0,
      customers_served: 0,
      ai_assisted_chats: 0,
      human_assisted_chats: 0,
      ai_automation_rate: 92,
      orders_created: 0,
      orders_delivered: 0,
      orders_pending: 0,
      revenue_brl: 0.00,
      total_expenses_brl: 0.00,
      net_profit_brl: 0.00,
      profit_margin_percent: 0,
      avg_ticket_brl: 0.00,
      conversion_rate_percent: 0,
      avg_response_time_seconds: 1.2,
      ai_cost_usd: 0.00,
      connected_channels: 2,
      catalog_total_items: 0,
      catalog_searches_count: 0,
      catalog_clicks_count: 0
    },
    recent_orders: [],
    top_customers: [],
    payment_methods: [],
    expenses_by_category: [],
    recent_activities: []
  });

  // Treinamento
  const [teachChat, setTeachChat] = useState<Array<{ sender: 'user' | 'agent'; text: string; structured?: any }>>([]);
  const [teachInput, setTeachInput] = useState('');
  const [structuredHistory, setStructuredHistory] = useState<any[]>([]);

  // Playground
  const [playgroundMessages, setPlaygroundMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [playgroundInput, setPlaygroundInput] = useState('');
  const [playgroundDebug, setPlaygroundDebug] = useState<any>(null);
  const [playgroundConversationId, setPlaygroundConversationId] = useState<string>();

  // Logs
  const [logsList, setLogsList] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [resProd, resAgent, resKb, resChan, resDash, resHist, resLogs, resBill, resPlans, resSources, resCatalog] = await Promise.all([
        fetch(`${API_BASE}/api/products`).catch(() => null),
        fetch(`${API_BASE}/api/agent/config`).catch(() => null),
        fetch(`${API_BASE}/api/knowledge`).catch(() => null),
        fetch(`${API_BASE}/api/channels`).catch(() => null),
        fetch(`${API_BASE}/api/dashboard`).catch(() => null),
        fetch(`${API_BASE}/api/teach/history`).catch(() => null),
        fetch(`${API_BASE}/api/logs`).catch(() => null),
        fetch(`${API_BASE}/api/billing/current`).catch(() => null),
        fetch(`${API_BASE}/api/billing/plans`).catch(() => null),
        fetch(`${API_BASE}/api/sources`).catch(() => null),
        fetch(`${API_BASE}/api/sources/catalog/items`).catch(() => null)
      ]);

      if (resProd?.ok) setProducts(await resProd.json());
      if (resAgent?.ok) {
        const ag = await resAgent.json();
        if (ag.rules) setRules(ag.rules);
        if (ag.identity) setAgentIdentity(ag.identity);
      }
      if (resKb?.ok) setKnowledgeList(await resKb.json());
      if (resChan?.ok) setChannels(await resChan.json());
      if (resDash?.ok) {
        const d = await resDash.json();
        if (d.metrics) setMetrics(d.metrics);
        setDashboardData({
          metrics: d.metrics || {},
          recent_orders: d.recent_orders || [],
          top_customers: d.top_customers || [],
          payment_methods: d.payment_methods || [],
          expenses_by_category: d.expenses_by_category || [],
          recent_activities: d.recent_activities || []
        });
      }
      if (resHist?.ok) setStructuredHistory(await resHist.json());
      if (resLogs?.ok) setLogsList(await resLogs.json());
      if (resBill?.ok) setBillingData(await resBill.json());
      if (resPlans?.ok) setBillingPlans(await resPlans.json());
      if (resSources?.ok) {
        const srcData = await resSources.json();
        if (srcData.sources) setSourcesList(srcData.sources);
      }
      if (resCatalog?.ok) {
        const catData = await resCatalog.json();
        if (catData.items) setCatalogList(catData.items);
      }
    } catch (e) {
      console.warn('API local nao acessivel no momento');
    }
  };


  useEffect(() => {
    loadData();
  }, []);

  const activePlansList = (billingPlans && billingPlans.length > 0) ? billingPlans : DEFAULT_PLANS;

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authEmail.trim()) {
      setAuthError('Informe o seu e-mail comercial.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
       const res = await fetch(`${API_BASE}/api/company/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
       if (res.ok && data.accessToken) {
         const user = {
           name: data.user?.email?.split('@')[0] || 'Usuário',
           email: data.user?.email,
           company_id: data.company?.id,
           company_name: data.company?.name,
           role: data.user?.role,
           avatar_initials: (data.user?.email || 'US').slice(0, 2).toUpperCase()
         };
         setCurrentUser(user);
         localStorage.setItem('multiplex_user', JSON.stringify(user));
         localStorage.setItem('multiplex_company_token', data.accessToken);
        localStorage.setItem('multiplex_is_authenticated', 'true');
        setIsAuthenticated(true);
        loadData();
      } else {
         setAuthError(data.error || 'E-mail ou senha inválidos.');
      }
    } catch (err) {
       setAuthError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authName.trim()) {
      setAuthError('Informe o seu nome completo.');
      return;
    }
    if (!authEmail.trim()) {
      setAuthError('Informe o seu e-mail comercial.');
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
          company_name: authCompany,
          phone: authPhone,
          plan_id: authPlanId,
          billing_cycle: authBillingCycle
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('multiplex_user', JSON.stringify(data.user));
        localStorage.setItem('multiplex_is_authenticated', 'true');
        setIsAuthenticated(true);
        loadData();
      } else {
        const initials = authName.slice(0, 2).toUpperCase() || 'US';
        const userObj = {
          name: authName,
          email: authEmail,
          company_name: authCompany || 'Minha Empresa',
          phone: authPhone,
          plan_id: authPlanId,
          avatar_initials: initials,
          billing_cycle: authBillingCycle
        };
        setCurrentUser(userObj);
        localStorage.setItem('multiplex_user', JSON.stringify(userObj));
        localStorage.setItem('multiplex_is_authenticated', 'true');
        setIsAuthenticated(true);
        loadData();
      }
    } catch (err) {
      const initials = authName.slice(0, 2).toUpperCase() || 'US';
      const userObj = {
        name: authName,
        email: authEmail,
        company_name: authCompany || 'Minha Empresa',
        phone: authPhone,
        plan_id: authPlanId,
        avatar_initials: initials,
        billing_cycle: authBillingCycle
      };
      setCurrentUser(userObj);
      localStorage.setItem('multiplex_user', JSON.stringify(userObj));
      localStorage.setItem('multiplex_is_authenticated', 'true');
      setIsAuthenticated(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDemoAccess = (name = 'Anthony Both', email = 'anthony@amboth.com.br', planId = 'plan_pro') => {
    const userObj = {
      name,
      email,
      company_name: 'Anthony Burgers & Delivery',
      phone: '+55 11 99999-8888',
      plan_id: planId,
      avatar_initials: name.slice(0, 2).toUpperCase(),
      billing_cycle: 'monthly'
    };
    setCurrentUser(userObj);
    localStorage.setItem('multiplex_user', JSON.stringify(userObj));
    localStorage.setItem('multiplex_is_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.setItem('multiplex_is_authenticated', 'false');
    localStorage.removeItem('multiplex_company_token');
    localStorage.removeItem('multiplex_user');
    setIsAuthenticated(false);
    setShowLandingPage(true);
    setShowUserPopup(false);
    setConfirmModal(null);
    setAuthMode('login');
  };


  const currentChat = chats.find(c => c.id === activeChatId) || chats[0];

  // Acoes de Pastas
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newF: FolderItem = {
      id: `f-${Date.now()}`,
      name: newFolderName.trim(),
      isPinned: false
    };
    setFolders([...folders, newF]);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleTogglePinFolder = (folderId: string) => {
    setFolders(folders.map(f => f.id === folderId ? { ...f, isPinned: !f.isPinned } : f));
  };

  const handleDeleteFolder = (folderId: string) => {
    setFolders(folders.filter(f => f.id !== folderId));
    setChats(chats.map(c => c.folderId === folderId ? { ...c, folderId: null } : c));
    if (selectedFolderFilter === folderId) setSelectedFolderFilter(null);
  };

  const handleRenameFolder = (folderId: string) => {
    if (!editFolderName.trim()) return;
    setFolders(folders.map(f => f.id === folderId ? { ...f, name: editFolderName.trim() } : f));
    setEditingFolderId(null);
    setEditFolderName('');
  };

  // Acoes de Chats
  const handleCreateNewChat = () => {
    const newChat: ChatSession = {
      id: `c-${Date.now()}`,
      title: 'Novo chat',
      folderId: selectedFolderFilter || null,
      isPinned: false,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    setActiveView('chat');
  };

  const handleTogglePinChat = (chatId: string) => {
    setChats(chats.map(c => c.id === chatId ? { ...c, isPinned: !c.isPinned } : c));
  };

  const handleDeleteChat = (chatId: string, chatTitle?: string) => {
    const targetChat = chats.find(c => c.id === chatId);
    setDeleteConfirmTarget({
      type: 'chat',
      id: chatId,
      title: chatTitle || targetChat?.title || 'Novo chat'
    });
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmTarget) return;
    const { type, id } = deleteConfirmTarget;
    if (type === 'chat') {
      const filtered = chats.filter(c => c.id !== id);
      if (filtered.length === 0) {
        const resetChat: ChatSession = {
          id: `c-${Date.now()}`,
          title: 'Novo chat',
          folderId: null,
          isPinned: false,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setChats([resetChat]);
        setActiveChatId(resetChat.id);
      } else {
        setChats(filtered);
        if (activeChatId === id) {
          setActiveChatId(filtered[0].id);
        }
      }
    } else if (type === 'module') {
      try {
        await fetch(`${API_BASE}/api/builder/modules/${id}`, { method: 'DELETE' });
        if (currentDynamicModule?.id === id) {
          setCurrentDynamicModule(null);
          setActiveView('builder');
        }
        loadSidebarModules();
      } catch (err) {
        console.error('Erro ao excluir módulo:', err);
      }
    }
    setDeleteConfirmTarget(null);
  };

  const handleClearAllChats = () => {
    const freshChat: ChatSession = {
      id: `c-${Date.now()}`,
      title: 'Novo chat',
      folderId: null,
      isPinned: false,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setChats([freshChat]);
    setFolders([]);
    setActiveChatId(freshChat.id);
    localStorage.removeItem('multiplex_chats');
    localStorage.removeItem('multiplex_folders');
  };

  const handleRenameChat = (chatId: string) => {
    if (!editChatTitle.trim()) return;
    setChats(chats.map(c => c.id === chatId ? { ...c, title: editChatTitle.trim() } : c));
    setEditingChatId(null);
    setEditChatTitle('');
  };

  const handleMoveChatToFolder = (chatId: string, folderId: string | null) => {
    setChats(chats.map(c => c.id === chatId ? { ...c, folderId } : c));
    setChatFolderMenuId(null);
  };

  // Enviar Mensagem
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || chatInput).trim();
    if (!prompt || isSendingMessage || !currentChat) return;

    const userMsg: ChatMessage = {
      id: `m-usr-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...currentChat.messages, userMsg];
    const isFirstUserMessage = currentChat.messages.filter(m => m.role === 'user').length === 0;
    const newTitle = isFirstUserMessage ? (prompt.length > 30 ? prompt.slice(0, 30) + '...' : prompt) : currentChat.title;

    setChats(chats.map(c => c.id === currentChat.id ? {
      ...c,
      title: newTitle,
      messages: updatedMessages,
      updatedAt: new Date().toISOString()
    } : c));

    setChatInput('');
    setIsSendingMessage(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/conversation/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('multiplex_company_token')
            ? { Authorization: `Bearer ${localStorage.getItem('multiplex_company_token')}` }
            : {})
        },
        body: JSON.stringify({ 
          message: prompt,
          conversationId: currentChat.serverConversationId,
          ...(!localStorage.getItem('multiplex_company_token')
            ? { publicSessionId: crypto.randomUUID() }
            : {}),
          channel: 'web',
          context: {
            page: activeView,
            module: activeView
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.routing) {
          setLastRouting({ taskLabel: data.routing.taskLabel, complexity: data.routing.complexity });
        }
        if (!data.assistantMessage?.content) throw new Error('A resposta real não contém texto.');
        const contentText = data.assistantMessage.content;

        const aiMsg: ChatMessage = {
          id: data.assistantMessage?.id || `m-ai-${Date.now()}`,
          role: 'assistant',
          content: contentText,
          timestamp: new Date().toISOString()
        };

        setChats(prevChats => prevChats.map(c => c.id === currentChat.id ? {
          ...c,
          serverConversationId: data.conversation?.id || c.serverConversationId,
          messages: [...c.messages, aiMsg],
          updatedAt: new Date().toISOString()
        } : c));
      } else {
        const payload = await res.json().catch(() => ({}));
        const aiMsg: ChatMessage = {
          id: `m-ai-${Date.now()}`,
          role: 'assistant',
          content: payload.error || `A IA retornou um erro HTTP ${res.status}.`,
          timestamp: new Date().toISOString()
        };
        setChats(prevChats => prevChats.map(c => c.id === currentChat.id ? {
          ...c,
          messages: [...c.messages, aiMsg]
        } : c));
      }
    } catch (e) {
      const aiMsg: ChatMessage = {
        id: `m-ai-${Date.now()}`,
        role: 'assistant',
        content: e instanceof Error ? e.message : 'Falha de rede ao contatar a IA.',
        timestamp: new Date().toISOString()
      };
      setChats(prevChats => prevChats.map(c => c.id === currentChat.id ? {
        ...c,
        messages: [...c.messages, aiMsg]
      } : c));
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Funcoes Avancadas de Interacao com a Multiplex
  const handleSpeakMessage = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Sintese de voz nao suportada neste navegador.');
      return;
    }
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  const handleFeedback = (msgId: string, type: 'liked' | 'disliked') => {
    setFeedbackMap(prev => ({ ...prev, [msgId]: type }));
  };

  const handleToggleVoiceRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      if (!isRecordingVoice) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'pt-BR';
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.onstart = () => setIsRecordingVoice(true);
          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setChatInput(prev => prev ? `${prev} ${transcript}` : transcript);
            setIsRecordingVoice(false);
          };
          recognition.onerror = () => setIsRecordingVoice(false);
          recognition.onend = () => setIsRecordingVoice(false);
          recognition.start();
        } catch (e) {
          setIsRecordingVoice(false);
        }
      } else {
        setIsRecordingVoice(false);
      }
    } else {
      if (!isRecordingVoice) {
        setIsRecordingVoice(true);
        setTimeout(() => {
          setChatInput('Quais são as opções de cardápio e a taxa de entrega para o Centro?');
          setIsRecordingVoice(false);
        }, 1600);
      } else {
        setIsRecordingVoice(false);
      }
    }
  };

  const handleSelectSlash = (promptText: string) => {
    setChatInput(promptText);
    setShowSlashMenu(false);
  };

  const handleExportConversation = () => {
    if (!currentChat || currentChat.messages.length === 0) {
      alert('Esta conversa ainda não possui mensagens para exportar.');
      return;
    }
    const transcript = currentChat.messages.map(m => {
      const author = m.role === 'user' ? 'USUÁRIO' : 'MULTIPLEX IA (BONASOFT)';
      return `[${new Date(m.timestamp).toLocaleTimeString('pt-BR')}] ${author}:\n${m.content}\n`;
    }).join('\n----------------------------------------\n\n');

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multiplex-ia-chat-${currentChat.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRegenerateLastMessage = () => {
    if (!currentChat || currentChat.messages.length === 0) return;
    const lastUserMsg = [...currentChat.messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  // Ensinar IA
  const handleSendTeach = async () => {
    if (!teachInput.trim()) return;
    const userMsg = teachInput;
    setTeachInput('');
    setTeachChat(prev => [...prev, { sender: 'user', text: userMsg }]);

    try {
      const res = await fetch(`${API_BASE}/api/teach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userMsg })
      });
      if (res.ok) {
        const data = await res.json();
        setTeachChat(prev => [...prev, { sender: 'agent', text: data.reply, structured: data.structured_item }]);
        loadData();
      }
    } catch (e) {
      setTeachChat(prev => [...prev, {
        sender: 'agent',
        text: e instanceof Error ? e.message : 'Falha ao salvar a informação.'
      }]);
    }
  };

  // Playground
  const handlePlaygroundSend = async () => {
    if (!playgroundInput.trim()) return;
    const text = playgroundInput;
    setPlaygroundInput('');
    setPlaygroundMessages(prev => [...prev, { role: 'user', content: text }]);

    try {
      const token = localStorage.getItem('multiplex_company_token');
      const res = await fetch(`${API_BASE}/api/ai/conversation/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          message: text,
          conversationId: playgroundConversationId,
          ...(!token ? { publicSessionId: crypto.randomUUID() } : {}),
          channel: 'web',
          context: { page: 'playground' }
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `A IA retornou um erro HTTP ${res.status}.`);
      setPlaygroundConversationId(data.conversation?.id);
      setPlaygroundMessages(prev => [...prev, { role: 'assistant', content: data.assistantMessage.content }]);
      setPlaygroundDebug({
        tools: [],
        knowledge: data.context?.sources || [],
        rules: [data.routing?.reason].filter(Boolean),
        latency: data.usage?.latencyMs ?? 0
      });
    } catch (e) {
      setPlaygroundMessages(prev => [...prev, { role: 'assistant', content: e instanceof Error ? e.message : 'Falha de rede ao contatar a IA.' }]);
    }
  };

  // Adicionar Produto Manual
  const handleAddProduct = async () => {
    if (!newProductName.trim() || !newProductPrice) return;
    try {
      const res = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName,
          price: parseFloat(newProductPrice),
          description: newProductDesc,
          ingredients: []
        })
      });
      if (res.ok) {
        const created = await res.json();
        setProducts([...products, created]);
        setNewProductName('');
        setNewProductPrice('');
        setNewProductDesc('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Extrair produtos, imóveis e catálogo completo direto de um site/link com Multiplex
  const handleScrapeWebsite = async (autoSave = false) => {
    if (!clientWebsiteUrl.trim()) {
      alert('Por favor, informe a URL ou link do site do cliente (ex: https://sualoja.com.br, https://imobiliaria.com.br, etc.)');
      return;
    }
    setIsScrapingWebsite(true);
    setScrapeStatusText('Acessando o site do cliente, mapeando páginas e extraindo catálogo com Multiplex...');
    setBatchSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/products/scrape-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: clientWebsiteUrl.trim(),
          autoSave: autoSave
        })
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.products) && data.products.length > 0) {
        setScrapedSiteTitle(data.site_title || clientWebsiteUrl);
        if (autoSave && data.savedProducts) {
          setProducts(prev => [...prev, ...data.savedProducts]);
          setBatchSuccessMsg(`Sucesso! ${data.count} itens (produtos/imóveis) extraídos de "${data.site_title || clientWebsiteUrl}" e cadastrados no catálogo.`);
          setParsedProducts([]);
          setClientWebsiteUrl('');
        } else {
          setParsedProducts(data.products);
          setBatchSuccessMsg(`${data.count} itens identificados no site "${data.site_title || clientWebsiteUrl}". Confira os itens abaixo antes de salvar.`);
        }
      } else {
        alert(data.error || 'Nenhum produto ou imóvel foi identificado automaticamente neste site. Verifique se o endereço está correto e com acesso público.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Erro ao conectar com o site ou servidor da Multiplex.');
    } finally {
      setIsScrapingWebsite(false);
      setScrapeStatusText('');
    }
  };

  // Extrair produtos de texto com Multiplex (GPT-4o)
  const handleParseMenuWithAI = async () => {
    if (!rawMenuText.trim()) return;
    setIsParsingMenu(true);
    setBatchSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/products/parse-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawMenuText })
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.products) && data.products.length > 0) {
        setParsedProducts(data.products);
      } else {
        alert(data.error || 'Nenhum produto identificado. Certifique-se de incluir nomes e preços no texto.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de comunicação com a API da Multiplex.');
    } finally {
      setIsParsingMenu(false);
    }
  };

  // Salvar lote de produtos extraidos
  const handleSaveBatchProducts = async () => {
    if (parsedProducts.length === 0) return;
    setIsSavingBatch(true);
    try {
      const res = await fetch(`${API_BASE}/api/products/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsedProducts })
      });
      const data = await res.json();
      if (res.ok && data.products) {
        setProducts([...products, ...data.products]);
        setBatchSuccessMsg(`${data.count} produtos cadastrados com sucesso no cardápio.`);
        setParsedProducts([]);
        setRawMenuText('');
      } else {
        alert(data.error || 'Falha ao salvar produtos no catálogo.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar produtos no catálogo.');
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Importar e Salvar Tudo Direto com IA em 1 clique
  const handleDirectImportAI = async () => {
    if (!rawMenuText.trim()) return;
    setIsParsingMenu(true);
    setBatchSuccessMsg('');
    try {
      const parseRes = await fetch(`${API_BASE}/api/products/parse-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawMenuText })
      });
      const parseData = await parseRes.json();
      if (parseRes.ok && Array.isArray(parseData.products) && parseData.products.length > 0) {
        const batchRes = await fetch(`${API_BASE}/api/products/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: parseData.products })
        });
        const batchData = await batchRes.json();
        if (batchRes.ok && batchData.products) {
          setProducts([...products, ...batchData.products]);
          setBatchSuccessMsg(`${batchData.count} produtos identificados e adicionados com sucesso.`);
          setRawMenuText('');
          setParsedProducts([]);
        }
      } else {
        alert(parseData.error || 'Nenhum produto identificado no texto.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao importar produtos com IA.');
    } finally {
      setIsParsingMenu(false);
    }
  };

  // Excluir produto do catalogo
  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Remover item especifico da pre-visualizacao
  const handleRemoveParsedItem = (index: number) => {
    setParsedProducts(parsedProducts.filter((_, idx) => idx !== index));
  };

  // Abrir Assistente de Conexao do Canal
  const handleOpenChannel = (channel: any) => {
    setSelectedChannel(channel);
    setChannelModalTab('guide');
    setChannelCreds({
      accountName: channel.accountName || '',
      ...channel.fields?.reduce((acc: any, f: any) => ({ ...acc, [f.key]: '' }), {})
    });
    setChannelAiPrompt('');
    setChannelAiReply('');
    setChannelTestSuccess(null);
    setCopiedUrl(false);
  };

  // Copiar URL do Webhook
  const handleCopyWebhook = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Consultar Assistente de IA para Canal
  const handleAskChannelAi = async (customQuestion?: string) => {
    const q = customQuestion || channelAiPrompt;
    if (!q.trim() || !selectedChannel) return;
    setIsAskingChannelAi(true);
    try {
      const res = await fetch(`${API_BASE}/api/channels/${selectedChannel.type}/ai-guide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });
      const data = await res.json();
      if (res.ok && data.answer) {
        setChannelAiReply(data.answer);
      } else {
        alert(data.error || 'Erro ao consultar assistente de IA');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de conexao com o assistente');
    } finally {
      setIsAskingChannelAi(false);
    }
  };

  // Testar e Ativar Canal
  const handleTestAndActivateChannel = async () => {
    if (!selectedChannel) return;
    setIsTestingChannel(true);
    setChannelTestSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/api/channels/${selectedChannel.type}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelCreds)
      });
      const data = await res.json();
      if (res.ok && data.channel) {
        setChannels(channels.map(c => c.type === selectedChannel.type ? data.channel : c));
        setSelectedChannel(data.channel);
        setChannelTestSuccess(data.message || 'Canal conectado e ativado com sucesso!');
      } else {
        alert(data.error || 'Falha ao testar conexao');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao testar o webhook');
    } finally {
      setIsTestingChannel(false);
    }
  };

  // Desconectar Canal
  const handleDisconnectChannel = async (type: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/channels/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connected: false, accountName: '' })
      });
      if (res.ok) {
        const updated = await res.json();
        setChannels(channels.map(c => c.type === type ? updated : c));
        if (selectedChannel?.type === type) {
          setSelectedChannel(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trocar Plano (Upgrade ou Downgrade)
  const handleChangePlan = async (planId: string) => {
    setIsChangingPlan(true);
    try {
      const res = await fetch(`${API_BASE}/api/billing/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId })
      });
      const data = await res.json();
      if (res.ok) {
        setPlanActionMessage(`Plano alterado para ${data.plan.name} com sucesso.`);
        const curRes = await fetch(`${API_BASE}/api/billing/current`);
        if (curRes.ok) setBillingData(await curRes.json());
        setConfirmModal(null);
      } else {
        alert(data.error || 'Erro ao alterar plano');
      }
    } catch (e) {
      console.error(e);
      alert('Falha na comunicação ao alterar plano');
    } finally {
      setIsChangingPlan(false);
    }
  };

  // Cancelar Assinatura
  const handleCancelSubscription = async () => {
    setIsChangingPlan(true);
    try {
      const res = await fetch(`${API_BASE}/api/billing/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setPlanActionMessage('Cancelamento agendado. Seu plano permanecerá ativo até o final do período vigente.');
        const curRes = await fetch(`${API_BASE}/api/billing/current`);
        if (curRes.ok) setBillingData(await curRes.json());
        setConfirmModal(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChangingPlan(false);
    }
  };

  // Reativar Assinatura
  const handleReactivateSubscription = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/billing/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setPlanActionMessage('Assinatura reativada com sucesso.');
        const curRes = await fetch(`${API_BASE}/api/billing/current`);
        if (curRes.ok) setBillingData(await curRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Adicionar Regra
  const handleAddRule = async () => {
    if (!newRuleText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/agent/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_text: newRuleText, priority: newRulePriority })
      });
      if (res.ok) {
        const created = await res.json();
        setRules([created, ...rules]);
        setNewRuleText('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Adicionar Conhecimento
  const handleAddKnowledge = async () => {
    if (!newKbSubject.trim() || !newKbContent.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newKbSubject,
          data: { content: newKbContent }
        })
      });
      if (res.ok) {
        const created = await res.json();
        setKnowledgeList([...knowledgeList, created]);
        setNewKbSubject('');
        setNewKbContent('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Recarregar Fontes e Catálogo Sincronizado
  const refreshSourcesAndCatalog = async () => {
    try {
      const [resSources, resCatalog] = await Promise.all([
        fetch(`${API_BASE}/api/sources`).catch(() => null),
        fetch(`${API_BASE}/api/sources/catalog/items`).catch(() => null)
      ]);
      if (resSources?.ok) {
        const d = await resSources.json();
        if (d.sources) setSourcesList(d.sources);
      }
      if (resCatalog?.ok) {
        const c = await resCatalog.json();
        if (c.items) setCatalogList(c.items);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cadastrar nova fonte e disparar primeira sincronização
  const handleCreateAndSyncSource = async () => {
    setSourceFormError(null);
    if (selectedSourceType === 'SITE') {
      if (!newSourceUrl.trim()) {
        setSourceFormError('Informe a URL do site (ex: https://empresa.com.br)');
        return;
      }
      let urlInput = newSourceUrl.trim();
      if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
        urlInput = 'https://' + urlInput;
      }

      try {
        setIsSyncingSourceId('new');
        setSyncProgressPercent(15);
        setSyncStepText('Validando URL e registrando fonte...');
        setSyncDetailText(urlInput);

        const resCreate = await fetch(`${API_BASE}/api/sources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: urlInput,
            name: newSourceName.trim() || undefined,
            source_type: 'SITE',
            business_type: newSourceSegment === 'AUTO' ? undefined : newSourceSegment,
            auto_sync: newSourceAutoSync,
            sync_frequency: newSourceFrequency
          })
        });

        const createData = await resCreate.json();
        if (!resCreate.ok || !createData.success) {
          throw new Error(createData.error || 'Falha ao cadastrar fonte.');
        }

        const source = createData.source;
        setIsSyncingSourceId(source.id);

        // Animação gradual do stepper durante a primeira sincronização
        setSyncProgressPercent(30);
        setSyncStepText('Lendo robots.txt e descobrindo sitemap...');
        setSyncDetailText(`${source.url}/sitemap.xml`);

        setTimeout(() => {
          setSyncProgressPercent(55);
          setSyncStepText('Rastreando páginas e descobrindo catálogo...');
        }, 1200);

        setTimeout(() => {
          setSyncProgressPercent(78);
          setSyncStepText('Extraindo dados estruturados (Schema.org / JSON-LD / OpenGraph)...');
        }, 2200);

        const resSync = await fetch(`${API_BASE}/api/sources/${source.id}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const syncData = await resSync.json();
        if (!resSync.ok || !syncData.success) {
          throw new Error(syncData.error || 'Falha durante a sincronização do site.');
        }

        setSyncProgressPercent(100);
        setSyncStepText('Catálogo estruturado e sincronizado com o Multiplex!');
        setSyncDetailText(`${syncData.run?.items_found || 0} itens processados.`);

        await refreshSourcesAndCatalog();

        // Limpa campos e exibe resumo
        setNewSourceUrl('');
        setNewSourceName('');
        setShowAddSourceModal(false);
        setIsSyncingSourceId(null);

        setSyncSummaryData({
          sourceName: source.name,
          url: source.url,
          run: syncData.run,
          totalCatalog: syncData.total_catalog_items
        });
      } catch (err: any) {
        setIsSyncingSourceId(null);
        setSourceFormError(err.message || 'Erro ao sincronizar site.');
      }
    } else {
      // Outras fontes (Documento, Texto, Arquivo)
      try {
        const res = await fetch(`${API_BASE}/api/sources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `internal://${selectedSourceType.toLowerCase()}/${Date.now()}`,
            name: newSourceName.trim() || `Fonte ${selectedSourceType}`,
            source_type: selectedSourceType,
            auto_sync: false
          })
        });
        if (res.ok) {
          await refreshSourcesAndCatalog();
          setShowAddSourceModal(false);
          setNewSourceName('');
        }
      } catch (err: any) {
        setSourceFormError(err.message || 'Erro ao adicionar fonte.');
      }
    }
  };

  // Sincronizar agora manualmente
  const handleSyncSourceNow = async (source: any) => {
    try {
      setIsSyncingSourceId(source.id);
      setSyncProgressPercent(25);
      setSyncStepText('Iniciando sincronização incremental...');
      setSyncDetailText(source.url);

      setTimeout(() => {
        setSyncProgressPercent(65);
        setSyncStepText('Detectando alterações e calculando hashes...');
      }, 1000);

      const res = await fetch(`${API_BASE}/api/sources/${source.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro na sincronização.');
      }

      setSyncProgressPercent(100);
      setSyncStepText('Sincronização concluída com sucesso!');
      await refreshSourcesAndCatalog();

      setIsSyncingSourceId(null);
      setSyncSummaryData({
        sourceName: source.name,
        url: source.url,
        run: data.run,
        totalCatalog: data.total_catalog_items
      });
    } catch (err: any) {
      setIsSyncingSourceId(null);
      alert('Erro na sincronização: ' + err.message);
    }
  };

  // Alterar auto-sync
  const handleToggleAutoSync = async (source: any) => {
    try {
      const nextVal = !source.auto_sync;
      await fetch(`${API_BASE}/api/sources/${source.id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_sync: nextVal })
      });
      await refreshSourcesAndCatalog();
    } catch (err) {
      console.error(err);
    }
  };

  // Alterar frequência
  const handleChangeFrequency = async (source: any, freq: string) => {
    try {
      await fetch(`${API_BASE}/api/sources/${source.id}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_frequency: freq })
      });
      await refreshSourcesAndCatalog();
    } catch (err) {
      console.error(err);
    }
  };

  // Excluir fonte
  const handleDeleteSource = async (source: any) => {
    if (!confirm(`Deseja remover a fonte "${source.name}" e seus itens associados?`)) return;
    try {
      await fetch(`${API_BASE}/api/sources/${source.id}`, { method: 'DELETE' });
      await refreshSourcesAndCatalog();
    } catch (err) {
      console.error(err);
    }
  };

  // Abrir histórico de sincronizações
  const handleOpenHistory = async (source: any) => {
    try {
      setHistoryModalSource(source);
      setSelectedRunChanges([]);
      setSelectedRunId(null);
      const res = await fetch(`${API_BASE}/api/sources/${source.id}/runs`);
      if (res.ok) {
        const data = await res.json();
        setHistoryRuns(data.runs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Ver alterações de uma execução específica
  const handleSelectRunForChanges = async (runId: string) => {
    try {
      setSelectedRunId(runId);
      const res = await fetch(`${API_BASE}/api/sources/runs/${runId}/changes`);
      if (res.ok) {
        const data = await res.json();
        setSelectedRunChanges(data.changes || []);
      }
    } catch (err) {
      console.error(err);
    }
  };


  const filteredChats = chats.filter(c => {
    if (selectedFolderFilter && c.folderId !== selectedFolderFilter) return false;
    if (searchQuery.trim()) {
      return c.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const pinnedFolders = folders.filter(f => f.isPinned);
  const regularFolders = folders.filter(f => !f.isPinned);
  const pinnedChats = chats.filter(c => c.isPinned);

  // ── LANDING PAGE (primeira tela pública) ──
  if (!isAuthenticated && showLandingPage) {
    return (
      <LandingChatPage
        theme={theme}
        toggleTheme={toggleTheme}
        onLogin={() => {
          setShowLandingPage(false);
          setAuthMode('login');
        }}
        onRegister={() => {
          setShowLandingPage(false);
          setAuthMode('register');
          setAuthStep(1);
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-page-wrapper">
        {/* BARRA SUPERIOR DE NAVEGACAO */}
        <header 
          className="auth-top-navbar"
          style={{
            background: theme === 'light' ? '#ffffff' : 'rgba(10, 15, 29, 0.95)',
            borderBottom: theme === 'light' ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: theme === 'light' ? '0 2px 10px rgba(0, 0, 0, 0.05)' : undefined
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img 
              src={atomLogo} 
              alt="Multiplex" 
              style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(0, 210, 255, 0.4)', boxShadow: '0 0 12px rgba(0, 210, 255, 0.25)' }} 
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: theme === 'light' ? '#0f172a' : '#ffffff' }}>Multiplex</span>
                <span style={{ fontSize: '0.68rem', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.12)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>v1.2 GPT-4o</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: theme === 'light' ? '#475569' : '#94a3b8', fontWeight: 500 }}>Plataforma de Agentes Multicanal | BONASOFT</div>
            </div>
          </div>

          <div 
            className="auth-nav-tabs"
            style={{
              background: theme === 'light' ? '#f1f5f9' : 'rgba(15, 23, 42, 0.9)',
              border: theme === 'light' ? '1.5px solid #cbd5e1' : '1.5px solid rgba(255, 255, 255, 0.18)',
              boxShadow: theme === 'light' ? '0 2px 6px rgba(0,0,0,0.04)' : undefined
            }}
          >
            <button 
              className={`auth-nav-tab ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
              style={{
                color: authMode === 'login' ? '#ffffff' : (theme === 'light' ? '#0f172a' : '#f8fafc'),
                fontWeight: 700
              }}
            >
              <LogIn size={15} />
              <span>Entrar na Conta</span>
            </button>
            <button 
              className={`auth-nav-tab ${authMode === 'register' ? 'active' : ''}`}
              onClick={() => { setAuthMode('register'); setAuthError(null); }}
              style={{
                color: authMode === 'register' ? '#ffffff' : (theme === 'light' ? '#0f172a' : '#f8fafc'),
                fontWeight: 700
              }}
            >
              <UserPlus size={15} />
              <span>Criar Nova Conta</span>
            </button>
            <button 
              className={`auth-nav-tab ${authMode === 'plans' ? 'active' : ''}`}
              onClick={() => { setAuthMode('plans'); setAuthError(null); }}
              style={{
                color: authMode === 'plans' ? '#ffffff' : (theme === 'light' ? '#0f172a' : '#f8fafc'),
                fontWeight: 700
              }}
            >
              <Sparkles size={15} />
              <span>Escolha de Planos</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Botão voltar para Landing */}
            <button
              onClick={() => setShowLandingPage(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: theme === 'light' ? '#64748b' : '#94a3b8',
                fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s'
              }}
              title="Voltar para a página inicial"
            >
              <ArrowLeft size={14} />
              Início
            </button>

            <button 
              className="theme-circle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
              style={{
                background: theme === 'light' ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                border: theme === 'light' ? '1.5px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
                color: theme === 'light' ? '#0f172a' : '#ffffff',
                cursor: 'pointer'
              }}
            >
              {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
            </button>

            <button 
              className="btn-secondary"
              onClick={() => handleDemoAccess('Anthony Both', 'anthony@amboth.com.br', 'plan_pro')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                fontSize: '0.86rem', 
                padding: '9px 18px', 
                borderRadius: 10, 
                border: theme === 'light' ? '1.5px solid #6366f1' : '1px solid rgba(99, 102, 241, 0.5)', 
                background: theme === 'light' ? '#eef2ff' : 'rgba(99, 102, 241, 0.15)',
                color: theme === 'light' ? '#4338ca' : '#ffffff',
                fontWeight: 700
              }}
            >
              <span>Acessar Painel Direto</span>
              <ArrowRight size={15} color={theme === 'light' ? '#4338ca' : 'var(--accent-primary)'} />
            </button>
          </div>
        </header>


        {/* MODO 1: LOGIN (SPLIT SCREEN SAAS) */}
        {authMode === 'login' && (
          <div className="auth-split-layout">
            {/* LADO ESQUERDO: APRESENTACAO E PROVAS DE VALOR */}
            <div className="auth-hero-showcase">
              <div className="auth-hero-pill">
                <Sparkles size={13} />
                <span>Atendimento Automatizado de Alta Conversão</span>
              </div>

              <h1 className="auth-hero-title">
                O Cérebro de IA Multicanal para sua Empresa.
              </h1>

              <p className="auth-hero-desc">
                Atenda clientes no WhatsApp, Instagram e Telegram com respostas instantâneas, consulta automática ao catálogo de produtos e integração humanizada 24 horas por dia.
              </p>

              <div className="auth-feature-list">
                <div className="auth-feature-item">
                  <div className="auth-feature-icon">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>Multicanal Simultâneo</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Atenda no WhatsApp oficial, Instagram Direct e Telegram em tempo real sem filas.</div>
                  </div>
                </div>

                <div className="auth-feature-item">
                  <div className="auth-feature-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                    <UtensilsCrossed size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>Catálogo Inteligente com IA</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cole texto de produtos ou cardápios inteiros e a IA estrutura nomes, preços e categorias em 1 clique.</div>
                  </div>
                </div>

                <div className="auth-feature-item">
                  <div className="auth-feature-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>Handoff Seguro e Memória</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Transfira para atendentes humanos quando necessário com contexto de conversa preservado.</div>
                  </div>
                </div>
              </div>

            </div>

            {/* LADO DIREITO: FORMULARIO DE LOGIN */}
            <div className="auth-card-container">
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px 0' }}>Entrar na sua Conta</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Informe seus dados para acessar o painel do Multiplex.
                </p>
              </div>

              {authError && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.84rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
                    E-mail Comercial
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                    <input 
                      type="email" 
                      placeholder="seu.email@empresa.com.br"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      Senha de Acesso
                    </label>
                    <a href="#recuperar" onClick={(e) => { e.preventDefault(); alert('Instruções enviadas para o e-mail cadastrado.'); }} style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
                      Esqueceu a senha?
                    </a>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                    <input 
                      type="password" 
                      placeholder="••••••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0' }}>
                  <input type="checkbox" id="rememberMe" defaultChecked style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)' }} />
                  <label htmlFor="rememberMe" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    Permanecer conectado neste dispositivo
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={authLoading}
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 700, marginTop: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                >
                  {authLoading ? (
                    <>
                      <RefreshCw size={18} className="spin-animation" />
                      <span>Autenticando...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      <span>Entrar no Multiplex</span>
                    </>
                  )}
                </button>
              </form>

              <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Acesso Rápido de Testes</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleDemoAccess('Anthony Both', 'anthony@amboth.com.br', 'plan_pro')}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar-circle" style={{ width: 24, height: 24, fontSize: '0.7rem' }}>AN</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>Anthony Both</div>
                      <div style={{ fontSize: '0.7rem', color: '#10b981' }}>Plano Profissional (Ativo)</div>
                    </div>
                  </div>
                  <ChevronRight size={15} color="var(--text-muted)" />
                </button>

                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleDemoAccess('Convidado Teste', 'convidado@multiplex.ia', 'plan_basic')}
                  style={{ width: '100%', padding: '9px 12px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar-circle" style={{ width: 24, height: 24, fontSize: '0.7rem', background: '#0284c7' }}>CV</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600 }}>Explorar como Convidado</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Demonstração imediata</div>
                    </div>
                  </div>
                  <ChevronRight size={15} color="var(--text-muted)" />
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Ainda nao possui uma conta?{' '}
                <button 
                  onClick={() => { setAuthMode('register'); setAuthStep(1); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Cadastre-se e escolha um plano
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODO 2: CADASTRO COM ETAPAS E ESCOLHA DE PLANO */}
        {authMode === 'register' && (
          <div className={`auth-card-container ${authStep === 2 ? 'auth-card-wide' : ''}`} style={{ maxWidth: authStep === 2 ? 1160 : 540, margin: '30px auto' }}>
            {/* Indicador de Etapas */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div className="auth-step-pill">
                <span>{authStep === 1 ? 'Etapa 1 de 2: Dados da Conta' : 'Etapa 2 de 2: Escolha do Plano e Ativação'}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 32, height: 4, borderRadius: 2, background: 'var(--accent-primary)' }} />
                <div style={{ width: 32, height: 4, borderRadius: 2, background: authStep === 2 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)' }} />
              </div>
            </div>

            {authError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.84rem', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            {/* ETAPA 1: DADOS CADASTRAIS */}
            {authStep === 1 && (
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 6px 0' }}>Crie sua conta Multiplex</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
                  Preencha seus dados para configurar seu ambiente de atendimento automatizado.
                </p>

                <form onSubmit={(e) => { e.preventDefault(); if (!authName.trim() || !authEmail.trim()) { setAuthError('Nome e e-mail comercial sao obrigatorios.'); return; } setAuthError(null); setAuthStep(2); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
                      Nome Completo *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                      <input 
                        type="text" 
                        placeholder="Ex: Anthony Both"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
                      E-mail Comercial *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                      <input 
                        type="email" 
                        placeholder="contato@suaempresa.com.br"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
                        Nome da Empresa
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Building2 size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                        <input 
                          type="text" 
                          placeholder="Ex: Anthony Delivery"
                          value={authCompany}
                          onChange={(e) => setAuthCompany(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
                        WhatsApp / Celular
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                        <input 
                          type="text" 
                          placeholder="+55 11 99999-8888"
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-main)' }}>
                      Criar Senha de Acesso
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                      <input 
                        type="password" 
                        placeholder="Mínimo 6 caracteres"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 700, marginTop: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
                  >
                    <span>Continuar para Escolha do Plano</span>
                    <ArrowRight size={18} />
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 20, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Ja possui uma conta cadastrada?{' '}
                  <button 
                    onClick={() => setAuthMode('login')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Fazer Login
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 2: ESCOLHA DO PLANO */}
            {authStep === 2 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 6px 0' }}>Escolha o plano ideal para o seu negócio</h2>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                    Alterne ou cancele a qualquer momento sem fidelidade ou burocracia.
                  </p>
                </div>

                {/* Seletor Mensal / Anual */}
                <div className="auth-cycle-switch">
                  <span 
                    className={`auth-cycle-label ${authBillingCycle === 'monthly' ? 'active' : ''}`}
                    onClick={() => setAuthBillingCycle('monthly')}
                  >
                    Faturamento Mensal
                  </span>
                  <div 
                    onClick={() => setAuthBillingCycle(authBillingCycle === 'monthly' ? 'yearly' : 'monthly')}
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 12,
                      background: authBillingCycle === 'yearly' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: 3,
                      left: authBillingCycle === 'yearly' ? 23 : 3,
                      transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }} />
                  </div>
                  <span 
                    className={`auth-cycle-label ${authBillingCycle === 'yearly' ? 'active' : ''}`}
                    onClick={() => setAuthBillingCycle('yearly')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>Faturamento Anual</span>
                    <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>20% OFF</span>
                  </span>
                </div>

                {/* Grid de Planos */}
                <div className="auth-plans-grid">
                  {activePlansList.map(plan => {
                    const isSelected = authPlanId === plan.id;
                    const price = authBillingCycle === 'yearly' ? (plan.price_yearly_monthly || Math.round(plan.price_monthly * 0.8)) : plan.price_monthly;
                    return (
                      <div 
                        key={plan.id}
                        className={`auth-plan-box ${plan.popular ? 'popular' : ''} ${isSelected ? 'selected' : ''}`}
                        onClick={() => setAuthPlanId(plan.id)}
                      >
                        {plan.popular && (
                          <div className="auth-popular-tag">
                            <Star size={10} style={{ display: 'inline', marginRight: 4 }} />
                            Mais Popular
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{plan.name}</h3>
                          <div style={{ 
                            width: 20, 
                            height: 20, 
                            borderRadius: '50%', 
                            border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isSelected ? 'var(--accent-primary)' : 'transparent'
                          }}>
                            {isSelected && <Check size={12} color="#ffffff" />}
                          </div>
                        </div>

                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', minHeight: 38, margin: '0 0 14px 0' }}>
                          {plan.description}
                        </p>

                        <div style={{ marginBottom: 16 }}>
                          {plan.is_custom ? (
                            <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>Sob Consulta</div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>R$</span>
                              <span style={{ fontSize: '1.7rem', fontWeight: 800 }}>{price}</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ mes</span>
                            </div>
                          )}
                          {authBillingCycle === 'yearly' && !plan.is_custom && (
                            <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: 2 }}>Cobrado anualmente</div>
                          )}
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(plan.features || []).slice(0, 5).map((feat: string, fIdx: number) => (
                            <div key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.78rem', color: 'var(--text-main)' }}>
                              <CheckCircle2 size={13} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>

                        <button 
                          type="button"
                          className={isSelected ? 'btn-primary' : 'btn-secondary'}
                          style={{ width: '100%', marginTop: 18, padding: '9px', fontSize: '0.84rem', fontWeight: 600 }}
                          onClick={(e) => { e.stopPropagation(); setAuthPlanId(plan.id); }}
                        >
                          {isSelected ? 'Plano Selecionado' : 'Selecionar'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Resumo e Botoes de Acao */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-subtle)' }}>
                  <button 
                    type="button"
                    className="btn-secondary"
                    onClick={() => setAuthStep(1)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <ArrowLeft size={16} />
                    <span>Voltar para Dados</span>
                  </button>

                  <button 
                    type="button"
                    className="btn-primary"
                    disabled={authLoading}
                    onClick={handleRegister}
                    style={{ padding: '12px 28px', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {authLoading ? (
                      <>
                        <RefreshCw size={18} className="spin-animation" />
                        <span>Criando conta e ativando...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Finalizar Cadastro & Ativar Plano</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODO 3: ABA DE ESCOLHA DE PLANOS (VISAO COMPLETA DE PRECOS E RECURSOS) */}
        {authMode === 'plans' && (
          <div className="auth-card-container auth-card-wide">
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div className="auth-step-pill" style={{ marginBottom: 10 }}>
                <Sparkles size={14} />
                <span>Planos Transparentes e Escaláveis</span>
              </div>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 8px 0' }}>
                Escolha o plano perfeito para potencializar seu atendimento
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', maxWidth: 640, margin: '0 auto' }}>
                Ative agentes inteligentes em todos os seus canais, integre seu catálogo de produtos e atenda clientes 24h por dia.
              </p>
            </div>

            {/* Toggle de Ciclo de Cobrança */}
            <div 
              className="auth-cycle-switch"
              style={{
                background: theme === 'light' ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)',
                border: theme === 'light' ? '1.5px solid #cbd5e1' : '1px solid var(--border-subtle)'
              }}
            >
              <span 
                className={`auth-cycle-label ${authBillingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setAuthBillingCycle('monthly')}
                style={{
                  color: authBillingCycle === 'monthly' 
                    ? (theme === 'light' ? '#0f172a' : '#ffffff') 
                    : (theme === 'light' ? '#64748b' : 'var(--text-muted)'),
                  fontWeight: authBillingCycle === 'monthly' ? 800 : 600
                }}
              >
                Faturamento Mensal
              </span>
              <div 
                onClick={() => setAuthBillingCycle(authBillingCycle === 'monthly' ? 'yearly' : 'monthly')}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: authBillingCycle === 'yearly' ? '#6366f1' : (theme === 'light' ? '#94a3b8' : 'rgba(255,255,255,0.25)'),
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: 3,
                  left: authBillingCycle === 'yearly' ? 23 : 3,
                  transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }} />
              </div>
              <span 
                className={`auth-cycle-label ${authBillingCycle === 'yearly' ? 'active' : ''}`}
                onClick={() => setAuthBillingCycle('yearly')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6,
                  color: authBillingCycle === 'yearly' 
                    ? (theme === 'light' ? '#0f172a' : '#ffffff') 
                    : (theme === 'light' ? '#64748b' : 'var(--text-muted)'),
                  fontWeight: authBillingCycle === 'yearly' ? 800 : 600
                }}
              >
                <span>Faturamento Anual</span>
                <span style={{ fontSize: '0.72rem', color: '#059669', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>20% OFF</span>
              </span>
            </div>

            {/* Grid dos 4 Planos */}
            <div className="auth-plans-grid">
              {activePlansList.map(plan => {
                const price = authBillingCycle === 'yearly' ? (plan.price_yearly_monthly || Math.round(plan.price_monthly * 0.8)) : plan.price_monthly;
                return (
                  <div 
                    key={plan.id}
                    className={`auth-plan-box ${plan.popular ? 'popular' : ''}`}
                    style={{
                      background: theme === 'light' ? '#ffffff' : undefined,
                      border: theme === 'light' 
                        ? (plan.popular ? '2px solid #6366f1' : '1.5px solid #cbd5e1') 
                        : undefined,
                      color: theme === 'light' ? '#0f172a' : undefined
                    }}
                  >
                    {plan.popular && (
                      <div className="auth-popular-tag">
                        <Star size={10} style={{ display: 'inline', marginRight: 4 }} />
                        Mais Escolhido
                      </div>
                    )}

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0', color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>{plan.name}</h3>
                    <p style={{ fontSize: '0.84rem', color: theme === 'light' ? '#334155' : 'var(--text-muted)', minHeight: 42, margin: '0 0 16px 0', fontWeight: 500, lineHeight: 1.4 }}>
                      {plan.description}
                    </p>

                    <div style={{ marginBottom: 18 }}>
                      {plan.is_custom ? (
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>Sob Consulta</div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#475569' : 'var(--text-muted)' }}>R$</span>
                          <span style={{ fontSize: '2.2rem', fontWeight: 900, color: theme === 'light' ? '#0f172a' : '#ffffff' }}>{price}</span>
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: theme === 'light' ? '#475569' : 'var(--text-muted)' }}>/ mes</span>
                        </div>
                      )}
                      {authBillingCycle === 'yearly' && !plan.is_custom && (
                        <div style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, marginTop: 2 }}>Faturado anualmente com 20% de desconto</div>
                      )}
                    </div>

                    <button 
                      className="btn-primary"
                      style={{ 
                        width: '100%', 
                        padding: '11px', 
                        fontWeight: 700, 
                        marginBottom: 18,
                        background: plan.popular ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : undefined 
                      }}
                      onClick={() => {
                        setAuthPlanId(plan.id);
                        setAuthMode('register');
                        setAuthStep(1);
                      }}
                    >
                      <span>Começar com {plan.name}</span>
                    </button>

                    <div style={{ borderTop: theme === 'light' ? '1.5px solid #e2e8f0' : '1px solid var(--border-subtle)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: theme === 'light' ? '#0f172a' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        O que esta incluso:
                      </div>
                      {(plan.features || []).map((feat: string, fIdx: number) => (
                        <div key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: theme === 'light' ? '#0f172a' : 'var(--text-main)', fontWeight: 500 }}>
                          <CheckCircle2 size={15} color={theme === 'light' ? '#059669' : 'var(--accent-primary)'} style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodapé com Garantia e Suporte */}
            <div style={{ 
              marginTop: 28, 
              padding: '18px 22px', 
              borderRadius: 14, 
              background: theme === 'light' ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)', 
              border: theme === 'light' ? '1.5px solid #cbd5e1' : '1px solid var(--border-subtle)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              flexWrap: 'wrap', 
              gap: 16 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ShieldCheck size={26} color="#6366f1" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>Garantia de Satisfação de 7 Dias</div>
                  <div style={{ fontSize: '0.82rem', color: theme === 'light' ? '#334155' : 'var(--text-muted)', fontWeight: 500 }}>Teste sem compromisso. Cancele com 1 clique se não atender suas expectativas.</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  className="btn-secondary"
                  onClick={() => setAuthMode('login')}
                  style={{ 
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    color: theme === 'light' ? '#0f172a' : undefined,
                    border: theme === 'light' ? '1.5px solid #cbd5e1' : undefined
                  }}
                >
                  Já sou cliente, fazer Login
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => handleDemoAccess('Anthony Both', 'anthony@amboth.com.br', 'plan_pro')}
                  style={{ fontSize: '0.86rem', fontWeight: 700 }}
                >
                  Acessar Painel Agora
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── BONASOFT Watermark ── */}
        <div className="bonasoft-watermark-container" style={{ padding: '24px 0 16px 0' }}>
          <p className="bonasoft-watermark">BONASOFT</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* BARRA LATERAL */}
      {!sidebarCollapsed && activeView !== 'chat' && (
        <aside className="sidebar">
          {/* Cabecalho */}
          <div className="chatgpt-sidebar-header">
            <div className="chatgpt-brand" onClick={() => setActiveView('chat')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={atomLogo} alt="Multiplex" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(0, 210, 255, 0.4)' }} />
              <span>Multiplex</span>
            </div>
            <div className="chatgpt-header-actions">
              <button 
                className="icon-btn" 
                title="Pesquisar conversas"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search size={17} />
              </button>
              <button 
                className="icon-btn" 
                title="Recolher barra lateral"
                onClick={() => setSidebarCollapsed(true)}
              >
                <PanelLeft size={17} />
              </button>
            </div>
          </div>

          {/* Busca */}
          {showSearch && (
            <input 
              type="text" 
              className="chat-search-input"
              placeholder="Buscar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          )}

          {/* Navegacao Principal */}
          <div className="sidebar-scrollable">
            <div className="sidebar-section">
              {/* 1. DASHBOARD (PRIMEIRA ABA OBRIGATÓRIA) */}
              <div 
                className={`sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveView('dashboard')}
              >
                <div className="item-main">
                  <LayoutDashboard size={17} color="var(--accent-primary)" />
                  <span style={{ fontWeight: 600 }}>Dashboard</span>
                </div>
              </div>

              {/* 2. NOVO CHAT */}
              <div 
                className="sidebar-item"
                onClick={handleCreateNewChat}
              >
                <div className="item-main">
                  <Edit3 size={17} color="var(--accent-cyan)" />
                  <span>Novo chat</span>
                </div>
              </div>

              {/* 3. ENSINAR IA */}
              <div 
                className={`sidebar-item ${activeView === 'teach' ? 'active' : ''}`}
                onClick={() => setActiveView('teach')}
              >
                <div className="item-main">
                  <Sparkles size={17} color="var(--accent-primary)" />
                  <span>Ensinar IA</span>
                </div>
              </div>

              {/* 4. AI APP BUILDER (CRIAR COM IA) */}
              <div 
                className={`sidebar-item ${activeView === 'builder' ? 'active' : ''}`}
                onClick={() => setActiveView('builder')}
                style={{ 
                  background: activeView === 'builder' ? 'rgba(99, 102, 241, 0.15)' : undefined,
                  border: activeView === 'builder' ? '1px solid rgba(99, 102, 241, 0.3)' : undefined
                }}
              >
                <div className="item-main">
                  <div style={{ width: 18, height: 18, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(0, 210, 255, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <img src={atomLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Criar com IA</span>
                </div>
                <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: 4, background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', fontWeight: 800 }}>NOVO</span>
              </div>

              {/* 5. CATÁLOGO, PRODUTOS E IMÓVEIS */}
              <div 
                className={`sidebar-item ${activeView === 'menu' ? 'active' : ''}`}
                onClick={() => setActiveView('menu')}
              >
                <div className="item-main">
                  <UtensilsCrossed size={17} color="var(--accent-amber)" />
                  <span>Catálogo, Produtos e Imóveis</span>
                </div>
                {products.length > 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{products.length}</span>
                )}
              </div>

              {/* 6. PERSONALIDADE E REGRAS */}
              <div 
                className={`sidebar-item ${activeView === 'personality' ? 'active' : ''}`}
                onClick={() => setActiveView('personality')}
              >
                <div className="item-main">
                  <Sliders size={17} color="var(--accent-cyan)" />
                  <span>Personalidade e Regras</span>
                </div>
                {rules.length > 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{rules.length}</span>
                )}
              </div>

              {/* 7. BASE DE CONHECIMENTO */}
              <div 
                className={`sidebar-item ${activeView === 'knowledge' ? 'active' : ''}`}
                onClick={() => setActiveView('knowledge')}
              >
                <div className="item-main">
                  <BookOpen size={17} color="var(--accent-purple)" />
                  <span>Base de Conhecimento</span>
                </div>
              </div>

              {/* 8. CONECTAR CANAIS */}
              <div 
                className={`sidebar-item ${activeView === 'channels' ? 'active' : ''}`}
                onClick={() => setActiveView('channels')}
              >
                <div className="item-main">
                  <Smartphone size={17} color="var(--accent-emerald)" />
                  <span>Conectar Canais</span>
                </div>
              </div>

              {/* 9. PLAYGROUND DE TESTES */}
              <div 
                className={`sidebar-item ${activeView === 'playground' ? 'active' : ''}`}
                onClick={() => setActiveView('playground')}
              >
                <div className="item-main">
                  <PlayCircle size={17} color="var(--accent-rose)" />
                  <span>Playground de Testes</span>
                </div>
              </div>
            </div>

            {/* MODULOS CRIADOS COM IA (NAVEGACAO DINAMICA - SECTION 33) */}
            {sidebarModules.length > 0 && (
              <div className="sidebar-section">
                <div className="sidebar-section-header">
                  <span>Módulos com IA ({sidebarModules.length})</span>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={atomLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
                {sidebarModules.map(mod => (
                  <div 
                    key={mod.id}
                    className={`sidebar-item ${activeView === 'dynamic_module' && currentDynamicModule?.id === mod.id ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentDynamicModule(mod);
                      setActiveView('dynamic_module');
                    }}
                    style={{
                      background: activeView === 'dynamic_module' && currentDynamicModule?.id === mod.id ? 'rgba(99, 102, 241, 0.15)' : undefined
                    }}
                  >
                    <div className="item-main">
                      <LayoutDashboard size={16} color="#818cf8" />
                      <span>{mod.name}</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 4, marginRight: 4 }}>
                      v{mod.version}
                    </span>
                    <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="item-action-btn"
                        title="Excluir este módulo"
                        onClick={() => setDeleteConfirmTarget({ type: 'module', id: mod.id, title: mod.name })}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SECAO FIXADA */}
            <div className="sidebar-section">
              <div className="sidebar-section-header">
                <span>Fixada</span>
                {(pinnedFolders.length > 0 || pinnedChats.length > 0) && (
                  <Pin size={12} color="var(--accent-amber)" />
                )}
              </div>

              {/* Pastas Fixadas */}
              {pinnedFolders.map(folder => (
                <div 
                  key={folder.id} 
                  className={`sidebar-item ${selectedFolderFilter === folder.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFolderFilter(selectedFolderFilter === folder.id ? null : folder.id);
                    setActiveView('chat');
                  }}
                >
                  <div className="item-main">
                    <Folder size={16} color="var(--accent-amber)" />
                    <span>{folder.name}</span>
                  </div>
                  <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="item-action-btn" 
                      title="Desafixar pasta"
                      onClick={() => handleTogglePinFolder(folder.id)}
                    >
                      <PinOff size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Chats Fixados */}
              {pinnedChats.map(chat => (
                <div 
                  key={chat.id} 
                  className={`sidebar-item ${activeChatId === chat.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setActiveView('chat');
                  }}
                >
                  <div className="item-main">
                    <MessageSquare size={16} color="var(--accent-primary)" />
                    <span>{chat.title}</span>
                  </div>
                  <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="item-action-btn" 
                      title="Desafixar chat"
                      onClick={() => handleTogglePinChat(chat.id)}
                    >
                      <PinOff size={13} />
                    </button>
                    <button 
                      className="item-action-btn" 
                      title="Excluir chat"
                      onClick={() => handleDeleteChat(chat.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {pinnedFolders.length === 0 && pinnedChats.length === 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', padding: '4px 10px' }}>
                  Nenhum item fixado.
                </div>
              )}
            </div>

            {/* SECAO PROJETOS (PASTAS) */}
            <div className="sidebar-section">
              <div className="sidebar-section-header">
                <span>Projetos</span>
                <button 
                  className="item-action-btn" 
                  title="Criar nova pasta"
                  onClick={() => setIsCreatingFolder(true)}
                  style={{ color: 'var(--accent-cyan)' }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {isCreatingFolder && (
                <div style={{ display: 'flex', gap: 4, padding: '4px 8px' }}>
                  <input 
                    type="text" 
                    placeholder="Nome da pasta..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateFolder();
                      if (e.key === 'Escape') setIsCreatingFolder(false);
                    }}
                    autoFocus
                    style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                  />
                  <button className="item-action-btn" onClick={handleCreateFolder}><Check size={14} color="#10b981" /></button>
                  <button className="item-action-btn" onClick={() => setIsCreatingFolder(false)}><X size={14} color="#ef4444" /></button>
                </div>
              )}

              {selectedFolderFilter && (
                <div 
                  className="sidebar-item"
                  style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem' }}
                  onClick={() => setSelectedFolderFilter(null)}
                >
                  <div className="item-main">
                    <X size={14} />
                    <span>Ver todas as conversas</span>
                  </div>
                </div>
              )}

              {regularFolders.map(folder => (
                <div 
                  key={folder.id} 
                  className={`sidebar-item ${selectedFolderFilter === folder.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFolderFilter(selectedFolderFilter === folder.id ? null : folder.id);
                    setActiveView('chat');
                  }}
                >
                  <div className="item-main">
                    <Folder size={16} color={selectedFolderFilter === folder.id ? 'var(--accent-primary)' : 'var(--text-dim)'} />
                    {editingFolderId === folder.id ? (
                      <input 
                        type="text"
                        value={editFolderName}
                        onChange={(e) => setEditFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameFolder(folder.id);
                          if (e.key === 'Escape') setEditingFolderId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{ padding: '2px 6px', fontSize: '0.8rem' }}
                      />
                    ) : (
                      <span>{folder.name}</span>
                    )}
                  </div>

                  <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="item-action-btn" 
                      title="Fixar"
                      onClick={() => handleTogglePinFolder(folder.id)}
                    >
                      <Pin size={13} />
                    </button>
                    <button 
                      className="item-action-btn" 
                      title="Renomear"
                      onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name); }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button 
                      className="item-action-btn" 
                      title="Excluir"
                      onClick={() => handleDeleteFolder(folder.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}

              <div 
                className="sidebar-item" 
                style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}
                onClick={() => setIsCreatingFolder(true)}
              >
                <div className="item-main">
                  <FolderPlus size={15} />
                  <span>Nova pasta</span>
                </div>
              </div>
            </div>

            {/* SECAO CHATS */}
            <div className="sidebar-section">
              <div className="sidebar-section-header">
                <span>Chats {selectedFolderFilter ? `(${folders.find(f => f.id === selectedFolderFilter)?.name})` : ''}</span>
                {chats.length > 1 && (
                  <button 
                    className="item-action-btn" 
                    title="Limpar todos os chats"
                    onClick={handleClearAllChats}
                    style={{ fontSize: '0.7rem' }}
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>

              {filteredChats.map(chat => (
                <div 
                  key={chat.id} 
                  className={`sidebar-item ${activeChatId === chat.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setActiveView('chat');
                  }}
                >
                  <div className="item-main">
                    {editingChatId === chat.id ? (
                      <input 
                        type="text"
                        value={editChatTitle}
                        onChange={(e) => setEditChatTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameChat(chat.id);
                          if (e.key === 'Escape') setEditingChatId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{ padding: '2px 6px', fontSize: '0.8rem' }}
                      />
                    ) : (
                      <span>{chat.title}</span>
                    )}
                  </div>

                  {chat.isPinned && (
                    <Pin size={12} className="item-pin-badge" />
                  )}

                  <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="item-action-btn" 
                      title={chat.isPinned ? "Desafixar" : "Fixar no topo"}
                      onClick={() => handleTogglePinChat(chat.id)}
                    >
                      <Pin size={13} color={chat.isPinned ? "var(--accent-amber)" : undefined} />
                    </button>

                    {folders.length > 0 && (
                      <button 
                        className="item-action-btn" 
                        title="Mover para pasta"
                        onClick={() => setChatFolderMenuId(chatFolderMenuId === chat.id ? null : chat.id)}
                      >
                        <Folder size={13} />
                      </button>
                    )}

                    <button 
                      className="item-action-btn" 
                      title="Renomear"
                      onClick={() => { setEditingChatId(chat.id); setEditChatTitle(chat.title); }}
                    >
                      <Edit3 size={13} />
                    </button>

                    <button 
                      className="item-action-btn" 
                      title="Excluir este chat"
                      onClick={() => handleDeleteChat(chat.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Menu Mover para Pasta */}
                  {chatFolderMenuId === chat.id && (
                    <div 
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        left: 10,
                        right: 10,
                        zIndex: 100,
                        padding: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', padding: '2px 6px' }}>
                        Mover para Pasta:
                      </div>
                      <div 
                        className="sidebar-item" 
                        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                        onClick={() => handleMoveChatToFolder(chat.id, null)}
                      >
                        <span>Sem pasta (Raiz)</span>
                      </div>
                      {folders.map(f => (
                        <div 
                          key={f.id} 
                          className="sidebar-item"
                          style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                          onClick={() => handleMoveChatToFolder(chat.id, f.id)}
                        >
                          <Folder size={13} />
                          <span>{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Rodape com Perfil ChatGPT-style e sem informacao do n8n */}
          <div className="chatgpt-user-footer" style={{ position: 'relative' }}>
            {/* Popover flutuante estilo ChatGPT */}
            {showUserPopup && (
              <div className="user-popup-container" onClick={(e) => e.stopPropagation()}>
                <div 
                  className="user-popup-header"
                  onClick={() => {
                    setProfileActiveTab('personal');
                    setShowProfileModal(true);
                    setShowUserPopup(false);
                  }}
                >
                  <div className="avatar-circle">{currentUser?.avatar_initials || 'AN'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.name || 'Anthony Both'}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{billingData?.plan?.name || 'Profissional'}</div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>

                <div className="user-popup-divider" />

                <button 
                  className="user-popup-item"
                  onClick={() => {
                    setProfileActiveTab('plan');
                    setShowProfileModal(true);
                    setShowUserPopup(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Sparkles size={16} color="var(--accent-primary)" />
                    <span>Plano e Mensalidade</span>
                  </div>
                </button>

                <button 
                  className="user-popup-item"
                  onClick={() => {
                    handleLogout();
                    setAuthMode('plans');
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CreditCard size={16} color="var(--accent-cyan)" />
                    <span>Aba de Escolha de Planos</span>
                  </div>
                </button>

                <button 
                  className="user-popup-item"
                  onClick={() => {
                    setActiveView('personality');
                    setShowUserPopup(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Sliders size={16} />
                    <span>Personalização</span>
                  </div>
                </button>

                <button 
                  className="user-popup-item"
                  onClick={() => {
                    setProfileActiveTab('personal');
                    setShowProfileModal(true);
                    setShowUserPopup(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <User size={16} />
                    <span>Perfil</span>
                  </div>
                </button>

                <button 
                  className="user-popup-item"
                  onClick={() => {
                    setProfileActiveTab('security');
                    setShowProfileModal(true);
                    setShowUserPopup(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Settings size={16} />
                    <span>Configurações</span>
                  </div>
                </button>

                <div className="user-popup-divider" />

                <div style={{ position: 'relative' }} onMouseEnter={() => setShowHelpSubmenu(true)} onMouseLeave={() => setShowHelpSubmenu(false)}>
                  <button className="user-popup-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <HelpCircle size={16} />
                      <span>Ajuda</span>
                    </div>
                    <ChevronRight size={14} color="var(--text-dim)" />
                  </button>

                  {showHelpSubmenu && (
                    <div className="user-popup-submenu">
                      <button className="user-popup-item" onClick={() => { setActiveView('chat'); setShowUserPopup(false); }}>
                        <span>Central de ajuda</span>
                      </button>
                      <button className="user-popup-item" onClick={() => alert('Multiplex v1.2.0 - GPT-4o')}>
                        <span>Notas de versão</span>
                      </button>
                      <button className="user-popup-item" onClick={() => alert('Termos de uso da plataforma')}>
                        <span>Termos de uso</span>
                      </button>
                      <button className="user-popup-item" onClick={() => alert('Política de privacidade e proteção de dados')}>
                        <span>Política de Privacidade</span>
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  className="user-popup-item"
                  style={{ color: '#ef4444' }}
                  onClick={() => {
                    setConfirmModal({ type: 'logout' });
                    setShowUserPopup(false);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <LogOut size={16} />
                    <span>Sair</span>
                  </div>
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
              <div 
                className="user-profile-row" 
                style={{ flex: 1, padding: 0, cursor: 'pointer' }}
                onClick={() => setShowUserPopup(!showUserPopup)}
                title="Clique para abrir opções do Perfil e Assinatura"
              >
                <div className="avatar-circle">{currentUser?.avatar_initials || 'AN'}</div>
                <div>
                  <div className="user-name">{currentUser?.name || 'Anthony Both'}</div>
                  <div className="user-plan" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{billingData?.plan?.name || 'Profissional'}</span>
                    <span style={{ fontSize: '0.65rem', color: '#10b981' }}>● Ativo</span>
                  </div>
                </div>
              </div>

              {/* Apenas a bolinha com sol e lua para alternar o tema */}
              <button 
                className="theme-circle-btn"
                onClick={toggleTheme}
                title={theme === 'dark' ? "Modo Claro" : "Modo Escuro"}
              >
                {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* AREA PRINCIPAL: CHAT OU TELAS */}
      {activeView === 'chat' && (
        <main className="relative flex min-h-0 flex-1 flex-col bg-background text-foreground">
          <header className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-7">
            <Button variant="ghost" size="icon" title="Abrir conversas" aria-label="Abrir conversas" onClick={() => setChatNavigationOpen(true)} className="rounded-lg text-muted-foreground hover:text-foreground">
              <PanelLeft />
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" title="Exportar conversa" onClick={handleExportConversation} className="rounded-lg text-muted-foreground hover:text-foreground">
                <Download />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Limpar conversa"
                className="rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => {
                  if (currentChat?.messages.length && confirm('Deseja limpar as mensagens desta conversa?')) {
                    setChats(chats.map((chat) => chat.id === currentChat.id ? { ...chat, messages: [] } : chat));
                  }
                }}
              >
                <Trash2 />
              </Button>
              <Button variant="ghost" size="icon" title="Nova conversa" onClick={handleCreateNewChat} className="rounded-lg text-muted-foreground hover:text-foreground">
                <Plus />
              </Button>
            </div>
          </header>

          {chatNavigationOpen && (
            <>
              <button type="button" className="absolute inset-0 z-40 bg-overlay backdrop-blur-sm" onClick={() => setChatNavigationOpen(false)} aria-label="Fechar navegação" />
              <aside className="absolute inset-y-0 left-0 z-50 flex w-[min(88vw,320px)] flex-col border-r border-border bg-popover/95 p-4 shadow-2xl backdrop-blur-2xl">
                <div className="mb-8 flex items-center justify-between px-1">
                  <span className="font-display text-base font-semibold">Multiplex</span>
                  <Button variant="ghost" size="icon" onClick={() => setChatNavigationOpen(false)} aria-label="Fechar"><X /></Button>
                </div>
                <Button variant="secondary" className="justify-start" onClick={() => { handleCreateNewChat(); setChatNavigationOpen(false); }}>
                  <Plus /> Novo chat
                </Button>
                <div className="mt-7 flex items-center gap-2 px-2 text-xs font-medium text-muted-foreground"><HistoryIcon className="size-4" /> Conversas</div>
                <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto">
                  {filteredChats.map((chat) => (
                    <Button key={chat.id} variant={activeChatId === chat.id ? 'secondary' : 'ghost'} className="w-full justify-start truncate" onClick={() => { setActiveChatId(chat.id); setChatNavigationOpen(false); }}>
                      <MessageSquare className="size-4 shrink-0" /><span className="truncate">{chat.title}</span>
                    </Button>
                  ))}
                </div>
                <Button variant="ghost" className="justify-start text-muted-foreground" onClick={() => { setChatNavigationOpen(false); setActiveView('dashboard'); setSidebarCollapsed(false); }}>
                  <LayoutDashboard /> Painel da empresa
                </Button>
              </aside>
            </>
          )}

          <Conversation className="min-h-0">
            <ConversationContent className="mx-auto min-h-full w-full max-w-3xl gap-9 px-4 py-8 sm:px-6">
              {currentChat && currentChat.messages.length === 0 ? (
                <ConversationEmptyState className="min-h-[62vh] p-4 animate-chat-enter">
                  <div className="mb-3 grid size-10 place-items-center rounded-xl border border-primary/25 bg-primary/10 shadow-glow"><span className="size-2 rounded-full bg-primary" /></div>
                  <h1 className="font-display text-3xl font-medium sm:text-4xl">O que vamos fazer?</h1>
                </ConversationEmptyState>
              ) : (
                currentChat?.messages.map((msg) => (
                  <Message key={msg.id} from={msg.role}>
                    <MessageContent className="text-[0.95rem] leading-7">
                      {msg.role === 'assistant' ? <MessageResponse>{msg.content}</MessageResponse> : msg.content}

                      {msg.toolsUsed?.map((toolCall, index) => (
                        <Tool key={`${msg.id}-${index}`} defaultOpen={false}>
                          <ToolHeader
                            type="dynamic-tool"
                            toolName={toolCall.tool}
                            title={toolCall.tool}
                            state="output-available"
                          />
                          <ToolContent>
                            <ToolInput input={toolCall.input ?? {}} />
                            <ToolOutput output={toolCall.result} errorText={undefined} />
                          </ToolContent>
                        </Tool>
                      ))}

                      {msg.catalogCards && msg.catalogCards.length > 0 && (
                        <div className="mt-3 grid gap-2">
                          {msg.catalogCards.map((card: any, cardIndex: number) => (
                            <article key={card.id || cardIndex} className="flex gap-3 rounded-md border border-border bg-card p-3 text-card-foreground">
                              {(card.image || card.images?.[0]) && (
                                <img
                                  src={card.image || card.images[0]}
                                  alt={card.name || 'Item'}
                                  className="size-16 shrink-0 rounded-md object-cover"
                                  loading="lazy"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <strong className="text-sm">{card.name}</strong>
                                  <span className="whitespace-nowrap text-sm font-semibold text-primary">
                                    {card.formatted_price || (card.price ? `R$ ${Number(card.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sob consulta')}
                                  </span>
                                </div>
                                {card.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{card.description}</p>}
                                {card.source_url && (
                                  <Button className="mt-2" size="sm" variant="outline" onClick={() => handleCatalogClick(card.id, card.source_url, card.name)}>
                                    <ExternalLink />
                                    Abrir
                                  </Button>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </MessageContent>

                    {msg.role === 'assistant' && (
                      <MessageActions>
                        <MessageAction tooltip="Copiar" onClick={() => handleCopyMessage(msg.id, msg.content)}>
                          {copiedMsgId === msg.id ? <Check /> : <Copy />}
                        </MessageAction>
                        <MessageAction tooltip="Ouvir" onClick={() => handleSpeakMessage(msg.id, msg.content)}>
                          {speakingMsgId === msg.id ? <VolumeX /> : <Volume2 />}
                        </MessageAction>
                        <MessageAction tooltip="Resposta útil" onClick={() => handleFeedback(msg.id, 'liked')}>
                          <ThumbsUp />
                        </MessageAction>
                        <MessageAction tooltip="Resposta ruim" onClick={() => handleFeedback(msg.id, 'disliked')}>
                          <ThumbsDown />
                        </MessageAction>
                        <MessageAction tooltip="Gerar novamente" onClick={handleRegenerateLastMessage}>
                          <RefreshCw />
                        </MessageAction>
                      </MessageActions>
                    )}
                  </Message>
                ))
              )}

              {isSendingMessage && (
                <Message from="assistant">
                  <MessageContent><Shimmer>Processando...</Shimmer></MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="shrink-0 bg-background px-4 pb-5 pt-2 sm:px-6">
            <div className="mx-auto w-full max-w-3xl">
              {attachedFile && (
                <div className="mb-2 flex items-center justify-between rounded-md border border-border bg-muted px-3 py-2 text-xs">
                  <span className="truncate"><Paperclip className="mr-2 inline size-3.5" />{attachedFile.name}</span>
                  <Button variant="ghost" size="icon-sm" title="Remover anexo" onClick={() => setAttachedFile(null)}><X /></Button>
                </div>
              )}
              <PromptInput className="multiplex-composer" onSubmit={() => handleSendMessage()}>
                <PromptInputTextarea
                  autoFocus
                  className="min-h-24 px-5 pt-5 text-[15px] leading-6 sm:min-h-28"
                  disabled={isSendingMessage}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Mensagem para a Multiplex"
                  value={chatInput}
                />
                <PromptInputFooter className="px-3 pb-3">
                  <div className="flex items-center gap-1">
                    <PromptInputButton title="Anexar arquivo" onClick={() => setShowAttachModal(true)} className="text-muted-foreground hover:text-foreground"><Paperclip /></PromptInputButton>
                    <PromptInputButton title="Ditar por voz" onClick={handleToggleVoiceRecording} className="text-muted-foreground hover:text-foreground">{isRecordingVoice ? <MicOff /> : <Mic />}</PromptInputButton>
                  </div>
                  <PromptInputSubmit className="size-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" disabled={!chatInput.trim() || isSendingMessage} status={isSendingMessage ? 'submitted' : 'ready'}>{!isSendingMessage && <ArrowUp />}</PromptInputSubmit>
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </main>
      )}

      {/* MODAL: ANEXAR DOCUMENTO OU CARDAPIO (SIMULADOR INTELIGENTE) */}
      {showAttachModal && (
        <div className="modal-backdrop" onClick={() => setShowAttachModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Paperclip size={20} color="var(--accent-cyan)" />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Anexar Arquivo para o Multiplex</h2>
              </div>
              <button onClick={() => setShowAttachModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 20 }}>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                Envie fotos de cardápios impressos, tabelas de preços ou documentos em PDF para que o Multiplex analise e integre automaticamente.
              </p>

              <div 
                style={{ 
                  border: '2px dashed var(--border-subtle)', 
                  borderRadius: 12, 
                  padding: 32, 
                  textAlign: 'center', 
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer',
                  marginBottom: 16
                }}
                onClick={() => {
                  setAttachedFile({ name: 'cardapio_completo_atualizado.pdf', size: '1.4 MB' });
                  setChatInput('Analise este cardápio anexo e me informe os itens de maior margem de lucro.');
                  setShowAttachModal(false);
                }}
              >
                <FileText size={36} color="var(--accent-primary)" style={{ margin: '0 auto 12px auto' }} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>Clique para carregar cardápio ou PDF</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Suporta imagens (PNG, JPG) e documentos (PDF, XLSX)</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn-secondary" onClick={() => setShowAttachModal(false)}>Cancelar</button>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    setAttachedFile({ name: 'tabela_precos_2026.png', size: '820 KB' });
                    setChatInput('Extraia os preços e produtos desta foto.');
                    setShowAttachModal(false);
                  }}
                >
                  <Check size={16} /> Simular Anexo Rápido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* TELA: ENSINAR IA */}
      {activeView === 'teach' && (
        <div className="main-panel-scrollable">
          <div className="page-header" style={{ marginBottom: 0 }}>
            <div>
              <h1 className="page-title" style={{ fontSize: '1.3rem' }}>Ensinar IA</h1>
              <p className="page-desc" style={{ fontSize: '0.8rem' }}>Ensine novos produtos, regras, horários ou preços em linguagem natural.</p>
            </div>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setActiveView('chat')}>
              <MessageSquare size={14} /> Voltar ao Chat
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, height: 'calc(100vh - 130px)', minHeight: '340px', maxHeight: '450px' }}>
            <div className="glass-panel" style={{ padding: 14, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 8 }}>Treinamento Conversacional</h2>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                {teachChat.map((m, idx) => (
                  <div key={idx} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{
                      background: m.sender === 'user' ? 'var(--accent-primary)' : 'var(--bg-card-inner)',
                      color: m.sender === 'user' ? '#fff' : 'var(--text-main)',
                      padding: '8px 12px',
                      borderRadius: 14,
                      fontSize: '0.84rem',
                      border: m.sender === 'agent' ? '1px solid var(--border-subtle)' : 'none'
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input 
                  type="text" 
                  placeholder="Ex: O combo especial custa R$ 35,00..."
                  value={teachInput}
                  onChange={(e) => setTeachInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendTeach()}
                  style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                />
                <button className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem' }} onClick={handleSendTeach}>
                  <Send size={14} /> Ensinar
                </button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 14, overflowY: 'auto', height: '100%' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 8 }}>Conhecimento Estruturado ({structuredHistory.length})</h2>
              {structuredHistory.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', padding: '10px 0' }}>Nenhum item estruturado ainda. Use o chat para ensinar o Multiplex.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {structuredHistory.map(item => (
                    <div key={item.id} className="glass-card" style={{ padding: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.82rem' }}>
                        <span>{item.subject}</span>
                        <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-cyan)', fontSize: '0.68rem', padding: '2px 6px' }}>{item.item_type}</span>
                      </div>
                      <pre style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(item.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TELA: CATÁLOGO, PRODUTOS E IMÓVEIS */}
      {activeView === 'menu' && (
        <div className="main-panel-scrollable">
          <div className="page-header" style={{ marginBottom: 16 }}>
            <div>
              <h1 className="page-title">Catálogo, Produtos e Imóveis</h1>
              <p className="page-desc">Importe produtos, imóveis e catálogo completo direto do site do cliente via URL ou colando texto. A Multiplex extrai e cadastra tudo automaticamente.</p>
            </div>
            <button className="btn-secondary" onClick={() => setActiveView('chat')}>
              <MessageSquare size={16} /> Voltar ao Chat
            </button>
          </div>

          {/* IA CONTEXTUAL: CATÁLOGO */}
          <ContextualAIChatCard
            apiBase={API_BASE}
            context={{
              page: 'catalog',
              module: 'catalog',
              entity: 'product'
            }}
            title="💬 Pergunte à IA sobre seu catálogo"
            subtitle="Consulte itens sem preço, categorias, média de valores ou importe direto de sites."
            suggestions={[
              'Quais produtos estão sem preço?',
              'Quero importar os produtos do meu site',
              'Quais categorias temos cadastradas?'
            ]}
            onActionCompleted={() => {
              loadData();
            }}
          />

          {/* ABAS DE MODO: IMPORTAR POR SITE, TEXTO, CONFIGURAÇÕES IA E ANALYTICS */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <button 
              type="button"
              className={catalogImportMode === 'url' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setCatalogImportMode('url')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 600 }}
            >
              <Globe size={18} />
              <span>Importar Direto do Site do Cliente (URL)</span>
              <span className="badge" style={{ background: 'rgba(0, 210, 255, 0.2)', color: '#00d2ff', fontSize: '0.65rem' }}>IA Web Scraper</span>
            </button>

            <button 
              type="button"
              className={catalogImportMode === 'text' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setCatalogImportMode('text')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 600 }}
            >
              <FileText size={18} />
              <span>Colar Texto ou Lista Manualmente</span>
            </button>

            <button 
              type="button"
              className={catalogImportMode === 'settings' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => { setCatalogImportMode('settings'); loadConsultantSettings(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 600 }}
            >
              <Settings size={18} />
              <span>Configurações da Busca IA</span>
              <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#c084fc', fontSize: '0.65rem' }}>Consultor</span>
            </button>

            <button 
              type="button"
              className={catalogImportMode === 'analytics' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => { setCatalogImportMode('analytics'); loadCatalogAnalytics(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontWeight: 600 }}
            >
              <BarChart3 size={18} />
              <span>Métricas & Conversão</span>
              <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.65rem' }}>ROI & Funil</span>
            </button>
          </div>

          {/* PAINEL MODO 1: IMPORTAR DIRETO DO SITE / LINK DO CLIENTE */}
          {catalogImportMode === 'url' && (
            <div 
              className="glass-panel" 
              style={{ 
                padding: 22, 
                marginBottom: 20, 
                border: theme === 'dark' ? '1px solid rgba(0, 210, 255, 0.3)' : '1.5px solid #cbd5e1', 
                background: theme === 'dark' ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.75), rgba(10, 15, 30, 0.85))' : '#ffffff',
                boxShadow: theme === 'light' ? '0 4px 20px rgba(0, 0, 0, 0.05)' : undefined
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: theme === 'dark' ? '1px solid rgba(0, 210, 255, 0.5)' : '1px solid #cbd5e1', minWidth: 34 }}>
                    <img src={atomLogo} alt="Multiplex" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                      Extrair Catálogo Completo Direto do Site do Cliente
                    </h2>
                    <span style={{ fontSize: '0.84rem', color: theme === 'light' ? '#334155' : 'var(--text-muted)', fontWeight: 500 }}>
                      Cole o link da loja virtual, imobiliária, cardápio digital ou catálogo. A Multiplex acessa e extrai todos os itens automaticamente.
                    </span>
                  </div>
                </div>

                <span className="badge" style={{ background: theme === 'dark' ? 'rgba(0, 210, 255, 0.15)' : 'rgba(2, 132, 199, 0.12)', color: theme === 'dark' ? '#00d2ff' : '#0284c7', border: theme === 'dark' ? '1px solid rgba(0, 210, 255, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)', fontWeight: 700 }}>
                  Web Scraping + GPT-4o
                </span>
              </div>

              {/* CAMPO DE URL */}
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center' }}>
                  <Globe size={20} />
                </div>
                <input 
                  type="url"
                  placeholder="Cole aqui o link do site do cliente (ex: https://sualoja.com.br, https://imobiliariaexemplo.com.br/imoveis, https://cardapio.site/meu-restaurante)"
                  value={clientWebsiteUrl}
                  onChange={(e) => setClientWebsiteUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScrapeWebsite(false)}
                  style={{ 
                    width: '100%', 
                    paddingLeft: 44, 
                    paddingRight: 14, 
                    paddingTop: 14, 
                    paddingBottom: 14, 
                    fontSize: '0.95rem',
                    borderRadius: 10,
                    background: theme === 'light' ? '#ffffff' : undefined,
                    color: theme === 'light' ? '#0f172a' : undefined,
                    border: theme === 'light' ? '1.5px solid #cbd5e1' : '1px solid rgba(0, 210, 255, 0.3)'
                  }}
                />
              </div>

              {/* CHIPS DE SUPORTE E EXEMPLOS */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: theme === 'light' ? '#64748b' : 'var(--text-muted)', fontWeight: 600 }}>
                  Tipos de catálogo suportados:
                </span>
                <span className="badge" style={{ fontSize: '0.74rem', background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
                  Lojas & E-commerces (Shopify, Nuvemshop, WooCommerce)
                </span>
                <span className="badge" style={{ fontSize: '0.74rem', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
                  Imobiliárias (Casas, Apartamentos, Aluguel, Venda)
                </span>
                <span className="badge" style={{ fontSize: '0.74rem', background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }}>
                  Restaurantes & Pizzarias (Cardápio Digital, iFood)
                </span>
                <span className="badge" style={{ fontSize: '0.74rem', background: 'rgba(236, 72, 153, 0.12)', color: '#f472b6' }}>
                  Serviços & Catálogos Comerciais
                </span>
              </div>

              {/* BOTÕES DE AÇÃO DO MODO URL */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn-primary" 
                  onClick={() => handleScrapeWebsite(false)}
                  disabled={isScrapingWebsite || !clientWebsiteUrl.trim()}
                  style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {isScrapingWebsite ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Multiplex rastreando site...</span>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(0, 210, 255, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={atomLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <span>Rastrear Site e Extrair Tudo com Multiplex</span>
                    </>
                  )}
                </button>

                <button 
                  className="btn-primary" 
                  onClick={() => handleScrapeWebsite(true)}
                  disabled={isScrapingWebsite || !clientWebsiteUrl.trim()}
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {isScrapingWebsite ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  <span>Importar e Cadastrar Tudo no Catálogo em 1 Clique</span>
                </button>

                {clientWebsiteUrl.trim().length > 0 && (
                  <button 
                    className="btn-secondary" 
                    onClick={() => { setClientWebsiteUrl(''); setParsedProducts([]); setBatchSuccessMsg(''); }}
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* FEEDBACK DE CARREGAMENTO INTELIGENTE */}
              {isScrapingWebsite && (
                <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 10, background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.3)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', border: '1px solid #00d2ff', animation: 'spin 3s linear infinite' }}>
                    <img src={atomLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                      Multiplex acessando e processando o site do cliente...
                    </div>
                    <div style={{ fontSize: '0.8rem', color: theme === 'light' ? '#334155' : 'var(--text-muted)' }}>
                      {scrapeStatusText}
                    </div>
                  </div>
                </div>
              )}

              {batchSuccessMsg && (
                <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} />
                  <span>{batchSuccessMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* PAINEL MODO 2: COLAR TEXTO OU LISTA MANUALMENTE */}
          {catalogImportMode === 'text' && (
            <div 
              className="glass-panel" 
              style={{ 
                padding: 22, 
                marginBottom: 20, 
                border: theme === 'dark' ? '1px solid rgba(0, 210, 255, 0.3)' : '1.5px solid #cbd5e1', 
                background: theme === 'dark' ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.75), rgba(10, 15, 30, 0.85))' : '#ffffff',
                boxShadow: theme === 'light' ? '0 4px 20px rgba(0, 0, 0, 0.05)' : undefined
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: theme === 'dark' ? '1px solid rgba(0, 210, 255, 0.4)' : '1px solid #cbd5e1', minWidth: 32 }}>
                    <img src={atomLogo} alt="Multiplex" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                      Importar Texto ou Lista de Produtos com Multiplex
                    </h2>
                    <span style={{ fontSize: '0.84rem', color: theme === 'light' ? '#334155' : 'var(--text-muted)', fontWeight: 500 }}>
                      Cole texto corrido, lista de preços, descrições ou mensagens
                    </span>
                  </div>
                </div>

                <span className="badge" style={{ background: theme === 'dark' ? 'rgba(0, 210, 255, 0.15)' : 'rgba(2, 132, 199, 0.12)', color: theme === 'dark' ? '#00d2ff' : '#0284c7', border: theme === 'dark' ? '1px solid rgba(0, 210, 255, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)', fontWeight: 700 }}>
                  GPT-4o Extrator
                </span>
              </div>

              {/* DETECTOR DE URL NO TEXTO */}
              {/(?:https?:\/\/|www\.)[^\s]+/i.test(rawMenuText) && (
                <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(0, 210, 255, 0.12)', border: '1px solid rgba(0, 210, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: '0.85rem', color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                    🔗 Detectamos um link de site no seu texto! Deseja que a Multiplex rastreie e copie todos os produtos/imóveis do site automaticamente?
                  </span>
                  <button 
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                    onClick={() => {
                      const match = rawMenuText.match(/(?:https?:\/\/|www\.)[^\s]+/i);
                      if (match) {
                        setClientWebsiteUrl(match[0]);
                        setCatalogImportMode('url');
                      }
                    }}
                  >
                    Importar Direto pelo Site (URL)
                  </button>
                </div>
              )}

              <textarea 
                placeholder="Cole aqui os produtos copiados do seu site, cardápio ou mensagem...&#10;&#10;Exemplo:&#10;Pizza Calabresa Especial - R$ 48,00 - Molho caseiro, mussarela, calabresa e cebola&#10;Pizza Quatro Queijos - R$ 56,90 - Mussarela, provolone, gorgonzola e catupiry&#10;Coca-Cola 2L - R$ 14,00&#10;Cerveja Long Neck - R$ 11,50"
                value={rawMenuText}
                onChange={(e) => setRawMenuText(e.target.value)}
                rows={5}
                style={{ 
                  width: '100%', 
                  fontSize: '0.9rem', 
                  lineHeight: '1.45', 
                  marginBottom: 14, 
                  resize: 'vertical',
                  background: theme === 'light' ? '#ffffff' : undefined,
                  color: theme === 'light' ? '#0f172a' : undefined,
                  border: theme === 'light' ? '1.5px solid #cbd5e1' : undefined
                }}
              />

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn-primary" 
                  onClick={handleParseMenuWithAI}
                  disabled={isParsingMenu || !rawMenuText.trim()}
                  style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)' }}
                >
                  {isParsingMenu ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Multiplex separando produtos...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Analisar e Separar Produtos</span>
                    </>
                  )}
                </button>

                <button 
                  className="btn-primary" 
                  onClick={handleDirectImportAI}
                  disabled={isParsingMenu || !rawMenuText.trim()}
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                >
                  {isParsingMenu ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  <span>Importar e Cadastrar Tudo em 1 Clique</span>
                </button>

                {rawMenuText.trim().length > 0 && (
                  <button 
                    className="btn-secondary" 
                    onClick={() => { setRawMenuText(''); setParsedProducts([]); setBatchSuccessMsg(''); }}
                  >
                    Limpar
                  </button>
                )}
              </div>

              {batchSuccessMsg && (
                <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Check size={16} />
                  <span>{batchSuccessMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* PAINEL MODO 3: CONFIGURAÇÕES DA BUSCA IA (CONSULTOR) & SIMULADOR */}
          {catalogImportMode === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
              <div 
                className="glass-panel" 
                style={{ 
                  padding: 24, 
                  border: theme === 'dark' ? '1px solid rgba(168, 85, 247, 0.3)' : '1.5px solid #cbd5e1', 
                  background: theme === 'dark' ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.8), rgba(24, 15, 42, 0.85))' : '#ffffff',
                  boxShadow: theme === 'light' ? '0 4px 20px rgba(0, 0, 0, 0.05)' : undefined
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                        <Settings size={20} />
                      </div>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                        Configurações do Consultor de Catálogo IA
                      </h2>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: theme === 'light' ? '#475569' : 'var(--text-muted)', margin: 0 }}>
                      Defina as regras de apresentação de imóveis, produtos e serviços pelo agente em canais omnichannel (WhatsApp, Instagram, Web, etc).
                    </p>
                  </div>

                  <button 
                    className="btn-primary"
                    onClick={saveConsultantSettings}
                    disabled={isSavingConsultantSettings}
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)' }}
                  >
                    {isSavingConsultantSettings ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    <span>Salvar Regras do Consultor</span>
                  </button>
                </div>

                {consultantSaveSuccess && (
                  <div style={{ marginBottom: 18, padding: '10px 14px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Check size={16} />
                    <span>Configurações do Consultor salvas com sucesso! O Agente já está aplicando as novas regras.</span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                  {/* COLUNA ESQUERDA: PARÂMETROS E TOGGLES */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="glass-card" style={{ padding: 18, border: theme === 'light' ? '1px solid #e2e8f0' : undefined }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: 6, color: theme === 'light' ? '#1e293b' : '#e2e8f0' }}>
                        Quantidade Máxima de Resultados por Consulta
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[1, 3, 5, 10].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setConsultantSettings(prev => ({ ...prev, max_results: n }))}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: consultantSettings.max_results === n ? '2px solid #a855f7' : theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
                              background: consultantSettings.max_results === n ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                              color: consultantSettings.max_results === n ? '#a855f7' : theme === 'light' ? '#334155' : '#cbd5e1',
                              fontWeight: consultantSettings.max_results === n ? 700 : 500,
                              cursor: 'pointer'
                            }}
                          >
                            {n} {n === 3 ? '(Recomendado)' : 'itens'}
                          </button>
                        ))}
                      </div>
                      <small style={{ fontSize: '0.75rem', color: theme === 'light' ? '#64748b' : 'var(--text-muted)', display: 'block', marginTop: 6 }}>
                        Evita sobrecarregar o cliente no WhatsApp/Instagram com excesso de opções.
                      </small>
                    </div>

                    <div className="glass-card" style={{ padding: 18, border: theme === 'light' ? '1px solid #e2e8f0' : undefined }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: 6, color: theme === 'light' ? '#1e293b' : '#e2e8f0' }}>
                        Critério Padrão de Ordenação
                      </label>
                      <select
                        value={consultantSettings.default_sort || 'relevance'}
                        onChange={(e) => setConsultantSettings(prev => ({ ...prev, default_sort: e.target.value as any }))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8 }}
                      >
                        <option value="relevance">Mais Relevante (Inteligência Multicritério)</option>
                        <option value="price_asc">Menor Preço Primeiro</option>
                        <option value="price_desc">Maior Preço Primeiro</option>
                        <option value="newest">Mais Novos Cadastrados</option>
                      </select>
                    </div>

                    <div className="glass-card" style={{ padding: 18, border: theme === 'light' ? '1px solid #e2e8f0' : undefined }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 600, color: theme === 'light' ? '#1e293b' : '#e2e8f0' }}>
                        Elementos Exibidos nas Mensagens
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem' }}>
                          <input
                            type="checkbox"
                            checked={consultantSettings.send_images ?? true}
                            onChange={(e) => setConsultantSettings(prev => ({ ...prev, send_images: e.target.checked }))}
                          />
                          <span>Enviar Foto / Imagem Principal (quando canal suportar)</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem' }}>
                          <input
                            type="checkbox"
                            checked={consultantSettings.send_prices ?? true}
                            onChange={(e) => setConsultantSettings(prev => ({ ...prev, send_prices: e.target.checked }))}
                          />
                          <span>Enviar Preço Atualizado do Catálogo</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem' }}>
                          <input
                            type="checkbox"
                            checked={consultantSettings.send_descriptions ?? true}
                            onChange={(e) => setConsultantSettings(prev => ({ ...prev, send_descriptions: e.target.checked }))}
                          />
                          <span>Enviar Descrições e Características Estruturadas</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem' }}>
                          <input
                            type="checkbox"
                            checked={consultantSettings.send_links ?? true}
                            onChange={(e) => setConsultantSettings(prev => ({ ...prev, send_links: e.target.checked }))}
                          />
                          <span>Enviar Link Oficial Direto para o Site (source_url)</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem' }}>
                          <input
                            type="checkbox"
                            checked={consultantSettings.show_stock ?? true}
                            onChange={(e) => setConsultantSettings(prev => ({ ...prev, show_stock: e.target.checked }))}
                          />
                          <span>Apresentar Disponibilidade e Estoque</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem' }}>
                          <input
                            type="checkbox"
                            checked={consultantSettings.ask_before_search ?? true}
                            onChange={(e) => setConsultantSettings(prev => ({ ...prev, ask_before_search: e.target.checked }))}
                          />
                          <span>Fazer Perguntas Inteligentes para qualificar a busca antes</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.88rem' }}>
                          <input
                            type="checkbox"
                            checked={(consultantSettings as any).fallback_smart_recommendations ?? true}
                            onChange={(e) => setConsultantSettings(prev => ({ ...prev, fallback_smart_recommendations: e.target.checked }) as any)}
                          />
                          <span>Recomendar alternativas próximas se busca exata não retornar</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* COLUNA DIREITA: INSTRUÇÕES DO CONSULTOR E SANDBOX DE TESTE */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="glass-card" style={{ padding: 18, border: theme === 'light' ? '1px solid #e2e8f0' : undefined }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: 600, display: 'block', marginBottom: 6, color: theme === 'light' ? '#1e293b' : '#e2e8f0' }}>
                        Instruções Personalizadas do Consultor
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Ex: Aja como um consultor atencioso. Sempre pergunte quantos quartos o cliente procura e sugira opções de financiamento..."
                        value={consultantSettings.custom_consultant_rules || ''}
                        onChange={(e) => setConsultantSettings(prev => ({ ...prev, custom_consultant_rules: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: '0.88rem' }}
                      />
                      <small style={{ fontSize: '0.75rem', color: theme === 'light' ? '#64748b' : 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                        Essas regras são injetadas no prompt dinâmico do agente durante as conversas de catálogo.
                      </small>
                    </div>

                    {/* SIMULADOR DE BUSCA AO VIVO */}
                    <div 
                      className="glass-card" 
                      style={{ 
                        padding: 18, 
                        border: theme === 'dark' ? '1px solid rgba(0, 210, 255, 0.3)' : '1.5px solid #00d2ff',
                        background: theme === 'dark' ? 'rgba(0, 210, 255, 0.04)' : '#f0fdff'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Search size={16} color="#00d2ff" />
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                          Simulador de Busca do Catálogo IA
                        </h4>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: theme === 'light' ? '#334155' : 'var(--text-muted)', margin: '0 0 10px 0' }}>
                        Digite qualquer termo para testar o ranqueamento multicritério em tempo real:
                      </p>

                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <input
                          type="text"
                          placeholder="Ex: casa 3 quartos, creatina 500g, pizza calabresa..."
                          value={testSearchQuery}
                          onChange={(e) => setTestSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleRunTestSearch()}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: '0.88rem' }}
                        />
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={handleRunTestSearch}
                          disabled={isTestingSearch || !testSearchQuery.trim()}
                          style={{ padding: '8px 16px', fontSize: '0.88rem' }}
                        >
                          {isTestingSearch ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
                          <span>Buscar</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {['casa 3 quartos', 'creatina 500g', 'pizza', 'apartamento'].map(ex => (
                          <button
                            key={ex}
                            type="button"
                            onClick={() => { setTestSearchQuery(ex); }}
                            style={{
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              borderRadius: 6,
                              background: theme === 'light' ? '#ffffff' : 'rgba(255,255,255,0.08)',
                              border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.15)',
                              cursor: 'pointer',
                              color: theme === 'light' ? '#1e293b' : '#cbd5e1'
                            }}
                          >
                            + {ex}
                          </button>
                        ))}
                      </div>

                      {testSearchResults && (
                        <div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: theme === 'light' ? '#ffffff' : 'rgba(0,0,0,0.3)', border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: '0.8rem', fontWeight: 600 }}>
                            <span>{testSearchResults.total_found ?? 0} resultados encontrados</span>
                            {testSearchResults.is_alternative && (
                              <span style={{ color: '#eab308' }}>⚠️ Sugestão Alternativa</span>
                            )}
                          </div>

                          {(!testSearchResults.results || testSearchResults.results.length === 0) ? (
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: 8 }}>
                              Nenhum item combinou com esses filtros no catálogo desta empresa.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
                              {testSearchResults.results.map((r: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 8, borderRadius: 6, background: theme === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(148, 163, 184, 0.15)' }}>
                                  {r.images?.[0] && (
                                    <img src={r.images[0]} alt="" style={{ width: 42, height: 42, borderRadius: 6, objectFit: 'cover' }} />
                                  )}
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {r.name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                                      {r.price_formatted || (r.price > 0 ? `R$ ${r.price}` : 'Sob consulta')}
                                    </div>
                                  </div>
                                  {r.source_url && (
                                    <a
                                      href={r.source_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ fontSize: '0.75rem', color: '#00d2ff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}
                                    >
                                      <ExternalLink size={12} /> Link
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAINEL MODO 4: MÉTRICAS & ANALYTICS DE CONVERSÃO DO CATÁLOGO */}
          {catalogImportMode === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
              <div 
                className="glass-panel" 
                style={{ 
                  padding: 24, 
                  border: theme === 'dark' ? '1px solid rgba(16, 185, 129, 0.3)' : '1.5px solid #cbd5e1', 
                  background: theme === 'dark' ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.8), rgba(15, 35, 25, 0.85))' : '#ffffff',
                  boxShadow: theme === 'light' ? '0 4px 20px rgba(0, 0, 0, 0.05)' : undefined
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                        <BarChart3 size={20} />
                      </div>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                        Métricas & Funil de Conversão do Catálogo IA
                      </h2>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: theme === 'light' ? '#475569' : 'var(--text-muted)', margin: 0 }}>
                      Acompanhe o impacto comercial do Consultor IA: buscas realizadas, produtos/imóveis recomendados e cliques em links oficiais.
                    </p>
                  </div>

                  <button 
                    className="btn-secondary"
                    onClick={loadCatalogAnalytics}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <RefreshCw size={15} />
                    <span>Atualizar Métricas</span>
                  </button>
                </div>

                {/* KPI CARDS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
                  <div className="glass-card" style={{ padding: 18, borderLeft: '4px solid #00d2ff' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total de Buscas no Catálogo</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                      {catalogAnalytics?.total_searches ?? 0}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#00d2ff' }}>Conversas com busca ativa</span>
                  </div>

                  <div className="glass-card" style={{ padding: 18, borderLeft: '4px solid #10b981' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Cliques em Links Oficiais</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4, color: '#10b981' }}>
                      {catalogAnalytics?.total_clicks ?? 0}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#10b981' }}>Direcionamentos ao site</span>
                  </div>

                  <div className="glass-card" style={{ padding: 18, borderLeft: '4px solid #a855f7' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Taxa de Clique (CTR)</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4, color: '#a855f7' }}>
                      {catalogAnalytics?.click_through_rate ?? '0.0%'}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#a855f7' }}>Engajamento dos resultados</span>
                  </div>

                  <div className="glass-card" style={{ padding: 18, borderLeft: '4px solid #f59e0b' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Média de Itens por Busca</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: 4, color: '#f59e0b' }}>
                      {catalogAnalytics?.avg_results_per_search ?? '0.0'}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Opções apresentadas</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                  {/* CATEGORIAS MAIS PESQUISADAS */}
                  <div className="glass-card" style={{ padding: 18, border: theme === 'light' ? '1px solid #e2e8f0' : undefined }}>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0 0 12px 0', color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                      Categorias Mais Pesquisadas
                    </h3>
                    {(!catalogAnalytics?.top_categories || catalogAnalytics.top_categories.length === 0) ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                        Nenhuma busca registrada ainda. Realize buscas com o agente para gerar métricas.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {catalogAnalytics.top_categories.map((c: any, idx: number) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 6, background: theme === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.03)' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{c.category}</span>
                            <span className="badge" style={{ background: 'rgba(0, 210, 255, 0.15)', color: '#00d2ff', fontWeight: 700 }}>
                              {c.count} buscas
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ITENS MAIS CLICADOS */}
                  <div className="glass-card" style={{ padding: 18, border: theme === 'light' ? '1px solid #e2e8f0' : undefined }}>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0 0 12px 0', color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                      Itens Mais Clicados / Acessados no Site
                    </h3>
                    {(!catalogAnalytics?.top_clicked_items || catalogAnalytics.top_clicked_items.length === 0) ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                        Nenhum clique registrado ainda. Quando os clientes clicarem nos cards enviados pelo agente, aparecerão aqui.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {catalogAnalytics.top_clicked_items.map((it: any, idx: number) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 6, background: theme === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.03)' }}>
                            <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {it.item_name || it.catalog_item_id}
                              </div>
                              {it.source_url && (
                                <a href={it.source_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#00d2ff', textDecoration: 'none' }}>
                                  {it.source_url}
                                </a>
                              )}
                            </div>
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                              {it.clicks} cliques
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ÚLTIMAS BUSCAS REGISTRADAS */}
                {catalogAnalytics?.recent_searches && catalogAnalytics.recent_searches.length > 0 && (
                  <div className="glass-card" style={{ padding: 18, marginTop: 18, border: theme === 'light' ? '1px solid #e2e8f0' : undefined }}>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0 0 12px 0', color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                      Últimas Consultas Registradas & Filtros Extraídos pela IA
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: theme === 'light' ? '1.5px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)' }}>
                            <th style={{ padding: '8px 10px' }}>Termo / Intenção</th>
                            <th style={{ padding: '8px 10px' }}>Categoria</th>
                            <th style={{ padding: '8px 10px' }}>Filtros Extraídos</th>
                            <th style={{ padding: '8px 10px' }}>Resultados</th>
                            <th style={{ padding: '8px 10px' }}>Data / Hora</th>
                          </tr>
                        </thead>
                        <tbody>
                          {catalogAnalytics.recent_searches.map((s: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: theme === 'light' ? '1px solid #f1f5f9' : '1px solid rgba(255,255,255,0.04)' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 600 }}>"{s.query}"</td>
                              <td style={{ padding: '8px 10px' }}>
                                <span className="badge" style={{ background: 'rgba(0, 210, 255, 0.1)', color: '#00d2ff' }}>
                                  {s.category || 'geral'}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: '0.75rem', color: theme === 'light' ? '#475569' : '#94a3b8' }}>
                                {JSON.stringify(s.filters || {})}
                              </td>
                              <td style={{ padding: '8px 10px', fontWeight: 700, color: s.results_count > 0 ? '#10b981' : '#f59e0b' }}>
                                {s.results_count}
                              </td>
                              <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>
                                {new Date(s.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PRE-VISUALIZACAO DOS PRODUTOS IDENTIFICADOS PELA IA */}
          {parsedProducts.length > 0 && (
            <div 
              className="glass-panel" 
              style={{ 
                padding: 20, 
                marginBottom: 20, 
                border: theme === 'dark' ? '1px solid rgba(16, 185, 129, 0.4)' : '1.5px solid #10b981', 
                background: theme === 'dark' ? 'rgba(16, 185, 129, 0.04)' : '#ffffff',
                boxShadow: theme === 'light' ? '0 4px 20px rgba(16, 185, 129, 0.08)' : undefined
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                    {parsedProducts.length} Itens (Produtos / Imóveis) Identificados pela Multiplex
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: theme === 'light' ? '#334155' : 'var(--text-muted)' }}>
                    Confira os dados extraídos do site do cliente antes de confirmar a gravação no catálogo
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    className="btn-primary"
                    onClick={handleSaveBatchProducts}
                    disabled={isSavingBatch}
                    style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                  >
                    {isSavingBatch ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    <span>Confirmar e Cadastrar Todos ({parsedProducts.length})</span>
                  </button>

                  <button 
                    className="btn-secondary"
                    onClick={() => setParsedProducts([])}
                  >
                    <X size={16} /> Descartar
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {parsedProducts.map((p, idx) => (
                  <div 
                    key={idx} 
                    className="glass-card" 
                    style={{ 
                      padding: 16, 
                      position: 'relative',
                      border: theme === 'light' ? '1.5px solid #cbd5e1' : undefined,
                      background: theme === 'light' ? '#ffffff' : undefined
                    }}
                  >
                    <button 
                      onClick={() => handleRemoveParsedItem(idx)}
                      style={{ position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', color: theme === 'light' ? '#64748b' : 'var(--text-dim)', cursor: 'pointer' }}
                      title="Remover este item da lista"
                    >
                      <X size={16} />
                    </button>
                    <div style={{ fontWeight: 700, fontSize: '0.98rem', paddingRight: 24, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                      {p.name}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.95rem' }}>
                        {Number(p.price) > 0 ? `R$ ${Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Sob consulta'}
                      </span>
                      {p.category && (
                        <span className="badge" style={{ fontSize: '0.72rem', padding: '2px 8px', background: theme === 'light' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255,255,255,0.08)', color: theme === 'light' ? '#4338ca' : 'var(--accent-cyan)' }}>
                          {p.category}
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p style={{ fontSize: '0.82rem', color: theme === 'light' ? '#334155' : 'var(--text-muted)', marginTop: 8, marginBottom: 8, lineHeight: 1.4 }}>
                        {p.description}
                      </p>
                    )}
                    {Array.isArray(p.ingredients) && p.ingredients.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                        {p.ingredients.map((tag: string, tIdx: number) => (
                          <span key={tIdx} style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: 4, background: theme === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.06)', color: theme === 'light' ? '#475569' : '#94a3b8' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACORDEAO: CADASTRO MANUAL INDIVIDUAL (OPCIONAL) */}
          <div style={{ marginBottom: 20 }}>
            <button 
              className="btn-secondary" 
              onClick={() => setShowManualAdd(!showManualAdd)}
              style={{ fontSize: '0.85rem', width: '100%', justifyContent: 'space-between', padding: '10px 16px' }}
            >
              <span>+ Cadastrar 1 item manualmente (sem IA)</span>
              <span>{showManualAdd ? 'Ocultar' : 'Expandir'}</span>
            </button>

            {showManualAdd && (
              <div className="glass-panel" style={{ padding: 18, marginTop: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
                  <input 
                    type="text" 
                    placeholder="Nome do produto" 
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                  />
                  <input 
                    type="number" 
                    placeholder="Preço (ex: 29.90)" 
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                  />
                </div>
                <textarea 
                  placeholder="Descrição, ingredientes e adicionais..."
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                  rows={2}
                  style={{ marginBottom: 12 }}
                />
                <button className="btn-primary" onClick={handleAddProduct}>
                  <Plus size={16} /> Adicionar Produto Individual
                </button>
              </div>
            )}
          </div>

          {/* LISTAGEM DOS PRODUTOS CADASTRADOS NO SISTEMA */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                Produtos Cadastrados no Catálogo ({products.length})
              </h2>
              {products.length > 0 && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Itens ativos consultados pela Multiplex durante conversas
                </span>
              )}
            </div>

            {products.length === 0 ? (
              <div 
                className="glass-card" 
                style={{ 
                  padding: 32, 
                  textAlign: 'center', 
                  color: theme === 'light' ? '#1e293b' : 'var(--text-dim)',
                  background: theme === 'light' ? '#ffffff' : undefined,
                  border: theme === 'light' ? '1.5px dashed #cbd5e1' : undefined,
                  borderRadius: 14,
                  fontWeight: theme === 'light' ? 500 : 400,
                  fontSize: '0.92rem'
                }}
              >
                Nenhum produto cadastrado ainda. Cole a lista do seu cardápio acima para que a Multiplex organize tudo em segundos.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {products.map(p => (
                  <div key={p.id} className="glass-card" style={{ padding: 16, position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>R$ {Number(p.price).toFixed(2)}</span>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2 }}
                          title="Excluir produto"
                        >
                          <Trash2 size={15} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6, marginBottom: 0 }}>
                      {p.description || 'Sem descricao'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TELA: IDENTIDADE E REGRAS DO AGENTE IA */}
      {activeView === 'personality' && (
        <div className="main-panel-scrollable">
          <div className="page-header" style={{ marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 className="page-title" style={{ margin: 0 }}>Identidade e Regras do Agente IA</h1>
                <span className="bonasoft-badge-tag">Omnichannel Multiplex</span>
              </div>
              <p className="page-desc">
                Defina como o agente se apresenta aos clientes, seu nome oficial, empresa, tom de voz e regras obrigatórias de atendimento.
              </p>
            </div>
            <button className="btn-secondary" onClick={() => setActiveView('chat')}>
              <MessageSquare size={16} /> Voltar ao Chat
            </button>
          </div>

          {/* Seletor de Abas: Identidade da IA & Regras de Negócio */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 10 }}>
            <button
              className={identityTab === 'identity' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setIdentityTab('identity')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, fontWeight: 500 }}
            >
              <Bot size={16} /> Identidade da IA
            </button>
            <button
              className={identityTab === 'rules' ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setIdentityTab('rules')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, fontWeight: 500 }}
            >
              <Sliders size={16} /> Regras Comerciais ({rules.length})
            </button>
          </div>

          {/* ABA 1: IDENTIDADE DA IA */}
          {identityTab === 'identity' && (
            <>
              {/* IA CONTEXTUAL: IDENTIDADE E APRESENTAÇÃO */}
              <ContextualAIChatCard
                apiBase={API_BASE}
                context={{
                  page: 'agent_identity',
                  module: 'ai_agent',
                  editable_fields: ['display_name', 'introduction', 'role_description', 'tone', 'communication_style']
                }}
                title="💬 Fale com a IA sobre esta configuração"
                subtitle="Peça alterações de nome, tom de voz, apresentação e regras em linguagem natural."
                suggestions={[
                  'Quero que ela se chame Assistente Casa Nova',
                  'Quero deixar a IA mais profissional',
                  'Como ela está se apresentando aos clientes hoje?'
                ]}
                onActionCompleted={() => {
                  loadData();
                }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.4fr) minmax(320px, 1fr)', gap: 24, alignItems: 'start' }}>
              {/* Formulário de Identidade */}
              <div className="glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
                  <div>
                    <h2 style={{ fontSize: '1.08rem', fontWeight: 600, margin: 0 }}>Apresentação e Nome do Agente</h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
                      Essas informações definem como a IA se apresenta aos seus clientes em todos os canais.
                    </p>
                  </div>
                </div>

                {/* Grid Nome da IA e Nome da Empresa */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 6 }}>
                      Nome da IA <span style={{ color: 'var(--accent-cyan)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={agentIdentity.display_name}
                      onChange={(e) => setAgentIdentity({ ...agentIdentity, display_name: e.target.value })}
                      placeholder="Ex: Lia, Assistente Casa Nova, Luna"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
                      Nome próprio ou formal com que ela responde.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 6 }}>
                      Nome da Empresa <span style={{ color: 'var(--accent-cyan)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={agentIdentity.company_name}
                      onChange={(e) => setAgentIdentity({ ...agentIdentity, company_name: e.target.value })}
                      placeholder="Ex: Restaurante Sabor da Terra"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
                      A empresa que a IA representa no atendimento.
                    </span>
                  </div>
                </div>

                {/* Apresentação Padrão */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 6 }}>
                    Apresentação Padrão aos Clientes <span style={{ color: 'var(--accent-cyan)' }}>*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={agentIdentity.introduction}
                    onChange={(e) => setAgentIdentity({ ...agentIdentity, introduction: e.target.value })}
                    placeholder="Ex: Olá! Eu sou a Lia, assistente virtual do Restaurante Sabor da Terra. Posso te ajudar com nosso cardápio e pedidos."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.88rem', resize: 'vertical' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
                    Esta mensagem é usada quando o cliente inicia o contato ou pergunta com quem está falando.
                  </span>
                </div>

                {/* Função Principal */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 6 }}>
                    Função Principal / Especialidade
                  </label>
                  <input
                    type="text"
                    value={agentIdentity.role_description}
                    onChange={(e) => setAgentIdentity({ ...agentIdentity, role_description: e.target.value })}
                    placeholder="Ex: Consultoria de imóveis de alto padrão, agendamento de visitas e esclarecimento de dúvidas"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.88rem' }}
                  />
                </div>

                {/* Toggle Auto-Apresentação */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                  <input
                    type="checkbox"
                    id="auto-introduce"
                    checked={agentIdentity.auto_introduce}
                    onChange={(e) => setAgentIdentity({ ...agentIdentity, auto_introduce: e.target.checked })}
                    style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
                  />
                  <label htmlFor="auto-introduce" style={{ cursor: 'pointer', fontSize: '0.88rem', fontWeight: 500, margin: 0 }}>
                    Apresentar-se automaticamente no início da conversa
                    <span style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-dim)', fontWeight: 400 }}>
                      A IA iniciará o diálogo informando seu nome e o nome da empresa.
                    </span>
                  </label>
                </div>

                {/* Grid Tom e Estilo de Comunicação */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 6 }}>
                      Tom de Voz
                    </label>
                    <select
                      value={agentIdentity.tone}
                      onChange={(e) => setAgentIdentity({ ...agentIdentity, tone: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.88rem' }}
                    >
                      <option value="friendly">Amigável e acolhedor</option>
                      <option value="professional">Profissional e formal</option>
                      <option value="consultative">Consultivo e técnico</option>
                      <option value="enthusiastic">Entusiasta e ágil</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: 6 }}>
                      Estilo de Comunicação
                    </label>
                    <select
                      value={agentIdentity.communication_style}
                      onChange={(e) => setAgentIdentity({ ...agentIdentity, communication_style: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.88rem' }}
                    >
                      <option value="consultative">Consultivo (qualifica antes)</option>
                      <option value="direct">Direto e conciso</option>
                      <option value="educational">Educativo e detalhado</option>
                      <option value="persuasive">Comercial e persuasivo</option>
                    </select>
                  </div>
                </div>

                {/* Salvar e Feedback */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
                  {identitySaveSuccess ? (
                    <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', fontWeight: 500 }}>
                      <CheckCircle2 size={16} /> Identidade salva com sucesso!
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      Atualizações têm efeito imediato nas conversas.
                    </span>
                  )}
                  <button
                    className="btn-primary"
                    onClick={handleSaveIdentity}
                    disabled={isSavingIdentity}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
                  >
                    {isSavingIdentity ? <RefreshCw size={16} className="spin" /> : <Check size={16} />}
                    {isSavingIdentity ? 'Salvando...' : 'Salvar Identidade'}
                  </button>
                </div>
              </div>

              {/* Preview em Tempo Real */}
              <div className="glass-panel" style={{ padding: 22, position: 'sticky', top: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Sparkles size={16} color="var(--accent-cyan)" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 600, margin: 0 }}>Simulação de Apresentação</h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 18 }}>
                  Como o cliente vê e ouve a IA nos canais conectados:
                </p>

                {/* Card de Simulação Estilo WhatsApp */}
                <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 16 }}>
                  {/* Cabeçalho do Contato */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                      {(agentIdentity.display_name || 'M').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {agentIdentity.display_name || 'Multiplex'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
                        {agentIdentity.company_name ? `${agentIdentity.company_name} • Online` : 'Online'}
                      </div>
                    </div>
                  </div>

                  {/* Diálogo Simulado */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Mensagem do Cliente */}
                    <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.08)', borderRadius: '12px 12px 12px 2px', padding: '10px 14px', maxWidth: '85%', fontSize: '0.84rem' }}>
                      Oi, como vocês funcionam?
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textAlign: 'right', marginTop: 2 }}>14:30</div>
                    </div>

                    {/* Resposta do Agente */}
                    <div style={{ alignSelf: 'flex-end', background: 'rgba(99,102,241,0.22)', border: '1px solid rgba(99,102,241,0.35)', borderRadius: '12px 12px 2px 12px', padding: '10px 14px', maxWidth: '90%', fontSize: '0.84rem', color: 'var(--text-main)' }}>
                      {agentIdentity.introduction || `Olá! Eu sou o assistente virtual da ${agentIdentity.company_name || 'empresa'}. Como posso te ajudar hoje?`}
                      <div style={{ fontSize: '0.68rem', color: 'var(--accent-cyan)', textAlign: 'right', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                        14:30 <Check size={12} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)', fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                  💡 <strong>Dica Multiplex:</strong> Os clientes valorizam quando o agente se apresenta pelo nome e informa de forma transparente que é o assistente virtual da empresa.
                </div>
              </div>
            </div>
            </>
          )}

          {/* ABA 2: REGRAS COMERCIAIS */}
          {identityTab === 'rules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="glass-panel" style={{ padding: 20 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 14 }}>Nova Regra de Negócio</h2>
                <textarea 
                  placeholder="Ex: Não conceder descontos, oferecer adicionais ao fechar pedido, transferir para humano caso o cliente solicite..."
                  value={newRuleText}
                  onChange={(e) => setNewRuleText(e.target.value)}
                  rows={3}
                  style={{ marginBottom: 12, width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.88rem' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}>
                    <span>Prioridade da Regra (1 a 10):</span>
                    <input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={newRulePriority} 
                      onChange={(e) => setNewRulePriority(parseInt(e.target.value) || 5)} 
                      style={{ width: 70, padding: '6px 10px', borderRadius: 6, background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                    />
                  </div>
                  <button className="btn-primary" onClick={handleAddRule}>
                    <Plus size={16} /> Salvar Regra
                  </button>
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12 }}>Regras Ativas ({rules.length})</h2>
                {rules.length === 0 ? (
                  <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)' }}>
                    Nenhuma regra personalizada configurada ainda.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rules.map((r, i) => (
                      <div key={r.id || i} className="glass-card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.92rem' }}>{r.rule_text}</span>
                        <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-cyan)' }}>
                          Prioridade {r.priority || 5}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── BONASOFT Watermark ── */}
          <div className="bonasoft-watermark-container" style={{ marginTop: 28 }}>
            <p className="bonasoft-watermark">BONASOFT</p>
          </div>
        </div>
      )}

      {/* TELA: AGENTE IA > CONHECIMENTO > FONTES & SINCRONIZAÇÃO AUTOMÁTICA */}
      {activeView === 'knowledge' && (
        <div className="main-panel-scrollable">
          <div className="page-header" style={{ marginBottom: 18 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 className="page-title" style={{ margin: 0 }}>Base de Conhecimento do Agente</h1>
                <span className="bonasoft-badge-tag">Tecnologia BONASOFT</span>
              </div>
              <p className="page-desc">
                Sincronize seu site automaticamente ou gerencie artigos, manuais e o catálogo oficial da sua empresa.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setSourceFormError(null);
                  setSelectedSourceType('SITE');
                  setShowAddSourceModal(true);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Plus size={16} /> Adicionar Fonte
              </button>
              <button className="btn-secondary" onClick={() => setActiveView('chat')}>
                <MessageSquare size={16} /> Voltar ao Chat
              </button>
            </div>
          </div>

          {/* Navegação de Sub-Abas do Conhecimento */}
          <div className="sources-tab-nav">
            <button 
              className={`sources-tab-btn ${knowledgeTab === 'sources' ? 'active' : ''}`}
              onClick={() => setKnowledgeTab('sources')}
            >
              <Globe size={16} />
              Fontes Conectadas
              <span style={{ 
                background: knowledgeTab === 'sources' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.08)',
                padding: '2px 7px',
                borderRadius: 10,
                fontSize: '0.72rem'
              }}>
                {sourcesList.length}
              </span>
            </button>

            <button 
              className={`sources-tab-btn ${knowledgeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => setKnowledgeTab('catalog')}
            >
              <ShoppingBag size={16} />
              Itens Sincronizados (Catálogo)
              <span style={{ 
                background: knowledgeTab === 'catalog' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.08)',
                padding: '2px 7px',
                borderRadius: 10,
                fontSize: '0.72rem'
              }}>
                {catalogList.length}
              </span>
            </button>

            <button 
              className={`sources-tab-btn ${knowledgeTab === 'faq' ? 'active' : ''}`}
              onClick={() => setKnowledgeTab('faq')}
            >
              <BookOpen size={16} />
              Artigos & FAQ Manuais
              <span style={{ 
                background: knowledgeTab === 'faq' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.08)',
                padding: '2px 7px',
                borderRadius: 10,
                fontSize: '0.72rem'
              }}>
                {knowledgeList.length}
              </span>
            </button>
          </div>

          {/* ABA 1: FONTES CONECTADAS */}
          {knowledgeTab === 'sources' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {sourcesList.length === 0 ? (
                <div className="glass-card" style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                    <Globe size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Nenhum site ou fonte conectado ainda</h3>
                  <p style={{ maxWidth: 520, color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                    Informe a URL do seu site (restaurante, loja, imobiliária, clínica ou serviços) e o Multiplex descobrirá o catálogo, normalizará os itens e manterá preços e disponibilidades atualizados.
                  </p>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      setSourceFormError(null);
                      setSelectedSourceType('SITE');
                      setShowAddSourceModal(true);
                    }}
                    style={{ marginTop: 8 }}
                  >
                    <Plus size={16} /> Sincronizar Primeiro Site
                  </button>
                </div>
              ) : (
                <div className="sources-grid">
                  {sourcesList.map((source) => {
                    const isSyncing = isSyncingSourceId === source.id;
                    const formattedDate = source.last_synced_at
                      ? new Date(source.last_synced_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                      : 'Nunca sincronizado';

                    return (
                      <div key={source.id} className="source-card">
                        <div>
                          <div className="source-card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div className="source-icon-badge">
                                {source.source_type === 'SITE' ? <Globe size={22} /> : <FileText size={22} />}
                              </div>
                              <div>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 2px 0' }}>{source.name}</h3>
                                <a 
                                  href={source.url.startsWith('http') ? source.url : '#'} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  {source.url.replace(/^https?:\/\//, '')} <ExternalLink size={12} />
                                </a>
                              </div>
                            </div>
                            <span className="source-segment-pill">
                              {source.business_type || 'EMPRESA'}
                            </span>
                          </div>

                          {/* Status & Resumo de contadores */}
                          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Status da fonte:</span>
                              <span style={{ 
                                fontWeight: 700, 
                                color: source.status === 'ACTIVE' ? '#4ade80' : source.status === 'ERROR' ? '#f87171' : '#fbbf24',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5
                              }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: source.status === 'ACTIVE' ? '#4ade80' : source.status === 'ERROR' ? '#f87171' : '#fbbf24' }} />
                                {source.status === 'ACTIVE' ? 'Ativa & Sincronizada' : source.status === 'ERROR' ? 'Com Erro' : 'Pendente'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Última sincronização:</span>
                              <span style={{ fontWeight: 500, color: 'var(--text-color)' }}>{formattedDate}</span>
                            </div>

                            <div className="sync-counters-row" style={{ marginTop: 6 }}>
                              <span className="sync-chip total">
                                📦 {source.items_count || 0} itens na IA
                              </span>
                              <span className="sync-chip created">
                                +{catalogList.filter(i => i.source_id === source.id && i.status === 'AVAILABLE').length} ativos
                              </span>
                              {catalogList.filter(i => i.source_id === source.id && i.status === 'UNAVAILABLE').length > 0 && (
                                <span className="sync-chip removed">
                                  −{catalogList.filter(i => i.source_id === source.id && i.status === 'UNAVAILABLE').length} indisponíveis
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Configuração de Sincronização Automática */}
                          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                <input 
                                  type="checkbox"
                                  checked={source.auto_sync}
                                  onChange={() => handleToggleAutoSync(source)}
                                  style={{ cursor: 'pointer' }}
                                />
                                Sincronização Automática
                              </label>

                              <select 
                                value={source.sync_frequency || '24h'}
                                onChange={(e) => handleChangeFrequency(source, e.target.value)}
                                disabled={!source.auto_sync}
                                style={{ 
                                  padding: '4px 8px', 
                                  fontSize: '0.78rem', 
                                  borderRadius: 8,
                                  background: 'var(--input-bg)',
                                  color: 'var(--text-color)',
                                  border: '1px solid var(--border-color)',
                                  cursor: source.auto_sync ? 'pointer' : 'not-allowed',
                                  opacity: source.auto_sync ? 1 : 0.5
                                }}
                              >
                                <option value="1h">A cada 1 hora</option>
                                <option value="6h">A cada 6 horas</option>
                                <option value="12h">A cada 12 horas</option>
                                <option value="24h">A cada 24 horas</option>
                                <option value="semanal">Semanal</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Ações do Card */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, paddingTop: 14, borderTop: '1px solid var(--border-color)' }}>
                          <button 
                            className="btn-primary" 
                            onClick={() => handleSyncSourceNow(source)}
                            disabled={isSyncing}
                            style={{ flex: 1, minWidth: 140, padding: '7px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                          >
                            <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
                            {isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
                          </button>

                          <button 
                            className="btn-secondary" 
                            onClick={() => {
                              setCatalogSegmentFilter('ALL');
                              setKnowledgeTab('catalog');
                            }}
                            style={{ padding: '7px 10px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                            title="Ver itens deste site"
                          >
                            <ShoppingBag size={14} /> Itens
                          </button>

                          <button 
                            className="btn-secondary" 
                            onClick={() => handleOpenHistory(source)}
                            style={{ padding: '7px 10px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                            title="Histórico de alterações e sincronizações"
                          >
                            <Clock size={14} /> Histórico
                          </button>

                          <button 
                            className="btn-secondary" 
                            onClick={() => handleDeleteSource(source)}
                            style={{ padding: '7px 10px', color: '#f87171' }}
                            title="Excluir fonte"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA 2: ITENS SINCRONIZADOS (CATÁLOGO DA IA) */}
          {knowledgeTab === 'catalog' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Barra de Busca e Filtros */}
              <div className="glass-panel" style={{ padding: 14, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
                  <Search size={16} style={{ color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Buscar itens sincronizados por nome, descrição ou categoria..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    style={{ margin: 0, padding: '8px 12px', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Segmento:</span>
                  {['ALL', 'RESTAURANTE', 'IMOBILIÁRIA', 'CONCESSIONÁRIA', 'SERVIÇOS'].map((seg) => (
                    <button
                      key={seg}
                      onClick={() => setCatalogSegmentFilter(seg)}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 8,
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: catalogSegmentFilter === seg ? '#a855f7' : 'var(--border-color)',
                        background: catalogSegmentFilter === seg ? 'rgba(168, 85, 247, 0.15)' : 'var(--input-bg)',
                        color: catalogSegmentFilter === seg ? '#c084fc' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {seg === 'ALL' ? 'Todos' : seg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid de Itens */}
              {catalogList.length === 0 ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Nenhum item sincronizado ainda. Conecte seu site oficial na aba "Fontes Conectadas".
                </div>
              ) : (
                <div className="catalog-items-grid">
                  {catalogList
                    .filter(item => {
                      if (catalogSegmentFilter !== 'ALL' && item.attributes?.businessType !== catalogSegmentFilter) return false;
                      if (catalogSearch.trim()) {
                        const q = catalogSearch.toLowerCase();
                        const matchName = item.name.toLowerCase().includes(q);
                        const matchDesc = (item.description || '').toLowerCase().includes(q);
                        const matchCat = (item.category || '').toLowerCase().includes(q);
                        return matchName || matchDesc || matchCat;
                      }
                      return true;
                    })
                    .map((item) => (
                      <div key={item.id} className="catalog-item-card">
                        {item.images && item.images.length > 0 ? (
                          <img src={item.images[0]} alt={item.name} className="catalog-item-img" />
                        ) : (
                          <div style={{ height: 120, background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            <ShoppingBag size={28} />
                          </div>
                        )}

                        <div className="catalog-item-body">
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                              {item.category || 'Geral'}
                            </span>
                            <span style={{ 
                              fontSize: '0.68rem', 
                              fontWeight: 700, 
                              padding: '2px 6px', 
                              borderRadius: 6,
                              background: item.status === 'AVAILABLE' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: item.status === 'AVAILABLE' ? '#4ade80' : '#f87171'
                            }}>
                              {item.status === 'AVAILABLE' ? 'Disponível' : 'Indisponível'}
                            </span>
                          </div>

                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{item.name}</h4>
                          
                          {item.description && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {item.description}
                            </p>
                          )}

                          {/* Preço e Atributos */}
                          <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div className="catalog-price-badge">
                              {item.price !== undefined ? `R$ ${Number(item.price).toFixed(2).replace('.', ',')}` : 'Sob consulta'}
                            </div>

                            {item.source_url && (
                              <a 
                                href={item.source_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ fontSize: '0.74rem', color: '#60a5fa', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                              >
                                Ver no site <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 3: ARTIGOS & FAQ MANUAIS */}
          {knowledgeTab === 'faq' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="glass-panel" style={{ padding: 20 }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 14 }}>Novo Artigo / FAQ</h2>
                <input 
                  type="text" 
                  placeholder="Assunto / Pergunta"
                  value={newKbSubject}
                  onChange={(e) => setNewKbSubject(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <textarea 
                  placeholder="Resposta ou diretriz correspondente..."
                  value={newKbContent}
                  onChange={(e) => setNewKbContent(e.target.value)}
                  rows={3}
                  style={{ marginBottom: 12 }}
                />
                <button className="btn-primary" onClick={handleAddKnowledge}>
                  <Plus size={16} /> Salvar Artigo
                </button>
              </div>

              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12 }}>Artigos Cadastrados ({knowledgeList.length})</h2>
                {knowledgeList.length === 0 ? (
                  <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)' }}>
                    Nenhum artigo cadastrado ainda.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {knowledgeList.map((k, i) => (
                      <div key={k.id || i} className="glass-card" style={{ padding: 14 }}>
                        <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.95rem' }}>{k.subject}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          {k.data?.content || JSON.stringify(k.data)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODAL: ADICIONAR FONTE DE CONHECIMENTO */}
          {showAddSourceModal && (
            <div className="modal-backdrop" onClick={() => !isSyncingSourceId && setShowAddSourceModal(false)}>
              <div className="glass-panel" style={{ maxWidth: 540, width: '90%', padding: 26 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
                      <Globe size={20} />
                    </div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Adicionar Fonte de Conhecimento</h2>
                  </div>
                  {!isSyncingSourceId && (
                    <button onClick={() => setShowAddSourceModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <X size={20} />
                    </button>
                  )}
                </div>

                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                  Escolha o tipo de fonte para ensinar o Multiplex:
                </p>

                {/* Seleção do Tipo de Fonte */}
                <div className="source-type-selection-grid">
                  {[
                    { id: 'SITE', label: 'Site', desc: 'Sincronização web', icon: <Globe size={18} /> },
                    { id: 'DOCUMENT', label: 'Documento', desc: 'PDF, DOCX', icon: <FileText size={18} /> },
                    { id: 'TEXT', label: 'Texto', desc: 'Anotações livres', icon: <Edit3 size={18} /> },
                    { id: 'FILE', label: 'Arquivo', desc: 'Planilhas CSV', icon: <Paperclip size={18} /> },
                    { id: 'OTHER', label: 'Outra fonte', desc: 'Notion, Drive', icon: <Layers size={18} /> }
                  ].map((t) => (
                    <div 
                      key={t.id} 
                      className={`source-type-option ${selectedSourceType === t.id ? 'active' : ''}`}
                      onClick={() => !isSyncingSourceId && setSelectedSourceType(t.id as any)}
                    >
                      <div style={{ color: selectedSourceType === t.id ? '#c084fc' : 'var(--text-muted)' }}>
                        {t.icon}
                      </div>
                      <span>{t.label}</span>
                    </div>
                  ))}
                </div>

                {/* Formulário para Site */}
                {selectedSourceType === 'SITE' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                        URL do Site Oficial *
                      </label>
                      <input 
                        type="url"
                        placeholder="https://empresa.com.br"
                        value={newSourceUrl}
                        onChange={(e) => setNewSourceUrl(e.target.value)}
                        disabled={Boolean(isSyncingSourceId)}
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                        Exemplo: https://empresa.com.br ou https://minhaloja.com
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                          Nome Identificador
                        </label>
                        <input 
                          type="text"
                          placeholder="Ex: Site Principal"
                          value={newSourceName}
                          onChange={(e) => setNewSourceName(e.target.value)}
                          disabled={Boolean(isSyncingSourceId)}
                          style={{ margin: 0 }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                          Segmento do Negócio
                        </label>
                        <select 
                          value={newSourceSegment}
                          onChange={(e) => setNewSourceSegment(e.target.value as any)}
                          disabled={Boolean(isSyncingSourceId)}
                          style={{ 
                            width: '100%', 
                            padding: '10px 12px', 
                            borderRadius: 10, 
                            background: 'var(--input-bg)', 
                            color: 'var(--text-color)', 
                            border: '1px solid var(--border-color)' 
                          }}
                        >
                          <option value="AUTO">✨ Auto-Detectar</option>
                          <option value="RESTAURANTE">Restaurante / Delivery</option>
                          <option value="IMOBILIÁRIA">Imobiliária / Imóveis</option>
                          <option value="LOJA">Loja / Varejo</option>
                          <option value="ECOMMERCE">E-commerce</option>
                          <option value="CONCESSIONÁRIA">Concessionária / Veículos</option>
                          <option value="HOTEL">Hotel / Pousada</option>
                          <option value="SERVIÇOS">Prestador de Serviços / Clínica</option>
                          <option value="EMPRESA_GERAL">Empresa em Geral</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>Sincronização Recorrente</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Manter catálogo atualizado automaticamente</div>
                      </div>
                      <select 
                        value={newSourceFrequency}
                        onChange={(e) => setNewSourceFrequency(e.target.value as any)}
                        disabled={Boolean(isSyncingSourceId)}
                        style={{ padding: '6px 10px', borderRadius: 8, background: 'var(--input-bg)', color: 'var(--text-color)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}
                      >
                        <option value="1h">A cada 1h</option>
                        <option value="6h">A cada 6h</option>
                        <option value="12h">A cada 12h</option>
                        <option value="24h">A cada 24h</option>
                        <option value="semanal">Semanal</option>
                      </select>
                    </div>

                    {sourceFormError && (
                      <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertCircle size={16} /> {sourceFormError}
                      </div>
                    )}

                    {/* Stepper de progresso em tempo real */}
                    {isSyncingSourceId && (
                      <div className="sync-progress-box">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                          <span style={{ fontWeight: 600, color: '#c084fc', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <RefreshCw size={14} className="spin" /> {syncStepText}
                          </span>
                          <span style={{ fontWeight: 700 }}>{syncProgressPercent}%</span>
                        </div>

                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: `${syncProgressPercent}%` }} />
                        </div>

                        {syncDetailText && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {syncDetailText}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                      {!isSyncingSourceId && (
                        <button className="btn-secondary" onClick={() => setShowAddSourceModal(false)}>
                          Cancelar
                        </button>
                      )}
                      <button 
                        className="btn-primary" 
                        onClick={handleCreateAndSyncSource}
                        disabled={Boolean(isSyncingSourceId)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 160, justifyContent: 'center' }}
                      >
                        {isSyncingSourceId ? (
                          <>
                            <RefreshCw size={15} className="spin" /> Processando...
                          </>
                        ) : (
                          <>
                            <Zap size={15} /> Sincronizar site
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Formulário para outras fontes */}
                {selectedSourceType !== 'SITE' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 6 }}>
                        Nome ou Título da Fonte
                      </label>
                      <input 
                        type="text"
                        placeholder="Ex: Manual de Produtos 2026"
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                        style={{ margin: 0 }}
                      />
                    </div>

                    <div style={{ padding: 24, border: '2px dashed var(--border-color)', borderRadius: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                      <Paperclip size={24} style={{ marginBottom: 6 }} />
                      <div>Arraste arquivos ou clique para selecionar do computador</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                      <button className="btn-secondary" onClick={() => setShowAddSourceModal(false)}>
                        Cancelar
                      </button>
                      <button className="btn-primary" onClick={handleCreateAndSyncSource}>
                        <Check size={16} /> Salvar Fonte
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODAL: RESUMO DA SINCRONIZAÇÃO */}
          {syncSummaryData && (
            <div className="modal-backdrop" onClick={() => setSyncSummaryData(null)}>
              <div className="glass-panel" style={{ maxWidth: 500, width: '90%', padding: 26 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Sincronização Concluída!</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{syncSummaryData.sourceName} ({syncSummaryData.url})</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 18 }}>
                  O Multiplex processou o site e atualizou a base de conhecimento com os dados estruturados mais recentes.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                  <div className="glass-card" style={{ padding: 12 }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Páginas & Itens Lidos</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-color)' }}>
                      {syncSummaryData.run?.items_found || 0}
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: 12 }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Novos Itens Criados</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4ade80' }}>
                      +{syncSummaryData.run?.items_created || 0}
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: 12 }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Itens Atualizados</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>
                      ↻ {syncSummaryData.run?.items_updated || 0}
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: 12 }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Total Ativo no Agente</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#c084fc' }}>
                      📦 {syncSummaryData.totalCatalog || 0}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button className="btn-secondary" onClick={() => setSyncSummaryData(null)}>
                    Fechar
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={() => {
                      setSyncSummaryData(null);
                      setKnowledgeTab('catalog');
                    }}
                  >
                    <ShoppingBag size={15} /> Ver Itens Sincronizados
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: HISTÓRICO DE SINCRONIZAÇÕES & ALTERAÇÕES */}
          {historyModalSource && (
            <div className="modal-backdrop" onClick={() => setHistoryModalSource(null)}>
              <div className="glass-panel" style={{ maxWidth: 650, width: '92%', maxHeight: '85vh', overflowY: 'auto', padding: 26 }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 2px 0' }}>Histórico de Sincronizações</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{historyModalSource.name} — {historyModalSource.url}</span>
                  </div>
                  <button onClick={() => setHistoryModalSource(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                {historyRuns.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    Nenhuma execução registrada para esta fonte ainda.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {historyRuns.map((run) => {
                      const isSelected = selectedRunId === run.id;
                      const runDate = new Date(run.started_at).toLocaleString('pt-BR');

                      return (
                        <div 
                          key={run.id}
                          className="glass-card" 
                          style={{ 
                            padding: 14, 
                            cursor: 'pointer',
                            borderColor: isSelected ? '#a855f7' : undefined,
                            background: isSelected ? 'rgba(168, 85, 247, 0.08)' : undefined
                          }}
                          onClick={() => handleSelectRunForChanges(run.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ 
                                width: 8, 
                                height: 8, 
                                borderRadius: '50%', 
                                background: run.status === 'COMPLETED' ? '#4ade80' : '#f87171' 
                              }} />
                              <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{runDate}</span>
                            </div>
                            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {run.status === 'COMPLETED' ? 'Sucesso' : 'Falha'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: '0.76rem' }}>
                            <span className="sync-chip created">+{run.items_created} novos</span>
                            <span className="sync-chip updated">↻ {run.items_updated} atualizados</span>
                            <span className="sync-chip removed">−{run.items_removed} removidos</span>
                            <span className="sync-chip total">✓ {run.items_unchanged} inalterados</span>
                          </div>

                          {/* Se este run estiver selecionado, exibe a lista de alterações detalhadas */}
                          {isSelected && selectedRunChanges.length > 0 && (
                            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                                Alterações Detectadas ({selectedRunChanges.length}):
                              </div>
                              {selectedRunChanges.map((change) => (
                                <div key={change.id} style={{ fontSize: '0.78rem', padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontWeight: 600 }}>{change.item_name}</span>
                                  <span style={{ 
                                    padding: '2px 6px', 
                                    borderRadius: 4, 
                                    fontSize: '0.7rem', 
                                    fontWeight: 700,
                                    background: change.change_type === 'CREATED' ? 'rgba(34, 197, 94, 0.2)' : change.change_type === 'PRICE_CHANGED' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                    color: change.change_type === 'CREATED' ? '#4ade80' : change.change_type === 'PRICE_CHANGED' ? '#38bdf8' : '#f87171'
                                  }}>
                                    {change.change_type === 'PRICE_CHANGED' ? `Preço: R$ ${change.old_data?.price} ➔ R$ ${change.new_data?.price}` : change.change_type}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── BONASOFT Watermark ── */}
          <div className="bonasoft-watermark-container" style={{ marginTop: 28 }}>
            <p className="bonasoft-watermark">BONASOFT</p>
          </div>
        </div>
      )}


      {/* TELA: CONECTAR CANAIS MULTICANAL COM ASSISTENTE DE IA */}
      {activeView === 'channels' && (
        <div className="main-panel-scrollable">
          <div className="page-header" style={{ marginBottom: 18 }}>
            <div>
              <h1 className="page-title">Conectar Redes Sociais e Canais</h1>
              <p className="page-desc">Atendimento simultaneo pelo Multiplex no WhatsApp, Instagram, Facebook, Telegram, X e Site. A IA auxilia você passo a passo na conexão.</p>
            </div>
            <button className="btn-secondary" onClick={() => setActiveView('chat')}>
              <MessageSquare size={16} /> Voltar ao Chat
            </button>
          </div>

          {/* IA CONTEXTUAL: INTEGRAÇÕES E CANAIS */}
          <ContextualAIChatCard
            apiBase={API_BASE}
            context={{
              page: 'integrations',
              module: 'integrations',
              integration_context: 'channels'
            }}
            title="💬 Fale com a IA sobre integrações"
            subtitle="Conecte o MT 24 Horas Express, configure despacho de corridas ou integre WhatsApp e Instagram."
            suggestions={[
              'Quero conectar o MT 24 Horas Express',
              'Quero pedir uma corrida pelo WhatsApp',
              'Como conectar o WhatsApp Business?'
            ]}
            onActionCompleted={() => {
              loadData();
            }}
          />

          {/* GRID COM TODOS OS CANAIS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
            {(channels && channels.length > 0 ? channels : [
              { name: 'WhatsApp Business', type: 'whatsapp', connected: false, description: 'Evolution API, Z-API, Baileys ou Meta Cloud API com QR Code.' },
              { name: 'Instagram Direct', type: 'instagram', connected: false, description: 'Respostas automáticas em mensagens diretas (DMs) e comentários.' },
              { name: 'Facebook Messenger', type: 'facebook', connected: false, description: 'Atendimento automático em Páginas do Facebook e Messenger.' },
              { name: 'Telegram Bot', type: 'telegram', connected: false, description: 'Bot oficial do Telegram para consultas de cardápio, suporte e pedidos.' },
              { name: 'X (Twitter) DMs', type: 'x', connected: false, description: 'Respostas automáticas em mensagens diretas no seu perfil do X.' },
              { name: 'Webchat / Widget para Site', type: 'webchat', connected: true, accountName: 'Widget Ativo', description: 'Balão flutuante de chat com script fácil para colar no site.' }
            ]).map((channel: any) => {
              const getChannelIcon = (type: string) => {
                switch (type) {
                  case 'whatsapp': return <Smartphone size={28} color="#25d366" />;
                  case 'instagram': return <Instagram size={28} color="#e1306c" />;
                  case 'facebook': return <Facebook size={28} color="#1877f2" />;
                  case 'telegram': return <Send size={28} color="#0088cc" />;
                  case 'x': return <Twitter size={28} color="#ffffff" />;
                  default: return <Globe size={28} color="#00d2ff" />;
                }
              };

              return (
                <div 
                  key={channel.type} 
                  className="glass-panel" 
                  style={{ 
                    padding: 22, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    border: channel.connected ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                    boxShadow: channel.connected ? '0 0 20px rgba(16, 185, 129, 0.08)' : 'none'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          width: 46, 
                          height: 46, 
                          borderRadius: 12, 
                          background: 'rgba(255, 255, 255, 0.04)', 
                          border: '1px solid var(--border-subtle)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          {getChannelIcon(channel.type)}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{channel.name}</h3>
                          {channel.accountName && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{channel.accountName}</span>
                          )}
                        </div>
                      </div>

                      {channel.connected ? (
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                          ● Conectado
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          Pronto para Conectar
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: 16 }}>
                      {channel.description || 'Integracao multicanal com respostas do Multiplex.'}
                    </p>
                  </div>

                  <div>
                    {channel.webhookUrl && (
                      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0, 0, 0, 0.25)', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {channel.webhookUrl}
                        </span>
                        <button 
                          onClick={() => handleCopyWebhook(channel.webhookUrl)} 
                          style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                          title="Copiar URL do Webhook"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        className="btn-primary" 
                        onClick={() => handleOpenChannel(channel)}
                        style={{ 
                          flex: 1, 
                          justifyContent: 'center',
                          background: channel.connected 
                            ? 'linear-gradient(135deg, #059669, #10b981)' 
                            : 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))'
                        }}
                      >
                        <Sparkles size={15} />
                        <span>{channel.connected ? 'Gerenciar Conexao' : 'Conectar com Guia IA'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── BONASOFT Watermark ── */}
          <div className="bonasoft-watermark-container" style={{ marginTop: 32 }}>
            <p className="bonasoft-watermark">BONASOFT</p>
          </div>

          {/* MODAL INTERATIVO: ASSISTENTE DE CONEXAO GUIADO PELA MULTIPLEX IA */}
          {selectedChannel && (
            <div className="modal-backdrop" onClick={() => setSelectedChannel(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840, width: '92%' }}>
                {/* Cabecalho do Modal */}
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(0, 210, 255, 0.4)', minWidth: 34 }}>
                      <img src={atomLogo} alt="Multiplex" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                        Assistente de Conexao: {selectedChannel.name}
                      </h2>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Multiplex orienta você no passo a passo exato da integracao
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setSelectedChannel(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Abas do Modal */}
                <div className="modal-tabs">
                  <button 
                    className={`modal-tab-btn ${channelModalTab === 'guide' ? 'active' : ''}`}
                    onClick={() => setChannelModalTab('guide')}
                  >
                    <Sliders size={15} /> Passo a Passo Ilustrado
                  </button>

                  <button 
                    className={`modal-tab-btn ${channelModalTab === 'ai_chat' ? 'active' : ''}`}
                    onClick={() => setChannelModalTab('ai_chat')}
                  >
                    <Sparkles size={15} /> Tira-Duvidas com IA (GPT-4o)
                  </button>

                  <button 
                    className={`modal-tab-btn ${channelModalTab === 'credentials' ? 'active' : ''}`}
                    onClick={() => setChannelModalTab('credentials')}
                  >
                    <CheckCircle2 size={15} /> Status e Desconectar
                  </button>
                </div>

                {/* Corpo do Modal */}
                <div className="modal-body" style={{ padding: 22 }}>
                  {/* ABA 1: GUIA PASSO A PASSO */}
                  {channelModalTab === 'guide' && (
                    <div>
                      {/* Box do Webhook oficial com botao de copiar */}
                      <div style={{ padding: 16, borderRadius: 10, background: 'rgba(0, 210, 255, 0.05)', border: '1px solid rgba(0, 210, 255, 0.25)', marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                            URL DO WEBHOOK OFICIAL DO SEU MULTIPLEX IA
                          </span>
                          {copiedUrl && (
                            <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 600 }}>Copiado para a area de transferencia!</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <input 
                            type="text" 
                            readOnly 
                            value={selectedChannel.webhookUrl} 
                            style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.84rem', background: 'rgba(0, 0, 0, 0.4)' }}
                          />
                          <button 
                            className="btn-secondary" 
                            onClick={() => handleCopyWebhook(selectedChannel.webhookUrl)}
                            style={{ whiteSpace: 'nowrap' }}
                          >
                            <Copy size={15} /> Copiar Webhook URL
                          </button>
                        </div>
                      </div>

                      {/* Se for Webchat, mostra o script para embed */}
                      {selectedChannel.type === 'webchat' && (
                        <div style={{ padding: 14, borderRadius: 10, background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.25)', marginBottom: 20 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6 }}>Codigo do Script para colar no seu site:</div>
                          <pre style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 6, overflowX: 'auto' }}>
{`<script src="http://localhost:3000/widget/multiplex-chat.js" data-agent="multiplex-ia" defer></script>`}
                          </pre>
                        </div>
                      )}

                      {/* Lista numerada de passos */}
                      <div style={{ marginBottom: 22 }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>
                          Como Conectar em Poucos Passos:
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {(selectedChannel.setupInstructions || [
                            'Acesse o painel oficial da plataforma.',
                            'Cole a URL do Webhook acima no campo correspondente.',
                            'Gere seu Token de Acesso da API.',
                            'Informe os dados abaixo e clique em Testar Conexao.'
                          ]).map((instruction: string, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))', color: '#fff', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 24 }}>
                                {idx + 1}
                              </div>
                              <span style={{ fontSize: '0.86rem', lineHeight: '1.4' }}>{instruction}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Campos de Credenciais do Canal */}
                      <div style={{ padding: 16, borderRadius: 10, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', marginBottom: 18 }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>
                          Credenciais e Identificacao da Conta
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {(selectedChannel.fields || [
                            { key: 'accountName', label: 'Nome ou Identificador da Conta', placeholder: 'ex: Minha Empresa Oficial' }
                          ]).map((f: any) => (
                            <div key={f.key}>
                              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>
                                {f.label}
                              </label>
                              <input 
                                type={f.type || 'text'}
                                placeholder={f.placeholder}
                                value={channelCreds[f.key] || ''}
                                onChange={(e) => setChannelCreds({ ...channelCreds, [f.key]: e.target.value })}
                                style={{ width: '100%', fontSize: '0.88rem' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Feedback de Teste */}
                      {channelTestSuccess && (
                        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.9rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <CheckCircle2 size={18} />
                          <span>{channelTestSuccess}</span>
                        </div>
                      )}

                      {/* Botao de Acao */}
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button 
                          className="btn-secondary" 
                          onClick={() => setChannelModalTab('ai_chat')}
                        >
                          <HelpCircle size={15} /> Preciso de Ajuda com Este Canal
                        </button>

                        <button 
                          className="btn-primary" 
                          onClick={handleTestAndActivateChannel}
                          disabled={isTestingChannel}
                          style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                        >
                          {isTestingChannel ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              <span>Validando Webhook...</span>
                            </>
                          ) : (
                            <>
                              <Check size={16} />
                              <span>Testar e Ativar Conexao Agora</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ABA 2: TIRA-DUVIDAS COM MULTIPLEX IA (GPT-4o) */}
                  {channelModalTab === 'ai_chat' && (
                    <div>
                      <div style={{ marginBottom: 14 }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                          Assistente Tecnico Multiplex (GPT-4o)
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          Pergunte qualquer duvida sobre onde clicar, como achar os tokens ou solucionar erros na conexao deste canal.
                        </p>
                      </div>

                      {/* Sugestoes de perguntas rapidas */}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                        <button 
                          className="btn-secondary" 
                          style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                          onClick={() => handleAskChannelAi('Onde exatamente eu consigo o token de acesso neste canal?')}
                        >
                          Onde acho o Token?
                        </button>
                        <button 
                          className="btn-secondary" 
                          style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                          onClick={() => handleAskChannelAi('Qual e o passo a passo para configurar o webhook sem erros?')}
                        >
                          Passo a passo do Webhook
                        </button>
                        <button 
                          className="btn-secondary" 
                          style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                          onClick={() => handleAskChannelAi('Como faco para testar se as mensagens estao chegando ao Multiplex?')}
                        >
                          Como testar mensagens?
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                        <input 
                          type="text" 
                          placeholder="Digite sua duvida sobre a conexao deste canal..."
                          value={channelAiPrompt}
                          onChange={(e) => setChannelAiPrompt(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAskChannelAi()}
                          style={{ flex: 1 }}
                        />
                        <button 
                          className="btn-primary" 
                          onClick={() => handleAskChannelAi()}
                          disabled={isAskingChannelAi || !channelAiPrompt.trim()}
                        >
                          {isAskingChannelAi ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Sparkles size={16} />
                          )}
                          <span>Perguntar</span>
                        </button>
                      </div>

                      {channelAiReply ? (
                        <div style={{ padding: 18, borderRadius: 10, background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(0, 210, 255, 0.3)', whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: '1.55' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: 'var(--accent-cyan)', fontWeight: 700 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden' }}>
                              <img src={atomLogo} alt="Multiplex" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <span>Instrucoes da Multiplex:</span>
                          </div>
                          {channelAiReply}
                        </div>
                      ) : (
                        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)', border: '1px dashed var(--border-subtle)', borderRadius: 10 }}>
                          Clique em uma das perguntas acima ou digite sua duvida para receber instrucoes passo a passo geradas pela IA.
                        </div>
                      )}
                    </div>
                  )}

                  {/* ABA 3: STATUS E DESCONECTAR */}
                  {channelModalTab === 'credentials' && (
                    <div>
                      <div style={{ padding: 18, borderRadius: 10, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', marginBottom: 20 }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 8 }}>Status da Integracao</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          {selectedChannel.connected ? (
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              ● Conectado e Ativo
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                              Desconectado
                            </span>
                          )}
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {selectedChannel.accountName || 'Nenhuma conta vinculada no momento'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: 0 }}>
                          Quando ativo, todas as mensagens recebidas neste canal são respondidas automaticamente pelo Multiplex respeitando o cardápio e regras cadastradas.
                        </p>
                      </div>

                      {selectedChannel.connected && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-secondary" 
                            onClick={() => handleDisconnectChannel(selectedChannel.type)}
                            style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          >
                            <Trash2 size={15} /> Desconectar Este Canal
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TELA: PLAYGROUND */}
      {activeView === 'playground' && (
        <div className="main-panel-scrollable">
          <div className="page-header" style={{ marginBottom: 0 }}>
            <div>
              <h1 className="page-title" style={{ fontSize: '1.3rem' }}>Playground de Testes</h1>
              <p className="page-desc" style={{ fontSize: '0.8rem' }}>Simulação e inspeção de funções e regras em tempo real.</p>
            </div>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setActiveView('chat')}>
              <MessageSquare size={14} /> Voltar ao Chat
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, height: 'calc(100vh - 130px)', minHeight: '340px', maxHeight: '450px' }}>
            <div className="glass-panel" style={{ padding: 14, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
                {playgroundMessages.map((m, idx) => (
                  <div key={idx} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{
                      background: m.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-card-inner)',
                      color: m.role === 'user' ? '#fff' : 'var(--text-main)',
                      padding: '8px 12px',
                      borderRadius: 14,
                      fontSize: '0.84rem',
                      border: m.role === 'assistant' ? '1px solid var(--border-subtle)' : 'none'
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input 
                  type="text" 
                  placeholder="Digite uma mensagem de teste..."
                  value={playgroundInput}
                  onChange={(e) => setPlaygroundInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePlaygroundSend()}
                  style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                />
                <button className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem' }} onClick={handlePlaygroundSend}>
                  <Send size={14} /> Testar
                </button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 14, overflowY: 'auto', height: '100%' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 8 }}>Diagnostico de Execucao</h2>
              {playgroundDebug ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="glass-card" style={{ padding: 12 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Latencia</div>
                    <div style={{ fontWeight: 700, color: '#10b981' }}>{playgroundDebug.latency} ms</div>
                  </div>
                  <div className="glass-card" style={{ padding: 12 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Ferramentas Executadas</div>
                    <pre style={{ fontSize: '0.75rem', marginTop: 4 }}>{JSON.stringify(playgroundDebug.tools, null, 2)}</pre>
                  </div>
                  <div className="glass-card" style={{ padding: 12 }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Regras Aplicadas</div>
                    <pre style={{ fontSize: '0.75rem', marginTop: 4 }}>{JSON.stringify(playgroundDebug.rules, null, 2)}</pre>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  Envie uma mensagem para inspecionar parametros.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TELA: DASHBOARD EXECUTIVO COMPLETO (PRIMEIRA ABA) */}
      {activeView === 'dashboard' && (
        <ExecutiveDashboardView 
          data={dashboardData}
          onRefresh={loadData}
          onNavigate={(v) => setActiveView(v)}
          companyName="Minha Empresa"
          apiBase={API_BASE}
        />
      )}

      {/* TELA: AI APP BUILDER (CRIAR COM IA) */}
      {activeView === 'builder' && (
        <AIBuilderView 
          apiBase={API_BASE}
          onOpenModule={(mod) => {
            setCurrentDynamicModule(mod);
            setActiveView('dynamic_module');
            loadSidebarModules();
          }}
        />
      )}

      {/* TELA: MÓDULO DINÂMICO CONSTRUÍDO POR IA */}
      {activeView === 'dynamic_module' && currentDynamicModule && (
        <DynamicModuleView 
          module={currentDynamicModule}
          apiBase={API_BASE}
          onBack={() => {
            setActiveView('builder');
            loadSidebarModules();
          }}
          onModuleUpdated={(updated) => {
            setCurrentDynamicModule(updated);
            loadSidebarModules();
          }}
          onDeleteModule={(_id) => {
            setCurrentDynamicModule(null);
            setActiveView('builder');
            loadSidebarModules();
          }}
        />
      )}

      {/* MODAL PRINCIPAL DE PERFIL E CONTA COM PLANO E MENSALIDADE */}
      {showProfileModal && (
        <div className="modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: 940, width: '95%', padding: 0, overflow: 'hidden' }}
          >
            {/* Cabecalho Unificado */}
            <div className="modal-header" style={{ padding: '16px 22px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar-circle" style={{ width: 34, height: 34, fontSize: '0.85rem' }}>AN</div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Conta & Perfil</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>anthony_both • {billingData?.plan?.name || 'Profissional'}</span>
                </div>
              </div>

              <button 
                onClick={() => setShowProfileModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Layout em Grid: Menu Lateral a Esquerda + Conteudo a Direita */}
            <div className="profile-modal-grid">
              {/* Menu Lateral do Perfil */}
              <nav className="profile-nav-sidebar">
                <button 
                  className={`profile-nav-item ${profileActiveTab === 'personal' ? 'active' : ''}`}
                  onClick={() => setProfileActiveTab('personal')}
                >
                  <User size={16} />
                  <span>Informações pessoais</span>
                </button>

                <button 
                  className={`profile-nav-item ${profileActiveTab === 'security' ? 'active' : ''}`}
                  onClick={() => setProfileActiveTab('security')}
                >
                  <Shield size={16} />
                  <span>Segurança</span>
                </button>

                <button 
                  className={`profile-nav-item ${profileActiveTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => setProfileActiveTab('notifications')}
                >
                  <Bell size={16} />
                  <span>Notificações</span>
                </button>

                <button 
                  className={`profile-nav-item ${profileActiveTab === 'plan' ? 'active' : ''}`}
                  onClick={() => setProfileActiveTab('plan')}
                >
                  <CreditCard size={16} />
                  <span>Plano e Mensalidade</span>
                </button>

                <div style={{ flex: 1 }} />

                <div className="user-popup-divider" />

                <button 
                  className="profile-nav-item"
                  style={{ color: '#ef4444' }}
                  onClick={() => {
                    setShowProfileModal(false);
                    setConfirmModal({ type: 'logout' });
                  }}
                >
                  <LogOut size={16} />
                  <span>Sair</span>
                </button>
              </nav>

              {/* Conteudo da Aba Selecionada */}
              <div className="profile-tab-content">
                {/* NOTIFICACAO DE ACAO DO PLANO */}
                {planActionMessage && (
                  <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} />
                    <span>{planActionMessage}</span>
                  </div>
                )}

                {/* ABA: PLANO E MENSALIDADE */}
                {profileActiveTab === 'plan' && (
                  <div>
                    <div style={{ marginBottom: 20 }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Plano e Mensalidade</h2>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Gerencie sua assinatura, limites de uso, faturamento e upgrades da plataforma.
                      </p>
                    </div>

                    {/* SECAO 1: SEU PLANO ATUAL */}
                    <div className="glass-panel" style={{ padding: 22, marginBottom: 22, border: '1px solid rgba(0, 210, 255, 0.35)', background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.75), rgba(10, 15, 30, 0.85))' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-dim)' }}>
                            Seu plano atual
                          </span>
                          <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 4, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                            {billingData?.plan?.name?.toUpperCase() || 'PROFISSIONAL'}
                          </div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#10b981', marginTop: 2 }}>
                            R$ {billingData?.subscription?.price || 299} / mes
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.78rem', fontWeight: 600 }}>
                            {billingData?.subscription?.status === 'cancel_scheduled' ? (
                              <span style={{ color: '#f59e0b' }}>● Cancelamento agendado</span>
                            ) : (
                              <span>● Ativa</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>
                            Proxima cobranca: 07 de outubro de 2026
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                        <button 
                          className="btn-primary"
                          onClick={() => {
                            const el = document.getElementById('available-plans-grid');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          <Sparkles size={15} />
                          <span>Fazer upgrade</span>
                        </button>

                        <button 
                          className="btn-secondary"
                          onClick={() => alert('Gerenciamento de faturamento e cartoes disponivel via Gateway Seguro.')}
                        >
                          <CreditCard size={15} />
                          <span>Gerenciar assinatura</span>
                        </button>

                        {billingData?.subscription?.status === 'cancel_scheduled' ? (
                          <button 
                            className="btn-secondary"
                            onClick={handleReactivateSubscription}
                            style={{ color: '#10b981' }}
                          >
                            Reativar Assinatura
                          </button>
                        ) : (
                          <button 
                            className="btn-secondary"
                            onClick={() => setConfirmModal({ type: 'cancel' })}
                            style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}
                          >
                            Cancelar assinatura
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SECAO 2: USO DO PLANO (BARRAS DE PROGRESSO E AVISOS) */}
                    <div className="glass-panel" style={{ padding: 20, marginBottom: 22 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Uso do plano</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Periodo vigente: 07/09/2026 - 07/10/2026</span>
                      </div>

                      {/* Alerta de 84% de limite conforme especificacao */}
                      <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#f59e0b', fontSize: '0.85rem', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <AlertCircle size={16} />
                          <span>Você utilizou 84% do limite de mensagens de IA deste mês.</span>
                        </div>
                        <button 
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', background: 'rgba(0,0,0,0.3)' }}
                          onClick={() => {
                            const el = document.getElementById('available-plans-grid');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >
                          Ver planos
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                            <span style={{ fontWeight: 600 }}>Mensagens de IA</span>
                            <span style={{ color: 'var(--text-muted)' }}>8.420 / 10.000 (84%)</span>
                          </div>
                          <div className="usage-track">
                            <div className="usage-fill" style={{ width: '84%', background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                            <span style={{ fontWeight: 600 }}>Agentes de IA</span>
                            <span style={{ color: 'var(--text-muted)' }}>1 / 1 (100%)</span>
                          </div>
                          <div className="usage-track">
                            <div className="usage-fill" style={{ width: '100%', background: 'var(--accent-primary)' }} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                            <span style={{ fontWeight: 600 }}>Canais Conectados</span>
                            <span style={{ color: 'var(--text-muted)' }}>2 / 3 (66%)</span>
                          </div>
                          <div className="usage-track">
                            <div className="usage-fill" style={{ width: '66%', background: 'var(--accent-cyan)' }} />
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                            <span style={{ fontWeight: 600 }}>Armazenamento</span>
                            <span style={{ color: 'var(--text-muted)' }}>3,2 GB / 10 GB (32%)</span>
                          </div>
                          <div className="usage-track">
                            <div className="usage-fill" style={{ width: '32%', background: '#10b981' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECAO 3: TABELA DE LIMITES */}
                    <div className="glass-panel" style={{ padding: 20, marginBottom: 22 }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>Tabela de Limites do Contrato</h3>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                            <th style={{ padding: '8px 10px' }}>Recurso</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Utilizado</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Limite</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px' }}>Mensagens IA</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>8.420</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>10.000</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>84% (Atenção)</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px' }}>Agentes Ativos</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>1</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>1</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-muted)' }}>Capacidade máx.</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px' }}>Canais Conectados</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>2</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>3</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#10b981' }}>Disponível (1 livre)</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px' }}>Usuários / Atendentes</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>3</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>5</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#10b981' }}>Normal</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px' }}>Documentos na Base</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>28</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>100</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#10b981' }}>Normal</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '10px' }}>Armazenamento</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>3,2 GB</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>10 GB</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#10b981' }}>32% utilizado</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* SECAO 4: SEU PLANO INCLUI (BENEFICIOS ATIVOS) */}
                    <div className="glass-panel" style={{ padding: 20, marginBottom: 22 }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>Seu plano inclui</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
                        {[
                          'WhatsApp Business', 'Instagram Direct', 'Facebook Messenger', 'Telegram Bot',
                          '1 Agente de IA', 'Memória de Clientes', 'Base de Conhecimento RAG',
                          'Handoff Humano', 'Analytics e Relatórios', 'Suporte Prioritário'
                        ].map((b, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem' }}>
                            <Check size={15} color="#10b981" />
                            <span>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SECAO 5: PLANOS DISPONIVEIS (UPGRADE E DOWNGRADE) */}
                    <div id="available-plans-grid" className="glass-panel" style={{ padding: 22, marginBottom: 22 }}>
                      <div style={{ marginBottom: 16 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Planos Comerciais Disponiveis</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Escolha o plano ideal para a escala de atendimento do seu negocio.
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                        {(billingPlans && billingPlans.length > 0 ? billingPlans : [
                          { id: 'plan_basic', name: 'Básico', price_monthly: 149, description: 'Para pequenos negócios.' },
                          { id: 'plan_pro', name: 'Profissional', price_monthly: 299, popular: true, description: 'Para empresas omnichannel.' },
                          { id: 'plan_business', name: 'Business', price_monthly: 599, description: 'Para maior volume e equipes.' },
                          { id: 'plan_enterprise', name: 'Enterprise', price_monthly: 1000, is_custom: true, description: 'Para operações corporativas.' }
                        ]).map((p: any) => {
                          const isCurrent = billingData?.subscription?.plan_id === p.id || (!billingData && p.id === 'plan_pro');
                          return (
                            <div 
                              key={p.id}
                              className="glass-card"
                              style={{ 
                                padding: 16,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                border: isCurrent ? '2px solid #10b981' : (p.popular ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)'),
                                position: 'relative'
                              }}
                            >
                              {p.popular && !isCurrent && (
                                <span className="badge" style={{ position: 'absolute', top: -10, right: 12, background: 'var(--accent-primary)', color: '#fff', fontSize: '0.65rem' }}>
                                  MAIS POPULAR
                                </span>
                              )}
                              {isCurrent && (
                                <span className="badge" style={{ position: 'absolute', top: -10, right: 12, background: '#10b981', color: '#fff', fontSize: '0.65rem' }}>
                                  PLANO ATUAL
                                </span>
                              )}

                              <div>
                                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{p.name}</div>
                                <div style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: 6, color: 'var(--text-main)' }}>
                                  {p.is_custom ? 'Sob consulta' : `R$ ${p.price_monthly}`}
                                  {!p.is_custom && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>/mes</span>}
                                </div>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, marginBottom: 12 }}>
                                  {p.description}
                                </p>

                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem' }}>
                                  {(p.features || [
                                    'Agentes inteligentes',
                                    'Canais multicanal',
                                    'Base de conhecimento'
                                  ]).slice(0, 5).map((f: string, idx: number) => (
                                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <Check size={12} color="#10b981" />
                                      <span>{f}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div style={{ marginTop: 16 }}>
                                {isCurrent ? (
                                  <button 
                                    className="btn-secondary" 
                                    disabled 
                                    style={{ width: '100%', justifyContent: 'center', opacity: 0.7, fontSize: '0.82rem' }}
                                  >
                                    Plano Atual
                                  </button>
                                ) : p.is_custom ? (
                                  <button 
                                    className="btn-secondary"
                                    onClick={() => alert('Entre em contato com nossa equipe corporativa: contato@multiplexia.com')}
                                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}
                                  >
                                    Falar com vendas
                                  </button>
                                ) : (
                                  <button 
                                    className="btn-primary"
                                    onClick={() => {
                                      const isDowngrade = p.price_monthly < (billingData?.subscription?.price || 299);
                                      setConfirmModal({
                                        type: isDowngrade ? 'downgrade' : 'upgrade',
                                        plan: p
                                      });
                                    }}
                                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}
                                  >
                                    {p.price_monthly > (billingData?.subscription?.price || 299) ? 'Fazer upgrade' : 'Mudar para este plano'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SECAO 6: HISTORICO DE COBRANCA */}
                    <div className="glass-panel" style={{ padding: 20 }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>Historico de cobranca</h3>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-dim)' }}>
                            <th style={{ padding: '8px 10px' }}>Data</th>
                            <th style={{ padding: '8px 10px' }}>Plano</th>
                            <th style={{ padding: '8px 10px' }}>Valor</th>
                            <th style={{ padding: '8px 10px' }}>Status</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right' }}>Acao</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(billingData?.history || [
                            { date: '07/09/2026', plan_name: 'Profissional', amount: 299, status: 'Pago' },
                            { date: '07/08/2026', plan_name: 'Profissional', amount: 299, status: 'Pago' },
                            { date: '07/07/2026', plan_name: 'Profissional', amount: 299, status: 'Pago' }
                          ]).map((h: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '10px' }}>{h.date}</td>
                              <td style={{ padding: '10px', fontWeight: 600 }}>{h.plan_name}</td>
                              <td style={{ padding: '10px' }}>R$ {h.amount}</td>
                              <td style={{ padding: '10px' }}>
                                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontSize: '0.72rem' }}>
                                  {h.status}
                                </span>
                              </td>
                              <td style={{ padding: '10px', textAlign: 'right' }}>
                                <button 
                                  className="btn-secondary" 
                                  style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                                  onClick={() => alert(`Fatura de ${h.date} (R$ ${h.amount}) emitida com sucesso.`)}
                                >
                                  Visualizar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ABA: INFORMAÇÕES PESSOAIS */}
                {profileActiveTab === 'personal' && (
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Informações Pessoais</h2>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                      Atualize seus dados cadastrais e informações de perfil.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 500 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>Nome Completo</label>
                        <input type="text" defaultValue="Anthony Both" style={{ width: '100%' }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>Nome de Usuário</label>
                        <input type="text" defaultValue="anthony_both" style={{ width: '100%' }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>E-mail Comercial</label>
                        <input type="email" defaultValue="anthony@amboth.com.br" style={{ width: '100%' }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>Empresa / Organização</label>
                        <input type="text" defaultValue="Anthony Burgers & Delivery" style={{ width: '100%' }} />
                      </div>

                      <button className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 10 }} onClick={() => alert('Dados cadastrais atualizados com sucesso.')}>
                        Salvar Alterações
                      </button>
                    </div>
                  </div>
                )}

                {/* ABA: SEGURANÇA */}
                {profileActiveTab === 'security' && (
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Segurança & Acesso</h2>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                      Configurações de autenticação, senha e sessões ativas.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 500 }}>
                      <div className="glass-card" style={{ padding: 16 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Autenticação em Duas Etapas (2FA)</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Proteja sua conta solicitando um código adicional ao fazer login.</p>
                        <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => alert('Autenticação em duas etapas configurada.')}>Ativar 2FA</button>
                      </div>

                      <div className="glass-card" style={{ padding: 16 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Alterar Senha</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                          <input type="password" placeholder="Senha atual" style={{ width: '100%' }} />
                          <input type="password" placeholder="Nova senha" style={{ width: '100%' }} />
                          <button className="btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => alert('Senha alterada com sucesso.')}>Atualizar Senha</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA: NOTIFICAÇÕES */}
                {profileActiveTab === 'notifications' && (
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Notificações & Alertas</h2>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                      Escolha quais alertas você deseja receber no e-mail e nos canais.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked />
                        <span style={{ fontSize: '0.88rem' }}>Alertas de limite de mensagens (80%, 90% e 100%)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked />
                        <span style={{ fontSize: '0.88rem' }}>Notificação de solicitação de atendimento humano (Handoff)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked />
                        <span style={{ fontSize: '0.88rem' }}>Relatório semanal de conversão e conversas</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* ── BONASOFT Watermark ── */}
                <div className="bonasoft-watermark-container" style={{ marginTop: 28 }}>
                  <p className="bonasoft-watermark">BONASOFT</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO (CANCELAMENTO, DOWNGRADE, UPGRADE, LOGOUT) */}
      {confirmModal && (
        <div className="modal-backdrop" onClick={() => setConfirmModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, padding: 24 }}>
            {confirmModal.type === 'cancel' && (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>Tem certeza que deseja cancelar?</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginTop: 10 }}>
                  Ao confirmar o cancelamento:
                </p>
                <ul style={{ fontSize: '0.82rem', color: 'var(--text-muted)', paddingLeft: 18, lineHeight: '1.5' }}>
                  <li>Seu acesso permanecerá ativo até <strong>07 de outubro de 2026</strong>.</li>
                  <li>Após esta data, o agente Multiplex será pausado em todos os canais.</li>
                  <li>Você perderá o histórico de conversas e integrações ativas.</li>
                </ul>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button className="btn-secondary" onClick={() => setConfirmModal(null)}>
                    Continuar assinatura
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={handleCancelSubscription}
                    disabled={isChangingPlan}
                    style={{ background: '#ef4444' }}
                  >
                    Confirmar cancelamento
                  </button>
                </div>
              </div>
            )}

            {confirmModal.type === 'downgrade' && (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Alterar para o Plano {confirmModal.plan?.name}?</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginTop: 10 }}>
                  Seu plano atual possui recursos que não estarão disponíveis no novo plano:
                </p>
                <div style={{ padding: 12, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', fontSize: '0.82rem', marginBottom: 14 }}>
                  <strong>Você perderá:</strong>
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li>Canais adicionais conectados (apenas 1 canal suportado)</li>
                    <li>Limite maior de mensagens de IA</li>
                    <li>Suporte prioritário e automações avançadas</li>
                  </ul>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                  <button className="btn-secondary" onClick={() => setConfirmModal(null)}>
                    Voltar
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={() => handleChangePlan(confirmModal.plan?.id)}
                    disabled={isChangingPlan}
                  >
                    Confirmar Mudança
                  </button>
                </div>
              </div>
            )}

            {confirmModal.type === 'upgrade' && (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Fazer Upgrade para {confirmModal.plan?.name}?</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginTop: 10 }}>
                  Novo valor: <strong>R$ {confirmModal.plan?.price_monthly} / mês</strong>.
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Seus novos limites e recursos serão liberados imediatamente.
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button className="btn-secondary" onClick={() => setConfirmModal(null)}>
                    Cancelar
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={() => handleChangePlan(confirmModal.plan?.id)}
                    disabled={isChangingPlan}
                    style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                  >
                    Confirmar Upgrade
                  </button>
                </div>
              </div>
            )}

            {confirmModal.type === 'logout' && (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Deseja sair da sua conta?</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
                  Você precisará fazer login novamente para acessar o painel do Multiplex.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                  <button className="btn-secondary" onClick={() => setConfirmModal(null)}>
                    Cancelar
                  </button>
                  <button className="btn-primary" style={{ background: '#ef4444' }} onClick={handleLogout}>
                    Sair agora
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO (CHATS E MÓDULOS) */}
      {deleteConfirmTarget && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 20
          }}
          onClick={() => setDeleteConfirmTarget(null)}
        >
          <div 
            className="glass-panel"
            style={{
              maxWidth: 440,
              width: '100%',
              padding: 24,
              borderRadius: 14,
              border: theme === 'dark' ? '1px solid rgba(239, 68, 68, 0.4)' : '1.5px solid #ef4444',
              background: theme === 'dark' ? '#0f172a' : '#ffffff',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              color: theme === 'light' ? '#0f172a' : '#f8fafc'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
                  {deleteConfirmTarget.type === 'chat' ? 'Excluir esta conversa?' : 'Excluir este módulo?'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: theme === 'light' ? '#64748b' : 'var(--text-muted)' }}>
                  Ação permanente de remoção
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: theme === 'light' ? '#334155' : 'var(--text-muted)', marginBottom: 20 }}>
              {deleteConfirmTarget.type === 'chat' 
                ? `Tem certeza que deseja excluir a conversa "${deleteConfirmTarget.title}"? Todas as mensagens serão apagadas definitivamente.`
                : `Tem certeza que deseja remover o módulo "${deleteConfirmTarget.title}" do seu painel? Os dados operacionais e tabelas do banco não serão afetados.`
              }
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button 
                className="btn-secondary"
                onClick={() => setDeleteConfirmTarget(null)}
                style={{ padding: '8px 16px', fontSize: '0.88rem' }}
              >
                Cancelar
              </button>

              <button 
                className="btn-primary"
                onClick={handleExecuteDelete}
                style={{ background: '#ef4444', border: 'none', padding: '8px 18px', fontSize: '0.88rem', color: '#ffffff', fontWeight: 700 }}
              >
                Sim, Excluir {deleteConfirmTarget.type === 'chat' ? 'Chat' : 'Módulo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
