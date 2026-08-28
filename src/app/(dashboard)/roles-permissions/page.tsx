import { RoleGate } from "@/components/shared/role-gate";
import { RolesTable } from "@/features/roles/components/roles-table";

export default function RolesPermissionsPage() {
  return (
    <RoleGate
      allow={["super_admin"]}
      fallback={
        <p className="text-sm text-muted-foreground">
          You don&apos;t have access to this section.
        </p>
      }
    >
      <RolesTable />
    </RoleGate>
  );
}
