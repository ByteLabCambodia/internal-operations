import { requirePermission } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ItemForm } from "@/features/inventory/components/item-form";

export default async function NewInventoryItemPage() {
  await requirePermission("inventory.manage");
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("name").order("name");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Inventory Item</h1>
        <p className="text-sm text-muted-foreground">Add an item to the catalog.</p>
      </div>
      <ItemForm categories={(categories ?? []).map((c) => c.name)} />
    </div>
  );
}
