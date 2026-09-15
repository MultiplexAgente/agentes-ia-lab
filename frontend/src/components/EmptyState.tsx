import React from 'react';
import {
  MessageSquare, Package, Users, ShoppingCart,
  BarChart3, Settings, Sparkles, Bot
} from 'lucide-react';

type EmptyStateContext =
  | 'chat'
  | 'products'
  | 'customers'
  | 'orders'
  | 'dashboard'
  | 'knowledge'
  | 'channels'
  | 'logs'
  | 'catalog'
  | 'generic';

interface EmptyStateProps {
  context?: EmptyStateContext;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const CONTEXT_DEFAULTS: Record<EmptyStateContext, {
  icon: React.ReactNode;
  color: string;
  title: string;
  description: string;
}> = {
  chat: {
    icon: <Bot size={32} />,
    color: '#6366f1',
    title: 'Como posso ajudar você hoje?',
    description: 'Faça uma pergunta, solicite uma ação ou explore os recursos da plataforma.',
  },
  products: {
    icon: <Package size={32} />,
    color: '#f59e0b',
    title: 'Nenhum produto cadastrado',
    description: 'Importe produtos do seu site automaticamente ou adicione manualmente.',
  },
  customers: {
    icon: <Users size={32} />,
    color: '#06b6d4',
    title: 'Nenhum cliente ainda',
    description: 'Os clientes aparecerão aqui automaticamente quando conversarem pelos canais conectados.',
  },
  orders: {
    icon: <ShoppingCart size={32} />,
    color: '#10b981',
    title: 'Nenhum pedido encontrado',
    description: 'Os pedidos criados pela IA ou pelos atendentes aparecerão aqui.',
  },
  dashboard: {
    icon: <BarChart3 size={32} />,
    color: '#8b5cf6',
    title: 'Sem dados para exibir ainda',
    description: 'Conecte um canal de atendimento para começar a receber métricas reais.',
  },
  knowledge: {
    icon: <Sparkles size={32} />,
    color: '#a78bfa',
    title: 'Base de conhecimento vazia',
    description: 'Adicione informações sobre sua empresa, produtos e regras para a IA aprender.',
  },
  channels: {
    icon: <MessageSquare size={32} />,
    color: '#06b6d4',
    title: 'Nenhum canal conectado',
    description: 'Conecte WhatsApp, Instagram ou Telegram para começar a receber mensagens.',
  },
  logs: {
    icon: <Settings size={32} />,
    color: '#64748b',
    title: 'Nenhum log disponível',
    description: 'Os eventos e ações da IA aparecerão aqui quando houver atividade.',
  },
  catalog: {
    icon: <Package size={32} />,
    color: '#f59e0b',
    title: 'Catálogo vazio',
    description: 'Sincronize seu site ou adicione itens manualmente para o catálogo.',
  },
  generic: {
    icon: <Sparkles size={32} />,
    color: '#6366f1',
    title: 'Nada aqui ainda',
    description: 'Não há itens para exibir no momento.',
  },
};

export function EmptyState({
  context = 'generic',
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  const defaults = CONTEXT_DEFAULTS[context];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        gap: 16,
        minHeight: 280,
      }}
    >
      {/* Ícone com glow */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: `${defaults.color}18`,
          border: `1.5px solid ${defaults.color}35`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: defaults.color,
          boxShadow: `0 0 28px ${defaults.color}20`,
          marginBottom: 8,
        }}
      >
        {defaults.icon}
      </div>

      {/* Título */}
      <h3
        style={{
          fontSize: '1.1rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          margin: 0,
          maxWidth: 340,
        }}
      >
        {title || defaults.title}
      </h3>

      {/* Descrição */}
      <p
        style={{
          fontSize: '0.88rem',
          color: 'var(--text-muted)',
          margin: 0,
          maxWidth: 380,
          lineHeight: 1.55,
        }}
      >
        {description || defaults.description}
      </p>

      {/* Ações */}
      {(action || secondaryAction) && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
          {action && (
            <button
              onClick={action.onClick}
              style={{
                padding: '9px 20px',
                borderRadius: 10,
                background: `linear-gradient(135deg, ${defaults.color}, ${defaults.color}cc)`,
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              style={{
                padding: '9px 20px',
                borderRadius: 10,
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                fontWeight: 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
