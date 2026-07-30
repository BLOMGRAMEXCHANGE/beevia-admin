import { RoleGate } from "@/components/shared/role-gate";
import { AdminAccountsTable } from "@/features/admin-accounts/components/admin-accounts-table";

export default function AdminAccountsPage() {
  return (
    <RoleGate
      allow={["super_admin"]}
      fallback={
        <p className="text-sm text-muted-foreground">
          You don&apos;t have access to this section.
        </p>
      }
    >
      <AdminAccountsTable />
    </RoleGate>
  );
}
