import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { BarChart3, FileSpreadsheet, FileText, Filter, Printer, Search, PieChart } from 'lucide-react';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip } from 'recharts';
import { exportReportToExcel, exportReportToPdf, printReport, type ReportColumn } from './rndReportExports';
import {
  buildAssessmentReportRows,
  buildFormulaLibraryReportRows,
  buildSampleInventoryReportRows,
  buildTrialHistoryReportRows,
  getFormulaStatusChartData,
  getSampleStatusChartData,
  getTrialStatusChartData,
} from './rndReportsData';

type ReportKey = 'formulaLibrary' | 'trialHistory' | 'sampleInventory' | 'assessment';
type SortDirection = 'asc' | 'desc';
type GenericRow = Record<string, string | number>;

type ReportConfig = {
  key: ReportKey;
  title: string;
  description: string;
  rows: GenericRow[];
  columns: ReportColumn<GenericRow>[];
  filterField?: string;
  filterOptions?: Array<{ label: string; value: string }>;
};

const COLORS = ['#0f766e', '#2563eb', '#f59e0b', '#16a34a', '#dc2626'];

const statusBadgeVariant = (value: string) => {
  const normalized = value.toLowerCase();
  if (normalized.includes('current') || normalized.includes('approved') || normalized.includes('saved')) return 'default';
  if (normalized.includes('archived') || normalized.includes('rejected') || normalized.includes('depleted')) return 'destructive';
  if (normalized.includes('pending') || normalized.includes('draft') || normalized.includes('low')) return 'secondary';
  return 'outline';
};

const formatCell = (value: string | number) => (typeof value === 'number' ? value.toFixed(2) : value);

const searchRows = (rows: GenericRow[], query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;
  return rows.filter(row => Object.values(row).some(value => String(value).toLowerCase().includes(normalized)));
};

const filterRows = (rows: GenericRow[], filterField: string | undefined, filterValue: string) => {
  if (!filterField || filterValue === 'all') return rows;
  return rows.filter(row => String(row[filterField] ?? '').toLowerCase() === filterValue.toLowerCase());
};

const sortRows = (rows: GenericRow[], sortField: string, direction: SortDirection) => [...rows].sort((left, right) => {
  const leftValue = left[sortField];
  const rightValue = right[sortField];
  const leftString = String(leftValue ?? '').toLowerCase();
  const rightString = String(rightValue ?? '').toLowerCase();
  if (leftString < rightString) return direction === 'asc' ? -1 : 1;
  if (leftString > rightString) return direction === 'asc' ? 1 : -1;
  return 0;
});

export function RndReports() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportKey>('formulaLibrary');
  const [searchQueries, setSearchQueries] = useState<Record<ReportKey, string>>({ formulaLibrary: '', trialHistory: '', sampleInventory: '', assessment: '' });
  const [filters, setFilters] = useState<Record<ReportKey, string>>({ formulaLibrary: 'all', trialHistory: 'all', sampleInventory: 'all', assessment: 'all' });
  const [sortFields, setSortFields] = useState<Record<ReportKey, string>>({ formulaLibrary: 'createdDate', trialHistory: 'date', sampleInventory: 'receivedDate', assessment: 'date' });
  const [sortDirections, setSortDirections] = useState<Record<ReportKey, SortDirection>>({ formulaLibrary: 'desc', trialHistory: 'desc', sampleInventory: 'desc', assessment: 'desc' });

  const reportConfigs: ReportConfig[] = useMemo(() => ([
    {
      key: 'formulaLibrary',
      title: 'Formula Library Report',
      description: 'Approved and historical formula versions with trial references.',
      rows: buildFormulaLibraryReportRows(),
      columns: [
        { header: 'Product', accessor: 'product' },
        { header: 'Formula ID', accessor: 'formulaId' },
        { header: 'Version', accessor: 'version' },
        { header: 'Created Date', accessor: 'createdDate' },
        { header: 'Created By', accessor: 'createdBy' },
        { header: 'Status', accessor: 'status' },
        { header: 'Trial Reference', accessor: 'trialReference' },
      ],
      filterField: 'status',
      filterOptions: ['all', 'Draft', 'Under Testing', 'Approved', 'Current', 'Archived'].map(value => ({ value, label: value === 'all' ? 'All Statuses' : value })),
    },
    {
      key: 'trialHistory',
      title: 'Trial History Report',
      description: 'All saved trials with assessment state and trial summary.',
      rows: buildTrialHistoryReportRows(),
      columns: [
        { header: 'Trial ID', accessor: 'trialId' },
        { header: 'Trial Number', accessor: 'trialNumber' },
        { header: 'Base Formula', accessor: 'baseFormula' },
        { header: 'Date', accessor: 'date' },
        { header: 'Objective', accessor: 'objective' },
        { header: 'Status', accessor: 'status' },
        { header: 'Assessment Status', accessor: 'assessmentStatus' },
        { header: 'Verdict', accessor: 'verdict' },
        { header: 'Total Weight', accessor: 'totalWeight' },
      ],
      filterField: 'status',
      filterOptions: ['all', 'Draft', 'In Progress', 'Completed', 'Selected', 'Rejected'].map(value => ({ value, label: value === 'all' ? 'All Statuses' : value })),
    },
    {
      key: 'sampleInventory',
      title: 'Sample Inventory Report',
      description: 'Raw-material sample movements, balance, and status tracking.',
      rows: buildSampleInventoryReportRows(),
      columns: [
        { header: 'Sample ID', accessor: 'sampleId' },
        { header: 'Raw Material', accessor: 'rawMaterial' },
        { header: 'Manufacturer', accessor: 'manufacturer' },
        { header: 'Batch Number', accessor: 'batchNumber' },
        { header: 'Received Date', accessor: 'receivedDate' },
        { header: 'Received Qty', accessor: 'receivedQuantity' },
        { header: 'Unit', accessor: 'unit' },
        { header: 'Current Balance', accessor: 'currentBalance' },
        { header: 'Status', accessor: 'status' },
      ],
      filterField: 'status',
      filterOptions: ['all', 'Available', 'Low Stock', 'Depleted'].map(value => ({ value, label: value === 'all' ? 'All Statuses' : value })),
    },
    {
      key: 'assessment',
      title: 'Assessment Report',
      description: 'Linked trial assessment detail with verdict and next action.',
      rows: buildAssessmentReportRows(),
      columns: [
        { header: 'Trial ID', accessor: 'trialId' },
        { header: 'Trial Number', accessor: 'trialNumber' },
        { header: 'Base Formula', accessor: 'baseFormula' },
        { header: 'Date', accessor: 'date' },
        { header: 'Taste', accessor: 'tasteScore' },
        { header: 'Texture', accessor: 'textureScore' },
        { header: 'Smell', accessor: 'smellScore' },
        { header: 'Colour', accessor: 'colourScore' },
        { header: 'pH', accessor: 'ph' },
        { header: 'Verdict', accessor: 'verdict' },
        { header: 'Next Action', accessor: 'nextAction' },
      ],
      filterField: 'verdict',
      filterOptions: ['all', 'Pass', 'Fail', 'Need Modification', 'Approved for Next Stage'].map(value => ({ value, label: value === 'all' ? 'All Verdicts' : value })),
    },
  ]), []);

  const activeReport = reportConfigs.find(report => report.key === activeTab) || reportConfigs[0];
  const searchQuery = searchQueries[activeTab];
  const filterValue = filters[activeTab];
  const sortField = sortFields[activeTab];
  const sortDirection = sortDirections[activeTab];

  const filteredRows = useMemo(() => {
    const searched = searchRows(activeReport.rows, searchQuery);
    const filtered = filterRows(searched, activeReport.filterField, filterValue);
    return sortRows(filtered, sortField, sortDirection);
  }, [activeReport.filterField, activeReport.rows, filterValue, searchQuery, sortDirection, sortField]);

  const exportActiveToExcel = () => exportReportToExcel(activeReport.title, activeReport.columns, filteredRows);
  const exportActiveToPdf = () => exportReportToPdf(activeReport.title, activeReport.columns, filteredRows);
  const printActiveReport = () => printReport(activeReport.title, activeReport.columns, filteredRows);

  const formulaStatus = getFormulaStatusChartData();
  const trialStatus = getTrialStatusChartData();
  const sampleStatus = getSampleStatusChartData();

  const chartBlocks = [
    { title: 'Formula Status', data: formulaStatus },
    { title: 'Trial Status', data: trialStatus },
    { title: 'Sample Inventory Status', data: sampleStatus },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <BarChart3 className="h-3.5 w-3.5" />
          Research & Development
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary">R&D Reports</h2>
          <p className="text-sm text-muted-foreground">Search, filter, sort, export, and print across the R&D workspace.</p>
          <p className="text-xs text-muted-foreground">Current user: {currentUser.role}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={value => setActiveTab(value as ReportKey)}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 md:grid-cols-4">
          <TabsTrigger value="formulaLibrary">Formula Library</TabsTrigger>
          <TabsTrigger value="trialHistory">Trial History</TabsTrigger>
          <TabsTrigger value="sampleInventory">Sample Inventory</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
        </TabsList>

        {reportConfigs.map(report => (
          <TabsContent key={report.key} value={report.key} className="mt-6 space-y-4">
            <Card>
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle>{report.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{report.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={exportActiveToPdf}>
                      <FileText className="mr-2 h-4 w-4" />
                      Export PDF
                    </Button>
                    <Button variant="outline" onClick={exportActiveToExcel}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Export Excel
                    </Button>
                    <Button variant="outline" onClick={printActiveReport}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2 xl:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium"><Search className="h-4 w-4" /> Search</label>
                    <Input value={searchQuery} onChange={event => setSearchQueries(previous => ({ ...previous, [report.key]: event.target.value }))} placeholder="Search rows" />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium"><Filter className="h-4 w-4" /> Filter</label>
                    <Select value={filterValue} onValueChange={value => setFilters(previous => ({ ...previous, [report.key]: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select filter" />
                      </SelectTrigger>
                      <SelectContent>
                        {report.filterOptions?.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort</label>
                    <div className="flex gap-2">
                      <Select value={sortField} onValueChange={value => setSortFields(previous => ({ ...previous, [report.key]: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {report.columns.map(column => (
                            <SelectItem key={column.accessor} value={String(column.accessor)}>{column.header}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" onClick={() => setSortDirections(previous => ({ ...previous, [report.key]: previous[report.key] === 'asc' ? 'desc' : 'asc' }))}>
                        {sortDirection === 'asc' ? 'Asc' : 'Desc'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {report.columns.map(column => (
                          <TableHead key={column.accessor}>{column.header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={report.columns.length} className="py-8 text-center text-sm text-muted-foreground">No rows found.</TableCell>
                        </TableRow>
                      ) : filteredRows.map((row, index) => (
                        <TableRow key={`${report.key}-${index}`}>
                          {report.columns.map(column => {
                            const value = row[column.accessor];
                            const displayValue = column.format ? column.format(value, row) : formatCell(value);
                            return (
                              <TableCell key={String(column.accessor)}>
                                {column.accessor === 'status' || column.accessor === 'verdict' || column.accessor === 'assessmentStatus' ? (
                                  <Badge variant={statusBadgeVariant(String(displayValue))}>{displayValue}</Badge>
                                ) : (
                                  displayValue
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="grid gap-4 xl:grid-cols-3">
        {chartBlocks.map(block => (
          <Card key={block.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="h-4 w-4" />
                {block.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={block.data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={90} paddingAngle={4}>
                    {block.data.map((entry, index) => (
                      <Cell key={`${block.title}-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}