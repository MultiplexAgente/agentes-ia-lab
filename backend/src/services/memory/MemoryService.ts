// =========================================================================
// MEMORY SERVICE — Memória Empresarial Multi-Tenant
// Supabase-first com fallback em Map (funciona mesmo sem conexão)
// =========================================================================

import { v4 as uuidv4 } from 'uuid';
import { store, supabase } from '../../config/database.js';
import { Message, AgentMemoryItem } from '../../types/index.js';
import {
  MemoryCandidate,
  MemoryType,
  MemoryVisibility,
  MemoryConfidenceLevel,
} from './MemoryExtractor.js';

// Tipo expandido da memória (versão enterprise)
export interface EnterpriseMemoryItem {
  id: string;
  company_id: string;
  agent_id?: string;
  customer_id: string;
  conversation_id?: string;
  message_id?: string;
  memory_type: MemoryType;
  entity_type?: string;
  entity_id?: string;
  key: string;
  value: string;
  value_json?: Record<string, any>;
  confidence: number;             // 0.0 – 1.0
  confidence_level: MemoryConfidenceLevel;
  source: string;
  visibility: MemoryVisibility;
  valid_from: string;
  valid_until?: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

interface StoreMemoryParams {
  companyId: string;
  customerId: string;
  agentId?: string;
  conversationId?: string;
  messageId?: string;
  candidate: MemoryCandidate;
}

interface RetrieveParams {
  companyId: string;
  customerId: string;
  query: string;               // Texto da pergunta para selecionar memórias relevantes
  requestorType?: 'customer' | 'agent' | 'admin';
  limit?: number;
}

export class MemoryService {
  // =========================================================================
  // MENSAGENS (Short-term memory — histórico de conversa)
  // =========================================================================

  public async getConversationHistory(
    conversationId: string,
    limit: number = 10
  ): Promise<Message[]> {
    // Prioriza Supabase
    if (supabase) {
      try {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(limit);
        if (data && data.length > 0) return data as Message[];
      } catch {
        // Fallback
      }
    }
    const messages = store.messages.get(conversationId) || [];
    return messages.slice(-limit);
  }

  public async addMessage(
    conversationId: string,
    companyId: string,
    senderType: 'customer' | 'agent' | 'human',
    text: string,
    externalMessageId?: string
  ): Promise<Message> {
    const message: Message = {
      id: uuidv4(),
      conversation_id: conversationId,
      company_id: companyId,
      sender_type: senderType,
      external_message_id: externalMessageId,
      text,
      media_type: 'text',
      status: senderType === 'agent' ? 'sent' : 'received',
      created_at: new Date().toISOString(),
    };

    // Persiste no Supabase
    if (supabase) {
      try {
        await supabase.from('messages').insert({
          id: message.id,
          conversation_id: conversationId,
          company_id: companyId,
          sender_type: senderType,
          external_message_id: externalMessageId || null,
          text,
          media_type: 'text',
          status: message.status,
          created_at: message.created_at,
        });
      } catch {
        // Continua com store local
      }
    }

    // Store local (sempre)
    const existing = store.messages.get(conversationId) || [];
    existing.push(message);
    store.messages.set(conversationId, existing);

    // Atualiza resumo na conversa
    const conv = store.conversations.get(conversationId);
    if (conv) {
      conv.last_message_text = text;
      conv.last_message_at = message.created_at;
      store.conversations.set(conversationId, conv);
    }

    return message;
  }

  // =========================================================================
  // MEMÓRIA DE LONGO PRAZO (Enterprise)
  // =========================================================================

  /**
   * Armazena uma memória candidata.
   * Invalida automaticamente a memória anterior com a mesma chave.
   */
  public async storeMemory(params: StoreMemoryParams): Promise<EnterpriseMemoryItem> {
    const { companyId, customerId, agentId, conversationId, messageId, candidate } = params;

    // 1. Invalida memória anterior com a mesma key (se existir)
    await this.invalidatePreviousMemory({
      companyId,
      customerId,
      key: candidate.key,
      reason: `Substituída por nova memória: ${candidate.value}`,
      conversationId,
    });

    const now = new Date().toISOString();
    const newMemory: EnterpriseMemoryItem = {
      id: uuidv4(),
      company_id: companyId,
      agent_id: agentId,
      customer_id: customerId,
      conversation_id: conversationId,
      message_id: messageId,
      memory_type: candidate.memory_type,
      entity_type: candidate.entity_type,
      entity_id: candidate.entity_id,
      key: candidate.key,
      value: candidate.value,
      value_json: candidate.value_json,
      confidence: this.confidenceLevelToFloat(candidate.confidence_level),
      confidence_level: candidate.confidence_level,
      source: candidate.source,
      visibility: candidate.visibility,
      valid_from: now,
      valid_until: candidate.valid_until ? candidate.valid_until.toISOString() : null,
      is_current: true,
      created_at: now,
      updated_at: now,
    };

    // Persiste no Supabase
    if (supabase) {
      try {
        await supabase.from('agent_memory').insert({
          id: newMemory.id,
          company_id: companyId,
          customer_id: customerId,
          agent_id: agentId || null,
          conversation_id: conversationId || null,
          message_id: messageId || null,
          memory_type: candidate.memory_type,   // Fallback para coluna original
          memory_type_v2: candidate.memory_type,
          entity_type: candidate.entity_type || null,
          entity_id: candidate.entity_id || null,
          key: candidate.key,
          value: candidate.value,
          value_json: candidate.value_json || null,
          confidence: newMemory.confidence,
          confidence_level: candidate.confidence_level,
          source: candidate.source,
          visibility: candidate.visibility,
          valid_from: newMemory.valid_from,
          valid_until: newMemory.valid_until || null,
          is_current: true,
        });

        // Auditoria
        await supabase.from('agent_memory_audit').insert({
          memory_id: newMemory.id,
          company_id: companyId,
          customer_id: customerId,
          action: 'CREATED',
          new_value: candidate.value,
          new_value_json: candidate.value_json || null,
          reason: candidate.reason,
          source: candidate.source,
          performed_by: 'system',
          conversation_id: conversationId || null,
          message_id: messageId || null,
        });
      } catch {
        // Continua com store local
      }
    }

    // Store local (sempre)
    const memories = store.memories.get(customerId) || [];
    memories.push(newMemory as any);
    store.memories.set(customerId, memories);

    return newMemory;
  }

  /**
   * Invalida uma memória anterior pelo key (marca is_current = false)
   */
  private async invalidatePreviousMemory(params: {
    companyId: string;
    customerId: string;
    key: string;
    reason: string;
    conversationId?: string;
  }): Promise<void> {
    const { companyId, customerId, key, reason, conversationId } = params;

    // Supabase
    if (supabase) {
      try {
        const { data: old } = await supabase
          .from('agent_memory')
          .select('id, value, value_json')
          .eq('company_id', companyId)
          .eq('customer_id', customerId)
          .eq('key', key)
          .eq('is_current', true);

        if (old && old.length > 0) {
          for (const m of old) {
            await supabase.from('agent_memory').update({
              is_current: false,
              updated_at: new Date().toISOString(),
            }).eq('id', m.id);

            await supabase.from('agent_memory_audit').insert({
              memory_id: m.id,
              company_id: companyId,
              customer_id: customerId,
              action: 'INVALIDATED',
              previous_value: m.value,
              previous_value_json: m.value_json || null,
              reason,
              performed_by: 'system',
              conversation_id: conversationId || null,
            });
          }
        }
      } catch {
        // Continua
      }
    }

    // Store local
    const memories = store.memories.get(customerId) || [];
    memories.forEach(m => {
      if ((m as any).key === key && (m as any).company_id === companyId) {
        (m as any).is_current = false;
      }
    });
    store.memories.set(customerId, memories);
  }

  /**
   * Invalida explicitamente uma memória por ID
   */
  public async invalidateMemory(
    memoryId: string,
    companyId: string,
    reason: string,
    performedBy: string = 'system'
  ): Promise<void> {
    if (supabase) {
      try {
        const { data: m } = await supabase
          .from('agent_memory')
          .select('id, value, value_json, customer_id')
          .eq('id', memoryId)
          .eq('company_id', companyId) // Garante isolamento multi-tenant
          .single();

        if (m) {
          await supabase.from('agent_memory').update({
            is_current: false,
            updated_at: new Date().toISOString(),
          }).eq('id', memoryId);

          await supabase.from('agent_memory_audit').insert({
            memory_id: memoryId,
            company_id: companyId,
            customer_id: m.customer_id,
            action: 'INVALIDATED',
            previous_value: m.value,
            reason,
            performed_by: performedBy,
          });
        }
      } catch {
        // Silently ignore
      }
    }
  }

  /**
   * RECUPERAÇÃO SELETIVA — retorna APENAS memórias relevantes para a query.
   * NÃO envia tudo para a IA.
   */
  public async retrieveRelevantMemories(params: RetrieveParams): Promise<EnterpriseMemoryItem[]> {
    const {
      companyId,
      customerId,
      query,
      requestorType = 'agent',
      limit = 15,
    } = params;

    // 1. Expira memórias vencidas antes de recuperar
    await this.expireStaleMemories(customerId, companyId);

    // 2. Keywords para filtragem semântica leve
    const keywords = this.extractKeywords(query);

    let allMemories: EnterpriseMemoryItem[] = [];

    // 3. Busca no Supabase (Supabase-first)
    if (supabase) {
      try {
        const { data } = await supabase
          .from('agent_memory')
          .select('*')
          .eq('company_id', companyId)
          .eq('customer_id', customerId)
          .eq('is_current', true)
          .order('updated_at', { ascending: false })
          .limit(100);

        if (data) allMemories = data as EnterpriseMemoryItem[];
      } catch {
        // Fallback para store local
      }
    }

    // Fallback: store local
    if (allMemories.length === 0) {
      const raw = store.memories.get(customerId) || [];
      allMemories = raw
        .filter(m => (m as any).company_id === companyId && ((m as any).is_current !== false))
        .map(m => m as any as EnterpriseMemoryItem);
    }

    // 4. Filtra por visibilidade (cliente não pode ver INTERNAL/RESTRICTED)
    if (requestorType === 'customer') {
      allMemories = allMemories.filter(m => m.visibility === 'CUSTOMER_VISIBLE');
    }

    // 5. Filtragem semântica por relevância
    const scored = allMemories.map(m => ({
      memory: m,
      score: this.scoreRelevance(m, keywords),
    }));

    // 6. Ordena por score DESC, limita
    return scored
      .sort((a, b) => b.score - a.score)
      .filter(s => s.score > 0)
      .slice(0, limit)
      .map(s => s.memory);
  }

  /**
   * Recupera memória legada (compatibilidade com AIService existente)
   */
  public async getCustomerMemory(
    customerId: string,
    companyId: string
  ): Promise<AgentMemoryItem[]> {
    const enterprise = await this.retrieveRelevantMemories({
      companyId,
      customerId,
      query: '',
      limit: 20,
    });

    return enterprise.map(m => ({
      id: m.id,
      company_id: m.company_id,
      customer_id: m.customer_id,
      memory_type: 'preference' as any,
      key: m.key,
      value: m.value,
      confidence: m.confidence,
    }));
  }

  /**
   * Versão legada mantida para compatibilidade
   */
  public async saveCustomerMemory(
    customerId: string,
    companyId: string,
    key: string,
    value: string,
    memoryType: 'preference' | 'restriction' | 'order_habit' | 'address' = 'preference'
  ): Promise<AgentMemoryItem> {
    const { MemoryExtractor } = await import('./MemoryExtractor.js');
    const typeMap: Record<string, any> = {
      preference: 'PREFERENCE',
      restriction: 'CUSTOMER',
      order_habit: 'BEHAVIOR',
      address: 'CUSTOMER',
    };
    const result = await this.storeMemory({
      companyId,
      customerId,
      candidate: {
        memory_type: typeMap[memoryType] || 'CUSTOMER',
        key,
        value,
        confidence_level: 'MEDIUM',
        source: 'system',
        visibility: 'INTERNAL',
        reason: `Salvo via saveCustomerMemory (legado)`,
      },
    });

    return {
      id: result.id,
      company_id: companyId,
      customer_id: customerId,
      memory_type: memoryType,
      key,
      value,
      confidence: result.confidence,
    };
  }

  /**
   * Expira memórias vencidas (valid_until < NOW)
   */
  public async expireStaleMemories(
    customerId: string,
    companyId: string
  ): Promise<void> {
    const now = new Date().toISOString();

    if (supabase) {
      try {
        // Chamada à função SQL criada na migration 004
        await supabase.rpc('expire_stale_memories');
      } catch {
        // Fallback manual
      }
    }

    // Store local
    const memories = store.memories.get(customerId) || [];
    let changed = false;
    memories.forEach(m => {
      const mem = m as any;
      if (mem.valid_until && mem.is_current && mem.valid_until < now) {
        mem.is_current = false;
        changed = true;
      }
    });
    if (changed) store.memories.set(customerId, memories);
  }

  // =========================================================================
  // HELPERS PRIVADOS
  // =========================================================================

  private confidenceLevelToFloat(level: MemoryConfidenceLevel): number {
    const map: Record<MemoryConfidenceLevel, number> = {
      HIGH: 1.0,
      MEDIUM: 0.7,
      LOW: 0.4,
      UNCERTAIN: 0.2,
    };
    return map[level];
  }

  private extractKeywords(query: string): string[] {
    // Remove stopwords simples
    const stop = new Set(['o', 'a', 'os', 'as', 'de', 'da', 'do', 'em', 'no', 'na', 'com', 'que', 'e', 'é', 'para', 'como', 'está', 'meu', 'minha', 'seu', 'sua']);
    return query
      .toLowerCase()
      .replace(/[^\w\sÀ-ÖØ-öø-ÿ]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stop.has(w));
  }

  /**
   * Pontua a relevância de uma memória para a query do usuário
   */
  private scoreRelevance(memory: EnterpriseMemoryItem, keywords: string[]): number {
    if (keywords.length === 0) return 1; // Sem keywords = retorna tudo (contexto geral)

    let score = 0;
    const memText = `${memory.key} ${memory.value} ${memory.entity_type || ''}`.toLowerCase();

    // Mapeamentos semânticos: "carro" → busca vehicle, "pedido" → busca order
    const semanticMap: Record<string, string[]> = {
      carro: ['vehicle', 'vehicle_model', 'vehicle_plate'],
      veículo: ['vehicle', 'vehicle_model'],
      pedido: ['order', 'order_status_info', 'operational'],
      entrega: ['order', 'delivery', 'operational_deadline'],
      serviço: ['service', 'service_status_info', 'service_diagnosis'],
      conserto: ['service', 'service_status_info', 'service_diagnosis'],
      reparo: ['service', 'service_status_info'],
      oficina: ['service', 'vehicle'],
      agendamento: ['appointment_info'],
      nome: ['customer_name'],
      endereço: ['customer_address'],
      pagamento: ['preference_payment', 'operational'],
    };

    for (const kw of keywords) {
      if (memText.includes(kw)) {
        score += 2;
      }
      // Verifica semântica
      const related = semanticMap[kw] || [];
      for (const rel of related) {
        if (memText.includes(rel)) score += 1;
      }
    }

    // Boost para memórias operacionais atuais (sempre relevantes)
    if (memory.memory_type === 'OPERATIONAL' && memory.is_current) score += 1;

    // Boost para confiança alta
    if (memory.confidence_level === 'HIGH') score += 0.5;

    return score;
  }
}

export const memoryService = new MemoryService();
