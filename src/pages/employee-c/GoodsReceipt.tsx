import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, PackageCheck, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useErpData, type GoodsReceiptLineType, type GoodsReceiptMaterialType, type GoodsReceiptStatus } from '@/context/ErpContext';

type PurchaseRouteMaterialType = 'raw-materials' | 'sachets' | 'boxes' | 'additional-materials';

type GoodsReceiptRow = {
  routeMaterialType: PurchaseRouteMaterialType;
  sourceType: GoodsReceiptMaterialType;
  sourceId: string;
  lineType?: GoodsReceiptLineType;
  routeLineType?: 'flavoured' | 'assorted';
  materialType: GoodsReceiptMaterialType;
  materialName: string;
  inventoryMaterialId?: string;
  purchaseQuantity: number;
  unit: string;
  purchaseDate: string;
  receivedQuantity: number;
  qaSampleQuantity: number;
  availableQuantity: number;
  pendingQuantity: number;
  status: GoodsReceiptStatus;
};

const statusToneMap: Record<GoodsReceiptStatus, 'default' | 'secondary' | 'outline'> = {
  Pending: 'outline',
  'Partially Received': 'secondary',
  Completed: 'default',
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  return value.includes('T') ? value.split('T')[0] : value;
};

const parseRouteMaterialType = (value?: string): PurchaseRouteMaterialType | undefined => {
  if (value === 'raw-materials' || value === 'sachets' || value === 'boxes' || value === 'additional-materials') return value;
  return undefined;
};

const parseRouteLineType = (value?: string): 'flavoured' | 'assorted' | undefined => {
  if (value === 'flavoured' || value === 'assorted') return value;
  return undefined;
};

export function GoodsReceipt() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { rmPurchaseRecords, sachetPurchaseRecords, boxPurchaseRecords, goodsReceiptRecords, saveGoodsReceipt } = useErpData();
  const params = useParams<{ materialType?: string; sourceId?: string; lineType?: string }>();
  const routeMaterialType = parseRouteMaterialType(params.materialType);
  const routeLineType = parseRouteLineType(params.lineType);
  const isFormMode = Boolean(routeMaterialType && params.sourceId);

  const [receivedQuantity, setReceivedQuantity] = useState('');
  const [qaSampleQuantity, setQaSampleQuantity] = useState('0');
  const [receivedDate, setReceivedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [receivedBy, setReceivedBy] = useState(currentUser.name);
  const [remarks, setRemarks] = useState('');
  const [message, setMessage] = useState('');

  const purchaseRows = useMemo<GoodsReceiptRow[]>(() => {
    const rows: GoodsReceiptRow[] = [];

    rmPurchaseRecords.forEach(record => {
      const purchaseQuantity = Number(record.purchasedQuantity) || record.requiredQuantity || 0;
      rows.push({
        routeMaterialType: 'raw-materials',
        sourceType: 'Raw Materials',
        sourceId: record.id,
        materialType: 'Raw Materials',
        materialName: record.materialName,
        inventoryMaterialId: record.materialId,
        purchaseQuantity,
        unit: record.unit,
        purchaseDate: record.purchaseDate || formatDate(record.expectedDeliveryDateTime),
        receivedQuantity: 0,
        qaSampleQuantity: 0,
        availableQuantity: 0,
        pendingQuantity: purchaseQuantity,
        status: 'Pending',
      });
    });

    sachetPurchaseRecords.forEach(record => {
      const purchaseQuantity = Number(record.purchasedQuantity) || record.requiredQuantity || 0;
      const inventoryMaterialId = record.purchaseUnit === 'Roll' ? 'mat-6' : 'mat-7';
      rows.push({
        routeMaterialType: 'sachets',
        sourceType: 'Sachets',
        sourceId: record.id,
        materialType: 'Sachets',
        materialName: `${record.productName}${record.purchaseUnit === 'Roll' ? ' - Sachet Rolls' : ' - Empty Sachets'}`,
        inventoryMaterialId,
        purchaseQuantity,
        unit: record.purchaseUnit,
        purchaseDate: record.purchaseDate || formatDate(record.expectedDeliveryDateTime),
        receivedQuantity: 0,
        qaSampleQuantity: 0,
        availableQuantity: 0,
        pendingQuantity: purchaseQuantity,
        status: 'Pending',
      });
    });

    boxPurchaseRecords.forEach(record => {
      const flavouredQuantity = Number(record.flavouredPurchasedQuantity) || 0;
      const assortedQuantity = Number(record.assortedPurchasedQuantity) || 0;

      if (flavouredQuantity > 0) {
        rows.push({
          routeMaterialType: 'boxes',
          sourceType: 'Boxes',
          sourceId: record.id,
          lineType: 'Flavoured',
          routeLineType: 'flavoured',
          materialType: 'Boxes',
          materialName: `${record.productName} - Flavoured Boxes`,
          inventoryMaterialId: 'mat-8',
          purchaseQuantity: flavouredQuantity,
          unit: 'Nos',
          purchaseDate: record.purchaseDate || formatDate(record.expectedDeliveryDateTime),
          receivedQuantity: 0,
          qaSampleQuantity: 0,
          availableQuantity: 0,
          pendingQuantity: flavouredQuantity,
          status: 'Pending',
        });
      }

      if (assortedQuantity > 0) {
        rows.push({
          routeMaterialType: 'boxes',
          sourceType: 'Boxes',
          sourceId: record.id,
          lineType: 'Assorted',
          routeLineType: 'assorted',
          materialType: 'Boxes',
          materialName: `${record.productName} - Assorted Boxes`,
          inventoryMaterialId: 'mat-8',
          purchaseQuantity: assortedQuantity,
          unit: 'Nos',
          purchaseDate: record.purchaseDate || formatDate(record.expectedDeliveryDateTime),
          receivedQuantity: 0,
          qaSampleQuantity: 0,
          availableQuantity: 0,
          pendingQuantity: assortedQuantity,
          status: 'Pending',
        });
      }
    });

    return rows
      .map(row => {
        const rowReceipts = goodsReceiptRecords
          .filter(record => record.sourceType === row.sourceType && record.sourceId === row.sourceId && (record.lineType || undefined) === (row.lineType || undefined));
        const receivedQuantityTotal = rowReceipts.reduce((sum, record) => sum + record.receivedQuantity, 0);
        const qaSampleQuantityTotal = rowReceipts.reduce((sum, record) => sum + (record.qaSampleQuantity ?? 0), 0);
        const availableQuantityTotal = rowReceipts.reduce((sum, record) => sum + (record.availableQuantity ?? Math.max(0, record.receivedQuantity - (record.qaSampleQuantity ?? 0))), 0);
        const status: GoodsReceiptStatus = receivedQuantityTotal <= 0
          ? 'Pending'
          : receivedQuantityTotal < row.purchaseQuantity
            ? 'Partially Received'
            : 'Completed';

        return {
          ...row,
          receivedQuantity: receivedQuantityTotal,
          qaSampleQuantity: qaSampleQuantityTotal,
          availableQuantity: availableQuantityTotal,
          pendingQuantity: Math.max(0, row.purchaseQuantity - receivedQuantityTotal),
          status,
        };
      })
      .sort((left, right) => {
        if (left.purchaseDate !== right.purchaseDate) return right.purchaseDate.localeCompare(left.purchaseDate);
        if (left.materialType !== right.materialType) return left.materialType.localeCompare(right.materialType);
        return left.materialName.localeCompare(right.materialName);
      });
  }, [boxPurchaseRecords, goodsReceiptRecords, rmPurchaseRecords, sachetPurchaseRecords]);

  const summaryCounts = useMemo(() => ({
    total: purchaseRows.length,
    pending: purchaseRows.filter(row => row.status === 'Pending').length,
    partial: purchaseRows.filter(row => row.status === 'Partially Received').length,
    completed: purchaseRows.filter(row => row.status === 'Completed').length,
  }), [purchaseRows]);

  const currentRow = useMemo(() => purchaseRows.find(row => row.routeMaterialType === routeMaterialType && row.sourceId === params.sourceId && row.routeLineType === routeLineType), [params.sourceId, purchaseRows, routeLineType, routeMaterialType]);

  useEffect(() => {
    if (!currentRow || !isFormMode) return;

    setReceivedQuantity(currentRow.pendingQuantity > 0 ? String(currentRow.pendingQuantity) : '');
    setQaSampleQuantity('0');
    setReceivedDate(new Date().toISOString().slice(0, 10));
    setReceivedBy(currentUser.name);
    setRemarks('');
    setMessage('');
  }, [currentRow, currentUser.name, isFormMode]);

  const handleOpenRow = (row: GoodsReceiptRow) => {
    const linePath = row.routeLineType ? `/${row.routeLineType}` : '';
    navigate(`/employee-c/goods-receipt/${row.routeMaterialType}/${row.sourceId}${linePath}`);
  };

  const handleSave = () => {
    if (!currentRow) return;

    const quantity = Number(receivedQuantity) || 0;
    const sampleQuantity = Number(qaSampleQuantity) || 0;
    const availableQuantity = Math.max(0, quantity - sampleQuantity);
    if (quantity <= 0) {
      setMessage('Received Quantity must be greater than zero.');
      return;
    }
    if (quantity > currentRow.pendingQuantity) {
      setMessage('Received Quantity cannot exceed Pending Quantity.');
      return;
    }
    if (sampleQuantity < 0) {
      setMessage('QA Sample Quantity cannot be negative.');
      return;
    }
    if (sampleQuantity > quantity) {
      setMessage('QA Sample Quantity cannot exceed Received Quantity.');
      return;
    }
    if (availableQuantity < 0) {
      setMessage('Available Quantity cannot become negative.');
      return;
    }
    if (!receivedBy.trim()) {
      setMessage('Received By is required.');
      return;
    }

    saveGoodsReceipt({
      sourceType: currentRow.sourceType,
      sourceId: currentRow.sourceId,
      lineType: currentRow.lineType,
      materialType: currentRow.materialType,
      materialName: currentRow.materialName,
      inventoryMaterialId: currentRow.inventoryMaterialId,
      purchaseQuantity: currentRow.purchaseQuantity,
      unit: currentRow.unit,
      purchaseDate: currentRow.purchaseDate,
      receivedQuantity: quantity,
      qaSampleQuantity: sampleQuantity,
      receivedDate,
      receivedBy: receivedBy.trim(),
      remarks: remarks.trim(),
    });

    navigate('/employee-c/goods-receipt');
  };

  if (isFormMode) {
    if (!currentRow) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Goods Receipt</CardTitle>
              <CardDescription>Selected purchase record could not be found.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate('/employee-c/goods-receipt')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to list
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary">Goods Receipt</h2>
            <p className="text-sm text-muted-foreground">Receive purchase records from Employee B and update inventory quantities.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/employee-c/goods-receipt')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to list
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Information</CardTitle>
              <CardDescription>Read-only purchase details from Employee B.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Material Type</Label>
                <Input readOnly value={currentRow.materialType} className="bg-muted/60" />
              </div>
              <div className="space-y-2">
                <Label>Material Name</Label>
                <Input readOnly value={currentRow.materialName} className="bg-muted/60" />
              </div>
              <div className="space-y-2">
                <Label>Purchase Quantity</Label>
                <Input readOnly value={currentRow.purchaseQuantity} className="bg-muted/60" />
              </div>
              <div className="space-y-2">
                <Label>Purchase Unit</Label>
                <Input readOnly value={currentRow.unit} className="bg-muted/60" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Purchase Date</Label>
                <Input readOnly value={formatDate(currentRow.purchaseDate)} className="bg-muted/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receipt Summary</CardTitle>
              <CardDescription>Current purchase receipt balance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={statusToneMap[currentRow.status]}>{currentRow.status}</Badge>
                </div>
                <div className="mt-3 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4"><span>Purchase Quantity</span><span className="font-medium">{currentRow.purchaseQuantity} {currentRow.unit}</span></div>
                  <div className="flex justify-between gap-4"><span>Already Received</span><span className="font-medium">{currentRow.receivedQuantity} {currentRow.unit}</span></div>
                  <div className="flex justify-between gap-4"><span>Pending Quantity</span><span className="font-semibold text-primary">{currentRow.pendingQuantity} {currentRow.unit}</span></div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <PackageCheck className="mt-0.5 h-4 w-4 text-primary" />
                <span>Saving this receipt updates inventory immediately and changes the purchase receipt status based on the total received quantity.</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Receiving Information</CardTitle>
            <CardDescription>Enter the quantity physically received at the warehouse.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Received Quantity</Label>
                <Input type="number" min="0" max={currentRow.pendingQuantity} value={receivedQuantity} onChange={event => setReceivedQuantity(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>QA Sample Quantity</Label>
                <Input type="number" min="0" value={qaSampleQuantity} onChange={event => setQaSampleQuantity(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Available Quantity</Label>
                <Input readOnly value={Math.max(0, (Number(receivedQuantity) || 0) - (Number(qaSampleQuantity) || 0))} className="bg-muted/60" />
              </div>
              <div className="space-y-2">
                <Label>Received Date</Label>
                <Input type="date" value={receivedDate} onChange={event => setReceivedDate(event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Received By</Label>
                <Input value={receivedBy} onChange={event => setReceivedBy(event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Remarks</Label>
                <textarea
                  value={remarks}
                  onChange={event => setRemarks(event.target.value)}
                  rows={4}
                  className={cn('flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', 'bg-background')}
                  placeholder="Optional receiving notes"
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" /> Received Date: <span className="font-medium text-foreground">{formatDate(receivedDate)}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> Received By: <span className="font-medium text-foreground">{receivedBy || '-'}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><PackageCheck className="h-4 w-4" /> Available after save: <span className="font-medium text-foreground">{Math.max(0, (Number(receivedQuantity) || 0) - (Number(qaSampleQuantity) || 0))} {currentRow.unit}</span></div>
              </div>
            </div>

            {message && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{message}</div>}

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/employee-c/goods-receipt')}>Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
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
          <h2 className="text-3xl font-bold tracking-tight text-primary">Goods Receipt List</h2>
          <p className="text-sm text-muted-foreground">Display purchase records from Employee B and receive stock against each record.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Total Records</div><div className="text-2xl font-semibold">{summaryCounts.total}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Pending</div><div className="text-2xl font-semibold text-amber-600">{summaryCounts.pending}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Partially Received</div><div className="text-2xl font-semibold text-sky-600">{summaryCounts.partial}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Completed</div><div className="text-2xl font-semibold text-emerald-600">{summaryCounts.completed}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Records</CardTitle>
          <CardDescription>Open any record to receive stock and update inventory.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Type</TableHead>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Purchase Quantity</TableHead>
                  <TableHead>Received Qty</TableHead>
                  <TableHead>QA Sample Qty</TableHead>
                  <TableHead>Available Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">No purchase records available.</TableCell>
                  </TableRow>
                )}
                {purchaseRows.map(row => (
                  <TableRow key={`${row.sourceType}-${row.sourceId}-${row.lineType || 'standard'}`}>
                    <TableCell>{row.materialType}</TableCell>
                    <TableCell className="font-medium">{row.materialName}</TableCell>
                    <TableCell>{row.purchaseQuantity}</TableCell>
                    <TableCell>{row.receivedQuantity}</TableCell>
                    <TableCell>{row.qaSampleQuantity}</TableCell>
                    <TableCell>{row.availableQuantity}</TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell>{formatDate(row.purchaseDate)}</TableCell>
                    <TableCell>
                      <Badge variant={statusToneMap[row.status]}>{row.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant={row.status === 'Completed' ? 'outline' : 'default'} onClick={() => handleOpenRow(row)}>
                        Receive
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

export default GoodsReceipt;