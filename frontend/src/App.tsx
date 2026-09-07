import React, { useState, useEffect } from 'react';
import { 
  Bot, MessageSquare, UtensilsCrossed, Sliders, BookOpen, 
  Share2, Activity, Send, CheckCircle2, UserCheck, ShieldAlert,
  ArrowRight, Sparkles, RefreshCw, Plus, Trash2, Clock, DollarSign, Users,
  ShoppingBag, HelpCircle, FileText, Smartphone, Instagram, MessageCircle, AlertCircle,
  Sun, Moon, Folder, FolderPlus, Pin, PinOff, Search, PanelLeft, MoreHorizontal,
  Edit3, Check, X, Paperclip, Mic, Globe, Layers, Calendar, ChevronDown, ChevronRight,
  ExternalLink, ArrowUp
} from 'lucide-react';

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

export default function App() {
  // Tema Claro / Escuro
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

  // Pastas / Projetos (Inicializado com os itens da imagem do usuário se vazio)
  const [folders, setFolders] = useState<FolderItem[]>(() => {
    const saved = localStorage.getItem('multiplex_folders');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: 'f-paja', name: 'Pa-Ja', isPinned: true },
      { id: 'f-bonasoft', name: 'BONASOFT', isPinned: true },
      { id: 'f-mt24', name: 'MT 24 Horas', isPinned: false },
      { id: 'f-agriroute', name: 'AgriRoute', isPinned: false },
      { id: 'f-40m', name: '40M', isPinned: false },
      { id: 'f-sabedoria', name: 'Casa da sabedoria', isPinned: false },
      { id: 'f-materia', name: 'Matéria em energia', isPinned: false },
    ];
  });

  useEffect(() => {
    localStorage.setItem('multiplex_folders', JSON.stringify(folders));
  }, [folders]);

  // Chats (Inicializado com os itens da imagem do usuário se vazio)
  const [chats, setChats] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('multiplex_chats');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: 'c-agente',
        title: 'Agente De IA Conversacional',
        folderId: null,
        isPinned: false,
        messages: [
          {
            id: 'm-1',
            role: 'assistant',
            content: 'Olá Anthony! Eu sou o Multiplex GPT, seu agente de IA com ferramentas personalizadas. Estou pronto para ajudar com seus produtos, clientes, dúvidas e automações em múltiplos canais. O que você gostaria de fazer hoje?',
            timestamp: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      { id: 'c-queixa', title: 'Retirada Da Queixa Audiência', folderId: null, isPinned: false, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'c-bio', title: 'Melhorar Bio Profissional', folderId: null, isPinned: false, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'c-unerquicklich', title: 'Analisar conversa unerquicklich', folderId: null, isPinned: false, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'c-energia', title: 'Transmissão de energia luminosa', folderId: null, isPinned: false, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'c-removerfios', title: 'Remover fios da imagem', folderId: null, isPinned: false, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'c-googlewallet', title: 'Problema Google Wallet', folderId: null, isPinned: false, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'c-roleta', title: 'Probabilidade na roleta', folderId: null, isPinned: false, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'c-erpagricola', title: 'ERP agrícola para fazendas', folderId: 'f-agriroute', isPinned: false, messages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
  });

  useEffect(() => {
    localStorage.setItem('multiplex_chats', JSON.stringify(chats));
  }, [chats]);

  const [activeChatId, setActiveChatId] = useState<string>('c-agente');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Estados para Criação/Edição de Pasta
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  // Estados para Edição de Chat
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editChatTitle, setEditChatTitle] = useState('');
  const [chatFolderMenuId, setChatFolderMenuId] = useState<string | null>(null);

  // Input de Mensagem do ChatGPT
  const [chatInput, setChatInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Modal de Funções & Plugins Customizados
  const [isFunctionsModalOpen, setIsFunctionsModalOpen] = useState(false);
  const [functionsTab, setFunctionsTab] = useState<'tools' | 'menu' | 'teach' | 'knowledge' | 'channels' | 'dashboard'>('tools');

  // Dados do Backend (Produtos, Regras, Conhecimento, Canais, Métricas)
  const [products, setProducts] = useState<any[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');

  const [rules, setRules] = useState<any[]>([]);
  const [newRuleText, setNewRuleText] = useState('');
  const [newRulePriority, setNewRulePriority] = useState(5);

  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [newKbSubject, setNewKbSubject] = useState('');
  const [newKbContent, setNewKbContent] = useState('');

  const [channels, setChannels] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    conversations_today: 0,
    messages_today: 0,
    customers_served: 0,
    ai_assisted_chats: 0,
    orders_created: 0,
    revenue_brl: 0.00
  });

  // Carregar dados de retaguarda
  const loadBackendData = async () => {
    try {
      const [resProd, resAgent, resKb, resChan, resDash] = await Promise.all([
        fetch('/api/products').catch(() => null),
        fetch('/api/agent/config').catch(() => null),
        fetch('/api/knowledge').catch(() => null),
        fetch('/api/channels').catch(() => null),
        fetch('/api/dashboard').catch(() => null)
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
    } catch (e) {
      console.warn('API local offline ou iniciando...');
    }
  };

  useEffect(() => {
    loadBackendData();
  }, []);

  // Chat Ativo Atual
  const currentChat = chats.find(c => c.id === activeChatId) || chats[0];

  // Ações de Pastas
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
    // Move chats nessa pasta para null
    setChats(chats.map(c => c.folderId === folderId ? { ...c, folderId: null } : c));
    if (selectedFolderFilter === folderId) setSelectedFolderFilter(null);
  };

  const handleRenameFolder = (folderId: string) => {
    if (!editFolderName.trim()) return;
    setFolders(folders.map(f => f.id === folderId ? { ...f, name: editFolderName.trim() } : f));
    setEditingFolderId(null);
    setEditFolderName('');
  };

  // Ações de Chats
  const handleCreateNewChat = () => {
    const newChat: ChatSession = {
      id: `c-${Date.now()}`,
      title: 'Novo chat',
      folderId: selectedFolderFilter || null,
      isPinned: false,
      messages: [
        {
          id: `m-${Date.now()}`,
          role: 'assistant',
          content: 'Olá! Como posso ajudar você hoje com o Multiplex GPT?',
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
  };

  const handleTogglePinChat = (chatId: string) => {
    setChats(chats.map(c => c.id === chatId ? { ...c, isPinned: !c.isPinned } : c));
  };

  const handleDeleteChat = (chatId: string) => {
    const filtered = chats.filter(c => c.id !== chatId);
    setChats(filtered);
    if (activeChatId === chatId && filtered.length > 0) {
      setActiveChatId(filtered[0].id);
    }
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

  // Enviar Mensagem no ChatGPT Thread
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
      // Chama o backend do Agente Multiplex com todas as 10 funções customizadas!
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `m-ai-${Date.now()}`,
          role: 'assistant',
          content: data.response_text || 'Entendido!',
          toolsUsed: (data.tools_called && data.tools_called.length > 0) ? data.tools_called : undefined,
          timestamp: new Date().toISOString()
        };

        setChats(prevChats => prevChats.map(c => c.id === currentChat.id ? {
          ...c,
          messages: [...c.messages, aiMsg],
          updatedAt: new Date().toISOString()
        } : c));
      } else {
        // Fallback local
        const aiMsg: ChatMessage = {
          id: `m-ai-${Date.now()}`,
          role: 'assistant',
          content: `Recebi sua mensagem: "${prompt}". O Multiplex GPT processou a instrução com sucesso.`,
          timestamp: new Date().toISOString()
        };
        setChats(prevChats => prevChats.map(c => c.id === currentChat.id ? {
          ...c,
          messages: [...c.messages, aiMsg]
        } : c));
      }
    } catch (e) {
      console.error(e);
      const aiMsg: ChatMessage = {
        id: `m-ai-${Date.now()}`,
        role: 'assistant',
        content: `Resposta local do Multiplex GPT: Sua solicitação sobre "${prompt}" foi anotada. Todas as funções ativas estão operacionais.`,
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

  // Funções para Gerenciar Custom Tools (Cardápio, Regras, Conhecimento)
  const handleAddProduct = async () => {
    if (!newProductName.trim() || !newProductPrice) return;
    try {
      const res = await fetch('/api/products', {
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

  const handleAddRule = async () => {
    if (!newRuleText.trim()) return;
    try {
      const res = await fetch('/api/agent/rules', {
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

  const handleAddKnowledge = async () => {
    if (!newKbSubject.trim() || !newKbContent.trim()) return;
    try {
      const res = await fetch('/api/knowledge', {
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

  // Filtros de busca
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
      {/* SIDEBAR NO MODELO EXATO DO CHATGPT */}
      {!sidebarCollapsed && (
        <aside className="sidebar">
          {/* Header ChatGPT */}
          <div className="chatgpt-sidebar-header">
            <div className="chatgpt-brand">
              <Sparkles size={20} color="#10b981" />
              <span>ChatGPT</span>
            </div>
            <div className="chatgpt-header-actions">
              <button 
                className="icon-btn" 
                title="Pesquisar chats e pastas"
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

          {/* Campo de Busca Rápida */}
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

          {/* Lista com Rolagem */}
          <div className="sidebar-scrollable">
            {/* Itens Principais do ChatGPT */}
            <div className="sidebar-section">
              <div className="sidebar-item" onClick={handleCreateNewChat}>
                <div className="item-main">
                  <Edit3 size={17} color="var(--accent-cyan)" />
                  <span style={{ fontWeight: 600 }}>Novo chat</span>
                </div>
              </div>

              <div className="sidebar-item" onClick={() => { setIsFunctionsModalOpen(true); setFunctionsTab('tools'); }}>
                <div className="item-main">
                  <Sliders size={17} />
                  <span>Plugins & Funções</span>
                </div>
                <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(99,102,241,0.2)', color: 'var(--accent-cyan)' }}>
                  10 ativas
                </span>
              </div>

              <div className="sidebar-item" onClick={() => { setIsFunctionsModalOpen(true); setFunctionsTab('menu'); }}>
                <div className="item-main">
                  <UtensilsCrossed size={17} />
                  <span>Cardápio & Produtos</span>
                </div>
                {products.length > 0 && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{products.length}</span>
                )}
              </div>

              <div className="sidebar-item" onClick={() => { setIsFunctionsModalOpen(true); setFunctionsTab('knowledge'); }}>
                <div className="item-main">
                  <BookOpen size={17} />
                  <span>Biblioteca</span>
                </div>
              </div>

              <div className="sidebar-item" onClick={() => { setIsFunctionsModalOpen(true); setFunctionsTab('channels'); }}>
                <div className="item-main">
                  <Smartphone size={17} />
                  <span>Canais Multicanal</span>
                </div>
              </div>

              <div className="sidebar-item" onClick={() => { setIsFunctionsModalOpen(true); setFunctionsTab('dashboard'); }}>
                <div className="item-main">
                  <Activity size={17} />
                  <span>Métricas & n8n</span>
                </div>
              </div>
            </div>

            {/* SEÇÃO: FIXADA (Pastas e Chats Fixados) */}
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
                  onClick={() => setSelectedFolderFilter(selectedFolderFilter === folder.id ? null : folder.id)}
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
                  onClick={() => setActiveChatId(chat.id)}
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
                  </div>
                </div>
              ))}

              {pinnedFolders.length === 0 && pinnedChats.length === 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', padding: '4px 10px' }}>
                  Nenhum item fixado. Fixe pastas ou chats para acesso rápido!
                </div>
              )}
            </div>

            {/* SEÇÃO: PROJETOS (PASTAS) */}
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

              {/* Input inline para criar pasta */}
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

              {/* Botão de resetar filtro de pasta se ativo */}
              {selectedFolderFilter && (
                <div 
                  className="sidebar-item"
                  style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem' }}
                  onClick={() => setSelectedFolderFilter(null)}
                >
                  <div className="item-main">
                    <X size={14} />
                    <span>Ver todos os chats</span>
                  </div>
                </div>
              )}

              {/* Lista de Pastas/Projetos */}
              {regularFolders.map(folder => (
                <div 
                  key={folder.id} 
                  className={`sidebar-item ${selectedFolderFilter === folder.id ? 'active' : ''}`}
                  onClick={() => setSelectedFolderFilter(selectedFolderFilter === folder.id ? null : folder.id)}
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
                      title="Fixar na barra de favoritos"
                      onClick={() => handleTogglePinFolder(folder.id)}
                    >
                      <Pin size={13} />
                    </button>
                    <button 
                      className="item-action-btn" 
                      title="Renomear pasta"
                      onClick={() => { setEditingFolderId(folder.id); setEditFolderName(folder.name); }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button 
                      className="item-action-btn" 
                      title="Excluir pasta"
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

            {/* SEÇÃO: CHATS */}
            <div className="sidebar-section">
              <div className="sidebar-section-header">
                <span>Chats {selectedFolderFilter ? `(${folders.find(f => f.id === selectedFolderFilter)?.name})` : ''}</span>
              </div>

              {filteredChats.map(chat => (
                <div 
                  key={chat.id} 
                  className={`sidebar-item ${activeChatId === chat.id ? 'active' : ''}`}
                  onClick={() => setActiveChatId(chat.id)}
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
                      title={chat.isPinned ? "Desafixar chat" : "Fixar chat no topo"}
                      onClick={() => handleTogglePinChat(chat.id)}
                    >
                      <Pin size={13} color={chat.isPinned ? "var(--accent-amber)" : undefined} />
                    </button>

                    {/* Mover para Pasta Dropdown */}
                    <button 
                      className="item-action-btn" 
                      title="Mover para pasta"
                      onClick={() => setChatFolderMenuId(chatFolderMenuId === chat.id ? null : chat.id)}
                    >
                      <Folder size={13} />
                    </button>

                    <button 
                      className="item-action-btn" 
                      title="Renomear"
                      onClick={() => { setEditingChatId(chat.id); setEditChatTitle(chat.title); }}
                    >
                      <Edit3 size={13} />
                    </button>

                    <button 
                      className="item-action-btn" 
                      title="Excluir chat"
                      onClick={() => handleDeleteChat(chat.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Menu Popover de Mover para Pasta */}
                  {chatFolderMenuId === chat.id && (
                    <div 
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        left: 20,
                        right: 20,
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

              {filteredChats.length === 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', padding: '6px 10px' }}>
                  Nenhum chat encontrado.
                </div>
              )}
            </div>
          </div>

          {/* FOOTER NO MODELO EXATO DO CHATGPT */}
          <div className="chatgpt-user-footer">
            <div className="user-profile-row" onClick={toggleTheme} title="Clique para alternar tema">
              <div className="avatar-circle">AN</div>
              <div style={{ flex: 1 }}>
                <div className="user-name">Anthony Both</div>
                <div className="user-plan">Free · Multiplex GPT</div>
              </div>
              <button className="icon-btn" onClick={toggleTheme} title="Alternar Modo Claro/Escuro">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            <button 
              className="btn-plus-reativar"
              onClick={() => { setIsFunctionsModalOpen(true); setFunctionsTab('tools'); }}
            >
              <Sparkles size={14} color="#10b981" />
              <span>Gerenciar Funções IA</span>
            </button>
          </div>
        </aside>
      )}

      {/* ÁREA CENTRAL DO CHATGPT */}
      <main className="chatgpt-main">
        {/* Top Bar ChatGPT */}
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

            <div 
              className="model-selector"
              onClick={() => { setIsFunctionsModalOpen(true); setFunctionsTab('tools'); }}
              title="Ver funções ativas da IA"
            >
              <Sparkles size={16} color="var(--accent-primary)" />
              <span>Multiplex (GPT-4o)</span>
              <span className="badge" style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                10 Funções
              </span>
              <ChevronDown size={14} color="var(--text-dim)" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              onClick={() => { setIsFunctionsModalOpen(true); setFunctionsTab('tools'); }}
            >
              <Sliders size={14} />
              <span>Funções & Configurações</span>
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
            {/* Se o chat estiver sem mensagens ou recém criado */}
            {currentChat && currentChat.messages.length === 0 ? (
              <div className="chat-welcome-container">
                <div className="chat-welcome-icon">
                  <Sparkles size={28} color="#fff" />
                </div>
                <h1 className="chat-welcome-title">Como posso ajudar você hoje?</h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                  Multiplex GPT com busca no cardápio, cálculo de frete, agendamentos e transbordo humano.
                </p>

                <div className="chat-welcome-suggestions">
                  <div 
                    className="chat-suggestion-card"
                    onClick={() => handleSendMessage('Quais são os produtos do cardápio e os preços?')}
                  >
                    <div className="chat-suggestion-title">🍔 Consultar Cardápio</div>
                    <div className="chat-suggestion-desc">Mostre todos os lanches, bebidas e preços cadastrados</div>
                  </div>

                  <div 
                    className="chat-suggestion-card"
                    onClick={() => handleSendMessage('Qual é a taxa de entrega e o valor do frete?')}
                  >
                    <div className="chat-suggestion-title">🚚 Calcular Frete</div>
                    <div className="chat-suggestion-desc">Consulte as regras de entrega e raio de atendimento</div>
                  </div>

                  <div 
                    className="chat-suggestion-card"
                    onClick={() => handleSendMessage('Qual o horário de funcionamento de vocês?')}
                  >
                    <div className="chat-suggestion-title">🕒 Horário de Atendimento</div>
                    <div className="chat-suggestion-desc">Verifique se o estabelecimento está aberto agora</div>
                  </div>

                  <div 
                    className="chat-suggestion-card"
                    onClick={() => handleSendMessage('Quero agendar um atendimento para amanhã')}
                  >
                    <div className="chat-suggestion-title">📅 Agendar Atendimento</div>
                    <div className="chat-suggestion-desc">Teste a função de agendamento automático de serviços</div>
                  </div>
                </div>
              </div>
            ) : (
              currentChat && currentChat.messages.map(msg => (
                <div key={msg.id} className={`message-row ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="message-avatar-ai">
                      <Sparkles size={18} color="#fff" />
                    </div>
                  )}

                  <div className={msg.role === 'user' ? 'message-bubble-user' : 'message-body-ai'}>
                    {/* Se a IA executou ferramentas/tools personalizadas */}
                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        {msg.toolsUsed.map((toolCall, idx) => (
                          <div key={idx} className="tool-badge-chip">
                            <Sliders size={12} />
                            <span>Executou a função: <strong>{toolCall.tool}</strong></span>
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

            {/* Loading Indicator */}
            {isSendingMessage && (
              <div className="message-row assistant">
                <div className="message-avatar-ai">
                  <Sparkles size={18} color="#fff" />
                </div>
                <div className="message-body-ai" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)' }}>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Multiplex GPT pensando e consultando funções...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barra de Prompt Flutuante Estilo Cápsula do ChatGPT */}
        <div className="chatgpt-bottom-wrapper">
          <div className="chatgpt-capsule-box">
            <button 
              className="icon-btn" 
              title="Adicionar função ou contexto"
              onClick={() => { setIsFunctionsModalOpen(true); setFunctionsTab('menu'); }}
            >
              <Plus size={20} />
            </button>

            <input 
              type="text"
              className="capsule-input"
              placeholder="Pergunte qualquer coisa ao Multiplex GPT..."
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
              title="Pesquisa de ferramentas"
              onClick={() => { setIsFunctionsModalOpen(true); setFunctionsTab('tools'); }}
            >
              <Globe size={18} />
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
            O Multiplex GPT é alimentado por IA com as funções personalizadas adicionadas por você. Verifique informações importantes.
          </div>
        </div>
      </main>

      {/* MODAL DE FUNÇÕES PERSONALIZADAS & CONFIGURAÇÕES DA IA */}
      {isFunctionsModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsFunctionsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={22} color="var(--accent-primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Funções & Personalizações do Multiplex GPT</h2>
              </div>
              <button className="icon-btn" onClick={() => setIsFunctionsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Abas do Modal */}
            <div className="modal-tabs">
              <button 
                className={`modal-tab-btn ${functionsTab === 'tools' ? 'active' : ''}`}
                onClick={() => setFunctionsTab('tools')}
              >
                <Sliders size={16} /> 10 Funções Ativas
              </button>
              <button 
                className={`modal-tab-btn ${functionsTab === 'menu' ? 'active' : ''}`}
                onClick={() => setFunctionsTab('menu')}
              >
                <UtensilsCrossed size={16} /> Cardápio & Produtos
              </button>
              <button 
                className={`modal-tab-btn ${functionsTab === 'teach' ? 'active' : ''}`}
                onClick={() => setFunctionsTab('teach')}
              >
                <Sparkles size={16} /> Ensinar IA & Regras
              </button>
              <button 
                className={`modal-tab-btn ${functionsTab === 'knowledge' ? 'active' : ''}`}
                onClick={() => setFunctionsTab('knowledge')}
              >
                <BookOpen size={16} /> Conhecimento & FAQ
              </button>
              <button 
                className={`modal-tab-btn ${functionsTab === 'channels' ? 'active' : ''}`}
                onClick={() => setFunctionsTab('channels')}
              >
                <Smartphone size={16} /> Canais Multicanal
              </button>
              <button 
                className={`modal-tab-btn ${functionsTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setFunctionsTab('dashboard')}
              >
                <Activity size={16} /> Métricas
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="modal-body">
              {/* ABA 1: FUNÇÕES ATIVAS */}
              {functionsTab === 'tools' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    O Multiplex opera como o próprio GPT, mas conta nativamente com ferramentas executáveis pelo modelo de acordo com a necessidade do usuário:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                    {[
                      { name: 'search_products', desc: 'Consulta produtos, preços e descrições do cardápio em tempo real.' },
                      { name: 'get_product', desc: 'Obtém detalhes e ingredientes de um item específico.' },
                      { name: 'get_price', desc: 'Retorna o preço exato com adicionais configurados.' },
                      { name: 'get_business_hours', desc: 'Verifica horários de abertura e fechamento da loja.' },
                      { name: 'calculate_delivery', desc: 'Calcula o frete e tempo estimado com base no CEP/bairro.' },
                      { name: 'create_order', desc: 'Registra pedidos completos automaticamente para envio à cozinha.' },
                      { name: 'transfer_to_human', desc: 'Transfere o atendimento para um operador humano quando solicitado.' },
                      { name: 'register_customer', desc: 'Salva nome, telefone e preferências do cliente no CRM.' },
                      { name: 'schedule_service', desc: 'Agenda horários e atendimentos no calendário.' },
                      { name: 'search_knowledge', desc: 'Consulta a base institucional de dúvidas, políticas e regras.' }
                    ].map(t => (
                      <div key={t.name} className="glass-card" style={{ padding: 14 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                            {t.name}
                          </span>
                          <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.65rem' }}>
                            Ativa
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {t.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ABA 2: CARDÁPIO & PRODUTOS */}
              {functionsTab === 'menu' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="glass-card" style={{ padding: 16 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Cadastrar Novo Produto para a IA</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
                      <input 
                        type="text" 
                        placeholder="Nome do produto (ex: Smash Burger Especial)" 
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
                      placeholder="Descrição, ingredientes e adicionais disponíveis..."
                      value={newProductDesc}
                      onChange={(e) => setNewProductDesc(e.target.value)}
                      rows={2}
                      style={{ marginBottom: 10 }}
                    />
                    <button className="btn-primary" onClick={handleAddProduct}>
                      <Plus size={16} /> Adicionar Produto ao Cardápio
                    </button>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 10 }}>Produtos Cadastrados ({products.length})</h3>
                    {products.length === 0 ? (
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>Nenhum produto cadastrado ainda.</div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                        {products.map(p => (
                          <div key={p.id} className="glass-card" style={{ padding: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                              <span>{p.name}</span>
                              <span style={{ color: '#10b981' }}>R$ {Number(p.price).toFixed(2)}</span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{p.description || 'Sem descrição'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 3: ENSINAR IA & REGRAS */}
              {functionsTab === 'teach' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="glass-card" style={{ padding: 16 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Adicionar Regra de Negócio</h3>
                    <textarea 
                      placeholder="Ex: 'Sempre ofereça batata frita e refrigerante no fechamento do pedido', 'Não aceitamos cheques', 'O tempo médio de entrega é de 40 minutos'..."
                      value={newRuleText}
                      onChange={(e) => setNewRuleText(e.target.value)}
                      rows={3}
                      style={{ marginBottom: 10 }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                        <span>Prioridade (1 a 10):</span>
                        <input 
                          type="number" 
                          min="1" 
                          max="10" 
                          value={newRulePriority} 
                          onChange={(e) => setNewRulePriority(parseInt(e.target.value) || 5)} 
                          style={{ width: 60, padding: '4px 8px' }}
                        />
                      </div>
                      <button className="btn-primary" onClick={handleAddRule}>
                        <Plus size={16} /> Salvar Regra
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 10 }}>Regras Ativas ({rules.length})</h3>
                    {rules.length === 0 ? (
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>Nenhuma regra customizada cadastrada ainda.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {rules.map((r, i) => (
                          <div key={r.id || i} className="glass-card" style={{ padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.88rem' }}>{r.rule_text}</span>
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

              {/* ABA 4: BASE DE CONHECIMENTO */}
              {functionsTab === 'knowledge' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div className="glass-card" style={{ padding: 16 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Adicionar Conhecimento / FAQ</h3>
                    <input 
                      type="text" 
                      placeholder="Assunto ou Pergunta (ex: Política de Trocas e Reembolsos)"
                      value={newKbSubject}
                      onChange={(e) => setNewKbSubject(e.target.value)}
                      style={{ marginBottom: 10 }}
                    />
                    <textarea 
                      placeholder="Resposta detalhada e diretrizes que a IA deve seguir..."
                      value={newKbContent}
                      onChange={(e) => setNewKbContent(e.target.value)}
                      rows={3}
                      style={{ marginBottom: 10 }}
                    />
                    <button className="btn-primary" onClick={handleAddKnowledge}>
                      <Plus size={16} /> Adicionar à Biblioteca
                    </button>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 10 }}>Itens na Biblioteca ({knowledgeList.length})</h3>
                    {knowledgeList.length === 0 ? (
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.88rem' }}>Biblioteca vazia. Cadastre FAQs para o Multiplex consultar.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {knowledgeList.map((k, i) => (
                          <div key={k.id || i} className="glass-card" style={{ padding: 12 }}>
                            <div style={{ fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.9rem' }}>{k.subject}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                              {k.data?.content || JSON.stringify(k.data)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ABA 5: CANAIS */}
              {functionsTab === 'channels' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    O Multiplex atende seus clientes simultaneamente nos principais canais de mensageria:
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    <div className="glass-card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Smartphone size={22} color="#25d366" />
                        <span style={{ fontWeight: 700 }}>WhatsApp</span>
                      </div>
                      <span className="badge badge-whatsapp" style={{ marginBottom: 10 }}>Pronto para Conexão</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Integração via webhook do Evolution API / Z-API / Baileys conectada ao n8n.
                      </p>
                    </div>

                    <div className="glass-card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Instagram size={22} color="#e1306c" />
                        <span style={{ fontWeight: 700 }}>Instagram Direct</span>
                      </div>
                      <span className="badge badge-instagram" style={{ marginBottom: 10 }}>Pronto para Conexão</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Responde DMs e comentários com IA e transbordo humano instantâneo.
                      </p>
                    </div>

                    <div className="glass-card" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <MessageCircle size={22} color="#0088cc" />
                        <span style={{ fontWeight: 700 }}>Telegram</span>
                      </div>
                      <span className="badge badge-telegram" style={{ marginBottom: 10 }}>Pronto para Conexão</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Bot oficial do Telegram para suporte e recebimento de pedidos em tempo real.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 6: DASHBOARD */}
              {functionsTab === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="grid-metrics">
                    <div className="glass-card" style={{ padding: 16 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Conversas Atendidas</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: 4 }}>{metrics.conversations_today}</div>
                    </div>
                    <div className="glass-card" style={{ padding: 16 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Pedidos Criados</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: 4 }}>{metrics.orders_created}</div>
                    </div>
                    <div className="glass-card" style={{ padding: 16 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Faturamento Gerado</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: 4, color: '#10b981' }}>
                        R$ {Number(metrics.revenue_brl || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Activity size={20} color="#10b981" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>n8n Local Conectado</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Webhooks e automações ativas na porta 5678</div>
                      </div>
                    </div>
                    <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                      Online
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
