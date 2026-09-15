import type { SupabaseClient } from "@supabase/supabase-js";

import { isUuid } from "./supabase.server";
import type { RoutingDecision } from "./router.server";

export interface AuditRecord {
  companyId: string;
  conversationId?: string | null;
  channel: string;
  userMessage: string;
  assistantMessage: string;
  routing: RoutingDecision;
  modelUsed: string;
  fallbackUsed: boolean;
  promptTokens: number;
  completionTokens: number;
  costUsd: number | null;
  costStatus: string;
  latencyMs: number;
  toolsUsed: string[];
  contextSources: string[];
  error?: string | null;
}

/**
 * Persiste a auditoria administrativa: modelo real escolhido, tokens, custo,
 * latência e fallback. Nunca é retornada para o usuário final.
 */
export async function saveAudit(
  supabase: SupabaseClient,
  record: AuditRecord,
): Promise<{ persisted: boolean; error?: string }> {
  const conversationId = isUuid(record.conversationId) ? record.conversationId : null;

  const { error } = await supabase.from("ai_routing_audit").insert({
    company_id: record.companyId,
    conversation_id: conversationId,
    channel: record.channel,
    task_category: record.routing.category,
    complexity: record.routing.complexity,
    strategy: record.routing.strategy,
    model_selected: record.routing.model,
    model_used: record.modelUsed,
    fallback_used: record.fallbackUsed,
    routing_signals: record.routing.signals,
    user_message: record.userMessage,
    assistant_message: record.assistantMessage,
    tokens_prompt: record.promptTokens,
    tokens_completion: record.completionTokens,
    cost_usd: record.costUsd,
    cost_status: record.costStatus,
    latency_ms: record.latencyMs,
    tools_used: record.toolsUsed,
    context_sources: record.contextSources,
    error: record.error ?? null,
  });

  if (error) return { persisted: false, error: error.message };

  await supabase.from("ai_logs").insert({
    company_id: record.companyId,
    conversation_id: conversationId,
    incoming_message: record.userMessage,
    ai_response: record.assistantMessage,
    tools_called: record.toolsUsed,
    knowledge_retrieved: record.contextSources,
    tokens_prompt: record.promptTokens,
    tokens_completion: record.completionTokens,
    estimated_cost_usd: record.costUsd ?? 0,
    latency_ms: record.latencyMs,
    error: record.error ?? null,
  });

  return { persisted: true };
}
