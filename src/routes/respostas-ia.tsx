import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  MessageSquare,
  Copy,
  Check,
  Send,
  FileText,
  Clock,
  ArrowRight,
  Headphones,
} from "lucide-react";

import { AppShell } from "@/components/multiplex/AppShell";
import { PageFrame } from "@/components/multiplex/DataPage";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/multiplex/client";

export const Route = createFileRoute("/respostas-ia")({
  head: () => ({
    meta: [
      { title: "Assistente de Respostas | HUG" },
      {
        name: "description",
        content:
          "Gere respostas sugeridas para dúvidas de clientes com I.A e contexto do negócio usando AI Gateway.",
      },
    ],
  }),
  component: RespostasIaPage,
});

interface SuggestReplyResponse {
  ok: boolean;
  reply: string;
  modelUsed: string;
  viaGateway: boolean;
  error?: string;
}

interface SavedReply {
  id: string;
  question: string;
  reply: string;
  tone: string;
  time: string;
  modelUsed: string;
}

const CONTEXT_PRESETS = [
  {
    label: "Horário e Entrega Expressa",
    text: "Atendemos de segunda a sábado das 08h às 20h. Entregas expressas no mesmo dia para pedidos confirmados até as 17h.",
  },
  {
    label: "Política de Trocas e Devoluções",
    text: "Trocas garantidas em até 30 dias com etiqueta e comprovante de compra. Primeira troca com frete cortesia da loja.",
  },
  {
    label: "Formas de Pagamento",
    text: "Aceitamos Pix à vista com 5% de desconto, cartões de crédito em até 6x sem juros e dinheiro na retirada em loja física.",
  },
  {
    label: "Garantia e Originalidade",
    text: "Todos os nossos produtos são 100% originais com nota fiscal e garantia do fabricante por 12 meses.",
  },
];

const TONE_OPTIONS = [
  { id: "cordial", label: "Cordial & Acolhedor", desc: "Empatia e proximidade com o cliente" },
  { id: "comercial", label: "Comercial & Vendas", desc: "Estímulo ao fechamento da compra" },
  { id: "direto", label: "Direto & Objetivo", desc: "Sem rodeios, rápido e prático" },
  { id: "tecnico", label: "Técnico & Detalhado", desc: "Especificações precisas e normas" },
] as const;

function RespostasIaPage() {
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<"cordial" | "comercial" | "direto" | "tecnico">("cordial");
  const [loading, setLoading] = useState(false);
  const [currentReply, setCurrentReply] = useState<string | null>(null);
  const [modelInfo, setModelInfo] = useState<{ model: string; gateway: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<SavedReply[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || question.trim().length < 3) {
      setErrorMsg("Por favor, descreva a dúvida do cliente (mínimo de 3 caracteres).");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await api<SuggestReplyResponse>("/api/ai/suggest-reply", {
        method: "POST",
        body: JSON.stringify({
          question: question.trim(),
          context: context.trim() || undefined,
          tone,
        }),
      });

      if (res.ok && res.reply) {
        setCurrentReply(res.reply);
        setModelInfo({ model: res.modelUsed, gateway: res.viaGateway });
        setCopied(false);

        const newEntry: SavedReply = {
          id: String(Date.now()),
          question: question.trim(),
          reply: res.reply,
          tone,
          time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          modelUsed: res.modelUsed,
        };
        setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);
      } else {
        setErrorMsg(res.error || "Não foi possível gerar a resposta no momento.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na comunicação com o assistente.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!currentReply) return;
    navigator.clipboard.writeText(currentReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <AppShell>
      <PageFrame
        title="Assistente de Respostas ao Cliente"
        description="Descreva a dúvida recebida no balcão ou WhatsApp e receba uma resposta recomendada com contexto da loja via AI Gateway."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA ESQUERDA: FORMULÁRIO DE ENTRADA */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleGenerate} className="rounded-2xl border border-border/70 bg-card p-6 sm:p-8 space-y-6 shadow-sm">
              
              {/* CAMPO: DÚVIDA DO CLIENTE */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Dúvida ou Mensagem do Cliente *</span>
                  <span className="text-[11px] font-mono text-muted-foreground/60">{question.length}/3000</span>
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ex: O cliente quer saber se entregamos no centro ainda hoje e quais são as formas de pagamento aceitas para pedidos urgentes..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-y"
                />
              </div>

              {/* CAMPO: CONTEXTO DA LOJA / POLÍTICAS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Contexto da Loja / Regras Comerciais (Opcional)
                  </label>
                  <span className="text-[11px] text-primary/80 font-medium">Atalhos rápidos:</span>
                </div>

                {/* BOTÕES DE ATALHO DE CONTEXTO */}
                <div className="flex flex-wrap gap-2">
                  {CONTEXT_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setContext((prev) => (prev ? `${prev}\n${preset.text}` : preset.text))}
                      className="px-3 py-1 rounded-full text-[11px] font-medium border border-border bg-background/80 hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Informe horários, prazos, preços, políticas de troca ou regras que o modelo deve respeitar..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-y"
                />
              </div>

              {/* SELEÇÃO DO TOM DE VOZ */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tom da Resposta Sugerida
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        tone === t.id
                          ? "border-primary bg-primary/10 text-foreground font-semibold"
                          : "border-border bg-background/50 hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div className="text-xs">{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* FEEDBACK DE ERRO */}
              {errorMsg && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">
                  {errorMsg}
                </div>
              )}

              {/* BOTÃO DE AÇÃO */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="w-full h-12 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Processando via AI Gateway...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Gerar Resposta Sugerida</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* COLUNA DIREITA: RESULTADO DA RESPOSTA SUGERIDA */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* CARD DE RESPOSTA ATIVA */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 space-y-5 shadow-sm min-h-[380px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Resposta Recomendada
                    </span>
                  </div>
                  {modelInfo && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-border bg-muted/60 text-muted-foreground">
                      {modelInfo.gateway ? "AI Gateway" : "Modelo Direto"} · {modelInfo.model}
                    </span>
                  )}
                </div>

                {currentReply ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-background border border-border/70 text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground">
                      {currentReply}
                    </div>
                  </div>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
                    <MessageSquare className="w-8 h-8 opacity-40" />
                    <p className="text-xs max-w-xs">
                      Preencha a dúvida do cliente ao lado e clique em gerar para ver uma resposta pronta para envio.
                    </p>
                  </div>
                )}
              </div>

              {currentReply && (
                <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-muted-foreground">
                    {currentReply.length} caracteres
                  </span>
                  <Button
                    type="button"
                    variant={copied ? "default" : "outline"}
                    onClick={handleCopy}
                    className="h-10 px-5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Resposta</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* HISTÓRICO RECENTE DA SESSÃO */}
            {history.length > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card/60 p-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Histórico da Sessão
                  </span>
                  <span>{history.length} geradas</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setCurrentReply(item.reply)}
                      className="p-3 rounded-xl border border-border/40 bg-background/60 hover:bg-background hover:border-primary/40 cursor-pointer transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-foreground truncate max-w-[200px]">
                          {item.question}
                        </span>
                        <span className="text-muted-foreground font-mono">{item.time}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{item.reply}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </PageFrame>
    </AppShell>
  );
}
