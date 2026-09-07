import { describe, it, expect, beforeEach } from 'vitest';
import { CatalogSearchService } from '../backend/src/services/catalog/CatalogSearchService.js';
import { SearchSessionService } from '../backend/src/services/catalog/SearchSessionService.js';
import { CatalogRankingService } from '../backend/src/services/catalog/CatalogRankingService.js';
import { CatalogFormatter } from '../backend/src/services/catalog/CatalogFormatter.js';
import { aiService } from '../backend/src/services/ai/AIService.js';
import { store } from '../backend/src/config/database.js';
import { NormalizedCatalogItem, Product } from '../backend/src/types/index.js';

describe('AI Catalog Consultant — Consultor Inteligente de Produtos, Imóveis e Serviços', () => {
  const companyA = '11111111-1111-1111-1111-111111111111';
  const companyB = '99999999-9999-9999-9999-999999999999';
  const convId = 'conv-test-consultant-123';
  const customerId = 'c-01';

  beforeEach(() => {
    store.resetAll();

    // 1. Empresa A - Imóveis e Suplementos
    const prop1: NormalizedCatalogItem = {
      id: 'prop-01',
      company_id: companyA,
      source_id: 'src-site-1',
      name: 'Casa no Jardim Primavera',
      category: 'Imóveis - Casas',
      item_type: 'property',
      price: 349000,
      currency: 'BRL',
      status: 'AVAILABLE',
      content_hash: 'hash-01',
      source_url: 'https://imobiliaria.com.br/imovel/casa-jardim-primavera',
      images: ['https://imobiliaria.com.br/fotos/casa1.jpg'],
      description: 'Linda casa com 3 quartos, 2 banheiros e 2 vagas de garagem.',
      attributes: {
        bedrooms: 3,
        quartos: 3,
        bathrooms: 2,
        parking_spaces: 2,
        built_area: 120,
        neighborhood: 'Jardim Primavera',
        city: 'São Paulo',
        businessType: 'IMOBILIÁRIA'
      }
    };

    const prop2: NormalizedCatalogItem = {
      id: 'prop-02',
      company_id: companyA,
      source_id: 'src-site-1',
      name: 'Casa no Jardim Europa',
      category: 'Imóveis - Casas',
      item_type: 'property',
      price: 389000,
      currency: 'BRL',
      status: 'AVAILABLE',
      content_hash: 'hash-02',
      source_url: 'https://imobiliaria.com.br/imovel/casa-jardim-europa',
      images: ['https://imobiliaria.com.br/fotos/casa2.jpg'],
      description: 'Excelente residência com 3 quartos, suíte e 1 vaga.',
      attributes: {
        bedrooms: 3,
        quartos: 3,
        bathrooms: 2,
        suites: 1,
        parking_spaces: 1,
        built_area: 110,
        neighborhood: 'Jardim Europa',
        city: 'São Paulo',
        businessType: 'IMOBILIÁRIA'
      }
    };

    const propUnavailable: NormalizedCatalogItem = {
      id: 'prop-03-sold',
      company_id: companyA,
      source_id: 'src-site-1',
      name: 'Casa Centro Histórico',
      category: 'Imóveis - Casas',
      item_type: 'property',
      price: 310000,
      currency: 'BRL',
      status: 'UNAVAILABLE',
      content_hash: 'hash-03',
      source_url: 'https://imobiliaria.com.br/imovel/casa-centro',
      images: [],
      description: 'Imóvel vendido.',
      attributes: { bedrooms: 3, quartos: 3, businessType: 'IMOBILIÁRIA' }
    };

    const supp1: NormalizedCatalogItem = {
      id: 'prod-supp-01',
      company_id: companyA,
      source_id: 'src-site-2',
      name: 'Creatina 500g 100% Pura',
      brand: 'Max Titanium',
      category: 'Suplementos',
      item_type: 'product',
      price: 129.90,
      currency: 'BRL',
      status: 'AVAILABLE',
      content_hash: 'hash-supp-1',
      source_url: 'https://lojasuplementos.com.br/produto/creatina-max-titanium-500g',
      images: ['https://lojasuplementos.com.br/img/creatina-max.jpg'],
      description: 'Creatina monohidratada pura 500g para ganho de força e massa muscular.',
      attributes: {
        brand: 'Max Titanium',
        weight: '500g',
        peso: '500g',
        stock: 45
      }
    };

    const supp2: NormalizedCatalogItem = {
      id: 'prod-supp-02',
      company_id: companyA,
      source_id: 'src-site-2',
      name: 'Creatina Monohidratada 500g',
      brand: 'Integralmédica',
      category: 'Suplementos',
      item_type: 'product',
      price: 119.90,
      currency: 'BRL',
      status: 'AVAILABLE',
      content_hash: 'hash-supp-2',
      source_url: 'https://lojasuplementos.com.br/produto/creatina-integralmedica-500g',
      images: ['https://lojasuplementos.com.br/img/creatina-integral.jpg'],
      description: 'Creatina creapure 500g Integralmédica alta pureza.',
      attributes: {
        brand: 'Integralmédica',
        weight: '500g',
        peso: '500g',
        stock: 30
      }
    };

    store.catalogItems.set(prop1.id, prop1);
    store.catalogItems.set(prop2.id, prop2);
    store.catalogItems.set(propUnavailable.id, propUnavailable);
    store.catalogItems.set(supp1.id, supp1);
    store.catalogItems.set(supp2.id, supp2);

    // 2. Produto manual em store.products
    const prodManual: Product = {
      id: 'prod-serv-01',
      company_id: companyA,
      name: 'Higienização e Limpeza de Sofá 3 Lugares',
      category: 'Serviços Especializados',
      price: 180.00,
      description: 'Limpeza profunda e desinfecção a seco de estofados.',
      available: true,
      ingredients: ['impermeabilização', 'aspiração profunda', 'anti-ácaro'],
      variations: []
    };
    store.products.set(companyA, [prodManual]);

    // 3. Item da Empresa B (para teste de isolamento multitenant)
    const itemCompanyB: NormalizedCatalogItem = {
      id: 'item-comp-b',
      company_id: companyB,
      source_id: 'src-b',
      name: 'Item Privado da Empresa B',
      category: 'Confidencial',
      price: 999.00,
      status: 'AVAILABLE',
      content_hash: 'hash-b',
      source_url: 'https://empresa-b.com/item'
    };
    store.catalogItems.set(itemCompanyB.id, itemCompanyB);

    // 4. Conversa de teste ativa
    store.conversations.set(convId, {
      id: convId,
      company_id: companyA,
      customer_id: customerId,
      channel_type: 'whatsapp',
      status: 'ACTIVE',
      last_message_at: new Date().toISOString()
    });
  });

  it('1. Deve pesquisar imóveis filtrando por quartos, faixa de preço e ignorar indisponíveis', async () => {
    const searchRes = await CatalogSearchService.searchCatalog(companyA, {
      entity_type: 'property',
      bedrooms: 3,
      price_min: 300000,
      price_max: 400000
    });

    expect(searchRes.items.length).toBe(2);
    expect(searchRes.items.some(i => i.id === 'prop-01')).toBe(true);
    expect(searchRes.items.some(i => i.id === 'prop-02')).toBe(true);
    // Imóvel vendido (UNAVAILABLE) nunca deve ser retornado
    expect(searchRes.items.some(i => i.id === 'prop-03-sold')).toBe(false);

    // Verifica presença do link oficial verificado
    const first = searchRes.items[0];
    expect(first.source_url).toBe('https://imobiliaria.com.br/imovel/casa-jardim-primavera');
    expect(first.formatted_price).toContain('349.000');
  });

  it('2. Deve pesquisar suplementos por marca, peso e teto de preço', async () => {
    const searchRes = await CatalogSearchService.searchCatalog(companyA, {
      entity_type: 'product',
      query: 'creatina',
      brand: 'Max Titanium',
      weight: '500g',
      price_max: 150
    });

    expect(searchRes.items.length).toBeGreaterThanOrEqual(1);
    const topItem = searchRes.items[0];
    expect(topItem.brand).toBe('Max Titanium');
    expect(topItem.price).toBe(129.90);
    expect(topItem.source_url).toBe('https://lojasuplementos.com.br/produto/creatina-max-titanium-500g');
    expect(topItem.images.length).toBe(1);
  });

  it('3. Deve manter isolamento estrito de Multi-Tenancy (Empresa B não vaza na Empresa A)', async () => {
    const searchA = await CatalogSearchService.searchCatalog(companyA, {
      query: 'Privado'
    });
    expect(searchA.items.some(i => i.id === 'item-comp-b')).toBe(false);

    const searchB = await CatalogSearchService.searchCatalog(companyB, {
      query: 'Privado'
    });
    expect(searchB.items.some(i => i.id === 'item-comp-b')).toBe(true);
  });

  it('4. Deve manter estado multiturno e resolver referências ordinais ("gostei da segunda")', async () => {
    // 1º turno: busca imóveis
    const searchRes = await CatalogSearchService.searchCatalog(companyA, {
      entity_type: 'property',
      bedrooms: 3
    });

    // Salva na sessão
    SearchSessionService.savePresentedResults(convId, companyA, searchRes.items);

    // 2º turno: cliente fala "Gostei da segunda"
    const resolution = SearchSessionService.resolveItemReference(convId, 'Gostei da segunda');
    expect(resolution.resolved).toBe(true);
    expect(resolution.item).toBeDefined();
    expect(resolution.item?.index).toBe(2);
    expect(resolution.item?.id).toBe('prop-02');
    expect(resolution.item?.name).toBe('Casa no Jardim Europa');

    // 3º turno: cliente fala "o mais barato"
    const cheapResolution = SearchSessionService.resolveItemReference(convId, 'quero o mais barato');
    expect(cheapResolution.resolved).toBe(true);
    expect(cheapResolution.item?.id).toBe('prop-01'); // 349.000 é mais barato que 389.000
  });

  it('5. Deve atualizar filtros incrementalmente sem perder os critérios anteriores', async () => {
    // Busca inicial
    SearchSessionService.updateSessionFilters(convId, companyA, {
      bedrooms: 3,
      price_max: 400000,
      entity_type: 'property'
    });

    // Cliente diz: "Pode ser até 450 mil"
    const updated = SearchSessionService.updateSessionFilters(convId, companyA, {
      price_max: 450000
    });

    expect(updated.filters.bedrooms).toBe(3);
    expect(updated.filters.price_max).toBe(450000);
    expect(updated.filters.entity_type).toBe('property');
  });

  it('6. Deve acionar busca alternativa amigável se não encontrar o valor exato', async () => {
    // Procura creatina até 100 reais (a mais barata é 119,90)
    const searchRes = await CatalogSearchService.searchCatalog(companyA, {
      query: 'creatina',
      price_max: 100
    });

    expect(searchRes.is_alternative).toBe(true);
    expect(searchRes.alternative_message).toBeDefined();
    expect(searchRes.items.length).toBeGreaterThan(0);
  });

  it('7. Formatter deve gerar texto elegante para WhatsApp e cards para Web', () => {
    const items = CatalogSearchService.getAllCompanyItems(companyA).slice(0, 2);
    const text = CatalogFormatter.formatTextResponse(items);
    const cards = CatalogFormatter.formatStructuredCards(items);

    expect(text).toContain('👉');
    expect(text).toContain('https://');
    expect(cards.length).toBe(2);
    expect(cards[0].cta_label).toBeDefined();
  });

  it('8. Fluxo Conversacional de Atendimento Consultivo via AIService', async () => {
    // Desativa chamada externa para execução de teste unitário ultra-rápida e determinística
    const originalOpenAI = (aiService as any).openai;
    (aiService as any).openai = null;

    try {
      // Cliente faz pergunta vaga sobre casas
      const resp1 = await aiService.processMessage({
        companyId: companyA,
        conversationId: convId,
        incomingText: 'Oi, quero ver casas'
      });

      // A IA deve responder consultivamente perguntando quartos/preço (não despejando tudo)
      expect(resp1.response_text.toLowerCase()).toContain('quantos quartos');

      // Cliente especifica: "3 quartos entre 300 e 400 mil"
      const resp2 = await aiService.processMessage({
        companyId: companyA,
        conversationId: convId,
        incomingText: 'Quero casa de 3 quartos entre 300 e 400 mil'
      });

      expect(resp2.response_text).toContain('Casa no Jardim Primavera');
      expect(resp2.response_text).toContain('https://imobiliaria.com.br/imovel/casa-jardim-primavera');

      // Cliente escolhe a segunda opção: "Gostei da segunda"
      const resp3 = await aiService.processMessage({
        companyId: companyA,
        conversationId: convId,
        incomingText: 'Gostei da segunda'
      });

      expect(resp3.response_text).toContain('Casa no Jardim Europa');
      expect(resp3.response_text).toContain('389.000');
    } finally {
      (aiService as any).openai = originalOpenAI;
    }
  }, 15000);
});

