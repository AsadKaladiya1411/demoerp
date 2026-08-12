import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useErpData } from '@/context/ErpContext';
import { calculateProduction } from '@/lib/production';
import { PackageOpen } from 'lucide-react';

type PurchaseStatus = 'Pending' | 'Ordered' | 'In Transit' | 'Delivered';

type PurchaseForm = {
  purchasedQuantity: string;
  expiryDate: string;
  pricePerUnit: string;
  supplierName: string;
  poNumber: string;
  expectedDeliveryDateTime: string;
  receiverLocation: string;
  documents: string;
  remarks: string;
  status: PurchaseStatus;
};

type PurchaseRecord = PurchaseForm & {
  id: string;
  materialId: string;
  materialName: string;
  requiredQuantity: number;
  unit: string;
  totalPrice: number;
};

type RequirementRow = {
  materialId: string;
  materialName: string;
  requiredQuantity: number;
  availableQuantity: number;
  balanceToPurchase: number;
  unit: string;
};

const normalizeRequirementRecipeUnits = <T extends { materials: Array<{ unit: string }> }>(recipe: T): T => ({
  ...recipe,
  materials: recipe.materials.map(material => ({
    ...material,
    unit: material.unit === '%' ? 'kg' : material.unit || 'kg',
  })),
});

const emptyForm: PurchaseForm = {
  purchasedQuantity: '',
  expiryDate: '',
  pricePerUnit: '',
  supplierName: '',
  poNumber: '',
  expectedDeliveryDateTime: '',
  receiverLocation: '',
  documents: '',
  remarks: '',
  status: 'Pending',
};

export function RmRequirement() {
  const { recipes, materials, productionPlans, rmPurchaseRecords: records, goodsReceiptRecords, saveRmPurchaseRecord } = useErpData();
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [form, setForm] = useState<PurchaseForm>(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');

  const requirementRows = useMemo<RequirementRow[]>(() => {
    const totals = new Map<string, RequirementRow>();

    productionPlans.forEach(plan => {
      const recipe = recipes.find(item => item.id === plan.recipeId);
      if (!recipe) return;

      const production = calculateProduction(normalizeRequirementRecipeUnits(recipe), materials, plan.quantity);
      production.rawMaterials.forEach(row => {
        const materialName = row.name || row.materialId;
        const material = materials.find(item => item.id === row.materialId || item.name === materialName);
        const availableQuantity = material?.stock ?? 0;
        const key = `${materialName.trim().toLowerCase()}-${row.unit}`;
        const existing = totals.get(key);
        const requiredQuantity = Math.ceil((existing?.requiredQuantity || 0) + row.required);
        totals.set(key, {
          materialId: existing?.materialId || material?.id || materialName,
          materialName,
          requiredQuantity,
          availableQuantity: existing?.availableQuantity ?? availableQuantity,
          balanceToPurchase: Math.max(0, requiredQuantity - (existing?.availableQuantity ?? availableQuantity)),
          unit: row.unit,
        });
      });
    });

    return Array.from(totals.values()).sort((a, b) => a.materialName.localeCompare(b.materialName));
  }, [materials, productionPlans, recipes]);

  const selectedRequirement = requirementRows.find(row => row.materialId === selectedMaterialId) || null;
  const totalPrice = (Number(form.purchasedQuantity) || 0) * (Number(form.pricePerUnit) || 0);
  const getReceiptSummary = (record: PurchaseRecord) => {
    const purchaseQuantity = Number(record.purchasedQuantity) || record.requiredQuantity || 0;
    const receivedQuantity = goodsReceiptRecords
      .filter(receipt => receipt.sourceType === 'Raw Materials' && receipt.sourceId === record.id)
      .reduce((sum, receipt) => sum + receipt.receivedQuantity, 0);
    const pendingQuantity = Math.max(0, purchaseQuantity - receivedQuantity);
    const receiptStatus = receivedQuantity <= 0
      ? 'Pending'
      : pendingQuantity > 0
        ? 'Partially Received'
        : 'Received';

    return { purchaseQuantity, receivedQuantity, pendingQuantity, receiptStatus };
  };

  const updateForm = (field: keyof PurchaseForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const openNewForm = (materialId: string) => {
    setSelectedMaterialId(materialId);
    setForm(emptyForm);
    setEditingId('');
    setMessage('');
  };

  const editRecord = (record: PurchaseRecord) => {
    setSelectedMaterialId(record.materialId);
    setForm({
      purchasedQuantity: record.purchasedQuantity,
      expiryDate: record.expiryDate,
      pricePerUnit: record.pricePerUnit,
      supplierName: record.supplierName,
      poNumber: record.poNumber,
      expectedDeliveryDateTime: record.expectedDeliveryDateTime,
      receiverLocation: record.receiverLocation,
      documents: record.documents,
      remarks: record.remarks,
      status: record.status,
    });
    setEditingId(record.id);
    setMessage('');
  };

  const saveRecord = () => {
    if (!selectedRequirement) {
      setMessage('Select material first.');
      return;
    }
    if ((Number(form.purchasedQuantity) || 0) <= 0) {
      setMessage('Purchased Quantity must be greater than zero.');
      return;
    }

    const payload: PurchaseRecord = {
      ...form,
      id: editingId || Math.random().toString(36).slice(2),
      materialId: selectedRequirement.materialId,
      materialName: selectedRequirement.materialName,
      requiredQuantity: selectedRequirement.requiredQuantity,
      unit: selectedRequirement.unit,
      totalPrice: Number(totalPrice.toFixed(2)),
    };

    saveRmPurchaseRecord(payload);
    setForm(emptyForm);
    setEditingId('');
    setMessage('Purchase record saved.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">RM Requirement</h2>
        <div className="text-sm text-muted-foreground">Raw material purchase management and tracking</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageOpen className="h-5 w-5 text-primary" />
            Raw Material Requirement List
          </CardTitle>
          <CardDescription>Raw materials are automatically consolidated from saved production planning records.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material Name</TableHead>
                <TableHead>Required Quantity</TableHead>
                <TableHead>Available Stock</TableHead>
                <TableHead>Balance To Purchase</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirementRows.map(row => (
                <TableRow key={`${row.materialId}-${row.unit}`}>
                  <TableCell>{row.materialName}</TableCell>
                  <TableCell>{row.requiredQuantity}</TableCell>
                  <TableCell>{row.availableQuantity}</TableCell>
                  <TableCell>{row.balanceToPurchase}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openNewForm(row.materialId)}>Select</Button>
                  </TableCell>
                </TableRow>
              ))}
              {requirementRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">No RM requirement available. Save production planning records first.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedRequirement ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Purchase Record' : 'Purchase Record Form'}</CardTitle>
            <CardDescription>Requirement details are read only. Purchase details are manually entered.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-medium">Requirement Details</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Material Name</Label>
                  <Input readOnly value={selectedRequirement.materialName} />
                </div>
                <div className="space-y-2">
                  <Label>Required Quantity</Label>
                  <Input readOnly value={selectedRequirement.requiredQuantity} />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input readOnly value={selectedRequirement.unit} />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Purchase Details</h4>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Purchased Quantity</Label>
                  <Input type="number" value={form.purchasedQuantity} onChange={event => updateForm('purchasedQuantity', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input type="date" value={form.expiryDate} onChange={event => updateForm('expiryDate', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Price Per Unit</Label>
                  <Input type="number" value={form.pricePerUnit} onChange={event => updateForm('pricePerUnit', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Total Price</Label>
                  <Input readOnly value={totalPrice.toFixed(2)} />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Supplier Details</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Supplier Name</Label>
                  <Input value={form.supplierName} onChange={event => updateForm('supplierName', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>PO Number</Label>
                  <Input value={form.poNumber} onChange={event => updateForm('poNumber', event.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Delivery Details</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Expected Delivery Date & Time</Label>
                  <Input type="datetime-local" value={form.expectedDeliveryDateTime} onChange={event => updateForm('expectedDeliveryDateTime', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Receiver Location</Label>
                  <Input value={form.receiverLocation} onChange={event => updateForm('receiverLocation', event.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Documents</h4>
              <div className="space-y-2">
                <Label>Upload Files</Label>
                <Input
                  type="file"
                  multiple
                  onChange={event => updateForm('documents', Array.from(event.target.files || []).map(file => file.name).join(', '))}
                />
                <div className="text-sm text-muted-foreground">{form.documents || 'No files selected'}</div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Other Details</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Input value={form.remarks} onChange={event => updateForm('remarks', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(value: PurchaseStatus) => setForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Ordered">Ordered</SelectItem>
                      <SelectItem value="In Transit">In Transit</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t pt-4">
              <Button onClick={saveRecord}>Save</Button>
              <Button variant="outline" onClick={() => { setForm(emptyForm); setEditingId(''); setMessage(''); }}>Cancel</Button>
              <span className="text-sm text-muted-foreground">{message}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>Saved raw material purchase records.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material Name</TableHead>
                <TableHead>Required Quantity</TableHead>
                <TableHead>Purchased Quantity</TableHead>
                <TableHead>Received Quantity</TableHead>
                <TableHead>Pending Quantity</TableHead>
                <TableHead>Price Per Unit</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Purchase Status</TableHead>
                <TableHead>Receipt Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(record => {
                const receipt = getReceiptSummary(record);
                return (
                  <TableRow key={record.id}>
                    <TableCell>{record.materialName}</TableCell>
                    <TableCell>{record.requiredQuantity} {record.unit}</TableCell>
                    <TableCell>{receipt.purchaseQuantity} {record.unit}</TableCell>
                    <TableCell>{receipt.receivedQuantity} {record.unit}</TableCell>
                    <TableCell>{receipt.pendingQuantity} {record.unit}</TableCell>
                    <TableCell>{record.pricePerUnit}</TableCell>
                    <TableCell>{record.totalPrice}</TableCell>
                    <TableCell>{record.supplierName || '-'}</TableCell>
                    <TableCell>{record.poNumber || '-'}</TableCell>
                    <TableCell>{record.expectedDeliveryDateTime || '-'}</TableCell>
                    <TableCell>{record.status}</TableCell>
                    <TableCell>{receipt.receiptStatus}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => editRecord(record)}>View</Button>
                        <Button variant="ghost" size="sm" onClick={() => editRecord(record)}>Edit</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={13} className="py-6 text-center text-muted-foreground">No purchase history yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default RmRequirement;
