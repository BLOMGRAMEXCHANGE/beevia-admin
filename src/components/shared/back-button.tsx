"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function BackButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Go back"
      onClick={() => router.back()}
    >
      <ChevronLeft />
    </Button>
  );
}
