import { redirect } from "next/navigation";

/** /admin lands on the Users tab. */
export default function AdminIndexPage() {
  redirect("/admin/users");
}
