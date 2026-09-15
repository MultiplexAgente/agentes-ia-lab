import { CatalogItemResult, CatalogSearchFilters } from '../../types/index';

export class CatalogRankingService {
  /**
   * Calcula pontuação de relevância de um item em relação a uma busca e filtros.
   */
  static calculateItemScore(item: CatalogItemResult, filters: CatalogSearchFilters): number {
    let score = 0;

    // 1. Penalização máxima ou eliminação para indisponíveis
    if (!item.availability || (item.stock !== undefined && item.stock <= 0)) {
      return -100;
    }

    // 2. Filtro estrito de Tipo de Entidade (se especificado)
    if (filters.entity_type && item.entity_type) {
      const targetEntity = filters.entity_type.toLowerCase();
      const itemEntity = item.entity_type.toLowerCase();
      if (targetEntity !== itemEntity) {
        return -100; // Entidade incompatível (ex: não misturar imóveis com produtos ou serviços)
      }
      score += 40;
    }

    // 3. Imóveis: Quartos / Suítes / Vagas / Tipo de Transação
    if (filters.bedrooms !== undefined) {
      const itemBedrooms = Number(item.attributes?.bedrooms || item.attributes?.quartos || 0);
      if (itemBedrooms < filters.bedrooms) {
        return -100; // Não atende o requisito mínimo de quartos
      }
      score += (itemBedrooms === filters.bedrooms ? 60 : 40);
    }

    if (filters.suites !== undefined) {
      const itemSuites = Number(item.attributes?.suites || 0);
      if (itemSuites < filters.suites) return -100;
      score += 30;
    }

    if (filters.bathrooms !== undefined) {
      const itemBathrooms = Number(item.attributes?.bathrooms || item.attributes?.banheiros || 0);
      if (itemBathrooms < filters.bathrooms) return -100;
      score += 25;
    }

    if (filters.parking_spaces !== undefined) {
      const itemSpaces = Number(item.attributes?.parking_spaces || item.attributes?.vagas || 0);
      if (itemSpaces < filters.parking_spaces) return -100;
      score += 25;
    }

    if (filters.transaction_type) {
      const tt = filters.transaction_type.toLowerCase();
      const itemTt = (item.attributes?.transaction_type || item.attributes?.tipo_transacao || item.category || '').toLowerCase();
      if (itemTt) {
        const isRental = itemTt.includes('alug') || itemTt.includes('rent') || itemTt.includes('loca');
        const isSale = itemTt.includes('vend') || itemTt.includes('sale');
        const wantsRental = tt.includes('alug') || tt.includes('rent') || tt.includes('loca');
        const wantsSale = tt.includes('vend') || tt.includes('sale');

        if ((wantsRental && isSale) || (wantsSale && isRental)) {
          return -100; // Conflito direto entre aluguel e venda
        }
        if ((wantsRental && isRental) || (wantsSale && isSale)) {
          score += 40;
        }
      }
    }

    // 4. Preço estrito (Se estourar o orçamento, não é match exato)
    if (item.price !== null && item.price !== undefined) {
      const price = item.price;
      const min = filters.price_min;
      const max = filters.price_max;

      if (max !== undefined && price > max) {
        return -100; // Preço acima do teto estipulado
      }

      if (min !== undefined && price < min) {
        return -100; // Preço abaixo do piso estipulado
      }

      if (min !== undefined && max !== undefined) {
        score += 60; // Enquadramento perfeito na faixa
      } else if (max !== undefined) {
        score += 50;
      } else if (min !== undefined) {
        score += 30;
      }
    }

    score += 20; // Bônus base por disponibilidade

    // 5. Pontuação textual (Query)
    if (filters.query && filters.query.trim()) {
      const q = filters.query.trim().toLowerCase();
      const qTokens = q.split(/\s+/).filter(t => t.length > 1);
      const nameLower = (item.name || '').toLowerCase();
      const descLower = (item.description || '').toLowerCase();
      const catLower = (item.category || '').toLowerCase();
      const brandLower = (item.brand || '').toLowerCase();

      // Correspondência exata do nome
      if (nameLower === q) {
        score += 150;
      } else if (nameLower.includes(q)) {
        score += 90;
      }

      // Correspondência por tokens
      let tokenMatches = 0;
      for (const token of qTokens) {
        if (nameLower.includes(token)) {
          score += 35;
          tokenMatches++;
        } else if (brandLower.includes(token)) {
          score += 30;
          tokenMatches++;
        } else if (catLower.includes(token)) {
          score += 25;
          tokenMatches++;
        } else if (descLower.includes(token)) {
          score += 15;
          tokenMatches++;
        }
      }

      if (tokenMatches === qTokens.length && qTokens.length > 1) {
        score += 40; // Bônus se todos os termos da busca foram contemplados
      }
    }

    // 6. Correspondência de Categoria
    if (filters.category && item.category) {
      if (item.category.toLowerCase().includes(filters.category.toLowerCase()) ||
          filters.category.toLowerCase().includes(item.category.toLowerCase())) {
        score += 50;
      }
    }

    // 7. Marca (Produtos / Veículos / Equipamentos)
    if (filters.brand) {
      const targetBrand = filters.brand.toLowerCase();
      const itemBrand = (item.brand || item.attributes?.brand || item.attributes?.marca || '').toLowerCase();
      if (itemBrand.includes(targetBrand) || targetBrand.includes(itemBrand)) {
        score += 60;
      } else {
        return -100; // Marca solicitada não bate
      }
    }

    // 8. Peso / Volume / Medida
    if (filters.weight) {
      const weightStr = String(filters.weight).toLowerCase().replace(/\s+/g, '');
      const itemWeight = String(item.attributes?.weight || item.attributes?.peso || '').toLowerCase().replace(/\s+/g, '');
      const itemNameAndDesc = `${item.name} ${item.description || ''}`.toLowerCase().replace(/\s+/g, '');
      if (itemWeight.includes(weightStr) || itemNameAndDesc.includes(weightStr)) {
        score += 50;
      }
    }

    // 9. Bairro / Cidade / Região
    if (filters.city) {
      const targetCity = filters.city.toLowerCase();
      const itemCity = (item.attributes?.city || item.attributes?.cidade || '').toLowerCase();
      if (itemCity.includes(targetCity)) score += 35;
    }

    if (filters.neighborhood && filters.neighborhood !== 'ANY') {
      const targetNeigh = filters.neighborhood.toLowerCase();
      const itemNeigh = (item.attributes?.neighborhood || item.attributes?.bairro || item.description || '').toLowerCase();
      if (itemNeigh.includes(targetNeigh)) score += 40;
    }

    // 9. Presença de Link Oficial Verificado (source_url) e Fotos
    if (item.source_url && (item.source_url.startsWith('http://') || item.source_url.startsWith('https://'))) {
      score += 15;
    }
    if (item.images && item.images.length > 0) {
      score += 10;
    }

    return score;
  }

  /**
   * Ordena e classifica os itens encontrados.
   */
  static rankItems(
    items: CatalogItemResult[],
    filters: CatalogSearchFilters,
    sortMode: 'relevance' | 'price_asc' | 'price_desc' | 'newest' = 'relevance'
  ): CatalogItemResult[] {
    // 1. Calcula os scores
    const scored = items.map(item => ({
      ...item,
      score: this.calculateItemScore(item, filters)
    }));

    // 2. Filtra itens com pontuação positiva / aceitável
    const valid = scored.filter(i => (i.score || 0) > 0);

    // 3. Aplica o ordenamento desejado
    if (sortMode === 'price_asc') {
      return valid.sort((a, b) => {
        const priceA = a.price ?? 999999999;
        const priceB = b.price ?? 999999999;
        if (priceA !== priceB) return priceA - priceB;
        return (b.score || 0) - (a.score || 0);
      });
    }

    if (sortMode === 'price_desc') {
      return valid.sort((a, b) => {
        const priceA = a.price ?? 0;
        const priceB = b.price ?? 0;
        if (priceA !== priceB) return priceB - priceA;
        return (b.score || 0) - (a.score || 0);
      });
    }

    // Padrão: 'relevance'
    return valid.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
}
