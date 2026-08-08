import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { useErpData } from '@/context/ErpContext';
import { ArrowDownToLine, History, Microscope, SlidersHorizontal } from 'lucide-react';
import {
  adjustSampleQuantity,
  getSampleInventoryRecords,
  issueSample,
  seedSampleInventoryRecords,
  type SampleInventoryRecord,
} from './rndStore';
import { createRndSampleRequirement } from '../employee-b/rndRequirementStore';

type AdjustmentMode = 'Increase' | 'Decrease';

const today = () => new Date().toISOString().slice(0, 10);

const formatQuantity = (value: number) => `${value > 0 ? '+' : ''}${value}`;

export function SampleInventory() {
  const { currentUser } = useAuth();
  const { materials } = useErpData();
  const _rawMaterials = useMemo(() => materials.filter(material => material.type === 'Raw Material'), [materials]);
  void _rawMaterials;
  const [inventory, setInventory] = useState<SampleInventoryRecord[]>(() => seedSampleInventoryRecords(materials));
  const [issueOpen, setIssueOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<SampleInventoryRecord | null>(null);
  const [issueDate, setIssueDate] = useState(today());
  const [issueQuantity, setIssueQuantity] = useState('');
  const [issueRemarks, setIssueRemarks] = useState('');
  const [adjustDate, setAdjustDate] = useState(today());
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustMode, setAdjustMode] = useState<AdjustmentMode>('Increase');
  const [adjustRemarks, setAdjustRemarks] = useState('');
  const [message, setMessage] = useState('');
  const [reqDialogOpen, setReqDialogOpen] = useState(false);
  const [reqMaterialName, setReqMaterialName] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqPurpose, setReqPurpose] = useState<'Trial' | 'Base Formula' | 'Testing'>('Trial');
  const [reqPriority, setReqPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [reqRequiredDate, setReqRequiredDate] = useState(today());
  const [reqRemarks, setReqRemarks] = useState('');
  const [reqUnit, setReqUnit] = useState('');

  const canMutate = currentUser.role === 'Employee A';

  const historyRecord = activeRecord;

  const refreshInventory = () => setInventory(getSampleInventoryRecords());


  const openRequestDialog = () => {
    setReqMaterialName('');
    setReqUnit('');
    setReqQuantity('');
    setReqPurpose('Trial');
    setReqPriority('Medium');
    setReqRequiredDate(today());
    setReqRemarks('');
    setReqDialogOpen(true);
  };

  const openIssue = (record: SampleInventoryRecord) => {
    setMessage('');
    setActiveRecord(record);
    setIssueQuantity('');
    setIssueDate(today());
    setIssueRemarks('');
    setIssueOpen(true);
  };

  const openAdjust = (record: SampleInventoryRecord) => {
    setMessage('');
    setActiveRecord(record);
    setAdjustQuantity('');
    setAdjustMode('Increase');
    setAdjustDate(today());
    setAdjustRemarks('');
    setAdjustOpen(true);
  };

  const openHistory = (record: SampleInventoryRecord) => {
    setActiveRecord(record);
    setHistoryOpen(true);
  };
  const saveRequest = () => {
    const materialName = reqMaterialName.trim();
    if (!materialName) {
      setMessage('Enter a material name.');
      return;
    }
    const qty = Number(reqQuantity || 0);
    if (!Number.isFinite(qty) || qty <= 0) {
      setMessage('Enter a valid required quantity.');
      return;
    }

    createRndSampleRequirement({
      requestedBy: currentUser.name,
      materialName,
      quantity: qty,
      unit: reqUnit || '',
      purpose: reqPurpose,
      priority: reqPriority,
      requiredDate: reqRequiredDate,
      remarks: reqRemarks,
    });

    setReqDialogOpen(false);
    setMessage('R&D sample requirement generated.');
  };

  const saveIssue = () => {
    if (!activeRecord) return;
    const quantity = Number(issueQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage('Enter a valid issue quantity.');
      return;
    }
    if (quantity > activeRecord.currentBalance) {
      setMessage('Issue quantity cannot exceed current balance.');
      return;
    }

    issueSample(activeRecord.sampleId, quantity, issueDate, issueRemarks);
    refreshInventory();

    setIssueOpen(false);
    setActiveRecord(null);
    setMessage('Sample issued successfully.');
  };

  const saveAdjust = () => {
    if (!activeRecord) return;
    const quantity = Number(adjustQuantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage('Enter a valid adjustment quantity.');
      return;
    }
    if (adjustMode === 'Decrease' && quantity > activeRecord.currentBalance) {
      setMessage('Decrease quantity cannot exceed current balance.');
      return;
    }

    adjustSampleQuantity(activeRecord.sampleId, quantity, adjustMode, adjustDate, adjustRemarks);
    refreshInventory();

    setAdjustOpen(false);
    setActiveRecord(null);
    setMessage('Quantity adjusted successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <Microscope className="h-3.5 w-3.5" />
          Research & Development
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Sample Inventory</h2>
          <p className="text-sm text-muted-foreground">Raw-material sample control for R&D only. Packaging and finished goods are excluded.</p>
        </div>
      </div>

      {!canMutate && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Boss access is view only. Receive, issue, and adjustment actions are hidden.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Sample Inventory Register</CardTitle>
            <CardDescription>Only raw materials from the ERP master list can be used here.</CardDescription>
          </div>
          {canMutate && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={openRequestDialog} className="w-fit">
                Request Sample
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {message && <div className="mb-4 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{message}</div>}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sample ID</TableHead>
                  <TableHead>Raw Material</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead className="text-right">Received Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Current Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.sampleId}</TableCell>
                    <TableCell>{record.rawMaterialName}</TableCell>
                    <TableCell>{record.manufacturer}</TableCell>
                    <TableCell>{record.batchNumber}</TableCell>
                    <TableCell>{record.receivedDate}</TableCell>
                    <TableCell className="text-right">{record.receivedQuantity}</TableCell>
                    <TableCell>{record.unit}</TableCell>
                    <TableCell className="text-right">{record.currentBalance}</TableCell>
                    <TableCell>
                      <Badge variant={record.status === 'Depleted' ? 'destructive' : record.status === 'Low Stock' ? 'secondary' : 'default'}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {canMutate && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openIssue(record)}>
                              <ArrowDownToLine className="mr-2 h-4 w-4" />
                              Issue
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openAdjust(record)}>
                              <SlidersHorizontal className="mr-2 h-4 w-4" />
                              Adjust
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="outline" onClick={() => openHistory(record)}>
                          <History className="mr-2 h-4 w-4" />
                          View History
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      

      <Dialog open={reqDialogOpen} onOpenChange={setReqDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate R&D Sample Requirement</DialogTitle>
            <DialogDescription>Create a new requirement for R&D samples.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Material (manual)</label>
              <Input value={reqMaterialName} onChange={e => setReqMaterialName(e.target.value)} placeholder="Enter material name" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Required Quantity</label>
                <Input type="number" value={reqQuantity} onChange={e => setReqQuantity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <Input value={reqUnit} onChange={e => setReqUnit(e.target.value)} placeholder="e.g. KG, Nos" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Purpose</label>
                <Select value={reqPurpose} onValueChange={value => setReqPurpose(value as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Trial">Trial</SelectItem>
                    <SelectItem value="Base Formula">Base Formula</SelectItem>
                    <SelectItem value="Testing">Testing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={reqPriority} onValueChange={value => setReqPriority(value as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Required Date</label>
                <Input type="date" value={reqRequiredDate} onChange={e => setReqRequiredDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks</label>
                <Input value={reqRemarks} onChange={e => setReqRemarks(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReqDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveRequest}>Save Requirement</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Sample</DialogTitle>
            <DialogDescription>Reduce sample balance for the selected record.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              Selected sample: <span className="font-medium text-foreground">{activeRecord?.sampleId}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Issue Date</label>
                <Input type="date" value={issueDate} onChange={event => setIssueDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Issue Quantity</label>
                <Input type="number" min="0" value={issueQuantity} onChange={event => setIssueQuantity(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks</label>
              <textarea
                className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={issueRemarks}
                onChange={event => setIssueRemarks(event.target.value)}
                placeholder="Optional issue remarks"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIssueOpen(false)}>Cancel</Button>
              <Button onClick={saveIssue}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Quantity</DialogTitle>
            <DialogDescription>Increase or decrease the sample balance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              Selected sample: <span className="font-medium text-foreground">{activeRecord?.sampleId}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Adjustment Date</label>
                <Input type="date" value={adjustDate} onChange={event => setAdjustDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Adjustment Type</label>
                <Select value={adjustMode} onValueChange={value => setAdjustMode(value as AdjustmentMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Increase">Increase</SelectItem>
                    <SelectItem value="Decrease">Decrease</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <Input type="number" min="0" value={adjustQuantity} onChange={event => setAdjustQuantity(event.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks</label>
              <textarea
                className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={adjustRemarks}
                onChange={event => setAdjustRemarks(event.target.value)}
                placeholder="Optional adjustment remarks"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button>
              <Button onClick={saveAdjust}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>View History</DialogTitle>
            <DialogDescription>Movement history for {historyRecord?.sampleId}</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyRecord?.history.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.action}</TableCell>
                    <TableCell className="text-right">{formatQuantity(entry.quantity)}</TableCell>
                    <TableCell className="text-right">{entry.balance}</TableCell>
                    <TableCell>{entry.remarks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}