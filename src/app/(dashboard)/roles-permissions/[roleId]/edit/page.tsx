import { BackButton } from "@/components/shared/back-button";
import { RoleGate } from "@/components/shared/role-gate";
import { RoleForm } from "@/features/roles/components/role-form";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ roleId: string }>;
}) {
  const { roleId } = await params;

  return (
    <RoleGate
      allow={["super_admin"]}
      fallback={
        <p className="text-sm text-muted-foreground">
          You don&apos;t have access to this section.
        </p>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Edit Role
          </h1>
        </div>
        <RoleForm mode="edit" roleId={roleId} />
      </div>
    </RoleGate>
  );
}
