import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, MessageSquare, Plus, Check } from 'lucide-react';
import { AIConversation, AIConversationMessage, AIConversationContext, AIConversationSuggestedOption } from '../../types/conversation';
import { aiConversationService } from '../../services/aiConversationService';
import { AIConversationMessages } from './AIConversationMessages';
import { AIConversationInput } from './AIConversationInput';

interface AIConversationPanelProps {
  apiBase: string;
  context?: AIConversationContext;
  initialMessage?: string;
  suggestions?: string[];
  placeholder?: string;
  onActionCompleted?: (result: any) => void;
  height?: string;
}

export const AIConversationPanel: React.FC<AIConversationPanelProps> = ({
  apiBase,
  context = {},
  initialMessage = 'Olá! Sou a **Multiplex**, sua assistente inteligente. Como posso ajudar você no sistema hoje?',
  suggestions = [],
  placeholder = 'Converse com a IA do Multiplex...',
  onActionCompleted,
  height = '580px'
}) => {
  const [conversation, setConversation] = useState<AIConversation | null>(null);
  const [messages, setMessages] = useState<AIConversationMessage[]>([
    {
      id: 'msg-init',
      conversation_id: 'init',
      company_id: '11111111-1111-1111-1111-111111111111',
      user_id: 'admin-user',
      role: 'assistant',
      content: initialMessage,
      created_at: new Date().toISOString()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isExecutingPlan, setIsExecutingPlan] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiConversationService.setApiBase(apiBase);
  }, [apiBase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    // Mensagem otimista do usuário
    const tempUserMsg: AIConversationMessage = {
      id: `temp-usr-${Date.now()}`,
      conversation_id: conversation?.id || 'temp',
      company_id: '11111111-1111-1111-1111-111111111111',
      user_id: 'admin-user',
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      const res = await aiConversationService.sendMessage({
        message: text,
        conversationId: conversation?.id,
        context
      });

      setConversation(res.conversation);
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        res.userMessage,
        res.assistantMessage
      ]);
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      const errMsg: AIConversationMessage = {
        id: `err-${Date.now()}`,
        conversation_id: conversation?.id || 'temp',
        company_id: '11111111-1111-1111-1111-111111111111',
        user_id: 'admin-user',
        role: 'assistant',
        content: `Não consegui processar essa mensagem agora. Por favor, tente novamente.`,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectOption = (option: AIConversationSuggestedOption) => {
    if (option.action_type === 'execute') {
      // Se for execução direta da opção
      handleSendMessage(option.value);
    } else {
      handleSendMessage(option.value);
    }
  };

  const handleApprovePlan = async (plan: any) => {
    if (!conversation || isExecutingPlan) return;

    setIsExecutingPlan(true);
    try {
      const res = await aiConversationService.executePlan({
        conversationId: conversation.id,
        plan
      });

      setConversation(res.conversation);
      setMessages(prev => [...prev, res.assistantMessage]);
      if (onActionCompleted) {
        onActionCompleted(plan);
      }
    } catch (err: any) {
      console.error('Erro ao executar plano:', err);
      const errMsg: AIConversationMessage = {
        id: `err-exec-${Date.now()}`,
        conversation_id: conversation.id,
        company_id: '11111111-1111-1111-1111-111111111111',
        user_id: 'admin-user',
        role: 'assistant',
        content: `Houve uma falha ao aplicar as alterações solicitadas. O erro foi registrado internamente.`,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsExecutingPlan(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const newConv = await aiConversationService.createNewChat({
        title: 'Novo chat',
        initialContext: context
      });
      setConversation(newConv);
      setMessages([
        {
          id: 'msg-init-' + Date.now(),
          conversation_id: newConv.id,
          company_id: newConv.company_id,
          user_id: 'admin-user',
          role: 'assistant',
          content: initialMessage,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (e) {
      console.error('Erro ao criar novo chat:', e);
    }
  };

  const handleFeedback = async (messageId: string, type: 'thumbs_up' | 'thumbs_down') => {
    if (!conversation) return;
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedback: type } : m));
    await aiConversationService.sendFeedback({
      conversationId: conversation.id,
      messageId,
      feedback: type
    });
  };

  return (
    <div 
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height,
        padding: '16px 20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(10, 15, 30, 0.95) 100%)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
        borderRadius: 16
      }}
    >
      {/* Barra de Topo com Contexto e Ação de Novo Chat */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: 12,
          marginBottom: 14
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 6, borderRadius: 8, background: 'rgba(0, 210, 255, 0.15)', color: '#00d2ff' }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>Multiplex</span>
              <span className="badge" style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 6px' }}>
                Diálogo Ativo
              </span>
            </div>
            {context.page && (
              <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                Contexto: {context.page} {context.module ? `• ${context.module}` : ''}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleNewChat}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={13} />
          <span>Novo chat</span>
        </button>
      </div>

      {/* Área de Mensagens com Scroll */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: 6,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          marginBottom: 14
        }}
      >
        <AIConversationMessages
          messages={messages}
          isTyping={isTyping}
          onSelectOption={handleSelectOption}
          onApprovePlan={handleApprovePlan}
          onRejectPlan={() => handleSendMessage('Quero ajustar detalhes deste plano.')}
          onFeedback={handleFeedback}
          isExecutingPlan={isExecutingPlan}
        />
        <div ref={messagesEndRef} />
      </div>

      {/* Caixa de Entrada */}
      <AIConversationInput
        onSendMessage={handleSendMessage}
        disabled={isTyping || isExecutingPlan}
        placeholder={placeholder}
        suggestions={suggestions}
      />
    </div>
  );
};
