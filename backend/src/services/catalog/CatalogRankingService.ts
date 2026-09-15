// =========================================================================
// CATALOG RANKING SERVICE — Scoring e Ordenação Universal
// Suporta todos os segmentos: product, property, vehicle, restaurant,
// service, hotel, course, job, event, agro
// =========================================================================

import { CatalogItemResult, CatalogSearchFilters } from '../../types/index.js';

export class CatalogRankingService {
  /**
   * Calcula pontuação de relevância de um item em relação a uma busca e filtros.
   */
  static calculateItemScore(item: CatalogItemResult, filters: CatalogSearchFilters): number {
    let score = 0;

    // 1. Penalização máxima para indisponíveis
    if (!item.availability || (item.stock !== undefined && item.stock <= 0)) {
      return -100;
    }

    // 2. Filtro estrito de Tipo de Entidade (se especificado)
    if (filters.entity_type && item.entity_type) {
      const targetEntity = filters.entity_type.toLowerCase();
      const itemEntity = (item.entity_type || '').toLowerCase();
      if (targetEntity !== itemEntity) {
        return -100; // Entidades incompatíveis
      }
      score += 40;
    }

    // 3. IMÓVEIS — Quartos / Suítes / Vagas / Tipo de Transação
    if (filters.bedrooms !== undefined) {
      const itemBedrooms = Number(item.attributes?.bedrooms || item.attributes?.quartos || 0);
      if (itemBedrooms < filters.bedrooms) return -100;
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
        const isSale = itemTt.includes('vend') || itemTt.includes('sale') || itemTt.includes('compra');
        const wantsRental = tt.includes('alug') || tt.includes('rent') || tt.includes('loca');
        const wantsSale = tt.includes('vend') || tt.includes('sale') || tt.includes('compra');
        if ((wantsRental && isSale) || (wantsSale && isRental)) return -100;
        if ((wantsRental && isRental) || (wantsSale && isSale)) score += 40;
      }
    }

    // 4. VEÍCULOS — Ano / KM / Combustível / Câmbio
    if (filters.vehicle_type) {
      const vt = filters.vehicle_type.toLowerCase();
      const itemVt = (item.attributes?.vehicle_type || item.category || '').toLowerCase();
      if (itemVt && itemVt.includes(vt)) score += 35;
    }

    if (filters.year_min !== undefined) {
      const itemYear = Number(item.attributes?.year || item.attributes?.ano || 0);
      if (itemYear && itemYear < filters.year_min) return -100;
      score += 20;
    }

    if (filters.year_max !== undefined) {
      const itemYear = Number(item.attributes?.year || item.attributes?.ano || 0);
      if (itemYear && itemYear > filters.year_max) return -100;
      score += 20;
    }

    if (filters.mileage_max !== undefined) {
      const itemKm = Number(item.attributes?.mileage || item.attributes?.km || 0);
      if (itemKm && itemKm > filters.mileage_max) return -100;
      score += 25;
    }

    if (filters.fuel) {
      const fuel = filters.fuel.toLowerCase();
      const itemFuel = (item.attributes?.fuel || item.attributes?.combustivel || '').toLowerCase();
      if (itemFuel) {
        if (itemFuel.includes(fuel) || fuel.includes(itemFuel)) score += 30;
        else return -100;
      }
    }

    if (filters.transmission) {
      const trans = filters.transmission.toLowerCase();
      const itemTrans = (item.attributes?.transmission || item.attributes?.cambio || '').toLowerCase();
      if (itemTrans && (itemTrans.includes(trans) || trans.includes(itemTrans))) score += 25;
    }

    // 5. HOTEL — Estrelas / Comodidades / Check-in
    if ((filters as any).stars !== undefined) {
      const itemStars = Number(item.attributes?.stars || item.attributes?.estrelas || 0);
      if (itemStars < (filters as any).stars) return -100;
      score += itemStars === (filters as any).stars ? 50 : 30;
    }

    if ((filters as any).amenities && Array.isArray((filters as any).amenities)) {
      const wantedAmenities = ((filters as any).amenities as string[]).map((a: string) => a.toLowerCase());
      const itemAmenities = (item.attributes?.amenities || []).map((a: string) => a.toLowerCase());
      const matchCount = wantedAmenities.filter(a => itemAmenities.some((ia: string) => ia.includes(a))).length;
      score += matchCount * 20;
    }

    // 6. CURSO — Modalidade / Carga horária / Certificado
    if ((filters as any).modality) {
      const wantedModality = (filters as any).modality.toLowerCase();
      const itemModality = (item.attributes?.modality || item.attributes?.modalidade || '').toLowerCase();
      if (itemModality && (itemModality.includes(wantedModality) || wantedModality.includes(itemModality))) score += 35;
    }

    if ((filters as any).has_certificate !== undefined) {
      const hasCert = item.attributes?.has_certificate || item.attributes?.certificado;
      if (hasCert === (filters as any).has_certificate) score += 25;
    }

    // 7. VAGA DE EMPREGO — Regime / Área / Localização
    if ((filters as any).employment_type) {
      const wantedType = (filters as any).employment_type.toLowerCase();
      const itemType = (item.attributes?.employment_type || item.attributes?.regime || '').toLowerCase();
      if (itemType && (itemType.includes(wantedType) || wantedType.includes(itemType))) score += 35;
      else if (itemType) return -100;
    }

    if ((filters as any).work_mode) {
      const wantedMode = (filters as any).work_mode.toLowerCase();
      const itemMode = (item.attributes?.work_mode || item.attributes?.modalidade_trabalho || '').toLowerCase();
      if (itemMode && (itemMode.includes(wantedMode) || wantedMode.includes(itemMode))) score += 30;
    }

    // 8. AGRO — Cultura / Área / Localização Rural
    if ((filters as any).crop_type) {
      const crop = (filters as any).crop_type.toLowerCase();
      const itemCrop = (item.attributes?.crop_type || item.category || '').toLowerCase();
      if (itemCrop && itemCrop.includes(crop)) score += 35;
    }

    // 9. Preço estrito (TODOS os segmentos)
    if (item.price !== null && item.price !== undefined) {
      const price = item.price;
      const min = filters.price_min;
      const max = filters.price_max;
      if (max !== undefined && price > max) return -100;
      if (min !== undefined && price < min) return -100;
      if (min !== undefined && max !== undefined) score += 60;
      else if (max !== undefined) score += 50;
      else if (min !== undefined) score += 30;
    }

    score += 20; // Bônus base por disponibilidade

    // 10. Pontuação textual (Query)
    if (filters.query && filters.query.trim()) {
      const q = filters.query.trim().toLowerCase();
      const qTokens = q.split(/\s+/).filter(t => t.length > 1);
      const nameLower = (item.name || '').toLowerCase();
      const descLower = (item.description || '').toLowerCase();
      const catLower = (item.category || '').toLowerCase();
      const brandLower = (item.brand || '').toLowerCase();

      if (nameLower === q) score += 150;
      else if (nameLower.includes(q)) score += 90;

      let tokenMatches = 0;
      for (const token of qTokens) {
        if (nameLower.includes(token)) { score += 35; tokenMatches++; }
        else if (brandLower.includes(token)) { score += 30; tokenMatches++; }
        else if (catLower.includes(token)) { score += 25; tokenMatches++; }
        else if (descLower.includes(token)) { score += 15; tokenMatches++; }
        // Busca em atributos extras
        else {
          const attrsText = JSON.stringify(item.attributes || '').toLowerCase();
          if (attrsText.includes(token)) { score += 10; tokenMatches++; }
        }
      }

      if (tokenMatches === qTokens.length && qTokens.length > 1) score += 40;
    }

    // 11. Correspondência de Categoria
    if (filters.category && item.category) {
      if (item.category.toLowerCase().includes(filters.category.toLowerCase()) ||
          filters.category.toLowerCase().includes(item.category.toLowerCase())) {
        score += 50;
      }
    }

    // 12. Marca (Produtos / Veículos / Equipamentos)
    if (filters.brand) {
      const targetBrand = filters.brand.toLowerCase();
      const itemBrand = (item.brand || item.attributes?.brand || item.attributes?.marca || '').toLowerCase();
      if (itemBrand.includes(targetBrand) || targetBrand.includes(itemBrand)) score += 60;
      else return -100;
    }

    // 13. Peso / Volume / Medida (Produtos)
    if (filters.weight) {
      const weightStr = String(filters.weight).toLowerCase().replace(/\s+/g, '');
      const itemWeight = String(item.attributes?.weight || item.attributes?.peso || '').toLowerCase().replace(/\s+/g, '');
      const itemNameAndDesc = `${item.name} ${item.description || ''}`.toLowerCase().replace(/\s+/g, '');
      if (itemWeight.includes(weightStr) || itemNameAndDesc.includes(weightStr)) score += 50;
    }

    // 14. Localização (Imóveis / Hotéis / Vagas / Agro)
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

    // 15. Duração do Serviço
    if (filters.duration_minutes !== undefined) {
      const itemDur = Number(item.attributes?.duration_minutes || item.attributes?.duracao || 0);
      if (itemDur > 0) {
        const diff = Math.abs(itemDur - filters.duration_minutes) / filters.duration_minutes;
        if (diff < 0.2) score += 30;
        else if (diff < 0.5) score += 15;
      }
    }

    // 16. Ingredientes (Restaurante)
    if (filters.ingredients && filters.ingredients.length > 0) {
      const itemIngredients = JSON.stringify(item.attributes?.ingredients || '').toLowerCase();
      const matches = filters.ingredients.filter(ing => itemIngredients.includes(ing.toLowerCase())).length;
      score += matches * 20;
    }

    // 17. Bônus: link oficial e fotos
    if (item.source_url && (item.source_url.startsWith('http://') || item.source_url.startsWith('https://'))) score += 15;
    if (item.images && item.images.length > 0) score += 10;

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
    const scored = items.map(item => ({
      ...item,
      score: this.calculateItemScore(item, filters)
    }));

    const valid = scored.filter(i => (i.score || 0) > 0);

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

    return valid.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
}
