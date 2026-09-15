import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isUuid } from "./supabase.server";
import type { RoutingDecision } from "./router.server";

export interface AuditRecord {
  companyId: string;
  agentId?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
  channel: string;
  userMessage: string;
  assistantMessage: string;
  routing: RoutingDecision;
  modelUsed: string;
  responseId?: string | null;
  responseModel?: string | null;
  finishReason?: string | null;
  fallbackUsed: boolean;
  promptTokens: number;
  cachedInputTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number | null;
  costStatus: string;
  latencyMs: number;
  toolsUsed: string[];
  contextSources: string[];
  requestMetadata: Record<string, unknown>;
  error?: string | null;
}

export async function saveAudit(
  supabase: SupabaseClient,
  record: AuditRecord,
): Promise<{ persisted: boolean; error?: string }> {
  const conversationId = isUuid(record.conversationId) ? record.conversationId : null;
  const messageId = isUuid(record.messageId) ? record.messageId : null;
  const agentId = isUuid(record.agentId) ? record.agentId : null;
  const responseHash = record.assistantMessage
    ? createHash("sha256").update(record.assistantMessage).digest("hex")
    : null;

  const { error } = await supabase.from("ai_routing_audit").insert({
    company_id: record.companyId,
    agent_id: agentId,
    conversation_id: conversationId,
    message_id: messageId,
    channel: record.channel,
    task_category: record.routing.category,
    complexity: record.routing.complexity,
    strategy: record.routing.strategy,
    model_selected: record.routing.model,
    model_used: record.modelUsed,
    response_id: record.responseId ?? null,
    response_model: record.responseModel ?? null,
    finish_reason: record.finishReason ?? null,
    fallback_used: record.fallbackUsed,
    routing_signals: record.routing.signals,
    user_message: record.userMessage,
    assistant_message: record.assistantMessage,
    tokens_prompt: record.promptTokens,
    cached_input_tokens: record.cachedInputTokens,
    tokens_completion: record.completionTokens,
    total_tokens: record.totalTokens,
    cost_usd: record.costUsd,
    cost_status: record.costStatus,
    latency_ms: record.latencyMs,
    tools_used: record.toolsUsed,
    context_sources: record.contextSources,
    request_metadata: record.requestMetadata,
    response_hash: responseHash,
    error: record.error ?? null,
  });
  if (error) return { persisted: false, error: error.message };

  const { error: usageError } = await supabase.from("ai_usage").insert({
    company_id: record.companyId,
    agent_id: agentId,
    conversation_id: conversationId,
    message_id: messageId,
    model: record.responseModel ?? record.modelUsed,
    input_tokens: record.promptTokens,
    cached_input_tokens: record.cachedInputTokens,
    output_tokens: record.completionTokens,
    total_tokens: record.totalTokens,
    estimated_cost: record.costUsd,
  });
  return usageError ? { persisted: false, error: usageError.message } : { persisted: true };
}