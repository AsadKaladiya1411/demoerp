import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarDays, PackageMinus, Warehouse } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { MATERIAL_QA_STATUS, useErpData, type MaterialQaStatus, type ProductionIssueMaterialType } from '@/context/ErpContext';

type InventoryViewRow = {
  materialId: string;
  materialType: ProductionIssueMaterialType;
  materialName: string;
  availableQuantity: number;
  unit: string;
  lastUpdated: string;
  qaStatus?: MaterialQaStatus;
};

const materialToneMap: Record<ProductionIssueMaterialType, 'default' | 'secondary' | 'outline'> = {
  'Raw Materials': 'default',
  Sachets: 'secondary',
  Boxes: 'outline',
  'Additional Materials': 'outline',
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  return value.includes('T') ? value.split('T')[0] : value;
};

const detectMaterialType = (materialCode: string, materialName: string): ProductionIssueMaterialType => {
  const code = materialCode.toLowerCase();
  const name = materialName.toLowerCase();
  if (code.startsWith('rm-') || name.includes('powder') || name.includes('mix') || name.includes('mpc')) return 'Raw Materials';
  if (code.includes('sch') || name.includes('sachet')) return 'Sachets';
  if (code.includes('box') || name.includes('box')) return 'Boxes';
  return 'Additional Materials';
};

export function ProductionIssue() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { materials, goodsReceiptRecords, materialTestSlips, productionIssueRecords, saveProductionIssue } = useErpData();
  const params = useParams<{ materialId?: string }>();

  const [issuedQuantity, setIssuedQuantity] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [issuedBy, setIssuedBy] = useState(currentUser.name);
  const [remarks, setRemarks] = useState('');
  const [message, setMessage] = useState('');

  const availableInventory = useMemo<InventoryViewRow[]>(() => {
    const getNameTokens = (value?: string) => new Set((value || '').toLowerCase().match(/[a-z0-9]+/g) || []);
    const getTokenScore = (left?: string, right?: string) => {
      const leftTokens = getNameTokens(left);
      const rightTokens = getNameTokens(right);
      return Array.from(leftTokens).filter(token => token.length > 2 && rightTokens.has(token)).length;
    };
    const resolveReceiptMaterialId = (record: typeof goodsReceiptRecords[number]) => {
      if (record.inventoryMaterialId) return record.inventoryMaterialId;
      const normalizedName = record.materialName.toLowerCase().trim();
      const directMatch = materials.find(item => {
        const materialName = item.name.toLowerCase().trim();
        return normalizedName === materialName || normalizedName.includes(materialName) || materialName.includes(normalizedName);
      });
      if (directMatch) return directMatch.id;

      return materials
        .map(item => ({ item, score: getTokenScore(normalizedName, item.name) }))
        .filter(candidate => candidate.score > 0)
        .sort((left, right) => right.score - left.score)[0]?.item.id || record.sourceId;
    };
    const resolveSlipMaterialId = (slip: typeof materialTestSlips[number]) => {
      const receipt = goodsReceiptRecords.find(record => record.id === slip.goodsReceiptId);
      if (receipt) return resolveReceiptMaterialId(receipt);
      return slip.materialId;
    };
    const rows = new Map<string, InventoryViewRow>();

    materialTestSlips
      .filter(slip => slip.status === MATERIAL_QA_STATUS.TEST_APPROVED)
      .forEach(slip => {
        const receipt = goodsReceiptRecords.find(record => record.id === slip.goodsReceiptId);
        const materialId = resolveSlipMaterialId(slip);
        const material = materials.find(item => item.id === materialId);
        const remainingQuantity = receipt
          ? (receipt.remainingQuantity ?? receipt.availableQuantity)
          : (slip.remainingQuantity ?? slip.availableQuantity);

        if (remainingQuantity <= 0) return;

        const existing = rows.get(materialId);
        rows.set(materialId, {
          materialId,
          materialType: detectMaterialType(material?.code || materialId, material?.name || receipt?.materialName || slip.materialName),
          materialName: material?.name || receipt?.materialName || slip.materialName,
          availableQuantity: (existing?.availableQuantity || 0) + remainingQuantity,
          unit: material?.unit || receipt?.unit || slip.unit,
          lastUpdated: [existing?.lastUpdated, receipt?.receivedDate || slip.receivedDate]
            .filter(Boolean)
            .sort((left, right) => String(right).localeCompare(String(left)))[0] || '-',
          qaStatus: MATERIAL_QA_STATUS.TEST_APPROVED,
        });
      });

    return Array.from(rows.values()).sort((left, right) => left.materialName.localeCompare(right.materialName));
  }, [goodsReceiptRecords, materialTestSlips, materials]);

  const selectedMaterial = useMemo(() => availableInventory.find(row => row.materialId === params.materialId), [availableInventory, params.materialId]);
  const materialHistory = useMemo(() => (
    selectedMaterial
      ? productionIssueRecords.filter(record => record.materialId === selectedMaterial.materialId)
      : []
  ), [productionIssueRecords, selectedMaterial]);

  useEffect(() => {
    if (!selectedMaterial) return;

    setIssuedQuantity(selectedMaterial.availableQuantity > 0 ? String(selectedMaterial.availableQuantity) : '');
    setBatchNumber(`BATCH-${selectedMaterial.materialId.toUpperCase()}`);
    setIssueDate(new Date().toISOString().slice(0, 10));
    setIssuedBy(currentUser.name);
    setRemarks('');
    setMessage('');
  }, [currentUser.name, selectedMaterial]);

  const openIssueForm = (materialId: string) => {
    navigate(`/employee-c/production-issue/${materialId}`);
  };

  const handleSave = () => {
    if (!selectedMaterial) return;

    const quantity = Number(issuedQuantity) || 0;
    if (selectedMaterial.qaStatus !== MATERIAL_QA_STATUS.TEST_APPROVED) {
      setMessage('This material is currently under testing or has been rejected.');
      return;
    }
    if (quantity <= 0) {
      setMessage('Issued Quantity must be greater than zero.');
      return;
    }
    if (quantity > selectedMaterial.availableQuantity) {
      setMessage('Issued Quantity cannot exceed Available Quantity.');
      return;
    }
    if (!batchNumber.trim()) {
      setMessage('Production Batch Number is required.');
      return;
    }
    if (!issuedBy.trim()) {
      setMessage('Issued By is required.');
      return;
    }

    saveProductionIssue({
      materialType: selectedMaterial.materialType,
      materialId: selectedMaterial.materialId,
      materialName: selectedMaterial.materialName,
      availableQuantity: selectedMaterial.availableQuantity,
      issuedQuantity: quantity,
      unit: selectedMaterial.unit,
      batchNumber: batchNumber.trim(),
      issueDate,
      issuedBy: issuedBy.trim(),
      remarks: remarks.trim(),
    });

    navigate('/employee-c/production-issue');
  };

  if (params.materialId) {
    if (!selectedMaterial) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Production Issue</CardTitle>
              <CardDescription>The selected inventory item is not available.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate('/employee-c/production-issue')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to inventory
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    const remainingInventory = Math.max(0, selectedMaterial.availableQuantity - (Number(issuedQuantity) || 0));

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary">Production Issue</h2>
            <p className="text-sm text-muted-foreground">Issue available inventory to production and update stock immediately.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/employee-c/production-issue')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to inventory
          </Button>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Information</CardTitle>
              <CardDescription>Read-only details for the selected available inventory item.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Material Type</Label>
                <Input readOnly value={selectedMaterial.materialType} className="bg-muted/60" />
              </div>
              <div className="space-y-2">
                <Label>Material Name</Label>
                <Input readOnly value={selectedMaterial.materialName} className="bg-muted/60" />
              </div>
              <div className="space-y-2">
                <Label>Available Quantity</Label>
                <Input readOnly value={selectedMaterial.availableQuantity} className="bg-muted/60" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input readOnly value={selectedMaterial.unit} className="bg-muted/60" />
              </div>
              <div className="space-y-2">
                <Label>Material Status</Label>
                <Input readOnly value={selectedMaterial.qaStatus || MATERIAL_QA_STATUS.PURCHASED} className="bg-muted/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Issue Summary</CardTitle>
              <CardDescription>Remaining inventory updates as you type.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Available</span>
                  <Badge variant={materialToneMap[selectedMaterial.materialType]}>{selectedMaterial.materialType}</Badge>
                </div>
                <div className="mt-3 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4"><span>Available Quantity</span><span className="font-medium">{selectedMaterial.availableQuantity} {selectedMaterial.unit}</span></div>
                  <div className="flex justify-between gap-4"><span>Issued Quantity</span><span className="font-medium">{Number(issuedQuantity) || 0} {selectedMaterial.unit}</span></div>
                  <div className="flex justify-between gap-4"><span>Remaining Inventory</span><span className="font-semibold text-primary">{remainingInventory} {selectedMaterial.unit}</span></div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <Warehouse className="mt-0.5 h-4 w-4 text-primary" />
                <span>Inventory is reduced only when the issue is saved. The same stock is used across Employee C inventory views and Parthbhai tracking data.</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Production Information</CardTitle>
            <CardDescription>Enter the production issue transaction details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Issued Quantity</Label>
                <Input type="number" min="0" max={selectedMaterial.availableQuantity} value={issuedQuantity} onChange={event => setIssuedQuantity(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Production Batch Number</Label>
                <Input value={batchNumber} onChange={event => setBatchNumber(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input type="date" value={issueDate} onChange={event => setIssueDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Issued By</Label>
                <Input value={issuedBy} onChange={event => setIssuedBy(event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Remarks</Label>
                <textarea
                  value={remarks}
                  onChange={event => setRemarks(event.target.value)}
                  rows={4}
                  className={cn('flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', 'bg-background')}
                  placeholder="Optional production issue notes"
                />
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" /> Issue Date: <span className="font-medium text-foreground">{formatDate(issueDate)}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><PackageMinus className="h-4 w-4" /> Issued By: <span className="font-medium text-foreground">{issuedBy || '-'}</span></div>
                <div className="flex items-center gap-2 text-muted-foreground"><Warehouse className="h-4 w-4" /> Remaining Inventory: <span className="font-medium text-foreground">{remainingInventory} {selectedMaterial.unit}</span></div>
              </div>
            </div>

            {message && <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{message}</div>}

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/employee-c/production-issue')}>Cancel</Button>
              <Button onClick={handleSave} disabled={selectedMaterial.qaStatus !== MATERIAL_QA_STATUS.TEST_APPROVED}>Save</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production History</CardTitle>
            <CardDescription>Transaction history for the selected material.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material Name</TableHead>
                    <TableHead>Issued Quantity</TableHead>
                    <TableHead>Batch Number</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Issued By</TableHead>
                    <TableHead>Remaining Inventory</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialHistory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No production issue history found for this material.</TableCell>
                    </TableRow>
                  )}
                  {materialHistory.map(record => (
                    <TableRow key={record.id}>
                      <TableCell>{record.materialName}</TableCell>
                      <TableCell>{record.issuedQuantity} {record.unit}</TableCell>
                      <TableCell>{record.batchNumber}</TableCell>
                      <TableCell>{formatDate(record.issueDate)}</TableCell>
                      <TableCell>{record.issuedBy}</TableCell>
                      <TableCell>{record.remainingQuantity} {record.unit}</TableCell>
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
          <h2 className="text-3xl font-bold tracking-tight text-primary">Available Inventory List</h2>
          <p className="text-sm text-muted-foreground">Select inventory material and issue stock to production.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Inventory</CardTitle>
          <CardDescription>Materials under testing or rejected are visible but blocked for production issue.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Type</TableHead>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Current Available Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Material Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableInventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No available inventory found.</TableCell>
                  </TableRow>
                )}
                {availableInventory.map(row => (
                  <TableRow key={row.materialId}>
                    <TableCell>{row.materialType}</TableCell>
                    <TableCell className="font-medium">{row.materialName}</TableCell>
                    <TableCell>{row.availableQuantity}</TableCell>
                    <TableCell>{row.unit}</TableCell>
                    <TableCell>{formatDate(row.lastUpdated)}</TableCell>
                    <TableCell>{row.qaStatus || MATERIAL_QA_STATUS.PURCHASED}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => openIssueForm(row.materialId)} disabled={row.qaStatus !== MATERIAL_QA_STATUS.TEST_APPROVED}>
                        {row.qaStatus === MATERIAL_QA_STATUS.TEST_APPROVED ? 'Issue' : 'Blocked'}
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

export default ProductionIssue;
