import React, { useState, KeyboardEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';

interface AIConversationInputProps {
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
}

export const AIConversationInput: React.FC<AIConversationInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Converse com a IA do Multiplex...',
  suggestions = []
}) => {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || disabled) return;
    setInputText('');
    onSendMessage(text);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectSuggestion = (s: string) => {
    if (disabled) return;
    onSendMessage(s);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      {/* Sugestões Rápidas de Diálogo Contextual */}
      {suggestions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectSuggestion(s)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 16,
                fontSize: '0.78rem',
                fontWeight: 500,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 210, 255, 0.4)';
                e.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <Sparkles size={12} color="var(--accent-cyan)" />
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}

      {/* Caixa de Entrada Principal */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-input, rgba(15, 23, 42, 0.8))',
          border: '1.5px solid var(--border-color, rgba(255, 255, 255, 0.12))',
          borderRadius: 12,
          padding: '6px 8px 6px 14px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
        }}
      >
        <input
          type="text"
          value={inputText}
          disabled={disabled}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-main, #ffffff)',
            fontSize: '0.92rem'
          }}
        />

        <button
          type="button"
          disabled={disabled || !inputText.trim()}
          onClick={handleSend}
          className="btn-primary"
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled || !inputText.trim() ? 0.5 : 1,
            cursor: disabled || !inputText.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
