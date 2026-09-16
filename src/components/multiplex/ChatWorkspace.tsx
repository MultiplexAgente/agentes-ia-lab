import { Check, Info, Loader2, Paperclip, Plus, Search, SendHorizontal, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import multiplexIcon from "@/assets/multiplex-atom.jpg";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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

function Markdownish({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-3 text-[15px] leading-relaxed">
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        const isList = lines.every((line) => /^\s*([-*•]|\d+[.)])\s+/.test(line));
        if (isList) {
          return (
            <ul key={index} className="ml-4 list-disc space-y-1">
              {lines.map((line, i) => (
                <li key={i}>{inline(line.replace(/^\s*([-*•]|\d+[.)])\s+/, ""))}</li>
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

  const list = (
    <>
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Buscar conversas"
            className="h-8 pl-8 text-[13px]"
          />
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1 px-2 pb-3">
        {!authenticated ? (
          <p className="px-3 py-6 text-[13px] text-muted-foreground">
            Entre na sua empresa para ver o histórico de conversas.
          </p>
        ) : grouped.length === 0 ? (
          <div className="px-3 py-6">
            <p className="text-[13px] text-muted-foreground">Nenhuma conversa ainda</p>
            <Button variant="link" className="mt-1 h-auto p-0 text-primary" onClick={startNewChat}>
              + Novo chat
            </Button>
          </div>
        ) : (
          grouped.map((entry) => (
            <div key={entry.group} className="mb-3">
              <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {entry.group}
              </p>
              {entry.items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "group flex cursor-pointer items-start gap-2 rounded-lg px-3 py-1.5 transition-colors",
                    conversationId === item.id ? "bg-primary/12" : "hover:bg-muted/40",
                  )}
                  onClick={() => {
                    void openConversation(item);
                    window.dispatchEvent(new Event(CLOSE_SIDEBAR_EVENT));
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{shortTime(item.lastMessageAt)}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.channel !== "web" ? `${item.channel} · ` : ""}
                      {item.preview || "Sem mensagens"}
                    </p>
                  </div>
                  <button
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    title="Excluir conversa"
                    onClick={(event) => {
                      event.stopPropagation();
                      void removeConversation(item.id);
                    }}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </ScrollArea>
    </>
  );

  const chat = (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{conversationTitle}</p>
          <p className="text-xs text-muted-foreground">Multiplex</p>
        </div>
        <Button variant="ghost" size="icon" title="Sobre esta conversa">
          <Info className="size-4 text-muted-foreground" />
        </Button>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-5 py-6">
          {messages.length === 0 ? (
            <div className="pt-16 text-center">
              <div className="flex items-center justify-center gap-3">
                <MultiplexMark className="size-9" />
                <h1 className="font-display text-2xl font-semibold tracking-tight">Como posso ajudar?</h1>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary/15 px-4 py-2.5 text-[15px] leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="flex gap-3">
                    <MultiplexMark className="mt-0.5 size-7" />
                    <div className="min-w-0 flex-1">
                      <Markdownish text={message.content} />
                    </div>
                  </div>
                ),
              )}
              {busy && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Multiplex está trabalhando...
                </div>
              )}
            </div>
          )}
          {error && (
            <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border/60 px-5 py-3">
        <div className="mx-auto w-full max-w-3xl">
          <form
            className="flex items-end gap-2 rounded-2xl border border-border/70 bg-card/50 px-2 py-1.5 backdrop-blur"
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
          >
            <Button type="button" variant="ghost" size="icon" title="Anexar" disabled>
              <Paperclip className="size-4 text-muted-foreground" />
            </Button>
            <textarea
              ref={textareaRef}
              value={input}
              rows={1}
              placeholder="Envie uma mensagem para o Multiplex"
              className="max-h-40 min-h-[38px] flex-1 resize-none bg-transparent py-2 text-[15px] outline-none placeholder:text-muted-foreground"
              onChange={(event) => {
                setInput(event.target.value);
                const node = event.target;
                node.style.height = "auto";
                node.style.height = `${Math.min(node.scrollHeight, 160)}px`;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send(input);
                }
              }}
            />
            <Button type="submit" size="icon" disabled={busy || !input.trim()} title="Enviar">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <SendHorizontal className="size-4" />}
            </Button>
          </form>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/50"
                >
                  {models.find((option) => option.alias === alias)?.label ?? "GPT"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {models.map((option) => (
                  <DropdownMenuItem
                    key={option.alias}
                    disabled={!option.available}
                    onSelect={() => setAlias(option.alias)}
                    className="justify-between"
                  >
                    <span>{option.label}</span>
                    {option.alias === alias ? (
                      <Check className="size-3.5" />
                    ) : !option.available ? (
                      <span className="text-[10px] text-muted-foreground">indisponível</span>
                    ) : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={busy}
                onClick={() => void send(action.prompt)}
                className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return { list, chat };
}
