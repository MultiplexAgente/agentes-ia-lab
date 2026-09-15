import { Router, Request, Response } from 'express';

export const logsRouter = Router();

// Logs em memória para observabilidade em tempo real
const runtimeLogs: Array<{
  id: string;
  timestamp: string;
  type: 'agent.message' | 'agent.tool' | 'agent.knowledge' | 'webhook' | 'n8n' | 'handoff';
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: any;
}> = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
    type: 'webhook',
    level: 'info',
    message: '[webhook.received] Mensagem recebida do canal Instagram (from: joao_victor_insta)'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 2.8 * 60000).toISOString(),
    type: 'agent.knowledge',
    level: 'info',
    message: '[agent.knowledge.search] Busca RAG: "X-Bacon" -> Encontrado produto no cardápio (R$ 25,00)'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 2.5 * 60000).toISOString(),
    type: 'agent.tool',
    level: 'info',
    message: '[agent.rule.applied] Regra ativa disparada: Oferecer batata frita rústica ao pedir hambúrguer'
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    type: 'agent.tool',
    level: 'info',
    message: '[agent.tool.called] Executando calculate_delivery(region: "Centro") -> R$ 5,00 (30 min)'
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 30000).toISOString(),
    type: 'n8n',
    level: 'info',
    message: '[n8n.event.dispatched] Evento "message.sent" notificado com sucesso ao workflow do n8n'
  }
];

logsRouter.get('/', (req: Request, res: Response) => {
  return res.json(runtimeLogs);
});
