import { RoleGate } from "@/components/shared/role-gate";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

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
      <PlaceholderPage
        title="Roles & Permissions"
        description="Roles & permission management"
      />
    </RoleGate>
  );
}
