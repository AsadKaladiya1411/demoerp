import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useErpData } from '@/context/ErpContext';
import { calculatePackaging, calculateProduction, getPackagingRequiredDisplay } from '@/lib/production';
import { ClipboardList } from 'lucide-react';

type PurchaseUnit = 'Roll' | 'Nos';
type PurchaseStatus = 'Pending' | 'Ordered' | 'In Transit' | 'Delivered';

type SachetRequirement = {
  id: string;
  materialId: string;
  productName: string;
  materialName: string;
  requiredQuantity: number;
  availableQuantity: number;
  balanceToPurchase: number;
  unit: PurchaseUnit;
  displayUnit: string;
};

type SachetPurchaseForm = {
  purchaseUnit: PurchaseUnit;
  purchasedQuantity: string;
  weightPerRollKg: string;
  pricePerKg: string;
  pricePerSachet: string;
  supplierName: string;
  poNumber: string;
  expectedDeliveryDateTime: string;
  receiverLocation: string;
  documents: string;
  remarks: string;
  status: PurchaseStatus;
};

type SachetPurchaseRecord = SachetPurchaseForm & {
  id: string;
  materialId?: string;
  productName: string;
  requiredQuantity: number;
  requiredUnit: PurchaseUnit;
  requiredDisplayUnit: string;
  totalWeight: number;
  totalPrice: number;
};

type BoxRequirement = {
  id: string;
  flavouredMaterialId?: string;
  assortedMaterialId?: string;
  productName: string;
  flavouredBoxesRequired: number;
  assortedBoxesRequired: number;
  flavouredBoxesAvailable: number;
  assortedBoxesAvailable: number;
  flavouredBalanceToPurchase: number;
  assortedBalanceToPurchase: number;
};

type BoxPurchaseForm = {
  flavouredPurchasedQuantity: string;
  pricePerFlavouredBox: string;
  assortedPurchasedQuantity: string;
  pricePerAssortedBox: string;
  supplierName: string;
  poNumber: string;
  expectedDeliveryDateTime: string;
  receiverLocation: string;
  documents: string;
  remarks: string;
  status: PurchaseStatus;
};

type BoxPurchaseRecord = BoxPurchaseForm & {
  id: string;
  flavouredMaterialId?: string;
  assortedMaterialId?: string;
  productName: string;
  flavouredBoxesRequired: number;
  assortedBoxesRequired: number;
  flavouredTotalPrice: number;
  assortedTotalPrice: number;
  grandTotalPrice: number;
};

const emptyForm: SachetPurchaseForm = {
  purchaseUnit: 'Roll',
  purchasedQuantity: '',
  weightPerRollKg: '',
  pricePerKg: '',
  pricePerSachet: '',
  supplierName: '',
  poNumber: '',
  expectedDeliveryDateTime: '',
  receiverLocation: '',
  documents: '',
  remarks: '',
  status: 'Pending',
};

const emptyBoxForm: BoxPurchaseForm = {
  flavouredPurchasedQuantity: '',
  pricePerFlavouredBox: '',
  assortedPurchasedQuantity: '',
  pricePerAssortedBox: '',
  supplierName: '',
  poNumber: '',
  expectedDeliveryDateTime: '',
  receiverLocation: '',
  documents: '',
  remarks: '',
  status: 'Pending',
};

function isSachetMaterial(name: string, unit: string) {
  const normalized = name.toLowerCase();
  return unit === 'Roll' || normalized.includes('sachet') || normalized.includes('film') || normalized.includes('pouch');
}

export function PmRequirement() {
  const { products, recipes, materials, productionPlans, productionCalculations, assortedBoxCalculations, sachetPurchaseRecords: records, boxPurchaseRecords: boxRecords, goodsReceiptRecords, saveSachetPurchaseRecord, saveBoxPurchaseRecord } = useErpData();
  const [selectedRequirementId, setSelectedRequirementId] = useState('');
  const [form, setForm] = useState<SachetPurchaseForm>(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const [selectedBoxRequirementId, setSelectedBoxRequirementId] = useState('');
  const [boxForm, setBoxForm] = useState<BoxPurchaseForm>(emptyBoxForm);
  const [boxEditingId, setBoxEditingId] = useState('');
  const [boxMessage, setBoxMessage] = useState('');

  const requirements = useMemo<SachetRequirement[]>(() => {
    const totals = new Map<string, SachetRequirement>();

    productionPlans
      .forEach(plan => {
        const recipe = recipes.find(item => item.id === plan.recipeId);
        if (!recipe) return;

        const product = products.find(item => item.id === recipe.productId);
        const productionKg = Number(plan.quantity || recipe.batchSize);
        const production = calculateProduction(recipe, materials, productionKg);
        const packaging = calculatePackaging(production.totalFinishedUnits, recipe.packaging || [], materials);

        packaging.forEach(item => {
          const display = getPackagingRequiredDisplay(item);
          if (!isSachetMaterial(item.name || item.materialId, display.unit)) return;

          const unit = display.unit === 'Roll' ? 'Roll' : 'Nos';
          const material = materials.find(material => material.id === item.materialId);
          const materialName = item.name || material?.name || item.materialId;
          const key = `${item.materialId}-${unit}`;
          const existing = totals.get(key);
          const wastageMultiplier = 1 - ((item.wastagePercent || 0) / 100);
          const requiredRollKg = unit === 'Roll' && item.emptySachetWeightG && wastageMultiplier > 0
            ? (item.requiredSachets * item.emptySachetWeightG) / wastageMultiplier / 1000
            : display.quantity;
          const requiredQuantity = Number(((existing?.requiredQuantity || 0) + requiredRollKg).toFixed(6));
          const availableQuantity = existing?.availableQuantity ?? (material?.stock ?? 0);
          totals.set(key, {
            id: key,
            materialId: item.materialId,
            productName: product?.name || recipe.productId,
            materialName,
            requiredQuantity,
            availableQuantity,
            balanceToPurchase: Math.max(0, Number((requiredQuantity - availableQuantity).toFixed(6))),
            unit,
            displayUnit: unit === 'Roll' ? 'KG' : 'Nos',
          });
        });
      });

    return Array.from(totals.values()).sort((a, b) => a.productName.localeCompare(b.productName));
  }, [materials, productionPlans, products, recipes]);

  const selectedRequirement = requirements.find(item => item.id === selectedRequirementId) || null;
  const selectedRequirementQuantityLabel = selectedRequirement?.unit === 'Roll' ? 'Required Sachet KG' : 'Required Quantity';
  const purchasedQuantity = Number(form.purchasedQuantity) || 0;
  const weightPerRollKg = Number(form.weightPerRollKg) || 0;
  const requiredRolls = form.purchaseUnit === 'Roll' && selectedRequirement && weightPerRollKg > 0
    ? Math.ceil(selectedRequirement.requiredQuantity / weightPerRollKg)
    : 0;
  const totalWeight = form.purchaseUnit === 'Roll'
    ? purchasedQuantity * weightPerRollKg
    : 0;
  const totalPrice = form.purchaseUnit === 'Roll'
    ? totalWeight * (Number(form.pricePerKg) || 0)
    : purchasedQuantity * (Number(form.pricePerSachet) || 0);

  const boxRequirements = useMemo<BoxRequirement[]>(() => {
    const productIds = Array.from(new Set(productionPlans.map(plan => plan.productId)));

    return productIds.map(productId => {
      const product = products.find(item => item.id === productId);
      const productRecipes = recipes.filter(recipe => recipe.productId === productId);
      const boxPackaging = productRecipes.flatMap(recipe => recipe.packaging || []).filter(packaging => {
        const material = materials.find(item => item.id === packaging.materialId);
        const name = material?.name || packaging.materialId;
        return !isSachetMaterial(name, packaging.unit);
      });
      const flavouredMaterialId = boxPackaging[0]?.materialId;
      const assortedMaterialId = boxPackaging[1]?.materialId || boxPackaging[0]?.materialId;
      const flavouredMaterial = materials.find(item => item.id === flavouredMaterialId);
      const assortedMaterial = materials.find(item => item.id === assortedMaterialId);
      const plansForProduct = productionPlans.filter(plan => plan.productId === productId);
      const flavouredBoxesRequired = plansForProduct.reduce((sum, plan) => {
        const savedProduction = productionCalculations.find(item => item.recipeId === plan.recipeId);
        if (savedProduction) return sum + savedProduction.flavouredBoxes;

        const recipe = recipes.find(item => item.id === plan.recipeId);
        if (!recipe) return sum;

        const production = calculateProduction(recipe, materials, Number(plan.quantity || recipe.batchSize));
        const flavouredRatio = recipe.boxConfig?.defaultFlavouredPercentage || 0;
        const sachetsPerBox = recipe.boxConfig?.flavouredBox?.sachetsPerBox || 0;
        const flavouredSachets = Math.floor(production.totalFinishedUnits * (flavouredRatio / 100));
        const flavouredBoxes = sachetsPerBox > 0 ? Math.floor(flavouredSachets / sachetsPerBox) : 0;
        return sum + flavouredBoxes;
      }, 0);
      const assortedBoxesRequired = assortedBoxCalculations.find(item => item.productId === productId)?.totalAssortedBoxes || 0;

      return {
        id: productId,
        flavouredMaterialId,
        assortedMaterialId,
        productName: product?.name || productId,
        flavouredBoxesRequired,
        assortedBoxesRequired,
        flavouredBoxesAvailable: flavouredMaterial?.stock ?? 0,
        assortedBoxesAvailable: assortedMaterial?.stock ?? 0,
        flavouredBalanceToPurchase: Math.max(0, flavouredBoxesRequired - (flavouredMaterial?.stock ?? 0)),
        assortedBalanceToPurchase: Math.max(0, assortedBoxesRequired - (assortedMaterial?.stock ?? 0)),
      };
    }).sort((a, b) => a.productName.localeCompare(b.productName));
  }, [assortedBoxCalculations, materials, productionCalculations, productionPlans, products, recipes]);

  const selectedBoxRequirement = boxRequirements.find(item => item.id === selectedBoxRequirementId) || null;
  const flavouredTotalPrice = (Number(boxForm.flavouredPurchasedQuantity) || 0) * (Number(boxForm.pricePerFlavouredBox) || 0);
  const assortedTotalPrice = (Number(boxForm.assortedPurchasedQuantity) || 0) * (Number(boxForm.pricePerAssortedBox) || 0);
  const grandTotalPrice = flavouredTotalPrice + assortedTotalPrice;
  const getReceiptStatus = (purchaseQuantity: number, receivedQuantity: number) => {
    const pendingQuantity = Math.max(0, purchaseQuantity - receivedQuantity);
    const receiptStatus = receivedQuantity <= 0
      ? 'Pending'
      : pendingQuantity > 0
        ? 'Partially Received'
        : 'Received';

    return { pendingQuantity, receiptStatus };
  };
  const getSachetReceiptSummary = (record: SachetPurchaseRecord) => {
    const purchaseQuantity = Number(record.purchasedQuantity) || record.requiredQuantity || 0;
    const receivedQuantity = goodsReceiptRecords
      .filter(receipt => receipt.sourceType === 'Sachets' && receipt.sourceId === record.id)
      .reduce((sum, receipt) => sum + receipt.receivedQuantity, 0);

    return { purchaseQuantity, receivedQuantity, ...getReceiptStatus(purchaseQuantity, receivedQuantity) };
  };
  const getBoxLineReceiptSummary = (record: BoxPurchaseRecord, lineType: 'Flavoured' | 'Assorted') => {
    const purchaseQuantity = lineType === 'Flavoured'
      ? Number(record.flavouredPurchasedQuantity) || 0
      : Number(record.assortedPurchasedQuantity) || 0;
    const receivedQuantity = goodsReceiptRecords
      .filter(receipt => receipt.sourceType === 'Boxes' && receipt.sourceId === record.id && receipt.lineType === lineType)
      .reduce((sum, receipt) => sum + receipt.receivedQuantity, 0);

    return { purchaseQuantity, receivedQuantity, ...getReceiptStatus(purchaseQuantity, receivedQuantity) };
  };

  const updateForm = (field: keyof SachetPurchaseForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateBoxForm = (field: keyof BoxPurchaseForm, value: string) => {
    setBoxForm(prev => ({ ...prev, [field]: value }));
  };

  const openForm = (requirement: SachetRequirement) => {
    setSelectedRequirementId(requirement.id);
    setForm({ ...emptyForm, purchaseUnit: requirement.unit });
    setEditingId('');
    setMessage('');
  };

  const editRecord = (record: SachetPurchaseRecord) => {
    setSelectedRequirementId(`${requirements.find(item => item.productName === record.productName && item.unit === record.requiredUnit)?.id || ''}`);
    setForm({
      purchaseUnit: record.purchaseUnit,
      purchasedQuantity: record.purchasedQuantity,
      weightPerRollKg: record.weightPerRollKg,
      pricePerKg: record.pricePerKg,
      pricePerSachet: record.pricePerSachet,
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
      setMessage('Select product requirement first.');
      return;
    }
    if (purchasedQuantity <= 0) {
      setMessage('Purchased Quantity must be greater than zero.');
      return;
    }
    if (form.purchaseUnit === 'Roll' && weightPerRollKg <= 0) {
      setMessage('Weight Per Roll must be greater than zero.');
      return;
    }

    const payload: SachetPurchaseRecord = {
      ...form,
      id: editingId || Math.random().toString(36).slice(2),
      materialId: selectedRequirement.materialId,
      productName: selectedRequirement.productName,
      requiredQuantity: selectedRequirement.requiredQuantity,
      requiredUnit: selectedRequirement.unit,
      requiredDisplayUnit: selectedRequirement.displayUnit,
      totalWeight: Number(totalWeight.toFixed(6)),
      totalPrice: Number(totalPrice.toFixed(2)),
    };

    saveSachetPurchaseRecord(payload);
    setForm(emptyForm);
    setEditingId('');
    setMessage('Sachet purchase record saved.');
  };

  const openBoxForm = (requirement: BoxRequirement) => {
    setSelectedBoxRequirementId(requirement.id);
    setBoxForm(emptyBoxForm);
    setBoxEditingId('');
    setBoxMessage('');
  };

  const editBoxRecord = (record: BoxPurchaseRecord) => {
    const requirement = boxRequirements.find(item => item.productName === record.productName);
    setSelectedBoxRequirementId(requirement?.id || '');
    setBoxForm({
      flavouredPurchasedQuantity: record.flavouredPurchasedQuantity,
      pricePerFlavouredBox: record.pricePerFlavouredBox,
      assortedPurchasedQuantity: record.assortedPurchasedQuantity,
      pricePerAssortedBox: record.pricePerAssortedBox,
      supplierName: record.supplierName,
      poNumber: record.poNumber,
      expectedDeliveryDateTime: record.expectedDeliveryDateTime,
      receiverLocation: record.receiverLocation,
      documents: record.documents,
      remarks: record.remarks,
      status: record.status,
    });
    setBoxEditingId(record.id);
    setBoxMessage('');
  };

  const saveBoxRecord = () => {
    if (!selectedBoxRequirement) {
      setBoxMessage('Select product requirement first.');
      return;
    }
    if ((Number(boxForm.flavouredPurchasedQuantity) || 0) <= 0 && (Number(boxForm.assortedPurchasedQuantity) || 0) <= 0) {
      setBoxMessage('Enter flavoured or assorted purchased quantity.');
      return;
    }

    const payload: BoxPurchaseRecord = {
      ...boxForm,
      id: boxEditingId || Math.random().toString(36).slice(2),
      flavouredMaterialId: selectedBoxRequirement.flavouredMaterialId,
      assortedMaterialId: selectedBoxRequirement.assortedMaterialId,
      productName: selectedBoxRequirement.productName,
      flavouredBoxesRequired: selectedBoxRequirement.flavouredBoxesRequired,
      assortedBoxesRequired: selectedBoxRequirement.assortedBoxesRequired,
      flavouredTotalPrice: Number(flavouredTotalPrice.toFixed(2)),
      assortedTotalPrice: Number(assortedTotalPrice.toFixed(2)),
      grandTotalPrice: Number(grandTotalPrice.toFixed(2)),
    };

    saveBoxPurchaseRecord(payload);
    setBoxForm(emptyBoxForm);
    setBoxEditingId('');
    setBoxMessage('Box purchase record saved.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">PM Requirement</h2>
        <div className="text-sm text-muted-foreground">Packaging material requirement flow for Parthbhai</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Packaging Material
          </CardTitle>
          <CardDescription>PM requirements grouped by business use.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-4">
            <div className="font-medium">Sachets</div>
            <div className="text-sm text-muted-foreground">Sachet roll or empty sachet purchase tracking.</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="font-medium">Boxes</div>
            <div className="text-sm text-muted-foreground">Flavoured and assorted box requirement.</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sachets Requirement List</CardTitle>
          <CardDescription>Sachet requirements are automatically generated from saved production planning records.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Material Name</TableHead>
                <TableHead>Required Quantity</TableHead>
                <TableHead>Available Stock</TableHead>
                <TableHead>Balance To Purchase</TableHead>
                <TableHead>Required Unit</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requirements.map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.productName}</TableCell>
                  <TableCell>{row.materialName}</TableCell>
                  <TableCell>{row.requiredQuantity}</TableCell>
                  <TableCell>{row.availableQuantity}</TableCell>
                  <TableCell>{row.balanceToPurchase}</TableCell>
                  <TableCell>{row.displayUnit}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openForm(row)}>Open</Button>
                  </TableCell>
                </TableRow>
              ))}
              {requirements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">No sachet requirement available. Save production planning records first.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedRequirement ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Sachet Purchase' : 'Sachet Purchase Form'}</CardTitle>
            <CardDescription>Requirement details are read only. Purchase details are manual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-medium">Requirement Details</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input readOnly value={selectedRequirement.productName} />
                </div>
                <div className="space-y-2">
                  <Label>Material Name</Label>
                  <Input readOnly value={selectedRequirement.materialName} />
                </div>
                <div className="space-y-2">
                  <Label>{selectedRequirementQuantityLabel}</Label>
                  <Input readOnly value={selectedRequirement.requiredQuantity} />
                </div>
                <div className="space-y-2">
                  <Label>Available Stock</Label>
                  <Input readOnly value={selectedRequirement.availableQuantity} />
                </div>
                <div className="space-y-2">
                  <Label>Balance To Purchase</Label>
                  <Input readOnly value={selectedRequirement.balanceToPurchase} />
                </div>
                <div className="space-y-2">
                  <Label>Required Unit</Label>
                  <Input readOnly value={selectedRequirement.displayUnit} />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Purchase Details</h4>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Purchase Unit</Label>
                  <Select value={form.purchaseUnit} onValueChange={(value: PurchaseUnit) => setForm(prev => ({ ...prev, purchaseUnit: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Roll">Roll</SelectItem>
                      <SelectItem value="Nos">Nos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.purchaseUnit === 'Roll' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Weight Per Roll (KG)</Label>
                      <Input type="number" value={form.weightPerRollKg} onChange={event => updateForm('weightPerRollKg', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Required Rolls</Label>
                      <Input readOnly className="bg-muted" value={requiredRolls} />
                    </div>
                    <div className="space-y-2">
                      <Label>Purchased Rolls</Label>
                      <Input type="number" value={form.purchasedQuantity} onChange={event => updateForm('purchasedQuantity', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Price Per KG</Label>
                      <Input type="number" value={form.pricePerKg} onChange={event => updateForm('pricePerKg', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Weight</Label>
                      <Input readOnly className="bg-muted" value={totalWeight.toFixed(3)} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Purchased Quantity</Label>
                      <Input type="number" value={form.purchasedQuantity} onChange={event => updateForm('purchasedQuantity', event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Price Per Sachet</Label>
                      <Input type="number" value={form.pricePerSachet} onChange={event => updateForm('pricePerSachet', event.target.value)} />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Total Price</Label>
                  <Input readOnly className="bg-muted" value={totalPrice.toFixed(2)} />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Supplier Information</h4>
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
              <h4 className="font-medium">Delivery Information</h4>
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
              <Input
                type="file"
                multiple
                onChange={event => updateForm('documents', Array.from(event.target.files || []).map(file => file.name).join(', '))}
              />
              <div className="text-sm text-muted-foreground">{form.documents || 'No files selected'}</div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Other Information</h4>
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
          <CardDescription>Saved sachet purchase records.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Required Quantity</TableHead>
                <TableHead>Purchase Unit</TableHead>
                <TableHead>Purchased Quantity</TableHead>
                <TableHead>Received Quantity</TableHead>
                <TableHead>Pending Quantity</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Receiver Location</TableHead>
                <TableHead>Purchase Status</TableHead>
                <TableHead>Receipt Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(record => {
                const receipt = getSachetReceiptSummary(record);
                return (
                  <TableRow key={record.id}>
                    <TableCell>{record.productName}</TableCell>
                    <TableCell>{record.requiredQuantity} {record.requiredDisplayUnit}</TableCell>
                    <TableCell>{record.purchaseUnit}</TableCell>
                    <TableCell>{receipt.purchaseQuantity} {record.purchaseUnit}</TableCell>
                    <TableCell>{receipt.receivedQuantity} {record.purchaseUnit}</TableCell>
                    <TableCell>{receipt.pendingQuantity} {record.purchaseUnit}</TableCell>
                    <TableCell>{record.supplierName || '-'}</TableCell>
                    <TableCell>{record.poNumber || '-'}</TableCell>
                    <TableCell>{record.totalPrice}</TableCell>
                    <TableCell>{record.expectedDeliveryDateTime || '-'}</TableCell>
                    <TableCell>{record.receiverLocation || '-'}</TableCell>
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
                  <TableCell colSpan={14} className="py-6 text-center text-muted-foreground">No purchase history yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Boxes Requirement List</CardTitle>
          <CardDescription>Product-wise box requirements from saved production planning records.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Flavoured Boxes Required</TableHead>
                <TableHead>Flavoured Available</TableHead>
                <TableHead>Flavoured Balance</TableHead>
                <TableHead>Assorted Boxes Required</TableHead>
                <TableHead>Assorted Available</TableHead>
                <TableHead>Assorted Balance</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boxRequirements.map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.productName}</TableCell>
                  <TableCell>{row.flavouredBoxesRequired}</TableCell>
                  <TableCell>{row.flavouredBoxesAvailable}</TableCell>
                  <TableCell>{row.flavouredBalanceToPurchase}</TableCell>
                  <TableCell>{row.assortedBoxesRequired}</TableCell>
                  <TableCell>{row.assortedBoxesAvailable}</TableCell>
                  <TableCell>{row.assortedBalanceToPurchase}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => openBoxForm(row)}>Open Purchase Record</Button>
                  </TableCell>
                </TableRow>
              ))}
              {boxRequirements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">No box requirement available. Save production planning records first.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedBoxRequirement ? (
        <Card>
          <CardHeader>
            <CardTitle>{boxEditingId ? 'Edit Box Purchase' : 'Box Purchase Form'}</CardTitle>
            <CardDescription>Requirement details are read only. Purchase details are entered manually.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-medium">Requirement Details</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input readOnly className="bg-muted" value={selectedBoxRequirement.productName} />
                </div>
                <div className="space-y-2">
                  <Label>Flavoured Boxes Required</Label>
                  <Input readOnly className="bg-muted" value={selectedBoxRequirement.flavouredBoxesRequired} />
                </div>
                <div className="space-y-2">
                  <Label>Flavoured Balance To Purchase</Label>
                  <Input readOnly className="bg-muted" value={selectedBoxRequirement.flavouredBalanceToPurchase} />
                </div>
                <div className="space-y-2">
                  <Label>Assorted Boxes Required</Label>
                  <Input readOnly className="bg-muted" value={selectedBoxRequirement.assortedBoxesRequired} />
                </div>
                <div className="space-y-2">
                  <Label>Assorted Balance To Purchase</Label>
                  <Input readOnly className="bg-muted" value={selectedBoxRequirement.assortedBalanceToPurchase} />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Purchase Details</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Flavoured Purchased Quantity</Label>
                  <Input type="number" value={boxForm.flavouredPurchasedQuantity} onChange={event => updateBoxForm('flavouredPurchasedQuantity', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Price Per Flavoured Box</Label>
                  <Input type="number" value={boxForm.pricePerFlavouredBox} onChange={event => updateBoxForm('pricePerFlavouredBox', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Flavoured Total Price</Label>
                  <Input readOnly className="bg-muted" value={flavouredTotalPrice.toFixed(2)} />
                </div>
                <div className="space-y-2">
                  <Label>Assorted Purchased Quantity</Label>
                  <Input type="number" value={boxForm.assortedPurchasedQuantity} onChange={event => updateBoxForm('assortedPurchasedQuantity', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Price Per Assorted Box</Label>
                  <Input type="number" value={boxForm.pricePerAssortedBox} onChange={event => updateBoxForm('pricePerAssortedBox', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Assorted Total Price</Label>
                  <Input readOnly className="bg-muted" value={assortedTotalPrice.toFixed(2)} />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label>Grand Total Price</Label>
                  <Input readOnly className="bg-muted font-semibold" value={grandTotalPrice.toFixed(2)} />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Supplier Details</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Supplier Name</Label>
                  <Input value={boxForm.supplierName} onChange={event => updateBoxForm('supplierName', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>PO Number</Label>
                  <Input value={boxForm.poNumber} onChange={event => updateBoxForm('poNumber', event.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Delivery Details</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Expected Delivery Date & Time</Label>
                  <Input type="datetime-local" value={boxForm.expectedDeliveryDateTime} onChange={event => updateBoxForm('expectedDeliveryDateTime', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Receiver Location</Label>
                  <Input value={boxForm.receiverLocation} onChange={event => updateBoxForm('receiverLocation', event.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Documents</h4>
              <Input
                type="file"
                multiple
                onChange={event => updateBoxForm('documents', Array.from(event.target.files || []).map(file => file.name).join(', '))}
              />
              <div className="text-sm text-muted-foreground">{boxForm.documents || 'No files selected'}</div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium">Other Details</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Input value={boxForm.remarks} onChange={event => updateBoxForm('remarks', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={boxForm.status} onValueChange={(value: PurchaseStatus) => setBoxForm(prev => ({ ...prev, status: value }))}>
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
              <Button onClick={saveBoxRecord}>Save</Button>
              <Button variant="outline" onClick={() => { setBoxForm(emptyBoxForm); setBoxEditingId(''); setBoxMessage(''); }}>Cancel</Button>
              <span className="text-sm text-muted-foreground">{boxMessage}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Boxes Purchase History</CardTitle>
          <CardDescription>Saved box purchase management records.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Flavoured Purchased Quantity</TableHead>
                <TableHead>Flavoured Received</TableHead>
                <TableHead>Flavoured Pending</TableHead>
                <TableHead>Assorted Purchased Quantity</TableHead>
                <TableHead>Assorted Received</TableHead>
                <TableHead>Assorted Pending</TableHead>
                <TableHead>Grand Total Price</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Receiver Location</TableHead>
                <TableHead>Purchase Status</TableHead>
                <TableHead>Receipt Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boxRecords.map(record => {
                const flavouredReceipt = getBoxLineReceiptSummary(record, 'Flavoured');
                const assortedReceipt = getBoxLineReceiptSummary(record, 'Assorted');
                const receiptStatus = [flavouredReceipt, assortedReceipt]
                  .filter(receipt => receipt.purchaseQuantity > 0)
                  .every(receipt => receipt.pendingQuantity <= 0)
                  ? 'Received'
                  : [flavouredReceipt, assortedReceipt].some(receipt => receipt.receivedQuantity > 0)
                    ? 'Partially Received'
                    : 'Pending';

                return (
                  <TableRow key={record.id}>
                    <TableCell>{record.productName}</TableCell>
                    <TableCell>{flavouredReceipt.purchaseQuantity}</TableCell>
                    <TableCell>{flavouredReceipt.receivedQuantity}</TableCell>
                    <TableCell>{flavouredReceipt.pendingQuantity}</TableCell>
                    <TableCell>{assortedReceipt.purchaseQuantity}</TableCell>
                    <TableCell>{assortedReceipt.receivedQuantity}</TableCell>
                    <TableCell>{assortedReceipt.pendingQuantity}</TableCell>
                    <TableCell>{record.grandTotalPrice}</TableCell>
                    <TableCell>{record.supplierName || '-'}</TableCell>
                    <TableCell>{record.poNumber || '-'}</TableCell>
                    <TableCell>{record.expectedDeliveryDateTime || '-'}</TableCell>
                    <TableCell>{record.receiverLocation || '-'}</TableCell>
                    <TableCell>{record.status}</TableCell>
                    <TableCell>{receiptStatus}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => editBoxRecord(record)}>View</Button>
                        <Button variant="ghost" size="sm" onClick={() => editBoxRecord(record)}>Edit</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {boxRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={15} className="py-6 text-center text-muted-foreground">No box purchase history yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default PmRequirement;
