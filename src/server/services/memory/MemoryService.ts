import { store } from '../../config/database';
import { Message, AgentMemoryItem, Customer } from '../../types/index';
import { v4 as uuidv4 } from 'uuid';

export class MemoryService {
  /**
   * Recupera as mensagens recentes da conversa atual (Memória de Curto Prazo)
   */
  public async getConversationHistory(conversationId: string, limit: number = 10): Promise<Message[]> {
    const messages = store.messages.get(conversationId) || [];
    return messages.slice(-limit);
  }

  /**
   * Registra uma nova mensagem na memória da conversa
   */
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
      created_at: new Date().toISOString()
    };

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

  /**
   * Recupera a memória de longo prazo do cliente (Preferências, hábitos, restrições)
   */
  public async getCustomerMemory(customerId: string, companyId: string): Promise<AgentMemoryItem[]> {
    const memories = store.memories.get(customerId) || [];
    // Filtro estrito de tenant
    return memories.filter(m => m.company_id === companyId);
  }

  /**
   * Salva ou atualiza um item na memória de longo prazo do cliente
   */
  public async saveCustomerMemory(
    customerId: string,
    companyId: string,
    key: string,
    value: string,
    memoryType: 'preference' | 'restriction' | 'order_habit' | 'address' = 'preference'
  ): Promise<AgentMemoryItem> {
    const memories = store.memories.get(customerId) || [];
    const existingIndex = memories.findIndex(m => m.key === key && m.company_id === companyId);

    const memoryItem: AgentMemoryItem = {
      id: existingIndex >= 0 ? memories[existingIndex].id : uuidv4(),
      company_id: companyId,
      customer_id: customerId,
      memory_type: memoryType,
      key,
      value,
      confidence: 1.0
    };

    if (existingIndex >= 0) {
      memories[existingIndex] = memoryItem;
    } else {
      memories.push(memoryItem);
    }

    store.memories.set(customerId, memories);
    return memoryItem;
  }
}

export const memoryService = new MemoryService();
