import React, { useState } from 'react';
import { Sparkles, MessageSquare, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { AIConversationContext } from '../../types/conversation';
import { AIConversationPanel } from './AIConversationPanel';
import atomLogo from '../../assets/multiplex-atom.jpg';

interface ContextualAIChatCardProps {
  apiBase: string;
  context: AIConversationContext;
  title: string;
  subtitle?: string;
  suggestions: string[];
  initialMessage?: string;
  onActionCompleted?: (result: any) => void;
}

export const ContextualAIChatCard: React.FC<ContextualAIChatCardProps> = ({
  apiBase,
  context,
  title,
  subtitle,
  suggestions,
  initialMessage,
  onActionCompleted
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="glass-panel"
      style={{
        padding: isOpen ? '16px 20px' : '14px 18px',
        marginBottom: 20,
        border: '1.5px solid rgba(0, 210, 255, 0.35)',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 15, 30, 0.9) 100%)',
        boxShadow: '0 4px 20px rgba(0, 210, 255, 0.08)',
        borderRadius: 14,
        transition: 'all 0.2s ease'
      }}
    >
      {/* Cabeçalho do Card Contextual */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '1.5px solid rgba(0, 210, 255, 0.5)',
            flexShrink: 0
          }}>
            <img src={atomLogo} alt="IA" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.96rem', color: '#f8fafc' }}>
                {title}
              </span>
              <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(0, 210, 255, 0.15)', color: '#00d2ff', padding: '2px 6px' }}>
                IA Contextual
              </span>
            </div>
            {subtitle && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginTop: 2 }}>
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {isOpen ? (
            <>
              <ChevronUp size={14} />
              <span>Ocultar Chat</span>
            </>
          ) : (
            <>
              <MessageSquare size={14} color="var(--accent-cyan)" />
              <span>Conversar com a IA</span>
            </>
          )}
        </button>
      </div>

      {/* Sugestões Rápidas quando Fechado */}
      {!isOpen && suggestions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {suggestions.slice(0, 3).map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 16,
                fontSize: '0.76rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <Sparkles size={11} color="var(--accent-cyan)" />
              <span>"{s}"</span>
            </button>
          ))}
        </div>
      )}

      {/* Painel de Conversação Aberto */}
      {isOpen && (
        <div style={{ marginTop: 16 }}>
          <AIConversationPanel
            apiBase={apiBase}
            context={context}
            initialMessage={initialMessage || `Olá! Estou aqui com o contexto desta tela carregado. O que você gostaria de ajustar ou consultar?`}
            suggestions={suggestions}
            height="460px"
            onActionCompleted={onActionCompleted}
          />
        </div>
      )}
    </div>
  );
};
