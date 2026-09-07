import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, UtensilsCrossed, Sliders, BookOpen, 
  Activity, Send, Sparkles, RefreshCw, Plus, Trash2,
  Smartphone, Instagram, MessageCircle, AlertCircle,
  Sun, Moon, Folder, FolderPlus, Pin, PinOff, Search, PanelLeft,
  Edit3, Check, X, ArrowUp, PlayCircle, LayoutDashboard,
  Globe, Facebook, Twitter, Copy, ExternalLink, HelpCircle, CheckCircle2,
  User, Shield, Bell, CreditCard, LogOut, ChevronRight, Settings,
  Lock, Mail, Phone, Building2, UserPlus, LogIn, ArrowRight, ArrowLeft, Zap, Star, ShieldCheck, Key
} from 'lucide-react';
import atomLogo from './assets/multiplex-atom.jpg';

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
  timestamp: string;
}

interface ChatSession {
  id: string;
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

  // Visao ativa
  const [activeView, setActiveView] = useState<'chat' | 'teach' | 'menu' | 'personality' | 'knowledge' | 'channels' | 'playground' | 'logs' | 'dashboard'>('chat');

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  // Backend
  const [products, setProducts] = useState<any[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');

  // Importacao de Cardapio em Massa com Multiplex IA
  const [rawMenuText, setRawMenuText] = useState('');
  const [isParsingMenu, setIsParsingMenu] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<Array<{ name: string; price: number; description: string; category?: string; ingredients?: string[] }>>([]);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState('');
  const [showManualAdd, setShowManualAdd] = useState(false);

  const [rules, setRules] = useState<any[]>([]);
  const [newRuleText, setNewRuleText] = useState('');
  const [newRulePriority, setNewRulePriority] = useState(5);

  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [newKbSubject, setNewKbSubject] = useState('');
  const [newKbContent, setNewKbContent] = useState('');

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
    const saved = localStorage.getItem('multiplex_is_authenticated');
    return saved === 'true';
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

  const [metrics, setMetrics] = useState<any>({
    conversations_today: 0,
    messages_today: 0,
    customers_served: 0,
    ai_assisted_chats: 0,
    orders_created: 0,
    revenue_brl: 0.00
  });

  // Treinamento
  const [teachChat, setTeachChat] = useState<Array<{ sender: 'user' | 'agent'; text: string; structured?: any }>>([
    { 
      sender: 'agent', 
      text: 'Ola, sou o Multiplex IA. Insira informacoes sobre produtos, precos, regras ou horarios para eu aprender.' 
    }
  ]);
  const [teachInput, setTeachInput] = useState('');
  const [structuredHistory, setStructuredHistory] = useState<any[]>([]);

  // Playground
  const [playgroundMessages, setPlaygroundMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Ambiente de testes do Multiplex IA. Digite para testar a execucao de funcoes e regras.' }
  ]);
  const [playgroundInput, setPlaygroundInput] = useState('');
  const [playgroundDebug, setPlaygroundDebug] = useState<any>(null);

  // Logs
  const [logsList, setLogsList] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [resProd, resAgent, resKb, resChan, resDash, resHist, resLogs, resBill, resPlans] = await Promise.all([
        fetch(`${API_BASE}/api/products`).catch(() => null),
        fetch(`${API_BASE}/api/agent/config`).catch(() => null),
        fetch(`${API_BASE}/api/knowledge`).catch(() => null),
        fetch(`${API_BASE}/api/channels`).catch(() => null),
        fetch(`${API_BASE}/api/dashboard`).catch(() => null),
        fetch(`${API_BASE}/api/teach/history`).catch(() => null),
        fetch(`${API_BASE}/api/logs`).catch(() => null),
        fetch(`${API_BASE}/api/billing/current`).catch(() => null),
        fetch(`${API_BASE}/api/billing/plans`).catch(() => null)
      ]);

      if (resProd?.ok) setProducts(await resProd.json());
      if (resAgent?.ok) {
        const ag = await resAgent.json();
        if (ag.rules) setRules(ag.rules);
      }
      if (resKb?.ok) setKnowledgeList(await resKb.json());
      if (resChan?.ok) setChannels(await resChan.json());
      if (resDash?.ok) {
        const d = await resDash.json();
        if (d.metrics) setMetrics(d.metrics);
      }
      if (resHist?.ok) setStructuredHistory(await resHist.json());
      if (resLogs?.ok) setLogsList(await resLogs.json());
      if (resBill?.ok) setBillingData(await resBill.json());
      if (resPlans?.ok) setBillingPlans(await resPlans.json());
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
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('multiplex_user', JSON.stringify(data.user));
        localStorage.setItem('multiplex_is_authenticated', 'true');
        setIsAuthenticated(true);
        loadData();
      } else {
        const namePart = authEmail.split('@')[0].replace(/[._]/g, ' ');
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        const initials = formattedName.slice(0, 2).toUpperCase() || 'US';
        const userObj = {
          name: formattedName,
          email: authEmail,
          company_name: 'Minha Empresa',
          plan_id: 'plan_pro',
          avatar_initials: initials,
          billing_cycle: 'monthly'
        };
        setCurrentUser(userObj);
        localStorage.setItem('multiplex_user', JSON.stringify(userObj));
        localStorage.setItem('multiplex_is_authenticated', 'true');
        setIsAuthenticated(true);
        loadData();
      }
    } catch (err) {
      const userObj = {
        name: 'Anthony Both',
        email: authEmail || 'anthony@amboth.com.br',
        company_name: 'Anthony Burgers & Delivery',
        plan_id: 'plan_pro',
        avatar_initials: 'AN',
        billing_cycle: 'monthly'
      };
      setCurrentUser(userObj);
      localStorage.setItem('multiplex_user', JSON.stringify(userObj));
      localStorage.setItem('multiplex_is_authenticated', 'true');
      setIsAuthenticated(true);
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
    setIsAuthenticated(false);
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

  const handleDeleteChat = (chatId: string) => {
    const filtered = chats.filter(c => c.id !== chatId);
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
      if (activeChatId === chatId) {
        setActiveChatId(filtered[0].id);
      }
    }
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
      const res = await fetch(`${API_BASE}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `m-ai-${Date.now()}`,
          role: 'assistant',
          content: data.response_text || 'Compreendido.',
          toolsUsed: (data.tools_called && data.tools_called.length > 0) ? data.tools_called : undefined,
          timestamp: new Date().toISOString()
        };

        setChats(prevChats => prevChats.map(c => c.id === currentChat.id ? {
          ...c,
          messages: [...c.messages, aiMsg],
          updatedAt: new Date().toISOString()
        } : c));
      } else {
        const aiMsg: ChatMessage = {
          id: `m-ai-${Date.now()}`,
          role: 'assistant',
          content: `Mensagem recebida: "${prompt}". Resposta processada pelo Multiplex.`,
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
        content: `Resposta do Multiplex: A solicitacao sobre "${prompt}" foi concluida.`,
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
      setTeachChat(prev => [...prev, { sender: 'agent', text: 'Informacao processada e salva.' }]);
    }
  };

  // Playground
  const handlePlaygroundSend = async () => {
    if (!playgroundInput.trim()) return;
    const text = playgroundInput;
    setPlaygroundInput('');
    setPlaygroundMessages(prev => [...prev, { role: 'user', content: text }]);

    try {
      const res = await fetch(`${API_BASE}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      if (res.ok) {
        const data = await res.json();
        setPlaygroundMessages(prev => [...prev, { role: 'assistant', content: data.response_text }]);
        setPlaygroundDebug({
          tools: data.tools_called || [],
          knowledge: data.knowledge_used || [],
          rules: data.rules_applied || [],
          latency: data.latency_ms || 100
        });
      }
    } catch (e) {
      console.error(e);
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

  // Extrair produtos de texto com Multiplex IA (GPT-4o)
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
        alert(data.error || 'Nenhum produto identificado. Certifique-se de incluir nomes e precos no texto.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro de comunicacao com a API da Multiplex IA.');
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
        setBatchSuccessMsg(`${data.count} produtos cadastrados com sucesso no cardapio.`);
        setParsedProducts([]);
        setRawMenuText('');
      } else {
        alert(data.error || 'Falha ao salvar produtos no catalogo.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar produtos no catalogo.');
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

  if (!isAuthenticated) {
    return (
      <div className="auth-page-wrapper">
        {/* CABECALHO COM LOGO ATOMICO E MARCA */}
        <div className="auth-header">
          <img src={atomLogo} alt="Multiplex IA" className="auth-brand-logo" />
          <h1 className="auth-title">Multiplex IA</h1>
          <p className="auth-subtitle">
            Plataforma Inteligente de Agentes Multicanal e Atendimento Automatizado de Alta Conversao
          </p>
        </div>

        {/* ABAS DE NAVEGACAO: ENTRAR, CRIAR CONTA E ESCOLHA DE PLANOS */}
        <div className="auth-nav-tabs">
          <button 
            className={`auth-nav-tab ${authMode === 'login' ? 'active' : ''}`}
            onClick={() => { setAuthMode('login'); setAuthError(null); }}
          >
            <LogIn size={16} />
            <span>Entrar na Conta</span>
          </button>
          <button 
            className={`auth-nav-tab ${authMode === 'register' ? 'active' : ''}`}
            onClick={() => { setAuthMode('register'); setAuthError(null); }}
          >
            <UserPlus size={16} />
            <span>Criar Nova Conta</span>
          </button>
          <button 
            className={`auth-nav-tab ${authMode === 'plans' ? 'active' : ''}`}
            onClick={() => { setAuthMode('plans'); setAuthError(null); }}
          >
            <Sparkles size={16} />
            <span>Escolha de Planos</span>
          </button>
        </div>

        {/* MODO 1: LOGIN (ENTRAR NA CONTA) */}
        {authMode === 'login' && (
          <div className="auth-card-container">
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 6px 0' }}>Bem-vindo de volta</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
              Acesse o painel do seu agente de IA com seu e-mail e senha.
            </p>

            {authError && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.84rem', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  <a href="#recuperar" onClick={(e) => { e.preventDefault(); alert('Instrucoes de recuperacao enviadas para o email.'); }} style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', textDecoration: 'none' }}>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input type="checkbox" id="rememberMe" defaultChecked style={{ cursor: 'pointer' }} />
                <label htmlFor="rememberMe" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Permanecer conectado neste dispositivo
                </label>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={authLoading}
                style={{ width: '100%', padding: '12px', fontSize: '0.95rem', fontWeight: 700, marginTop: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}
              >
                {authLoading ? (
                  <>
                    <RefreshCw size={18} className="spin-animation" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Entrar no Multiplex IA</span>
                  </>
                )}
              </button>
            </form>

            <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Ou acesso rapido de teste</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button 
                type="button"
                className="btn-secondary"
                onClick={() => handleDemoAccess('Anthony Both', 'anthony@amboth.com.br', 'plan_pro')}
                style={{ width: '100%', padding: '10px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar-circle" style={{ width: 26, height: 26, fontSize: '0.75rem' }}>AN</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600 }}>Entrar como Anthony Both</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Plano Profissional (Ativo)</div>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>

              <button 
                type="button"
                className="btn-secondary"
                onClick={() => handleDemoAccess('Convidado Teste', 'convidado@multiplex.ia', 'plan_basic')}
                style={{ width: '100%', padding: '10px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar-circle" style={{ width: 26, height: 26, fontSize: '0.75rem', background: '#0284c7' }}>CV</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600 }}>Explorar como Convidado</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Acesso demonstrativo imediato</div>
                  </div>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Ainda nao possui uma conta?{' '}
              <button 
                onClick={() => { setAuthMode('register'); setAuthStep(1); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Cadastre-se agora
              </button>
            </div>
          </div>
        )}

        {/* MODO 2: CADASTRO COM ETAPAS E ESCOLHA DE PLANO */}
        {authMode === 'register' && (
          <div className={`auth-card-container ${authStep === 2 ? 'auth-card-wide' : ''}`}>
            {/* Indicador de Etapas */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div className="auth-step-pill">
                <span>{authStep === 1 ? 'Etapa 1 de 2: Dados da Conta' : 'Etapa 2 de 2: Escolha do Plano e Ativacao'}</span>
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
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 6px 0' }}>Crie sua conta Multiplex IA</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 24px 0' }}>
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

                <div style={{ textAlign: 'center', marginTop: 22, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
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
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 700, margin: '0 0 6px 0' }}>Escolha o plano ideal para o seu negocio</h2>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                    Alterne ou cancele a qualquer momento sem burocracia.
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
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div className="auth-step-pill" style={{ marginBottom: 12 }}>
                <Sparkles size={14} />
                <span>Planos Transparentes e Escalaveis</span>
              </div>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 10px 0' }}>
                Escolha o plano perfeito para potencializar seu atendimento
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: 640, margin: '0 auto' }}>
                Ative agentes inteligentes em todos os seus canais, integre seu catalogo de produtos e atenda clientes 24h por dia.
              </p>
            </div>

            {/* Toggle de Ciclo de Cobranca */}
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

            {/* Grid dos 4 Planos */}
            <div className="auth-plans-grid">
              {activePlansList.map(plan => {
                const price = authBillingCycle === 'yearly' ? (plan.price_yearly_monthly || Math.round(plan.price_monthly * 0.8)) : plan.price_monthly;
                return (
                  <div 
                    key={plan.id}
                    className={`auth-plan-box ${plan.popular ? 'popular' : ''}`}
                  >
                    {plan.popular && (
                      <div className="auth-popular-tag">
                        <Star size={10} style={{ display: 'inline', marginRight: 4 }} />
                        Mais Escolhido
                      </div>
                    )}

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px 0' }}>{plan.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', minHeight: 42, margin: '0 0 16px 0' }}>
                      {plan.description}
                    </p>

                    <div style={{ marginBottom: 20 }}>
                      {plan.is_custom ? (
                        <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>Sob Consulta</div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>R$</span>
                          <span style={{ fontSize: '2rem', fontWeight: 800 }}>{price}</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ mes</span>
                        </div>
                      )}
                      {authBillingCycle === 'yearly' && !plan.is_custom && (
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: 3 }}>Faturado anualmente com 20% de economia</div>
                      )}
                    </div>

                    <button 
                      className="btn-primary"
                      style={{ 
                        width: '100%', 
                        padding: '11px', 
                        fontWeight: 700, 
                        marginBottom: 20,
                        background: plan.popular ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : undefined 
                      }}
                      onClick={() => {
                        setAuthPlanId(plan.id);
                        setAuthMode('register');
                        setAuthStep(1);
                      }}
                    >
                      <span>Comecar com {plan.name}</span>
                    </button>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        O que esta incluso:
                      </div>
                      {(plan.features || []).map((feat: string, fIdx: number) => (
                        <div key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                          <CheckCircle2 size={15} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodape com Garantia e Suporte */}
            <div style={{ marginTop: 32, padding: '20px 24px', borderRadius: 14, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ShieldCheck size={28} color="var(--accent-primary)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Garantia de Satisfacao de 7 Dias</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Teste sem compromisso. Cancele com 1 clique se nao atender suas expectativas.</div>
                </div>
              </div>
              <button 
                className="btn-secondary"
                onClick={() => setAuthMode('login')}
                style={{ fontSize: '0.85rem' }}
              >
                Ja sou cliente, fazer Login
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* BARRA LATERAL */}
      {!sidebarCollapsed && (
        <aside className="sidebar">
          {/* Cabecalho */}
          <div className="chatgpt-sidebar-header">
            <div className="chatgpt-brand" onClick={() => setActiveView('chat')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={atomLogo} alt="Multiplex IA" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(0, 210, 255, 0.4)' }} />
              <span>Multiplex IA</span>
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
              <div 
                className={`sidebar-item ${activeView === 'chat' ? 'active' : ''}`}
                onClick={handleCreateNewChat}
              >
                <div className="item-main">
                  <Edit3 size={17} color="var(--accent-cyan)" />
                  <span style={{ fontWeight: 600 }}>Novo chat</span>
                </div>
              </div>

              <div 
                className={`sidebar-item ${activeView === 'teach' ? 'active' : ''}`}
                onClick={() => setActiveView('teach')}
              >
                <div className="item-main">
                  <Sparkles size={17} color="var(--accent-primary)" />
                  <span>Ensinar IA</span>
                </div>
              </div>

              <div 
                className={`sidebar-item ${activeView === 'menu' ? 'active' : ''}`}
                onClick={() => setActiveView('menu')}
              >
                <div className="item-main">
                  <UtensilsCrossed size={17} color="var(--accent-amber)" />
                  <span>Cardapio e Produtos</span>
                </div>
                {products.length > 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{products.length}</span>
                )}
              </div>

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

              <div 
                className={`sidebar-item ${activeView === 'knowledge' ? 'active' : ''}`}
                onClick={() => setActiveView('knowledge')}
              >
                <div className="item-main">
                  <BookOpen size={17} color="var(--accent-purple)" />
                  <span>Base Conhecimento</span>
                </div>
              </div>

              <div 
                className={`sidebar-item ${activeView === 'channels' ? 'active' : ''}`}
                onClick={() => setActiveView('channels')}
              >
                <div className="item-main">
                  <Smartphone size={17} color="var(--accent-emerald)" />
                  <span>Conectar Canais</span>
                </div>
              </div>

              <div 
                className={`sidebar-item ${activeView === 'playground' ? 'active' : ''}`}
                onClick={() => setActiveView('playground')}
              >
                <div className="item-main">
                  <PlayCircle size={17} color="var(--accent-rose)" />
                  <span>Playground Testes</span>
                </div>
              </div>

              <div 
                className={`sidebar-item ${activeView === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveView('logs')}
              >
                <div className="item-main">
                  <Activity size={17} color="var(--text-muted)" />
                  <span>Logs e Auditoria</span>
                </div>
              </div>

              <div 
                className={`sidebar-item ${activeView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveView('dashboard')}
              >
                <div className="item-main">
                  <LayoutDashboard size={17} color="var(--text-muted)" />
                  <span>Dashboard</span>
                </div>
              </div>
            </div>

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
                  className={`sidebar-item ${activeChatId === chat.id && activeView === 'chat' ? 'active' : ''}`}
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
                  className={`sidebar-item ${activeChatId === chat.id && activeView === 'chat' ? 'active' : ''}`}
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
                      <button className="user-popup-item" onClick={() => alert('Multiplex IA v1.2.0 - GPT-4o')}>
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
        <main className="chatgpt-main">
          {/* Top Bar */}
          <div className="chatgpt-top-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {sidebarCollapsed && (
                <button 
                  className="icon-btn" 
                  title="Expandir barra lateral"
                  onClick={() => setSidebarCollapsed(false)}
                >
                  <PanelLeft size={20} />
                </button>
              )}

              <div className="model-selector" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={atomLogo} alt="Multiplex IA" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(0, 210, 255, 0.4)' }} />
                <span>Multiplex IA (GPT-4o)</span>
                <span className="badge" style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                  Funcoes Ativas
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Bolinha minimalista de tema */}
              <button 
                className="theme-circle-btn"
                onClick={toggleTheme}
                title={theme === 'dark' ? "Modo Claro" : "Modo Escuro"}
              >
                {theme === 'dark' ? <Sun size={17} color="#f59e0b" /> : <Moon size={17} color="#6366f1" />}
              </button>

              <button 
                className="icon-btn" 
                title="Novo Chat"
                onClick={handleCreateNewChat}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Feed de Mensagens */}
          <div className="chat-feed-container">
            <div className="chat-thread-inner">
              {currentChat && currentChat.messages.length === 0 ? (
                <div className="chat-welcome-container">
                  <div className="chat-welcome-icon" style={{ padding: 0, overflow: 'hidden', background: 'transparent', border: '2px solid rgba(0, 210, 255, 0.5)', boxShadow: '0 0 30px rgba(0, 210, 255, 0.3)', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={atomLogo} alt="Multiplex IA" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  </div>
                  <h1 className="chat-welcome-title">Como posso ajudar voce hoje?</h1>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                    Multiplex IA integrado com cardapio, frete, agendamentos e regras.
                  </p>

                  <div className="chat-welcome-suggestions">
                    <div 
                      className="chat-suggestion-card"
                      onClick={() => handleSendMessage('Quais sao os produtos do cardapio e os precos?')}
                    >
                      <div className="chat-suggestion-title">Consultar Cardapio</div>
                      <div className="chat-suggestion-desc">Mostre todos os produtos e precos cadastrados</div>
                    </div>

                    <div 
                      className="chat-suggestion-card"
                      onClick={() => handleSendMessage('Qual e a taxa de entrega e o frete?')}
                    >
                      <div className="chat-suggestion-title">Calcular Frete</div>
                      <div className="chat-suggestion-desc">Consulte as regras de entrega e raio de atendimento</div>
                    </div>

                    <div 
                      className="chat-suggestion-card"
                      onClick={() => handleSendMessage('Qual o horario de funcionamento de voces?')}
                    >
                      <div className="chat-suggestion-title">Horario de Atendimento</div>
                      <div className="chat-suggestion-desc">Verifique horarios e funcionamento</div>
                    </div>

                    <div 
                      className="chat-suggestion-card"
                      onClick={() => handleSendMessage('Quero agendar um atendimento para amanha')}
                    >
                      <div className="chat-suggestion-title">Agendar Atendimento</div>
                      <div className="chat-suggestion-desc">Teste a funcao de agendamento de servicos</div>
                    </div>
                  </div>
                </div>
              ) : (
                currentChat && currentChat.messages.map(msg => (
                  <div key={msg.id} className={`message-row ${msg.role}`}>
                    {msg.role === 'assistant' && (
                      <div className="message-avatar-ai" style={{ padding: 0, overflow: 'hidden', background: 'transparent', border: '1px solid rgba(0, 210, 255, 0.35)', width: 28, height: 28, minWidth: 28, borderRadius: '50%' }}>
                        <img src={atomLogo} alt="Multiplex IA" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      </div>
                    )}

                    <div className={msg.role === 'user' ? 'message-bubble-user' : 'message-body-ai'}>
                      {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          {msg.toolsUsed.map((toolCall, idx) => (
                            <div key={idx} className="tool-badge-chip">
                              <Sliders size={12} />
                              <span>Executou a funcao: <strong>{toolCall.tool}</strong></span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isSendingMessage && (
                <div className="message-row assistant">
                  <div className="message-avatar-ai" style={{ padding: 0, overflow: 'hidden', background: 'transparent', border: '1px solid rgba(0, 210, 255, 0.35)', width: 28, height: 28, minWidth: 28, borderRadius: '50%' }}>
                    <img src={atomLogo} alt="Multiplex IA" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  </div>
                  <div className="message-body-ai" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)' }}>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Multiplex IA pensando e executando funcoes...</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Capsula Flutuante de Prompt */}
          <div className="chatgpt-bottom-wrapper">
            <div className="chatgpt-capsule-box">
              <button 
                className="icon-btn" 
                title="Cadastrar novo produto ou regra"
                onClick={() => setActiveView('menu')}
              >
                <Plus size={20} />
              </button>

              <input 
                type="text"
                className="capsule-input"
                placeholder="Pergunte qualquer coisa ao Multiplex IA..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isSendingMessage}
                autoFocus
              />

              <button 
                className="icon-btn" 
                title="Configurar regras"
                onClick={() => setActiveView('personality')}
              >
                <Sliders size={18} />
              </button>

              <button 
                className="btn-send-circular"
                disabled={!chatInput.trim() || isSendingMessage}
                onClick={() => handleSendMessage()}
                title="Enviar mensagem"
              >
                <ArrowUp size={18} />
              </button>
            </div>
            <div className="chatgpt-disclaimer">
              O Multiplex IA executa as funcoes personalizadas adicionadas por voce.
            </div>
          </div>
        </main>
      )}

      {/* TELA: ENSINAR IA */}
      {activeView === 'teach' && (
        <div className="main-panel-scrollable">
          <div className="page-header" style={{ marginBottom: 0 }}>
            <div>
              <h1 className="page-title" style={{ fontSize: '1.3rem' }}>Ensinar IA</h1>
              <p className="page-desc" style={{ fontSize: '0.8rem' }}>Ensine novos produtos, regras, horarios ou precos em linguagem natural.</p>
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

      {/* TELA: CARDAPIO E PRODUTOS */}
      {activeView === 'menu' && (
        <div className="main-panel-scrollable">
          <div className="page-header" style={{ marginBottom: 16 }}>
            <div>
              <h1 className="page-title">Cardapio e Produtos</h1>
              <p className="page-desc">Copie e cole listas de produtos do seu site ou cardapio. A Multiplex IA separa e organiza tudo automaticamente.</p>
            </div>
            <button className="btn-secondary" onClick={() => setActiveView('chat')}>
              <MessageSquare size={16} /> Voltar ao Chat
            </button>
          </div>

          {/* PAINEL PRINCIPAL: IMPORTACAO INTELIGENTE COM MULTIPLEX IA */}
          <div className="glass-panel" style={{ padding: 22, marginBottom: 20, border: '1px solid rgba(0, 210, 255, 0.3)', background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.75), rgba(10, 15, 30, 0.85))' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(0, 210, 255, 0.4)', minWidth: 32 }}>
                  <img src={atomLogo} alt="Multiplex IA" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Importar Cardapio em Massa com Multiplex IA</h2>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Cole texto corrido, lista de precos, descricoes do site ou cardapio em texto</span>
                </div>
              </div>

              <span className="badge" style={{ background: 'rgba(0, 210, 255, 0.15)', color: '#00d2ff', border: '1px solid rgba(0, 210, 255, 0.3)' }}>
                GPT-4o Extrator
              </span>
            </div>

            <textarea 
              placeholder="Cole aqui os produtos copiados do seu site, cardapio ou mensagem...&#10;&#10;Exemplo:&#10;Pizza Calabresa Especial - R$ 48,00 - Molho caseiro, mussarela, calabresa e cebola&#10;Pizza Quatro Queijos - R$ 56,90 - Mussarela, provolone, gorgonzola e catupiry&#10;Coca-Cola 2L - R$ 14,00&#10;Cerveja Long Neck - R$ 11,50"
              value={rawMenuText}
              onChange={(e) => setRawMenuText(e.target.value)}
              rows={5}
              style={{ width: '100%', fontSize: '0.88rem', lineHeight: '1.4', marginBottom: 14, resize: 'vertical' }}
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
                    <span>Multiplex IA separando produtos...</span>
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

          {/* PRE-VISUALIZACAO DOS PRODUTOS IDENTIFICADOS PELA IA */}
          {parsedProducts.length > 0 && (
            <div className="glass-panel" style={{ padding: 20, marginBottom: 20, border: '1px solid rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                    {parsedProducts.length} Produtos Identificados pela Multiplex IA
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confira os itens abaixo antes de adicionar ao catalogo</span>
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
                    <span>Confirmar e Salvar Todos ({parsedProducts.length})</span>
                  </button>

                  <button 
                    className="btn-secondary"
                    onClick={() => setParsedProducts([])}
                  >
                    <X size={16} /> Descartar
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                {parsedProducts.map((p, idx) => (
                  <div key={idx} className="glass-card" style={{ padding: 14, position: 'relative' }}>
                    <button 
                      onClick={() => handleRemoveParsedItem(idx)}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                      title="Remover este item da lista"
                    >
                      <X size={14} />
                    </button>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', paddingRight: 20 }}>{p.name}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                      <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>R$ {Number(p.price).toFixed(2)}</span>
                      {p.category && (
                        <span className="badge" style={{ fontSize: '0.68rem', padding: '1px 6px', background: 'rgba(255,255,255,0.08)' }}>
                          {p.category}
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6, marginBottom: 0 }}>
                        {p.description}
                      </p>
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
                    placeholder="Preco (ex: 29.90)" 
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                  />
                </div>
                <textarea 
                  placeholder="Descricao, ingredientes e adicionais..."
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
                Produtos Cadastrados no Catalogo ({products.length})
              </h2>
              {products.length > 0 && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Itens ativos consultados pela Multiplex IA durante conversas
                </span>
              )}
            </div>

            {products.length === 0 ? (
              <div className="glass-card" style={{ padding: 28, textAlign: 'center', color: 'var(--text-dim)' }}>
                Nenhum produto cadastrado ainda. Cole a lista do seu cardapio acima para que a Multiplex IA organize tudo em segundos.
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

      {/* TELA: PERSONALIDADE E REGRAS */}
      {activeView === 'personality' && (
        <div className="main-panel-scrollable">
          <div className="page-header">
            <div>
              <h1 className="page-title">Personalidade e Regras Comerciais</h1>
              <p className="page-desc">Defina as regras obrigatorias que o Multiplex deve seguir.</p>
            </div>
            <button className="btn-secondary" onClick={() => setActiveView('chat')}>
              <MessageSquare size={16} /> Voltar ao Chat
            </button>
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 14 }}>Nova Regra de Negocio</h2>
            <textarea 
              placeholder="Ex: Nao conceder descontos, oferecer adicionais ao fechar pedido..."
              value={newRuleText}
              onChange={(e) => setNewRuleText(e.target.value)}
              rows={3}
              style={{ marginBottom: 12 }}
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
                  style={{ width: 70, padding: '6px 10px' }}
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

      {/* TELA: BASE DE CONHECIMENTO */}
      {activeView === 'knowledge' && (
        <div className="main-panel-scrollable">
          <div className="page-header">
            <div>
              <h1 className="page-title">Base de Conhecimento e FAQ</h1>
              <p className="page-desc">Politicas e informacoes consultadas pelo Multiplex.</p>
            </div>
            <button className="btn-secondary" onClick={() => setActiveView('chat')}>
              <MessageSquare size={16} /> Voltar ao Chat
            </button>
          </div>

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

      {/* TELA: CONECTAR CANAIS MULTICANAL COM ASSISTENTE DE IA */}
      {activeView === 'channels' && (
        <div className="main-panel-scrollable">
          <div className="page-header" style={{ marginBottom: 18 }}>
            <div>
              <h1 className="page-title">Conectar Redes Sociais e Canais</h1>
              <p className="page-desc">Atendimento simultaneo pelo Multiplex IA no WhatsApp, Instagram, Facebook, Telegram, X e Site. A IA auxilia você passo a passo na conexão.</p>
            </div>
            <button className="btn-secondary" onClick={() => setActiveView('chat')}>
              <MessageSquare size={16} /> Voltar ao Chat
            </button>
          </div>

          {/* GRID COM TODOS OS CANAIS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
            {(channels && channels.length > 0 ? channels : [
              { name: 'WhatsApp Business', type: 'whatsapp', connected: false, description: 'Evolution API, Z-API, Baileys ou Meta Cloud API com QR Code.' },
              { name: 'Instagram Direct', type: 'instagram', connected: false, description: 'Respostas automaticas em mensagens diretas (DMs) e comentarios.' },
              { name: 'Facebook Messenger', type: 'facebook', connected: false, description: 'Atendimento automatico em Paginas do Facebook e Messenger.' },
              { name: 'Telegram Bot', type: 'telegram', connected: false, description: 'Bot oficial do Telegram para consultas de cardapio, suporte e pedidos.' },
              { name: 'X (Twitter) DMs', type: 'x', connected: false, description: 'Respostas automaticas em mensagens diretas no seu perfil do X.' },
              { name: 'Webchat / Widget para Site', type: 'webchat', connected: true, accountName: 'Widget Ativo', description: 'Balao flutuante de chat com script facil para colar no site.' }
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
                      {channel.description || 'Integracao multicanal com respostas do Multiplex IA.'}
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

          {/* MODAL INTERATIVO: ASSISTENTE DE CONEXAO GUIADO PELA MULTIPLEX IA */}
          {selectedChannel && (
            <div className="modal-backdrop" onClick={() => setSelectedChannel(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840, width: '92%' }}>
                {/* Cabecalho do Modal */}
                <div className="modal-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(0, 210, 255, 0.4)', minWidth: 34 }}>
                      <img src={atomLogo} alt="Multiplex IA" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                        Assistente de Conexao: {selectedChannel.name}
                      </h2>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Multiplex IA orienta você no passo a passo exato da integracao
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
                          Assistente Tecnico Multiplex IA (GPT-4o)
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
                          onClick={() => handleAskChannelAi('Como faco para testar se as mensagens estao chegando ao Multiplex IA?')}
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
                              <img src={atomLogo} alt="Multiplex IA" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <span>Instrucoes da Multiplex IA:</span>
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
                          Quando ativo, todas as mensagens recebidas neste canal sao respondidas automaticamente pelo Multiplex IA respeitando o cardapio e regras cadastradas.
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
              <p className="page-desc" style={{ fontSize: '0.8rem' }}>Simulacao e inspecao de funcoes e regras em tempo real.</p>
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

      {/* TELA: LOGS */}
      {activeView === 'logs' && (
        <div className="main-panel-scrollable">
          <div className="page-header">
            <div>
              <h1 className="page-title">Logs e Auditoria</h1>
              <p className="page-desc">Historico de eventos e requisicoes.</p>
            </div>
            <button className="btn-secondary" onClick={() => setActiveView('chat')}>
              <MessageSquare size={16} /> Voltar ao Chat
            </button>
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            {logsList.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 30 }}>
                Nenhum log registrado.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {logsList.map((log, idx) => (
                  <div key={idx} className="glass-card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{log.event}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{log.timestamp}</div>
                    </div>
                    <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-cyan)' }}>
                      {log.channel || 'API'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TELA: DASHBOARD */}
      {activeView === 'dashboard' && (
        <div className="main-panel-scrollable">
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard Executivo</h1>
              <p className="page-desc">Metricas consolidadas de conversao e atendimento.</p>
            </div>
            <button className="btn-secondary" onClick={() => setActiveView('chat')}>
              <MessageSquare size={16} /> Voltar ao Chat
            </button>
          </div>

          <div className="grid-metrics">
            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Conversas Hoje</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 4 }}>{metrics.conversations_today}</div>
            </div>
            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Pedidos Criados</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 4 }}>{metrics.orders_created}</div>
            </div>
            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Faturamento Gerado</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: 4, color: '#10b981' }}>
                R$ {Number(metrics.revenue_brl || 0).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="status-dot-green"></span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Automacoes e Webhooks Ativos</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fluxos omnichannel sincronizados</div>
              </div>
            </div>
            <button className="btn-secondary" onClick={loadData}>
              <RefreshCw size={14} /> Atualizar Metricas
            </button>
          </div>
        </div>
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
                  <span>Informacoes pessoais</span>
                </button>

                <button 
                  className={`profile-nav-item ${profileActiveTab === 'security' ? 'active' : ''}`}
                  onClick={() => setProfileActiveTab('security')}
                >
                  <Shield size={16} />
                  <span>Seguranca</span>
                </button>

                <button 
                  className={`profile-nav-item ${profileActiveTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => setProfileActiveTab('notifications')}
                >
                  <Bell size={16} />
                  <span>Notificacoes</span>
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
                          <span>Voce utilizou 84% do limite de mensagens de IA deste mes.</span>
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
                            <td style={{ padding: '10px', textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>84% (Atencao)</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px' }}>Agentes Ativos</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>1</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>1</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-muted)' }}>Capacidade max.</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px' }}>Canais Conectados</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>2</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>3</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#10b981' }}>Disponivel (1 livre)</td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '10px' }}>Usuarios / Atendentes</td>
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
                          '1 Agente de IA', 'Memoria de Clientes', 'Base de Conhecimento RAG',
                          'Handoff Humano', 'Analytics e Relatorios', 'Suporte Prioritario'
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

                {/* ABA: INFORMACOES PESSOAIS */}
                {profileActiveTab === 'personal' && (
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Informacoes Pessoais</h2>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                      Atualize seus dados cadastrais e informacoes de perfil.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 500 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>Nome Completo</label>
                        <input type="text" defaultValue="Anthony Both" style={{ width: '100%' }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>Nome de Usuario</label>
                        <input type="text" defaultValue="anthony_both" style={{ width: '100%' }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>E-mail Comercial</label>
                        <input type="email" defaultValue="anthony@amboth.com.br" style={{ width: '100%' }} />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' }}>Empresa / Organizacao</label>
                        <input type="text" defaultValue="Anthony Burgers & Delivery" style={{ width: '100%' }} />
                      </div>

                      <button className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 10 }} onClick={() => alert('Dados cadastrais atualizados com sucesso.')}>
                        Salvar Alteracoes
                      </button>
                    </div>
                  </div>
                )}

                {/* ABA: SEGURANCA */}
                {profileActiveTab === 'security' && (
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Seguranca & Acesso</h2>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                      Configuracoes de autenticacao, senha e sessoes ativas.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 500 }}>
                      <div className="glass-card" style={{ padding: 16 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Autenticacao em Duas Etapas (2FA)</div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Proteja sua conta solicitando um codigo adicional ao fazer login.</p>
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

                {/* ABA: NOTIFICACOES */}
                {profileActiveTab === 'notifications' && (
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 4 }}>Notificacoes & Alertas</h2>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 20 }}>
                      Escolha quais alertas voce deseja receber no e-mail e nos canais.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 500 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked />
                        <span style={{ fontSize: '0.88rem' }}>Alertas de limite de mensagens (80%, 90% e 100%)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked />
                        <span style={{ fontSize: '0.88rem' }}>Notificacao de solicitacao de atendimento humano (Handoff)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked />
                        <span style={{ fontSize: '0.88rem' }}>Relatorio semanal de conversao e conversas</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACAO (CANCELAMENTO, DOWNGRADE, UPGRADE, LOGOUT) */}
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
                  <li>Seu acesso permanecera ativo ate <strong>07 de outubro de 2026</strong>.</li>
                  <li>Apos esta data, o agente Multiplex IA sera pausado em todos os canais.</li>
                  <li>Voce perdera o historico de conversas e integracoes ativas.</li>
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
                  Seu plano atual possui recursos que nao estarao disponiveis no novo plano:
                </p>
                <div style={{ padding: 12, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444', fontSize: '0.82rem', marginBottom: 14 }}>
                  <strong>Voce perdera:</strong>
                  <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                    <li>Canais adicionais conectados (apenas 1 canal suportado)</li>
                    <li>Limite maior de mensagens de IA</li>
                    <li>Suporte prioritario e automacoes avancadas</li>
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
                    Confirmar Mudanca
                  </button>
                </div>
              </div>
            )}

            {confirmModal.type === 'upgrade' && (
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Fazer Upgrade para {confirmModal.plan?.name}?</h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginTop: 10 }}>
                  Novo valor: <strong>R$ {confirmModal.plan?.price_monthly} / mes</strong>.
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Seus novos limites e recursos serao liberados imediatamente.
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
                  Voce precisara fazer login novamente para acessar o painel do Multiplex IA.
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
    </div>
  );
}
