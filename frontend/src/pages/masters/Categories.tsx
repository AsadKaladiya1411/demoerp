import { useState } from 'react';
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

export function Categories() {
  const { categories, addCategory, updateCategory, removeCategory } = useErpData();
  const [search, setSearch] = useState('');
  
  // Form State
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [error, setError] = useState('');

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()));

  const resetForm = () => {
    setEditingId('');
    setCode('');
    setName('');
    setDescription('');
    setStatus('Active');
    setError('');
  };

  const openAddDialog = () => {
    resetForm();
    setOpen(true);
  };

  const openEditDialog = (category: typeof categories[number]) => {
    setEditingId(category.id);
    setCode(category.code);
    setName(category.name);
    setDescription(category.description);
    setStatus(category.status);
    setError('');
    setOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Category Name is required.');
      return;
    }
    
    if (categories.some(c => c.id !== editingId && c.name.toLowerCase() === name.toLowerCase())) {
      setError('A Category with this name already exists.');
      return;
    }

    const payload = {
      id: editingId || Math.random().toString(),
      code: code || `CAT-${Math.floor(Math.random() * 1000)}`,
      name,
      description,
      status,
      createdDate: editingId ? categories.find(category => category.id === editingId)?.createdDate || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    };

    if (editingId) updateCategory(payload);
    else addCategory(payload);
    
    resetForm();
    setOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Product Categories</h2>
        
        <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && <div className="text-sm text-destructive font-medium">{error}</div>}
              <div className="space-y-2">
                <Label>Category Code</Label>
                <Input placeholder="Auto or Manual" value={code} onChange={e => setCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Category Name <span className="text-destructive">*</span></Label>
                <Input placeholder="E.g. Kids Nutrition" value={name} onChange={e => setName(e.target.value)} />
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
            <Input 
              placeholder="Search categories..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Code</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No categories found.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(cat => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.code}</TableCell>
                  <TableCell className="font-bold">{cat.name}</TableCell>
                  <TableCell>{cat.description}</TableCell>
                  <TableCell>{cat.createdDate}</TableCell>
                  <TableCell>
                    <Badge variant={cat.status === 'Active' ? 'default' : 'secondary'}>{cat.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(cat)}>Edit</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeCategory(cat.id)}>Delete</Button>
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
