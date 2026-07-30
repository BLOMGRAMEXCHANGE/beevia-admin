"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentAdmin } from "@/hooks/use-current-admin";
import { ROLE_LABEL } from "@/lib/roles";
import { clearSession } from "@/lib/token-store";

function clearCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`;
}

export function AccountMenu() {
  const router = useRouter();
  const { data: admin } = useCurrentAdmin();

  function handleLogout() {
    clearSession();
    clearCookie("admin_session");
    clearCookie("admin_role");
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-1.5 py-1 outline-none hover:bg-muted focus-visible:bg-muted">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {admin?.name?.slice(0, 2).toUpperCase() ?? "?"}
          </AvatarFallback>
        </Avatar>
        <div className="hidden flex-col items-start text-left sm:flex">
          <span className="text-sm font-medium">{admin?.name ?? "…"}</span>
          <span className="text-xs text-muted-foreground">
            {admin ? ROLE_LABEL[admin.role] : ""}
          </span>
        </div>
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem disabled>
          <User />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
