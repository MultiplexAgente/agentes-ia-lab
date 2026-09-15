import { CatalogItemResult, CatalogConsultantSettings } from '../../types/index';

export class CatalogFormatter {
  /**
   * Retorna o emoji característico conforme o tipo de entidade
   */
  private static getEntityEmoji(entityType?: string): string {
    switch (entityType) {
      case 'property': return '🏠';
      case 'vehicle': return '🚗';
      case 'restaurant': return '🍕';
      case 'service': return '⚙️';
      case 'hotel': return '🏨';
      case 'course': return '🎓';
      default: return '📦';
    }
  }

  /**
   * Extrai um resumo legível de atributos relevantes para texto
   */
  private static formatAttributesSummary(item: CatalogItemResult): string[] {
    const lines: string[] = [];
    const attrs = item.attributes || {};

    if (item.entity_type === 'property') {
      const parts: string[] = [];
      if (attrs.bedrooms || attrs.quartos) parts.push(`${attrs.bedrooms || attrs.quartos} quartos`);
      if (attrs.suites) parts.push(`${attrs.suites} suítes`);
      if (attrs.bathrooms || attrs.banheiros) parts.push(`${attrs.bathrooms || attrs.banheiros} banheiros`);
      if (attrs.parking_spaces || attrs.vagas) parts.push(`${attrs.parking_spaces || attrs.vagas} vagas`);
      if (attrs.built_area || attrs.area_construida) parts.push(`${attrs.built_area || attrs.area_construida} m²`);
      if (parts.length > 0) lines.push(parts.join(' • '));

      const locParts: string[] = [];
      if (attrs.neighborhood || attrs.bairro) locParts.push(attrs.neighborhood || attrs.bairro);
      if (attrs.city || attrs.cidade) locParts.push(attrs.city || attrs.cidade);
      if (locParts.length > 0) lines.push(`Localização: ${locParts.join(', ')}`);
    } else if (item.entity_type === 'vehicle') {
      const parts: string[] = [];
      if (attrs.year || attrs.ano) parts.push(`Ano ${attrs.year || attrs.ano}`);
      if (attrs.mileage || attrs.km) parts.push(`${attrs.mileage || attrs.km} km`);
      if (attrs.fuel || attrs.combustivel) parts.push(attrs.fuel || attrs.combustivel);
      if (attrs.transmission || attrs.cambio) parts.push(attrs.transmission || attrs.cambio);
      if (parts.length > 0) lines.push(parts.join(' • '));
    } else if (item.entity_type === 'service') {
      if (attrs.duration_minutes || attrs.duracao) {
        lines.push(`Duração estimada: ${attrs.duration_minutes || attrs.duracao} minutos`);
      }
    } else {
      // Produto geral / Suplemento
      const parts: string[] = [];
      if (item.brand) parts.push(`Marca: ${item.brand}`);
      if (attrs.weight || attrs.peso) parts.push(`Peso: ${attrs.weight || attrs.peso}`);
      if (attrs.volume) parts.push(`Volume: ${attrs.volume}`);
      if (attrs.size || attrs.tamanho) parts.push(`Tamanho: ${attrs.size || attrs.tamanho}`);
      if (parts.length > 0) lines.push(parts.join(' • '));
    }

    return lines;
  }

  /**
   * Formata os itens em mensagem de texto elegante para WhatsApp, Telegram ou Instagram
   */
  static formatTextResponse(
    items: CatalogItemResult[],
    settings?: CatalogConsultantSettings,
    headerMessage?: string
  ): string {
    if (items.length === 0) {
      return 'Não encontrei nenhum item correspondente no momento.';
    }

    const sendPrices = settings?.send_prices !== false;
    const sendDescriptions = settings?.send_descriptions !== false;
    const sendLinks = settings?.send_links !== false;
    const sendImages = settings?.send_images !== false;

    const blocks: string[] = [];

    const intro = headerMessage || (items.length === 1 
      ? 'Encontrei esta opção perfeita para você:' 
      : `Encontrei ${items.length} opções que combinam com o que você procura:`);
    blocks.push(intro);

    items.forEach((item, idx) => {
      const num = idx + 1;
      const emoji = this.getEntityEmoji(item.entity_type);
      const lines: string[] = [];

      // Imagem indicada textualmente se disponível
      if (sendImages && item.main_image) {
        lines.push(`[IMAGEM: ${item.main_image}]`);
      }

      // Título do item com numeração
      lines.push(`${emoji} ${num}. ${item.name}${item.brand ? ` — ${item.brand}` : ''}`);

      // Atributos estruturados
      const attrLines = this.formatAttributesSummary(item);
      attrLines.forEach(al => lines.push(al));

      // Descrição
      if (sendDescriptions && item.description && item.description.trim().length > 0) {
        // Encurta se for muito longa
        const cleanDesc = item.description.length > 180 ? item.description.slice(0, 180) + '...' : item.description;
        lines.push(cleanDesc);
      }

      // Preço oficial
      if (sendPrices) {
        lines.push(`💰 Preço: ${item.formatted_price}`);
      }

      // Link oficial verificado (source_url)
      if (sendLinks && item.source_url && (item.source_url.startsWith('http://') || item.source_url.startsWith('https://'))) {
        const ctaLabel = item.cta?.label || 'Ver detalhes';
        lines.push(`👉 ${ctaLabel}: ${item.source_url}`);
      }

      blocks.push(lines.join('\n'));
    });

    // Pergunta de follow-up no final
    const entityType = items[0]?.entity_type;
    let followUp = 'Se desejar, posso procurar outras opções, filtrar por outra faixa de preço ou detalhar mais qualquer um dos itens acima!';
    if (entityType === 'property') {
      followUp = 'Se quiser, posso procurar opções em outro bairro, mudar a faixa de preço ou agendar uma visita!';
    } else if (entityType === 'product') {
      followUp = 'Se quiser, posso te mostrar o mais barato, comparar os produtos ou filtrar por uma marca específica.';
    }
    blocks.push(followUp);

    return blocks.join('\n\n');
  }

  /**
   * Converte a lista de itens para cards estruturados para Web Chat
   */
  static formatStructuredCards(
    items: CatalogItemResult[],
    settings?: CatalogConsultantSettings
  ) {
    const sendPrices = settings?.send_prices !== false;
    const sendDescriptions = settings?.send_descriptions !== false;
    const sendLinks = settings?.send_links !== false;
    const sendImages = settings?.send_images !== false;

    return items.map((item, idx) => ({
      index: idx + 1,
      id: item.id,
      name: item.name,
      brand: item.brand,
      category: item.category,
      entity_type: item.entity_type,
      description: sendDescriptions ? item.description : undefined,
      price: sendPrices ? item.price : null,
      formatted_price: sendPrices ? item.formatted_price : 'Preço sob consulta',
      image: sendImages ? item.main_image : undefined,
      images: sendImages ? item.images : [],
      source_url: sendLinks ? item.source_url : undefined,
      cta_label: item.cta?.label || 'Ver no Site',
      attributes: item.attributes,
      score: item.score
    }));
  }
}
