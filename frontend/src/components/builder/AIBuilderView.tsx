import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Send, RefreshCw, Layout, ArrowRight, Check, X, 
  Trash2, History, ExternalLink, AlertTriangle, ShieldCheck, 
  DollarSign, Users, ShoppingBag, BarChart3, Plus, ChevronRight, Layers, Eye
} from 'lucide-react';
import { AIBuilderModule, AIBuildPlan } from '../../types/builder';
import { DynamicRenderer } from './DynamicRenderer';
import { AIEditModuleModal } from './AIEditModuleModal';

interface AIBuilderViewProps {
  onOpenModule: (module: AIBuilderModule) => void;
  apiBase: string;
}

export const AIBuilderView: React.FC<AIBuilderViewProps> = ({ onOpenModule, apiBase }) => {
  const [prompt, setPrompt] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [creating, setCreating] = useState(false);
  const [plan, setPlan] = useState<AIBuildPlan | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [previewTab, setPreviewTab] = useState<'visual' | 'plan'>('visual');
  const [modules, setModules] = useState<AIBuilderModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modais
  const [editingModule, setEditingModule] = useState<AIBuilderModule | null>(null);
  const [deleteConfirmModule, setDeleteConfirmModule] = useState<AIBuilderModule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sugestões Prontas de Alta Conversão
  const promptSuggestions = [
    {
      title: '💰 Gestão Financeira Completa',
      desc: 'Faturamento, despesas, lucro líquido, pedidos pagos e gráficos de evolução mensal.',
      prompt: 'Crie uma área financeira com faturamento, despesas, lucro líquido, pedidos pagos, gráficos de desempenho e extrato.'
    },
    {
      title: '👥 Clientes & Relacionamento',
      desc: 'Base de clientes cadastrados, pedidos totais, valor acumulado (LTV) e busca rápida.',
      prompt: 'Crie uma área para clientes cadastrados com total de clientes, novos clientes, tabela de clientes com telefone, email e total gasto.'
    },
    {
      title: '📦 Pedidos Pagos & Vendas',
      desc: 'Visão de pedidos confirmados, ticket médio, método de pagamento (PIX/Cartão) e entregas.',
      prompt: 'Crie um dashboard com todos os pedidos pagos, faturamento, ticket médio e lista detalhada de pedidos concluídos.'
    },
    {
      title: '📊 Desempenho de Produtos',
      desc: 'Cardápio, estoque e métricas de itens cadastrados no catálogo do estabelecimento.',
      prompt: 'Crie um dashboard mostrando meus produtos cadastrados, preços médios e distribuição por categorias.'
    }
  ];

  const loadModules = async () => {
    setLoadingModules(true);
    try {
      const res = await fetch(`${apiBase}/api/builder/modules`);
      if (res.ok) {
        const json = await res.json();
        setModules(json.modules || []);
      }
    } catch (e) {
      console.error('Erro ao listar módulos do AI Builder:', e);
    } finally {
      setLoadingModules(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const handleGeneratePlan = async (customPrompt?: string) => {
    const text = (customPrompt || prompt).trim();
    if (!text) return;

    setLoadingPlan(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch(`${apiBase}/api/builder/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      });

      if (!res.ok) throw new Error('Falha ao interpretar a solicitação de IA.');

      const json = await res.json();
      setPlan(json.plan);

      // Busca dados reais para a pré-visualização interativa
      if (json.plan?.suggested_schema) {
        const queryRes = await fetch(`${apiBase}/api/builder/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schema: json.plan.suggested_schema,
            period: 'month'
          })
        });

        if (queryRes.ok) {
          const qData = await queryRes.json();
          setPreviewData(qData.data || {});
        }
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Erro ao comunicar com a inteligência artificial.');
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleConfirmCreate = async () => {
    if (!plan || !plan.suggested_schema) return;

    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/builder/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plan.target_module.name,
          slug: plan.target_module.slug,
          description: plan.suggested_schema.description,
          icon: plan.suggested_schema.icon || 'Layout',
          schema: plan.suggested_schema,
          prompt,
          build_plan: plan
        })
      });

      if (!res.ok) throw new Error('Falha ao salvar módulo no banco de dados.');

      const json = await res.json();
      setPlan(null);
      setPrompt('');
      await loadModules();
      onOpenModule(json.module);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Erro ao registrar funcionalidade.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteModule = async () => {
    if (!deleteConfirmModule) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${apiBase}/api/builder/modules/${deleteConfirmModule.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeleteConfirmModule(null);
        await loadModules();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="main-panel-scrollable" style={{ padding: '24px 32px' }}>
      {/* Header Principal da Tela */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#818cf8', fontSize: '0.78rem', fontWeight: 700, marginBottom: 12 }}>
          <Sparkles size={13} />
          <span>AI APP BUILDER • ARQUITETURA CONTROLADA</span>
        </div>
        <h1 className="page-title" style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
          Criar com IA
        </h1>
        <p className="page-desc" style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: 6, maxWidth: 720 }}>
          Descreva o que você precisa em linguagem natural e a IA cria ou modifica funcionalidades diretamente no seu painel com seus dados reais.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 12, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.88rem' }}>
          {error}
        </div>
      )}

      {/* Caixa de Entrada Principal da IA */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: 24, 
          borderRadius: 18, 
          background: 'linear-gradient(180deg, rgba(20, 27, 45, 0.85), rgba(12, 17, 32, 0.95))',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          marginBottom: 36
        }}
      >
        <label style={{ display: 'block', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
          O que você deseja criar?
        </label>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: '0 0 14px 0' }}>
          Você pode pedir áreas financeiras, listas de clientes, dashboards de vendas, filtros personalizados ou alterações em módulos existentes.
        </p>

        <div style={{ position: 'relative' }}>
          <textarea
            rows={3}
            placeholder="Ex: Crie uma área financeira com faturamento, despesas, lucro, pedidos pagos e gráficos de desempenho."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 18px',
              borderRadius: 14,
              background: 'rgba(10, 15, 28, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'var(--text-main)',
              fontSize: '0.95rem',
              lineHeight: 1.5,
              resize: 'vertical'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              🔒 Multi-tenancy ativo • Acesso restrito aos dados da sua empresa
            </span>

            <button
              className="btn-primary"
              onClick={() => handleGeneratePlan()}
              disabled={loadingPlan || !prompt.trim()}
              style={{
                padding: '10px 24px',
                fontSize: '0.92rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
              }}
            >
              {loadingPlan ? (
                <>
                  <RefreshCw size={17} className="spin-slow" />
                  Interpretando com IA...
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Criar com IA
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sugestoes Rápidas em Grid */}
        <div style={{ marginTop: 22 }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-dim)', fontWeight: 700, display: 'block', marginBottom: 10 }}>
            Sugestões Rápidas:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {promptSuggestions.map((s, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setPrompt(s.prompt);
                  handleGeneratePlan(s.prompt);
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                }}
              >
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 3 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PLANO DE EXECUCAO E LIVE PREVIEW */}
      {plan && (
        <div 
          className="glass-panel" 
          style={{ 
            padding: 24, 
            borderRadius: 18, 
            background: 'linear-gradient(180deg, rgba(17, 24, 39, 0.9), rgba(12, 17, 29, 0.95))',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            marginBottom: 36
          }}
        >
          {/* Header do Chat / Plano Conversacional */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: '0.72rem', padding: '3px 8px', borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }}>
                  ✓ PLANO DE EXECUÇÃO GERADO
                </span>
                <span style={{ 
                  fontSize: '0.72rem', 
                  padding: '3px 8px', 
                  borderRadius: 8, 
                  fontWeight: 700,
                  background: plan.risk_level === 'LOW_RISK' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: plan.risk_level === 'LOW_RISK' ? '#10b981' : '#f59e0b',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {plan.risk_level === 'LOW_RISK' ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                  {plan.risk_level === 'LOW_RISK' ? 'Baixo Risco' : 'Médio Risco'}
                </span>
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                {plan.target_module.name}
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                {plan.summary}
              </p>
            </div>

            {/* Botoes de Acao de Confirmacao */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className="btn-secondary"
                onClick={() => setPlan(null)}
                disabled={creating}
                style={{ padding: '9px 16px', fontSize: '0.85rem' }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleConfirmCreate}
                disabled={creating}
                style={{
                  padding: '9px 22px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                {creating ? <RefreshCw size={16} className="spin-slow" /> : <Check size={17} />}
                Criar Funcionalidade
              </button>
            </div>
          </div>

          {/* Resumo dos Componentes & Data Sources */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {plan.components_summary.map((c, i) => (
              <span key={i} style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: 8, background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)' }}>
                ✓ {c}
              </span>
            ))}
            <span style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: 8, background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', fontWeight: 600 }}>
              Fontes: {plan.data_sources.join(', ')}
            </span>
          </div>

          {/* Tabs de Preview */}
          <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: 16, display: 'flex', gap: 16 }}>
            <button
              onClick={() => setPreviewTab('visual')}
              style={{
                padding: '8px 4px',
                border: 'none',
                background: 'transparent',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                color: previewTab === 'visual' ? '#10b981' : 'var(--text-dim)',
                borderBottom: `2px solid ${previewTab === 'visual' ? '#10b981' : 'transparent'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Eye size={15} /> Pré-visualização Interativa
            </button>
            <button
              onClick={() => setPreviewTab('plan')}
              style={{
                padding: '8px 4px',
                border: 'none',
                background: 'transparent',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                color: previewTab === 'plan' ? '#10b981' : 'var(--text-dim)',
                borderBottom: `2px solid ${previewTab === 'plan' ? '#10b981' : 'transparent'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Layers size={15} /> Schema JSON Declarativo
            </button>
          </div>

          {previewTab === 'visual' && plan.suggested_schema && (
            <div style={{ padding: 16, borderRadius: 14, background: 'rgba(10, 15, 28, 0.7)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <DynamicRenderer schema={plan.suggested_schema} data={previewData} />
            </div>
          )}

          {previewTab === 'plan' && plan.suggested_schema && (
            <pre style={{ 
              padding: 16, 
              borderRadius: 14, 
              background: 'rgba(10, 15, 28, 0.95)', 
              color: '#818cf8', 
              fontSize: '0.8rem', 
              overflowX: 'auto',
              maxHeight: 320
            }}>
              {JSON.stringify(plan.suggested_schema, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* SEÇÃO 5 DO REQUISITO: HISTÓRICO DE FUNCIONALIDADES */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Funcionalidades criadas ({modules.length})
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: '2px 0 0 0' }}>
              Módulos construídos pela inteligência artificial integrados ao seu painel.
            </p>
          </div>

          <button 
            className="btn-secondary" 
            onClick={loadModules} 
            disabled={loadingModules}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={13} className={loadingModules ? 'spin-slow' : ''} /> Atualizar Lista
          </button>
        </div>

        {modules.length === 0 ? (
          <div 
            className="glass-panel" 
            style={{ 
              padding: '48px 20px', 
              textAlign: 'center', 
              borderRadius: 16,
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px dashed rgba(255, 255, 255, 0.1)'
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#818cf8' }}>
              <Sparkles size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-main)' }}>
              Nenhuma funcionalidade criada ainda
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
              Utilize o campo acima ou clique em uma das sugestões para criar sua primeira área personalizada com inteligência artificial.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {modules.map(mod => {
              const compCount = mod.schema?.sections?.reduce((acc, s) => acc + (s.components?.length || 0), 0) || 0;
              const hasCharts = mod.schema?.sections?.some(s => s.components?.some(c => c.type === 'chart'));
              const hasTable = mod.schema?.sections?.some(s => s.components?.some(c => c.type === 'table'));

              return (
                <div
                  key={mod.id}
                  className="glass-card"
                  style={{
                    padding: 20,
                    borderRadius: 16,
                    background: 'linear-gradient(145deg, rgba(20, 27, 45, 0.7), rgba(12, 17, 32, 0.85))',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                    position: 'relative'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                          <Layout size={20} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                            {mod.name}
                          </h3>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            /{mod.slug}
                          </span>
                        </div>
                      </div>

                      <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: 8, background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 700 }}>
                        v{mod.version}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                      {mod.description}
                    </p>

                    {/* Resumo de componentes em bullets */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: 6, background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)' }}>
                        • {compCount} Componentes
                      </span>
                      {hasCharts && (
                        <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                          • Gráficos
                        </span>
                      )}
                      {hasTable && (
                        <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: 6, background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
                          • Tabela Real
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Criado em: {new Date(mod.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>

                  {/* Botoes de Acao do Card */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn-primary"
                        onClick={() => onOpenModule(mod)}
                        style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        Abrir <ArrowRight size={14} />
                      </button>

                      <button
                        className="btn-secondary"
                        onClick={() => setEditingModule(mod)}
                        style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Sparkles size={13} color="#818cf8" /> Editar com IA
                      </button>
                    </div>

                    <button
                      onClick={() => setDeleteConfirmModule(mod)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 6, borderRadius: 6 }}
                      title="Excluir módulo"
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-dim)'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE EDICAO CONTEXTUAL */}
      {editingModule && (
        <AIEditModuleModal
          module={editingModule}
          onClose={() => setEditingModule(null)}
          onUpdated={async () => {
            setEditingModule(null);
            await loadModules();
          }}
          apiBase={apiBase}
        />
      )}

      {/* MODAL DE EXCLUSAO SEGURA (SECTION 34) */}
      {deleteConfirmModule && (
        <div className="modal-backdrop" onClick={() => setDeleteConfirmModule(null)} style={{ zIndex: 9999 }}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: 480, width: '90%', padding: 24, borderRadius: 16 }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', marginBottom: 14 }}>
              <Trash2 size={22} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px 0' }}>
              Remover "{deleteConfirmModule.name}"?
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              Essa ação removerá a área <strong>{deleteConfirmModule.name}</strong> do seu painel. <br />
              <span style={{ color: '#10b981', fontWeight: 600 }}>Os dados financeiros, pedidos e clientes do seu negócio NÃO serão apagados.</span>
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn-secondary"
                onClick={() => setDeleteConfirmModule(null)}
                disabled={isDeleting}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleDeleteModule}
                disabled={isDeleting}
                style={{ padding: '8px 18px', fontSize: '0.85rem', background: '#ef4444', fontWeight: 700 }}
              >
                {isDeleting ? <RefreshCw size={15} className="spin-slow" /> : 'Remover Área'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
