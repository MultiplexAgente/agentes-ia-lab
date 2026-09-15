import React, { useCallback, useState } from 'react';
import {
  ArrowUp,
  Mic,
  Moon,
  PanelLeft,
  Plus,
  Search,
  Settings,
  SquarePen,
  Sun,
} from 'lucide-react';
import atomLogo from '@/assets/multiplex-atom.jpg';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const API_BASE = typeof window !== 'undefined' && window.location.port === '5173'
  ? 'http://localhost:3000'
  : '';

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
  onRegister,
}) => {
  const [messages, setMessages] = useState<LandingMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sendMessage = useCallback(async (text: string) => {
    const prompt = text.trim();
    if (!prompt || isTyping) return;

    const userMessage: LandingMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
    };

    setInputText('');
    setMessages((current) => [...current, userMessage]);
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE}/api/ai/conversation/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: '11111111-1111-1111-1111-111111111111',
          conversationId,
          message: prompt,
          context: { page: 'chat' },
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível processar sua solicitação agora.');
      }

      setConversationId(data.conversation?.id);
      setMessages((current) => [
        ...current,
        {
          id: data.assistantMessage?.id || `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.assistantMessage?.content || data.response_text || 'Não recebi uma resposta válida.',
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Não foi possível processar sua solicitação agora.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [conversationId, isTyping]);

  const startNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setInputText('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage(inputText);
  };

  const composer = (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
      <div className="flex items-end gap-2 rounded-[28px] border border-border bg-muted/60 px-3 py-2 shadow-sm transition-colors focus-within:border-foreground/20">
        <button
          type="button"
          aria-label="Adicionar"
          className="mb-1 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <Plus className="size-5" />
        </button>
        <textarea
          autoFocus
          rows={1}
          value={inputText}
          disabled={isTyping}
          onChange={(event) => {
            setInputText(event.target.value);
            event.target.style.height = 'auto';
            event.target.style.height = `${Math.min(event.target.scrollHeight, 200)}px`;
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              sendMessage(inputText);
            }
          }}
          placeholder="Pergunte à Multiplex IA"
          className="max-h-[200px] min-h-9 flex-1 resize-none bg-transparent py-2 text-base leading-6 text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          aria-label="Ditar"
          className="mb-1 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
        >
          <Mic className="size-5" />
        </button>
        <button
          type="submit"
          aria-label="Enviar"
          disabled={!inputText.trim() || isTyping}
          className="mb-1 grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <ArrowUp className="size-5" />
        </button>
      </div>
    </form>
  );

  return (
    <div className="flex h-dvh min-h-0 w-full bg-background text-foreground">
      {/* Barra lateral */}
      <aside
        className={cn(
          'hidden shrink-0 flex-col justify-between border-r border-border bg-muted/40 transition-all duration-200 md:flex',
          sidebarOpen ? 'w-64' : 'w-16',
        )}
      >
        <div className="flex flex-col gap-1 p-3">
          <div className="mb-2 flex items-center justify-between">
            <img className="size-8 rounded-lg object-cover" src={atomLogo} alt="Multiplex IA" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen((value) => !value)}
              title="Recolher barra lateral"
              aria-label="Recolher barra lateral"
            >
              <PanelLeft />
            </Button>
          </div>

          <SidebarItem icon={<SquarePen className="size-4" />} label="Novo chat" open={sidebarOpen} onClick={startNewChat} />
          <SidebarItem icon={<Search className="size-4" />} label="Buscar chats" open={sidebarOpen} onClick={startNewChat} />
          <SidebarItem icon={<Settings className="size-4" />} label="Configurações" open={sidebarOpen} onClick={onLogin} />
        </div>

        {sidebarOpen && (
          <div className="border-t border-border p-4">
            <p className="text-sm font-medium">Respostas com os seus dados</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Entre para acessar o seu catálogo, pedidos e histórico de conversas.
            </p>
            <Button className="mt-3 w-full" onClick={onLogin}>Entrar</Button>
          </div>
        )}
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              className="md:hidden"
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen((value) => !value)}
              aria-label="Menu"
            >
              <PanelLeft />
            </Button>
            <span className="truncate text-base font-semibold">Multiplex IA</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} title="Alternar tema" aria-label="Alternar tema">
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={onLogin}>
              Entrar
            </Button>
            <Button size="sm" className="hidden rounded-full sm:inline-flex" onClick={onRegister}>
              Criar conta
            </Button>
          </div>
        </header>

        {messages.length === 0 && !isTyping ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
            <h1 className="mb-7 text-center text-[1.75rem] font-semibold sm:text-[2rem]">
              Por onde começamos?
            </h1>
            <div className="w-full">{composer}</div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              A Multiplex IA responde com os dados reais cadastrados no seu sistema.
            </p>
          </div>
        ) : (
          <>
            <Conversation className="min-h-0">
              <ConversationContent className="mx-auto min-h-full w-full max-w-3xl gap-7 px-4 py-6 sm:px-6">
                {messages.length === 0 && (
                  <ConversationEmptyState className="min-h-[40vh]" title="" description="" />
                )}
                {messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent className="text-[0.95rem] leading-7">
                      {message.role === 'assistant'
                        ? <MessageResponse>{message.content}</MessageResponse>
                        : message.content}
                    </MessageContent>
                  </Message>
                ))}
                {isTyping && (
                  <Message from="assistant">
                    <MessageContent>
                      <Shimmer>Pensando...</Shimmer>
                    </MessageContent>
                  </Message>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>

            <div className="shrink-0 px-3 pb-4 pt-2 sm:px-6">
              {composer}
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Confira informações importantes antes de tomar decisões.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const SidebarItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  open: boolean;
  onClick: () => void;
}> = ({ icon, label, open, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    className={cn(
      'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-foreground/80 transition-colors hover:bg-foreground/10 hover:text-foreground',
      !open && 'justify-center',
    )}
  >
    <span className="shrink-0">{icon}</span>
    {open && <span className="truncate">{label}</span>}
  </button>
);
