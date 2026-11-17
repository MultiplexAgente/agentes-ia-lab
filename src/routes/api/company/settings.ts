import { createFileRoute } from "@tanstack/react-router";

import { saveCompanySegmentSettings, sanitizeSegmentSettings } from "@/lib/commerce/company-segments";
import { requireCompanySession } from "@/lib/multiplex/company-auth.server";
import { sanitizeSettings, saveSettings } from "@/lib/multiplex/settings.server";
import { getServiceClient } from "@/lib/multiplex/supabase.server";

export const Route = createFileRoute("/api/company/settings")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) {
          return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });
        }

        const session = await requireCompanySession(supabase, request);
        if ("error" in session) {
          return Response.json({ error: session.error }, { status: session.status });
        }

        const body = (await request.json().catch(() => null)) as {
          settings?: unknown;
          segmentSettings?: unknown;
        } | null;

        // Salva configurações de segmentos comerciais com validação de permissão
        let segmentResult = null;
        if (body?.segmentSettings) {
          const sanitizedSegments = sanitizeSegmentSettings(body.segmentSettings);
          const saveRes = await saveCompanySegmentSettings(
            supabase,
            session.companyId,
            session.role,
            sanitizedSegments
          );
          if (!saveRes.ok) {
            return Response.json({ error: saveRes.error }, { status: 403 });
          }
          segmentResult = sanitizedSegments;
        }

        let savedSettings = null;
        if (body?.settings) {
          const settings = sanitizeSettings(body.settings);
          const result = await saveSettings(supabase, session.companyId, settings);
          if (!result.ok) return Response.json({ error: result.error }, { status: 500 });
          savedSettings = settings;
        }

        return Response.json({
          settings: savedSettings,
          segmentSettings: segmentResult,
        });
      },
    },
  },
});
