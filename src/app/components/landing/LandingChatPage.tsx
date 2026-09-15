import React, { useCallback, useRef, useState } from 'react';
import {
  ArrowUp,
  History,
  Menu,
  Mic,
  Moon,
  Paperclip,
  Plus,
  Search,
  Sun,
  UserRound,
  X,
} from 'lucide-react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Button } from '@/components/ui/button';

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
}) => {
  const [messages, setMessages] = useState<LandingMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [publicSessionId] = useState(() => crypto.randomUUID());
  const [navigationOpen, setNavigationOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = useCallback(async (text: string) => {
    const prompt = text.trim();
    if (!prompt || isTyping) return;

    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: 'user', content: prompt },
    ]);
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE}/api/ai/conversation/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          publicSessionId,
          message: prompt,
          context: { page: 'chat' },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Não foi possível concluir agora.');

      setConversationId(data.conversation?.id);
      setMessages((current) => [
        ...current,
        {
          id: data.assistantMessage?.id || `assistant-${Date.now()}`,
          role: 'assistant',
           content: data.assistantMessage.content,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: error instanceof Error ? error.message : 'Não foi possível concluir agora.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [conversationId, isTyping, publicSessionId]);

  const startNewChat = () => {
    setMessages([]);
    setConversationId(undefined);
    setNavigationOpen(false);
  };

  const composer = (
    <PromptInput
      accept="image/*,.pdf,.txt,.doc,.docx"
      multiple
      onSubmit={({ text }) => sendMessage(text)}
      className="multiplex-composer"
    >
      <PromptInputTextarea
        autoFocus
        disabled={isTyping}
        name="message"
        placeholder="Mensagem para a Multiplex IA"
        className="min-h-24 px-5 pt-5 text-[15px] leading-6 sm:min-h-28"
      />
      <PromptInputFooter className="px-3 pb-3">
        <div className="flex items-center gap-1">
          <PromptInputButton
            aria-label="Anexar arquivo"
            title="Anexar arquivo"
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="size-4" />
          </PromptInputButton>
          <PromptInputButton
            aria-label="Usar voz"
            title="Usar voz"
            className="text-muted-foreground hover:text-foreground"
          >
            <Mic className="size-4" />
          </PromptInputButton>
        </div>
        <PromptInputSubmit
          aria-label="Enviar mensagem"
          disabled={isTyping}
          status={isTyping ? 'submitted' : 'ready'}
          className="size-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {!isTyping && <ArrowUp className="size-4" />}
        </PromptInputSubmit>
      </PromptInputFooter>
    </PromptInput>
  );

  return (
    <div className="relative flex h-dvh min-h-0 w-full overflow-hidden bg-background text-foreground">
      <input ref={fileInputRef} type="file" multiple className="hidden" aria-hidden="true" />

      <header className="absolute inset-x-0 top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-7">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setNavigationOpen(true)}
          aria-label="Abrir conversas"
          title="Conversas"
          className="rounded-lg text-muted-foreground hover:text-foreground"
        >
          <Menu />
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            title="Alternar tema"
            className="rounded-lg text-muted-foreground hover:text-foreground"
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogin}
            aria-label="Acessar conta"
            title="Acessar conta"
            className="rounded-lg text-muted-foreground hover:text-foreground"
          >
            <UserRound />
          </Button>
        </div>
      </header>

      {navigationOpen && (
        <>
          <button
            type="button"
            className="absolute inset-0 z-40 bg-overlay backdrop-blur-sm"
            onClick={() => setNavigationOpen(false)}
            aria-label="Fechar navegação"
          />
          <aside className="absolute inset-y-0 left-0 z-50 flex w-[min(88vw,320px)] flex-col border-r border-border bg-popover/95 p-4 shadow-2xl backdrop-blur-2xl">
            <div className="mb-8 flex items-center justify-between px-1">
              <span className="font-display text-base font-semibold">Multiplex IA</span>
              <Button variant="ghost" size="icon" onClick={() => setNavigationOpen(false)} aria-label="Fechar">
                <X />
              </Button>
            </div>
            <Button variant="secondary" className="justify-start" onClick={startNewChat}>
              <Plus /> Novo chat
            </Button>
            <div className="mt-7 flex items-center gap-2 px-2 text-xs font-medium text-muted-foreground">
              <History className="size-4" /> Conversas
            </div>
            <div className="mt-3 flex min-h-0 flex-1 flex-col items-center justify-center text-center text-muted-foreground">
              <Search className="mb-3 size-5" />
              <span className="text-xs">Nenhuma conversa salva</span>
            </div>
          </aside>
        </>
      )}

      <main className="relative flex min-w-0 flex-1 flex-col pt-16">
        {messages.length === 0 && !isTyping ? (
          <section className="flex min-h-0 flex-1 items-center justify-center px-4 pb-[10vh]">
            <div className="w-full max-w-3xl animate-chat-enter">
              <div className="mb-10 text-center">
                <div className="mx-auto mb-5 grid size-10 place-items-center rounded-xl border border-primary/25 bg-primary/10 shadow-glow">
                  <span className="size-2 rounded-full bg-primary" />
                </div>
                <h1 className="font-display text-3xl font-medium sm:text-4xl">O que vamos fazer?</h1>
              </div>
              {composer}
            </div>
          </section>
        ) : (
          <>
            <Conversation className="min-h-0">
              <ConversationContent className="mx-auto min-h-full w-full max-w-3xl gap-9 px-4 pb-8 pt-10 sm:px-6">
                {messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent className="text-[15px] leading-7">
                      {message.role === 'assistant'
                        ? <MessageResponse>{message.content}</MessageResponse>
                        : message.content}
                    </MessageContent>
                  </Message>
                ))}
                {isTyping && (
                  <Message from="assistant">
                    <MessageContent><Shimmer>Pensando…</Shimmer></MessageContent>
                  </Message>
                )}
              </ConversationContent>
              <ConversationScrollButton />
            </Conversation>
            <div className="shrink-0 px-4 pb-5 pt-2 sm:px-6">
              <div className="mx-auto max-w-3xl">{composer}</div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};