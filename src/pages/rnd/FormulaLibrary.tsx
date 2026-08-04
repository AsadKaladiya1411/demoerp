import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { Archive, BookOpen, GitCompareArrows, Plus } from 'lucide-react';
import {
  archiveFormulaVersion,
  buildFormulaVersionFromApprovedTrial,
  getApprovedTrials,
  getFormulaVersions,
  saveFormulaVersion,
  type FormulaVersionRecord,
} from './rndStore';

const formatNumber = (value: number) => value.toFixed(2);

const statusTone = (status: FormulaVersionRecord['status']) => {
  if (status === 'Current' || status === 'Approved') return 'default';
  if (status === 'Under Testing' || status === 'Draft') return 'secondary';
  return 'outline';
};

const summarizeVersion = (version: FormulaVersionRecord) => ({
  ingredientCount: version.ingredients.length,
  totalWeight: version.ingredients.reduce((sum, ingredient) => sum + ingredient.qtyPerBatch, 0),
  totalProtein: version.ingredients.reduce((sum, ingredient) => sum + ingredient.proteinContribution, 0),
  totalCost: version.ingredients.reduce((sum, ingredient) => sum + ingredient.costContribution, 0),
});

const mergeIngredientNames = (left: FormulaVersionRecord, right: FormulaVersionRecord) => {
  const names = new Set([
    ...left.ingredients.map(ingredient => ingredient.ingredientName),
    ...right.ingredients.map(ingredient => ingredient.ingredientName),
  ]);

  return Array.from(names).sort();
};

export function FormulaLibrary() {
  const { currentUser } = useAuth();
  const [formulaVersions, setFormulaVersions] = useState<FormulaVersionRecord[]>(() => getFormulaVersions());
  const [approvedTrials, setApprovedTrials] = useState(() => getApprovedTrials());
  const [selectedProductFilter, setSelectedProductFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedTrialId, setSelectedTrialId] = useState(() => getApprovedTrials()[0]?.trialId || '');
  const [compareProductId, setCompareProductId] = useState('all');
  const [compareLeftId, setCompareLeftId] = useState('');
  const [compareRightId, setCompareRightId] = useState('');
  const [message, setMessage] = useState('');

  const canMutate = currentUser.role === 'Employee A';

  const refreshData = () => {
    const nextVersions = getFormulaVersions();
    const nextTrials = getApprovedTrials();
    setFormulaVersions(nextVersions);
    setApprovedTrials(nextTrials);
    if (selectedProductFilter !== 'all' && !nextVersions.some(version => version.productId === selectedProductFilter)) {
      setSelectedProductFilter('all');
    }
    if (compareProductId !== 'all' && !nextVersions.some(version => version.productId === compareProductId)) {
      setCompareProductId('all');
    }
    return { nextVersions, nextTrials };
  };

  const productOptions = useMemo(() => {
    const products = new Map<string, string>();
    formulaVersions.forEach(version => {
      products.set(version.productId, version.productName);
    });
    return Array.from(products.entries()).map(([id, name]) => ({ id, name }));
  }, [formulaVersions]);

  const filteredVersions = useMemo(
    () => selectedProductFilter === 'all' ? formulaVersions : formulaVersions.filter(version => version.productId === selectedProductFilter),
    [formulaVersions, selectedProductFilter]
  );

  const compareVersions = useMemo(
    () => compareProductId === 'all' ? formulaVersions : formulaVersions.filter(version => version.productId === compareProductId),
    [compareProductId, formulaVersions]
  );

  const compareLeft = compareVersions.find(version => version.id === compareLeftId) || compareVersions[0] || null;
  const compareRight = compareVersions.find(version => version.id === compareRightId) || compareVersions[1] || null;

  const openCreateDialog = () => {
    const nextTrials = getApprovedTrials();
    setApprovedTrials(nextTrials);
    setSelectedTrialId(nextTrials[0]?.trialId || '');
    setMessage('');
    setCreateOpen(true);
  };

  const handleCreateVersion = () => {
    if (!selectedTrialId) {
      setMessage('Select an approved trial first.');
      return;
    }

    const record = buildFormulaVersionFromApprovedTrial(selectedTrialId, currentUser.name);
    if (!record) {
      setMessage('Only approved trials can be stored as formula versions.');
      return;
    }

    saveFormulaVersion(record);
    const { nextVersions } = refreshData();
    setSelectedProductFilter(record.productId);
    setCompareProductId(record.productId);
    setCompareLeftId(record.id);
    setCompareRightId(nextVersions.find(version => version.productId === record.productId && version.id !== record.id)?.id || '');
    setMessage(`Formula ${record.formulaId} created from ${record.trialReference}.`);
    setCreateOpen(false);
  };

  const handleArchiveVersion = (formulaId: string) => {
    archiveFormulaVersion(formulaId);
    refreshData();
    setMessage('Version archived.');
  };

  const compareIngredientNames = compareLeft && compareRight ? mergeIngredientNames(compareLeft, compareRight) : [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <BookOpen className="h-3.5 w-3.5" />
          Research & Development
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Formula Library</h2>
          <p className="text-sm text-muted-foreground">Approved formula versions only. Old versions are kept and never deleted.</p>
        </div>
      </div>

      {!canMutate && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Boss access is view only. Version creation and archiving are disabled.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Formula Version Register</CardTitle>
            <CardDescription>Each product can have multiple versions, but only one can remain current.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setCompareOpen(true)} disabled={formulaVersions.length < 2}>
              <GitCompareArrows className="mr-2 h-4 w-4" />
              Compare Versions
            </Button>
            {canMutate && (
              <Button onClick={openCreateDialog} disabled={approvedTrials.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Version
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{message}</div>}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Product</label>
              <Select value={selectedProductFilter} onValueChange={setSelectedProductFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  {productOptions.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Approved Trials Available</label>
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                {approvedTrials.length > 0 ? `${approvedTrials.length} approved trial${approvedTrials.length > 1 ? 's' : ''} ready for version creation` : 'No approved trials found.'}
              </div>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Formula ID</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trial Reference</TableHead>
                  {canMutate && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVersions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canMutate ? 8 : 7} className="py-8 text-center text-sm text-muted-foreground">
                      No formula versions stored yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVersions.map(version => (
                    <TableRow key={version.id}>
                      <TableCell className="font-medium">{version.productName}</TableCell>
                      <TableCell>{version.formulaId}</TableCell>
                      <TableCell>{version.version}</TableCell>
                      <TableCell>{version.createdDate}</TableCell>
                      <TableCell>{version.createdBy}</TableCell>
                      <TableCell>
                        <Badge variant={statusTone(version.status)}>{version.status}</Badge>
                      </TableCell>
                      <TableCell>{version.trialReference}</TableCell>
                      {canMutate && (
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleArchiveVersion(version.id)} disabled={version.status === 'Archived'}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive Version
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>Select an approved trial. The new version will become current for that product.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Approved Trial</label>
              <Select value={selectedTrialId} onValueChange={setSelectedTrialId} disabled={approvedTrials.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select approved trial" />
                </SelectTrigger>
                <SelectContent>
                  {approvedTrials.map(trial => (
                    <SelectItem key={trial.trialId} value={trial.trialId}>
                      {trial.trialId} - {trial.baseFormulaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">Current</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Formula ID</label>
                <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">Auto</div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateVersion} disabled={!selectedTrialId || approvedTrials.length === 0}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Compare Versions</DialogTitle>
            <DialogDescription>Compare two versions for the selected product. Old versions remain in history.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-medium">Product</label>
              <Select value={compareProductId} onValueChange={value => {
                setCompareProductId(value);
                const next = value === 'all' ? formulaVersions : formulaVersions.filter(version => version.productId === value);
                setCompareLeftId(next[0]?.id || '');
                setCompareRightId(next[1]?.id || '');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  {productOptions.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Version A</label>
              <Select value={compareLeftId} onValueChange={setCompareLeftId} disabled={compareVersions.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {compareVersions.map(version => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.version} - {version.formulaId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Version B</label>
              <Select value={compareRightId} onValueChange={setCompareRightId} disabled={compareVersions.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version" />
                </SelectTrigger>
                <SelectContent>
                  {compareVersions.map(version => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.version} - {version.formulaId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end justify-end">
              <Button variant="outline" onClick={() => {
                const next = compareProductId === 'all' ? formulaVersions : formulaVersions.filter(version => version.productId === compareProductId);
                setCompareLeftId(next[0]?.id || '');
                setCompareRightId(next[1]?.id || '');
              }} disabled={compareVersions.length < 2}>
                <GitCompareArrows className="mr-2 h-4 w-4" />
                Load Pairs
              </Button>
            </div>
          </div>

          {compareLeft && compareRight ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {[compareLeft, compareRight].map(version => {
                  const summary = summarizeVersion(version);
                  return (
                    <Card key={version.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-2 text-base">
                          <span>{version.formulaId}</span>
                          <Badge variant={statusTone(version.status)}>{version.status}</Badge>
                        </CardTitle>
                        <CardDescription>{version.productName} - {version.version}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Created Date</span><span>{version.createdDate}</span></div>
                        <div className="flex justify-between"><span>Created By</span><span>{version.createdBy}</span></div>
                        <div className="flex justify-between"><span>Trial Reference</span><span>{version.trialReference}</span></div>
                        <div className="flex justify-between"><span>Total Weight</span><span>{formatNumber(summary.totalWeight)}</span></div>
                        <div className="flex justify-between"><span>Total Protein</span><span>{formatNumber(summary.totalProtein)}</span></div>
                        <div className="flex justify-between"><span>Total Cost</span><span>{formatNumber(summary.totalCost)}</span></div>
                        <div className="flex justify-between"><span>Ingredients</span><span>{summary.ingredientCount}</span></div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingredient</TableHead>
                      <TableHead className="text-right">Version A Qty</TableHead>
                      <TableHead className="text-right">Version B Qty</TableHead>
                      <TableHead className="text-right">Difference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compareIngredientNames.map(name => {
                      const leftIngredient = compareLeft.ingredients.find(ingredient => ingredient.ingredientName === name);
                      const rightIngredient = compareRight.ingredients.find(ingredient => ingredient.ingredientName === name);
                      const leftQty = leftIngredient?.qtyPerBatch || 0;
                      const rightQty = rightIngredient?.qtyPerBatch || 0;
                      return (
                        <TableRow key={name}>
                          <TableCell>{name}</TableCell>
                          <TableCell className="text-right">{formatNumber(leftQty)}</TableCell>
                          <TableCell className="text-right">{formatNumber(rightQty)}</TableCell>
                          <TableCell className="text-right">{formatNumber(rightQty - leftQty)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="rounded-md border bg-muted/20 px-3 py-8 text-center text-sm text-muted-foreground">
              Select two versions from the same product to compare them.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}