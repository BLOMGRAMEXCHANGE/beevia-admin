"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionMatrix } from "@/features/roles/components/permission-matrix";
import { AdminMultiSelect } from "@/features/roles/components/admin-multi-select";
import {
  RoleApiError,
  useCreateRole,
  useRole,
  useUpdateRole,
} from "@/features/roles/api";
import {
  emptyPermissionMatrix,
  matrixToPermissionRequest,
  permissionResponseToMatrix,
  type PermissionMatrixState,
} from "@/features/roles/types";

interface RoleFormProps {
  mode: "create" | "edit";
  roleId?: string;
}

export function RoleForm({ mode, roleId }: RoleFormProps) {
  const router = useRouter();
  const roleQuery = useRole(mode === "edit" ? (roleId ?? "") : "");
  const createRole = useCreateRole();
  const updateRole = useUpdateRole(roleId ?? "");
  const mutation = mode === "create" ? createRole : updateRole;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [adminIds, setAdminIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<PermissionMatrixState>(
    emptyPermissionMatrix()
  );
  const [nameError, setNameError] = useState<string | null>(null);

  const [loadedRoleId, setLoadedRoleId] = useState<string | undefined>();
  if (mode === "edit" && roleQuery.data && roleQuery.data.id !== loadedRoleId) {
    setLoadedRoleId(roleQuery.data.id);
    setName(roleQuery.data.name);
    setDescription(roleQuery.data.description);
    setAdminIds(roleQuery.data.assignedAdminIds);
    setPermissions(permissionResponseToMatrix(roleQuery.data.permissions));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNameError(null);

    if (!name.trim()) {
      setNameError("Name is required.");
      return;
    }

    mutation.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        permissions: matrixToPermissionRequest(permissions),
        adminIds,
      },
      {
        onSuccess: () => {
          toast.success(mode === "create" ? "Role created." : "Role updated.");
          router.push("/roles-permissions");
        },
        onError: (mutationError) => {
          if (mutationError instanceof RoleApiError) {
            if (mode === "create" && mutationError.status === 409) {
              setNameError(mutationError.message);
              return;
            }
            if (mutationError.status === 403) {
              toast.error(
                mutationError.message ||
                  "You do not have permission to perform this action."
              );
              return;
            }
            toast.error(mutationError.message);
            return;
          }
          toast.error("Something went wrong. Please try again.");
        },
      }
    );
  }

  if (mode === "edit" && roleQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (mode === "edit" && roleQuery.isError) {
    const apiError =
      roleQuery.error instanceof RoleApiError ? roleQuery.error : undefined;
    if (apiError?.status === 403) {
      return (
        <p className="text-sm text-muted-foreground">
          {apiError.message ||
            "You do not have permission to perform this action."}
        </p>
      );
    }
    return (
      <p className="text-sm text-muted-foreground">
        This role doesn&apos;t exist or was deleted.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Role details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role-name">Name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setNameError(null);
              }}
              aria-invalid={Boolean(nameError)}
              required
            />
            {nameError && (
              <p className="text-sm text-destructive">{nameError}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionMatrix value={permissions} onChange={setPermissions} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">
            Assigned admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AdminMultiSelect value={adminIds} onChange={setAdminIds} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/roles-permissions")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? "Saving…"
            : mode === "create"
              ? "Create role"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
