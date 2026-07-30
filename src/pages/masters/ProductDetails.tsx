import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useErpData } from '@/context/ErpContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    products, categories, flavours, addFlavour, removeFlavour,
    recipes, manufacturers
  } = useErpData();

  const product = products.find(p => p.id === id);
  const productCategory = product ? categories.find(c => c.id === product.categoryId)?.name || '' : '';
  const productManufacturer = product ? manufacturers.find(m => m.id === product.manufacturerId)?.name || '' : '';
  const productFlavours = useMemo(() => flavours.filter(f => f.productId === product?.id), [flavours, product?.id]);

  // Flavour form
  const [fOpen, setFOpen] = useState(false);
  const [fName, setFName] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fStatus, setFStatus] = useState<'Active'|'Inactive'>('Active');
  const [fError, setFError] = useState('');

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

  const handleAddFlavour = () => {
    if (!fName.trim()) { setFError('Flavour name is required'); return; }
    if (productFlavours.some(f => f.name.toLowerCase() === fName.toLowerCase())) { setFError('Flavour already exists for this product'); return; }
    addFlavour({ id: Math.random().toString(), name: fName, productId: product.id, status: fStatus });
    setFName(''); setFDesc(''); setFStatus('Active'); setFError(''); setFOpen(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">{product.name}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/masters/products')}>Back</Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Product</div>
              <div className="font-medium">{product.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Category</div>
              <div className="font-medium">{productCategory}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Manufacturer</div>
              <div className="font-medium">{productManufacturer || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Shelf Life</div>
              <div className="font-medium">{product.shelfLife} Months</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-medium">{product.status}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flavours Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Flavours</h3>
        <Dialog open={fOpen} onOpenChange={setFOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Flavour</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Flavour</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {fError && <div className="text-sm text-destructive">{fError}</div>}
              <div className="space-y-2">
                <Label>Flavour Name</Label>
                <Input value={fName} onChange={e => setFName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={fDesc} onChange={e => setFDesc(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={fStatus} onValueChange={(v: 'Active'|'Inactive') => setFStatus(v)}>
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
              <Button onClick={handleAddFlavour}>Save</Button>
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
                <TableHead>Actions</TableHead>
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
                  <TableCell><Badge variant={f.status === 'Active' ? 'default' : 'secondary'}>{f.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/masters/products/${product.id}/flavours/${f.id}`}>View</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/masters/products/${product.id}/flavours/${f.id}`}>Manage</Link>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { /* edit flavour inline dialog could be added */ }}>{<Edit className="h-4 w-4" />}</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeFlavour(f.id)}>{<Trash className="h-4 w-4" />}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Tabs defaultValue="flavours">
        <TabsList>
          <TabsTrigger value="flavours">Flavours</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="boxes">Box Planning</TabsTrigger>
          <TabsTrigger value="info">Product Information</TabsTrigger>
        </TabsList>

        <TabsContent value="flavours">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flavour Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
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
                      <TableCell><Badge variant={f.status === 'Active' ? 'default' : 'secondary'}>{f.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/masters/products/${product.id}/flavours/${f.id}`}>View</Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/masters/products/${product.id}/flavours/${f.id}`}>Manage</Link>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { /* edit flavour inline dialog could be added */ }}>{<Edit className="h-4 w-4" />}</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeFlavour(f.id)}>{<Trash className="h-4 w-4" />}</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipes">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productFlavours.map(f => (
                  <div key={f.id} className="flex items-center justify-between border-b py-2">
                    <div>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-sm text-muted-foreground">{recipes.filter(r => r.flavourId === f.id).length} recipe(s)</div>
                    </div>
                    <div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/masters/products/${product.id}/flavours/${f.id}`}>Open Flavour</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boxes">
          <Card>
            <CardHeader>
              <CardTitle>Product Box Planning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Assorted box calculation is handled on the dedicated product-level Assorted Configuration page.
              </div>
              <Button asChild>
                <Link to={`/masters/products/${product.id}/assorted-configuration`}>Open Assorted Configuration</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardContent>
              <div className="space-y-2">
                <div><strong>Product</strong>: {product.name}</div>
                <div><strong>Category</strong>: {productCategory}</div>
                <div><strong>Shelf Life</strong>: {product.shelfLife} Months</div>
                <div><strong>Status</strong>: {product.status}</div>
                <div className="text-sm text-muted-foreground mt-2">{product.description}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

export default ProductDetails;
