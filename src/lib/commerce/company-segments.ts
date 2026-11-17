/**
 * VENDRA (by BonaSoft) — Gestão de Múltiplos Segmentos da Empresa
 *
 * Uma mesma empresa/tenant pode operar em múltiplos segmentos simultaneamente
 * (ex: Supermercado com Padaria e Açougue, ou Farmácia com Loja de Conveniência).
 *
 * Gerencia validação de permissões (somente owner ou admin podem alterar),
 * cálculo de segmentos ativos e resolução de capacidades.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { COMMERCE_SEGMENTS, getSegmentConfig, type CommerceSegment, type SegmentConfig } from "./segments";

export interface CompanySegmentSettings {
  primarySegment: CommerceSegment;
  secondarySegments: CommerceSegment[];
  activeSegments: CommerceSegment[];
  capabilities: {
    hasTablesOrTabs: boolean;
    hasLotAndExpiration: boolean;
    hasPrescriptionControl: boolean;
    hasGridVariants: boolean;
    hasSerialOrImei: boolean;
    hasWeightedMeasurement: boolean;
    hasAppointmentBooking: boolean;
    hasTechnicalDeliveryFreight: boolean;
  };
}

export const DEFAULT_SEGMENT_SETTINGS: CompanySegmentSettings = {
  primarySegment: "food_service",
  secondarySegments: [],
  activeSegments: ["food_service"],
  capabilities: { ...getSegmentConfig("food_service").features },
};

/**
 * Sanitiza e valida a configuração de segmentos recebida da interface.
 */
export function sanitizeSegmentSettings(raw: unknown): CompanySegmentSettings {
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const primaryRaw = String(input["primarySegment"] ?? input["primary_segment"] ?? "food_service");
  const primarySegment: CommerceSegment = (COMMERCE_SEGMENTS as readonly string[]).includes(primaryRaw)
    ? (primaryRaw as CommerceSegment)
    : "food_service";

  const rawList = input["secondarySegments"] ?? input["secondary_segments"];
  const secondariesRaw: unknown[] = Array.isArray(rawList) ? rawList : [];

  const secondarySegments: CommerceSegment[] = [];
  for (const item of secondariesRaw) {
    const val = String(item);
    if ((COMMERCE_SEGMENTS as readonly string[]).includes(val) && val !== primarySegment && !secondarySegments.includes(val as CommerceSegment)) {
      secondarySegments.push(val as CommerceSegment);
    }
  }

  const activeSegments: CommerceSegment[] = [primarySegment, ...secondarySegments];

  // Agrega capacidades de todos os segmentos ativos
  const capabilities = {
    hasTablesOrTabs: activeSegments.some((s) => getSegmentConfig(s).features.hasTablesOrTabs),
    hasLotAndExpiration: activeSegments.some((s) => getSegmentConfig(s).features.hasLotAndExpiration),
    hasPrescriptionControl: activeSegments.some((s) => getSegmentConfig(s).features.hasPrescriptionControl),
    hasGridVariants: activeSegments.some((s) => getSegmentConfig(s).features.hasGridVariants),
    hasSerialOrImei: activeSegments.some((s) => getSegmentConfig(s).features.hasSerialOrImei),
    hasWeightedMeasurement: activeSegments.some((s) => getSegmentConfig(s).features.hasWeightedMeasurement),
    hasAppointmentBooking: activeSegments.some((s) => getSegmentConfig(s).features.hasAppointmentBooking),
    hasTechnicalDeliveryFreight: activeSegments.some((s) => getSegmentConfig(s).features.hasTechnicalDeliveryFreight),
  };

  return {
    primarySegment,
    secondarySegments,
    activeSegments,
    capabilities,
  };
}

/**
 * Carrega a configuração de segmentos da empresa do banco de dados,
 * com fallback inteligente para a tabela companies ou configurações de IA.
 */
export async function loadCompanySegmentSettings(
  supabase: SupabaseClient,
  companyId: string
): Promise<CompanySegmentSettings> {
  try {
    // 1. Tenta carregar da tabela companies
    const { data: company } = await supabase
      .from("companies")
      .select("id, segment, secondary_segments")
      .eq("id", companyId)
      .maybeSingle();

    if (company) {
      const row = company as { segment?: string | null; secondary_segments?: string[] | null };
      if (row.segment) {
        return sanitizeSegmentSettings({
          primarySegment: row.segment,
          secondarySegments: row.secondary_segments ?? [],
        });
      }
    }

    // 2. Tenta carregar do metadata em ai_routing_settings
    const { data: aiSettings } = await supabase
      .from("ai_routing_settings")
      .select("category_strategies")
      .eq("company_id", companyId)
      .maybeSingle();

    const storedMeta = (aiSettings?.category_strategies as any)?._segment_settings;
    if (storedMeta) {
      return sanitizeSegmentSettings(storedMeta);
    }
  } catch {
    // Fallback gracioso
  }

  return DEFAULT_SEGMENT_SETTINGS;
}

/**
 * Salva a configuração de segmentos da empresa.
 * Exige permissão 'owner' ou 'admin'.
 */
export async function saveCompanySegmentSettings(
  supabase: SupabaseClient,
  companyId: string,
  userRole: string,
  settings: CompanySegmentSettings
): Promise<{ ok: boolean; error?: string }> {
  const allowedRoles = ["owner", "admin"];
  if (!allowedRoles.includes(userRole.toLowerCase())) {
    return {
      ok: false,
      error: "Apenas proprietários e administradores possuem permissão para alterar os segmentos comerciais da empresa.",
    };
  }

  const sanitized = sanitizeSegmentSettings(settings);

  try {
    // 1. Tenta atualizar diretamente na tabela companies
    await supabase
      .from("companies")
      .update({
        segment: sanitized.primarySegment,
        secondary_segments: sanitized.secondarySegments,
      })
      .eq("id", companyId);
  } catch {
    // Ignorado se a coluna ainda não tiver sido criada
  }

  try {
    // 2. Persiste também em ai_routing_settings para garantia de disponibilidade
    const { data: existing } = await supabase
      .from("ai_routing_settings")
      .select("category_strategies")
      .eq("company_id", companyId)
      .maybeSingle();

    const currentStrategies = (existing?.category_strategies as Record<string, unknown>) ?? {};
    await supabase
      .from("ai_routing_settings")
      .upsert({
        company_id: companyId,
        category_strategies: {
          ...currentStrategies,
          _segment_settings: sanitized,
        },
      });
  } catch {
    // Fallback silencioso
  }

  return { ok: true };
}
