import { createFileRoute } from "@tanstack/react-router";

import { getServiceClient, resolvePublicCompany } from "@/lib/multiplex/supabase.server";

export const Route = createFileRoute("/api/products")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabase = getServiceClient();
        if (!supabase) {
          return Response.json({ error: "Banco de dados não configurado." }, { status: 503 });
        }

        const company = await resolvePublicCompany(supabase);
        if (!company) {
          return Response.json({ products: [], categories: [] });
        }

        const [{ data: products, error }, { data: categories }] = await Promise.all([
          supabase
            .from("products")
            .select("id, name, description, price, available, image_url, ingredients, preparation_time_minutes, category_id, product_categories(name)")
            .eq("company_id", company.id)
            .order("name", { ascending: true }),
          supabase
            .from("product_categories")
            .select("id, name, slug, sort_order, active")
            .eq("company_id", company.id)
            .order("sort_order", { ascending: true }),
        ]);

        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
          company,
          products: products ?? [],
          categories: categories ?? [],
        });
      },
    },
  },
});
