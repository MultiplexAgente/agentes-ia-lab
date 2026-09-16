import {
  ArrowUp,
  Check,
  ChevronDown,
  Loader2,
  LogIn,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
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
import {
  api,
  getPublicSessionId,
  getToken,
  relativeGroup,
  shortTime,
} from "@/lib/multiplex/client";
import { cn } from "@/lib/utils";

interface ConversationItem {
  id: string;
  title: string;
  preview: string;
  channel: string;
  lastMessageAt: string;
  messages?: ChatMessage[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

const GUEST_CHATS_STORAGE_KEY = "multiplex.guest.conversations";

// Sugestões limpas sem emojis
const QUICK_ACTIONS = [
  { label: "Ideias e planejamento", prompt: "Me ajude a estruturar um plano estratégico para um novo projeto." },
  { label: "Redigir ou revisar texto", prompt: "Poderia me ajudar a escrever um texto profissional e persuasivo?" },
  { label: "Programação e desenvolvimento", prompt: "Explique como estruturar uma solução eficiente em TypeScript e React." },
  { label: "Análise e produtividade", prompt: "Quais são as melhores metodologias para otimizar processos com automação e IA?" },
];

const GROUPS = ["Hoje", "Ontem", "Esta semana", "Mais antigas"] as const;

type ModelAlias = "gpt" | "deepseek";

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
    <div className="space-y-3 text-[15px] leading-relaxed text-foreground">
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        const isList = lines.every((line) => /^\s*([-*•]|\d+[.)])\s+/.test(line));
        if (isList) {
          return (
            <ul key={index} className="ml-5 list-disc space-y-1 text-foreground/90">
              {lines.map((line, i) => (
                <li key={i}>{inline(line.replace(/^\s*([-*•]|\d+[.)])\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="leading-relaxed">
            {inline(block)}
          </p>
        );
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
  const [models, setModels] = useState<ModelOption[]>([
    { alias: "gpt", label: "GPT-4o", available: true, unavailableReason: null },
    { alias: "deepseek", label: "DeepSeek V3", available: true, unavailableReason: null },
  ]);
  const [alias, setAlias] = useState<ModelAlias>("gpt");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Carrega histórico: do servidor se logado, ou do localStorage se visitante
  const loadConversations = useCallback(async () => {
    if (authenticated) {
      try {
        const data = await api<{ conversations: ConversationItem[] }>("/api/company/conversations");
        setConversations(data.conversations);
      } catch {
        setConversations([]);
      }
    } else {
      try {
        const raw = window.localStorage.getItem(GUEST_CHATS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as ConversationItem[];
          setConversations(Array.isArray(parsed) ? parsed : []);
        } else {
          setConversations([]);
        }
      } catch {
        setConversations([]);
      }
    }
  }, [authenticated]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // Carrega modelos ignorando Claude
  useEffect(() => {
    api<{ options: Array<{ alias: string; label: string; available: boolean; unavailableReason: string | null }>; selected: string }>("/api/ai/models")
      .then((data) => {
        const filtered = (data.options || [])
          .filter((opt) => opt.alias !== "claude")
          .map((opt) => ({
            alias: opt.alias as ModelAlias,
            label: opt.alias === "gpt" ? "GPT-4o" : opt.alias === "deepseek" ? "DeepSeek V3" : opt.label,
            available: opt.available,
            unavailableReason: opt.unavailableReason,
          }));
        if (filtered.length > 0) setModels(filtered);
        if (data.selected && data.selected !== "claude") setAlias(data.selected as ModelAlias);
      })
      .catch(() => {
        // Fallback padrão
      });
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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  useEffect(() => {
    const handler = () => startNewChat();
    window.addEventListener(NEW_CHAT_EVENT, handler);
    return () => window.removeEventListener(NEW_CHAT_EVENT, handler);
  }, []);

  async function openConversation(item: ConversationItem) {
    setConversationId(item.id);
    setConversationTitle(item.title);
    setError(null);

    if (authenticated) {
      setMessages([]);
      try {
        const data = await api<{ messages: ChatMessage[] }>(
          `/api/company/messages?conversationId=${encodeURIComponent(item.id)}`,
        );
        setMessages(data.messages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível abrir a conversa.");
      }
    } else {
      if (item.messages && Array.isArray(item.messages)) {
        setMessages(item.messages);
      } else {
        setMessages([]);
      }
    }
  }

  async function removeConversation(id: string) {
    if (authenticated) {
      try {
        await api(`/api/company/conversations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        if (conversationId === id) startNewChat();
        await loadConversations();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível excluir a conversa.");
      }
    } else {
      try {
        const next = conversations.filter((c) => c.id !== id);
        setConversations(next);
        window.localStorage.setItem(GUEST_CHATS_STORAGE_KEY, JSON.stringify(next));
        if (conversationId === id) startNewChat();
      } catch {
        // ignore
      }
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

    const userMessage: ChatMessage = { id: `local-${Date.now()}`, role: "user", content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setBusy(true);

    const isFirstMessage = messages.length === 0;
    const computedTitle = isFirstMessage
      ? content.length > 36
        ? `${content.slice(0, 36)}...`
        : content
      : conversationTitle;

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

      const nextId = data.conversation.id || conversationId || `guest-${Date.now()}`;
      const nextTitle = data.conversation.title || computedTitle;
      const assistantMessage: ChatMessage = {
        id: data.assistantMessage.id,
        role: "assistant",
        content: data.assistantMessage.content,
      };
      const finalMessages = [...updatedMessages, assistantMessage];

      setConversationId(nextId);
      setConversationTitle(nextTitle);
      setMessages(finalMessages);

      if (authenticated) {
        void loadConversations();
      } else {
        try {
          const raw = window.localStorage.getItem(GUEST_CHATS_STORAGE_KEY);
          const currentList = raw ? (JSON.parse(raw) as ConversationItem[]) : [];
          const existingIdx = currentList.findIndex((c) => c.id === nextId);

          const item: ConversationItem = {
            id: nextId,
            title: nextTitle,
            preview: content,
            channel: "web",
            lastMessageAt: new Date().toISOString(),
            messages: finalMessages,
          };

          let nextList: ConversationItem[];
          if (existingIdx >= 0) {
            nextList = [...currentList];
            nextList[existingIdx] = item;
          } else {
            nextList = [item, ...currentList];
          }

          window.localStorage.setItem(GUEST_CHATS_STORAGE_KEY, JSON.stringify(nextList));
          setConversations(nextList);
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao se comunicar com a Multiplex.");
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

  const currentModel = models.find((option) => option.alias === alias) ?? models[0];

  // SIDEBAR - LISTA DE CONVERSAS COM BUSCA FLEXÍVEL (Ícone e texto sem sobreposição)
  const list = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-3">
        <div className="flex h-9 w-full items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3 transition-colors focus-within:border-border">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Buscar conversas..."
            className="h-full flex-1 border-0 bg-transparent p-0 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-0"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-2 pb-2">
        {grouped.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <p className="text-xs text-muted-foreground">Nenhuma conversa recente</p>
            <Button
              variant="link"
              className="mt-1 h-auto p-0 text-xs text-primary font-medium"
              onClick={startNewChat}
            >
              Iniciar nova conversa
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            {grouped.map(({ group, items }) => (
              <div key={group} className="space-y-0.5">
                <p className="px-2.5 py-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  {group}
                </p>
                {items.map((item) => {
                  const active = item.id === conversationId;
                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => void openConversation(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") void openConversation(item);
                      }}
                      className={cn(
                        "group flex w-full items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] transition-colors cursor-pointer",
                        active
                          ? "bg-muted/70 font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                        title="Excluir conversa"
                        onClick={(e) => {
                          e.stopPropagation();
                          void removeConversation(item.id);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // COMPOSER CAPSULE (Estilo ChatGPT: limpo, com textarea expansível e botão de envio)
  const composer = (
    <div className="mx-auto w-full max-w-[740px]">
      <form
        className="flex flex-col rounded-[26px] border border-border/70 bg-card/90 p-3 shadow-lg backdrop-blur-xl transition-all focus-within:border-border/90"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          rows={1}
          placeholder="Pergunte qualquer coisa..."
          className="max-h-44 min-h-[40px] w-full resize-none bg-transparent px-2 py-1 text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => {
            setInput(event.target.value);
            const node = event.target;
            node.style.height = "auto";
            node.style.height = `${Math.min(node.scrollHeight, 180)}px`;
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(input);
            }
          }}
        />

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground cursor-pointer"
              title="Anexar ou adicionar"
              onClick={() => {}}
            >
              <Plus className="size-4" />
            </button>
          </div>

          <Button
            type="submit"
            size="icon"
            className="size-8 rounded-full bg-primary text-primary-foreground shadow-sm transition-all hover:opacity-90 disabled:opacity-25"
            disabled={busy || !input.trim()}
            title="Enviar mensagem"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4 stroke-[2.5]" />}
          </Button>
        </div>
      </form>

      {error && <p className="mt-2 text-center text-xs text-destructive">{error}</p>}
    </div>
  );

  // TOP BAR DO CHAT COM ESPAÇAMENTO GENEROSO (Seletor de Modelo limpo e botão de login)
  const topBar = (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-1.5 text-sm font-semibold text-foreground transition-all hover:bg-muted/60 hover:border-border cursor-pointer shadow-xs"
            >
              <span>{currentModel?.label ?? "GPT-4o"}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom" sideOffset={8} className="w-56 rounded-xl border border-border/70 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl">
            {models.map((option) => (
              <DropdownMenuItem
                key={option.alias}
                disabled={!option.available}
                onSelect={() => setAlias(option.alias)}
                className="justify-between py-2.5 px-3 text-xs rounded-lg cursor-pointer"
              >
                <div>
                  <p className="font-semibold text-[13px]">{option.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {option.alias === "gpt" ? "Rápido, versátil e inteligente" : "Alta performance e raciocínio"}
                  </p>
                </div>
                {option.alias === alias && <Check className="size-4 text-primary shrink-0 ml-2" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-2">
        {!authenticated ? (
          <Button
            variant="default"
            size="sm"
            className="h-8 gap-1.5 rounded-full px-4 text-xs font-semibold shadow-xs"
            onClick={() => window.location.assign("/entrar")}
          >
            <LogIn className="size-3.5" />
            <span>Entrar</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="hidden sm:inline font-medium">Conectado</span>
          </div>
        )}
      </div>
    </header>
  );

  // ÁREA DO CHAT
  const chat =
    messages.length === 0 ? (
      <div className="flex min-h-0 flex-1 flex-col">
        {topBar}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
          {/* EMPTY STATE HERO */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <MultiplexMark className="size-16 rounded-full shadow-[0_0_32px_rgba(59,130,246,0.25)] ring-2 ring-primary/20" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Como posso ajudar hoje?
            </h1>
          </div>

          {/* COMPOSER CENTRALIZADO */}
          <div className="w-full px-2">{composer}</div>

          {/* QUICK ACTIONS CARDS (Estilo ChatGPT sem emojis) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-[740px] w-full px-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled={busy}
                onClick={() => void send(action.prompt)}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-card/50 hover:bg-muted/50 p-3 text-left transition-all hover:border-border cursor-pointer group"
              >
                <span className="text-xs font-medium text-foreground/90 group-hover:text-foreground">
                  {action.label}
                </span>
                <span className="text-[10px] text-muted-foreground opacity-60 group-hover:opacity-100">
                  Perguntar →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    ) : (
      <div className="flex min-h-0 flex-1 flex-col">
        {topBar}

        {/* FEED DE MENSAGENS */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[740px] space-y-6 px-4 py-8">
            {messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-muted/70 px-4 py-2.5 text-[15px] leading-relaxed text-foreground shadow-sm">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex gap-3.5">
                  <MultiplexMark className="mt-1 size-7 shrink-0 shadow-sm" />
                  <div className="min-w-0 flex-1 pt-0.5">
                    <Markdownish text={message.content} />
                  </div>
                </div>
              ),
            )}

            {busy && (
              <div className="flex items-center gap-3 py-2">
                <MultiplexMark className="size-7 shrink-0 animate-pulse" />
                <div className="flex items-center gap-1.5 py-1">
                  <span className="size-2 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-2 rounded-full bg-primary/70 animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-2 rounded-full bg-primary/70 animate-bounce" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COMPOSER FIXO INFERIOR */}
        <div className="shrink-0 px-4 pb-4 pt-2">{composer}</div>
      </div>
    );

  return { list, chat };
}
