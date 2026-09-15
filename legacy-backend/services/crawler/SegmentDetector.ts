import { BusinessType } from '../../types/index.js';

export class SegmentDetector {
  /**
   * Automatically detects the business segment from URL, title, meta description and extracted texts.
   */
  static detect(url: string, title?: string, description?: string, pageTexts: string = ''): BusinessType {
    const combined = `${url} ${title || ''} ${description || ''} ${pageTexts}`.toLowerCase();

    // 1. Restaurant / Delivery / Menu
    if (
      combined.match(/\b(cardapio|cardápio|restaurante|pizzaria|hamburgueria|lanches|ifood|pratos|refeicao|refeição|gastronomia|culinaria|bebidas|porcoes|porções)\b/)
    ) {
      return 'RESTAURANTE';
    }

    // 2. Real Estate (Imobiliária)
    if (
      combined.match(/\b(imobiliaria|imobiliária|imoveis|imóveis|corretor|creci|apartamento|casa para alugar|venda de casas|locacao|locação|terreno|condominio)\b/)
    ) {
      return 'IMOBILIÁRIA';
    }

    // 3. Dealership / Vehicles (Concessionária)
    if (
      combined.match(/\b(concessionaria|concessionária|veiculos|veículos|seminovos|carros|motos|km rodados|cambio|quilometragem|fipe|financiamento de autos)\b/)
    ) {
      return 'CONCESSIONÁRIA';
    }

    // 4. Hotel / Pousada
    if (
      combined.match(/\b(hotel|pousada|resort|hospedagem|check-in|check-out|diaria|diária|suites|suítes|quartos|reserva)\b/)
    ) {
      return 'HOTEL';
    }

    // 5. Services / Clinics / Agencies / Salons
    if (
      combined.match(/\b(clinica|clínica|consultorio|consultório|advocacia|escritorio|estetica|estética|barbearia|salao|salão|consultoria|agendamento|atendimento|sessao|sessão)\b/)
    ) {
      return 'SERVIÇOS';
    }

    // 6. E-commerce / Online Shop
    if (
      combined.match(/\b(carrinho|checkout|frete|comprar agora|loja virtual|ecommerce|e-commerce|pagseguro|mercadopago|parcelamento)\b/)
    ) {
      return 'ECOMMERCE';
    }

    // 7. General Shop
    if (
      combined.match(/\b(loja|boutique|calcados|calçados|vestuario|vestuário|eletronicos|eletrônicos|produtos)\b/)
    ) {
      return 'LOJA';
    }

    return 'EMPRESA_GERAL';
  }
}
