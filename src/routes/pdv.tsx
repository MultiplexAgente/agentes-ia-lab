import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Barcode,
  Boxes,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Lock,
  Minus,
  Plus,
  Printer,
  QrCode,
  Receipt,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  Unlock,
  User,
  X,
} from "lucide-react";

import { AppShell } from "@/components/multiplex/AppShell";
import { PageFrame, useCompanyData } from "@/components/multiplex/DataPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, money } from "@/lib/multiplex/client";
import { PdvCartManager, type CartItem, type PaymentMethod } from "@/lib/commerce/pdv/cart";
import { formatBrl } from "@/lib/commerce/pdv/money";
import type { CashSession } from "@/lib/commerce/pdv/cash-register";
import type { CheckoutResult } from "@/lib/commerce/pdv/transaction.server";

interface WorkspaceProduct {
  id: string;
  name: string;
  price: number | string | null;
  available: boolean | null;
  segment?: string | null;
  barcode_ean?: string | null;
  sku?: string | null;
  unit_of_measure?: string | null;
  current_stock?: number | null;
}

interface WorkspaceData {
  products: WorkspaceProduct[];
  categories: Array<{ id: string; name: string }>;
}

export const Route = createFileRoute("/pdv")({
  head: () => ({
    meta: [
      { title: "HUG POS | Frente de Caixa" },
      { name: "description", content: "HUG POS - Frente de caixa ágil e multissegmento by BonaSoft." },
      { property: "og:title", content: "HUG POS | Frente de Caixa by BonaSoft" },
      { property: "og:description", content: "HUG POS - Ponto de Venda ágil e multissegmento by BonaSoft." },
    ],
  }),
  component: PdvPage,
});

function PdvPage() {
  const { data: wsData, loading: wsLoading, reload: reloadWs } = useCompanyData<WorkspaceData>("/api/company/workspace");
  const products = wsData?.products ?? [];
  const categories = wsData?.categories ?? [];

  // Terminal & Caixa
  const [terminalCode, setTerminalCode] = useState<string>("CAIXA-01");
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState<boolean>(true);

  // Carrinho
  const [cartManager] = useState<PdvCartManager>(() => new PdvCartManager());
  const [cartVersion, setCartVersion] = useState<number>(0);
  const bumpCart = () => setCartVersion((v) => v + 1);

  // Leitor e busca
  const [barcodeQuery, setBarcodeQuery] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [scannerFeedback, setScannerFeedback] = useState<{ text: string; error?: boolean } | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cliente
  const [customerName, setCustomerName] = useState<string>("Consumidor Final");

  // Modais
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);
  const [openSessionModalOpen, setOpenSessionModalOpen] = useState<boolean>(false);
  const [movementModalOpen, setMovementModalOpen] = useState<boolean>(false);
  const [closeSessionModalOpen, setCloseSessionModalOpen] = useState<boolean>(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState<boolean>(false);
  const [salesHistoryOpen, setSalesHistoryOpen] = useState<boolean>(false);

  // Estados dos formulários de modais
  const [initialCashInput, setInitialCashInput] = useState<string>("100,00");
  const [movementType, setMovementType] = useState<"SANGRIA" | "SUPRIMENTO">("SANGRIA");
  const [movementAmountInput, setMovementAmountInput] = useState<string>("");
  const [movementReasonInput, setMovementReasonInput] = useState<string>("");
  const [countedCashInput, setCountedCashInput] = useState<string>("");
  const [closingNotesInput, setClosingNotesInput] = useState<string>("");

  // Pagamento no checkout
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("money");
  const [receivedCashInput, setReceivedCashInput] = useState<string>("");
  const [splitPayments, setSplitPayments] = useState<Array<{ method: PaymentMethod; amount: number; receivedAmount?: number }>>([]);
  const [isSubmittingSale, setIsSubmittingSale] = useState<boolean>(false);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [lastCompletedSale, setLastCompletedSale] = useState<CheckoutResult | null>(null);

  // Carrega status da sessão de caixa
  const loadCashSession = async () => {
    setSessionLoading(true);
    try {
      const res = await api<{ session: CashSession | null }>(`/api/company/pdv/session?terminal=${terminalCode}`);
      setCashSession(res.session);
    } catch {
      setCashSession(null);
    } finally {
      setSessionLoading(false);
    }
  };

  useEffect(() => {
    loadCashSession();
  }, [terminalCode]);

  // Foco no leitor de código de barras
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [cartVersion, checkoutModalOpen, receiptModalOpen]);

  // Produtos filtrados na grade
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => p.available !== false);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode_ean && p.barcode_ean.toLowerCase().includes(q)) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    return list;
  }, [products, searchQuery, selectedCategory]);

  // Leitor de código de barras (ao teclar Enter)
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = barcodeQuery.trim();
    if (!code) return;

    // Busca produto por código de barras, SKU ou ID exato
    const match = products.find(
      (p) =>
        p.available !== false &&
        (p.barcode_ean === code ||
          p.sku === code ||
          p.id === code ||
          p.name.toLowerCase() === code.toLowerCase())
    );

    if (match) {
      cartManager.addItem({
        id: match.id,
        name: match.name,
        price: Number(match.price || 0),
        unit: match.unit_of_measure || "UN",
        barcode: match.barcode_ean,
        sku: match.sku,
      });
      bumpCart();
      setScannerFeedback({ text: `+ 1x ${match.name}` });
      setBarcodeQuery("");
    } else {
      setScannerFeedback({ text: `Código ${code} não encontrado no catálogo.`, error: true });
    }

    setTimeout(() => {
      setScannerFeedback(null);
    }, 3000);
  };

  // Totais do carrinho
  const totals = useMemo(() => {
    // dependência de cartVersion força recálculo
    void cartVersion;
    return cartManager.calculateTotals();
  }, [cartManager, cartVersion]);

  // Abertura de caixa
  const handleOpenCashSession = async () => {
    const val = parseFloat(initialCashInput.replace(".", "").replace(",", ".")) || 0;
    try {
      const res = await api<{ session: CashSession }>("/api/company/pdv/session", {
        method: "POST",
        body: JSON.stringify({
          action: "open",
          terminalCode,
          initialCashAmount: val,
        }),
      });
      setCashSession(res.session);
      setOpenSessionModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Erro ao abrir o caixa.");
    }
  };

  // Movimentação de caixa (sangria/suprimento)
  const handleMovementSubmit = async () => {
    const val = parseFloat(movementAmountInput.replace(".", "").replace(",", ".")) || 0;
    if (val <= 0) {
      alert("Informe um valor válido.");
      return;
    }
    if (!movementReasonInput.trim()) {
      alert("Informe a justificativa.");
      return;
    }

    try {
      await api("/api/company/pdv/session", {
        method: "POST",
        body: JSON.stringify({
          action: "movement",
          terminalCode,
          movementType,
          amount: val,
          reason: movementReasonInput,
        }),
      });
      setMovementAmountInput("");
      setMovementReasonInput("");
      setMovementModalOpen(false);
      await loadCashSession();
    } catch (err: any) {
      alert(err.message || "Erro ao registrar movimentação.");
    }
  };

  // Fechamento de caixa
  const handleCloseSession = async () => {
    const val = parseFloat(countedCashInput.replace(".", "").replace(",", ".")) || 0;
    try {
      const res = await api<{ session: CashSession }>("/api/company/pdv/session", {
        method: "POST",
        body: JSON.stringify({
          action: "close",
          terminalCode,
          countedCash: val,
          notes: closingNotesInput,
        }),
      });
      setCashSession(null);
      setCloseSessionModalOpen(false);
      alert(
        `Caixa fechado com sucesso!\nEsperado: ${formatBrl(res.session.closingReport?.expectedCash ?? 0)}\nContado: ${formatBrl(
          res.session.closingReport?.countedCash ?? 0
        )}\nDivergência: ${formatBrl(res.session.closingReport?.divergence ?? 0)}`
      );
    } catch (err: any) {
      alert(err.message || "Erro ao fechar caixa.");
    }
  };

  // Finalizar venda (Checkout)
  const handleFinishSale = async () => {
    if (cartManager.items.length === 0) {
      alert("Adicione produtos ao carrinho.");
      return;
    }

    setIsSubmittingSale(true);
    setSaleError(null);

    try {
      const idempotencyKey = `pdv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      // Monta meios de pagamento
      let paymentsToSend: Array<{ method: string; amount: number }> = [];

      if (splitPayments.length > 0) {
        paymentsToSend = splitPayments.map((p) => ({ method: p.method, amount: p.amount }));
      } else {
        const received =
          paymentMethod === "money"
            ? parseFloat(receivedCashInput.replace(".", "").replace(",", ".")) || totals.total
            : totals.total;

        paymentsToSend = [{ method: paymentMethod, amount: received }];
      }

      const payload = {
        idempotencyKey,
        terminalCode,
        customerId: null, // Consumidor Final auto-resolvido
        items: cartManager.items.map((it) => ({
          productId: it.id,
          quantity: it.quantity,
          discountCents: Math.round(it.discount * 100),
        })),
        payments: paymentsToSend,
        generalDiscountCents: Math.round(totals.generalDiscount * 100),
        notes: `Venda balcão - ${customerName}`,
      };

      const res = await api<{ success: boolean; transaction: CheckoutResult }>("/api/company/pdv/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setLastCompletedSale(res.transaction);
      cartManager.clearCart();
      bumpCart();
      setCheckoutModalOpen(false);
      setSplitPayments([]);
      setReceivedCashInput("");
      setReceiptModalOpen(true);
      await loadCashSession();
    } catch (err: any) {
      setSaleError(err.message || "Erro ao processar a venda.");
    } finally {
      setIsSubmittingSale(false);
    }
  };

  return (
    <AppShell>
      <PageFrame
        title="HUG POS"
        description="Frente de caixa ágil e registro transacional de vendas by BonaSoft"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={terminalCode}
              onChange={(e) => setTerminalCode(e.target.value)}
              className="h-9 px-3 text-xs font-semibold rounded-md border bg-background text-foreground shadow-sm"
            >
              <option value="CAIXA-01">Terminal: CAIXA-01</option>
              <option value="CAIXA-02">Terminal: CAIXA-02</option>
              <option value="BALCAO-01">Terminal: BALCAO-01</option>
            </select>

            {cashSession?.status === "OPEN" ? (
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                  <Unlock className="w-3 h-3" /> Caixa Aberto
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMovementModalOpen(true)}
                  className="h-8 text-xs gap-1"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Sangria/Suprimento
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCloseSessionModalOpen(true)}
                  className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
                >
                  <Lock className="w-3.5 h-3.5" /> Fechar Caixa
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1">
                  <Lock className="w-3 h-3" /> Caixa Fechado
                </Badge>
                <Button
                  size="sm"
                  onClick={() => setOpenSessionModalOpen(true)}
                  className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Unlock className="w-3.5 h-3.5" /> Abrir Caixa
                </Button>
              </div>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-180px)] min-h-[600px]">
          {/* COLUNA ESQUERDA: LEITOR DE CÓDIGO DE BARRAS & CATÁLOGO */}
          <div className="lg:col-span-7 flex flex-col gap-3 h-full">
            {/* BARRA DO LEITOR */}
            <form onSubmit={handleBarcodeSubmit} className="relative">
              <div className="flex items-center gap-2 p-2 rounded-lg border bg-card shadow-sm">
                <Barcode className="w-6 h-6 text-primary ml-1 shrink-0" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeQuery}
                  onChange={(e) => setBarcodeQuery(e.target.value)}
                  placeholder="Escaneie o código de barras ou digite o EAN/SKU e tecle Enter..."
                  className="flex-1 bg-transparent border-0 text-sm font-medium focus:outline-none placeholder:text-muted-foreground"
                />
                <Button type="submit" size="sm" className="h-8 text-xs shrink-0">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                </Button>
              </div>
              {scannerFeedback && (
                <div
                  className={`absolute top-full left-0 right-0 mt-1 p-2 rounded text-xs font-semibold shadow-md z-10 transition-all ${
                    scannerFeedback.error
                      ? "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200"
                  }`}
                >
                  {scannerFeedback.text}
                </div>
              )}
            </form>

            {/* FILTROS E BUSCA POR TEXTO */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar produto pelo nome ou descrição..."
                  className="w-full h-9 pl-9 pr-3 text-xs rounded-md border bg-background text-foreground"
                />
              </div>
            </div>

            {/* GRADE DE PRODUTOS PARA TOQUE / CLIQUE RÁPIDO */}
            <div className="flex-1 overflow-y-auto border rounded-lg bg-card p-3 shadow-inner">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-xs">
                  <Boxes className="w-8 h-8 mb-2 opacity-50" />
                  Nenhum produto encontrado no catálogo.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        cartManager.addItem({
                          id: p.id,
                          name: p.name,
                          price: Number(p.price || 0),
                          unit: p.unit_of_measure || "UN",
                          barcode: p.barcode_ean,
                          sku: p.sku,
                        });
                        bumpCart();
                      }}
                      className="flex flex-col justify-between p-2.5 rounded-lg border bg-background/50 hover:bg-accent/40 hover:border-primary transition-all text-left group shadow-xs active:scale-95"
                    >
                      <div>
                        <div className="font-semibold text-xs line-clamp-2 text-foreground group-hover:text-primary">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {p.unit_of_measure || "UN"}
                          </span>
                          {p.current_stock != null && (
                            <span className="text-[10px] text-muted-foreground">
                              • Est: {p.current_stock}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 pt-1 border-t text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {formatBrl(Number(p.price || 0))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: CUPOM / CARRINHO DE COMPRAS & FINALIZAÇÃO */}
          <div className="lg:col-span-5 flex flex-col h-full border rounded-lg bg-card shadow-sm overflow-hidden">
            {/* CABEÇALHO DO CARRINHO */}
            <div className="p-3 border-b bg-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Carrinho da Venda</span>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  {cartManager.items.length} {cartManager.items.length === 1 ? "item" : "itens"}
                </Badge>
              </div>

              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Cliente"
                  className="h-6 w-32 px-1.5 text-[11px] rounded border bg-background"
                  title="Nome do Cliente (padrão: Consumidor Final)"
                />
              </div>
            </div>

            {/* LISTA DE ITENS DO CARRINHO */}
            <div className="flex-1 overflow-y-auto p-2 divide-y">
              {cartManager.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs py-12">
                  <ShoppingCart className="w-10 h-10 mb-2 opacity-30" />
                  Carrinho vazio. Escaneie um código ou clique nos produtos ao lado.
                </div>
              ) : (
                cartManager.items.map((item, idx) => (
                  <div key={item.id + idx} className="py-2 flex items-center justify-between gap-2 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{item.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {item.quantity} x {formatBrl(item.unitPrice)}
                        {item.discount > 0 && (
                          <span className="text-rose-500 ml-1">(-{formatBrl(item.discount)})</span>
                        )}
                      </div>
                    </div>

                    {/* CONTROLES DE QUANTIDADE */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const newQty = item.quantity > 1 ? item.quantity - 1 : 0;
                          cartManager.updateQuantity(idx, newQty);
                          bumpCart();
                        }}
                        className="w-6 h-6 rounded border flex items-center justify-center hover:bg-muted"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          cartManager.updateQuantity(idx, val);
                          bumpCart();
                        }}
                        className="w-12 h-6 text-center text-xs font-semibold rounded border bg-background"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          cartManager.updateQuantity(idx, item.quantity + 1);
                          bumpCart();
                        }}
                        className="w-6 h-6 rounded border flex items-center justify-center hover:bg-muted"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="w-20 text-right font-bold text-foreground shrink-0">
                      {formatBrl(item.itemTotal)}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        cartManager.removeItem(idx);
                        bumpCart();
                      }}
                      className="text-muted-foreground hover:text-rose-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* RESUMO DE VALORES E TOTALIZADORES */}
            <div className="p-3 border-t bg-muted/20 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span>{formatBrl(totals.subtotal)}</span>
              </div>
              {totals.totalDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Descontos:</span>
                  <span>-{formatBrl(totals.totalDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-foreground pt-1 border-t">
                <span>Total a Pagar:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatBrl(totals.total)}</span>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO DO PDV */}
            <div className="p-3 border-t bg-card grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Deseja realmente cancelar e limpar o carrinho?")) {
                    cartManager.clearCart();
                    bumpCart();
                  }
                }}
                disabled={cartManager.items.length === 0}
                className="text-xs text-rose-600 hover:text-rose-700"
              >
                Limpar Carrinho
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setReceivedCashInput(totals.total.toFixed(2).replace(".", ","));
                  setCheckoutModalOpen(true);
                }}
                disabled={cartManager.items.length === 0}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
              >
                Finalizar Venda <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* MODAL DE CHECKOUT / PAGAMENTO */}
        {checkoutModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-base text-foreground">Pagamento e Fechamento</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* VALOR TOTAL DESTACADO */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Total da Venda
                </span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatBrl(totals.total)}
                </div>
              </div>

              {/* MEIOS DE PAGAMENTO */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "money", label: "Dinheiro", icon: Banknote },
                    { id: "pix", label: "PIX", icon: QrCode },
                    { id: "debit_card", label: "Débito", icon: CreditCard },
                    { id: "credit_card", label: "Crédito", icon: CreditCard },
                  ].map((m) => {
                    const Icon = m.icon;
                    const active = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background hover:bg-muted text-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SE FOR DINHEIRO: CÁLCULO DE TROCO AUTOMÁTICO */}
              {paymentMethod === "money" && (
                <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
                  <label className="text-xs font-medium text-foreground">Valor em Dinheiro Entregue (R$)</label>
                  <input
                    type="text"
                    value={receivedCashInput}
                    onChange={(e) => setReceivedCashInput(e.target.value)}
                    placeholder="Ex: 50,00"
                    className="w-full h-9 px-3 rounded-md border bg-background font-mono text-sm"
                  />
                  {(() => {
                    const rec = parseFloat(receivedCashInput.replace(".", "").replace(",", ".")) || 0;
                    const change = Math.max(0, rec - totals.total);
                    return (
                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="font-medium text-muted-foreground">Troco a devolver:</span>
                        <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {formatBrl(change)}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {saleError && (
                <div className="p-2.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {saleError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCheckoutModalOpen(false)}
                  disabled={isSubmittingSale}
                >
                  Voltar
                </Button>
                <Button
                  size="sm"
                  onClick={handleFinishSale}
                  disabled={isSubmittingSale}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                >
                  {isSubmittingSale ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Confirmar Venda
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE RECIBO / CUPOM TÉRMICO */}
        {receiptModalOpen && lastCompletedSale && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <h3 className="font-bold text-base text-foreground">Venda Concluída!</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReceiptModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* RECIBO FORMATADO EM FONTE MONOESPAÇADA */}
              <div className="p-3 rounded-lg border bg-muted/40 max-h-72 overflow-y-auto">
                <pre className="text-[11px] font-mono leading-tight whitespace-pre text-foreground">
                  {lastCompletedSale.receiptText}
                </pre>
              </div>

              <div className="flex justify-between items-center gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs"
                >
                  <Printer className="w-4 h-4" /> Imprimir Cupom
                </Button>

                <Button
                  size="sm"
                  onClick={() => setReceiptModalOpen(false)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold"
                >
                  Nova Venda
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE ABERTURA DE CAIXA */}
        {openSessionModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border rounded-xl shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Unlock className="w-4 h-4 text-emerald-600" /> Abertura de Caixa
                </h3>
                <button onClick={() => setOpenSessionModalOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Saldo Inicial / Fundo de Troco (R$)</label>
                <input
                  type="text"
                  value={initialCashInput}
                  onChange={(e) => setInitialCashInput(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm font-mono"
                  placeholder="0,00"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setOpenSessionModalOpen(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleOpenCashSession} className="bg-emerald-600 text-white">
                  Confirmar Abertura
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE MOVIMENTAÇÃO DE CAIXA (SANGRIA / SUPRIMENTO) */}
        {movementModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border rounded-xl shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-primary" /> Movimentação de Caixa
                </h3>
                <button onClick={() => setMovementModalOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType("SANGRIA")}
                  className={`flex-1 py-1.5 rounded border text-xs font-semibold ${
                    movementType === "SANGRIA"
                      ? "bg-rose-500/10 border-rose-500 text-rose-600"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  Sangria (Retirada)
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType("SUPRIMENTO")}
                  className={`flex-1 py-1.5 rounded border text-xs font-semibold ${
                    movementType === "SUPRIMENTO"
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-600"
                      : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  Suprimento (Reforço)
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Valor (R$)</label>
                <input
                  type="text"
                  value={movementAmountInput}
                  onChange={(e) => setMovementAmountInput(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-sm font-mono"
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Justificativa / Motivo</label>
                <input
                  type="text"
                  value={movementReasonInput}
                  onChange={(e) => setMovementReasonInput(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border bg-background text-xs"
                  placeholder="Ex: Pagamento de freteiro, envio de excedente ao cofre..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setMovementModalOpen(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleMovementSubmit}>
                  Registrar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE FECHAMENTO DE CAIXA */}
        {closeSessionModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-card border rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-rose-600" /> Fechamento de Caixa
                </h3>
                <button onClick={() => setCloseSessionModalOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fundo de Troco Inicial:</span>
                    <span className="font-semibold">{formatBrl(cashSession?.initialCashAmount ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendas em Dinheiro:</span>
                    <span className="font-semibold text-emerald-600">
                      +{formatBrl(cashSession?.salesSummary?.cashTotal ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendas em Cartão / PIX:</span>
                    <span className="font-semibold">
                      +{formatBrl(
                        (cashSession?.salesSummary?.creditCardTotal ?? 0) +
                          (cashSession?.salesSummary?.debitCardTotal ?? 0) +
                          (cashSession?.salesSummary?.pixTotal ?? 0)
                      )}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-xs font-semibold text-foreground">
                    Dinheiro em Espécie Contado na Gaveta (R$)
                  </label>
                  <input
                    type="text"
                    value={countedCashInput}
                    onChange={(e) => setCountedCashInput(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border bg-background text-sm font-mono"
                    placeholder="Ex: 350,00"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Observações do Fechamento</label>
                  <input
                    type="text"
                    value={closingNotesInput}
                    onChange={(e) => setClosingNotesInput(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border bg-background text-xs"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setCloseSessionModalOpen(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleCloseSession} className="bg-rose-600 hover:bg-rose-700 text-white">
                  Confirmar e Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </PageFrame>
    </AppShell>
  );
}
