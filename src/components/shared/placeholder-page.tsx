interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({
  title,
  description = "This section is coming soon.",
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-bold tracking-tight">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
