import React, { useCallback, useState } from 'react';
import { LogIn, Moon, Plus, Sun } from 'lucide-react';
import atomLogo from '../../assets/multiplex-atom.jpg';
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import {
  PromptInput,
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
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string>();

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

  const status = isTyping ? 'submitted' as const : 'ready' as const;

  return (
    <main className="flex h-dvh min-h-0 flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <img className="size-7 rounded-md object-cover" src={atomLogo} alt="Multiplex IA" />
          <span className="text-sm font-semibold">Multiplex IA</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={startNewChat} title="Nova conversa" aria-label="Nova conversa">
            <Plus />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} title="Alternar tema" aria-label="Alternar tema">
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogin}>
            <LogIn />
            <span className="hidden sm:inline">Entrar</span>
          </Button>
        </div>
      </header>

      <Conversation className="min-h-0">
        <ConversationContent className="mx-auto min-h-full w-full max-w-3xl gap-7 px-4 py-8 sm:px-6">
          {messages.length === 0 ? (
            <ConversationEmptyState className="min-h-[60vh] p-4">
              <img className="mb-3 size-12 rounded-xl object-cover" src={atomLogo} alt="Multiplex IA" />
              <h1 className="text-2xl font-semibold sm:text-3xl">Como posso ajudar?</h1>
            </ConversationEmptyState>
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent className="text-[0.95rem] leading-7">
                  {message.role === 'assistant'
                    ? <MessageResponse>{message.content}</MessageResponse>
                    : message.content}
                </MessageContent>
              </Message>
            ))
          )}
          {isTyping && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Processando...</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 bg-background px-3 pb-4 pt-2 sm:px-6 sm:pb-6">
        <div className="mx-auto w-full max-w-3xl">
          <PromptInput
            className="rounded-2xl border-border bg-card shadow-sm"
            onSubmit={() => sendMessage(inputText)}
          >
            <PromptInputTextarea
              autoFocus
              className="min-h-14 px-4 py-3 text-base"
              disabled={isTyping}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="Escreva o que você precisa"
              value={inputText}
            />
            <PromptInputFooter className="justify-end px-2 pb-2">
              <PromptInputSubmit disabled={!inputText.trim() || isTyping} status={status} />
            </PromptInputFooter>
          </PromptInput>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Confira informações importantes antes de tomar decisões.
          </p>
        </div>
      </div>
    </main>
  );
};
