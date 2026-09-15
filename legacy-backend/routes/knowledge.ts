import { Router, Request, Response } from 'express';
import { store } from '../config/database.js';
import { knowledgeBaseService } from '../services/knowledge/KnowledgeBaseService.js';
import { StructuredKnowledgeItem } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export const knowledgeRouter = Router();
const DEFAULT_COMPANY_ID = '11111111-1111-1111-1111-111111111111';

// Listar todos os itens de conhecimento
knowledgeRouter.get('/', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || DEFAULT_COMPANY_ID;
  const items = store.knowledgeItems.get(companyId) || [];
  return res.json(items);
});

// Criar item de conhecimento manual
knowledgeRouter.post('/', async (req: Request, res: Response) => {
  const companyId = (req.body.companyId as string) || DEFAULT_COMPANY_ID;
  const { item_type, subject, data } = req.body;

  if (!subject || !data) {
    return res.status(400).json({ error: 'Assunto (subject) e conteúdo (data) são obrigatórios.' });
  }

  const item = await knowledgeBaseService.saveStructuredItem(
    companyId,
    item_type || 'policy',
    subject,
    typeof data === 'string' ? { text: data } : data,
    'manual',
    'Cadastro manual pelo painel'
  );

  return res.status(201).json(item);
});

// Upload e extração de texto de documentos (RAG)
knowledgeRouter.post('/upload', async (req: Request, res: Response) => {
  const companyId = (req.body.companyId as string) || DEFAULT_COMPANY_ID;
  const { fileName, fileType, content } = req.body;

  if (!fileName || !content) {
    return res.status(400).json({ error: 'Nome do arquivo e conteúdo são obrigatórios.' });
  }

  try {
    const chunkCount = await knowledgeBaseService.processDocument(companyId, fileName, fileType || 'txt', content);
    return res.json({
      success: true,
      message: `Documento processado com sucesso em ${chunkCount} blocos de conhecimento semântico.`,
      chunks: chunkCount
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Excluir item de conhecimento
knowledgeRouter.delete('/:id', (req: Request, res: Response) => {
  const companyId = (req.query.companyId as string) || DEFAULT_COMPANY_ID;
  const { id } = req.params;
  let items = store.knowledgeItems.get(companyId) || [];
  items = items.filter(i => i.id !== id);
  store.knowledgeItems.set(companyId, items);
  return res.json({ success: true });
});
