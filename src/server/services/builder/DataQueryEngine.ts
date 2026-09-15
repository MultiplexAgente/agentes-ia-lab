import { store, supabase } from '../../config/database';
import { UIComponent, Expense, Order, Customer, Product } from '../../types/index';

export interface ComponentDataResult {
  componentId: string;
  value?: number | string;
  formattedValue?: string;
  changePercentage?: number;
  statusText?: string;
  chartData?: Array<{ label: string; value: number; secondaryValue?: number; category?: string }>;
  tableRows?: any[];
  totalRows?: number;
}

export class DataQueryEngine {
  /**
   * Executa consultas seguras para todos os componentes de um módulo de acordo com o período
   */
  public static async executeModuleQueries(params: {
    companyId: string;
    components: UIComponent[];
    period?: 'today' | '7d' | '30d' | 'month' | 'all';
    search?: string;
  }): Promise<Record<string, ComponentDataResult>> {
    const { companyId, components, period = 'month', search = '' } = params;
    const results: Record<string, ComponentDataResult> = {};

    // 1. Carrega dados do tenant (InMemoryStore com sincronização/fallback Supabase)
    const companyOrders = store.orders.get(companyId) || [];
    const companyExpenses = store.expenses.get(companyId) || [];
    const companyCustomers = store.customers.get(companyId) || [];
    const companyProducts = store.products.get(companyId) || [];

    // 2. Filtro temporal
    const now = new Date();
    const filterByDate = (dateStr?: string) => {
      if (!dateStr || period === 'all') return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return true;
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
      if (period === 'today') return diffDays <= 1;
      if (period === '7d') return diffDays <= 7;
      if (period === '30d') return diffDays <= 30;
      if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true;
    };

    const filteredOrders = companyOrders.filter(o => filterByDate(o.created_at));
    const paidOrders = filteredOrders.filter(o => o.payment_status === 'paid');
    const filteredExpenses = companyExpenses.filter(e => filterByDate(e.due_date || e.created_at));

    // Cálculos financeiros consolidados reais
    const totalRevenue = paidOrders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const avgTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

    // Helper: aggregate orders by date label (last N days)
    const buildDailyChart = (orders: typeof paidOrders, expenses: typeof filteredExpenses, days = 7) => {
      const points: Array<{ label: string; value: number; secondaryValue?: number }> = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
        const rev = orders.filter(o => { const t = new Date(o.created_at || ''); return t >= dayStart && t <= dayEnd; }).reduce((a, o) => a + Number(o.total_amount || 0), 0);
        const exp = expenses.filter(e => { const t = new Date(e.due_date || e.created_at || ''); return t >= dayStart && t <= dayEnd; }).reduce((a, e) => a + Number(e.amount || 0), 0);
        points.push({ label, value: rev, secondaryValue: exp });
      }
      return points;
    };

    // 3. Processa cada componente individualmente
    for (const comp of components) {
      try {
        const titleLower = (comp.title || '').toLowerCase();
        const dataSource = (comp.dataSource || '').toLowerCase();

        // ── COMPONENTE: METRIC / KPI ──
        if (comp.type === 'metric' || comp.type === 'kpi') {
          // FATURAMENTO
          if (titleLower.includes('faturamento') || titleLower.includes('receita') || (dataSource === 'payments' && !titleLower.includes('metodo') && !titleLower.includes('pagamento'))) {
            results[comp.id] = {
              componentId: comp.id,
              value: totalRevenue,
              formattedValue: totalRevenue > 0 ? `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Sem dados',
              statusText: paidOrders.length > 0 ? `${paidOrders.length} pagamentos confirmados` : 'Nenhum pagamento registrado'
            };
          }
          // DESPESAS
          else if (titleLower.includes('despesa') || titleLower.includes('custo') || dataSource === 'expenses') {
            results[comp.id] = {
              componentId: comp.id,
              value: totalExpenses,
              formattedValue: totalExpenses > 0 ? `R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Sem dados',
              statusText: filteredExpenses.length > 0 ? `${filteredExpenses.length} contas lançadas` : 'Nenhuma despesa registrada'
            };
          }
          // LUCRO LÍQUIDO
          else if (titleLower.includes('lucro') || titleLower.includes('margem')) {
            results[comp.id] = {
              componentId: comp.id,
              value: netProfit,
              formattedValue: (totalRevenue > 0 || totalExpenses > 0) ? `R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Sem dados',
              statusText: totalRevenue > 0 ? (netProfit >= 0 ? `Margem líquida de ${profitMargin.toFixed(1)}%` : 'Prejuízo operacional') : 'Sem dados suficientes'
            };
          }
          // PEDIDOS PAGOS
          else if (titleLower.includes('pedido') || dataSource === 'orders') {
            const aggType = comp.aggregation || 'count';
            if (aggType === 'avg') {
              results[comp.id] = {
                componentId: comp.id,
                value: avgTicket,
                formattedValue: avgTicket > 0 ? `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Sem dados',
                statusText: paidOrders.length > 0 ? `Média por pedido concluído` : 'Nenhum pedido pago'
              };
            } else {
              results[comp.id] = {
                componentId: comp.id,
                value: paidOrders.length,
                formattedValue: String(paidOrders.length),
                statusText: filteredOrders.length - paidOrders.length > 0 ? `${filteredOrders.length - paidOrders.length} aguardando pagamento` : 'Todos os pedidos pagos'
              };
            }
          }
          // TICKET MÉDIO (by title)
          else if (titleLower.includes('ticket') || titleLower.includes('médio') || titleLower.includes('medio')) {
            results[comp.id] = {
              componentId: comp.id,
              value: avgTicket,
              formattedValue: avgTicket > 0 ? `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Sem dados',
              statusText: paidOrders.length > 0 ? 'Média por pedido concluído' : 'Nenhum pedido pago'
            };
          }
          // CLIENTES
          else if (titleLower.includes('cliente') || dataSource === 'customers') {
            results[comp.id] = {
              componentId: comp.id,
              value: companyCustomers.length,
              formattedValue: companyCustomers.length > 0 ? String(companyCustomers.length) : '0',
              statusText: companyCustomers.length > 0 ? 'Clientes cadastrados' : 'Nenhum cliente registrado'
            };
          }
          // PRODUTOS
          else if (titleLower.includes('produto') || titleLower.includes('preco') || titleLower.includes('preço') || dataSource === 'products') {
            const aggType = comp.aggregation || 'count';
            if (aggType === 'avg') {
              const avgPrice = companyProducts.length > 0 ? companyProducts.reduce((a, p) => a + Number(p.price || 0), 0) / companyProducts.length : 0;
              results[comp.id] = { componentId: comp.id, value: avgPrice, formattedValue: avgPrice > 0 ? `R$ ${avgPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Sem dados', statusText: 'Preço médio dos produtos' };
            } else {
              results[comp.id] = { componentId: comp.id, value: companyProducts.length, formattedValue: String(companyProducts.length), statusText: companyProducts.length > 0 ? 'Itens no catálogo' : 'Nenhum produto cadastrado' };
            }
          }
          else {
            results[comp.id] = { componentId: comp.id, value: 0, formattedValue: '0', statusText: 'Sem dados disponíveis' };
          }
        }

        // ── COMPONENTE: CHART (GRÁFICO) — apenas dados reais, zero invenção ──
        else if (comp.type === 'chart') {
          const chartType = comp.chartType || 'line';

          // Gráfico de linha/barra: Faturamento x Despesas por dia (dados reais)
          if (titleLower.includes('faturamento') || titleLower.includes('desempenho') || titleLower.includes('financeir') || titleLower.includes('lucro') || titleLower.includes('evolucao') || titleLower.includes('evolução')) {
            const dailyData = buildDailyChart(paidOrders, filteredExpenses, 7);
            const hasAnyData = dailyData.some(d => d.value > 0 || (d.secondaryValue || 0) > 0);
            results[comp.id] = {
              componentId: comp.id,
              chartData: hasAnyData ? dailyData : []
            };
          }
          // Donut / Pie: Métodos de pagamento reais
          else if (chartType === 'pie' || chartType === 'donut' || titleLower.includes('pagamento') || titleLower.includes('metodo') || titleLower.includes('método') || titleLower.includes('canal')) {
            const pixTotal = paidOrders.filter(o => o.payment_method === 'PIX').reduce((a, b) => a + Number(b.total_amount), 0);
            const cardCreditTotal = paidOrders.filter(o => (o.payment_method || '').includes('Crédito') || (o.payment_method || '').includes('Credito')).reduce((a, b) => a + Number(b.total_amount), 0);
            const cardDebitTotal = paidOrders.filter(o => (o.payment_method || '').includes('Débito') || (o.payment_method || '').includes('Debito')).reduce((a, b) => a + Number(b.total_amount), 0);
            const otherTotal = paidOrders.filter(o => !['PIX'].includes(o.payment_method || '') && !(o.payment_method || '').includes('Crédito') && !(o.payment_method || '').includes('Débito') && !(o.payment_method || '').includes('Cartão')).reduce((a, b) => a + Number(b.total_amount), 0);
            const rawData = [
              { label: 'PIX', value: pixTotal, category: '#10b981' },
              { label: 'Cartão de Crédito', value: cardCreditTotal, category: '#6366f1' },
              { label: 'Cartão de Débito', value: cardDebitTotal, category: '#06b6d4' },
              { label: 'Outros', value: otherTotal, category: '#f59e0b' }
            ].filter(d => d.value > 0);
            results[comp.id] = { componentId: comp.id, chartData: rawData };
          }
          // Gráfico genérico: contagem de pedidos por dia
          else {
            const dailyOrderCount = buildDailyChart(paidOrders, [], 7).map(d => ({ label: d.label, value: d.value > 0 ? 1 : 0 }));
            // Count actual orders per day
            const ordersPerDay: Array<{ label: string; value: number }> = [];
            for (let i = 6; i >= 0; i--) {
              const d = new Date(now);
              d.setDate(d.getDate() - i);
              const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
              const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
              const cnt = filteredOrders.filter(o => { const t = new Date(o.created_at || ''); return t >= dayStart && t <= dayEnd; }).length;
              ordersPerDay.push({ label, value: cnt });
            }
            results[comp.id] = { componentId: comp.id, chartData: ordersPerDay.some(d => d.value > 0) ? ordersPerDay : [] };
          }
        }

        // ── COMPONENTE: TABLE (TABELA) ──
        else if (comp.type === 'table') {
          // TABELA DE CLIENTES
          if (titleLower.includes('cliente') || dataSource === 'customers') {
            const customerMapOrders = new Map<string, number>();
            paidOrders.forEach(o => {
              const current = customerMapOrders.get(o.customer_id) || 0;
              customerMapOrders.set(o.customer_id, current + Number(o.total_amount));
            });

            const rows = companyCustomers.map(c => ({
              id: c.id,
              name: c.name,
              phone: c.phone || '—',
              email: c.email || '—',
              total_orders: c.total_orders || 0,
              total_spent: customerMapOrders.has(c.id) ? `R$ ${(customerMapOrders.get(c.id) || 0).toFixed(2)}` : '—',
              created_at: new Date(c.created_at || Date.now()).toLocaleDateString('pt-BR'),
              status: 'Ativo'
            })).filter(r => {
              if (!search) return true;
              return r.name.toLowerCase().includes(search.toLowerCase()) || 
                     (r.phone && r.phone.includes(search)) || 
                     (r.email && r.email.toLowerCase().includes(search.toLowerCase()));
            });

            results[comp.id] = {
              componentId: comp.id,
              tableRows: rows,
              totalRows: rows.length
            };
          }
          // TABELA DE PEDIDOS PAGOS / TRANSAÇÕES
          else if (titleLower.includes('pedido') || titleLower.includes('transa') || dataSource === 'orders' || dataSource === 'payments') {
            const customerNames = new Map(companyCustomers.map(c => [c.id, c.name]));
            const rows = filteredOrders.map(o => ({
              id: o.id,
              customer_name: customerNames.get(o.customer_id) || 'Cliente Delivery',
              total_amount: `R$ ${(Number(o.total_amount) || Number(o.total) || 0).toFixed(2)}`,
              payment_method: o.payment_method || 'PIX',
              status: o.payment_status === 'paid' ? 'Pago' : 'Pendente',
              delivery_address: typeof o.delivery_address === 'string' ? o.delivery_address : 'Retirada no Balcão',
              date: new Date(o.created_at || Date.now()).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
            })).filter(r => {
              if (!search) return true;
              return r.customer_name.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()) || r.payment_method.toLowerCase().includes(search.toLowerCase());
            });

            results[comp.id] = {
              componentId: comp.id,
              tableRows: rows,
              totalRows: rows.length
            };
          }
          // TABELA DE DESPESAS
          else if (titleLower.includes('despesa') || dataSource === 'expenses') {
            const rows = filteredExpenses.map(e => ({
              id: e.id,
              title: e.title,
              category: e.category,
              amount: `R$ ${Number(e.amount).toFixed(2)}`,
              due_date: new Date(e.due_date).toLocaleDateString('pt-BR'),
              status: e.status === 'paid' ? 'Quitada' : 'A Vencer'
            }));

            results[comp.id] = {
              componentId: comp.id,
              tableRows: rows,
              totalRows: rows.length
            };
          }
          // TABELA DE PRODUTOS
          else {
            const rows = companyProducts.map(p => ({
              id: p.id,
              name: p.name,
              price: `R$ ${Number(p.price).toFixed(2)}`,
              category: p.category || 'Geral',
              status: p.active ? 'Disponível' : 'Indisponível'
            }));

            results[comp.id] = {
              componentId: comp.id,
              tableRows: rows,
              totalRows: rows.length
            };
          }
        }
      } catch (err) {
        console.error(`Erro ao consultar dados para componente ${comp.id}:`, err);
      }
    }

    return results;
  }
}
