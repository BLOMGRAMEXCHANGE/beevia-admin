import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Shared report header stat card — matches the Dashboard Home summary-card
 * treatment (muted text-sm title, font-heading 3xl metric). `value` is passed
 * pre-formatted so each report can decide (plain count, ₦ currency, etc.).
 */
export function ReportStatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl font-bold tracking-tight">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
