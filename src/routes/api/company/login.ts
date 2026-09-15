import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { requireCompanySession, signInCompanyUser } from "@/lib/multiplex/company-auth.server";
import { getServiceClient } from "@/lib/multiplex/supabase.server";

const BodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(200),
});

export const Route = createFileRoute("/api/company/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = BodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json({ error: "Informe e-mail e senha válidos." }, { status: 400 });
        }

        const supabase = getServiceClient();
        if (!supabase) {
          return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });
        }

        const result = await signInCompanyUser(parsed.data.email, parsed.data.password);
        if ("error" in result) {
          return Response.json({ error: result.error }, { status: 401 });
        }

        const session = await requireCompanySession(
          supabase,
          new Request(request.url, { headers: { authorization: `Bearer ${result.accessToken}` } }),
        );
        if ("error" in session) {
          return Response.json({ error: session.error }, { status: session.status });
        }

        return Response.json({
          accessToken: result.accessToken,
          company: { id: session.companyId, name: session.companyName },
          user: { email: session.email, role: session.role },
        });
      },
    },
  },
});
