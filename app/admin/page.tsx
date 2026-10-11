import { AdminApp } from "@/components/admin/admin-app";
import { requireAdminPage } from "@/lib/server/admin-auth";
import { listAdmins } from "@/lib/server/admin-store";
import { readMenuForAdmin } from "@/lib/server/menu-store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdminPage();
  let stored;
  try {
    stored = await readMenuForAdmin();
  } catch {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1 className="auth-title">No se pudo abrir la carta</h1>
          <p className="text-error">No pudimos leer la carta guardada. Revisá que la migración de Supabase esté aplicada y volvé a intentar.</p>
          <a className="btn btn-secondary" href="/admin">Reintentar</a>
        </section>
      </main>
    );
  }
  const admins = admin.role === "owner" ? await listAdmins().catch(() => [admin]) : [];
  return (
    <AdminApp
      email={admin.email}
      userId={admin.userId}
      role={admin.role}
      initialMenu={stored.menu}
      initialUpdatedAt={stored.updatedAt}
      initialAdmins={admins}
    />
  );
}
