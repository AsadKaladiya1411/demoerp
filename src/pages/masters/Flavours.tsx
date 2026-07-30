import { useState } from 'react';
import { useErpData } from '@/context/ErpContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';

export function Flavours() {
  const { flavours, products } = useErpData();
  const [search, setSearch] = useState('');

  const filtered = flavours.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Flavours</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Flavour
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search flavours..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flavour Name</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell>{products.find(p => p.id === f.productId)?.name}</TableCell>
                  <TableCell>{f.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default Flavours;
