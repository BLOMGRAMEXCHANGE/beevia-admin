"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { History, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useRecentSearches } from "@/features/users/api";

function initials(fullName: string | null | undefined): string {
  if (!fullName) return "?";
  return fullName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onCommit: (term: string) => void;
}

export function SearchField({ value, onChange, onCommit }: SearchFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: recent } = useRecentSearches();

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function selectTerm(term: string) {
    onChange(term);
    onCommit(term);
    setIsOpen(false);
  }

  function selectUser(userId: string) {
    setIsOpen(false);
    router.push(`/users/${userId}`);
  }

  const hasRecentTerms = (recent?.terms.length ?? 0) > 0;
  const hasRecentUsers = (recent?.users.length ?? 0) > 0;
  const showDropdown =
    isOpen && value.trim() === "" && (hasRecentTerms || hasRecentUsers);

  return (
    <div ref={containerRef} className="relative min-w-56 flex-1">
      <InputGroup>
        <InputGroupAddon>
          <Search className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search by name, username, email, phone, or ID"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onCommit(value);
              setIsOpen(false);
            }
          }}
        />
      </InputGroup>

      {showDropdown && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10">
          {hasRecentTerms && (
            <div className="flex flex-col">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Recent searches
              </p>
              {recent!.terms.map((term) => (
                <button
                  key={term}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectTerm(term)}
                  className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <History className="size-3.5 text-muted-foreground" />
                  {term}
                </button>
              ))}
            </div>
          )}

          {hasRecentUsers && (
            <div className="mt-1 flex flex-col border-t pt-1">
              <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Recently viewed
              </p>
              {recent!.users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectUser(user.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <Avatar className="size-5">
                    <AvatarFallback className="text-[10px]">
                      {initials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {user.fullName || "Unnamed user"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {user.username}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
