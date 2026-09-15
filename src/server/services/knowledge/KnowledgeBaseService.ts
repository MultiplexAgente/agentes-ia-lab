import { store } from '../../config/database';
import { StructuredKnowledgeItem, Product } from '../../types/index';
import { v4 as uuidv4 } from 'uuid';

export class KnowledgeBaseService {
  /**
   * Busca conhecimento relevante baseado na pergunta/intenção do cliente (RAG)
   */
  public async searchKnowledge(companyId: string, query: string): Promise<any[]> {
    const normalizedQuery = query.toLowerCase();
    const results: any[] = [];

    // 1. Pesquisa em produtos e cardápio
    const products = store.products.get(companyId) || [];
    for (const prod of products) {
      const matchName = prod.name.toLowerCase().includes(normalizedQuery) || normalizedQuery.includes(prod.name.toLowerCase());
      const matchDesc = prod.description.toLowerCase().includes(normalizedQuery);
      const matchIngr = prod.ingredients.some(ing => normalizedQuery.includes(ing.toLowerCase()));

      if (matchName || matchDesc || matchIngr) {
        results.push({
          type: 'product',
          name: prod.name,
          price: prod.price,
          description: prod.description,
          available: prod.available,
          ingredients: prod.ingredients,
          addons: prod.variations?.map(v => `${v.name} (+R$${v.additional_price.toFixed(2)})`)
        });
      }
    }

    // 2. Pesquisa em itens de conhecimento estruturados (taxas, horários, regras)
    const items = store.knowledgeItems.get(companyId) || [];
    for (const item of items) {
      if (!item.active) continue;

      const subjectMatch = item.subject.toLowerCase().includes(normalizedQuery) || normalizedQuery.includes(item.subject.toLowerCase());
      const dataString = JSON.stringify(item.data).toLowerCase();
      const contentMatch = dataString.includes(normalizedQuery);

      // Verificações semânticas comuns
      const isDeliveryQuery = normalizedQuery.includes('entrega') || normalizedQuery.includes('taxa') || normalizedQuery.includes('frete') || normalizedQuery.includes('centro');
      const isHoursQuery = normalizedQuery.includes('horario') || normalizedQuery.includes('horário') || normalizedQuery.includes('aberto') || normalizedQuery.includes('fecha');
      const isPaymentQuery = normalizedQuery.includes('pagamento') || normalizedQuery.includes('pix') || normalizedQuery.includes('cartao') || normalizedQuery.includes('cartão');

      if (
        subjectMatch || 
        contentMatch ||
        (isDeliveryQuery && item.item_type === 'delivery_fee') ||
        (isHoursQuery && item.item_type === 'business_hour') ||
        (isPaymentQuery && item.item_type === 'policy')
      ) {
        results.push({
          type: item.item_type,
          subject: item.subject,
          details: item.data
        });
      }
    }

    return results;
  }

  /**
   * Retorna produto pelo nome exato ou aproximado
   */
  public async getProductByName(companyId: string, productName: string): Promise<Product | null> {
    const products = store.products.get(companyId) || [];
    const normalized = productName.toLowerCase().trim();
    return products.find(p => p.name.toLowerCase().includes(normalized) || normalized.includes(p.name.toLowerCase())) || null;
  }

  /**
   * Cria ou atualiza item estruturado de conhecimento com histórico de alterações
   */
  public async saveStructuredItem(
    companyId: string,
    itemType: StructuredKnowledgeItem['item_type'],
    subject: string,
    data: Record<string, any>,
    source: StructuredKnowledgeItem['source'] = 'chat_training',
    reason?: string
  ): Promise<StructuredKnowledgeItem> {
    const items = store.knowledgeItems.get(companyId) || [];
    const existingIndex = items.findIndex(i => i.subject.toLowerCase() === subject.toLowerCase());

    const timestamp = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      const historyEntry = {
        timestamp,
        action: 'UPDATE',
        previous_data: { ...existing.data },
        new_data: data,
        reason: reason || 'Atualização via aprendizado/correção'
      };

      existing.data = { ...existing.data, ...data };
      existing.history.push(historyEntry);
      existing.source = source;
      existing.updated_at = timestamp;

      items[existingIndex] = existing;
      store.knowledgeItems.set(companyId, items);
      return existing;
    } else {
      const newItem: StructuredKnowledgeItem = {
        id: uuidv4(),
        company_id: companyId,
        item_type: itemType,
        subject,
        data,
        source,
        history: [{
          timestamp,
          action: 'CREATE',
          new_data: data,
          reason: reason || 'Criação inicial via aprendizado'
        }],
        active: true,
        created_at: timestamp,
        updated_at: timestamp
      };

      items.push(newItem);
      store.knowledgeItems.set(companyId, items);
      return newItem;
    }
  }

  /**
   * Processamento e chunking de documentos (PDF, TXT, DOCX) para busca semântica
   */
  public async processDocument(
    companyId: string,
    fileName: string,
    fileType: string,
    rawText: string
  ): Promise<number> {
    // Quebra em chunks de ~500 caracteres respeitando parágrafos
    const paragraphs = rawText.split(/\n\s*\n/);
    let chunkCount = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      if (paragraph.length < 10) continue;

      chunkCount++;
      await this.saveStructuredItem(
        companyId,
        'policy',
        `${fileName}_chunk_${chunkCount}`,
        { text: paragraph, document: fileName },
        'document'
      );
    }

    return chunkCount;
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
