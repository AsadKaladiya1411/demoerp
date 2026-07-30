import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';

export function RmRequirement() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">RM Requirement</h2>
        <div className="text-sm text-muted-foreground">Raw material requirement flow for Employee B</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageOpen className="h-5 w-5 text-primary" />
            Raw Material
          </CardTitle>
          <CardDescription>Total RM requirement will be reviewed here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-4">
            <div className="font-medium">RM Requirement</div>
            <div className="text-sm text-muted-foreground">Requirement details will come from Employee A reports.</div>
          </div>
          <Button asChild variant="outline">
            <Link to="/reports">Open Reports</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default RmRequirement;
