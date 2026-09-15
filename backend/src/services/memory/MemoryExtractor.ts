// =========================================================================
// MEMORY EXTRACTOR — Extração Seletiva e Inteligente de Memórias
// Analisa texto de conversa e extrai APENAS informações persistentes e úteis.
// NÃO extrai ruídos como "kkk", "ok", "tá bom" etc.
// =========================================================================

export type MemoryType = 'CUSTOMER' | 'OPERATIONAL' | 'PREFERENCE' | 'CONTEXT' | 'BEHAVIOR';
export type MemoryVisibility = 'INTERNAL' | 'CUSTOMER_VISIBLE' | 'RESTRICTED';
export type MemoryConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNCERTAIN';
export type MemorySource = 'conversation' | 'system' | 'admin' | 'document' | 'inference';

export interface MemoryCandidate {
  memory_type: MemoryType;
  entity_type?: string;       // customer, order, vehicle, service, appointment
  entity_id?: string;
  key: string;
  value: string;
  value_json?: Record<string, any>;
  confidence_level: MemoryConfidenceLevel;
  source: MemorySource;
  visibility: MemoryVisibility;
  valid_until?: Date;         // null = sem expiração
  reason: string;             // Motivo da extração (para auditoria)
}

interface ExtractionContext {
  senderType: 'customer' | 'agent' | 'human' | 'system';
  conversationId?: string;
  customerId?: string;
  companyId?: string;
  // Dados operacionais já consultados (para não repetir memória desnecessária)
  existingOrders?: Array<{ id: string; status: string }>;
}

export class MemoryExtractor {
  // Palavras de baixo valor que NÃO viram memória
  private static readonly NOISE_PATTERNS = [
    /^(ok|oks|okay|tá|ta|blz|beleza|entendi|certo|certo!|sim|não|nao|boa|show|legal|ótimo|otimo|perfeito|obrigado?|vlw|valeu|haha|kk+|rs+|😊|👍|✅)\.?$/i,
    /^.{1,3}$/, // Menos de 4 caracteres
  ];

  // Padrões de extração por categoria
  private static readonly PATTERNS = {
    // ---- CUSTOMER MEMORIES ----
    name: [
      { regex: /meu nome é ([A-Za-zÀ-ÖØ-öø-ÿ\s]{2,50})/i, key: 'customer_name', confidence: 'HIGH' as MemoryConfidenceLevel },
      { regex: /pode me chamar de ([A-Za-zÀ-ÖØ-öø-ÿ\s]{2,30})/i, key: 'customer_name', confidence: 'HIGH' as MemoryConfidenceLevel },
      { regex: /sou (?:o|a) ([A-Za-zÀ-ÖØ-öø-ÿ\s]{2,30})/i, key: 'customer_name', confidence: 'MEDIUM' as MemoryConfidenceLevel },
    ],
    email: [
      { regex: /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/, key: 'customer_email', confidence: 'HIGH' as MemoryConfidenceLevel },
    ],
    city: [
      { regex: /(?:moro|sou|fico|estou) (?:em|no|na) ([A-Za-zÀ-ÖØ-öø-ÿ\s]{2,40})/i, key: 'customer_city', confidence: 'MEDIUM' as MemoryConfidenceLevel },
    ],
    company_name: [
      { regex: /(?:minha empresa|trabalho na|sou da) ([A-Za-zÀ-ÖØ-öø-ÿ\s]{2,60})/i, key: 'customer_company', confidence: 'MEDIUM' as MemoryConfidenceLevel },
    ],

    // ---- VEHICLE MEMORIES ----
    vehicle: [
      { regex: /meu carro (?:é |é um )?([A-Za-zÀ-ÖØ-öø-ÿ0-9\s]{2,50})/i, key: 'vehicle_model', confidence: 'HIGH' as MemoryConfidenceLevel },
      { regex: /(?:tenho|possuo) (?:uma?|um) ([A-Za-zÀ-ÖØ-öø-ÿ0-9\s]{2,40}) (?:\d{4})/i, key: 'vehicle_model', confidence: 'HIGH' as MemoryConfidenceLevel },
      { regex: /placa (?:é |é a )?([A-Z]{3}[- ]?\d[A-Z0-9]\d{2})/i, key: 'vehicle_plate', confidence: 'HIGH' as MemoryConfidenceLevel },
    ],

    // ---- PREFERENCE MEMORIES ----
    preference_time: [
      { regex: /prefiro (?:ser atendido|receber (?:atendimento|ligação|contato)) (?:pela|de) (manhã|tarde|noite|madrugada)/i, key: 'preference_contact_time', confidence: 'HIGH' as MemoryConfidenceLevel },
      { regex: /(?:pode me ligar|me ligue|me contate) (?:pela|de) (manhã|tarde|noite)/i, key: 'preference_contact_time', confidence: 'HIGH' as MemoryConfidenceLevel },
    ],
    preference_payment: [
      { regex: /prefiro pagar (?:no|com|via|em|pelo) (pix|cartão|dinheiro|débito|crédito)/i, key: 'preference_payment', confidence: 'HIGH' as MemoryConfidenceLevel },
    ],
    preference_delivery: [
      { regex: /prefiro (?:retirar|buscar|pegar) (?:no local|na loja|pessoalmente)/i, key: 'preference_delivery', confidence: 'HIGH' as MemoryConfidenceLevel },
      { regex: /quero (?:entrega|delivery) (?:em casa|no endereço)/i, key: 'preference_delivery', confidence: 'MEDIUM' as MemoryConfidenceLevel },
    ],

    // ---- OPERATIONAL MEMORIES (somente quando agent/human confirma) ----
    order_status: [
      { regex: /(?:pedido|order).{0,30}(?:está|foi|ficou) (em preparo|confirmado|saiu para entrega|entregue|cancelado|pronto)/i, key: 'order_status_info', confidence: 'HIGH' as MemoryConfidenceLevel },
    ],
    service_status: [
      { regex: /(?:serviço|conserto|reparo|os).{0,40}(?:está|foi|ficou) (em andamento|pronto|concluído|aguardando|aprovado)/i, key: 'service_status_info', confidence: 'HIGH' as MemoryConfidenceLevel },
      { regex: /(?:problema|defeito|falha).{0,40}(?:na|no|em) ([A-Za-zÀ-ÖØ-öø-ÿ\s]{3,60})/i, key: 'service_diagnosis', confidence: 'HIGH' as MemoryConfidenceLevel },
    ],
    appointment: [
      { regex: /(?:agendado|agendamento|visita|consulta).{0,30}(?:para|em|dia) ([A-Za-z0-9\s\/\-à,]{3,40})/i, key: 'appointment_info', confidence: 'HIGH' as MemoryConfidenceLevel },
    ],
    deadline: [
      { regex: /(?:ficará pronto|será entregue|previsão).{0,30}(?:amanhã|em \d+ dias?|até (?:sexta|segunda|terça|quarta|quinta|sábado|domingo)|dia \d{1,2})/i, key: 'operational_deadline', confidence: 'HIGH' as MemoryConfidenceLevel },
    ],

    // ---- ADDRESS ----
    address: [
      { regex: /(?:meu endereço|entrego em|endereço é)[:\s]+([A-Za-zÀ-ÖØ-öø-ÿ0-9\s,.\-]{10,100})/i, key: 'customer_address', confidence: 'HIGH' as MemoryConfidenceLevel },
    ],
  };

  /**
   * Calcula valid_until a partir de expressões temporais no texto
   */
  private static calculateValidUntil(text: string): Date | undefined {
    const lower = text.toLowerCase();
    const now = new Date();

    if (lower.includes('amanhã')) {
      const d = new Date(now);
      d.setDate(d.getDate() + 2); // expira 2 dias depois (amanhã + 1 dia de margem)
      return d;
    }

    const daysMatch = text.match(/em (\d+) dias?/i);
    if (daysMatch) {
      const d = new Date(now);
      d.setDate(d.getDate() + parseInt(daysMatch[1]) + 1);
      return d;
    }

    const weekdays: Record<string, number> = {
      domingo: 0, segunda: 1, terça: 2, quarta: 3, quinta: 4, sexta: 5, sábado: 6
    };
    for (const [day, num] of Object.entries(weekdays)) {
      if (lower.includes(day)) {
        const d = new Date(now);
        const diff = (num - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + diff + 1); // expira 1 dia após o prazo
        return d;
      }
    }

    return undefined;
  }

  /**
   * Verifica se o texto é ruído sem valor de memória
   */
  private static isNoise(text: string): boolean {
    const t = text.trim();
    return this.NOISE_PATTERNS.some(p => p.test(t));
  }

  /**
   * Extrai candidatos a memória de uma mensagem
   */
  public static extract(
    text: string,
    context: ExtractionContext
  ): MemoryCandidate[] {
    if (!text || this.isNoise(text)) return [];

    const candidates: MemoryCandidate[] = [];
    const isFromAgent = context.senderType === 'agent' || context.senderType === 'human';

    for (const [category, patterns] of Object.entries(this.PATTERNS)) {
      for (const pattern of patterns) {
        const match = text.match(pattern.regex);
        if (!match || !match[1]) continue;

        const extractedValue = match[1].trim();
        if (extractedValue.length < 2) continue;

        // Memórias operacionais só têm HIGH confidence quando vêm do agente/humano
        let confidence = pattern.confidence;
        const isOperational = ['order_status', 'service_status', 'appointment', 'deadline'].includes(category);

        if (isOperational && !isFromAgent) {
          // Cliente afirmou — rebaixa para LOW (precisa validar no sistema)
          confidence = 'LOW';
        }

        // Determina visibilidade
        let visibility: MemoryVisibility = 'CUSTOMER_VISIBLE';
        if (category === 'preference_time' || category === 'preference_payment') {
          visibility = 'INTERNAL'; // Preferências são operacionais, não expostas de volta
        }

        // Determina tipo de memória
        let memory_type: MemoryType = 'CUSTOMER';
        let entity_type: string | undefined;

        if (['order_status', 'deadline'].includes(category)) {
          memory_type = 'OPERATIONAL';
          entity_type = 'order';
        } else if (['service_status', 'service_diagnosis', 'appointment'].includes(category)) {
          memory_type = 'OPERATIONAL';
          entity_type = 'service';
        } else if (category.startsWith('vehicle')) {
          memory_type = 'CUSTOMER';
          entity_type = 'vehicle';
        } else if (category.startsWith('preference')) {
          memory_type = 'PREFERENCE';
        } else if (category === 'address') {
          memory_type = 'CUSTOMER';
          entity_type = 'customer';
        }

        // Calcula expiração para memórias com deadline temporal
        const validUntil = (isOperational || category === 'deadline')
          ? this.calculateValidUntil(text)
          : undefined;

        candidates.push({
          memory_type,
          entity_type,
          key: pattern.key,
          value: extractedValue,
          confidence_level: confidence,
          source: isFromAgent ? 'system' : 'conversation',
          visibility,
          valid_until: validUntil,
          reason: `Extraído da mensagem (${context.senderType}): padrão '${category}'`
        });
      }
    }

    return candidates;
  }
}
