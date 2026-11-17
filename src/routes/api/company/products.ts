import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { COMMERCE_SEGMENTS, type CommerceSegment } from "@/lib/commerce/segments";
import { validateSegmentAttributes, normalizeProductWithLegacy } from "@/lib/commerce/attributes";
import { requireCompanySession } from "@/lib/multiplex/company-auth.server";
import { getServiceClient, isUuid } from "@/lib/multiplex/supabase.server";

const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  price: z.coerce.number().min(0).max(1000000),
  categoryId: z.string().uuid().nullable().optional(),
  available: z.boolean().optional(),
  segment: z.enum(COMMERCE_SEGMENTS).optional().default("food_service"),
  barcodeEan: z.string().max(64).nullable().optional(),
  sku: z.string().max(64).nullable().optional(),
  unitOfMeasure: z.string().max(20).optional().default("UN"),
  currentStock: z.coerce.number().optional().nullable(),
  minStock: z.coerce.number().optional().nullable(),
  ingredients: z.array(z.string().max(120)).max(40).optional(),
  preparationTimeMinutes: z.coerce.number().int().min(0).max(600).optional(),
  segmentAttributes: z.record(z.unknown()).optional().nullable(),
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
        const segment = (input.segment ?? "food_service") as CommerceSegment;

        // Validação estrita de atributos de domínio pelo Zod
        let validatedAttributes: Record<string, unknown> = {};
        if (input.segmentAttributes) {
          const attrValidation = validateSegmentAttributes(segment, input.segmentAttributes);
          if (!attrValidation.valid) {
            return Response.json(
              { error: `Atributos inválidos para o segmento ${segment}: ${attrValidation.errors.join(", ")}` },
              { status: 400 }
            );
          }
          validatedAttributes = attrValidation.data as Record<string, unknown>;
        }

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

        // Se for gastronomia, sincroniza ingredients e preparationTimeMinutes
        const ingredients = input.ingredients ?? (validatedAttributes["ingredients"] as string[] | undefined) ?? [];
        const prepTime = input.preparationTimeMinutes ?? (validatedAttributes["preparation_time_minutes"] as number | undefined) ?? 20;

        const baseValues = {
          company_id: session.companyId,
          category_id: input.categoryId ?? null,
          name: input.name,
          description: input.description ?? null,
          price: input.price,
          available: input.available ?? true,
          ingredients,
          preparation_time_minutes: prepTime,
          updated_at: new Date().toISOString(),
        };

        const extendedValues = {
          ...baseValues,
          segment,
          barcode_ean: input.barcodeEan ?? (validatedAttributes["barcode_ean"] as string | undefined) ?? null,
          sku: input.sku ?? null,
          unit_of_measure: input.unitOfMeasure ?? (validatedAttributes["unit_of_measure"] as string | undefined) ?? "UN",
          current_stock: input.currentStock ?? null,
          min_stock: input.minStock ?? null,
          segment_attributes: validatedAttributes,
        };

        if (input.id) {
          // Tenta update com colunas estendidas; se falhar por coluna inexistente, usa baseValues
          let updateRes = await supabase
            .from("products")
            .update(extendedValues)
            .eq("id", input.id)
            .eq("company_id", session.companyId)
            .select("*")
            .maybeSingle();

          if (updateRes.error && updateRes.error.message.includes("column")) {
            updateRes = await supabase
              .from("products")
              .update(baseValues)
              .eq("id", input.id)
              .eq("company_id", session.companyId)
              .select("*")
              .maybeSingle();
          }

          if (updateRes.error) return Response.json({ error: updateRes.error.message }, { status: 500 });
          if (!updateRes.data) return Response.json({ error: "Produto não encontrado." }, { status: 404 });
          return Response.json({ product: updateRes.data });
        }

        // Tenta insert com colunas estendidas; se falhar por coluna inexistente, usa baseValues
        let insertRes = await supabase
          .from("products")
          .insert(extendedValues)
          .select("*")
          .maybeSingle();

        if (insertRes.error && insertRes.error.message.includes("column")) {
          insertRes = await supabase
            .from("products")
            .insert(baseValues)
            .select("*")
            .maybeSingle();
        }

        if (insertRes.error) return Response.json({ error: insertRes.error.message }, { status: 500 });
        return Response.json({ product: insertRes.data });
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
