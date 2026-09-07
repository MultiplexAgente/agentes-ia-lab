import React, { useState } from 'react';
import { Sparkles, X, Check, ArrowRight, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { AIBuilderModule, AIBuildPlan, UISchema } from '../../types/builder';
import { DynamicRenderer } from './DynamicRenderer';

interface AIEditModuleModalProps {
  module: AIBuilderModule;
  onClose: () => void;
  onUpdated: (updatedModule: AIBuilderModule) => void;
  apiBase: string;
}

export const AIEditModuleModal: React.FC<AIEditModuleModalProps> = ({
  module,
  onClose,
  onUpdated,
  apiBase
}) => {
  const [prompt, setPrompt] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [applying, setApplying] = useState(false);
  const [plan, setPlan] = useState<AIBuildPlan | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  const quickPrompts = [
    'Adicione um card mostrando pedidos pagos hoje',
    'Adicione um gráfico de faturamento por mês',
    'Adicione um gráfico donut de métodos de pagamento',
    'Remova o gráfico de despesas',
    'Adicione um filtro por período'
  ];

  const handleGeneratePatch = async (customPrompt?: string) => {
    const text = (customPrompt || prompt).trim();
    if (!text) return;

    setLoadingPlan(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/builder/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          currentModuleId: module.id
        })
      });

      if (!res.ok) throw new Error('Falha ao processar solicitação de alteração.');

      const json = await res.json();
      setPlan(json.plan);

      // Carrega dados mockados / reais para a preview do schema alterado
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
      setError(e.message || 'Ocorreu um erro ao interpretar a solicitação.');
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleApplyPatch = async () => {
    if (!plan?.suggested_schema) return;
    setApplying(true);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/api/builder/modules/${module.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema: plan.suggested_schema,
          prompt,
          build_plan: plan
        })
      });

      if (!res.ok) throw new Error('Erro ao aplicar atualização no módulo.');

      const json = await res.json();
      onUpdated(json.module);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Falha ao salvar as alterações no banco de dados.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: 950, 
          width: '95%', 
          maxHeight: '90vh', 
          overflowY: 'auto', 
          padding: 0, 
          borderRadius: 16,
          background: 'var(--bg-card)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Cabecalho */}
        <div style={{ 
          padding: '18px 24px', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.1), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Editar com IA: {module.name}
                </h3>
                <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: 10, background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 700 }}>
                  v{module.version}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Descreva o que deseja adicionar, remover ou ajustar neste módulo.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Campo de prompt */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>
              O que você deseja modificar?
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                placeholder="Ex: Adicione um gráfico de faturamento por método de pagamento..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGeneratePatch()}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 10,
                  fontSize: '0.9rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'var(--text-main)'
                }}
              />
              <button 
                className="btn-primary" 
                onClick={() => handleGeneratePatch()} 
                disabled={loadingPlan || !prompt.trim()}
                style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}
              >
                {loadingPlan ? <RefreshCw size={16} className="spin-slow" /> : <Sparkles size={16} />}
                Gerar Alteração
              </button>
            </div>

            {/* Chips de sugestoes */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(qp);
                    handleGeneratePatch(qp);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  + {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Plano e Preview */}
          {plan && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(15, 23, 42, 0.5)', padding: 18, borderRadius: 14, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    Plano de Execução da IA
                  </span>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', margin: '4px 0 0 0', fontWeight: 600 }}>
                    {plan.summary}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    padding: '4px 10px', 
                    borderRadius: 12,
                    fontWeight: 700,
                    background: plan.risk_level === 'LOW_RISK' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: plan.risk_level === 'LOW_RISK' ? '#10b981' : '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    {plan.risk_level === 'LOW_RISK' ? <ShieldCheck size={14} /> : <AlertTriangle size={14} />}
                    {plan.risk_level === 'LOW_RISK' ? 'Baixo Risco' : 'Médio Risco'}
                  </span>
                </div>
              </div>

              {/* Lista de mudancas */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {plan.components_summary.map((item, idx) => (
                  <span key={idx} style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 8, background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)' }}>
                    • {item}
                  </span>
                ))}
              </div>

              {/* Visual Preview */}
              {plan.suggested_schema && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Pré-visualização do Módulo Alterado (Nova v{module.version + 1})
                    </span>
                  </div>

                  <div style={{ maxHeight: 350, overflowY: 'auto', padding: 12, borderRadius: 12, background: 'rgba(10, 15, 28, 0.8)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <DynamicRenderer schema={plan.suggested_schema} data={previewData} />
                  </div>
                </div>
              )}

              {/* Botoes de Acao */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
                <button 
                  className="btn-secondary" 
                  onClick={() => setPlan(null)}
                  disabled={applying}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Descartar
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleApplyPatch}
                  disabled={applying}
                  style={{ 
                    padding: '8px 20px', 
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {applying ? <RefreshCw size={15} className="spin-slow" /> : <Check size={16} />}
                  Aplicar e Salvar Nova Versão (v{module.version + 1})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
