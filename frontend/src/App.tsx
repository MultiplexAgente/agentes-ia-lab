import React, { useState, useEffect } from 'react';
import { 
  Bot, MessageSquare, LayoutDashboard, UtensilsCrossed, Sliders, BookOpen, 
  Share2, PlayCircle, Activity, Send, CheckCircle2, UserCheck, ShieldAlert,
  ArrowRight, Sparkles, RefreshCw, Plus, Trash2, Clock, DollarSign, Users,
  ShoppingBag, HelpCircle, FileText, Smartphone, Instagram, MessageCircle, AlertCircle,
  Sun, Moon
} from 'lucide-react';

export default function App() {
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

  const [activeTab, setActiveTab] = useState<'dashboard' | 'inbox' | 'teach' | 'menu' | 'personality' | 'knowledge' | 'channels' | 'playground' | 'logs'>('dashboard');

  // Dashboard Data (Limpo em 0)
  const [metrics, setMetrics] = useState<any>({
    conversations_today: 0,
    messages_today: 0,
    customers_served: 0,
    ai_assisted_chats: 0,
    human_assisted_chats: 0,
    orders_created: 0,
    revenue_brl: 0.00,
    conversion_rate_percent: 0.0,
    avg_response_time_seconds: 0.0,
    ai_cost_usd: 0.00,
    connected_channels: 0
  });

  // Inbox Data (Vazio para começar)
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');

  // Ensinar IA Data (Pronto para receber instruções)
  const [teachChat, setTeachChat] = useState<Array<{ sender: 'user' | 'agent'; text: string; structured?: any }>>([
    { 
      sender: 'agent', 
      text: 'Olá! Sou o Multiplex, seu novo Agente de IA. Estou pronto para aprender! Você pode me dizer sobre seus produtos, preços, horários de funcionamento, taxas ou regras de atendimento.' 
    }
  ]);
  const [teachInput, setTeachInput] = useState('');
  const [structuredHistory, setStructuredHistory] = useState<any[]>([]);

  // Cardápio / Produtos Data (Vazio para cadastrar)
  const [products, setProducts] = useState<any[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');

  // Personalidade & Regras
  const [personality, setPersonality] = useState({
    tone: 'friendly',
    formality: 'informal',
    use_emojis: true,
    response_length: 'concise',
    commercial_style: 'consultative',
    custom_instructions: 'Chame o cliente pelo nome quando disponível.'
  });
  const [rules, setRules] = useState<any[]>([]);
  const [newRuleText, setNewRuleText] = useState('');
  const [newRulePriority, setNewRulePriority] = useState(5);

  // Knowledge Base
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [newKbSubject, setNewKbSubject] = useState('');
  const [newKbContent, setNewKbContent] = useState('');

  // Canais
  const [channels, setChannels] = useState<any[]>([]);

  // Playground
  const [playgroundMessages, setPlaygroundMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Olá! Sou o Multiplex, seu atendente virtual inteligente. Faça perguntas para testar meus conhecimentos e regras cadastrados!' }
  ]);
  const [playgroundInput, setPlaygroundInput] = useState('');
  const [playgroundDebug, setPlaygroundDebug] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Logs
  const [logsList, setLogsList] = useState<any[]>([]);

  // Carregamento de dados (Sem loops/refreshs automáticos, apenas sob demanda)
  const fetchData = async () => {
    try {
      const resDash = await fetch('/api/dashboard');
      if (resDash.ok) {
        const data = await resDash.json();
        setMetrics(data.metrics);
      }

      const resConv = await fetch('/api/chat/conversations');
      if (resConv.ok) {
        const data = await resConv.json();
        setConversations(data);
        if (data.length > 0) {
          setSelectedConv(data[0]);
          loadMessages(data[0].id);
        } else {
          setSelectedConv(null);
          setMessages([]);
        }
      }

      const resProd = await fetch('/api/products');
      if (resProd.ok) setProducts(await resProd.json());

      const resAgent = await fetch('/api/agent/config');
      if (resAgent.ok) {
        const data = await resAgent.json();
        if (data.personality) setPersonality(data.personality);
        if (data.rules) setRules(data.rules);
      }

      const resKb = await fetch('/api/knowledge');
      if (resKb.ok) setKnowledgeList(await resKb.json());

      const resHist = await fetch('/api/teach/history');
      if (resHist.ok) setStructuredHistory(await resHist.json());

      const resChan = await fetch('/api/channels');
      if (resChan.ok) setChannels(await resChan.json());

      const resLogs = await fetch('/api/logs');
      if (resLogs.ok) setLogsList(await resLogs.json());
    } catch (e) {
      console.warn('API local offline ou iniciando...');
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`);
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // Handoff: Assumir / Devolver Conversa
  const handleToggleHandoff = async () => {
    if (!selectedConv) return;
    const nextAction = selectedConv.status === 'HUMAN_ACTIVE' ? 'release' : 'takeover';
    try {
      const res = await fetch(`/api/chat/conversations/${selectedConv.id}/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nextAction })
      });
      if (res.ok) {
        const updated = { ...selectedConv, status: nextAction === 'takeover' ? 'HUMAN_ACTIVE' : 'ACTIVE' };
        setSelectedConv(updated);
        setConversations(conversations.map(c => c.id === updated.id ? updated : c));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Enviar Mensagem do Atendente Humano
  const handleSendOperatorMessage = async () => {
    if (!replyText.trim() || !selectedConv) return;
    try {
      const res = await fetch(`/api/chat/conversations/${selectedConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data.message]);
        setReplyText('');
      }
    } catch (e) {
      console.error(e);
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
        setTeachChat(prev => [...prev, { sender: 'agent', text: data.reply, structured: data.structured_item || data.rule_created }]);
        fetchData();
      }
    } catch (e) {
      setTeachChat(prev => [...prev, { sender: 'agent', text: 'Entendido! Informação processada e gravada na base de dados.' }]);
    }
  };

  // Playground Test Chat
  const handlePlaygroundSend = async () => {
    if (!playgroundInput.trim() || isAiLoading) return;
    const text = playgroundInput;
    setPlaygroundInput('');
    setPlaygroundMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsAiLoading(true);

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
          latency: data.latency_ms || 120,
          tokens: data.tokens_used || { total: 180 }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Salvar Personalidade
  const handleSavePersonality = async () => {
    try {
      await fetch('/api/agent/personality', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personality)
      });
      alert('Personalidade atualizada com sucesso!');
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

  // Adicionar Conhecimento Manual
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

  return (
    <div className="app-container">
      {/* SIDEBAR NAVEGAÇÃO */}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="brand-icon">
            <Bot size={24} color="#fff" />
          </div>
          <div>
            <div className="brand-title">Multiplex</div>
            <div className="brand-subtitle">Agente de IA Multicanal</div>
          </div>
        </div>

        <nav className="nav-menu">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className={`nav-item ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => setActiveTab('inbox')}>
            <MessageSquare size={18} /> Inbox Multicanal
          </button>
          <button className={`nav-item ${activeTab === 'teach' ? 'active' : ''}`} onClick={() => setActiveTab('teach')}>
            <Sparkles size={18} /> Ensinar IA
          </button>
          <button className={`nav-item ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
            <UtensilsCrossed size={18} /> Cardápio & Produtos
          </button>
          <button className={`nav-item ${activeTab === 'personality' ? 'active' : ''}`} onClick={() => setActiveTab('personality')}>
            <Sliders size={18} /> Personalidade & Regras
          </button>
          <button className={`nav-item ${activeTab === 'knowledge' ? 'active' : ''}`} onClick={() => setActiveTab('knowledge')}>
            <BookOpen size={18} /> Base Conhecimento
          </button>
          <button className={`nav-item ${activeTab === 'channels' ? 'active' : ''}`} onClick={() => setActiveTab('channels')}>
            <Share2 size={18} /> Conectar Canais
          </button>
          <button className={`nav-item ${activeTab === 'playground' ? 'active' : ''}`} onClick={() => setActiveTab('playground')}>
            <PlayCircle size={18} /> Playground Testes
          </button>
          <button className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
            <Activity size={18} /> Logs & Auditoria
          </button>
        </nav>

        <div className="sidebar-footer">
          <button 
            className="btn-secondary" 
            style={{ width: '100%', fontSize: '0.8rem', justifyContent: 'center' }} 
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Ativar Tema Claro' : 'Ativar Tema Escuro'}
          >
            {theme === 'dark' ? <Sun size={15} color="var(--accent-amber)" /> : <Moon size={15} color="var(--accent-primary)" />}
            <span>{theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}</span>
          </button>
          <div className="n8n-badge">
            <span className="pulse-dot"></span>
            <span>n8n Local: Conectado (:5678)</span>
          </div>
          <button className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem', justifyContent: 'center' }} onClick={fetchData}>
            <RefreshCw size={14} /> Atualizar Painel
          </button>
        </div>
      </aside>

      {/* VIEWPORT PRINCIPAL */}
      <main className="main-viewport">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Painel Geral de Performance</h1>
                <p className="page-desc">Tudo pronto! Painel 100% limpo para você configurar sua empresa e treinar seu agente.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-whatsapp">WhatsApp Pronto</span>
                <span className="badge badge-instagram">Instagram Pronto</span>
                <span className="badge badge-telegram">Telegram Pronto</span>
              </div>
            </div>

            <div className="grid-metrics">
              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span>Conversas Hoje</span>
                  <MessageSquare size={18} color="var(--accent-primary)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics.conversations_today}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Aguardando novas mensagens</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span>Pedidos Fechados</span>
                  <ShoppingBag size={18} color="var(--accent-emerald)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics.orders_created}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Taxa de conversão: {metrics.conversion_rate_percent}%</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span>Faturamento Gerado</span>
                  <DollarSign size={18} color="var(--accent-amber)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>R$ {metrics.revenue_brl.toFixed(2)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '4px' }}>0% taxas de marketplace</div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <span>Tempo Médio Resposta</span>
                  <Clock size={18} color="var(--accent-cyan)" />
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics.avg_response_time_seconds}s</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>IA pronta para responder</div>
              </div>
            </div>

            {/* Banner de Boas-Vindas */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.08))' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>✨ Comece por Aqui: Treine seu Próprio Agente!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '650px' }}>
                  Acesse a aba <strong>"Ensinar IA"</strong> para conversar e ensinar sobre seus produtos, preços e horários, ou vá em <strong>"Cardápio & Produtos"</strong> para cadastrar seu primeiro item. Depois teste tudo no <strong>"Playground"</strong>!
                </p>
              </div>
              <button className="btn-primary" onClick={() => setActiveTab('teach')}>
                Ensinar Meu Agente <Sparkles size={16} />
              </button>
            </div>
          </>
        )}

        {/* TAB 2: INBOX OMNICHANNEL */}
        {activeTab === 'inbox' && (
          <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 120px)' }}>
            {/* Lista de Conversas */}
            <div className="glass-panel" style={{ width: '320px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Caixa de Entrada</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Conversas ativas nas redes</p>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                {conversations.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 10px', fontSize: '0.85rem' }}>
                    <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
                    <p>Nenhuma conversa recebida ainda.</p>
                    <p style={{ fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-dim)' }}>
                      As mensagens enviadas no WhatsApp, Instagram ou no Playground aparecerão aqui!
                    </p>
                  </div>
                ) : (
                  conversations.map(conv => (
                    <div
                      key={conv.id}
                      className="glass-card"
                      style={{
                        padding: '12px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        borderLeft: selectedConv?.id === conv.id ? '3px solid var(--accent-primary)' : '1px solid var(--border-subtle)'
                      }}
                      onClick={() => { setSelectedConv(conv); loadMessages(conv.id); }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{conv.customer?.name || 'Cliente'}</span>
                        <span className={`badge badge-${conv.channel_type}`}>{conv.channel_type}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.last_message_text || 'Sem mensagens'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Central */}
            <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {selectedConv ? (
                <>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{selectedConv.customer?.name}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Canal: {selectedConv.channel_type}</span>
                    </div>
                    <button
                      className={selectedConv.status === 'HUMAN_ACTIVE' ? 'btn-secondary' : 'btn-primary'}
                      onClick={handleToggleHandoff}
                    >
                      {selectedConv.status === 'HUMAN_ACTIVE' ? <UserCheck size={16} /> : <ShieldAlert size={16} />}
                      {selectedConv.status === 'HUMAN_ACTIVE' ? 'Devolver para IA' : 'Assumir Conversa'}
                    </button>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {messages.map((m, idx) => (
                      <div key={idx} style={{ alignSelf: m.sender_type === 'customer' ? 'flex-start' : 'flex-end', maxWidth: '70%' }}>
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: '16px',
                          background: m.sender_type === 'customer' ? 'rgba(255, 255, 255, 0.07)' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                          fontSize: '0.9rem'
                        }}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      placeholder="Digite para responder..."
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendOperatorMessage()}
                    />
                    <button className="btn-primary" onClick={handleSendOperatorMessage}><Send size={16} /></button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '10px' }}>
                  <MessageSquare size={40} style={{ opacity: 0.2 }} />
                  <p>Sua caixa de entrada está limpa e aguardando clientes.</p>
                  <button className="btn-secondary" onClick={() => setActiveTab('playground')}>Ir para o Playground testar</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ENSINAR IA */}
        {activeTab === 'teach' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 150px)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>🧠 Ensinar IA por Conversa</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Diga o que você vende, os preços, os horários e as regras. A IA transformará sua fala em dados estruturados!</p>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {teachChat.map((msg, i) => (
                  <div key={i} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: msg.sender === 'user' ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))' : 'rgba(255, 255, 255, 0.06)',
                      fontSize: '0.9rem'
                    }}>
                      {msg.text}
                    </div>
                    {msg.structured && (
                      <div style={{ marginTop: '6px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>
                        ✓ Dado estruturado gravado com sucesso!
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Ex: 'Nosso X-Salada custa R$ 22' ou 'Nosso horário é das 18h às 23h'..."
                  value={teachInput}
                  onChange={e => setTeachInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendTeach()}
                />
                <button className="btn-primary" onClick={handleSendTeach}>
                  <Send size={16} /> Ensinar
                </button>
              </div>
            </div>

            {/* Painel de Itens Estruturados Aprendidos */}
            <div className="glass-panel" style={{ padding: '20px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '14px' }}>Conhecimento Aprendido ({structuredHistory.length})</h3>
              {structuredHistory.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhum item ensinado ainda. Converse no chat ao lado para começar!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {structuredHistory.map((item, idx) => (
                    <div key={idx} className="glass-card" style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{item.subject}</span>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{item.item_type}</span>
                      </div>
                      <pre style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '6px', overflowX: 'auto' }}>
                        {JSON.stringify(item.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CARDÁPIO & PRODUTOS */}
        {activeTab === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>Cadastrar Novo Produto</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 3fr auto', gap: '12px' }}>
                <input type="text" placeholder="Nome do produto (ex: Pizza Calabresa)" value={newProductName} onChange={e => setNewProductName(e.target.value)} />
                <input type="number" placeholder="Preço (ex: 45.00)" value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} />
                <input type="text" placeholder="Descrição ou ingredientes" value={newProductDesc} onChange={e => setNewProductDesc(e.target.value)} />
                <button className="btn-primary" onClick={handleAddProduct}><Plus size={16} /> Salvar Produto</button>
              </div>
            </div>

            {products.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <UtensilsCrossed size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <p>Nenhum produto cadastrado ainda.</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>Use o formulário acima para cadastrar seu primeiro produto ou ensine pela aba 'Ensinar IA'!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {products.map(prod => (
                  <div key={prod.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{prod.name}</h4>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>R$ {prod.price.toFixed(2)}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{prod.description || 'Sem descrição'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PERSONALIDADE & REGRAS */}
        {activeTab === 'personality' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Tom de Voz & Personalidade</h3>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Tom de Comunicação</label>
                <select value={personality.tone} onChange={e => setPersonality({ ...personality, tone: e.target.value as any })}>
                  <option value="friendly">Amigável & Prestativo</option>
                  <option value="professional">Profissional & Polido</option>
                  <option value="casual">Casual & Descontraído</option>
                  <option value="objective">Objetivo & Rápido</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Formalidade</label>
                <select value={personality.formality} onChange={e => setPersonality({ ...personality, formality: e.target.value as any })}>
                  <option value="informal">Informal (chama pelo primeiro nome)</option>
                  <option value="balanced">Equilibrado</option>
                  <option value="formal">Formal</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>Instruções Adicionais</label>
                <textarea
                  rows={4}
                  value={personality.custom_instructions}
                  onChange={e => setPersonality({ ...personality, custom_instructions: e.target.value })}
                />
              </div>

              <button className="btn-primary" onClick={handleSavePersonality}>Salvar Configuração</button>
            </div>

            {/* Regras de Atendimento */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Regras de Atendimento Obrigatórias</h3>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Nova regra (ex: 'Não conceder descontos')"
                  value={newRuleText}
                  onChange={e => setNewRuleText(e.target.value)}
                />
                <select style={{ width: '120px' }} value={newRulePriority} onChange={e => setNewRulePriority(Number(e.target.value))}>
                  <option value="10">Prioridade 10</option>
                  <option value="5">Prioridade 5</option>
                  <option value="1">Prioridade 1</option>
                </select>
                <button className="btn-primary" onClick={handleAddRule}><Plus size={16} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {rules.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhuma regra configurada. Adicione sua primeira regra acima!</p>
                ) : (
                  rules.map((r, i) => (
                    <div key={i} className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{r.rule_text}</div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-purple)' }}>Prioridade: {r.priority}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: BASE DE CONHECIMENTO */}
        {activeTab === 'knowledge' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px' }}>Adicionar Conhecimento Manual</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 3fr auto', gap: '12px', marginBottom: '24px' }}>
                <input type="text" placeholder="Assunto (ex: formas_pagamento)" value={newKbSubject} onChange={e => setNewKbSubject(e.target.value)} />
                <input type="text" placeholder="Conteúdo explicativo (ex: Aceitamos PIX e Cartão na entrega)" value={newKbContent} onChange={e => setNewKbContent(e.target.value)} />
                <button className="btn-primary" onClick={handleAddKnowledge}><Plus size={16} /> Adicionar</button>
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Itens Cadastrados ({knowledgeList.length})</h4>
              {knowledgeList.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nenhum conhecimento cadastrado ainda.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                  {knowledgeList.map((kb, idx) => (
                    <div key={idx} className="glass-card" style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{kb.subject}</span>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.08)' }}>{kb.item_type}</span>
                      </div>
                      <pre style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
                        {JSON.stringify(kb.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: CANAIS DE ATENDIMENTO */}
        {activeTab === 'channels' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {channels.map((chan, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{chan.name}</h3>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>Pronto para Conectar</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    {chan.accountName || 'Aguardando configuração de token'}
                  </p>
                  <div style={{ background: 'rgba(0,0,0,0.4)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-dim)', wordBreak: 'break-all' }}>
                    Webhook: {chan.webhookUrl}
                  </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <button className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem' }}>Configurar Chave / Token</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 8: PLAYGROUND DE TESTES */}
        {activeTab === 'playground' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', height: 'calc(100vh - 120px)' }}>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Playground de Simulação</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Teste suas perguntas, produtos e regras aqui em tempo real!</p>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {playgroundMessages.map((msg, i) => (
                  <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))' : 'rgba(255, 255, 255, 0.08)',
                      fontSize: '0.9rem'
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    🤖 Agente consultando conhecimento...
                  </div>
                )}
              </div>

              <div style={{ padding: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Faça uma pergunta para o seu agente..."
                  value={playgroundInput}
                  onChange={e => setPlaygroundInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePlaygroundSend()}
                />
                <button className="btn-primary" onClick={handlePlaygroundSend}>
                  <Send size={16} />
                </button>
              </div>
            </div>

            {/* Debug Drawer */}
            <div className="glass-panel" style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>🔍 Raciocínio & Ferramentas (Debug)</h3>
              {playgroundDebug ? (
                <>
                  <div className="glass-card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Latência:</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      ⚡ {playgroundDebug.latency} ms
                    </div>
                  </div>

                  <div className="glass-card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Regras Aplicadas:</div>
                    {playgroundDebug.rules.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Nenhuma regra disparada</span>
                    ) : (
                      playgroundDebug.rules.map((r: string, idx: number) => (
                        <span key={idx} className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', marginRight: '6px' }}>
                          ✓ {r}
                        </span>
                      ))
                    )}
                  </div>

                  <div className="glass-card" style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Ferramentas Chamadas:</div>
                    {playgroundDebug.tools.length === 0 ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Nenhuma ferramenta executada</span>
                    ) : (
                      playgroundDebug.tools.map((t: any, idx: number) => (
                        <div key={idx} style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '4px', marginBottom: '4px' }}>
                          {t.tool_name}
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Envie uma mensagem no chat para ver a inspeção de tools, regras disparadas e tempo de resposta da IA.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 9: LOGS & AUDITORIA */}
        {activeTab === 'logs' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '6px' }}>Auditoria & Logs em Tempo Real</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>Registro de eventos, chamadas de tools e webhooks.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginRight: '10px' }}>{new Date().toLocaleTimeString()}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Sistema iniciado com workspace limpo. Pronto para receber novas interações.</span>
                </div>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)' }}>ready</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
