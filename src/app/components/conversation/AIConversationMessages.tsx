import React from 'react';
import { 
  Check, X, ThumbsUp, ThumbsDown, Sparkles, Layers,
  ChevronRight, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, Eye
} from 'lucide-react';
import { AIConversationMessage, AIConversationSuggestedOption } from '../../types/conversation';
import atomLogo from '../../assets/multiplex-atom.jpg';

interface AIConversationMessagesProps {
  messages: AIConversationMessage[];
  isTyping: boolean;
  onSelectOption: (option: AIConversationSuggestedOption) => void;
  onApprovePlan: (plan: any) => void;
  onRejectPlan?: () => void;
  onFeedback?: (messageId: string, type: 'thumbs_up' | 'thumbs_down') => void;
  isExecutingPlan?: boolean;
}

export const AIConversationMessages: React.FC<AIConversationMessagesProps> = ({
  messages,
  isTyping,
  onSelectOption,
  onApprovePlan,
  onRejectPlan,
  onFeedback,
  isExecutingPlan = false
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {messages.map((msg) => {
        const isAI = msg.role === 'assistant';

        return (
          <div 
            key={msg.id}
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              alignSelf: isAI ? 'flex-start' : 'flex-end',
              maxWidth: isAI ? '92%' : '80%'
            }}
          >
            {isAI && (
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '1.5px solid rgba(0, 210, 255, 0.4)',
                flexShrink: 0,
                marginTop: 2,
                boxShadow: '0 0 12px rgba(0, 210, 255, 0.2)'
              }}>
                <img src={atomLogo} alt="IA Multiplex" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              {/* Balão de Mensagem */}
              <div 
                style={{
                  background: isAI 
                    ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)' 
                    : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  padding: isAI ? '14px 18px' : '12px 16px',
                  borderRadius: isAI ? '4px 18px 18px 18px' : '18px 18px 4px 18px',
                  border: isAI ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                  fontSize: '0.92rem',
                  lineHeight: '1.55',
                  boxShadow: isAI 
                    ? '0 4px 20px rgba(0, 0, 0, 0.25)' 
                    : '0 4px 14px rgba(99, 102, 241, 0.3)',
                  whiteSpace: 'pre-line'
                }}
              >
                {msg.content}
              </div>

              {/* CARD DE PLANO DE EXECUÇÃO PROPOSTO PELA IA */}
              {msg.plan && (
                <div 
                  style={{
                    marginTop: 4,
                    padding: 16,
                    borderRadius: 12,
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ padding: 6, borderRadius: 8, background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                        <Sparkles size={16} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
                        Plano de Implementação Proposto
                      </span>
                    </div>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      padding: '2px 8px', 
                      borderRadius: 6, 
                      background: 'rgba(16, 185, 129, 0.15)', 
                      color: '#10b981', 
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      fontWeight: 600
                    }}>
                      Aguardando Sua Aprovação
                    </span>
                  </div>

                  {msg.plan.summary && (
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                      {msg.plan.summary}
                    </p>
                  )}

                  {msg.plan.components_summary && Array.isArray(msg.plan.components_summary) && (
                    <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.5px' }}>
                        Componentes que serão configurados:
                      </span>
                      {msg.plan.components_summary.map((comp: string, cIdx: number) => (
                        <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#e2e8f0' }}>
                          <ChevronRight size={14} color="#00d2ff" />
                          <span>{comp}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Ações de Aprovação */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                    <button
                      className="btn-primary"
                      disabled={isExecutingPlan}
                      onClick={() => onApprovePlan(msg.plan)}
                      style={{
                        padding: '9px 18px',
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none',
                        color: '#fff',
                        cursor: isExecutingPlan ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isExecutingPlan ? (
                        <>
                          <RefreshCw size={15} className="spin-animation" />
                          <span>Executando no Sistema...</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          <span>Aprovar e Executar</span>
                        </>
                      )}
                    </button>

                    {onRejectPlan && (
                      <button
                        className="btn-secondary"
                        disabled={isExecutingPlan}
                        onClick={onRejectPlan}
                        style={{
                          padding: '9px 14px',
                          fontSize: '0.84rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        <X size={15} />
                        <span>Ajustar / Cancelar</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* OPÇÕES RÁPIDAS DE ESCLARECIMENTO (CHIPS) */}
              {isAI && msg.suggested_options && msg.suggested_options.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {msg.suggested_options.map((opt, oIdx) => {
                    const isDanger = opt.variant === 'danger';
                    const isPrimary = opt.variant === 'primary';

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => onSelectOption(opt)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 20,
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          background: isPrimary 
                            ? 'rgba(99, 102, 241, 0.2)' 
                            : isDanger 
                              ? 'rgba(239, 68, 68, 0.15)' 
                              : 'rgba(255, 255, 255, 0.06)',
                          color: isPrimary ? '#818cf8' : isDanger ? '#f87171' : 'var(--text-main)',
                          border: isPrimary 
                            ? '1px solid rgba(99, 102, 241, 0.4)' 
                            : isDanger 
                              ? '1px solid rgba(239, 68, 68, 0.3)' 
                              : '1px solid var(--border-subtle)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <ArrowRight size={13} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* FEEDBACK THUMBS UP/DOWN */}
              {isAI && onFeedback && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start', paddingLeft: 4 }}>
                  <button
                    type="button"
                    title="Esta resposta foi útil"
                    onClick={() => onFeedback(msg.id, 'thumbs_up')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: msg.feedback === 'thumbs_up' ? '#10b981' : 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <ThumbsUp size={14} />
                  </button>
                  <button
                    type="button"
                    title="Esta resposta não foi boa"
                    onClick={() => onFeedback(msg.id, 'thumbs_down')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: msg.feedback === 'thumbs_down' ? '#ef4444' : 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <ThumbsDown size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Indicador de Digitação / Raciocínio da IA */}
      {isTyping && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', alignSelf: 'flex-start' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '1.5px solid rgba(0, 210, 255, 0.4)',
            flexShrink: 0
          }}>
            <img src={atomLogo} alt="IA Multiplex" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div 
            style={{
              padding: '10px 16px',
              borderRadius: '4px 18px 18px 18px',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontSize: '0.82rem',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <RefreshCw size={14} className="spin-animation" style={{ color: 'var(--accent-cyan)' }} />
            <span>Multiplex IA está analisando dados e formulando resposta...</span>
          </div>
        </div>
      )}
    </div>
  );
};
