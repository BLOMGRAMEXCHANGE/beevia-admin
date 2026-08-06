import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_STEPS_ORDER,
  ONBOARDING_STEP_LABEL,
} from "@/features/users/onboarding";
import type { AppUser } from "@/types/user";

export function OnboardingProgress({ user }: { user: AppUser }) {
  if (user.onboardingStatus === "complete") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">
            Onboarding progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            Onboarding complete
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentIndex = ONBOARDING_STEPS_ORDER.indexOf(user.onboardingStep!);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">
          Onboarding progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2 text-sm">
          {ONBOARDING_STEPS_ORDER.map((step, index) => {
            const isCurrent = index === currentIndex;
            const isDone = index < currentIndex;
            return (
              <li
                key={step}
                className={cn(
                  "flex items-center gap-2",
                  isCurrent && "font-medium text-foreground",
                  !isCurrent && !isDone && "text-muted-foreground"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : isCurrent ? (
                  <CircleDot className="size-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Circle className="size-4" />
                )}
                {ONBOARDING_STEP_LABEL[step]}
                {isCurrent && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    (stuck here)
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
