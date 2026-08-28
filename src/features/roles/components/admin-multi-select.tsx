"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAccounts } from "@/features/admin-accounts/api";

interface AdminMultiSelectProps {
  value: string[];
  onChange: (adminIds: string[]) => void;
}

const ADMIN_MULTI_SELECT_LIMIT = 100;

export function AdminMultiSelect({ value, onChange }: AdminMultiSelectProps) {
  const { data, isLoading } = useAdminAccounts(1, ADMIN_MULTI_SELECT_LIMIT);
  const admins = data?.accounts;

  if (isLoading) {
    return <Skeleton className="h-9 w-full max-w-sm" />;
  }

  const selected = (admins ?? []).filter((admin) => value.includes(admin.id));

  function toggle(adminId: string, checked: boolean) {
    onChange(
      checked ? [...value, adminId] : value.filter((id) => id !== adminId)
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full max-w-sm justify-start"
            />
          }
        >
          {selected.length > 0
            ? `${selected.length} admin${selected.length === 1 ? "" : "s"} selected`
            : "Select admins…"}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-72 w-(--anchor-width) overflow-y-auto">
          {(admins ?? []).length === 0 ? (
            <p className="px-1.5 py-1 text-sm text-muted-foreground">
              No admin accounts found.
            </p>
          ) : (
            (admins ?? []).map((admin) => (
              <DropdownMenuCheckboxItem
                key={admin.id}
                checked={value.includes(admin.id)}
                onCheckedChange={(checked) =>
                  toggle(admin.id, checked === true)
                }
              >
                <div className="flex flex-col">
                  <span>{admin.fullName}</span>
                  <span className="text-xs text-muted-foreground">
                    {admin.email}
                  </span>
                </div>
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((admin) => (
            <Badge key={admin.id} variant="secondary">
              {admin.fullName}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
