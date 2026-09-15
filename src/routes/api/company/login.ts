import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { requireCompanySession, signInCompanyUser } from "@/lib/multiplex/company-auth.server";
import { getServiceClient } from "@/lib/multiplex/supabase.server";

const BodySchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(200),
  /** Primeiro acesso: define a senha de um e-mail já autorizado pela empresa. */
  create: z.boolean().optional(),
});

export const Route = createFileRoute("/api/company/login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = BodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return Response.json(
            { error: "Informe um e-mail válido e uma senha com pelo menos 8 caracteres." },
            { status: 400 },
          );
        }
        const { email, password, create } = parsed.data;

        const supabase = getServiceClient();
        if (!supabase) {
          return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });
        }

        if (create) {
          // Só e-mails previamente autorizados (company_users) podem criar acesso.
          const { data: allowed } = await supabase
            .from("company_users")
            .select("company_id, user_id")
            .eq("email", email)
            .eq("active", true)
            .maybeSingle();

          const row = allowed as { company_id: string; user_id: string | null } | null;
          if (!row) {
            return Response.json(
              { error: "Este e-mail não está autorizado em nenhuma empresa." },
              { status: 403 },
            );
          }
          if (row.user_id) {
            return Response.json(
              { error: "Este acesso já existe. Entre com a sua senha." },
              { status: 409 },
            );
          }

          const { data: created, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          });
          if (createError || !created.user) {
            return Response.json(
              { error: createError?.message ?? "Não foi possível criar o acesso." },
              { status: 400 },
            );
          }

          await supabase.from("company_users").update({ user_id: created.user.id }).eq("email", email);
        }

        const result = await signInCompanyUser(email, password);
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
