import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { webhookRouter } from './routes/webhooks.js';
import { chatRouter } from './routes/chat.js';
import { teachRouter } from './routes/teach.js';
import { productsRouter } from './routes/products.js';
import { agentRouter } from './routes/agent.js';
import { knowledgeRouter } from './routes/knowledge.js';
import { channelsRouter } from './routes/channels.js';
import { dashboardRouter } from './routes/dashboard.js';
import { logsRouter } from './routes/logs.js';
import { billingRouter } from './routes/billing.js';
import { authRouter } from './routes/auth.js';
import sourcesRouter from './routes/sources.js';
import { builderRouter } from './routes/builder.js';
import { catalogRouter } from './routes/catalog.js';
import { aiConversationRouter } from './routes/aiConversation.js';
import { publicChatRouter } from './routes/publicChat.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rota de Diagnóstico / Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Agente de IA Multicanal - Multiplex',
    version: '1.0.0'
  });
});

// Registro de Rotas Modulares
app.use('/api/webhooks', webhookRouter);
app.use('/api/chat', chatRouter);
app.use('/api/teach', teachRouter);
app.use('/api/products', productsRouter);
app.use('/api/agent', agentRouter);
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/channels', channelsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/logs', logsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/auth', authRouter);
app.use('/api/sources', sourcesRouter);
app.use('/api/builder', builderRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/ai/conversation', aiConversationRouter);
app.use('/api/public', publicChatRouter);


// Inicialização do Servidor
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 AGENTE DE IA MULTICANAL - MULTIPLEX RODANDO NA PORTA ${PORT}`);
    console.log(`🌐 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`🤖 Integração com n8n: http://localhost:5678`);
    console.log(`=======================================================`);
  });
}

export default app;
