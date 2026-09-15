// =========================================================================
// ENTITY RESOLVER — Resolução de Entidades Multi-Canal
// Garante que Carlos Eduardo pelo WhatsApp e Carlos pelo Instagram
// sejam reconhecidos como o mesmo cliente (customer_id compartilhado).
// =========================================================================

import { store, supabase } from '../../config/database.js';
import { Customer } from '../../types/index.js';

export type ChannelIdentifierType =
  | 'phone'
  | 'whatsapp_id'
  | 'instagram_id'
  | 'facebook_id'
  | 'telegram_id'
  | 'email'
  | 'name_approx';

export interface EntityResolutionResult {
  customer: Customer | null;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  is_ambiguous: boolean;
  matched_by: ChannelIdentifierType | null;
  candidates?: Customer[]; // Quando ambíguo
}

export class EntityResolver {
  /**
   * Resolve um cliente a partir de um identificador de canal (principal método)
   * Prioridade: phone/external_id > email > nome aproximado
   */
  public static async resolveByChannelId(
    companyId: string,
    externalId: string,
    channelType: string
  ): Promise<EntityResolutionResult> {
    // 1. Tenta via customer_channels no Supabase (mais preciso)
    if (supabase) {
      try {
        const { data } = await supabase
          .from('customer_channels')
          .select('customer_id, profile_name')
          .eq('company_id', companyId)
          .eq('channel_type', channelType)
          .eq('external_id', externalId)
          .single();

        if (data?.customer_id) {
          const customer = await this.getCustomerById(companyId, data.customer_id);
          if (customer) {
            return {
              customer,
              confidence: 'HIGH',
              is_ambiguous: false,
              matched_by: this.channelToIdentifierType(channelType),
            };
          }
        }
      } catch {
        // Segue para fallback em memória
      }
    }

    // 2. Fallback: busca no store local por phone
    const customers = store.customers.get(companyId) || [];
    const byPhone = customers.find(c => c.phone === externalId || c.phone === `+${externalId}`);
    if (byPhone) {
      return {
        customer: byPhone,
        confidence: 'HIGH',
        is_ambiguous: false,
        matched_by: 'phone',
      };
    }

    return { customer: null, confidence: 'LOW', is_ambiguous: false, matched_by: null };
  }

  /**
   * Resolve cliente por nome (com suporte a ambiguidade)
   * NUNCA assume identidade se houver múltiplos matches
   */
  public static async resolveByName(
    companyId: string,
    name: string
  ): Promise<EntityResolutionResult> {
    const nameLower = name.toLowerCase().trim();
    const customers = store.customers.get(companyId) || [];

    // Match exato
    const exact = customers.filter(c =>
      c.name?.toLowerCase().trim() === nameLower
    );
    if (exact.length === 1) {
      return { customer: exact[0], confidence: 'HIGH', is_ambiguous: false, matched_by: 'name_approx' };
    }
    if (exact.length > 1) {
      return { customer: null, confidence: 'LOW', is_ambiguous: true, matched_by: 'name_approx', candidates: exact };
    }

    // Match parcial (primeiro nome)
    const firstNameQuery = nameLower.split(' ')[0];
    const partial = customers.filter(c =>
      c.name?.toLowerCase().startsWith(firstNameQuery)
    );
    if (partial.length === 1) {
      return { customer: partial[0], confidence: 'MEDIUM', is_ambiguous: false, matched_by: 'name_approx' };
    }
    if (partial.length > 1) {
      return { customer: null, confidence: 'LOW', is_ambiguous: true, matched_by: 'name_approx', candidates: partial };
    }

    return { customer: null, confidence: 'LOW', is_ambiguous: false, matched_by: null };
  }

  /**
   * Vincula um identificador de canal a um customer_id (para cruzamento multi-canal)
   */
  public static async linkChannelToCustomer(params: {
    companyId: string;
    customerId: string;
    channelType: string;
    externalId: string;
    profileName?: string;
  }): Promise<void> {
    const { companyId, customerId, channelType, externalId, profileName } = params;

    if (supabase) {
      try {
        await supabase.from('customer_channels').upsert({
          customer_id: customerId,
          company_id: companyId,
          channel_type: channelType,
          external_id: externalId,
          profile_name: profileName || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'company_id,channel_type,external_id' });
      } catch {
        // Silently ignore — não crítico
      }
    }
  }

  /**
   * Retorna todos os canais vinculados a um customer (para contexto multi-canal)
   */
  public static async getCustomerChannels(
    companyId: string,
    customerId: string
  ): Promise<Array<{ channel_type: string; external_id: string; profile_name?: string }>> {
    if (supabase) {
      try {
        const { data } = await supabase
          .from('customer_channels')
          .select('channel_type, external_id, profile_name')
          .eq('company_id', companyId)
          .eq('customer_id', customerId);
        return data || [];
      } catch {
        // Fallback
      }
    }
    return [];
  }

  // ---- Helpers ----

  private static async getCustomerById(
    companyId: string,
    customerId: string
  ): Promise<Customer | null> {
    // Supabase
    if (supabase) {
      try {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('company_id', companyId)
          .eq('id', customerId)
          .single();
        if (data) return data as Customer;
      } catch {
        // Fallback
      }
    }
    // Store local
    const customers = store.customers.get(companyId) || [];
    return customers.find(c => c.id === customerId) || null;
  }

  private static channelToIdentifierType(channelType: string): ChannelIdentifierType {
    const map: Record<string, ChannelIdentifierType> = {
      whatsapp: 'whatsapp_id',
      instagram: 'instagram_id',
      facebook: 'facebook_id',
      telegram: 'telegram_id',
    };
    return map[channelType.toLowerCase()] || 'phone';
  }
}
