import { createFileRoute } from "@tanstack/react-router";
import { requireCompanySession } from "@/lib/multiplex/company-auth.server";
import { getServiceClient } from "@/lib/multiplex/supabase.server";
import { executePdvCheckout, type CheckoutRequest } from "@/lib/commerce/pdv/transaction.server";

export const Route = createFileRoute("/api/company/pdv/checkout")({
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

        try {
          const body = (await request.json().catch(() => null)) as CheckoutRequest | null;
          if (!body) {
            return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
          }

          const result = await executePdvCheckout(supabase, session, body);
          return Response.json({ success: true, transaction: result });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Erro interno ao processar venda.";
          return Response.json({ error: msg }, { status: 400 });
        }
      },
    },
  },
});
