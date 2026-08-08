import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import {
  getPendingSampleReceiptRecords,
  getReceivedSampleReceiptRecords,
  getSampleInventoryRecords,
  receiveSampleFromDispatch,
  type SampleDispatchRecord,
  type SampleInventoryRecord,
} from './sampleInventoryStore';
import { PackageOpen } from 'lucide-react';

type ReceiptMode = 'receive' | 'view';

type ReceiptForm = {
  dispatchId: string;
  poNumber: string;
  requirementId: string;
  materialName: string;
  quantity: string;
  unit: string;
  dispatchDate: string;
  dispatchedBy: string;
  receiveDate: string;
  receivedBy: string;
  remarks: string;
};

const todayString = () => new Date().toISOString().slice(0, 10);

const formatQuantity = (value: number) => value.toFixed(2);

const createReceiptForm = (): ReceiptForm => ({
  dispatchId: '',
  poNumber: '',
  requirementId: '',
  materialName: '',
  quantity: '',
  unit: '',
  dispatchDate: '',
  dispatchedBy: '',
  receiveDate: todayString(),
  receivedBy: '',
  remarks: '',
});

export function PendingSampleReceipts() {
  const { currentUser } = useAuth();
  const [pendingReceipts, setPendingReceipts] = useState<SampleDispatchRecord[]>(() => getPendingSampleReceiptRecords());
  const [receivedReceipts, setReceivedReceipts] = useState<SampleDispatchRecord[]>(() => getReceivedSampleReceiptRecords());
  const [inventory, setInventory] = useState<SampleInventoryRecord[]>(() => getSampleInventoryRecords());
  const [receiptMode, setReceiptMode] = useState<ReceiptMode>('receive');
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [activeDispatchId, setActiveDispatchId] = useState('');
  const [form, setForm] = useState<ReceiptForm>(createReceiptForm);
  const [message, setMessage] = useState('');

  const canMutate = currentUser.role === 'Employee A';
  const canView = currentUser.role === 'Boss' || canMutate;
  const pendingList = canView ? pendingReceipts : [];
  const receivedList = canView ? receivedReceipts : [];
  const inventoryList = canView ? inventory : [];

  const selectedPendingDispatch = useMemo(
    () => pendingReceipts.find(record => record.dispatchId === activeDispatchId) || null,
    [activeDispatchId, pendingReceipts],
  );
  const selectedReceivedDispatch = useMemo(
    () => receivedReceipts.find(record => record.dispatchId === activeDispatchId) || null,
    [activeDispatchId, receivedReceipts],
  );

  const refreshData = () => {
    setPendingReceipts(getPendingSampleReceiptRecords());
    setReceivedReceipts(getReceivedSampleReceiptRecords());
    setInventory(getSampleInventoryRecords());
  };

  const resetForm = () => {
    setForm(createReceiptForm());
  };

  const openReceive = (record: SampleDispatchRecord) => {
    setReceiptMode('receive');
    setActiveDispatchId(record.dispatchId);
    setForm({
      dispatchId: record.dispatchId,
      poNumber: record.poNumber,
      requirementId: record.requirementId,
      materialName: record.materialName,
      quantity: formatQuantity(record.quantity),
      unit: record.unit,
      dispatchDate: record.dispatchDate,
      dispatchedBy: record.dispatchedBy,
      receiveDate: todayString(),
      receivedBy: currentUser.name,
      remarks: '',
    });
    setMessage('');
    setReceiptDialogOpen(true);
  };

  const openViewReceipt = (record: SampleDispatchRecord) => {
    if (!record.receipt) return;

    setReceiptMode('view');
    setActiveDispatchId(record.dispatchId);
    setForm({
      dispatchId: record.dispatchId,
      poNumber: record.poNumber,
      requirementId: record.requirementId,
      materialName: record.materialName,
      quantity: formatQuantity(record.quantity),
      unit: record.unit,
      dispatchDate: record.dispatchDate,
      dispatchedBy: record.dispatchedBy,
      receiveDate: record.receipt.receiveDate,
      receivedBy: record.receipt.receivedBy,
      remarks: record.receipt.remarks,
    });
    setMessage('');
    setReceiptDialogOpen(true);
  };

  const closeReceiptDialog = () => {
    setReceiptDialogOpen(false);
    setMessage('');
    resetForm();
  };

  const confirmReceipt = () => {
    if (!form.receiveDate) {
      setMessage('Receive Date is required.');
      return;
    }

    const quantity = Number(form.quantity || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage('Received Quantity must be greater than 0.');
      return;
    }

    const updatedRecord = receiveSampleFromDispatch(form.dispatchId, {
      receiveDate: form.receiveDate,
      receivedBy: form.receivedBy,
      remarks: form.remarks,
    });

    if (!updatedRecord) {
      setMessage('Dispatch record not found.');
      return;
    }

    refreshData();
    setReceiptMode('view');
    setMessage('Sample received by R&D.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <PackageOpen className="h-3.5 w-3.5" />
          Gokulbhai
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Pending Sample Receipts</h2>
          <p className="text-sm text-muted-foreground">Receive sample materials dispatched by Parthbhai and update the local sample inventory.</p>
        </div>
      </div>

      {!canMutate && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Boss access is view only. Sample receipt actions are disabled.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pending Sample Receipts</CardTitle>
          <CardDescription>Only dispatches with status Sent to R&D are shown here.</CardDescription>
        </CardHeader>
        <CardContent>
          {message && <div className="mb-4 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{message}</div>}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispatch ID</TableHead>
                  <TableHead>Dispatch Date</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Requirement ID</TableHead>
                  <TableHead>Material Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Dispatched By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingList.map(record => (
                  <TableRow key={record.dispatchId}>
                    <TableCell className="font-medium">{record.dispatchId}</TableCell>
                    <TableCell>{record.dispatchDate}</TableCell>
                    <TableCell>{record.poNumber}</TableCell>
                    <TableCell>{record.requirementId}</TableCell>
                    <TableCell>{record.materialName}</TableCell>
                    <TableCell className="text-right">{formatQuantity(record.quantity)}</TableCell>
                    <TableCell>{record.unit}</TableCell>
                    <TableCell>{record.dispatchedBy}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openReceive(record)} disabled={!canMutate}>
                        Receive Sample
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {pendingList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-6 text-center text-muted-foreground">
                      No pending sample receipts.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={receiptDialogOpen} onOpenChange={open => (open ? setReceiptDialogOpen(true) : closeReceiptDialog())}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{receiptMode === 'receive' ? 'Receive Sample' : 'View Receipt'}</DialogTitle>
            <DialogDescription>
              {receiptMode === 'receive'
                ? 'Confirm the sample receipt and update the local inventory.'
                : 'Read-only receipt details for this sample dispatch.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label>Material Name</Label>
              <Input readOnly value={form.materialName} />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input readOnly value={form.quantity} />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input readOnly value={form.unit} />
            </div>
            <div className="space-y-2">
              <Label>Dispatch Date</Label>
              <Input readOnly value={form.dispatchDate} />
            </div>
            <div className="space-y-2">
              <Label>PO Number</Label>
              <Input readOnly value={form.poNumber} />
            </div>
            <div className="space-y-2">
              <Label>Requirement ID</Label>
              <Input readOnly value={form.requirementId} />
            </div>
            <div className="space-y-2">
              <Label>Dispatched By</Label>
              <Input readOnly value={form.dispatchedBy} />
            </div>
            <div className="space-y-2">
              <Label>Receive Date</Label>
              <Input readOnly value={form.receiveDate} />
            </div>
            <div className="space-y-2">
              <Label>Received By</Label>
              <Input readOnly value={form.receivedBy} />
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-3">
              <Label>Remarks</Label>
              <Input
                value={form.remarks}
                onChange={event => setForm(previous => ({ ...previous, remarks: event.target.value }))}
                disabled={receiptMode === 'view'}
                placeholder="Optional remarks"
              />
            </div>
          </div>

          {message && <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{message}</div>}

          <DialogFooter>
            <Button variant="outline" onClick={closeReceiptDialog}>Close</Button>
            {receiptMode === 'receive' && <Button onClick={confirmReceipt}>Confirm Receive</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Received Sample Receipts</CardTitle>
          <CardDescription>Receipts already accepted by Gokulbhai.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispatch ID</TableHead>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Dispatch Date</TableHead>
                  <TableHead>Receive Date</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivedList.map(record => (
                  <TableRow key={record.dispatchId}>
                    <TableCell className="font-medium">{record.dispatchId}</TableCell>
                    <TableCell>{record.materialName}</TableCell>
                    <TableCell>{formatQuantity(record.quantity)}</TableCell>
                    <TableCell>{record.unit}</TableCell>
                    <TableCell>{record.dispatchDate}</TableCell>
                    <TableCell>{record.receipt?.receiveDate || '-'}</TableCell>
                    <TableCell>{record.receipt?.receivedBy || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="default">{record.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openViewReceipt(record)}>
                        View Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {receivedList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-6 text-center text-muted-foreground">
                      No received sample receipts yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sample Inventory Register</CardTitle>
          <CardDescription>Inventory is updated when a dispatch is received.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Name</TableHead>
                  <TableHead className="text-right">Available Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Receive Date</TableHead>
                  <TableHead>Source PO</TableHead>
                  <TableHead>Requirement ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryList.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.materialName}</TableCell>
                    <TableCell className="text-right">{formatQuantity(item.availableQuantity)}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.receiveDate}</TableCell>
                    <TableCell>{item.sourcePO}</TableCell>
                    <TableCell>{item.requirementId}</TableCell>
                  </TableRow>
                ))}
                {inventoryList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                      No sample inventory records yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scope</CardTitle>
          <CardDescription>Gokulbhai receives dispatched samples and updates the isolated sample inventory only.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>Pending dispatches: {pendingList.length}</div>
          <div>Received receipts: {receivedList.length}</div>
          <div>Inventory items: {inventoryList.length}</div>
          <div>Selected dispatch: {selectedPendingDispatch?.dispatchId || selectedReceivedDispatch?.dispatchId || '-'}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default PendingSampleReceipts;
