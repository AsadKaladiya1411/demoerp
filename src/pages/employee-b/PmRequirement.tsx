import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Boxes, ClipboardList } from 'lucide-react';

export function PmRequirement() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">PM Requirement</h2>
        <div className="text-sm text-muted-foreground">Packaging material requirement flow for Employee B</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Packaging Material
          </CardTitle>
          <CardDescription>PM requirements grouped by business use.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-md border p-4">
            <div className="font-medium">Sachets</div>
            <div className="text-sm text-muted-foreground">Empty sachets / roll requirement.</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="font-medium">Boxes</div>
            <div className="text-sm text-muted-foreground">Flavoured and assorted box requirement.</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="font-medium">Additional Materials</div>
            <div className="text-sm text-muted-foreground">Labels, cartons and other materials.</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Boxes className="h-5 w-5 text-primary" />
            <div className="text-sm font-medium">Requirement details will come from Employee A reports.</div>
          </div>
          <Button asChild variant="outline">
            <Link to="/reports">Open Reports</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default PmRequirement;
