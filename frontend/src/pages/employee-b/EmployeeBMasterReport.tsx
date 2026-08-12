import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import { useErpData } from '@/context/ErpContext';

export function EmployeeBMasterReport() {
  const { rmPurchaseRecords, sachetPurchaseRecords, boxPurchaseRecords } = useErpData();

  const totals = useMemo(() => {
    const rmTotal = rmPurchaseRecords.reduce((sum, record) => sum + record.totalPrice, 0);
    const sachetTotal = sachetPurchaseRecords.reduce((sum, record) => sum + record.totalPrice, 0);
    const boxTotal = boxPurchaseRecords.reduce((sum, record) => sum + record.grandTotalPrice, 0);

    return {
      rmTotal,
      sachetTotal,
      boxTotal,
      grandTotal: rmTotal + sachetTotal + boxTotal,
      recordCount: rmPurchaseRecords.length + sachetPurchaseRecords.length + boxPurchaseRecords.length,
    };
  }, [boxPurchaseRecords, rmPurchaseRecords, sachetPurchaseRecords]);

  const statusSummary = useMemo(() => {
    const statuses = ['Pending', 'Ordered', 'In Transit', 'Delivered'];
    return statuses.map(status => ({
      status,
      count: [
        ...rmPurchaseRecords,
        ...sachetPurchaseRecords,
        ...boxPurchaseRecords,
      ].filter(record => record.status === status).length,
    }));
  }, [boxPurchaseRecords, rmPurchaseRecords, sachetPurchaseRecords]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Parthbhai Master Report</h2>
          <div className="text-sm text-muted-foreground">Consolidated purchase tracking report for Yougeshbhai handoff</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button><Download className="mr-2 h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Records</div>
            <div className="text-2xl font-semibold">{totals.recordCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">RM Total</div>
            <div className="text-2xl font-semibold">{totals.rmTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">PM Total</div>
            <div className="text-2xl font-semibold">{(totals.sachetTotal + totals.boxTotal).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Grand Total</div>
            <div className="text-2xl font-semibold">{totals.grandTotal.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Summary</CardTitle>
          <CardDescription>Current status of all Parthbhai purchase records.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Record Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statusSummary.map(row => (
                <TableRow key={row.status}>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Material Records</CardTitle>
          <CardDescription>RM purchase records entered by Parthbhai.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Required Qty</TableHead>
                <TableHead>Purchased Qty</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Receiver Location</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rmPurchaseRecords.map(record => (
                <TableRow key={record.id}>
                  <TableCell>{record.materialName}</TableCell>
                  <TableCell>{record.requiredQuantity} {record.unit}</TableCell>
                  <TableCell>{record.purchasedQuantity} {record.unit}</TableCell>
                  <TableCell>{record.totalPrice}</TableCell>
                  <TableCell>{record.supplierName || '-'}</TableCell>
                  <TableCell>{record.poNumber || '-'}</TableCell>
                  <TableCell>{record.expectedDeliveryDateTime || '-'}</TableCell>
                  <TableCell>{record.receiverLocation || '-'}</TableCell>
                  <TableCell>{record.documents || '-'}</TableCell>
                  <TableCell>{record.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sachet Records</CardTitle>
          <CardDescription>PM sachet purchase records entered by Parthbhai.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Purchase Unit</TableHead>
                <TableHead>Purchased Qty</TableHead>
                <TableHead>Total Weight</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Receiver Location</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sachetPurchaseRecords.map(record => (
                <TableRow key={record.id}>
                  <TableCell>{record.productName}</TableCell>
                  <TableCell>{record.requiredQuantity} {record.requiredDisplayUnit}</TableCell>
                  <TableCell>{record.purchaseUnit}</TableCell>
                  <TableCell>{record.purchasedQuantity}</TableCell>
                  <TableCell>{record.totalWeight || '-'}</TableCell>
                  <TableCell>{record.totalPrice}</TableCell>
                  <TableCell>{record.supplierName || '-'}</TableCell>
                  <TableCell>{record.poNumber || '-'}</TableCell>
                  <TableCell>{record.expectedDeliveryDateTime || '-'}</TableCell>
                  <TableCell>{record.receiverLocation || '-'}</TableCell>
                  <TableCell>{record.documents || '-'}</TableCell>
                  <TableCell>{record.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Box Records</CardTitle>
          <CardDescription>PM box purchase records entered by Parthbhai.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Flavoured Required</TableHead>
                <TableHead>Assorted Required</TableHead>
                <TableHead>Flavoured Purchased</TableHead>
                <TableHead>Assorted Purchased</TableHead>
                <TableHead>Grand Total</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Receiver Location</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boxPurchaseRecords.map(record => (
                <TableRow key={record.id}>
                  <TableCell>{record.productName}</TableCell>
                  <TableCell>{record.flavouredBoxesRequired}</TableCell>
                  <TableCell>{record.assortedBoxesRequired}</TableCell>
                  <TableCell>{record.flavouredPurchasedQuantity || 0}</TableCell>
                  <TableCell>{record.assortedPurchasedQuantity || 0}</TableCell>
                  <TableCell>{record.grandTotalPrice}</TableCell>
                  <TableCell>{record.supplierName || '-'}</TableCell>
                  <TableCell>{record.poNumber || '-'}</TableCell>
                  <TableCell>{record.expectedDeliveryDateTime || '-'}</TableCell>
                  <TableCell>{record.receiverLocation || '-'}</TableCell>
                  <TableCell>{record.documents || '-'}</TableCell>
                  <TableCell>{record.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default EmployeeBMasterReport;
