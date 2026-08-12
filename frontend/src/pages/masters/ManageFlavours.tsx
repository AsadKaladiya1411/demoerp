import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useErpData } from '@/context/ErpContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export function ManageFlavours() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, categories, flavours, addFlavour, updateFlavour, removeFlavour } = useErpData();

  const product = products.find(p => p.id === id);
  const productCategory = product ? categories.find(c => c.id === product.categoryId)?.name || '' : '';
  const productFlavours = useMemo(() => flavours.filter(f => f.productId === product?.id), [flavours, product?.id]);

  // Flavour form
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active'|'Inactive'>('Active');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleSave = () => {
    if (!name.trim()) { setError('Flavour name required'); return; }
    if (productFlavours.some(f => f.name.toLowerCase() === name.toLowerCase() && f.id !== editingId)) { setError('Flavour already exists'); return; }
    if (editingId) {
      updateFlavour({ id: editingId, name, productId: product.id, status });
    } else {
      addFlavour({ id: Math.random().toString(), name, productId: product.id, status });
    }
    setName(''); setDescription(''); setStatus('Active'); setError(''); setEditingId(null); setOpen(false);
  };

  const startEdit = (f: any) => {
    setEditingId(f.id);
    setName(f.name || '');
    setDescription(f.description || '');
    setStatus(f.status || 'Active');
    setError('');
    setOpen(true);
  };

  const handleDelete = (idToDelete: string) => {
    removeFlavour(idToDelete);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Manage Flavours</h2>
          <div className="text-sm text-muted-foreground">Product: <span className="font-medium">{product.name}</span> — Category: <span className="font-medium">{productCategory}</span></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/masters/products/${product.id}`)}>Back to Product</Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Flavours</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Flavour</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Flavour</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && <div className="text-sm text-destructive">{error}</div>}
              <div className="space-y-2">
                <Label>Flavour Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v:'Active'|'Inactive') => setStatus(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flavour Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productFlavours.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No flavours for this product.</TableCell>
                </TableRow>
              )}
              {productFlavours.map(f => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell><Badge variant={f.status==='Active'?'default':'secondary'}>{f.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/masters/products/${product.id}/flavours/${f.id}`}>Manage Recipes</Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(f)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(f.id)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ManageFlavours;
