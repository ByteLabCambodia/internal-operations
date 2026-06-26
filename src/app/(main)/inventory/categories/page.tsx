import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import {
  CategoriesManager,
  type Category,
} from "@/features/inventory/components/categories-manager";

export default async function CategoriesPage() {
  await requirePermission("inventory.manage");
  const supabase = await createClient();

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("categories").select("id, name, description").order("name"),
    supabase.from("inventory_items").select("category"),
  ]);

  // Items store their category as free text; count by name match.
  const counts = new Map<string, number>();
  for (const it of items ?? []) {
    if (it.category) counts.set(it.category, (counts.get(it.category) ?? 0) + 1);
  }

  const rows: Category[] = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    itemCount: counts.get(c.name) ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Group inventory items. New items pick a category from this list.
        </p>
      </div>
      <CategoriesManager categories={rows} />
    </div>
  );
}
