import { Router, Request, Response } from 'express';
import { store } from '../config/database.js';

export const dashboardRouter = Router();
const DEFAULT_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

dashboardRouter.get('/', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || DEFAULT_COMPANY_ID;

  const conversations = Array.from(store.conversations.values()).filter(c => c.company_id === companyId);
  const customers = store.customers.get(companyId) || [];
  const orders = store.orders.get(companyId) || [];

  let totalMessages = 0;
  for (const msgs of store.messages.values()) {
    totalMessages += msgs.length;
  }

  const aiConversations = conversations.filter(c => c.status !== 'HUMAN_ACTIVE').length;
  const humanConversations = conversations.filter(c => c.status === 'HUMAN_ACTIVE' || c.status === 'WAITING_HUMAN').length;

  const totalRevenue = orders.reduce((acc, curr) => acc + (curr.total || 0), 0);

  return res.json({
    metrics: {
      conversations_today: conversations.length,
      messages_today: totalMessages,
      customers_served: customers.length,
      ai_assisted_chats: aiConversations,
      human_assisted_chats: humanConversations,
      orders_created: orders.length,
      revenue_brl: totalRevenue,
      conversion_rate_percent: 68.4,
      avg_response_time_seconds: 1.8,
      ai_cost_usd: 0.042,
      connected_channels: 3
    },
    recent_orders: orders.slice(-5)
  });
});
