// =========================================================================
// CATALOG FORMATTER — Formatação Universal de Resultados
// Suporta todos os segmentos: product, property, vehicle, restaurant,
// service, hotel, course, job, event, agro
// =========================================================================

import { CatalogItemResult, CatalogConsultantSettings } from '../../types/index.js';

export class CatalogFormatter {
  /**
   * Emoji característico por segmento
   */
  private static getEntityEmoji(entityType?: string): string {
    switch (entityType) {
      case 'property':   return '🏠';
      case 'vehicle':    return '🚗';
      case 'restaurant': return '🍕';
      case 'service':    return '⚙️';
      case 'hotel':      return '🏨';
      case 'course':     return '🎓';
      case 'job':        return '💼';
      case 'event':      return '🎫';
      case 'agro':       return '🌱';
      default:           return '📦';
    }
  }

  /**
   * Label de CTA por segmento
   */
  private static getCtaLabel(entityType?: string): string {
    switch (entityType) {
      case 'property':   return 'Ver Imóvel';
      case 'vehicle':    return 'Ver Veículo';
      case 'hotel':      return 'Ver Hotel';
      case 'course':     return 'Ver Curso';
      case 'job':        return 'Ver Vaga';
      case 'service':    return 'Ver Serviço';
      case 'restaurant': return 'Ver Prato';
      case 'event':      return 'Ver Evento';
      case 'agro':       return 'Ver Oferta';
      default:           return 'Ver Detalhes';
    }
  }

  /**
   * Pergunta de follow-up por segmento
   */
  private static getFollowUp(entityType?: string): string {
    switch (entityType) {
      case 'property':   return 'Quer ver outras opções, mudar a faixa de preço, ou agendar uma visita? 😊';
      case 'vehicle':    return 'Posso buscar por outra marca, faixa de preço ou ano. Deseja agendar um test drive?';
      case 'hotel':      return 'Posso verificar disponibilidade para as suas datas ou buscar outras acomodações!';
      case 'course':     return 'Quer saber sobre carga horária, formas de pagamento ou modalidade (online/presencial)?';
      case 'job':        return 'Deseja mais detalhes sobre a vaga ou saber como se candidatar?';
      case 'restaurant': return 'Quer ver o menu completo, outros pratos ou adicionar ao pedido?';
      case 'service':    return 'Posso detalhar mais o serviço, verificar disponibilidade ou agendar para você!';
      case 'event':      return 'Posso verificar disponibilidade de ingressos ou buscar outros eventos próximos!';
      case 'agro':       return 'Precisa de mais informações sobre a oferta ou quer entrar em contato com o fornecedor?';
      default:           return 'Se quiser, posso refinar a busca, filtrar por preço ou mostrar mais opções!';
    }
  }

  /**
   * Extrai atributos relevantes para texto por segmento
   */
  private static formatAttributesSummary(item: CatalogItemResult): string[] {
    const lines: string[] = [];
    const attrs = item.attributes || {};

    switch (item.entity_type) {
      case 'property': {
        const parts: string[] = [];
        if (attrs.bedrooms || attrs.quartos) parts.push(`${attrs.bedrooms || attrs.quartos} quartos`);
        if (attrs.suites) parts.push(`${attrs.suites} suítes`);
        if (attrs.bathrooms || attrs.banheiros) parts.push(`${attrs.bathrooms || attrs.banheiros} banheiros`);
        if (attrs.parking_spaces || attrs.vagas) parts.push(`${attrs.parking_spaces || attrs.vagas} vagas`);
        if (attrs.built_area || attrs.area_construida) parts.push(`${attrs.built_area || attrs.area_construida} m²`);
        if (parts.length > 0) lines.push(parts.join(' • '));

        const transLabel = attrs.transaction_type || attrs.tipo_transacao;
        if (transLabel) lines.push(`Negociação: ${transLabel}`);

        const locParts: string[] = [];
        if (attrs.neighborhood || attrs.bairro) locParts.push(attrs.neighborhood || attrs.bairro);
        if (attrs.city || attrs.cidade) locParts.push(attrs.city || attrs.cidade);
        if (locParts.length > 0) lines.push(`📍 ${locParts.join(', ')}`);

        const extras: string[] = [];
        if (attrs.condominium_fee || attrs.condominio) extras.push(`Cond.: R$ ${(attrs.condominium_fee || attrs.condominio).toLocaleString('pt-BR')}/mês`);
        if (attrs.iptu) extras.push(`IPTU: R$ ${attrs.iptu.toLocaleString('pt-BR')}/ano`);
        if (extras.length > 0) lines.push(extras.join(' • '));
        break;
      }

      case 'vehicle': {
        const parts: string[] = [];
        if (attrs.year || attrs.ano) parts.push(`Ano ${attrs.year || attrs.ano}`);
        if (attrs.mileage || attrs.km) parts.push(`${(attrs.mileage || attrs.km).toLocaleString('pt-BR')} km`);
        if (attrs.fuel || attrs.combustivel) parts.push(attrs.fuel || attrs.combustivel);
        if (attrs.transmission || attrs.cambio) parts.push(attrs.transmission || attrs.cambio);
        if (attrs.color || attrs.cor) parts.push(attrs.color || attrs.cor);
        if (parts.length > 0) lines.push(parts.join(' • '));
        if (item.brand) lines.push(`Marca: ${item.brand}`);
        break;
      }

      case 'hotel': {
        const stars = attrs.stars || attrs.estrelas;
        if (stars) lines.push(`${'⭐'.repeat(Math.min(Number(stars), 5))} (${stars} estrelas)`);
        const parts: string[] = [];
        if (attrs.check_in) parts.push(`Check-in: ${attrs.check_in}`);
        if (attrs.check_out) parts.push(`Check-out: ${attrs.check_out}`);
        if (parts.length > 0) lines.push(parts.join(' • '));
        const amenities = attrs.amenities || [];
        if (amenities.length > 0) lines.push(`Comodidades: ${amenities.slice(0, 5).join(', ')}`);
        const locParts: string[] = [];
        if (attrs.neighborhood || attrs.bairro) locParts.push(attrs.neighborhood || attrs.bairro);
        if (attrs.city || attrs.cidade) locParts.push(attrs.city || attrs.cidade);
        if (locParts.length > 0) lines.push(`📍 ${locParts.join(', ')}`);
        break;
      }

      case 'course': {
        const parts: string[] = [];
        if (attrs.modality || attrs.modalidade) parts.push(attrs.modality || attrs.modalidade);
        if (attrs.duration_hours || attrs.carga_horaria) parts.push(`${attrs.duration_hours || attrs.carga_horaria}h`);
        if (attrs.has_certificate || attrs.certificado) parts.push('🎓 Com certificado');
        if (parts.length > 0) lines.push(parts.join(' • '));
        if (attrs.instructor || attrs.instrutor) lines.push(`Instrutor: ${attrs.instructor || attrs.instrutor}`);
        if (attrs.start_date || attrs.inicio) lines.push(`Início: ${attrs.start_date || attrs.inicio}`);
        break;
      }

      case 'job': {
        const parts: string[] = [];
        if (attrs.employment_type || attrs.regime) parts.push(attrs.employment_type || attrs.regime);
        if (attrs.work_mode || attrs.modalidade_trabalho) parts.push(attrs.work_mode || attrs.modalidade_trabalho);
        if (parts.length > 0) lines.push(parts.join(' • '));
        const salary = attrs.salary_min || attrs.salario_min;
        const salaryMax = attrs.salary_max || attrs.salario_max;
        if (salary) {
          const salaryStr = salaryMax
            ? `R$ ${Number(salary).toLocaleString('pt-BR')} – R$ ${Number(salaryMax).toLocaleString('pt-BR')}`
            : `A partir de R$ ${Number(salary).toLocaleString('pt-BR')}`;
          lines.push(`💰 ${salaryStr}`);
        } else if (attrs.salary_info || attrs.salario_info) {
          lines.push(`💰 ${attrs.salary_info || attrs.salario_info}`);
        }
        const locParts: string[] = [];
        if (attrs.city || attrs.cidade) locParts.push(attrs.city || attrs.cidade);
        if (locParts.length > 0) lines.push(`📍 ${locParts.join(', ')}`);
        break;
      }

      case 'event': {
        const parts: string[] = [];
        if (attrs.date || attrs.data) parts.push(attrs.date || attrs.data);
        if (attrs.time || attrs.horario) parts.push(attrs.time || attrs.horario);
        if (parts.length > 0) lines.push(`📅 ${parts.join(' às ')}`);
        if (attrs.venue || attrs.local) lines.push(`📍 ${attrs.venue || attrs.local}`);
        const locParts: string[] = [];
        if (attrs.city || attrs.cidade) locParts.push(attrs.city || attrs.cidade);
        if (locParts.length > 0) lines.push(`🏙️ ${locParts.join(', ')}`);
        break;
      }

      case 'agro': {
        const parts: string[] = [];
        if (attrs.crop_type || attrs.cultura) parts.push(attrs.crop_type || attrs.cultura);
        if (attrs.area || attrs.area_ha) parts.push(`${attrs.area || attrs.area_ha} ha`);
        if (parts.length > 0) lines.push(parts.join(' • '));
        const locParts: string[] = [];
        if (attrs.city || attrs.cidade) locParts.push(attrs.city || attrs.cidade);
        if (attrs.state || attrs.estado) locParts.push(attrs.state || attrs.estado);
        if (locParts.length > 0) lines.push(`📍 ${locParts.join(', ')}`);
        break;
      }

      case 'service': {
        if (attrs.duration_minutes || attrs.duracao) {
          lines.push(`⏱️ Duração: ${attrs.duration_minutes || attrs.duracao} min`);
        }
        if (attrs.provider || attrs.prestador) lines.push(`Profissional: ${attrs.provider || attrs.prestador}`);
        break;
      }

      default: {
        // Produto geral / Suplemento
        const parts: string[] = [];
        if (item.brand) parts.push(`Marca: ${item.brand}`);
        if (attrs.weight || attrs.peso) parts.push(`Peso: ${attrs.weight || attrs.peso}`);
        if (attrs.volume) parts.push(`Volume: ${attrs.volume}`);
        if (attrs.size || attrs.tamanho) parts.push(`Tamanho: ${attrs.size || attrs.tamanho}`);
        if (attrs.color || attrs.cor) parts.push(`Cor: ${attrs.color || attrs.cor}`);
        if (parts.length > 0) lines.push(parts.join(' • '));
        break;
      }
    }

    return lines;
  }

  /**
   * Formata os itens em mensagem de texto para WhatsApp, Telegram ou Instagram
   */
  static formatTextResponse(
    items: CatalogItemResult[],
    settings?: CatalogConsultantSettings,
    headerMessage?: string
  ): string {
    if (items.length === 0) {
      return 'Não encontrei nenhum item correspondente no catálogo no momento. Posso verificar com a empresa ou refinar a busca.';
    }

    const sendPrices = settings?.send_prices !== false;
    const sendDescriptions = settings?.send_descriptions !== false;
    const sendLinks = settings?.send_links !== false;
    const sendImages = settings?.send_images !== false;

    const blocks: string[] = [];

    const intro = headerMessage || (items.length === 1
      ? 'Encontrei esta opção para você:'
      : `Encontrei ${items.length} opções que combinam com o que você procura:`);
    blocks.push(intro);

    items.forEach((item, idx) => {
      const num = idx + 1;
      const emoji = this.getEntityEmoji(item.entity_type);
      const lines: string[] = [];

      if (sendImages && item.main_image) {
        lines.push(`[IMAGEM: ${item.main_image}]`);
      }

      lines.push(`${emoji} ${num}. *${item.name}*${item.brand ? ` — ${item.brand}` : ''}`);

      const attrLines = this.formatAttributesSummary(item);
      attrLines.forEach(al => lines.push(al));

      if (sendDescriptions && item.description && item.description.trim().length > 0) {
        const cleanDesc = item.description.length > 200
          ? item.description.slice(0, 200) + '...'
          : item.description;
        lines.push(cleanDesc);
      }

      if (sendPrices) {
        lines.push(`💰 ${item.formatted_price}`);
      }

      if (sendLinks && item.source_url &&
          (item.source_url.startsWith('http://') || item.source_url.startsWith('https://'))) {
        const ctaLabel = item.cta?.label || this.getCtaLabel(item.entity_type);
        lines.push(`👉 ${ctaLabel}: ${item.source_url}`);
      }

      blocks.push(lines.join('\n'));
    });

    blocks.push(this.getFollowUp(items[0]?.entity_type));

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
      entity_emoji: this.getEntityEmoji(item.entity_type),
      description: sendDescriptions ? item.description : undefined,
      price: sendPrices ? item.price : null,
      formatted_price: sendPrices ? item.formatted_price : 'Preço sob consulta',
      image: sendImages ? item.main_image : undefined,
      images: sendImages ? item.images : [],
      source_url: sendLinks ? item.source_url : undefined,
      cta_label: this.getCtaLabel(item.entity_type),
      attributes: item.attributes,
      attributes_summary: this.formatAttributesSummary(item),
      score: item.score
    }));
  }
}
