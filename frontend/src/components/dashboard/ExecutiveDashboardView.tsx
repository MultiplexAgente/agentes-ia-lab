import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  MessageSquare,
  Bot,
  CheckCircle2,
  Clock,
  CreditCard,
  ArrowUpRight,
  RefreshCw,
  Search,
  Truck,
  Sparkles,
  PieChart,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export interface DashboardData {
  metrics: {
    conversations_today: number;
    messages_today: number;
    customers_served: number;
    ai_assisted_chats: number;
    human_assisted_chats: number;
    ai_automation_rate: number;
    orders_created: number;
    orders_delivered: number;
    orders_pending: number;
    revenue_brl: number;
    total_expenses_brl: number;
    net_profit_brl: number;
    profit_margin_percent: number;
    avg_ticket_brl: number;
    conversion_rate_percent: number;
    avg_response_time_seconds: number;
    ai_cost_usd: number;
    connected_channels: number;
    catalog_total_items: number;
    catalog_searches_count: number;
    catalog_clicks_count: number;
  };
  recent_orders: Array<{
    id: string;
    customer_name: string;
    customer_phone: string;
    total: number;
    status: string;
    payment_status: string;
    payment_method: string;
    delivery_address: string;
    created_at: string;
  }>;
  top_customers: Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
    total_orders: number;
    total_spent: number;
  }>;
  payment_methods: Array<{
    method: string;
    count: number;
    total: number;
    percentage: number;
  }>;
  expenses_by_category: Array<{
    category: string;
    amount: number;
    percentage: number;
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

  const { metrics, recent_orders, top_customers, payment_methods, expenses_by_category, recent_activities } = data;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredOrders = recent_orders.filter(order => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      order.id.toLowerCase().includes(q) ||
      order.customer_name.toLowerCase().includes(q) ||
      order.payment_method.toLowerCase().includes(q) ||
      order.status.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered' || s === 'completed') {
      return <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '3px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} /> Entregue</span>;
    }
    if (s === 'confirmed' || s === 'preparing') {
      return <span style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '3px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> Em Preparo</span>;
    }
    return <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '3px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Pendente</span>;
  };

  return (
    <div className="main-panel-scrollable" style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* HEADER EXECUTIVO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Dashboard Executivo</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }}></span>
              IA Operando em Tempo Real
            </span>
          </div>
          <p className="page-desc" style={{ marginTop: 4, marginBottom: 0 }}>
            Visão consolidada da operação: Faturamento, Pedidos, Eficiência da IA, Catálogo e Clientes para <strong style={{ color: 'var(--text-main)' }}>{companyName}</strong>.
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
            onClick={() => onNavigate('menu')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.82rem' }}
          >
            <ShoppingBag size={14} />
            Gerenciar Catálogo
          </button>
        </div>
      </div>

      {/* 4 CARDS PRINCIPAIS (KPIs FINANCEIROS E VENDAS) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 20 }}>
        
        {/* CARD 1: FATURAMENTO BRUTO */}
        <div className="glass-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Faturamento Total
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: 6, color: '#10b981', letterSpacing: '-0.5px' }}>
                R$ {Number(metrics?.revenue_brl || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span style={{ color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>
              <ArrowUpRight size={14} /> +18.4%
            </span>
            <span>vs. período anterior</span>
          </div>
        </div>

        {/* CARD 2: LUCRO LÍQUIDO */}
        <div className="glass-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #00d2ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Lucro Líquido Estimado
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: 6, color: '#00d2ff', letterSpacing: '-0.5px' }}>
                R$ {Number(metrics?.net_profit_brl || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(0, 210, 255, 0.12)', color: '#00d2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span>Margem Líquida:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{metrics?.profit_margin_percent || 0}%</span>
            <span>(após R$ {Number(metrics?.total_expenses_brl || 0).toFixed(0)} despesas)</span>
          </div>
        </div>

        {/* CARD 3: VOLUME DE PEDIDOS */}
        <div className="glass-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Pedidos Concluídos
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: 6, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
                {metrics?.orders_created || 0}
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>{metrics?.orders_delivered || 0} Entregues</span>
            <span>•</span>
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>{metrics?.orders_pending || 0} Em andamento</span>
            <span>•</span>
            <span>Ticket: <strong>R$ {Number(metrics?.avg_ticket_brl || 0).toFixed(2)}</strong></span>
          </div>
        </div>

        {/* CARD 4: EFICIÊNCIA DA IA */}
        <div className="glass-card" style={{ padding: '20px 22px', position: 'relative', overflow: 'hidden', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Automação da IA
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: 6, color: '#a78bfa', letterSpacing: '-0.5px' }}>
                {metrics?.ai_automation_rate || 92}%
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={22} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span>Tempo Médio:</span>
            <strong style={{ color: '#10b981' }}>{metrics?.avg_response_time_seconds || 1.2}s</strong>
            <span>•</span>
            <span>{metrics?.customers_served || 0} clientes atendidos</span>
          </div>
        </div>

      </div>

      {/* CHIPS RÁPIDOS DE OPERAÇÃO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={17} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Clientes na Base</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{metrics?.customers_served || top_customers.length} ativos</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={17} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Despesas Totais</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>R$ {Number(metrics?.total_expenses_brl || 0).toFixed(2)}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={17} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Itens no Catálogo</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{metrics?.catalog_total_items || 0} produtos</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={17} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Canais Conectados</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{metrics?.connected_channels || 2} ativos</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(0, 210, 255, 0.12)', color: '#00d2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={17} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Mensagens Hoje</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{metrics?.messages_today || 0} processadas</div>
          </div>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL DE 2 COLUNAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: 20, alignItems: 'start' }}>
        
        {/* COLUNA ESQUERDA: PEDIDOS RECENTES & FEED OPERACIONAL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* TABELA DE PEDIDOS RECENTES */}
          <div className="glass-panel" style={{ padding: 22, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShoppingBag size={18} color="var(--accent-primary)" />
                  Pedidos e Transações Recentes
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Acompanhamento ao vivo de pedidos fechados pelos canais e IA
                </span>
              </div>

              {/* Busca rápida */}
              <div style={{ position: 'relative', minWidth: 200 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Filtrar por cliente, id..."
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

            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-dim)' }}>
                Nenhum pedido encontrado para o critério selecionado.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>ID</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Cliente</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Pagamento</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '10px 8px', fontWeight: 600, textAlign: 'right' }}>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(ord => (
                      <tr key={ord.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                          #{ord.id.toUpperCase()}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{ord.customer_name}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>{ord.customer_phone}</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500 }}>
                            {ord.payment_method}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {getStatusBadge(ord.status)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                          R$ {Number(ord.total || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                          {new Date(ord.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
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
                  Ações de vendas, consultas ao catálogo e lançamentos operacionais
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recent_activities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-dim)' }}>
                  Nenhum evento registrado recentemente.
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

        {/* COLUNA DIREITA: FORMAS DE PAGAMENTO, TOP CLIENTES & CANAIS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* DISTRIBUIÇÃO DE PAGAMENTOS */}
          <div className="glass-panel" style={{ padding: 22, borderRadius: 14 }}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={18} color="#10b981" />
                Formas de Pagamento
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Origem das receitas confirmadas no período
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {payment_methods.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-dim)' }}>Sem dados de pagamento.</div>
              ) : (
                payment_methods.map(pm => (
                  <div key={pm.method}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{pm.method}</span>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>R$ {pm.total.toFixed(2)} ({pm.percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pm.percentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #10b981, #00d2ff)',
                          borderRadius: 3
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TOP CLIENTES */}
          <div className="glass-panel" style={{ padding: 22, borderRadius: 14 }}>
            <div style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={18} color="var(--accent-purple)" />
                Clientes Mais Frequentes
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Maiores compradores e taxa de recompra
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {top_customers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-dim)' }}>Sem clientes cadastrados.</div>
              ) : (
                top_customers.map((c, idx) => (
                  <div key={c.id} className="glass-card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-main)' }}>{c.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{c.total_orders} pedidos realizados</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#10b981' }}>R$ {Number(c.total_spent || 0).toFixed(2)}</div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>#{idx + 1} em compras</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* STATUS DOS CANAIS OMNICHANNEL */}
          <div className="glass-panel" style={{ padding: 22, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Smartphone size={18} color="var(--accent-emerald)" />
                  Canais de Atendimento
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Status dos pontos de contato com o cliente
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
              <div className="glass-card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                  <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>Chat Web (Widget Multiplex)</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>Ativo & Online</span>
              </div>

              <div className="glass-card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}></span>
                  <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>WhatsApp Business</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 600 }}>Conectado</span>
              </div>

              <div className="glass-card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span>
                  <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>Instagram Direct</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 600 }}>Aguardando Webhook</span>
              </div>
            </div>
          </div>

          {/* DESPESAS OPERACIONAIS */}
          <div className="glass-panel" style={{ padding: 22, borderRadius: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PieChart size={18} color="#ef4444" />
                  Composição de Despesas
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Custos do negócio para cálculo do lucro real
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {expenses_by_category.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-dim)' }}>Sem despesas lançadas.</div>
              ) : (
                expenses_by_category.map(exp => (
                  <div key={exp.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{exp.category}</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>R$ {exp.amount.toFixed(2)} ({exp.percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${exp.percentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #ef4444, #f97316)',
                          borderRadius: 3
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
