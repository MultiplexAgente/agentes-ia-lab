import { createFileRoute } from "@tanstack/react-router";

import { getOptionalCompanySession } from "@/lib/multiplex/company-auth.server";
import {
  ALIAS_LABELS,
  MODEL_ALIASES,
  isResolutionError,
  resolveAlias,
} from "@/lib/multiplex/model-registry.server";
import { loadUserAlias } from "@/lib/multiplex/preferences.server";
import { loadSettings } from "@/lib/multiplex/settings.server";
import { getServiceClient, resolvePublicCompany } from "@/lib/multiplex/supabase.server";

/**
 * Opções visíveis ao usuário: apenas GPT, CLAUDE e DEEPSEEK.
 * Nenhum model ID técnico é exposto nesta resposta.
 */
export const Route = createFileRoute("/api/ai/models")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });

        const session = await getOptionalCompanySession(supabase, request);
        const company = session
          ? { id: session.companyId, name: session.companyName }
          : await resolvePublicCompany(supabase);

        const options = await Promise.all(
          MODEL_ALIASES.map(async (alias) => {
            const resolved = await resolveAlias(alias);
            return {
              alias,
              label: ALIAS_LABELS[alias],
              available: !isResolutionError(resolved),
              unavailableReason: isResolutionError(resolved) ? resolved.error : null,
            };
          }),
        );

        const settings = company ? (await loadSettings(supabase, company.id)).settings : null;
        const userAlias = company ? await loadUserAlias(supabase, company.id, session?.userId) : null;

        return Response.json({
          options,
          selected: userAlias ?? settings?.defaultModelAlias ?? "gpt",
          companyDefault: settings?.defaultModelAlias ?? "gpt",
        });
      },
    },
  },
});
