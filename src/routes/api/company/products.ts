import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { requireCompanySession } from "@/lib/multiplex/company-auth.server";
import { getServiceClient, isUuid } from "@/lib/multiplex/supabase.server";

const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  price: z.coerce.number().min(0).max(1000000),
  categoryId: z.string().uuid().nullable().optional(),
  available: z.boolean().optional(),
  ingredients: z.array(z.string().max(120)).max(40).optional(),
  preparationTimeMinutes: z.coerce.number().int().min(0).max(600).optional(),
});

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export const Route = createFileRoute("/api/company/products")({
  server: {
    handlers: {
      // Cria ou atualiza um produto da própria empresa.
      POST: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) {
          return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });
        }

        const session = await requireCompanySession(supabase, request);
        if ("error" in session) {
          return Response.json({ error: session.error }, { status: session.status });
        }

        const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;

        // Criação de categoria
        if (raw?.["categoryName"]) {
          const name = String(raw["categoryName"]).slice(0, 255).trim();
          if (!name) return Response.json({ error: "Informe o nome da categoria." }, { status: 400 });
          const { data, error } = await supabase
            .from("product_categories")
            .insert({ company_id: session.companyId, name, slug: slugify(name) })
            .select("id, name, slug, active, sort_order")
            .maybeSingle();
          if (error) return Response.json({ error: error.message }, { status: 500 });
          return Response.json({ category: data });
        }

        const parsed = ProductSchema.safeParse(raw);
        if (!parsed.success) {
          return Response.json({ error: "Preencha nome e preço do produto." }, { status: 400 });
        }
        const input = parsed.data;

        if (input.categoryId) {
          const { data: category } = await supabase
            .from("product_categories")
            .select("id")
            .eq("id", input.categoryId)
            .eq("company_id", session.companyId)
            .maybeSingle();
          if (!category) {
            return Response.json({ error: "Categoria não pertence à sua empresa." }, { status: 400 });
          }
        }

        const values = {
          company_id: session.companyId,
          category_id: input.categoryId ?? null,
          name: input.name,
          description: input.description ?? null,
          price: input.price,
          available: input.available ?? true,
          ingredients: input.ingredients ?? [],
          preparation_time_minutes: input.preparationTimeMinutes ?? 20,
          updated_at: new Date().toISOString(),
        };

        if (input.id) {
          const { data, error } = await supabase
            .from("products")
            .update(values)
            .eq("id", input.id)
            .eq("company_id", session.companyId)
            .select("id, category_id, name, description, price, available, ingredients, preparation_time_minutes")
            .maybeSingle();
          if (error) return Response.json({ error: error.message }, { status: 500 });
          if (!data) return Response.json({ error: "Produto não encontrado." }, { status: 404 });
          return Response.json({ product: data });
        }

        const { data, error } = await supabase
          .from("products")
          .insert(values)
          .select("id, category_id, name, description, price, available, ingredients, preparation_time_minutes")
          .maybeSingle();
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ product: data });
      },

      DELETE: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) {
          return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });
        }

        const session = await requireCompanySession(supabase, request);
        if ("error" in session) {
          return Response.json({ error: session.error }, { status: session.status });
        }

        const id = new URL(request.url).searchParams.get("id");
        if (!isUuid(id)) return Response.json({ error: "Produto inválido." }, { status: 400 });

        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", id)
          .eq("company_id", session.companyId);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        return Response.json({ ok: true });
      },
    },
  },
});
