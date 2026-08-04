import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MATERIAL_QA_STATUS, useErpData } from '@/context/ErpContext';
import { cn } from '@/lib/utils';

const formatDate = (value?: string) => {
  if (!value) return '-';
  return value.includes('T') ? value.split('T')[0] : value;
};

export function PendingMaterialTests() {
  const { materialTestSlips, saveMaterialTestDecision } = useErpData();
  const [selectedSlipId, setSelectedSlipId] = useState('');
  const [qaRemarks, setQaRemarks] = useState('');
  const [decision, setDecision] = useState<typeof MATERIAL_QA_STATUS.TEST_APPROVED | typeof MATERIAL_QA_STATUS.TEST_REJECTED>(MATERIAL_QA_STATUS.TEST_APPROVED);
  const [message, setMessage] = useState('');
  const pendingSlips = materialTestSlips.filter(slip => slip.status === MATERIAL_QA_STATUS.UNDER_TESTING);
  const selectedSlip = useMemo(
    () => materialTestSlips.find(slip => slip.id === selectedSlipId) || null,
    [materialTestSlips, selectedSlipId]
  );

  useEffect(() => {
    if (!selectedSlip) return;
    setQaRemarks(selectedSlip.qaRemarks || '');
    setDecision(
      selectedSlip.status === MATERIAL_QA_STATUS.TEST_REJECTED
        ? MATERIAL_QA_STATUS.TEST_REJECTED
        : MATERIAL_QA_STATUS.TEST_APPROVED
    );
    setMessage('');
  }, [selectedSlip]);

  const openSlip = (testSlipId: string) => {
    setSelectedSlipId(testSlipId);
  };

  const saveDecision = () => {
    if (!selectedSlip) {
      setMessage('Open a test slip first.');
      return;
    }
    saveMaterialTestDecision({
      testSlipId: selectedSlip.id,
      qaRemarks: qaRemarks.trim(),
      decision,
    });
    setSelectedSlipId('');
    setQaRemarks('');
    setDecision(MATERIAL_QA_STATUS.TEST_APPROVED);
    setMessage('QA decision saved.');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-primary">Pending Material Tests</h2>
        <div className="text-sm text-muted-foreground">Material test slips automatically generated from Employee C Goods Receipt.</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Under Testing Queue</CardTitle>
          <CardDescription>These materials are blocked for Production Issue until QA/QC approval.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test Slip</TableHead>
                <TableHead>Material Type</TableHead>
                <TableHead>Material Name</TableHead>
                <TableHead>Available Quantity</TableHead>
                <TableHead>Received Date</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSlips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">No pending material tests.</TableCell>
                </TableRow>
              )}
              {pendingSlips.map(slip => (
                <TableRow key={slip.id}>
                  <TableCell>{slip.id}</TableCell>
                  <TableCell>{slip.materialType}</TableCell>
                  <TableCell className="font-medium">{slip.materialName}</TableCell>
                  <TableCell>{slip.availableQuantity ?? slip.receivedQuantity} {slip.unit}</TableCell>
                  <TableCell>{formatDate(slip.receivedDate)}</TableCell>
                  <TableCell>{slip.receivedBy}</TableCell>
                  <TableCell><Badge variant="secondary">{slip.status}</Badge></TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => openSlip(slip.id)}>Open</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedSlip ? (
        <Card>
          <CardHeader>
            <CardTitle>Material Test Slip</CardTitle>
            <CardDescription>Enter QA/QC remarks and save the test decision.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground">Test Slip</div>
                <div className="font-medium">{selectedSlip.id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Material</div>
                <div className="font-medium">{selectedSlip.materialName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Available Quantity</div>
                <div className="font-medium">{selectedSlip.availableQuantity ?? selectedSlip.receivedQuantity} {selectedSlip.unit}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Material Type</div>
                <div className="font-medium">{selectedSlip.materialType}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Received Date</div>
                <div className="font-medium">{formatDate(selectedSlip.receivedDate)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Current Status</div>
                <div className="font-medium">{selectedSlip.status}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>QA Remarks</Label>
              <textarea
                value={qaRemarks}
                onChange={event => setQaRemarks(event.target.value)}
                rows={4}
                className={cn('flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', 'bg-background')}
                placeholder="Enter QA/QC observations"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Test Decision</Label>
                <Select value={decision} onValueChange={(value) => setDecision(value as typeof MATERIAL_QA_STATUS.TEST_APPROVED | typeof MATERIAL_QA_STATUS.TEST_REJECTED)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MATERIAL_QA_STATUS.TEST_APPROVED}>Test Approved</SelectItem>
                    <SelectItem value={MATERIAL_QA_STATUS.TEST_REJECTED}>Test Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
              <span className="mr-auto text-sm text-muted-foreground">{message}</span>
              <Button variant="outline" onClick={() => setSelectedSlipId('')}>Cancel</Button>
              <Button onClick={saveDecision}>Save Decision</Button>
            </div>
          </CardContent>
        </Card>
      ) : message ? (
        <div className="text-sm text-muted-foreground">{message}</div>
      ) : null}
    </motion.div>
  );
}

export default PendingMaterialTests;
