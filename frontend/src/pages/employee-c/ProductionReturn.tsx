import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, CornerDownLeft, Warehouse } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useErpData, type ProductionIssueRecord, type ProductionReturnStatus } from '@/context/ErpContext';

type IssueRow = Omit<ProductionIssueRecord, 'status'> & {
  returnedQuantity: number;
  actualConsumption: number;
  returnableQuantity: number;
  status: ProductionReturnStatus;
  currentInventory: number;
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  return value.includes('T') ? value.split('T')[0] : value;
};

const statusToneMap: Record<ProductionReturnStatus, 'default' | 'secondary' | 'outline'> = {
  Open: 'outline',
  'Partially Returned': 'secondary',
  Returned: 'default',
};

export function ProductionReturn() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { materials, productionIssueRecords, productionReturnRecords, saveProductionReturn } = useErpData();
  const params = useParams<{ issueId?: string }>();

  const [returnedQuantity, setReturnedQuantity] = useState('');
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [returnedBy, setReturnedBy] = useState(currentUser.name);
  const [returnReason, setReturnReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [message, setMessage] = useState('');

  const issueRows = useMemo<IssueRow[]>(() => (
    productionIssueRecords.map(issue => {
      const returns = productionReturnRecords.filter(record => record.issueId === issue.id);
      const returnedQuantityTotal = returns.reduce((sum, record) => sum + record.returnedQuantity, 0);
      const returnableQuantity = Math.max(0, issue.issuedQuantity - returnedQuantityTotal);
      const status: ProductionReturnStatus = returnedQuantityTotal <= 0
        ? 'Open'
        : returnedQuantityTotal < issue.issuedQuantity
          ? 'Partially Returned'
          : 'Returned';
      const currentInventory = materials.find(material => material.id === issue.materialId)?.stock ?? 0;

      return {
        ...issue,
        returnedQuantity: returnedQuantityTotal,
        actualConsumption: issue.issuedQuantity - returnedQuantityTotal,
        returnableQuantity,
        status,
        currentInventory,
      };
    })
  ), [materials, productionIssueRecords, productionReturnRecords]);

  const selectedIssue = useMemo(() => issueRows.find(issue => issue.id === params.issueId), [issueRows, params.issueId]);
  const selectedReturns = useMemo(() => (
    selectedIssue ? productionReturnRecords.filter(record => record.issueId === selectedIssue.id) : []
  ), [productionReturnRecords, selectedIssue]);

  useEffect(() => {
    if (!selectedIssue) return;

    setReturnedQuantity(selectedIssue.returnableQuantity > 0 ? String(selectedIssue.returnableQuantity) : '');
    setReturnDate(new Date().toISOString().slice(0, 10));
    setReturnedBy(currentUser.name);
    setReturnReason('');
    setRemarks('');
    setMessage('');
  }, [currentUser.name, selectedIssue]);

  const handleOpenIssue = (issueId: string) => {
    navigate(`/employee-c/production-return/${issueId}`);
  };

  const handleSave = () => {
    if (!selectedIssue) return;

    const quantity = Number(returnedQuantity) || 0;
    if (quantity < 0) {
      setMessage('Returned Quantity cannot be negative.');
      return;
    }
    if (quantity <= 0) {
      setMessage('Returned Quantity must be greater than zero.');
      return;
    }
    if (quantity > selectedIssue.returnableQuantity) {
      setMessage('Returned Quantity cannot be greater than the remaining issued quantity.');
      return;
    }
    if (!returnedBy.trim()) {
      setMessage('Returned By is required.');
      return;
    }
    if (!returnReason.trim()) {
      setMessage('Return Reason is required.');
      return;
    }

    saveProductionReturn({
      issueId: selectedIssue.id,
      materialType: selectedIssue.materialType,
      materialId: selectedIssue.materialId,
      materialName: selectedIssue.materialName,
      batchNumber: selectedIssue.batchNumber,
      issuedQuantity: selectedIssue.issuedQuantity,
      returnedQuantity: quantity,
      returnDate,
      returnedBy: returnedBy.trim(),
      returnReason: returnReason.trim(),
      remarks: remarks.trim(),
      unit: selectedIssue.unit,
    });

    navigate('/employee-c/production-return');
  };

  if (selectedIssue) {
    const material = materials.find(item => item.id === selectedIssue.materialId);
    const currentInventory = material?.stock ?? 0;
    const projectedInventory = currentInventory + (Number(returnedQuantity) || 0);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary">Production Return</h2>
            <p className="text-sm text-muted-foreground">Return unused materials from production back to inventory.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/employee-c/production-return')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to history
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Production Information</CardTitle>
              <CardDescription>Read-only issue details from the production issue transaction.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Material Type</Label>
                <Input readOnly value={selectedIssue.materialType} className="bg-muted/60" />
              </div>
              <div className="space-y-2">
                <Label>Material Name</Label>
                <Input readOnly value={selectedIssue.materialName} className="bg-muted/60" />
              </div>
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input readOnly value={selectedIssue.batchNumber} className="bg-muted/60" />
              </div>
              <div className="space-y-2">
                <Label>Issued Quantity</Label>
                <Input readOnly value={selectedIssue.issuedQuantity} className="bg-muted/60" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Issue Date</Label>
                <Input readOnly value={formatDate(selectedIssue.issueDate)} className="bg-muted/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Update</CardTitle>
              <CardDescription>Current inventory increases when the return is saved.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Issue Status</span>
                  <Badge variant={statusToneMap[selectedIssue.status]}>{selectedIssue.status}</Badge>
                </div>
                <div className="mt-3 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4"><span>Current Inventory</span><span className="font-medium">{currentInventory} {selectedIssue.unit}</span></div>
                  <div className="flex justify-between gap-4"><span>Returned Quantity</span><span className="font-medium">{Number(returnedQuantity) || 0} {selectedIssue.unit}</span></div>
                  <div className="flex justify-between gap-4"><span>Projected Inventory</span><span className="font-semibold text-primary">{projectedInventory} {selectedIssue.unit}</span></div>
                  <div className="flex justify-between gap-4"><span>Actual Consumption</span><span className="font-semibold text-primary">{selectedIssue.issuedQuantity - (Number(returnedQuantity) || 0)} {selectedIssue.unit}</span></div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <Warehouse className="mt-0.5 h-4 w-4 text-primary" />
                <span>Saving the return increases inventory and records the production return transaction in the system.</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Return Information</CardTitle>
            <CardDescription>Enter the unused quantity sent back from production.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Returned Quantity</Label>
                <Input type="number" min="0" max={selectedIssue.returnableQuantity} value={returnedQuantity} onChange={event => setReturnedQuantity(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Return Date</Label>
                <Input type="date" value={returnDate} onChange={event => setReturnDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Returned By</Label>
                <Input value={returnedBy} onChange={event => setReturnedBy(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Return Reason</Label>
                <Input value={returnReason} onChange={event => setReturnReason(event.target.value)} placeholder="Unused after production" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Remarks</Label>
                <textarea
                  value={remarks}
                  onChange={event => setRemarks(event.target.value)}
                  rows={4}
                  className={cn('flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', 'bg-background')}
                  placeholder="Optional return notes"
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" /> Return Date: <span className="font-medium text-foreground">{formatDate(returnDate)}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><CornerDownLeft className="h-4 w-4" /> Returned By: <span className="font-medium text-foreground">{returnedBy || '-'}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><Warehouse className="h-4 w-4" /> Actual Consumption: <span className="font-medium text-foreground">{selectedIssue.issuedQuantity - (Number(returnedQuantity) || 0)} {selectedIssue.unit}</span></div>
              </div>
            </div>

            {message && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{message}</div>}

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/employee-c/production-return')}>Cancel</Button>
              <Button onClick={handleSave} disabled={selectedIssue.returnableQuantity <= 0}>Save</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Return History</CardTitle>
            <CardDescription>History of all returns recorded for this production batch.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material Name</TableHead>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Issued Quantity</TableHead>
                    <TableHead>Returned Quantity</TableHead>
                    <TableHead>Actual Consumption</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Returned By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedReturns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No production return history found for this batch.</TableCell>
                    </TableRow>
                  )}
                  {selectedReturns.map(record => (
                    <TableRow key={record.id}>
                      <TableCell>{record.materialName}</TableCell>
                      <TableCell>{record.batchNumber}</TableCell>
                      <TableCell>{record.issuedQuantity} {record.unit}</TableCell>
                      <TableCell>{record.returnedQuantity} {record.unit}</TableCell>
                      <TableCell>{record.actualConsumption} {record.unit}</TableCell>
                      <TableCell>{formatDate(record.returnDate)}</TableCell>
                      <TableCell>{record.returnedBy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Production Issue History</h2>
          <p className="text-sm text-muted-foreground">Select a production batch and return unused materials to inventory.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production Issues</CardTitle>
          <CardDescription>All production issue records available for return processing.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Type</TableHead>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Issued Quantity</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issueRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No production issue records available.</TableCell>
                  </TableRow>
                )}
                {issueRows.map(issue => (
                  <TableRow key={issue.id}>
                    <TableCell>{issue.materialType}</TableCell>
                    <TableCell className="font-medium">{issue.materialName}</TableCell>
                    <TableCell>{issue.batchNumber}</TableCell>
                    <TableCell>{issue.issuedQuantity} {issue.unit}</TableCell>
                    <TableCell>{formatDate(issue.issueDate)}</TableCell>
                    <TableCell>
                      <Badge variant={statusToneMap[issue.status]}>{issue.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant={issue.returnableQuantity > 0 ? 'default' : 'outline'} onClick={() => handleOpenIssue(issue.id)} disabled={issue.returnableQuantity <= 0}>
                        Return
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default ProductionReturn;