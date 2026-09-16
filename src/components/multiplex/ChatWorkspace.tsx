import { ArrowUp, Check, Loader2, MoreHorizontal, Paperclip, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import multiplexIcon from "@/assets/multiplex-atom.jpg";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, getPublicSessionId, getToken, relativeGroup, shortTime } from "@/lib/multiplex/client";
import { cn } from "@/lib/utils";

interface ConversationItem {
  id: string;
  title: string;
  preview: string;
  channel: string;
  lastMessageAt: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

const QUICK_ACTIONS = [
  { label: "Buscar produtos", prompt: "Liste os produtos do meu catálogo com preço e disponibilidade." },
  { label: "Cadastrar cliente", prompt: "Quero cadastrar um cliente novo." },
  { label: "Criar pedido", prompt: "Quero criar um pedido." },
  { label: "Consultar pedidos", prompt: "Mostre os pedidos mais recentes da minha operação." },
  { label: "Analisar dados", prompt: "Faça um resumo da minha operação com os números reais." },
];

const GROUPS = ["Hoje", "Ontem", "Esta semana", "Mais antigas"] as const;

type ModelAlias = "gpt" | "claude" | "deepseek";

interface ModelOption {
  alias: ModelAlias;
  label: string;
  available: boolean;
  unavailableReason: string | null;
}

export function MultiplexMark({ className }: { className?: string }) {
  return (
    <img
      src={multiplexIcon}
      alt="Multiplex"
      className={cn("shrink-0 rounded-full object-cover", className)}
    />
  );
}

export const NEW_CHAT_EVENT = "multiplex:new-chat";
export const CLOSE_SIDEBAR_EVENT = "multiplex:close-sidebar";

function Markdownish({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-3 text-[15px] leading-[1.75]">
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        const isList = lines.length > 1 && lines.every((line) => /^\s*([-*•]|\d+[.])\s+/.test(line));
        if (isList) {
          return (
            <ul key={index} className="ml-4 list-disc space-y-1.5">
              {lines.map((line, i) => (
                <li key={i}>{inline(line.replace(/^\s*([-*•]|\d+[.])\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{inline(block)}</p>;
      })}
    </div>
  );
}

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={index} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}

export function useChatWorkspace() {
  const authenticated = typeof window !== "undefined" && Boolean(getToken());
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState("Novo chat");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [models, setModels] = useState<ModelOption[]>([]);
  const [alias, setAlias] = useState<ModelAlias>("gpt");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadConversations = useCallback(async () => {
    if (!authenticated) return;
    try {
      const data = await api<{ conversations: ConversationItem[] }>("/api/company/conversations");
      setConversations(data.conversations);
    } catch {
      setConversations([]);
    }
  }, [authenticated]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    api<{ options: ModelOption[]; selected: ModelAlias }>("/api/ai/models")
      .then((data) => {
        setModels(data.options);
        setAlias(data.selected);
      })
      .catch(() => setModels([]));
  }, []);

  useEffect(() => {
    const handler = () => startNewChat();
    window.addEventListener(NEW_CHAT_EVENT, handler);
    return () => window.removeEventListener(NEW_CHAT_EVENT, handler);
  }, []);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, busy]);

  function startNewChat() {
    setConversationId(null);
    setConversationTitle("Novo chat");
    setMessages([]);
    setError(null);
    setInput("");
  }

  async function openConversation(item: ConversationItem) {
    setConversationId(item.id);
    setConversationTitle(item.title);
    setError(null);
    setMessages([]);
    try {
      const data = await api<{ messages: ChatMessage[] }>(
        `/api/company/messages?conversationId=${encodeURIComponent(item.id)}`,
      );
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível abrir a conversa.");
    }
  }

  async function removeConversation(id: string) {
    try {
      await api(`/api/company/conversations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (conversationId === id) startNewChat();
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir a conversa.");
    }
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: "user", content }]);
    setBusy(true);
    try {
      const data = await api<{
        conversation: { id: string; title?: string | null };
        assistantMessage: { id: string; content: string };
      }>("/api/ai/conversation/chat", {
        method: "POST",
        body: JSON.stringify({
          message: content,
          conversationId,
          modelAlias: alias,
          ...(authenticated ? {} : { publicSessionId: getPublicSessionId() }),
        }),
      });
      setConversationId(data.conversation.id);
      if (data.conversation.title) setConversationTitle(data.conversation.title);
      setMessages((prev) => [
        ...prev,
        { id: data.assistantMessage.id, role: "assistant", content: data.assistantMessage.content },
      ]);
      void loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha de rede ao falar com a Multiplex.");
    } finally {
      setBusy(false);
    }
  }

  const grouped = useMemo(() => {
    const term = filter.trim().toLocaleLowerCase("pt-BR");
    const list = term
      ? conversations.filter(
          (item) =>
            item.title.toLocaleLowerCase("pt-BR").includes(term) ||
            item.preview.toLocaleLowerCase("pt-BR").includes(term),
        )
      : conversations;
    return GROUPS.map((group) => ({
      group,
      items: list.filter((item) => relativeGroup(item.lastMessageAt) === group),
    })).filter((entry) => entry.items.length > 0);
  }, [conversations, filter]);

  const currentModel = models.find((o) => o.alias === alias);

  // ─── COMPOSER ────────────────────────────────────────────────────────────────
  const composer = (
    <div className="w-full">
      <div className="relative flex flex-col rounded-2xl border border-border/60 bg-card/80 shadow-lg backdrop-blur-sm transition-all focus-within:border-primary/40 focus-within:shadow-primary/5">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="multiplex-composer"
          value={input}
          rows={1}
          placeholder="Mensagem para o Multiplex"
          className="min-h-[52px] w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/60"
          onChange={(event) => {
            setInput(event.target.value);
            const node = event.target;
            node.style.height = "auto";
            node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(input);
            }
          }}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1">
            {/* Model selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  id="multiplex-model-selector"
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  {currentModel?.label ?? "GPT"}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-50">
                    <path d="M2.5 3.5L5 6.5L7.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {models.length > 0 ? models.map((option) => (
                  <DropdownMenuItem
                    key={option.alias}
                    disabled={!option.available}
                    onSelect={() => setAlias(option.alias)}
                    className="justify-between text-sm"
                  >
                    <span>{option.label}</span>
                    {option.alias === alias ? (
                      <Check className="size-3.5 text-primary" />
                    ) : !option.available ? (
                      <span className="text-[10px] text-muted-foreground">indisponível</span>
                    ) : null}
                  </DropdownMenuItem>
                )) : (
                  <>
                    {(["gpt", "claude", "deepseek"] as ModelAlias[]).map((a) => (
                      <DropdownMenuItem key={a} onSelect={() => setAlias(a)} className="justify-between text-sm">
                        <span>{{ gpt: "GPT", claude: "Claude", deepseek: "DeepSeek" }[a]}</span>
                        {a === alias && <Check className="size-3.5 text-primary" />}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Attach (visual only) */}
            <button
              type="button"
              className="rounded-lg p-1.5 text-muted-foreground/60 transition-colors hover:bg-muted/60 hover:text-muted-foreground"
              title="Anexar arquivo (em breve)"
              disabled
            >
              <Paperclip className="size-4" />
            </button>
          </div>

          {/* Send */}
          <Button
            type="button"
            size="icon"
            id="multiplex-send-button"
            className="size-8 shrink-0 rounded-full"
            disabled={busy || !input.trim()}
            onClick={() => void send(input)}
            title="Enviar (Enter)"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-center text-xs text-destructive">{error}</p>
      )}
    </div>
  );

  // ─── SIDEBAR LIST ─────────────────────────────────────────────────────────────
  const list = (
    <>
      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar conversas"
            className="h-8 w-full rounded-lg bg-muted/40 pl-8 pr-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/50 focus:bg-muted/70"
          />
        </div>
      </div>

      {/* Conversation list */}
      <ScrollArea className="min-h-0 flex-1 px-2">
        {!authenticated ? (
          <p className="px-3 py-5 text-[12.5px] text-muted-foreground/70 leading-relaxed">
            Entre na sua empresa para ver o histórico de conversas.
          </p>
        ) : grouped.length === 0 ? (
          <p className="px-3 py-5 text-[12.5px] text-muted-foreground/70">
            Nenhuma conversa ainda.
          </p>
        ) : (
          <div className="pb-2">
            {grouped.map((entry) => (
              <div key={entry.group} className="mb-1">
                <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                  {entry.group}
                </p>
                {entry.items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors",
                      conversationId === item.id
                        ? "bg-muted/60 text-foreground"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    )}
                    onClick={() => {
                      void openConversation(item);
                      window.dispatchEvent(new Event(CLOSE_SIDEBAR_EVENT));
                    }}
                  >
                    <p className="flex-1 truncate">{item.title}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground/50">
                      {shortTime(item.lastMessageAt)}
                    </span>
                    <button
                      className="absolute right-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                      title="Excluir"
                      onClick={(e) => {
                        e.stopPropagation();
                        void removeConversation(item.id);
                      }}
                    >
                      <Trash2 className="size-3.5 text-muted-foreground/50 hover:text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );

  // ─── EMPTY STATE ──────────────────────────────────────────────────────────────
  const emptyState = (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-[680px]">
        {/* Greeting */}
        <div className="mb-8 flex items-center justify-center gap-3">
          <MultiplexMark className="size-10" />
          <h1 className="text-2xl font-semibold tracking-tight">Como posso ajudar?</h1>
        </div>

        {/* Composer */}
        {composer}

        {/* Quick actions */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={busy}
              onClick={() => void send(action.prompt)}
              className="rounded-full border border-border/50 px-3.5 py-1.5 text-[12.5px] text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── MESSAGES VIEW ────────────────────────────────────────────────────────────
  const messagesView = (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Conversation header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border/40 px-5">
        <p className="truncate text-[13px] font-medium text-foreground/80">{conversationTitle}</p>
        <Button variant="ghost" size="icon" className="size-7 shrink-0" title="Opções">
          <MoreHorizontal className="size-4 text-muted-foreground" />
        </Button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[720px] space-y-8 px-5 py-8">
          {messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-muted/60 px-4 py-3 text-[15px] leading-relaxed">
                  {message.content}
                </div>
              </div>
            ) : (
              <div key={message.id} className="flex gap-3">
                <MultiplexMark className="mt-0.5 size-7 shrink-0" />
                <div className="min-w-0 flex-1 pt-0.5 text-foreground">
                  <Markdownish text={message.content} />
                </div>
              </div>
            ),
          )}
          {busy && (
            <div className="flex items-center gap-3">
              <MultiplexMark className="size-7 shrink-0" />
              <div className="flex items-center gap-1.5 pt-1">
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Composer fixed at bottom */}
      <div className="shrink-0 border-t border-border/40 bg-background/60 px-4 pb-4 pt-3 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-[720px]">
          {composer}
        </div>
      </div>
    </div>
  );

  const chat = messages.length === 0 ? emptyState : messagesView;

  return { list, chat };
}
