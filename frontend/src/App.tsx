import React, { useState, useEffect } from 'react';
import { 
  Bot, MessageSquare, UtensilsCrossed, Sliders, BookOpen, 
  Activity, Send, Sparkles, RefreshCw, Plus, Trash2,
  Smartphone, Instagram, MessageCircle, AlertCircle,
  Sun, Moon, Folder, FolderPlus, Pin, PinOff, Search, PanelLeft,
  Edit3, Check, X, ArrowUp, PlayCircle, LayoutDashboard
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

  // Treinamento
  const [teachChat, setTeachChat] = useState<Array<{ sender: 'user' | 'agent'; text: string; structured?: any }>>([
    { 
      sender: 'agent', 
      text: 'Ola, sou o Multiplex. Insira informacoes sobre produtos, precos, regras ou horarios para eu aprender.' 
    }
  ]);
  const [teachInput, setTeachInput] = useState('');
  const [structuredHistory, setStructuredHistory] = useState<any[]>([]);

  // Playground
  const [playgroundMessages, setPlaygroundMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Ambiente de testes do Multiplex. Digite para testar a execucao de funcoes e regras.' }
  ]);
  const [playgroundInput, setPlaygroundInput] = useState('');
  const [playgroundDebug, setPlaygroundDebug] = useState<any>(null);

  // Logs
  const [logsList, setLogsList] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [resProd, resAgent, resKb, resChan, resDash, resHist, resLogs] = await Promise.all([
        fetch('/api/products').catch(() => null),
        fetch('/api/agent/config').catch(() => null),
        fetch('/api/knowledge').catch(() => null),
        fetch('/api/channels').catch(() => null),
        fetch('/api/dashboard').catch(() => null),
        fetch('/api/teach/history').catch(() => null),
        fetch('/api/logs').catch(() => null)
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
      const res = await fetch('/api/teach', {
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
      const res = await fetch('/api/chat/message', {
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

  // Adicionar Produto
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

  // Adicionar Regra
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

  // Adicionar Conhecimento
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
            <div className="chatgpt-brand" onClick={() => setActiveView('chat')} style={{ cursor: 'pointer' }}>
              <Bot size={20} color="var(--accent-primary)" />
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
                <div className="avatar-circle">M</div>
                <div>
                  <div className="user-name">Multiplex</div>
                  <div className="user-plan">Agente de IA Multicanal</div>
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

              <div className="model-selector">
                <Bot size={16} color="var(--accent-primary)" />
                <span>Multiplex (GPT-4o)</span>
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
                  <div className="chat-welcome-icon">
                    <Bot size={28} color="#fff" />
                  </div>
                  <h1 className="chat-welcome-title">Como posso ajudar voce hoje?</h1>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                    Multiplex GPT integrado com cardapio, frete, agendamentos e regras.
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
                      <div className="message-avatar-ai">
                        <Bot size={18} color="#fff" />
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
                  <div className="message-avatar-ai">
                    <Bot size={18} color="#fff" />
                  </div>
                  <div className="message-body-ai" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)' }}>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Multiplex GPT pensando e executando funcoes...</span>
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
              O Multiplex GPT executa as funcoes personalizadas adicionadas por voce.
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
          <div className="page-header">
            <div>
              <h1 className="page-title">Cardapio e Produtos</h1>
              <p className="page-desc">Cadastre e gerencie os itens que o Multiplex GPT consulta durante o atendimento.</p>
            </div>
            <button className="btn-secondary" onClick={() => setActiveView('chat')}>
              <MessageSquare size={16} /> Voltar ao Chat
            </button>
          </div>

          <div className="glass-panel" style={{ padding: 20 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 14 }}>Cadastrar Novo Produto</h2>
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
              style={{ marginBottom: 14 }}
            />
            <button className="btn-primary" onClick={handleAddProduct}>
              <Plus size={16} /> Adicionar Produto
            </button>
          </div>

          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 12 }}>Produtos Cadastrados ({products.length})</h2>
            {products.length === 0 ? (
              <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)' }}>
                Nenhum produto cadastrado ainda.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {products.map(p => (
                  <div key={p.id} className="glass-card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>{p.name}</span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>R$ {Number(p.price).toFixed(2)}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 6 }}>{p.description || 'Sem descricao'}</p>
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

      {/* TELA: CONECTAR CANAIS */}
      {activeView === 'channels' && (
        <div className="main-panel-scrollable">
          <div className="page-header">
            <div>
              <h1 className="page-title">Conectar Canais Multicanal</h1>
              <p className="page-desc">Canais para atendimento simultaneo pelo Multiplex.</p>
            </div>
            <button className="btn-secondary" onClick={() => setActiveView('chat')}>
              <MessageSquare size={16} /> Voltar ao Chat
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            <div className="glass-panel" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Smartphone size={28} color="#25d366" />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>WhatsApp</h3>
                  <span className="badge badge-whatsapp" style={{ marginTop: 4 }}>Pronto para Conectar</span>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Integracao via webhook oficial n8n com Evolution API / Z-API / Baileys.
              </p>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Conectar WhatsApp
              </button>
            </div>

            <div className="glass-panel" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Instagram size={28} color="#e1306c" />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Instagram Direct</h3>
                  <span className="badge badge-instagram" style={{ marginTop: 4 }}>Pronto para Conectar</span>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Respostas automaticas em mensagens diretas (DMs) e comentarios.
              </p>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Conectar Instagram
              </button>
            </div>

            <div className="glass-panel" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <MessageCircle size={28} color="#0088cc" />
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Telegram Bot</h3>
                  <span className="badge badge-telegram" style={{ marginTop: 4 }}>Pronto para Conectar</span>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Bot oficial do Telegram para atendimento e pedidos.
              </p>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Conectar Telegram
              </button>
            </div>
          </div>
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
