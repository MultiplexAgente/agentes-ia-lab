import React, { useState } from 'react';
import {
  MessageSquare,
  Users,
  Bot,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Sparkles,
  Smartphone,
  Layers,
  ArrowUpRight,
  Send,
  HelpCircle,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export interface DashboardData {
  metrics: {
    conversations_total: number;
    conversations_active: number;
    customers_total: number;
    leads_count: number;
    messages_total: number;
    messages_received: number;
    messages_sent: number;
    ai_resolution_rate: number | null;
    human_handoff_rate: number | null;
    avg_response_time_seconds: number;
    connected_channels_count: number;
    catalog_total_items: number;
  };
  channels: Array<{
    type: string;
    name: string;
    connected: boolean;
    accountName?: string;
  }>;
  recent_conversations: Array<{
    id: string;
    customer_name: string;
    customer_phone: string;
    channel: string;
    last_message: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  recent_activities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    time: string;
    badge: string;
    badgeColor: string;
  }>;
  catalog_summary: {
    products: number;
    catalog_synced: number;
    has_catalog: boolean;
  };
  has_commercial_data: boolean;
  commercial_metrics?: {
    orders_count: number;
    revenue_brl: number;
    expenses_brl: number;
  } | null;
}

interface Props {
  data: DashboardData;
  onRefresh: () => void;
  onNavigate: (view: any) => void;
  companyName?: string;
}

export const ExecutiveDashboardView: React.FC<Props> = ({
  data,
  onRefresh,
  onNavigate,
  companyName = 'Minha Empresa'
}) => {
  const [periodFilter, setPeriodFilter] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [searchFilter, setSearchFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    metrics,
    channels = [],
    recent_conversations = [],
    recent_activities = [],
    catalog_summary,
    has_commercial_data
  } = data || {};

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const filteredConversations = (recent_conversations || []).filter(conv => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      conv.id.toLowerCase().includes(q) ||
      conv.customer_name.toLowerCase().includes(q) ||
      conv.channel.toLowerCase().includes(q) ||
      conv.status.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'IA_ATIVA' || s === 'IA ATIVA') {
      return (
        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '3px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Bot size={12} /> IA Ativa
        </span>
      );
    }
    if (s === 'AGUARDANDO_HUMANO') {
      return (
        <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '3px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} /> Aguardando Humano
        </span>
      );
    }
    if (s === 'HUMANO_ATIVO') {
      return (
        <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '3px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Users size={12} /> Humano Ativo
        </span>
      );
    }
    return (
      <span style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-dim)', padding: '3px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 500 }}>
        Encerrada
      </span>
    );
  };

  return (
    <div className="main-panel-scrollable" style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* HEADER DO DASHBOARD EXECUTIVO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Dashboard Executivo</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }}></span>
              IA operando em tempo real
            </span>
          </div>
          <p className="page-desc" style={{ marginTop: 4, marginBottom: 0 }}>
            Visão consolidada da operação da sua empresa, com conversas, clientes, leads, automações, catálogo e desempenho da IA para <strong style={{ color: 'var(--text-main)' }}>{companyName}</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Seletor de Período */}
          <div style={{ display: 'flex', background: 'var(--card-bg, rgba(255,255,255,0.05))', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 3 }}>
            {(['today', '7d', '30d', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: 7,
                  fontSize: '0.75rem',
                  fontWeight: periodFilter === p ? 700 : 500,
                  cursor: 'pointer',
                  background: periodFilter === p ? 'var(--accent-primary)' : 'transparent',
                  color: periodFilter === p ? '#fff' : 'var(--text-dim)',
                  transition: 'all 0.15s ease'
                }}
              >
                {p === 'today' ? 'Hoje' : p === '7d' ? '7 Dias' : p === '30d' ? '30 Dias' : 'Geral'}
              </button>
            ))}
          </div>

          <button
            className="btn-secondary"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.82rem' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-animation' : ''} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </button>

          <button
            className="btn-primary"
            onClick={() => onNavigate('channels')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.82rem' }}
          >
            <Smartphone size={14} />
            Conectar Canais
          </button>
        </div>
      </div>

      {/* 4 CARDS PRINCIPAIS DO DOMÍNIO DO MULTIPLEX (SEM DADOS FAKE) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
        
        {/* CARD 1: CONVERSAS */}
        <div className="glass-card" style={{ padding: '20px 22px', borderLeft: '4px solid #00d2ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Conversas no Período
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: 6, color: '#00d2ff', letterSpacing: '-0.5px' }}>
                {metrics?.conversations_total ?? 0}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(0, 210, 255, 0.12)', color: '#00d2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>{metrics?.conversations_active ?? 0} ativas no momento</span>
          </div>
        </div>

        {/* CARD 2: CLIENTES ATENDIDOS */}
        <div className="glass-card" style={{ padding: '20px 22px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Clientes Atendidos
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: 6, color: '#a78bfa', letterSpacing: '-0.5px' }}>
                {metrics?.customers_total ?? 0}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span>Base de contatos identificados</span>
          </div>
        </div>

        {/* CARD 3: LEADS GERADOS */}
        <div className="glass-card" style={{ padding: '20px 22px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Leads Qualificados
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: 6, color: '#10b981', letterSpacing: '-0.5px' }}>
                {metrics?.leads_count ?? 0}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span>Captação automatizada via canais</span>
          </div>
        </div>

        {/* CARD 4: EFICIÊNCIA DA IA */}
        <div className="glass-card" style={{ padding: '20px 22px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Eficiência da IA
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: 6, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                {metrics?.ai_resolution_rate !== null && metrics?.ai_resolution_rate !== undefined 
                  ? `${metrics.ai_resolution_rate}%` 
                  : 'Aguardando dados'}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span>Tempo médio: <strong>{metrics?.avg_response_time_seconds || 0}s</strong></span>
          </div>
        </div>

      </div>

      {/* CHIPS RÁPIDOS DE OPERAÇÃO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={17} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Mensagens Trocadas</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{metrics?.messages_total ?? 0} no histórico</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={17} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Canais Conectados</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{metrics?.connected_channels_count ?? 0} ativos</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={17} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Itens no Catálogo</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{metrics?.catalog_total_items ?? 0} itens cadastrados</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(0, 210, 255, 0.12)', color: '#00d2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={17} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Automações Ativas</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Omnichannel n8n</div>
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL DE 2 COLUNAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 20, alignItems: 'start' }}>
        
        {/* COLUNA ESQUERDA: CONVERSAS RECENTES & FEED OPERACIONAL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* TABELA DE CONVERSAS RECENTES */}
          <div className="glass-panel" style={{ padding: 22, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={18} color="var(--accent-primary)" />
                  Conversas Recentes
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Acompanhamento em tempo real dos atendimentos nos canais
                </span>
              </div>

              {/* Busca rápida */}
              <div style={{ position: 'relative', minWidth: 200 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Filtrar por cliente, canal..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  style={{
                    padding: '6px 10px 6px 30px',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--card-bg, rgba(255,255,255,0.05))',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    width: '100%'
                  }}
                />
              </div>
            </div>

            {filteredConversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>Você ainda não possui conversas neste período.</div>
                <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
                  Assim que os clientes enviarem mensagens pelo WhatsApp ou chat, as conversas aparecerão aqui.
                </div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Cliente</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Canal</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Última Mensagem</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConversations.map(conv => (
                      <tr key={conv.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{conv.customer_name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{conv.customer_phone}</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase' }}>
                            {conv.channel}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ color: 'var(--text-main)', fontSize: '0.82rem' }}>{conv.last_message}</span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {getStatusBadge(conv.status)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                          {new Date(conv.updated_at || conv.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* FEED DE EVENTOS E ATIVIDADES DA IA */}
          <div className="glass-panel" style={{ padding: 22, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={18} color="var(--accent-cyan)" />
                  Linha do Tempo de Atividades em Tempo Real
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Eventos de atendimento, consultas ao catálogo e automações executadas
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(recent_activities || []).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-dim)' }}>
                  Nenhuma atividade registrada no período selecionado.
                </div>
              ) : (
                recent_activities.map(act => (
                  <div key={act.id} className="glass-card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: act.badgeColor || '#10b981', flexShrink: 0 }}></div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-main)' }}>{act.title}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>{act.description}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {new Date(act.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: CANAIS, CATÁLOGO E INTEGRAÇÕES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* STATUS DOS CANAIS OMNICHANNEL */}
          <div className="glass-panel" style={{ padding: 22, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Smartphone size={18} color="var(--accent-emerald)" />
                  Canais de Atendimento
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Status de conexão oficial dos pontos de contato
                </span>
              </div>
              <button
                className="btn-secondary"
                onClick={() => onNavigate('channels')}
                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
              >
                Gerenciar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(channels || []).map(ch => (
                <div key={ch.type} className="glass-card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: ch.connected ? '#10b981' : 'var(--text-dim)' }}></span>
                    <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{ch.name}</span>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: ch.connected ? '#10b981' : 'var(--text-dim)', fontWeight: 600 }}>
                    {ch.connected ? 'Conectado' : 'Não conectado'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CATÁLOGO DA EMPRESA */}
          <div className="glass-panel" style={{ padding: 22, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShoppingBag size={18} color="#f59e0b" />
                  Catálogo & Inventário
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Produtos, imóveis ou serviços indexados para a IA
                </span>
              </div>
              <button
                className="btn-secondary"
                onClick={() => onNavigate('menu')}
                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
              >
                Ver Catálogo
              </button>
            </div>

            {!catalog_summary?.has_catalog ? (
              <div style={{ textAlign: 'center', padding: '24px 14px', color: 'var(--text-dim)' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>Seu catálogo ainda está vazio.</div>
                <div style={{ fontSize: '0.76rem', marginTop: 4 }}>
                  Adicione produtos ou sincronize o site da empresa para a IA consultar preços e disponibilidade.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="glass-card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>Itens sincronizados</span>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>{catalog_summary.catalog_synced}</span>
                </div>
                <div className="glass-card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-main)' }}>Produtos cadastrados</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>{catalog_summary.products}</span>
                </div>
              </div>
            )}
          </div>

          {/* INTEGRAÇÕES & DOMÍNIO COMERCIAL */}
          <div className="glass-panel" style={{ padding: 22, borderRadius: 14 }}>
            <div style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} color="var(--accent-purple)" />
                Integrações do Negócio
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Sistemas conectados à operação do Multiplex
              </span>
            </div>

            {!has_commercial_data ? (
              <div className="glass-card" style={{ padding: '14px', textAlign: 'center', color: 'var(--text-dim)' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>Módulo comercial / pedidos</div>
                <div style={{ fontSize: '0.76rem', marginTop: 4 }}>
                  Os dados financeiros e pedidos aparecem automaticamente quando integrados a um ERP, e-commerce ou MT 24 Horas Express.
                </div>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>Vendas / Pedidos Conectados</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>Ativo</span>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
