import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useErpData } from '@/context/ErpContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';

export function Products() {
  const { products, categories, addProduct, updateProduct, removeProduct, manufacturers } = useErpData();
  const [search, setSearch] = useState('');

  // Form State
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [shelfLife, setShelfLife] = useState('');
  const [expiryRequired, setExpiryRequired] = useState('yes');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [error, setError] = useState('');

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase()));

  const resetForm = () => {
    setEditingId('');
    setCode('');
    setName('');
    setCategoryId('');
    setManufacturerId('');
    setShelfLife('');
    setExpiryRequired('yes');
    setDescription('');
    setStatus('Active');
    setError('');
  };

  const openAddDialog = () => {
    resetForm();
    setOpen(true);
  };

  const openEditDialog = (product: typeof products[number]) => {
    setEditingId(product.id);
    setCode(product.code);
    setName(product.name);
    setCategoryId(product.categoryId);
    setManufacturerId(product.manufacturerId || '');
    setShelfLife(String(product.shelfLife));
    setExpiryRequired(product.expiryRequired ? 'yes' : 'no');
    setDescription(product.description);
    setStatus(product.status);
    setError('');
    setOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Product Name is required.');
      return;
    }
    
    if (!categoryId) {
      setError('Category selection is required.');
      return;
    }
    
    if (products.some(p => p.id !== editingId && p.name.toLowerCase() === name.toLowerCase() && p.categoryId === categoryId)) {
      setError('A Product with this name already exists in the selected Category.');
      return;
    }

    const payload = {
      id: editingId || Math.random().toString(),
      code: code || `PRD-${Math.floor(Math.random() * 1000)}`,
      name,
      categoryId,
      manufacturerId: manufacturerId || undefined,
      shelfLife: Number(shelfLife) || 0,
      expiryRequired: expiryRequired === 'yes',
      description,
      status
    };

    if (editingId) updateProduct(payload);
    else addProduct(payload);

    resetForm();
    setOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Products Master</h2>
        
        <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && <div className="text-sm text-destructive font-medium">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product Code</Label>
                  <Input placeholder="Auto or Manual" value={code} onChange={e => setCode(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Product Name <span className="text-destructive">*</span></Label>
                  <Input placeholder="E.g. Whey Protein" value={name} onChange={e => setName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category <span className="text-destructive">*</span></Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No categories available. Please create a Product Category first.
                      </div>
                    ) : (
                      categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Select value={manufacturerId} onValueChange={setManufacturerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Manufacturer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {manufacturers.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Shelf Life (Months)</Label>
                  <Input type="number" placeholder="E.g. 24" value={shelfLife} onChange={e => setShelfLife(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Required</Label>
                  <Select value={expiryRequired} onValueChange={setExpiryRequired}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Brief description" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(val: 'Active' | 'Inactive') => setStatus(val)}>
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
        <CardHeader>
          <div className="flex items-center gap-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Code</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Shelf Life (Mo)</TableHead>
                <TableHead>Expiry Required</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(prod => (
                <TableRow key={prod.id}>
                  <TableCell className="font-medium">{prod.code}</TableCell>
                  <TableCell className="font-bold">{prod.name}</TableCell>
                  <TableCell>{categories.find(c => c.id === prod.categoryId)?.name}</TableCell>
                  <TableCell>{manufacturers.find(m => m.id === prod.manufacturerId)?.name || '-'}</TableCell>
                  <TableCell>{prod.shelfLife}</TableCell>
                  <TableCell>{prod.expiryRequired ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <Badge variant={prod.status === 'Active' ? 'default' : 'secondary'}>{prod.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/masters/products/${prod.id}`}>View</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/masters/products/${prod.id}/flavours`}>Manage Flavours</Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(prod)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeProduct(prod.id)}>Delete</Button>
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
