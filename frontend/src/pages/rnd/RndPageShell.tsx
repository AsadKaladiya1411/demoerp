import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FlaskConical } from 'lucide-react';

type RndPageShellProps = {
  title: string;
  description: string;
};

export function RndPageShell({ title, description }: RndPageShellProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary" className="w-fit">Research & Development</Badge>
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <Card>
        <CardContent className="flex items-start gap-4 p-6">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">Module foundation ready</h3>
            <p className="text-sm text-muted-foreground">
              This page is reserved for future R&D workflows. No transaction logic, forms, or tables are enabled yet.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}