import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, UtensilsCrossed, Sliders, BookOpen, 
  Activity, Send, Sparkles, RefreshCw, Plus, Trash2,
  Smartphone, Instagram, MessageCircle, AlertCircle,
  Sun, Moon, Folder, FolderPlus, Pin, PinOff, Search, PanelLeft,
  Edit3, Check, X, ArrowUp, PlayCircle, LayoutDashboard,
  Globe, Facebook, Twitter, Copy, ExternalLink, HelpCircle, CheckCircle2
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
      const [resProd, resAgent, resKb, resChan, resDash, resHist, resLogs] = await Promise.all([
        fetch(`${API_BASE}/api/products`).catch(() => null),
        fetch(`${API_BASE}/api/agent/config`).catch(() => null),
        fetch(`${API_BASE}/api/knowledge`).catch(() => null),
        fetch(`${API_BASE}/api/channels`).catch(() => null),
        fetch(`${API_BASE}/api/dashboard`).catch(() => null),
        fetch(`${API_BASE}/api/teach/history`).catch(() => null),
        fetch(`${API_BASE}/api/logs`).catch(() => null)
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
    } catch (e) {
      console.warn('API local nao acessivel no momento');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

          {/* Rodape */}
          <div className="chatgpt-user-footer">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
              <div className="user-profile-row" style={{ flex: 1, padding: 0 }}>
                <div className="avatar-circle">AN</div>
                <div>
                  <div className="user-name">Anthony Both</div>
                  <div className="user-plan">Free</div>
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="status-dot-green"></span>
                <span>n8n Conectado (:5678)</span>
              </div>
              <button 
                className="item-action-btn" 
                title="Atualizar dados"
                onClick={loadData}
              >
                <RefreshCw size={12} />
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
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>n8n Local Conectado (:5678)</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Automacoes sincronizadas</div>
              </div>
            </div>
            <button className="btn-secondary" onClick={loadData}>
              <RefreshCw size={14} /> Atualizar Metricas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
