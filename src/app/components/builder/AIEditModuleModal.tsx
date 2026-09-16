import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Check, Send, RefreshCw, AlertTriangle, ShieldCheck, 
  ArrowRight, User, History
} from 'lucide-react';
import { AIBuilderModule, AIBuildPlan, UISchema } from '../../types/builder';
import { DynamicRenderer } from './DynamicRenderer';
import atomLogo from '../../assets/multiplex-atom.jpg';

interface ChatMessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  plan?: AIBuildPlan;
  previewData?: Record<string, any>;
  isApplying?: boolean;
}

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
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: `Olá! Sou a **Multiplex**, seu construtor inteligente de funcionalidades.\n\nEstou com o contexto completo do módulo **${module.name} (versão v${module.version})** carregado. O que você gostaria de adicionar, remover ou ajustar neste painel agora?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [applyingPlanId, setApplyingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickSuggestions = [
    'Adicione um card mostrando pedidos pagos hoje',
    'Adicione um gráfico de faturamento por mês',
    'Adicione um gráfico donut de métodos de pagamento',
    'Remova o gráfico de despesas',
    'Adicione um filtro por período'
  ];

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputMessage).trim();
    if (!text || isTyping) return;

    setInputMessage('');
    setError(null);

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(`${apiBase}/api/builder/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          currentModuleId: module.id
        })
      });

      if (!res.ok) throw new Error('Falha ao processar a solicitação com a IA.');

      const json = await res.json();
      const plan: AIBuildPlan = json.plan;

      // Busca dados reais para preview
      let previewData: Record<string, any> = {};
      if (plan?.suggested_schema) {
        const queryRes = await fetch(`${apiBase}/api/builder/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schema: plan.suggested_schema,
            period: 'month'
          })
        });
        if (queryRes.ok) {
          const qData = await queryRes.json();
          previewData = qData.data || {};
        }
      }

      const aiReply: ChatMessageItem = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: `Entendido! Analisei sua solicitação e planejei a alteração no módulo **${module.name}**.\n\n${plan.summary}\n\nConfira abaixo a pré-visualização em tempo real de como o módulo ficará na versão **v${module.version + 1}**:`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        plan,
        previewData
      };

      setMessages(prev => [...prev, aiReply]);
    } catch (e: any) {
      console.error(e);
      const errorReply: ChatMessageItem = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: `Desculpe, ocorreu uma instabilidade ao processar sua alteração: ${e.message || 'Tente novamente.'}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleApplyPlan = async (plan: AIBuildPlan, msgId: string) => {
    if (!plan.suggested_schema) return;
    setApplyingPlanId(msgId);
    setError(null);

    try {
      const res = await fetch(`${apiBase}/api/builder/modules/${module.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema: plan.suggested_schema,
          prompt: plan.summary,
          build_plan: plan
        })
      });

      if (!res.ok) throw new Error('Erro ao aplicar atualização no banco de dados.');

      const json = await res.json();
      onUpdated(json.module);
      onClose();
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Erro ao salvar a nova versão.');
    } finally {
      setApplyingPlanId(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: 960, 
          width: '95%', 
          height: '88vh', 
          display: 'flex',
          flexDirection: 'column',
          padding: 0, 
          borderRadius: 20,
          background: 'var(--bg-card)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* CABEÇALHO DO CHAT (COM ÍCONE OFICIAL DA MULTIPLEX IA) */}
        <div style={{ 
          padding: '16px 24px', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.06), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* ÍCONE DA MULTIPLEX IA APONTADO PELA SETA */}
            <div style={{ 
              width: 42, 
              height: 42, 
              borderRadius: '50%', 
              overflow: 'hidden', 
              border: '2px solid rgba(0, 210, 255, 0.6)', 
              boxShadow: '0 0 16px rgba(0, 210, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#07090e',
              flexShrink: 0
            }}>
              <img src={atomLogo} alt="Multiplex" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Chat Multiplex: {module.name}
                </h3>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 8, background: 'rgba(99, 102, 241, 0.25)', color: '#818cf8', fontWeight: 800 }}>
                  v{module.version}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Assistente conversacional para criação e modificação de ferramentas em tempo real
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 6, borderRadius: 8 }}
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ margin: '10px 24px 0', padding: '10px 16px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* FEED DE MENSAGENS CONVERSACIONAL (CHAT NORMAL DE IA) */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '20px 24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 20 
        }}>
          {messages.map((m) => {
            const isAI = m.sender === 'assistant';

            return (
              <div 
                key={m.id} 
                style={{ 
                  display: 'flex', 
                  gap: 12, 
                  alignItems: 'flex-start',
                  justifyContent: isAI ? 'flex-start' : 'flex-end',
                  width: '100%'
                }}
              >
                {/* Avatar da Multiplex */}
                {isAI && (
                  <div style={{ 
                    width: 34, 
                    height: 34, 
                    borderRadius: '50%', 
                    overflow: 'hidden', 
                    border: '1.5px solid rgba(0, 210, 255, 0.5)', 
                    boxShadow: '0 0 10px rgba(0, 210, 255, 0.3)',
                    flexShrink: 0,
                    marginTop: 2
                  }}>
                    <img src={atomLogo} alt="Multiplex" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                {/* Conteúdo da Mensagem */}
                <div style={{ maxWidth: isAI ? '90%' : '75%', display: 'flex', flexDirection: 'column', alignItems: isAI ? 'flex-start' : 'flex-end' }}>
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: 16,
                    borderBottomLeftRadius: isAI ? 4 : 16,
                    borderBottomRightRadius: !isAI ? 4 : 16,
                    background: isAI ? 'var(--bg-card-inner)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    color: isAI ? 'var(--text-main)' : '#ffffff',
                    border: isAI ? '1px solid var(--border-subtle)' : 'none',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                  }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {m.text}
                    </div>

                    {/* PRÉ-VISUALIZAÇÃO INTERATIVA DENTRO DA RESPOSTA DA IA */}
                    {m.plan && m.plan.suggested_schema && (
                      <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent-cyan)' }}>
                            Pré-visualização da Nova Versão (v{module.version + 1})
                          </span>

                          <span style={{ 
                            fontSize: '0.72rem', 
                            padding: '3px 8px', 
                            borderRadius: 8, 
                            fontWeight: 700,
                            background: m.plan.risk_level === 'LOW_RISK' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: m.plan.risk_level === 'LOW_RISK' ? '#10b981' : '#f59e0b',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}>
                            {m.plan.risk_level === 'LOW_RISK' ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                            {m.plan.risk_level === 'LOW_RISK' ? 'Baixo Risco' : 'Médio Risco'}
                          </span>
                        </div>

                        {/* Preview Box */}
                        <div style={{ 
                          maxHeight: 320, 
                          overflowY: 'auto', 
                          padding: 12, 
                          borderRadius: 12, 
                          background: 'rgba(10, 15, 28, 0.85)', 
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          marginBottom: 14
                        }}>
                          <DynamicRenderer schema={m.plan.suggested_schema} data={m.previewData || {}} />
                        </div>

                        {/* Botão de Confirmação com Ícone da Multiplex */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                          <button
                            className="btn-primary"
                            onClick={() => handleApplyPlan(m.plan!, m.id)}
                            disabled={applyingPlanId === m.id}
                            style={{
                              padding: '8px 20px',
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              background: 'linear-gradient(135deg, #10b981, #059669)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                            }}
                          >
                            {applyingPlanId === m.id ? (
                              <RefreshCw size={15} className="spin-slow" />
                            ) : (
                              <div style={{ width: 18, height: 18, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <img src={atomLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            )}
                            <span>Aplicar e Salvar Nova Versão (v{module.version + 1})</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 4, padding: '0 4px' }}>
                    {m.timestamp}
                  </span>
                </div>

                {/* Avatar do Usuário */}
                {!isAI && (
                  <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    background: 'var(--bg-card-inner)', 
                    border: '1px solid var(--border-subtle)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: 'var(--text-main)',
                    flexShrink: 0,
                    marginTop: 2
                  }}>
                    AN
                  </div>
                )}
              </div>
            );
          })}

          {/* Indicador de Digitação da IA */}
          {isTyping && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(0, 210, 255, 0.5)' }}>
                <img src={atomLogo} alt="Multiplex" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ 
                padding: '10px 16px', 
                borderRadius: 16, 
                background: 'var(--bg-card-inner)', 
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <RefreshCw size={14} className="spin-slow" />
                <span>Multiplex analisando o módulo e construindo a pré-visualização...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* SUGESTÕES RÁPIDAS (CHIPS) */}
        <div style={{ padding: '0 24px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {quickSuggestions.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(qp)}
              disabled={isTyping}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '4px 10px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                e.currentTarget.style.color = '#818cf8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              + {qp}
            </button>
          ))}
        </div>

        {/* BARRA DE ENTRADA DO CHAT (COM O ÍCONE DA MULTIPLEX IA NO BOTÃO) */}
        <div style={{ 
          padding: '14px 24px 18px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'var(--bg-card)'
        }}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{ display: 'flex', gap: 10, alignItems: 'center' }}
          >
            <input
              type="text"
              placeholder="Digite em linguagem natural o que deseja alterar neste módulo..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isTyping}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 12,
                fontSize: '0.92rem',
                background: 'var(--bg-input)',
                border: '1.5px solid var(--border-subtle)',
                color: 'var(--text-main)',
                outline: 'none'
              }}
              autoFocus
            />

            {/* BOTÃO GERAR ALTERAÇÃO COM ÍCONE DA MULTIPLEX IA APONTADO PELA SETA */}
            <button
              type="submit"
              className="btn-primary"
              disabled={isTyping || !inputMessage.trim()}
              style={{
                padding: '12px 22px',
                borderRadius: 12,
                fontSize: '0.9rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                cursor: isTyping || !inputMessage.trim() ? 'not-allowed' : 'pointer',
                opacity: isTyping || !inputMessage.trim() ? 0.6 : 1
              }}
            >
              {isTyping ? (
                <RefreshCw size={17} className="spin-slow" />
              ) : (
                <div style={{ 
                  width: 22, 
                  height: 22, 
                  borderRadius: '50%', 
                  overflow: 'hidden', 
                  border: '1px solid rgba(0, 210, 255, 0.6)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: '#07090e',
                  flexShrink: 0 
                }}>
                  <img src={atomLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <span>Gerar Alteração</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
