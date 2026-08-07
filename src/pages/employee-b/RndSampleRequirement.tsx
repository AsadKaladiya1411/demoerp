import { useMemo, useState, useEffect, type WheelEvent } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { PackageOpen } from 'lucide-react';
import { recordSampleDispatch } from '../employee-a/sampleInventoryStore';
import {
  getRndSampleRequirements,
  updateRndSampleRequirementStatus,
  subscribeRndRequirementStore,
} from './rndRequirementStore';

type RequirementStatus = 'Pending' | 'Purchased' | 'Received' | 'Sent to R&D';

type PurchaseMode = 'create' | 'view';

type SampleRequirementRow = {
  id: string;
  requirementDate: string;
  requestedBy: string;
  materialName: string;
  requiredQuantity: number;
  unit: string;
  status: RequirementStatus;
};

type SamplePurchaseRecord = {
  id: string;
  requirementId: string;
  requirementDate: string;
  requestedBy: string;
  materialName: string;
  requiredQuantity: number;
  unit: string;
  purchaseDate: string;
  poNumber: string;
  supplier: string;
  purchasedQuantity: string;
  pricePerUnit: string;
  expectedDeliveryDate: string;
  remarks: string;
  totalAmount: number;
  status: 'Purchased' | 'Received' | 'Sent to R&D';
  receipt?: {
    receivedQuantity: string;
    receivedDate: string;
    invoiceNumber: string;
    remarks: string;
  };
  dispatch?: {
    dispatchDate: string;
    dispatchedBy: string;
    remarks: string;
  };
};

type PurchaseForm = {
  requirementId: string;
  requirementDate: string;
  requestedBy: string;
  materialName: string;
  requiredQuantity: string;
  unit: string;
  purchaseDate: string;
  poNumber: string;
  supplier: string;
  purchasedQuantity: string;
  pricePerUnit: string;
  expectedDeliveryDate: string;
  remarks: string;
};

type ReceiptMode = 'receive' | 'view';

type DispatchMode = 'send' | 'view';

type ReceiptForm = {
  requirementId: string;
  requirementDate: string;
  requestedBy: string;
  materialName: string;
  requiredQuantity: string;
  unit: string;
  purchaseDate: string;
  poNumber: string;
  supplier: string;
  purchasedQuantity: string;
  pricePerUnit: string;
  expectedDeliveryDate: string;
  purchaseRemarks: string;
  receivedQuantity: string;
  receivedDate: string;
  invoiceNumber: string;
  receiptRemarks: string;
};

type DispatchForm = {
  requirementId: string;
  poNumber: string;
  materialName: string;
  receivedQuantity: string;
  dispatchDate: string;
  dispatchedBy: string;
  remarks: string;
};

const statusOrder: RequirementStatus[] = ['Pending', 'Purchased', 'Received', 'Sent to R&D'];

const createEmptyPurchaseForm = (): PurchaseForm => ({
  requirementId: '',
  requirementDate: '',
  requestedBy: '',
  materialName: '',
  requiredQuantity: '',
  unit: '',
  purchaseDate: '',
  poNumber: '',
  supplier: '',
  purchasedQuantity: '',
  pricePerUnit: '',
  expectedDeliveryDate: '',
  remarks: '',
});

const createEmptyReceiptForm = (): ReceiptForm => ({
  requirementId: '',
  requirementDate: '',
  requestedBy: '',
  materialName: '',
  requiredQuantity: '',
  unit: '',
  purchaseDate: '',
  poNumber: '',
  supplier: '',
  purchasedQuantity: '',
  pricePerUnit: '',
  expectedDeliveryDate: '',
  purchaseRemarks: '',
  receivedQuantity: '',
  receivedDate: '',
  invoiceNumber: '',
  receiptRemarks: '',
});

const createEmptyDispatchForm = (): DispatchForm => ({
  requirementId: '',
  poNumber: '',
  materialName: '',
  receivedQuantity: '',
  dispatchDate: '',
  dispatchedBy: '',
  remarks: '',
});

const initialRequirementRows: SampleRequirementRow[] = [];

const mapStoreToRow = (r: any): SampleRequirementRow => ({
  id: r.requirementId,
  requirementDate: r.requestDate,
  requestedBy: r.requestedBy,
  materialName: r.materialName,
  requiredQuantity: Number(r.quantity || 0),
  unit: r.unit,
  status: r.status,
});

const statusVariant: Record<RequirementStatus, 'default' | 'secondary' | 'outline'> = {
  Pending: 'outline',
  Purchased: 'secondary',
  Received: 'default',
  'Sent to R&D': 'outline',
};

const purchaseStatusVariant: Record<SamplePurchaseRecord['status'], 'default' | 'secondary' | 'outline'> = {
  Purchased: 'secondary',
  Received: 'default',
  'Sent to R&D': 'outline',
};

const manualNumberInputClassName = 'w-36 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

const preventNumberWheel = (event: WheelEvent<HTMLInputElement>) => {
  event.preventDefault();
};

const todayString = () => new Date().toISOString().slice(0, 10);

const formatMoney = (value: number) => value.toFixed(2);

export function RndSampleRequirement() {
  const { currentUser } = useAuth();
  const [rows, setRows] = useState<SampleRequirementRow[]>(() => getRndSampleRequirements().map(mapStoreToRow));
  const [purchaseRecords, setPurchaseRecords] = useState<SamplePurchaseRecord[]>([]);
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('create');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [dispatchDialogOpen, setDispatchDialogOpen] = useState(false);
  const [receiptMode, setReceiptMode] = useState<ReceiptMode>('receive');
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>('send');
  const [editingRequirementId, setEditingRequirementId] = useState('');
  const [form, setForm] = useState<PurchaseForm>(createEmptyPurchaseForm);
  const [receiptForm, setReceiptForm] = useState<ReceiptForm>(createEmptyReceiptForm);
  const [dispatchForm, setDispatchForm] = useState<DispatchForm>(createEmptyDispatchForm);
  const [message, setMessage] = useState('');

  const canEdit = currentUser.role === 'Employee B';
  const canView = currentUser.role === 'Boss' || canEdit;
  const displayRows = canView ? rows : [];
  useEffect(() => {
    const unsubscribe = subscribeRndRequirementStore(() => setRows(getRndSampleRequirements().map(mapStoreToRow)));
    return unsubscribe;
  }, []);
  const selectedRequirement = useMemo(() => rows.find(row => row.id === editingRequirementId) || null, [editingRequirementId, rows]);
  const selectedPurchase = useMemo(() => purchaseRecords.find(record => record.requirementId === editingRequirementId) || null, [editingRequirementId, purchaseRecords]);
  const purchaseTotalAmount = (Number(form.purchasedQuantity) || 0) * (Number(form.pricePerUnit) || 0);
  const receiptTotalAmount = (Number(receiptForm.receivedQuantity) || 0) * (Number(receiptForm.pricePerUnit) || 0);

  const openCreatePurchase = (row: SampleRequirementRow) => {
    setPurchaseMode('create');
    setEditingRequirementId(row.id);
    setForm({
      requirementId: row.id,
      requirementDate: row.requirementDate,
      requestedBy: row.requestedBy,
      materialName: row.materialName,
      requiredQuantity: row.requiredQuantity.toFixed(2),
      unit: row.unit,
      purchaseDate: todayString(),
      poNumber: `RND-PO-${String(purchaseRecords.length + 1).padStart(4, '0')}`,
      supplier: '',
      purchasedQuantity: row.requiredQuantity.toFixed(2),
      pricePerUnit: '',
      expectedDeliveryDate: '',
      remarks: '',
    });
    setMessage('');
    setDialogOpen(true);
  };

  const openReceiveMaterial = (record: SamplePurchaseRecord) => {
    setReceiptMode('receive');
    setEditingRequirementId(record.requirementId);
    setReceiptForm({
      requirementId: record.requirementId,
      requirementDate: record.requirementDate,
      requestedBy: record.requestedBy,
      materialName: record.materialName,
      requiredQuantity: record.requiredQuantity.toFixed(2),
      unit: record.unit,
      purchaseDate: record.purchaseDate,
      poNumber: record.poNumber,
      supplier: record.supplier,
      purchasedQuantity: record.purchasedQuantity,
      pricePerUnit: record.pricePerUnit,
      expectedDeliveryDate: record.expectedDeliveryDate,
      purchaseRemarks: record.remarks,
      receivedQuantity: record.purchasedQuantity,
      receivedDate: todayString(),
      invoiceNumber: '',
      receiptRemarks: '',
    });
    setMessage('');
    setReceiptDialogOpen(true);
  };

  const openSendToRnd = (record: SamplePurchaseRecord) => {
    if (!record.receipt) return;

    setDispatchMode('send');
    setEditingRequirementId(record.requirementId);
    setDispatchForm({
      requirementId: record.requirementId,
      poNumber: record.poNumber,
      materialName: record.materialName,
      receivedQuantity: record.receipt.receivedQuantity,
      dispatchDate: todayString(),
      dispatchedBy: currentUser.name,
      remarks: '',
    });
    setMessage('');
    setDispatchDialogOpen(true);
  };

  const openViewDispatch = (record: SamplePurchaseRecord) => {
    if (!record.dispatch || !record.receipt) return;

    setDispatchMode('view');
    setEditingRequirementId(record.requirementId);
    setDispatchForm({
      requirementId: record.requirementId,
      poNumber: record.poNumber,
      materialName: record.materialName,
      receivedQuantity: record.receipt.receivedQuantity,
      dispatchDate: record.dispatch.dispatchDate,
      dispatchedBy: record.dispatch.dispatchedBy,
      remarks: record.dispatch.remarks,
    });
    setMessage('');
    setDispatchDialogOpen(true);
  };

  const openViewPurchase = (row: SampleRequirementRow) => {
    const purchase = purchaseRecords.find(record => record.requirementId === row.id);
    if (!purchase) return;

    setPurchaseMode('view');
    setEditingRequirementId(row.id);
    setForm({
      requirementId: purchase.requirementId,
      requirementDate: purchase.requirementDate,
      requestedBy: purchase.requestedBy,
      materialName: purchase.materialName,
      requiredQuantity: purchase.requiredQuantity.toFixed(2),
      unit: purchase.unit,
      purchaseDate: purchase.purchaseDate,
      poNumber: purchase.poNumber,
      supplier: purchase.supplier,
      purchasedQuantity: purchase.purchasedQuantity,
      pricePerUnit: purchase.pricePerUnit,
      expectedDeliveryDate: purchase.expectedDeliveryDate,
      remarks: purchase.remarks,
    });
    setMessage('');
    setDialogOpen(true);
  };

  const updateForm = (field: keyof PurchaseForm, value: string) => {
    setForm(previous => ({ ...previous, [field]: value }));
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setMessage('');
  };

  const closeReceiptDialog = () => {
    setReceiptDialogOpen(false);
    setMessage('');
  };

  const closeDispatchDialog = () => {
    setDispatchDialogOpen(false);
    setMessage('');
  };

  const savePurchase = () => {
    const currentRequirement = rows.find(row => row.id === editingRequirementId) || null;
    if (!currentRequirement) {
      setMessage('Requirement not found.');
      return;
    }
    if (!form.supplier.trim()) {
      setMessage('Supplier is required.');
      return;
    }
    if ((Number(form.purchasedQuantity) || 0) <= 0) {
      setMessage('Purchased Quantity must be greater than zero.');
      return;
    }
    if ((Number(form.pricePerUnit) || 0) <= 0) {
      setMessage('Price Per Unit must be greater than zero.');
      return;
    }

    const payload: SamplePurchaseRecord = {
      id: `RND-SP-${String(purchaseRecords.length + 1).padStart(4, '0')}`,
      requirementId: currentRequirement.id,
      requirementDate: currentRequirement.requirementDate,
      requestedBy: currentRequirement.requestedBy,
      materialName: currentRequirement.materialName,
      requiredQuantity: currentRequirement.requiredQuantity,
      unit: currentRequirement.unit,
      purchaseDate: form.purchaseDate,
      poNumber: form.poNumber,
      supplier: form.supplier,
      purchasedQuantity: form.purchasedQuantity,
      pricePerUnit: form.pricePerUnit,
      expectedDeliveryDate: form.expectedDeliveryDate,
      remarks: form.remarks,
      totalAmount: Number(purchaseTotalAmount.toFixed(2)),
      status: 'Purchased',
    };

    setPurchaseRecords(previous => [payload, ...previous.filter(record => record.requirementId !== currentRequirement.id)]);
    updateRndSampleRequirementStatus(currentRequirement.id, 'Purchased');
    setMessage('Purchase record saved.');
    setPurchaseMode('view');
    setForm({
      requirementId: payload.requirementId,
      requirementDate: payload.requirementDate,
      requestedBy: payload.requestedBy,
      materialName: payload.materialName,
      requiredQuantity: payload.requiredQuantity.toFixed(2),
      unit: payload.unit,
      purchaseDate: payload.purchaseDate,
      poNumber: payload.poNumber,
      supplier: payload.supplier,
      purchasedQuantity: payload.purchasedQuantity,
      pricePerUnit: payload.pricePerUnit,
      expectedDeliveryDate: payload.expectedDeliveryDate,
      remarks: payload.remarks,
    });
  };

  const saveReceipt = () => {
    const currentPurchase = purchaseRecords.find(record => record.requirementId === editingRequirementId) || null;
    if (!currentPurchase) {
      setMessage('Purchase record not found.');
      return;
    }
    if (!receiptForm.receivedDate) {
      setMessage('Received Date is required.');
      return;
    }

    const receivedQuantity = Number(receiptForm.receivedQuantity || 0);
    const purchasedQuantity = Number(currentPurchase.purchasedQuantity || 0);

    if (receivedQuantity <= 0) {
      setMessage('Received Quantity must be greater than 0.');
      return;
    }
    if (receivedQuantity > purchasedQuantity) {
      setMessage('Received Quantity cannot exceed Purchased Quantity.');
      return;
    }

    const receiptPayload = {
      receivedQuantity: receiptForm.receivedQuantity,
      receivedDate: receiptForm.receivedDate,
      invoiceNumber: receiptForm.invoiceNumber,
      remarks: receiptForm.receiptRemarks,
    };

    setPurchaseRecords(previous => previous.map(record => (
      record.requirementId === currentPurchase.requirementId
        ? { ...record, status: 'Received', receipt: receiptPayload }
        : record
    )));
    updateRndSampleRequirementStatus(currentPurchase.requirementId, 'Received');
    setReceiptMode('view');
    setReceiptForm(previous => ({
      ...previous,
      receivedQuantity: receiptForm.receivedQuantity,
      receivedDate: receiptForm.receivedDate,
      invoiceNumber: receiptForm.invoiceNumber,
      receiptRemarks: receiptForm.receiptRemarks,
    }));
    setMessage('Receipt saved.');
  };

  const confirmDispatch = () => {
    const currentPurchase = purchaseRecords.find(record => record.requirementId === editingRequirementId) || null;
    if (!currentPurchase) {
      setMessage('Purchase record not found.');
      return;
    }
    if (currentPurchase.status !== 'Received') {
      setMessage('Only received purchases can be sent to R&D.');
      return;
    }

    const dispatchPayload = {
      dispatchDate: dispatchForm.dispatchDate,
      dispatchedBy: dispatchForm.dispatchedBy,
      remarks: dispatchForm.remarks,
    };

    setPurchaseRecords(previous => previous.map(record => (
      record.requirementId === currentPurchase.requirementId
        ? { ...record, status: 'Sent to R&D', dispatch: dispatchPayload }
        : record
    )));
    updateRndSampleRequirementStatus(currentPurchase.requirementId, 'Sent to R&D');
    recordSampleDispatch({
      dispatchDate: dispatchForm.dispatchDate,
      poNumber: dispatchForm.poNumber,
      requirementId: dispatchForm.requirementId,
      materialName: dispatchForm.materialName,
      quantity: Number(dispatchForm.receivedQuantity || 0),
      unit: currentPurchase.unit,
      dispatchedBy: dispatchForm.dispatchedBy,
      dispatchRemarks: dispatchForm.remarks,
    });
    setDispatchMode('view');
    setDispatchForm(previous => ({ ...previous, ...dispatchPayload }));
    setMessage('Material sent to R&D.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">R&D Sample Requirement</h2>
        <div className="text-sm text-muted-foreground">Raw material sample requirements for R&D only.</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PackageOpen className="h-5 w-5 text-primary" />
            Sample Requirement List
          </CardTitle>
          <CardDescription>Only R&D sample raw materials are shown here. Production RM and PM requirements are excluded.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Requirement ID</TableHead>
                <TableHead>Requirement Date</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Material Name</TableHead>
                <TableHead className="text-right">Required Quantity</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.id}</TableCell>
                  <TableCell>{row.requirementDate}</TableCell>
                  <TableCell>{row.requestedBy}</TableCell>
                  <TableCell>{row.materialName}</TableCell>
                  <TableCell className="text-right">{row.requiredQuantity.toFixed(2)}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {row.status === 'Pending' ? (
                      <Button variant="outline" size="sm" onClick={() => openCreatePurchase(row)} disabled={!canEdit}>
                        Create Purchase
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => openViewPurchase(row)} disabled={!purchaseRecords.some(record => record.requirementId === row.id)}>
                        View Purchase
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {displayRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-muted-foreground">
                    No R&D sample requirement available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={open => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{purchaseMode === 'create' ? 'Create R&D Sample Purchase' : 'View R&D Sample Purchase'}</DialogTitle>
            <DialogDescription>Purchase details are isolated to the R&D Sample Requirement module.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label>Requirement ID</Label>
              <Input readOnly value={form.requirementId} />
            </div>
            <div className="space-y-2">
              <Label>Material Name</Label>
              <Input readOnly value={form.materialName} />
            </div>
            <div className="space-y-2">
              <Label>Required Quantity</Label>
              <Input readOnly value={form.requiredQuantity} />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input readOnly value={form.unit} />
            </div>
            <div className="space-y-2">
              <Label>Purchase Date</Label>
              <Input readOnly value={form.purchaseDate} />
            </div>
            <div className="space-y-2">
              <Label>PO Number</Label>
              <Input readOnly value={form.poNumber} />
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input value={form.supplier} onChange={event => updateForm('supplier', event.target.value)} disabled={purchaseMode === 'view'} />
            </div>
            <div className="space-y-2">
              <Label>Purchased Quantity</Label>
              <Input
                type="number"
                step="any"
                inputMode="decimal"
                value={form.purchasedQuantity}
                onChange={event => updateForm('purchasedQuantity', event.target.value)}
                onWheel={preventNumberWheel}
                disabled={purchaseMode === 'view'}
                className={manualNumberInputClassName}
              />
            </div>
            <div className="space-y-2">
              <Label>Price Per Unit</Label>
              <Input
                type="number"
                step="any"
                inputMode="decimal"
                value={form.pricePerUnit}
                onChange={event => updateForm('pricePerUnit', event.target.value)}
                onWheel={preventNumberWheel}
                disabled={purchaseMode === 'view'}
                className={manualNumberInputClassName}
              />
            </div>
            <div className="space-y-2">
              <Label>Expected Delivery Date</Label>
              <Input type="date" value={form.expectedDeliveryDate} onChange={event => updateForm('expectedDeliveryDate', event.target.value)} disabled={purchaseMode === 'view'} />
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input readOnly value={formatMoney(purchaseTotalAmount)} />
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-3">
              <Label>Remarks</Label>
              <Input value={form.remarks} onChange={event => updateForm('remarks', event.target.value)} disabled={purchaseMode === 'view'} />
            </div>
          </div>
          {message && <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{message}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Close</Button>
            {purchaseMode === 'create' && <Button onClick={savePurchase}>Save Purchase</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={receiptDialogOpen} onOpenChange={open => (open ? setReceiptDialogOpen(true) : closeReceiptDialog())}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{receiptMode === 'receive' ? 'Receive Material' : 'View Receipt'}</DialogTitle>
            <DialogDescription>Vendor receipt details are tracked locally for the R&D sample purchase workflow.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label>Requirement ID</Label>
                <Input readOnly value={receiptForm.requirementId} />
              </div>
              <div className="space-y-2">
                <Label>Material Name</Label>
                <Input readOnly value={receiptForm.materialName} />
              </div>
              <div className="space-y-2">
                <Label>Required Quantity</Label>
                <Input readOnly value={receiptForm.requiredQuantity} />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input readOnly value={receiptForm.unit} />
              </div>
              <div className="space-y-2">
                <Label>Purchase Date</Label>
                <Input readOnly value={receiptForm.purchaseDate} />
              </div>
              <div className="space-y-2">
                <Label>PO Number</Label>
                <Input readOnly value={receiptForm.poNumber} />
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input readOnly value={receiptForm.supplier} />
              </div>
              <div className="space-y-2">
                <Label>Purchased Quantity</Label>
                <Input readOnly value={receiptForm.purchasedQuantity} />
              </div>
              <div className="space-y-2">
                <Label>Price Per Unit</Label>
                <Input readOnly value={receiptForm.pricePerUnit} />
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery Date</Label>
                <Input readOnly value={receiptForm.expectedDeliveryDate || '-'} />
              </div>
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input readOnly value={formatMoney(receiptTotalAmount)} />
              </div>
              <div className="space-y-2 md:col-span-2 xl:col-span-3">
                <Label>Purchase Remarks</Label>
                <Input readOnly value={receiptForm.purchaseRemarks || '-'} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 border-t pt-4">
              <div className="space-y-2">
                <Label>Received Quantity</Label>
                <Input
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={receiptForm.receivedQuantity}
                  onChange={event => setReceiptForm(previous => ({ ...previous, receivedQuantity: event.target.value }))}
                  onWheel={preventNumberWheel}
                  disabled={receiptMode === 'view'}
                  className={manualNumberInputClassName}
                />
              </div>
              <div className="space-y-2">
                <Label>Received Date</Label>
                <Input
                  type="date"
                  value={receiptForm.receivedDate}
                  onChange={event => setReceiptForm(previous => ({ ...previous, receivedDate: event.target.value }))}
                  disabled={receiptMode === 'view'}
                />
              </div>
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={receiptForm.invoiceNumber}
                  onChange={event => setReceiptForm(previous => ({ ...previous, invoiceNumber: event.target.value }))}
                  disabled={receiptMode === 'view'}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input readOnly value={formatMoney(receiptTotalAmount)} />
              </div>
              <div className="space-y-2 md:col-span-2 xl:col-span-4">
                <Label>Remarks</Label>
                <Input
                  value={receiptForm.receiptRemarks}
                  onChange={event => setReceiptForm(previous => ({ ...previous, receiptRemarks: event.target.value }))}
                  disabled={receiptMode === 'view'}
                />
              </div>
            </div>
          </div>
          {message && <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{message}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={closeReceiptDialog}>Close</Button>
            {receiptMode === 'receive' && <Button onClick={saveReceipt}>Save Receipt</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dispatchDialogOpen} onOpenChange={open => (open ? setDispatchDialogOpen(true) : closeDispatchDialog())}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dispatchMode === 'send' ? 'Send to R&D' : 'View Dispatch'}</DialogTitle>
            <DialogDescription>
              {dispatchMode === 'send'
                ? 'Confirm dispatch of this received sample material to R&D.'
                : 'Dispatch details saved for this R&D sample material.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>PO Number</Label>
              <Input readOnly value={dispatchForm.poNumber} />
            </div>
            <div className="space-y-2">
              <Label>Requirement ID</Label>
              <Input readOnly value={dispatchForm.requirementId} />
            </div>
            <div className="space-y-2">
              <Label>Material Name</Label>
              <Input readOnly value={dispatchForm.materialName} />
            </div>
            <div className="space-y-2">
              <Label>Received Quantity</Label>
              <Input readOnly value={dispatchForm.receivedQuantity} />
            </div>
            <div className="space-y-2">
              <Label>Dispatch Date</Label>
              <Input readOnly value={dispatchForm.dispatchDate} />
            </div>
            <div className="space-y-2">
              <Label>Dispatched By</Label>
              <Input readOnly value={dispatchForm.dispatchedBy} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Remarks</Label>
              <Input
                value={dispatchForm.remarks}
                onChange={event => setDispatchForm(previous => ({ ...previous, remarks: event.target.value }))}
                disabled={dispatchMode === 'view'}
                placeholder="Optional remarks"
              />
            </div>
          </div>
          {message && <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{message}</div>}
          <DialogFooter>
            <Button variant="outline" onClick={closeDispatchDialog}>Close</Button>
            {dispatchMode === 'send' && <Button onClick={confirmDispatch}>Confirm Send to R&D</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>R&D Sample Purchase History</CardTitle>
          <CardDescription>Local purchase records for R&D sample requirements only.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase ID</TableHead>
                <TableHead>Requirement ID</TableHead>
                <TableHead>Material Name</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Purchased Quantity</TableHead>
                <TableHead className="text-right">Price Per Unit</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseRecords.map(record => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.id}</TableCell>
                  <TableCell>{record.requirementId}</TableCell>
                  <TableCell>{record.materialName}</TableCell>
                  <TableCell>{record.supplier}</TableCell>
                  <TableCell className="text-right">{record.purchasedQuantity}</TableCell>
                  <TableCell className="text-right">{record.pricePerUnit}</TableCell>
                  <TableCell className="text-right">{record.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={purchaseStatusVariant[record.status]}>{record.status}</Badge>
                  </TableCell>
                  <TableCell>{record.poNumber}</TableCell>
                  <TableCell>{record.purchaseDate}</TableCell>
                  <TableCell>
                    {record.status === 'Purchased' ? (
                      <Button variant="outline" size="sm" onClick={() => openReceiveMaterial(record)} disabled={!canEdit}>
                        Receive Material
                      </Button>
                    ) : record.status === 'Received' ? (
                      <Button variant="outline" size="sm" onClick={() => openSendToRnd(record)} disabled={!canEdit || !record.receipt}>
                        Send to R&D
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => openViewDispatch(record)} disabled={!record.dispatch || !record.receipt}>
                        View Dispatch
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {purchaseRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} className="py-6 text-center text-muted-foreground">
                    No R&D sample purchase history yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Material Scope</CardTitle>
          <CardDescription>Current module stays isolated to R&D sample requirements and purchase tracking.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>Future statuses: {statusOrder.join(' · ')}</div>
          <div>Selected requirement: {selectedRequirement?.id || '-'}</div>
          <div>Selected purchase: {selectedPurchase?.id || '-'}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default RndSampleRequirement;
