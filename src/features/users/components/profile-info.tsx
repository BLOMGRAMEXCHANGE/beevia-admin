import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { countryName } from "@/features/users/countries";
import type { UserRecord } from "@/types/user";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className={value ? undefined : "italic text-muted-foreground"}>
        {value ?? "Not provided"}
      </p>
    </div>
  );
}

export function ProfileInfo({ user }: { user: UserRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">
          Profile information
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <Field label="Full name" value={user.fullName} />
        <Field label="Username" value={user.username} />
        <Field label="Phone number" value={user.phone} />
        <Field label="Email address" value={user.email} />
        <Field label="Country" value={countryName(user.country)} />
      </CardContent>
    </Card>
  );
}
