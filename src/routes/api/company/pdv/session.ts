import { createFileRoute } from "@tanstack/react-router";
import { requireCompanySession } from "@/lib/multiplex/company-auth.server";
import { getServiceClient } from "@/lib/multiplex/supabase.server";
import { CashRegisterService, type CashMovementType } from "@/lib/commerce/pdv/cash-register";

export const Route = createFileRoute("/api/company/pdv/session")({
  server: {
    handlers: {
      // Retorna a sessão de caixa ativa para o terminal especificado
      GET: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) {
          return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });
        }

        const session = await requireCompanySession(supabase, request);
        if ("error" in session) {
          return Response.json({ error: session.error }, { status: session.status });
        }

        const url = new URL(request.url);
        const terminalCode = url.searchParams.get("terminal") || "CAIXA-01";

        const cashSession = await CashRegisterService.getActiveSession(
          supabase,
          session.companyId,
          terminalCode
        );

        return Response.json({ session: cashSession });
      },

      // Executa ações na sessão de caixa: 'open', 'movement', 'close'
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
          action?: "open" | "movement" | "close";
          terminalCode?: string;
          initialCashAmount?: number;
          movementType?: CashMovementType;
          amount?: number;
          reason?: string;
          countedCash?: number;
          notes?: string;
        } | null;

        if (!body || !body.action) {
          return Response.json({ error: "Ação não especificada." }, { status: 400 });
        }

        const terminalCode = body.terminalCode || "CAIXA-01";

        try {
          if (body.action === "open") {
            const initialAmount = Number(body.initialCashAmount ?? 0);
            const opened = await CashRegisterService.openSession(supabase, {
              companyId: session.companyId,
              terminalCode,
              operatorId: session.userId,
              operatorEmail: session.email,
              initialCashAmount: initialAmount,
            });
            return Response.json({ success: true, session: opened });
          }

          if (body.action === "movement") {
            if (!body.movementType || !body.amount || !body.reason) {
              return Response.json(
                { error: "Informe o tipo (SANGRIA/SUPRIMENTO), o valor e a justificativa." },
                { status: 400 }
              );
            }
            const movement = await CashRegisterService.registerMovement(supabase, {
              companyId: session.companyId,
              terminalCode,
              type: body.movementType,
              amount: Number(body.amount),
              reason: body.reason,
              operatorEmail: session.email,
            });
            return Response.json({ success: true, movement });
          }

          if (body.action === "close") {
            const countedCash = Number(body.countedCash ?? 0);
            const closed = await CashRegisterService.closeSession(supabase, {
              companyId: session.companyId,
              terminalCode,
              countedCash,
              notes: body.notes,
            });
            return Response.json({ success: true, session: closed });
          }

          return Response.json({ error: "Ação desconhecida." }, { status: 400 });
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Erro na operação de caixa.";
          return Response.json({ error: msg }, { status: 400 });
        }
      },
    },
  },
});
