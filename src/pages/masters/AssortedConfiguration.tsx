import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useErpData } from '@/context/ErpContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AssortedConfiguration() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, flavours, productionCalculations } = useErpData();

  const product = products.find(item => item.id === productId);
  const productFlavours = useMemo(
    () => flavours.filter(item => item.productId === product?.id),
    [flavours, product?.id]
  );
  const [selectedFlavourIds, setSelectedFlavourIds] = useState<string[]>([]);
  const [servingPerBox, setServingPerBox] = useState('');

  const rows = productFlavours.map(flavour => {
    const calculation = productionCalculations.find(item => item.productId === product?.id && item.flavourId === flavour.id);
    return {
      flavour,
      assortedSachets: calculation?.assortedSachets || 0,
      hasCalculation: Boolean(calculation),
    };
  });

  const selectedSachets = rows
    .filter(row => selectedFlavourIds.includes(row.flavour.id))
    .reduce((sum, row) => sum + row.assortedSachets, 0);
  const servingPerBoxValue = Number(servingPerBox) || 0;
  const canCalculate = selectedFlavourIds.length >= 2;
  const totalAssortedBoxes = canCalculate && servingPerBoxValue > 0 ? Math.floor(selectedSachets / servingPerBoxValue) : 0;

  const toggleFlavour = (flavourId: string) => {
    setSelectedFlavourIds(prev =>
      prev.includes(flavourId)
        ? prev.filter(id => id !== flavourId)
        : [...prev, flavourId]
    );
  };

  if (!product) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Product not found</h2>
        <div className="mt-4">
          <Button asChild><Link to="/masters/products">Back to Products</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Assorted Configuration</h2>
          <div className="text-sm text-muted-foreground">{product.name}</div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/masters/products/${product.id}`)}>Back to Product</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flavour Selection</CardTitle>
          <CardDescription>Select product flavours to include in assorted box calculation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Select</TableHead>
                <TableHead>Flavour</TableHead>
                <TableHead>Assorted Sachets</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(row => (
                <TableRow key={row.flavour.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedFlavourIds.includes(row.flavour.id)}
                      disabled={!row.hasCalculation}
                      onChange={() => toggleFlavour(row.flavour.id)}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell>{row.flavour.name}</TableCell>
                  <TableCell>{row.assortedSachets}</TableCell>
                  <TableCell>{row.hasCalculation ? 'Ready' : 'Production calculation pending'}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">No flavours found for this product.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Serving Per Box</Label>
              <Input type="number" value={servingPerBox} onChange={event => setServingPerBox(event.target.value)} />
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Total Selected Sachets</div>
              <div className="text-2xl font-semibold">{selectedSachets}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Total Assorted Boxes</div>
              <div className="text-2xl font-semibold">{totalAssortedBoxes}</div>
            </div>
          </div>
          {selectedFlavourIds.length === 1 && (
            <div className="text-sm font-medium text-destructive">
              Select at least 2 flavours for assorted box calculation.
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default AssortedConfiguration;
