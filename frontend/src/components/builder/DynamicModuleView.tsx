import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, RefreshCw, Calendar, History, ArrowLeft, 
  DollarSign, Check, AlertTriangle, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { AIBuilderModule, AIBuilderModuleVersion } from '../../types/builder';
import { DynamicRenderer } from './DynamicRenderer';
import { AIEditModuleModal } from './AIEditModuleModal';

interface DynamicModuleViewProps {
  module: AIBuilderModule;
  onBack: () => void;
  onModuleUpdated: (updatedModule: AIBuilderModule) => void;
  apiBase: string;
}

export const DynamicModuleView: React.FC<DynamicModuleViewProps> = ({
  module: initialModule,
  onBack,
  onModuleUpdated,
  apiBase
}) => {
  const [currentModule, setCurrentModule] = useState<AIBuilderModule>(initialModule);
  const [period, setPeriod] = useState<'today' | '7days' | 'month' | 'all'>('month');
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versions, setVersions] = useState<AIBuilderModuleVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [rollbackSuccess, setRollbackSuccess] = useState<string | null>(null);

  useEffect(() => {
    setCurrentModule(initialModule);
  }, [initialModule]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/builder/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema: currentModule.schema,
          period
        })
      });

      if (res.ok) {
        const json = await res.json();
        setData(json.data || {});
      }
    } catch (e) {
      console.error('Erro ao carregar dados do módulo:', e);
    } finally {
      setLoading(false);
    }
  }, [apiBase, currentModule.schema, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    setLoadingVersions(true);
    setRollbackSuccess(null);
    try {
      const res = await fetch(`${apiBase}/api/builder/modules/${currentModule.id}/versions`);
      if (res.ok) {
        const json = await res.json();
        setVersions(json.versions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleRollback = async (targetVer: number) => {
    try {
      const res = await fetch(`${apiBase}/api/builder/modules/${currentModule.id}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersion: targetVer })
      });

      if (res.ok) {
        const json = await res.json();
        setCurrentModule(json.module);
        onModuleUpdated(json.module);
        setRollbackSuccess(`Módulo restaurado com sucesso para a versão v${targetVer}!`);
        setShowHistoryModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="main-panel-scrollable" style={{ padding: '24px 32px' }}>
      {/* Topo / Cabecalho do Modulo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <button 
              onClick={onBack}
              className="btn-secondary" 
              style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <ArrowLeft size={14} /> Voltar
            </button>
            <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: 8, background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 700 }}>
              v{currentModule.version}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Criado com Multiplex IA
            </span>
          </div>

          <h1 className="page-title" style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
            {currentModule.name}
          </h1>
          <p className="page-desc" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {currentModule.description}
          </p>
        </div>

        {/* Barra de Acoes & Filtros */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Seletor de periodo */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.6)', padding: 3, borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button 
              onClick={() => setPeriod('today')}
              style={{ 
                padding: '6px 12px', 
                borderRadius: 7, 
                border: 'none', 
                fontSize: '0.78rem', 
                fontWeight: 600,
                cursor: 'pointer',
                background: period === 'today' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: period === 'today' ? 'var(--text-main)' : 'var(--text-dim)'
              }}
            >
              Hoje
            </button>
            <button 
              onClick={() => setPeriod('7days')}
              style={{ 
                padding: '6px 12px', 
                borderRadius: 7, 
                border: 'none', 
                fontSize: '0.78rem', 
                fontWeight: 600,
                cursor: 'pointer',
                background: period === '7days' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: period === '7days' ? 'var(--text-main)' : 'var(--text-dim)'
              }}
            >
              7 dias
            </button>
            <button 
              onClick={() => setPeriod('month')}
              style={{ 
                padding: '6px 12px', 
                borderRadius: 7, 
                border: 'none', 
                fontSize: '0.78rem', 
                fontWeight: 600,
                cursor: 'pointer',
                background: period === 'month' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                color: period === 'month' ? '#a5b4fc' : 'var(--text-dim)'
              }}
            >
              Mês Atual
            </button>
            <button 
              onClick={() => setPeriod('all')}
              style={{ 
                padding: '6px 12px', 
                borderRadius: 7, 
                border: 'none', 
                fontSize: '0.78rem', 
                fontWeight: 600,
                cursor: 'pointer',
                background: period === 'all' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: period === 'all' ? 'var(--text-main)' : 'var(--text-dim)'
              }}
            >
              Todos
            </button>
          </div>

          <button 
            className="btn-secondary" 
            onClick={loadData} 
            disabled={loading}
            style={{ padding: '8px 12px', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin-slow' : ''} /> Atualizar
          </button>

          <button 
            className="btn-secondary" 
            onClick={handleOpenHistory}
            style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <History size={14} /> Histórico (v{currentModule.version})
          </button>

          {/* BOTAO CONTEXTUAL OBRIGATORIO: EDITAR COM IA */}
          <button 
            className="btn-primary" 
            onClick={() => setShowEditModal(true)}
            style={{ 
              padding: '8px 16px', 
              fontSize: '0.82rem', 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}
          >
            <Sparkles size={15} /> Editar com IA
          </button>
        </div>
      </div>

      {rollbackSuccess && (
        <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} />
          <span>{rollbackSuccess}</span>
        </div>
      )}

      {/* Renderizador de Componentes e Dados Reais */}
      <DynamicRenderer schema={currentModule.schema} data={data} onRefresh={loadData} />

      {/* MODAL DE EDICAO CONTEXTUAL COM IA */}
      {showEditModal && (
        <AIEditModuleModal
          module={currentModule}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setCurrentModule(updated);
            onModuleUpdated(updated);
          }}
          apiBase={apiBase}
        />
      )}

      {/* MODAL DE HISTORICO DE VERSOES E ROLLBACK */}
      {showHistoryModal && (
        <div className="modal-backdrop" onClick={() => setShowHistoryModal(false)} style={{ zIndex: 9999 }}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: 650, width: '95%', padding: 24, borderRadius: 16 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Histórico de Versões</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Acompanhe as versões geradas pela IA e restaure a qualquer momento.
                </p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            {loadingVersions ? (
              <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-dim)' }}>
                <RefreshCw size={24} className="spin-slow" />
                <p style={{ marginTop: 8, fontSize: '0.85rem' }}>Carregando histórico...</p>
              </div>
            ) : versions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-dim)' }}>
                Nenhuma versão anterior registrada.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
                {versions.map(v => (
                  <div 
                    key={v.id} 
                    style={{ 
                      padding: '14px 16px', 
                      borderRadius: 12, 
                      background: v.version === currentModule.version ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${v.version === currentModule.version ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center' 
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: v.version === currentModule.version ? '#818cf8' : 'var(--text-main)' }}>
                          Versão v{v.version}
                        </span>
                        {v.version === currentModule.version && (
                          <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: 6, background: '#10b981', color: '#fff', fontWeight: 700 }}>
                            ATUAL
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', margin: '4px 0 2px 0' }}>
                        "{v.prompt}"
                      </p>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(v.created_at).toLocaleString('pt-BR')} • {v.created_by || 'Anthony Both'}
                      </span>
                    </div>

                    {v.version !== currentModule.version && (
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleRollback(v.version)}
                        style={{ padding: '6px 12px', fontSize: '0.78rem', fontWeight: 600 }}
                      >
                        Restaurar v{v.version}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
