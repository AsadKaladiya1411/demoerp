import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Filter, Printer, Search, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { useErpData, type InventoryTransactionRecord, type InventoryTransactionType } from '@/context/ErpContext';
import { useAuth } from '@/context/AuthContext';
import { calculatePackaging, calculateProduction, generateConsolidatedMaterialRequirementReport, getPackagingRequiredDisplay } from '@/lib/production';

type ReportTabKey = 'goodsReceipt' | 'productionIssue' | 'productionReturn' | 'finishedGoods' | 'inventoryMovement';

type ReportRow = {
  id: string;
  transactionDate: string;
  materialType: string;
  materialName: string;
  productName?: string;
  batchNumber?: string;
  transactionType: string;
  quantity: number;
  delta: number;
  unit: string;
  pendingQuantity?: number;
  status: string;
  referenceModule: string;
  createdBy: string;
  runningBalance?: number;
  details: Array<{ label: string; value?: string | number }>;
};

type ReportColumn = {
  header: string;
  render: (row: ReportRow) => ReactNode;
  className?: string;
};

type ReportConfig = {
  key: ReportTabKey;
  title: string;
  description: string;
  rows: ReportRow[];
  columns: ReportColumn[];
  showTransactionTypeFilter?: boolean;
};

type ReportFilters = {
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
  statusFilter: string;
  materialFilter: string;
  batchFilter: string;
  transactionTypeFilter: string;
  currentPage: number;
};

const reportTabLabels: Record<ReportTabKey, string> = {
  goodsReceipt: 'Goods Receipt Report',
  productionIssue: 'Production Issue Report',
  productionReturn: 'Production Return Report',
  finishedGoods: 'Finished Goods Report',
  inventoryMovement: 'Inventory Movement Report',
};

const reportTabOrder: ReportTabKey[] = ['goodsReceipt', 'productionIssue', 'productionReturn', 'finishedGoods', 'inventoryMovement'];

const initialReportFilters = (): Record<ReportTabKey, ReportFilters> => ({
  goodsReceipt: { searchQuery: '', dateFrom: '', dateTo: '', statusFilter: 'all', materialFilter: 'all', batchFilter: '', transactionTypeFilter: 'all', currentPage: 1 },
  productionIssue: { searchQuery: '', dateFrom: '', dateTo: '', statusFilter: 'all', materialFilter: 'all', batchFilter: '', transactionTypeFilter: 'all', currentPage: 1 },
  productionReturn: { searchQuery: '', dateFrom: '', dateTo: '', statusFilter: 'all', materialFilter: 'all', batchFilter: '', transactionTypeFilter: 'all', currentPage: 1 },
  finishedGoods: { searchQuery: '', dateFrom: '', dateTo: '', statusFilter: 'all', materialFilter: 'all', batchFilter: '', transactionTypeFilter: 'all', currentPage: 1 },
  inventoryMovement: { searchQuery: '', dateFrom: '', dateTo: '', statusFilter: 'all', materialFilter: 'all', batchFilter: '', transactionTypeFilter: 'all', currentPage: 1 },
});

const inventoryStatusTone: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  Completed: 'default',
  Returned: 'default',
  'Partially Received': 'secondary',
  Issued: 'outline',
  Pending: 'outline',
  Recorded: 'secondary',
  'Partially Returned': 'secondary',
};

const inventoryTypeTone: Record<InventoryTransactionType, 'default' | 'secondary' | 'outline'> = {
  'Goods Receipt': 'default',
  'Production Issue': 'outline',
  'Production Return': 'secondary',
  'Finished Goods Receipt': 'default',
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  return value.includes('T') ? value.split('T')[0] : value;
};

function InventoryMovementView() {
  const { materials, inventoryTransactions, goodsReceiptRecords, productionIssueRecords, productionReturnRecords } = useErpData();
  const [activeTab, setActiveTab] = useState<ReportTabKey>('goodsReceipt');
  const [filtersByTab, setFiltersByTab] = useState<Record<ReportTabKey, ReportFilters>>(initialReportFilters);
  const [selectedRow, setSelectedRow] = useState<ReportRow | null>(null);
  const [exportMessage, setExportMessage] = useState('');

  const reportConfigs = useMemo<Record<ReportTabKey, ReportConfig>>(() => {
    const goodsReceiptRows: ReportRow[] = goodsReceiptRecords.map(record => ({
      id: record.id,
      transactionDate: record.receivedDate,
      materialType: record.materialType,
      materialName: record.materialName,
      batchNumber: record.sourceId,
      transactionType: 'Goods Receipt (+)',
      quantity: record.receivedQuantity,
      delta: record.receivedQuantity,
      unit: record.unit,
      pendingQuantity: Math.max(0, record.purchaseQuantity - record.receivedQuantity),
      status: record.status,
      referenceModule: record.sourceType,
      createdBy: record.receivedBy,
      details: [
        { label: 'Transaction ID', value: record.id },
        { label: 'Purchase Reference', value: record.sourceId },
        { label: 'Purchase Date', value: formatDate(record.purchaseDate) },
        { label: 'Received Date', value: formatDate(record.receivedDate) },
        { label: 'Received Quantity', value: `${record.receivedQuantity} ${record.unit}` },
        { label: 'Pending Quantity', value: `${Math.max(0, record.purchaseQuantity - record.receivedQuantity)} ${record.unit}` },
        { label: 'Status', value: record.status },
        { label: 'Created By', value: record.receivedBy },
        { label: 'Remarks', value: record.remarks || '-' },
      ],
    }));

    const productionIssueRows: ReportRow[] = productionIssueRecords.map(record => ({
      id: record.id,
      transactionDate: record.issueDate,
      materialType: record.materialType,
      materialName: record.materialName,
      batchNumber: record.batchNumber,
      transactionType: 'Production Issue (-)',
      quantity: record.issuedQuantity,
      delta: -record.issuedQuantity,
      unit: record.unit,
      status: record.status,
      referenceModule: 'Production Issue',
      createdBy: record.issuedBy,
      runningBalance: record.remainingQuantity,
      details: [
        { label: 'Transaction ID', value: record.id },
        { label: 'Issue Date', value: formatDate(record.issueDate) },
        { label: 'Batch Number', value: record.batchNumber },
        { label: 'Issued Quantity', value: `${record.issuedQuantity} ${record.unit}` },
        { label: 'Remaining Inventory', value: `${record.remainingQuantity} ${record.unit}` },
        { label: 'Status', value: record.status },
        { label: 'Issued By', value: record.issuedBy },
        { label: 'Remarks', value: record.remarks || '-' },
      ],
    }));

    const productionReturnRows: ReportRow[] = productionReturnRecords.map(record => ({
      id: record.id,
      transactionDate: record.returnDate,
      materialType: record.materialType,
      materialName: record.materialName,
      batchNumber: record.batchNumber,
      transactionType: 'Production Return (+)',
      quantity: record.returnedQuantity,
      delta: record.returnedQuantity,
      unit: record.unit,
      status: record.status,
      referenceModule: 'Production Return',
      createdBy: record.returnedBy,
      details: [
        { label: 'Transaction ID', value: record.id },
        { label: 'Return Date', value: formatDate(record.returnDate) },
        { label: 'Batch Number', value: record.batchNumber },
        { label: 'Issued Quantity', value: `${record.issuedQuantity} ${record.unit}` },
        { label: 'Returned Quantity', value: `${record.returnedQuantity} ${record.unit}` },
        { label: 'Actual Consumption', value: `${record.actualConsumption} ${record.unit}` },
        { label: 'Remaining Returnable Quantity', value: `${record.remainingReturnableQuantity} ${record.unit}` },
        { label: 'Status', value: record.status },
        { label: 'Returned By', value: record.returnedBy },
        { label: 'Return Reason', value: record.returnReason },
        { label: 'Remarks', value: record.remarks || '-' },
      ],
    }));

    const finishedGoodsRows: ReportRow[] = inventoryTransactions
      .filter(transaction => transaction.transactionType === 'Finished Goods Receipt')
      .map(transaction => ({
        id: transaction.id,
        transactionDate: transaction.transactionDate,
        materialType: transaction.materialType,
        materialName: transaction.productName || transaction.materialName,
        productName: transaction.productName || transaction.materialName,
        batchNumber: transaction.batchNumber,
        transactionType: transaction.transactionType,
        quantity: transaction.quantity,
        delta: transaction.delta,
        unit: transaction.unit,
        status: transaction.status,
        referenceModule: transaction.referenceModule,
        createdBy: transaction.createdBy,
        details: [
          { label: 'Transaction ID', value: transaction.id },
          { label: 'Transaction Date', value: formatDate(transaction.transactionDate) },
          { label: 'Product Name', value: transaction.productName || transaction.materialName },
          { label: 'Batch Number', value: transaction.batchNumber || '-' },
          { label: 'Quantity', value: `${transaction.quantity} ${transaction.unit}` },
          { label: 'Status', value: transaction.status },
          { label: 'Created By', value: transaction.createdBy },
          { label: 'Remarks', value: transaction.referenceModule },
        ],
      }));

    const buildMovementRow = (transaction: InventoryTransactionRecord, runningBalance: number): ReportRow => ({
      id: transaction.id,
      transactionDate: transaction.transactionDate,
      materialType: transaction.materialType,
      materialName: transaction.materialName,
      productName: transaction.productName,
      batchNumber: transaction.batchNumber,
      transactionType: transaction.transactionType,
      quantity: transaction.quantity,
      delta: transaction.delta,
      unit: transaction.unit,
      status: transaction.status,
      referenceModule: transaction.referenceModule,
      createdBy: transaction.createdBy,
      runningBalance,
      details: [
        { label: 'Transaction ID', value: transaction.id },
        { label: 'Transaction Date', value: formatDate(transaction.transactionDate) },
        { label: 'Material Type', value: transaction.materialType },
        { label: 'Material Name', value: transaction.materialName },
        { label: 'Product Name', value: transaction.productName || '-' },
        { label: 'Batch Number', value: transaction.batchNumber || '-' },
        { label: 'Transaction Type', value: transaction.transactionType },
        { label: 'Quantity', value: `${transaction.delta < 0 ? '-' : '+'}${transaction.quantity} ${transaction.unit}` },
        { label: 'Running Balance', value: `${runningBalance} ${transaction.unit}` },
        { label: 'Reference Module', value: transaction.referenceModule },
        { label: 'Created By', value: transaction.createdBy },
        { label: 'Status', value: transaction.status },
      ],
    });

    const inventoryMovementRowMap = new Map<string, ReportRow[]>();
    const groupedTransactions = new Map<string, InventoryTransactionRecord[]>();
    inventoryTransactions.forEach(transaction => {
      const list = groupedTransactions.get(transaction.materialId) || [];
      list.push(transaction);
      groupedTransactions.set(transaction.materialId, list);
    });

    groupedTransactions.forEach((transactions, materialId) => {
      const material = materials.find(item => item.id === materialId);
      if (!material) return;
      const orderedTransactions = [...transactions].sort((left, right) => {
        const dateCompare = left.transactionDate.localeCompare(right.transactionDate);
        if (dateCompare !== 0) return dateCompare;
        const recordedCompare = left.recordedAt.localeCompare(right.recordedAt);
        if (recordedCompare !== 0) return recordedCompare;
        return left.id.localeCompare(right.id);
      });
      const netMovement = orderedTransactions.reduce((sum, transaction) => sum + transaction.delta, 0);
      let runningBalance = (material.stock ?? 0) - netMovement;

      inventoryMovementRowMap.set(materialId, orderedTransactions.map(transaction => {
        runningBalance += transaction.delta;
        return buildMovementRow(transaction, runningBalance);
      }));
    });

    const inventoryMovementRows = Array.from(inventoryMovementRowMap.values()).flat().sort((left, right) => {
      const dateCompare = right.transactionDate.localeCompare(left.transactionDate);
      if (dateCompare !== 0) return dateCompare;
      return right.id.localeCompare(left.id);
    });

    return {
      goodsReceipt: {
        key: 'goodsReceipt',
        title: reportTabLabels.goodsReceipt,
        description: 'Automatically generated from Employee C Goods Receipt saves.',
        rows: goodsReceiptRows,
        columns: [
          { header: 'Transaction ID', render: row => row.id, className: 'font-mono text-xs' },
          { header: 'Date', render: row => formatDate(row.transactionDate) },
          { header: 'Material Type', render: row => row.materialType },
          { header: 'Material Name', render: row => row.materialName, className: 'font-medium' },
          { header: 'Purchase Ref', render: row => row.batchNumber || '-' },
          { header: 'Received Qty', render: row => `${row.quantity} ${row.unit}` },
          { header: 'Pending Qty', render: row => `${row.pendingQuantity ?? 0} ${row.unit}` },
          { header: 'Status', render: row => <Badge variant={inventoryStatusTone[row.status] || 'outline'}>{row.status}</Badge> },
          { header: 'Created By', render: row => row.createdBy },
          { header: 'Action', render: row => <Button variant="outline" size="sm" onClick={() => setSelectedRow(row)}><Eye className="mr-2 h-4 w-4" /> View</Button> },
        ],
      },
      productionIssue: {
        key: 'productionIssue',
        title: reportTabLabels.productionIssue,
        description: 'Automatically generated from Employee C Production Issue saves.',
        rows: productionIssueRows,
        columns: [
          { header: 'Transaction ID', render: row => row.id, className: 'font-mono text-xs' },
          { header: 'Date', render: row => formatDate(row.transactionDate) },
          { header: 'Material Type', render: row => row.materialType },
          { header: 'Material Name', render: row => row.materialName, className: 'font-medium' },
          { header: 'Batch Number', render: row => row.batchNumber || '-' },
          { header: 'Issued Qty', render: row => `${row.quantity} ${row.unit}` },
          { header: 'Remaining Inventory', render: row => `${row.runningBalance ?? '-'} ${row.unit}` },
          { header: 'Status', render: row => <Badge variant={inventoryStatusTone[row.status] || 'outline'}>{row.status}</Badge> },
          { header: 'Created By', render: row => row.createdBy },
          { header: 'Action', render: row => <Button variant="outline" size="sm" onClick={() => setSelectedRow(row)}><Eye className="mr-2 h-4 w-4" /> View</Button> },
        ],
      },
      productionReturn: {
        key: 'productionReturn',
        title: reportTabLabels.productionReturn,
        description: 'Automatically generated from Employee C Production Return saves.',
        rows: productionReturnRows,
        columns: [
          { header: 'Transaction ID', render: row => row.id, className: 'font-mono text-xs' },
          { header: 'Date', render: row => formatDate(row.transactionDate) },
          { header: 'Material Name', render: row => row.materialName, className: 'font-medium' },
          { header: 'Batch Number', render: row => row.batchNumber || '-' },
          { header: 'Issued Qty', render: row => `${row.details.find(detail => detail.label === 'Issued Quantity')?.value || row.quantity} ${row.unit}` },
          { header: 'Returned Qty', render: row => `${row.quantity} ${row.unit}` },
          { header: 'Actual Consumption', render: row => row.details.find(detail => detail.label === 'Actual Consumption')?.value || '-' },
          { header: 'Status', render: row => <Badge variant={inventoryStatusTone[row.status] || 'outline'}>{row.status}</Badge> },
          { header: 'Returned By', render: row => row.createdBy },
          { header: 'Action', render: row => <Button variant="outline" size="sm" onClick={() => setSelectedRow(row)}><Eye className="mr-2 h-4 w-4" /> View</Button> },
        ],
      },
      finishedGoods: {
        key: 'finishedGoods',
        title: reportTabLabels.finishedGoods,
        description: 'Automatically populated when future Finished Goods Receipt transactions are saved.',
        rows: finishedGoodsRows,
        columns: [
          { header: 'Transaction ID', render: row => row.id, className: 'font-mono text-xs' },
          { header: 'Date', render: row => formatDate(row.transactionDate) },
          { header: 'Product Name', render: row => row.productName || row.materialName, className: 'font-medium' },
          { header: 'Batch Number', render: row => row.batchNumber || '-' },
          { header: 'Quantity', render: row => `${row.quantity} ${row.unit}` },
          { header: 'Status', render: row => <Badge variant={inventoryStatusTone[row.status] || 'outline'}>{row.status}</Badge> },
          { header: 'Created By', render: row => row.createdBy },
          { header: 'Action', render: row => <Button variant="outline" size="sm" onClick={() => setSelectedRow(row)}><Eye className="mr-2 h-4 w-4" /> View</Button> },
        ],
      },
      inventoryMovement: {
        key: 'inventoryMovement',
        title: reportTabLabels.inventoryMovement,
        description: 'Central inventory ledger generated from all Employee C transactions.',
        rows: inventoryMovementRows,
        showTransactionTypeFilter: true,
        columns: [
          { header: 'Transaction ID', render: row => row.id, className: 'font-mono text-xs' },
          { header: 'Transaction Date', render: row => formatDate(row.transactionDate) },
          { header: 'Material Type', render: row => row.materialType },
          { header: 'Material Name', render: row => row.materialName, className: 'font-medium' },
          { header: 'Product Name', render: row => row.productName || '-' },
          { header: 'Batch Number', render: row => row.batchNumber || '-' },
          { header: 'Transaction Type', render: row => <Badge variant={inventoryTypeTone[row.transactionType as InventoryTransactionType] || 'outline'}>{row.transactionType}</Badge> },
          { header: 'Quantity', render: row => `${row.delta < 0 ? '-' : '+'}${row.quantity} ${row.unit}` },
          { header: 'Unit', render: row => row.unit },
          { header: 'Running Balance', render: row => `${row.runningBalance ?? '-'} ${row.unit}` },
          { header: 'Reference Module', render: row => row.referenceModule },
          { header: 'Created By', render: row => row.createdBy },
          { header: 'Status', render: row => <Badge variant={inventoryStatusTone[row.status] || 'outline'}>{row.status}</Badge> },
          { header: 'Action', render: row => <Button variant="outline" size="sm" onClick={() => setSelectedRow(row)}><Eye className="mr-2 h-4 w-4" /> View</Button> },
        ],
      },
    };
  }, [goodsReceiptRecords, inventoryTransactions, materials, productionIssueRecords, productionReturnRecords]);

  const activeConfig = reportConfigs[activeTab];
  const activeFilters = filtersByTab[activeTab];

  const filteredRows = useMemo(() => {
    const query = activeFilters.searchQuery.trim().toLowerCase();

    return activeConfig.rows.filter(row => {
      const searchableText = [row.id, row.materialName, row.productName || '', row.batchNumber || '', row.referenceModule, row.createdBy, row.transactionType, row.status].join(' ').toLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const matchesDateFrom = !activeFilters.dateFrom || row.transactionDate >= activeFilters.dateFrom;
      const matchesDateTo = !activeFilters.dateTo || row.transactionDate <= activeFilters.dateTo;
      const matchesStatus = activeFilters.statusFilter === 'all' || row.status === activeFilters.statusFilter;
      const matchesMaterial = activeFilters.materialFilter === 'all' || row.materialName === activeFilters.materialFilter || row.productName === activeFilters.materialFilter;
      const matchesBatch = !activeFilters.batchFilter.trim() || (row.batchNumber || '').toLowerCase().includes(activeFilters.batchFilter.trim().toLowerCase());
      const matchesTransactionType = !activeConfig.showTransactionTypeFilter || activeFilters.transactionTypeFilter === 'all' || row.transactionType === activeFilters.transactionTypeFilter;

      return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus && matchesMaterial && matchesBatch && matchesTransactionType;
    });
  }, [activeConfig.rows, activeConfig.showTransactionTypeFilter, activeFilters.batchFilter, activeFilters.dateFrom, activeFilters.dateTo, activeFilters.materialFilter, activeFilters.searchQuery, activeFilters.statusFilter, activeFilters.transactionTypeFilter]);

  const statusOptions = useMemo(() => ['all', ...Array.from(new Set(activeConfig.rows.map(row => row.status)))], [activeConfig.rows]);
  const materialOptions = useMemo(() => ['all', ...Array.from(new Set(activeConfig.rows.map(row => row.productName || row.materialName)))], [activeConfig.rows]);
  const transactionTypeOptions = useMemo(() => ['all', ...Array.from(new Set(activeConfig.rows.map(row => row.transactionType)))], [activeConfig.rows]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(activeFilters.currentPage, totalPages);
  const paginatedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totals = useMemo(() => ({
    recordCount: filteredRows.length,
    materialCount: new Set(filteredRows.map(row => row.materialName)).size,
    netMovement: filteredRows.reduce((sum, row) => sum + row.delta, 0),
  }), [filteredRows]);

  const updateFilter = <K extends keyof ReportFilters>(field: K, value: ReportFilters[K]) => {
    setFiltersByTab(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value,
        currentPage: field === 'currentPage' ? Number(value) : 1,
      },
    }));
  };

  const clearFilters = () => {
    setFiltersByTab(prev => ({
      ...prev,
      [activeTab]: { ...initialReportFilters()[activeTab] },
    }));
  };

  const detailRow = selectedRow;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Employee C Reports</h2>
          <p className="text-sm text-muted-foreground">Read-only reports generated automatically from Employee C module transactions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setExportMessage('Export placeholder: connect CSV/PDF export later.')}>Export</Button>
        </div>
      </div>

      {exportMessage && <div className="rounded-md border border-muted-foreground/20 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">{exportMessage}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Filtered Records</div><div className="text-2xl font-semibold">{totals.recordCount}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Materials Covered</div><div className="text-2xl font-semibold">{totals.materialCount}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Net Movement</div><div className="text-2xl font-semibold">{totals.netMovement}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={value => setActiveTab(value as ReportTabKey)} className="w-full">
            <TabsList className="mb-4 flex flex-wrap h-auto gap-2 bg-transparent p-0">
              {reportTabOrder.map(tabKey => (
                <TabsTrigger key={tabKey} value={tabKey} className="rounded-md border border-border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {reportTabLabels[tabKey]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-64 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={activeFilters.searchQuery} onChange={event => updateFilter('searchQuery', event.target.value)} placeholder={`Search ${activeConfig.title.toLowerCase()}`} className="pl-9" />
              </div>
              <Button variant="outline" onClick={clearFilters}><Filter className="mr-2 h-4 w-4" /> Clear Filters</Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <div className="space-y-1"><label className="text-sm font-medium">Date From</label><Input type="date" value={activeFilters.dateFrom} onChange={event => updateFilter('dateFrom', event.target.value)} /></div>
              <div className="space-y-1"><label className="text-sm font-medium">Date To</label><Input type="date" value={activeFilters.dateTo} onChange={event => updateFilter('dateTo', event.target.value)} /></div>
              <div className="space-y-1"><label className="text-sm font-medium">Status</label><Select value={activeFilters.statusFilter} onValueChange={value => updateFilter('statusFilter', value)}><SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent>{statusOptions.map(option => <SelectItem key={option} value={option}>{option === 'all' ? 'All Statuses' : option}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><label className="text-sm font-medium">Material</label><Select value={activeFilters.materialFilter} onValueChange={value => updateFilter('materialFilter', value)}><SelectTrigger><SelectValue placeholder="All materials" /></SelectTrigger><SelectContent>{materialOptions.map(option => <SelectItem key={option} value={option}>{option === 'all' ? 'All Materials' : option}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><label className="text-sm font-medium">Batch Number</label><Input value={activeFilters.batchFilter} onChange={event => updateFilter('batchFilter', event.target.value)} placeholder="Batch search" /></div>
            </div>

            {activeConfig.showTransactionTypeFilter && (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="space-y-1 xl:col-span-2"><label className="text-sm font-medium">Transaction Type</label><Select value={activeFilters.transactionTypeFilter} onValueChange={value => updateFilter('transactionTypeFilter', value)}><SelectTrigger><SelectValue placeholder="All transaction types" /></SelectTrigger><SelectContent>{transactionTypeOptions.map(option => <SelectItem key={option} value={option}>{option === 'all' ? 'All Types' : option}</SelectItem>)}</SelectContent></Select></div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-3 text-sm text-muted-foreground">{activeConfig.description}</div>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {activeConfig.columns.map(column => <TableHead key={column.header} className={column.className}>{column.header}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRows.length === 0 && (
                  <TableRow><TableCell colSpan={activeConfig.columns.length} className="py-10 text-center text-muted-foreground">No records found.</TableCell></TableRow>
                )}
                {paginatedRows.map(row => (
                  <TableRow key={row.id}>
                    {activeConfig.columns.map(column => <TableCell key={column.header} className={column.className}>{column.render(row)}</TableCell>)}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Showing {paginatedRows.length ? (currentPage - 1) * pageSize + 1 : 0} to {(currentPage - 1) * pageSize + paginatedRows.length} of {filteredRows.length} records
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => updateFilter('currentPage', currentPage - 1)}>Previous</Button>
              <div className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</div>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => updateFilter('currentPage', currentPage + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(detailRow)} onOpenChange={open => !open && setSelectedRow(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Details</DialogTitle>
            <DialogDescription>Read-only details for the selected report row.</DialogDescription>
          </DialogHeader>
          {detailRow && (
            <div className="grid gap-3 md:grid-cols-2">
              {detailRow.details.map(detail => (
                <div key={detail.label} className="space-y-1">
                  <div className="text-xs text-muted-foreground">{detail.label}</div>
                  <div className="text-sm">{detail.value ?? '-'}</div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export function Reports() {
  const location = useLocation();
  const { productionPlans, products, flavours, recipes, materials, productionCalculations, assortedBoxCalculations, requirementReportSelection, updateRequirementReportSelection } = useErpData();
  const { currentUser } = useAuth();
  const isInventoryMovementRoute = location.pathname.startsWith('/inventory-movement');
  const isEmployeeB = currentUser.role === 'Employee B';
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>(requirementReportSelection.selectedRecipeIds);
  const [productionQtyByRecipe, setProductionQtyByRecipe] = useState<Record<string, string>>(requirementReportSelection.productionQtyByRecipe);

  const selectedRecipeSet = useMemo(() => new Set(selectedRecipeIds), [selectedRecipeIds]);

  useEffect(() => {
    updateRequirementReportSelection({ selectedRecipeIds, productionQtyByRecipe });
  }, [productionQtyByRecipe, selectedRecipeIds, updateRequirementReportSelection]);

  const reportInputs = useMemo(() => (
    recipes
      .filter(recipe => selectedRecipeSet.has(recipe.id))
      .map(recipe => {
        const product = products.find(item => item.id === recipe.productId);
        const flavour = flavours.find(item => item.id === recipe.flavourId);
        const productionKg = Number(productionQtyByRecipe[recipe.id] || recipe.batchSize);
        return {
          recipe,
          recipeName: [product?.name, flavour?.name].filter(Boolean).join(' - ') || recipe.id,
          productionKg,
        };
      })
      .filter(input => input.productionKg > 0)
  ), [flavours, productionQtyByRecipe, products, recipes, selectedRecipeSet]);

  const materialRequirementReport = useMemo(
    () => generateConsolidatedMaterialRequirementReport(reportInputs, materials),
    [materials, reportInputs]
  );

  const packagingRequirementRows = useMemo(() => {
    const productTotals = new Map<string, {
      productId: string;
      productName: string;
      sachetRollKg: number;
      sachetRolls: number;
      emptySachets: number;
      flavouredBoxes: number;
      assortedBoxes: number;
    }>();

    reportInputs.forEach(input => {
      const product = products.find(item => item.id === input.recipe.productId);
      const production = calculateProduction(input.recipe, materials, input.productionKg);
      const packaging = calculatePackaging(production.totalFinishedUnits, input.recipe.packaging || [], materials);
      const existing = productTotals.get(input.recipe.productId) || {
        productId: input.recipe.productId,
        productName: product?.name || input.recipe.productId,
        sachetRollKg: 0,
        sachetRolls: 0,
        emptySachets: 0,
        flavouredBoxes: 0,
        assortedBoxes: 0,
      };

      packaging.forEach(item => {
        const display = getPackagingRequiredDisplay(item);
        const materialName = (item.name || item.materialId).toLowerCase();
        const isBoxMaterial = materialName.includes('box');
        const isSachetMaterial = item.packagingUnit === 'Roll' || materialName.includes('sachet');

        if (isBoxMaterial) return;
        if (!isSachetMaterial) return;

        if (item.packagingUnit === 'Roll' && item.emptySachetWeightG && item.emptySachetWeightG > 0) {
          const wastageMultiplier = 1 - ((item.wastagePercent || 0) / 100);
          const requiredKg = wastageMultiplier > 0
            ? (item.requiredSachets * item.emptySachetWeightG) / wastageMultiplier / 1000
            : 0;
          existing.sachetRollKg += requiredKg;
          existing.sachetRolls += display.quantity;
          return;
        }

        existing.emptySachets += display.quantity;
      });

      const savedProduction = productionCalculations.find(item => item.recipeId === input.recipe.id);
      existing.flavouredBoxes += savedProduction?.flavouredBoxes || 0;
      productTotals.set(input.recipe.productId, existing);
    });

    return Array.from(productTotals.values())
      .map(row => ({
        ...row,
        sachetRollKg: Number(row.sachetRollKg.toFixed(6)),
        sachetRolls: Math.ceil(row.sachetRolls),
        emptySachets: Math.ceil(row.emptySachets),
        flavouredBoxes: Math.ceil(row.flavouredBoxes),
        assortedBoxes: Math.ceil(assortedBoxCalculations.find(item => item.productId === row.productId)?.totalAssortedBoxes || 0),
      }))
      .sort((a, b) => a.productName.localeCompare(b.productName));
  }, [assortedBoxCalculations, materials, productionCalculations, products, reportInputs]);

  const productionReportRows = useMemo(() => (
    productionPlans
      .filter(plan => (!dateFrom || plan.mfgDate >= dateFrom) && (!dateTo || plan.mfgDate <= dateTo))
      .map(plan => {
        const recipe = recipes.find(item => item.id === plan.recipeId);
        const product = products.find(item => item.id === plan.productId);
        const flavour = flavours.find(item => item.id === plan.flavourId);

        if (!recipe) {
          return {
            id: plan.id,
            batch: plan.batch,
            productName: product?.name || plan.productId,
            flavourName: flavour?.name || plan.flavourId,
            mfgDate: plan.mfgDate,
            quantity: plan.quantity,
            finishedSachets: 0,
            rawMaterials: 'Recipe missing',
            packagingMaterials: 'Recipe missing',
            boxSummary: '-',
            looseSachets: 0,
            status: 'Recipe Missing',
          };
        }

        const production = calculateProduction(recipe, materials, plan.quantity);
        const packaging = calculatePackaging(production.totalFinishedUnits, recipe.packaging || [], materials);

        const rawMaterials = production.rawMaterials
          .map(item => `${item.name || item.materialId}: ${item.required.toFixed(3)} ${item.unit}`)
          .join('; ');
        const packagingMaterials = packaging
          .map(item => {
            const display = getPackagingRequiredDisplay(item);
            return `${item.name || item.materialId}: ${display.quantity} ${display.unit}`;
          })
          .join('; ');
        const validationStatus = [
          production.rawMaterials.length === 0 ? 'No RM' : '',
          packaging.length === 0 ? 'No PM' : '',
        ].filter(Boolean);

        return {
          id: plan.id,
          batch: plan.batch,
          productName: product?.name || plan.productId,
          flavourName: flavour?.name || plan.flavourId,
          mfgDate: plan.mfgDate,
          quantity: plan.quantity,
          finishedSachets: production.totalFinishedUnits,
          rawMaterials,
          packagingMaterials,
          boxSummary: 'Use Assorted Configuration for final box count',
          looseSachets: 0,
          status: validationStatus.length ? validationStatus.join('; ') : plan.status,
        };
      })
  ), [dateFrom, dateTo, flavours, materials, productionPlans, products, recipes]);

  const toggleRecipeSelection = (recipeId: string) => {
    setSelectedRecipeIds(prev =>
      prev.includes(recipeId) ? prev.filter(id => id !== recipeId) : [...prev, recipeId]
    );
  };

  const selectAllRecipes = () => {
    setSelectedRecipeIds(recipes.map(recipe => recipe.id));
    setProductionQtyByRecipe(prev => {
      const next = { ...prev };
      recipes.forEach(recipe => {
        if (!next[recipe.id]) next[recipe.id] = String(recipe.batchSize);
      });
      return next;
    });
  };

  if (isInventoryMovementRoute) {
    return <InventoryMovementView />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">System Reports</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-4 items-end">
            {!isEmployeeB && (
              <>
                <div className="space-y-1">
                  <label className="text-sm font-medium">From Date</label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">To Date</label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
                <Button variant="secondary">Filter</Button>
              </>
            )}
            <div className="flex-1" />
            <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Excel</Button>
            <Button variant="default"><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={isEmployeeB ? 'requirement' : 'production'} className="w-full">
            <TabsList className="mb-4">
              {!isEmployeeB && <TabsTrigger value="production">Production Report</TabsTrigger>}
              <TabsTrigger value="requirement">Requirement Report</TabsTrigger>
              {!isEmployeeB && <TabsTrigger value="packaging">Packaging Report</TabsTrigger>}
              {!isEmployeeB && <TabsTrigger value="inventory">Material Report</TabsTrigger>}
            </TabsList>
            
            {!isEmployeeB && (
            <TabsContent value="production">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Production report is calculated from saved production records and live Recipe data.
                </div>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch Number</TableHead>
                        <TableHead>Mfg Date</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Flavour</TableHead>
                        <TableHead>Production Qty (kg)</TableHead>
                        <TableHead>Finished Sachets</TableHead>
                        <TableHead>Raw Material Requirement</TableHead>
                        <TableHead>Packaging Material Requirement</TableHead>
                        <TableHead>Box Summary</TableHead>
                        <TableHead>Loose Sachets</TableHead>
                        <TableHead>Production Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productionReportRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No production records found.</TableCell>
                        </TableRow>
                      )}
                      {productionReportRows.map(row => (
                        <TableRow key={row.id}>
                          <TableCell>{row.batch}</TableCell>
                          <TableCell>{row.mfgDate}</TableCell>
                          <TableCell>{row.productName}</TableCell>
                          <TableCell>{row.flavourName}</TableCell>
                          <TableCell>{row.quantity}</TableCell>
                          <TableCell>{row.finishedSachets}</TableCell>
                          <TableCell className="min-w-72 whitespace-normal">{row.rawMaterials || '-'}</TableCell>
                          <TableCell className="min-w-72 whitespace-normal">{row.packagingMaterials || '-'}</TableCell>
                          <TableCell className="min-w-52 whitespace-normal">{row.boxSummary}</TableCell>
                          <TableCell>{row.looseSachets}</TableCell>
                          <TableCell className="min-w-44 whitespace-normal">{row.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            )}
            
            <TabsContent value="requirement">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={selectAllRecipes}>Select All Recipes</Button>
                  <Button variant="outline" onClick={() => setSelectedRecipeIds([])}>Clear Selection</Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Select</TableHead>
                      <TableHead>Recipe Name</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Production Quantity (Kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No recipes available.</TableCell>
                      </TableRow>
                    )}
                    {recipes.map(recipe => {
                      const product = products.find(item => item.id === recipe.productId);
                      const flavour = flavours.find(item => item.id === recipe.flavourId);
                      return (
                        <TableRow key={recipe.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedRecipeSet.has(recipe.id)}
                              onChange={() => toggleRecipeSelection(recipe.id)}
                              className="h-4 w-4"
                            />
                          </TableCell>
                          <TableCell>{[product?.name, flavour?.name].filter(Boolean).join(' - ') || '-'}</TableCell>
                          <TableCell>{recipe.version}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={productionQtyByRecipe[recipe.id] ?? String(recipe.batchSize)}
                              onChange={event => setProductionQtyByRecipe(prev => ({ ...prev, [recipe.id]: event.target.value }))}
                              className="max-w-40"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                <div className="border-t pt-6">
                  <h3 className="text-xl font-semibold mb-4">Raw Material Requirement</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Total Requirement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialRequirementReport.consolidatedRawMaterials.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">Select recipes to calculate raw material requirement.</TableCell>
                        </TableRow>
                      )}
                      {materialRequirementReport.consolidatedRawMaterials.map(row => (
                        <TableRow key={row.materialId}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.totalRequired} {row.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-xl font-semibold mb-4">Packaging Requirement</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Required Sachet KG</TableHead>
                        <TableHead>Required Rolls</TableHead>
                        <TableHead>Empty Sachets</TableHead>
                        <TableHead>Flavoured Boxes</TableHead>
                        <TableHead>Assorted Boxes</TableHead>
                        <TableHead>Total Boxes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packagingRequirementRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Select recipes to calculate packaging requirement.</TableCell>
                        </TableRow>
                      )}
                      {packagingRequirementRows.map(row => (
                        <TableRow key={row.productId}>
                          <TableCell>{row.productName}</TableCell>
                          <TableCell>{row.sachetRollKg} kg</TableCell>
                          <TableCell>{row.sachetRolls} Roll</TableCell>
                          <TableCell>{row.emptySachets} Nos</TableCell>
                          <TableCell>{row.flavouredBoxes} Nos</TableCell>
                          <TableCell>{row.assortedBoxes} Nos</TableCell>
                          <TableCell>{row.flavouredBoxes + row.assortedBoxes} Nos</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            
            {!isEmployeeB && (
            <TabsContent value="packaging">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Packaging Material</TableHead>
                    <TableHead>Total Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialRequirementReport.consolidatedPackagingMaterials.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-12 text-muted-foreground">Select recipes in Requirement Report to view packaging summary.</TableCell>
                    </TableRow>
                  )}
                  {materialRequirementReport.consolidatedPackagingMaterials.map(material => (
                    <TableRow key={material.materialId}>
                      <TableCell>{material.name}</TableCell>
                      <TableCell>{material.totalRequired} {material.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            )}

            {!isEmployeeB && (
            <TabsContent value="inventory">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material Code</TableHead>
                    <TableHead>Material Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Minimum Stock</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map(material => (
                    <TableRow key={material.id}>
                      <TableCell>{material.code}</TableCell>
                      <TableCell>{material.name}</TableCell>
                      <TableCell>{material.type}</TableCell>
                      <TableCell>{material.stock ?? 0} {material.unit}</TableCell>
                      <TableCell>{material.minStock ?? 0} {material.unit}</TableCell>
                      <TableCell>{material.supplier}</TableCell>
                      <TableCell>{(material.stock ?? 0) <= (material.minStock ?? 0) ? 'Low Stock' : material.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
