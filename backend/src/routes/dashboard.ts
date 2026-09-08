import { Router, Request, Response } from 'express';
import { store } from '../config/database.js';

export const dashboardRouter = Router();
const DEFAULT_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

dashboardRouter.get('/', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || DEFAULT_COMPANY_ID;

  const conversations = Array.from(store.conversations.values()).filter(c => c.company_id === companyId);
  const customers = store.customers.get(companyId) || [];
  const orders = store.orders.get(companyId) || [];
  const expenses = store.expenses.get(companyId) || [];
  const products = store.products.get(companyId) || [];
  const catalogItems = Array.from(store.catalogItems.values()).filter(it => it.company_id === companyId);
  const catalogSearches = store.catalogSearches.filter(s => s.company_id === companyId);
  const catalogClicks = store.catalogClicks.filter(c => c.company_id === companyId);

  let totalMessages = 0;
  for (const msgs of store.messages.values()) {
    totalMessages += msgs.length;
  }

  const aiConversations = conversations.filter(c => c.status !== 'HUMAN_ACTIVE').length;
  const humanConversations = conversations.filter(c => c.status === 'HUMAN_ACTIVE' || c.status === 'WAITING_HUMAN').length;
  const totalChats = conversations.length || 1;
  const aiAutomationRate = Number(((aiConversations / totalChats) * 100).toFixed(1));

  // Cálculo financeiro real
  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total_amount || curr.total || 0), 0);
  const deliveredOrders = orders.filter(o => o.status === 'delivered' || o.status === 'COMPLETED');
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'PENDING' || o.status === 'confirmed' || o.status === 'PREPARING');
  
  const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;
  const avgTicket = orders.length > 0 ? Number((totalRevenue / orders.length).toFixed(2)) : 0;
  const conversionRate = conversations.length > 0 ? Number(((orders.length / conversations.length) * 100).toFixed(1)) : 0;

  // Mapa de Clientes para enriquecer pedidos
  const customerMap = new Map(customers.map(c => [c.id, c]));

  // Pedidos Recentes com dados do cliente
  const recentOrdersEnriched = [...orders]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 8)
    .map(order => {
      const customer = customerMap.get(order.customer_id);
      return {
        id: order.id,
        customer_name: customer?.name || 'Cliente Avulso',
        customer_phone: customer?.phone || '-',
        total: order.total_amount || order.total || 0,
        status: order.status,
        payment_status: order.payment_status || 'paid',
        payment_method: order.payment_method || 'PIX',
        delivery_address: typeof order.delivery_address === 'string' ? order.delivery_address : 'Balcão / Retirada',
        created_at: order.created_at || new Date().toISOString()
      };
    });

  // Top Clientes
  const topCustomers = [...customers]
    .map(c => {
      const custOrders = orders.filter(o => o.customer_id === c.id);
      const totalSpent = custOrders.reduce((sum, o) => sum + (o.total_amount || o.total || 0), 0);
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        total_orders: c.total_orders || custOrders.length,
        total_spent: totalSpent
      };
    })
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 5);

  // Formas de Pagamento
  const paymentMethodsMap: Record<string, { count: number; total: number }> = {};
  for (const o of orders) {
    const method = o.payment_method || 'Outro';
    if (!paymentMethodsMap[method]) {
      paymentMethodsMap[method] = { count: 0, total: 0 };
    }
    paymentMethodsMap[method].count += 1;
    paymentMethodsMap[method].total += (o.total_amount || o.total || 0);
  }
  const paymentMethodsList = Object.entries(paymentMethodsMap).map(([method, data]) => ({
    method,
    count: data.count,
    total: Number(data.total.toFixed(2)),
    percentage: totalRevenue > 0 ? Number(((data.total / totalRevenue) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.total - a.total);

  // Categorias de Despesas
  const expensesByCategory: Record<string, number> = {};
  for (const exp of expenses) {
    expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
  }

  // Feed de Atividades Recentes
  const recentActivities = [
    ...orders.map(o => ({
      id: `act-order-${o.id}`,
      type: 'order',
      title: `Novo Pedido #${o.id.toUpperCase()}`,
      description: `R$ ${(o.total_amount || o.total || 0).toFixed(2)} via ${o.payment_method || 'PIX'}`,
      time: o.created_at || new Date().toISOString(),
      badge: o.status,
      badgeColor: o.status === 'delivered' ? '#10b981' : '#f59e0b'
    })),
    ...expenses.map(e => ({
      id: `act-exp-${e.id}`,
      type: 'expense',
      title: `Lançamento: ${e.title}`,
      description: `R$ ${e.amount.toFixed(2)} - ${e.category}`,
      time: e.paid_at || e.created_at || new Date().toISOString(),
      badge: e.status,
      badgeColor: '#ef4444'
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

  return res.json({
    metrics: {
      conversations_today: conversations.length,
      messages_today: totalMessages,
      customers_served: customers.length,
      ai_assisted_chats: aiConversations,
      human_assisted_chats: humanConversations,
      ai_automation_rate: aiAutomationRate,
      orders_created: orders.length,
      orders_delivered: deliveredOrders.length,
      orders_pending: pendingOrders.length,
      revenue_brl: totalRevenue,
      total_expenses_brl: totalExpenses,
      net_profit_brl: netProfit,
      profit_margin_percent: profitMargin,
      avg_ticket_brl: avgTicket,
      conversion_rate_percent: conversionRate,
      avg_response_time_seconds: 1.2,
      ai_cost_usd: 0.00,
      connected_channels: 2, // Web e Canais Omnichannel
      catalog_total_items: (products.length + catalogItems.length),
      catalog_searches_count: catalogSearches.length,
      catalog_clicks_count: catalogClicks.length
    },
    recent_orders: recentOrdersEnriched,
    top_customers: topCustomers,
    payment_methods: paymentMethodsList,
    expenses_by_category: Object.entries(expensesByCategory).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? Number(((amount / totalExpenses) * 100).toFixed(1)) : 0
    })),
    recent_activities: recentActivities
  });
});
