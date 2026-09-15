import { Router, Request, Response } from 'express';
import { store } from '../config/database.js';
import { teachService } from '../services/teach/TeachService.js';

export const teachRouter = Router();
const DEFAULT_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

/**
 * Ensinar a IA via diálogo conversacional
 */
teachRouter.post('/', async (req: Request, res: Response) => {
  const { text, companyId } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Texto da instrução é obrigatório.' });
  }

  const targetCompanyId = companyId || DEFAULT_COMPANY_ID;

  try {
    const result = await teachService.teach(targetCompanyId, text);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Lista o conhecimento estruturado aprendido e histórico de correções
 */
teachRouter.get('/history', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || DEFAULT_COMPANY_ID;
  const items = store.knowledgeItems.get(companyId) || [];
  return res.json(items);
});
