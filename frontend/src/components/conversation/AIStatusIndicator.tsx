import React from 'react';
import { Bot, Search, Loader2, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

type AIStatus = 'idle' | 'thinking' | 'using_tool' | 'executing_action' | 'waiting_confirmation' | 'error' | 'done';

interface AIStatusIndicatorProps {
  status: AIStatus;
  statusText?: string;
  className?: string;
}

const STATUS_CONFIG: Record<AIStatus, { icon: React.ReactNode; color: string; bg: string; border: string; pulse?: boolean }> = {
  idle: {
    icon: <Bot size={14} />,
    color: 'var(--text-dim)',
    bg: 'transparent',
    border: 'transparent',
  },
  thinking: {
    icon: <Loader2 size={14} className="spin-animation" />,
    color: '#818cf8',
    bg: 'rgba(99, 102, 241, 0.1)',
    border: 'rgba(99, 102, 241, 0.25)',
    pulse: true,
  },
  using_tool: {
    icon: <Search size={14} />,
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.25)',
    pulse: true,
  },
  executing_action: {
    icon: <Zap size={14} />,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.25)',
    pulse: true,
  },
  waiting_confirmation: {
    icon: <Bot size={14} />,
    color: '#a78bfa',
    bg: 'rgba(139, 92, 246, 0.1)',
    border: 'rgba(139, 92, 246, 0.3)',
    pulse: false,
  },
  error: {
    icon: <AlertCircle size={14} />,
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.1)',
    border: 'rgba(244, 63, 94, 0.25)',
    pulse: false,
  },
  done: {
    icon: <CheckCircle2 size={14} />,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
    pulse: false,
  },
};

export function AIStatusIndicator({ status, statusText, className = '' }: AIStatusIndicatorProps) {
  if (status === 'idle') return null;

  const cfg = STATUS_CONFIG[status];

  return (
    <div
      className={`ai-status-indicator ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '5px 12px',
        borderRadius: 20,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontSize: '0.78rem',
        fontWeight: 600,
        transition: 'all 0.2s ease',
        animation: cfg.pulse ? 'ai-status-pulse 1.8s ease-in-out infinite' : undefined,
      }}
    >
      {cfg.icon}
      <span>{statusText || getDefaultText(status)}</span>
      {cfg.pulse && (
        <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: cfg.color,
                animation: `ai-dot-bounce 1.2s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </span>
      )}
    </div>
  );
}

function getDefaultText(status: AIStatus): string {
  switch (status) {
    case 'thinking': return 'Processando';
    case 'using_tool': return 'Consultando dados';
    case 'executing_action': return 'Executando ação';
    case 'waiting_confirmation': return 'Aguardando confirmação';
    case 'error': return 'Erro ao processar';
    case 'done': return 'Concluído';
    default: return '';
  }
}
