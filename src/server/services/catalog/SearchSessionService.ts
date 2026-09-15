import { store } from '../../config/database';
import { 
  SearchSession, 
  CatalogSearchFilters, 
  SearchSessionItemRef, 
  CatalogItemResult 
} from '../../types/index';
import { v4 as uuidv4 } from 'uuid';

export class SearchSessionService {
  private static SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas de validade

  /**
   * Obtém ou inicializa a sessão de busca da conversa
   */
  static getOrCreateSession(conversationId: string, companyId: string, customerId?: string): SearchSession {
    let session = store.searchSessions.get(conversationId);

    const now = new Date();
    if (!session || new Date(session.expires_at) < now) {
      session = {
        id: uuidv4(),
        company_id: companyId,
        conversation_id: conversationId,
        customer_id: customerId,
        filters: {},
        last_results: [],
        selected_item: null,
        turn_count: 0,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        expires_at: new Date(now.getTime() + this.SESSION_TTL_MS).toISOString()
      };
      store.searchSessions.set(conversationId, session);
    }

    return session;
  }

  /**
   * Atualiza incrementalmente os filtros da sessão sem perder os anteriores
   */
  static updateSessionFilters(
    conversationId: string,
    companyId: string,
    newFilters: Partial<CatalogSearchFilters>,
    options?: { category?: string; entity_type?: string; query?: string }
  ): SearchSession {
    const session = this.getOrCreateSession(conversationId, companyId);
    const now = new Date();

    session.filters = {
      ...session.filters,
      ...newFilters
    };

    if (options?.category) session.category = options.category;
    if (options?.entity_type) session.entity_type = options.entity_type;
    if (options?.query !== undefined) session.last_query = options.query;

    session.turn_count += 1;
    session.updated_at = now.toISOString();
    session.expires_at = new Date(now.getTime() + this.SESSION_TTL_MS).toISOString();

    store.searchSessions.set(conversationId, session);
    return session;
  }

  /**
   * Registra os resultados apresentados ao cliente na sessão com índice 1-based
   */
  static savePresentedResults(
    conversationId: string,
    companyId: string,
    items: CatalogItemResult[]
  ): SearchSession {
    const session = this.getOrCreateSession(conversationId, companyId);
    const now = new Date();

    session.last_results = items.map((item, index) => ({
      index: index + 1, // 1, 2, 3...
      id: item.id,
      name: item.name,
      brand: item.brand,
      price: item.price,
      formatted_price: item.formatted_price,
      source_url: item.source_url,
      main_image: item.main_image,
      category: item.category,
      summary: item.description,
      attributes: item.attributes
    }));

    session.updated_at = now.toISOString();
    session.expires_at = new Date(now.getTime() + this.SESSION_TTL_MS).toISOString();

    store.searchSessions.set(conversationId, session);
    return session;
  }

  /**
   * Resolve referências linguísticas e ordinais do cliente
   * Exemplos: "gostei da segunda", "o segundo", "opção 2", "o mais barato", "o primeiro", "o de 389 mil"
   */
  static resolveItemReference(
    conversationId: string,
    userText: string
  ): { resolved: boolean; item?: SearchSessionItemRef; reason?: string } {
    const session = store.searchSessions.get(conversationId);
    if (!session || session.last_results.length === 0) {
      return { resolved: false, reason: 'Nenhum resultado anterior encontrado na sessão ativa.' };
    }

    const t = userText.toLowerCase().trim();
    const results = session.last_results;

    // 1. Ordinais por extenso e números
    const ordinalMap: Array<{ words: string[]; index: number }> = [
      { words: ['primeir', 'primeiro', 'primeira', '1º', '1ª', 'opcao 1', 'opção 1', 'numero 1', 'número 1', 'o 1', 'a 1'], index: 1 },
      { words: ['segund', 'segundo', 'segunda', '2º', '2ª', 'opcao 2', 'opção 2', 'numero 2', 'número 2', 'o 2', 'a 2'], index: 2 },
      { words: ['terceir', 'terceiro', 'terceira', '3º', '3ª', 'opcao 3', 'opção 3', 'numero 3', 'número 3', 'o 3', 'a 3'], index: 3 },
      { words: ['quart', 'quarto', 'quarta', '4º', '4ª', 'opcao 4', 'opção 4', 'numero 4', 'número 4', 'o 4', 'a 4'], index: 4 },
      { words: ['quint', 'quinto', 'quinta', '5º', '5ª', 'opcao 5', 'opção 5', 'numero 5', 'número 5', 'o 5', 'a 5'], index: 5 }
    ];

    for (const ord of ordinalMap) {
      if (ord.words.some(w => t.includes(w))) {
        const found = results.find(r => r.index === ord.index);
        if (found) {
          session.selected_item = found;
          session.updated_at = new Date().toISOString();
          store.searchSessions.set(conversationId, session);
          return { resolved: true, item: found, reason: `Resolvido para o ${found.index}º item apresentado.` };
        }
      }
    }

    // 2. "Último" ou "Última"
    if (t.includes('últim') || t.includes('ultimo') || t.includes('ultima')) {
      const last = results[results.length - 1];
      if (last) {
        session.selected_item = last;
        session.updated_at = new Date().toISOString();
        store.searchSessions.set(conversationId, session);
        return { resolved: true, item: last, reason: `Resolvido para o último item (${last.name}).` };
      }
    }

    // 3. "Mais barato" ou "menor valor"
    if (t.includes('mais barat') || t.includes('menor preco') || t.includes('menor preço') || t.includes('menor valor')) {
      const validPriced = results.filter(r => r.price !== null && r.price !== undefined && r.price > 0);
      if (validPriced.length > 0) {
        const cheapest = validPriced.reduce((min, cur) => (cur.price! < min.price! ? cur : min));
        session.selected_item = cheapest;
        session.updated_at = new Date().toISOString();
        store.searchSessions.set(conversationId, session);
        return { resolved: true, item: cheapest, reason: `Resolvido para a opção mais barata (${cheapest.name}).` };
      }
    }

    // 4. "Mais caro" ou "maior valor"
    if (t.includes('mais car') || t.includes('maior preco') || t.includes('maior preço') || t.includes('maior valor')) {
      const validPriced = results.filter(r => r.price !== null && r.price !== undefined && r.price > 0);
      if (validPriced.length > 0) {
        const highest = validPriced.reduce((max, cur) => (cur.price! > max.price! ? cur : max));
        session.selected_item = highest;
        session.updated_at = new Date().toISOString();
        store.searchSessions.set(conversationId, session);
        return { resolved: true, item: highest, reason: `Resolvido para a opção de maior valor (${highest.name}).` };
      }
    }

    // 5. Correspondência por nome ou características do item apresentado
    for (const r of results) {
      const nameParts = r.name.toLowerCase().split(/\s+/).filter(p => p.length > 3);
      if (nameParts.some(part => t.includes(part))) {
        session.selected_item = r;
        session.updated_at = new Date().toISOString();
        store.searchSessions.set(conversationId, session);
        return { resolved: true, item: r, reason: `Resolvido por menção nominal (${r.name}).` };
      }
    }

    return { resolved: false, reason: 'Nenhuma correspondência inequívoca com os itens apresentados.' };
  }

  /**
   * Limpa ou reinicia a sessão de busca
   */
  static clearSession(conversationId: string): void {
    store.searchSessions.delete(conversationId);
  }
}
