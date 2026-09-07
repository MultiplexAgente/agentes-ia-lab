import { Router, Request, Response } from 'express';
import { store } from '../config/database.js';
import { AgentRule, AgentPersonality } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export const agentRouter = Router();
const DEFAULT_COMPANY_ID = '11111111-1111-1111-1111-111111111111';
const DEFAULT_AGENT_ID = '22222222-2222-2222-2222-222222222222';

// Obter configurações completas do agente
agentRouter.get('/config', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || DEFAULT_COMPANY_ID;
  const agent = store.agents.get(DEFAULT_AGENT_ID) || Array.from(store.agents.values()).find(a => a.company_id === companyId);
  const personality = store.agentPersonalities.get(agent?.id || DEFAULT_AGENT_ID);
  const rules = store.agentRules.get(agent?.id || DEFAULT_AGENT_ID) || [];

  return res.json({
    agent,
    personality,
    rules: rules.sort((a, b) => b.priority - a.priority)
  });
});

// Atualizar personalidade
agentRouter.put('/personality', (req: Request, res: Response) => {
  const companyId = (req.body.companyId as string) || DEFAULT_COMPANY_ID;
  const agentId = (req.body.agentId as string) || DEFAULT_AGENT_ID;

  const current = store.agentPersonalities.get(agentId) || {
    agent_id: agentId,
    company_id: companyId,
    tone: 'friendly',
    formality: 'informal',
    use_emojis: true,
    response_length: 'concise',
    commercial_style: 'consultative'
  };

  const updated: AgentPersonality = {
    ...current,
    ...req.body
  };

  store.agentPersonalities.set(agentId, updated);
  return res.json(updated);
});

// Adicionar regra com prioridade
agentRouter.post('/rules', (req: Request, res: Response) => {
  const companyId = (req.body.companyId as string) || DEFAULT_COMPANY_ID;
  const agentId = (req.body.agentId as string) || DEFAULT_AGENT_ID;
  const { rule_text, priority, condition_trigger, action_type } = req.body;

  if (!rule_text) return res.status(400).json({ error: 'Texto da regra é obrigatório.' });

  const newRule: AgentRule = {
    id: uuidv4(),
    agent_id: agentId,
    company_id: companyId,
    rule_text,
    priority: Number(priority) || 5,
    condition_trigger,
    action_type,
    active: true
  };

  const rules = store.agentRules.get(agentId) || [];
  rules.push(newRule);
  store.agentRules.set(agentId, rules);

  return res.status(201).json(newRule);
});

// Excluir regra
agentRouter.delete('/rules/:id', (req: Request, res: Response) => {
  const agentId = DEFAULT_AGENT_ID;
  const { id } = req.params;
  let rules = store.agentRules.get(agentId) || [];
  rules = rules.filter(r => r.id !== id);
  store.agentRules.set(agentId, rules);
  return res.json({ success: true });
});
