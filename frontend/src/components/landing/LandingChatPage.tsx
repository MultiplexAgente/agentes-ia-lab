import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send, Sparkles, Zap, MessageSquare, Globe, Bot, Sun, Moon,
  BarChart3, Shield, Clock, Check, Loader2, User, LogIn, UserPlus,
  CornerDownLeft
} from 'lucide-react';
import atomLogo from '../../assets/multiplex-atom.jpg';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173'
  ? 'http://localhost:3000'
  : '';

const LANDING_SUGGESTIONS = [
  '💬 O que é o Multiplex IA e como funciona?',
  '📦 Como faço para cadastrar meu catálogo de produtos?',
  '📱 Quais canais posso conectar — WhatsApp, Instagram?',
  '⚡ Quanto tempo leva para ativar meu agente de IA?',
  '📊 Como o Multiplex aumenta minhas vendas?',
];

const INITIAL_LANDING_MESSAGE = `Olá! Sou a **IA do Multiplex** 👋

Estou aqui para apresentar nossa plataforma e responder todas as suas dúvidas.

O **Multiplex IA** é uma plataforma de agentes de atendimento multicanal — ela conecta seu negócio ao WhatsApp, Instagram e Telegram com uma IA treinada para vender, tirar dúvidas e converter clientes em tempo real.

O que você gostaria de saber? Pode me perguntar qualquer coisa! 🚀`;

interface LandingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface LandingChatPageProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

export const LandingChatPage: React.FC<LandingChatPageProps> = ({
  theme,
  toggleTheme,
  onLogin,
  onRegister
}) => {
  const [messages, setMessages] = useState<LandingMessage[]>([
    { id: 'init', role: 'assistant', content: INITIAL_LANDING_MESSAGE }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [statsVisible, setStatsVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setInputText('');
    setShowSuggestions(false);
    setIsTyping(true);

    const userMsg: LandingMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: trimmed
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch(`${API_BASE}/api/ai/conversation/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: '11111111-1111-1111-1111-111111111111',
          conversationId,
          message: trimmed,
          context: {
            page: 'landing_page',
            action: 'descoberta_produto',
            entity: 'multiplex_ia',
            entity_name: 'Multiplex IA - Landing Page'
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setConversationId(data.conversation?.id);
        setMessages(prev => [...prev, {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.assistantMessage?.content || 'Desculpe, não consegui processar sua mensagem. Tente novamente!'
        }]);
      } else {
        throw new Error('API error');
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Tive um problema de conexão agora. Por favor, tente novamente em alguns instantes! 🔄'
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return (
        <span key={i}>
          {part.split('\n').map((line, j, arr) => (
            <React.Fragment key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </React.Fragment>
          ))}
        </span>
      );
    });
  };

  const d = theme === 'dark';

  return (
    <div style={{
      minHeight: '100vh',
      background: d
        ? 'linear-gradient(135deg, #020817 0%, #0f172a 50%, #020817 100%)'
        : 'linear-gradient(135deg, #f0f4ff 0%, #ffffff 50%, #f0f4ff 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      color: d ? '#f1f5f9' : '#0f172a',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glows */}
      <div style={{
        position: 'absolute', top: '-200px', right: '-200px',
        width: '600px', height: '600px', pointerEvents: 'none', zIndex: 0,
        background: d
          ? 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)'
      }} />
      <div style={{
        position: 'absolute', bottom: '-200px', left: '-200px',
        width: '500px', height: '500px', pointerEvents: 'none', zIndex: 0,
        background: d
          ? 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(6, 182, 212, 0.05) 0%, transparent 70%)'
      }} />

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes typingDot { 0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; } 40% { transform: scale(1.1); opacity: 1; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .lnd-chip:hover { background: rgba(99,102,241,0.15)!important; border-color: rgba(99,102,241,0.5)!important; transform: translateY(-1px); }
        .lnd-send:hover:not(:disabled) { transform: scale(1.06); }
        .lnd-cta-p:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,0.6)!important; }
        .lnd-cta-s:hover { background: rgba(99,102,241,0.08)!important; }
        .lnd-feat:hover { transform: translateY(-2px); border-color: rgba(99,102,241,0.3)!important; }
        .lnd-input-row:focus-within { border-color: rgba(99,102,241,0.5)!important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .stat-anim { opacity: 0; transform: translateY(15px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .stat-anim.vis { opacity: 1; transform: translateY(0); }
        .lnd-nb-sec:hover { background: rgba(99,102,241,0.08)!important; color: #818cf8!important; }
        .lnd-nb-pri:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.5)!important; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: d ? 'rgba(2,8,23,0.9)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: d ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={atomLogo} alt="Multiplex IA" style={{
            width: 32, height: 32, borderRadius: 10, objectFit: 'cover',
            border: '1px solid rgba(99,102,241,0.4)', boxShadow: '0 0 14px rgba(99,102,241,0.3)'
          }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: d ? '#fff' : '#0f172a', letterSpacing: '-0.3px' }}>
                Multiplex IA
              </span>
              <span style={{
                fontSize: '0.63rem', color: '#06b6d4',
                background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
                padding: '2px 8px', borderRadius: 20, fontWeight: 700
              }}>
                GPT-4o
              </span>
            </div>
            <div style={{ fontSize: '0.65rem', color: d ? '#64748b' : '#94a3b8', marginTop: 1 }}>
              Plataforma de Atendimento Multicanal
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={toggleTheme} title={d ? 'Modo Claro' : 'Modo Escuro'} style={{
            width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
            border: d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            background: d ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: d ? '#94a3b8' : '#64748b'
          }}>
            {d ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#6366f1" />}
          </button>

          <button className="lnd-nb-sec" onClick={onLogin} style={{
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            border: d ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)',
            background: 'transparent', color: d ? '#e2e8f0' : '#334155',
            fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
          }}>
            <LogIn size={14} />Entrar
          </button>

          <button className="lnd-nb-pri" onClick={onRegister} style={{
            padding: '8px 18px', borderRadius: 8, cursor: 'pointer', border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
            fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(99,102,241,0.4)', transition: 'all 0.2s'
          }}>
            <UserPlus size={14} />Começar Grátis
          </button>
        </div>
      </nav>

      {/* ── HERO + CHAT ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '40px 24px 0', position: 'relative', zIndex: 1,
        maxWidth: 860, margin: '0 auto', width: '100%', boxSizing: 'border-box'
      }}>

        {/* HERO */}
        <div style={{ textAlign: 'center', marginBottom: 28, animation: 'fadeInUp 0.6s ease forwards' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20, marginBottom: 16,
            background: d ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.07)',
            border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8',
            fontSize: '0.78rem', fontWeight: 700, letterSpacing: 0.3
          }}>
            <Sparkles size={12} />
            Atendimento Inteligente 24h com IA Generativa
          </div>

          <h1 style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 900, lineHeight: 1.15,
            letterSpacing: '-0.02em', margin: '0 0 12px', color: d ? '#fff' : '#0f172a'
          }}>
            Seu negócio atendendo com{' '}
            <span style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>
              IA de verdade
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(0.88rem, 2vw, 1rem)', color: d ? '#94a3b8' : '#64748b',
            lineHeight: 1.6, maxWidth: 540, margin: '0 auto'
          }}>
            Converse comigo abaixo e descubra como o Multiplex transforma o atendimento da sua empresa no WhatsApp, Instagram e Telegram.
          </p>
        </div>

        {/* CHAT BOX */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{
            background: d ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.9)',
            border: d ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
            borderRadius: '20px 20px 0 0', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            minHeight: 400, maxHeight: 440,
            boxShadow: d ? '0 -4px 40px rgba(0,0,0,0.4)' : '0 -4px 40px rgba(0,0,0,0.06)'
          }}>
            {/* Chat header */}
            <div style={{
              padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8,
              borderBottom: d ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.06)'
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', background: '#10b981',
                boxShadow: '0 0 8px rgba(16,185,129,0.6)', flexShrink: 0
              }} />
              <Bot size={14} color="#818cf8" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: d ? '#a5b4fc' : '#6366f1' }}>
                Multiplex IA
              </span>
              <span style={{ fontSize: '0.7rem', color: d ? '#475569' : '#94a3b8' }}>
                · online agora
              </span>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '18px 20px 0',
              display: 'flex', flexDirection: 'column', gap: 14
            }}>
              {messages.map(msg => (
                <div key={msg.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                    background: msg.role === 'assistant'
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : (d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                    border: msg.role === 'user'
                      ? (d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)')
                      : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: msg.role === 'assistant' ? '0 0 10px rgba(99,102,241,0.4)' : 'none'
                  }}>
                    {msg.role === 'assistant'
                      ? <Bot size={15} color="#fff" />
                      : <User size={14} color={d ? '#94a3b8' : '#64748b'} />
                    }
                  </div>
                  {/* Bubble */}
                  <div style={{
                    padding: '11px 15px',
                    borderRadius: msg.role === 'assistant' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                    fontSize: '0.88rem', lineHeight: 1.65, maxWidth: 560,
                    background: msg.role === 'assistant'
                      ? (d ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)')
                      : (d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                    border: msg.role === 'assistant'
                      ? (d ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(99,102,241,0.15)')
                      : (d ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)'),
                    color: d ? '#e2e8f0' : '#1e293b'
                  }}>
                    {renderContent(msg.content)}
                  </div>
                </div>
              ))}

              {/* Typing */}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(99,102,241,0.4)'
                  }}>
                    <Bot size={15} color="#fff" />
                  </div>
                  <div style={{
                    padding: '12px 16px', borderRadius: '4px 14px 14px 14px',
                    background: d ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)',
                    border: d ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(99,102,241,0.15)',
                    display: 'flex', alignItems: 'center', gap: 5
                  }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 7, height: 7, borderRadius: '50%', background: '#818cf8',
                        animation: 'typingDot 1.2s ease-in-out infinite',
                        animationDelay: `${i * 0.2}s`
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* INPUT */}
          <div style={{
            background: d ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.99)',
            border: d ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)',
            borderTop: 'none', borderRadius: '0 0 20px 20px', padding: '12px 14px 14px'
          }}>
            <div className="lnd-input-row" style={{
              display: 'flex', alignItems: 'flex-end', gap: 10,
              background: d ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              border: d ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.09)',
              borderRadius: 13, padding: '10px 13px', transition: 'border-color 0.2s, box-shadow 0.2s'
            }}>
              <textarea
                ref={inputRef}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  resize: 'none', fontSize: '0.9rem', lineHeight: 1.5,
                  color: d ? '#f1f5f9' : '#0f172a', minHeight: 24, maxHeight: 120,
                  fontFamily: 'inherit', caretColor: '#6366f1'
                }}
                placeholder="Pergunte qualquer coisa sobre o Multiplex IA..."
                value={inputText}
                onChange={e => {
                  setInputText(e.target.value);
                  e.target.style.height = '24px';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                className="lnd-send"
                style={{
                  width: 34, height: 34, borderRadius: 9, border: 'none', cursor: inputText.trim() ? 'pointer' : 'default',
                  background: inputText.trim()
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : (d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                  color: inputText.trim() ? '#fff' : (d ? '#475569' : '#94a3b8'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  transition: 'all 0.2s',
                  boxShadow: inputText.trim() ? '0 4px 12px rgba(99,102,241,0.4)' : 'none'
                }}
                onClick={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isTyping}
              >
                {isTyping
                  ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  : <Send size={15} />
                }
              </button>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, marginTop: 7,
              fontSize: '0.71rem', color: d ? '#475569' : '#94a3b8'
            }}>
              <CornerDownLeft size={10} />
              <span>Enter para enviar · Shift+Enter nova linha</span>
            </div>
          </div>

          {/* SUGESTÕES */}
          {showSuggestions && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, justifyContent: 'center' }}>
              {LANDING_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  className="lnd-chip"
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: '7px 13px', borderRadius: 20, cursor: 'pointer',
                    border: d ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(99,102,241,0.2)',
                    background: d ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.04)',
                    color: d ? '#a5b4fc' : '#6366f1', fontSize: '0.79rem', fontWeight: 600,
                    transition: 'all 0.2s', whiteSpace: 'nowrap'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ESTATÍSTICAS ── */}
      <div ref={statsRef} style={{
        width: '100%', maxWidth: 860, margin: '0 auto',
        padding: '48px 24px', position: 'relative', zIndex: 1, boxSizing: 'border-box'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 18 }}>
          {[
            { value: '+12.8k', label: 'Mensagens atendidas hoje' },
            { value: '99.4%', label: 'Taxa de satisfação dos clientes' },
            { value: '< 2s', label: 'Tempo médio de resposta da IA' },
            { value: '+3.2k', label: 'Empresas ativas na plataforma' },
          ].map((stat, i) => (
            <div
              key={i}
              className={`stat-anim${statsVisible ? ' vis' : ''}`}
              style={{
                padding: '22px', borderRadius: 16, textAlign: 'center',
                transitionDelay: `${i * 0.1}s`,
                background: d ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.85)',
                border: d ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{
                fontSize: '2rem', fontWeight: 900, lineHeight: 1.2, marginBottom: 4,
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.79rem', color: d ? '#94a3b8' : '#64748b', fontWeight: 500, lineHeight: 1.3 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{
        width: '100%', maxWidth: 860, margin: '0 auto 56px',
        padding: '0 24px', position: 'relative', zIndex: 1, boxSizing: 'border-box'
      }}>
        <h2 style={{
          textAlign: 'center', fontSize: '1.45rem', fontWeight: 800,
          marginBottom: 26, color: d ? '#fff' : '#0f172a'
        }}>
          Tudo que seu negócio precisa em um só lugar
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 15 }}>
          {[
            { icon: <MessageSquare size={19} color="#818cf8" />, title: 'Chat Multicanal', desc: 'WhatsApp oficial, Instagram Direct e Telegram em um único painel de controle.' },
            { icon: <Globe size={19} color="#06b6d4" />, title: 'Catálogo Inteligente', desc: 'Importe produtos de qualquer site com 1 clique. A IA organiza tudo automaticamente.' },
            { icon: <BarChart3 size={19} color="#10b981" />, title: 'Dashboard Executivo', desc: 'KPIs em tempo real: conversões, mensagens, produtos mais buscados e muito mais.' },
            { icon: <Shield size={19} color="#f59e0b" />, title: 'Handoff Seguro', desc: 'Transfira para atendentes humanos com contexto preservado quando necessário.' },
            { icon: <Zap size={19} color="#ec4899" />, title: 'AI App Builder', desc: 'Crie funcionalidades personalizadas para seu negócio conversando com a IA.' },
            { icon: <Clock size={19} color="#818cf8" />, title: 'Disponível 24/7', desc: 'Seu agente nunca descansa. Atenda clientes a qualquer hora, sem custo adicional.' }
          ].map((feat, i) => (
            <div key={i} className="lnd-feat" style={{
              padding: '18px', borderRadius: 14, transition: 'all 0.25s',
              background: d ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.85)',
              border: d ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, marginBottom: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.12))'
              }}>
                {feat.icon}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 5, color: d ? '#f1f5f9' : '#0f172a' }}>
                {feat.title}
              </div>
              <div style={{ fontSize: '0.78rem', color: d ? '#94a3b8' : '#64748b', lineHeight: 1.5 }}>
                {feat.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{
        width: '100%', maxWidth: 860, margin: '0 auto 56px',
        padding: '0 24px', position: 'relative', zIndex: 1, boxSizing: 'border-box'
      }}>
        <div style={{
          borderRadius: 20, padding: '40px 32px', textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.1) 50%, rgba(6,182,212,0.1) 100%)',
          border: '1px solid rgba(99,102,241,0.25)', backdropFilter: 'blur(20px)'
        }}>
          <div style={{
            fontSize: '0.76rem', color: '#818cf8', fontWeight: 700, marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center'
          }}>
            <Check size={12} />
            7 dias grátis · Cancele quando quiser · Sem cartão obrigatório
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: d ? '#fff' : '#0f172a', marginBottom: 10 }}>
            Pronto para transformar seu atendimento?
          </h2>
          <p style={{ fontSize: '0.88rem', color: d ? '#94a3b8' : '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
            Ative seu agente de IA em menos de 5 minutos e comece a converter clientes no automático.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="lnd-cta-p" onClick={onRegister} style={{
              padding: '12px 26px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff',
              fontSize: '0.93rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(99,102,241,0.5)', transition: 'all 0.2s'
            }}>
              <UserPlus size={17} />Criar minha conta grátis
            </button>
            <button className="lnd-cta-s" onClick={onLogin} style={{
              padding: '12px 22px', borderRadius: 10, cursor: 'pointer',
              border: d ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.15)',
              background: 'transparent', color: d ? '#e2e8f0' : '#334155',
              fontSize: '0.93rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
            }}>
              <LogIn size={16} />Já tenho conta — Entrar
            </button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        textAlign: 'center', padding: '18px 24px', fontSize: '0.76rem',
        color: d ? '#475569' : '#94a3b8', position: 'relative', zIndex: 1,
        borderTop: d ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.05)'
      }}>
        <span style={{ fontWeight: 800, letterSpacing: 1, fontSize: '0.7rem', color: d ? '#334155' : '#cbd5e1' }}>
          BONASOFT
        </span>
        {' · '}Multiplex IA {new Date().getFullYear()} · Todos os direitos reservados
      </footer>
    </div>
  );
};

