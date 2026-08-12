import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { useErpData } from '@/context/ErpContext';
import { Microscope, CopyPlus, Plus, Save } from 'lucide-react';
import { calculateTrialSummary, createTrialIngredientsFromBaseFormula, todayString } from './trialWorksheetUtils';
import {
  type SavedBaseFormulaRecord,
  type SavedTrialRecord,
  type TrialIngredientRecord,
  type TrialStatus,
} from './rndStore';

type TrialDraft = {
  trialId: string;
  trialNumber: string;
  baseFormulaId: string;
  date: string;
  objective: string;
  status: TrialStatus;
  ingredients: TrialIngredientRecord[];
  generalNotes: string;
};

const formatNumber = (value: number) => value.toFixed(2);

const createDraft = (baseFormula: SavedBaseFormulaRecord | null, trialIndex: number): TrialDraft => {
  const nextNumber = String(trialIndex).padStart(4, '0');
  return {
    trialId: `TW-${nextNumber}`,
    trialNumber: `TR-${nextNumber}`,
    baseFormulaId: baseFormula?.id || '',
    date: todayString(),
    objective: '',
    status: 'Draft',
    ingredients: baseFormula ? createTrialIngredientsFromBaseFormula(baseFormula) : [],
    generalNotes: '',
  };
};

export function TrialWorksheet() {
  const { currentUser } = useAuth();
  const { rndBaseFormulas: baseFormulas, rndTrials: savedTrials, saveRndTrial } = useErpData();
  const [trialDraft, setTrialDraft] = useState<TrialDraft>(() => createDraft(null, 1));
  const [message, setMessage] = useState('');

  const canMutate = currentUser.role === 'Employee A';
  const selectedBaseFormula = useMemo(() => baseFormulas.find(record => record.id === trialDraft.baseFormulaId) || null, [baseFormulas, trialDraft.baseFormulaId]);
  const summary = useMemo(() => calculateTrialSummary(trialDraft.ingredients, selectedBaseFormula?.batchSize || 0), [selectedBaseFormula?.batchSize, trialDraft.ingredients]);

  const nextTrialIndex = () => savedTrials.length + 1;

  const updateIngredient = (id: string, trialQuantity: string) => {
    setTrialDraft(previous => ({
      ...previous,
      ingredients: previous.ingredients.map(ingredient => {
        if (ingredient.id !== id) return ingredient;
        const nextTrialQuantity = Number(trialQuantity || 0);
        return {
          ...ingredient,
          trialQuantity: nextTrialQuantity,
          difference: nextTrialQuantity - ingredient.baseQuantity,
        };
      }),
    }));
  };

  const updateDraft = <K extends keyof TrialDraft>(field: K, value: TrialDraft[K]) => {
    setTrialDraft(previous => ({ ...previous, [field]: value }));
  };

  const selectBaseFormula = (baseFormulaId: string) => {
    const baseFormula = baseFormulas.find(record => record.id === baseFormulaId) || null;
    setTrialDraft(createDraft(baseFormula, nextTrialIndex()));
    if (baseFormula) {
      setMessage('Base formula loaded into a new trial draft.');
    }
  };

  const createTrial = () => {
    const baseFormula = baseFormulas.find(record => record.id === trialDraft.baseFormulaId) || null;
    if (!baseFormula) {
      setMessage('Select a base formula first.');
      return;
    }

    setTrialDraft(createDraft(baseFormula, nextTrialIndex()));
    setMessage(`Trial draft created for ${baseFormula.productName}.`);
  };

  const duplicateTrial = () => {
    if (!trialDraft.baseFormulaId) {
      setMessage('Create or select a trial first.');
      return;
    }

    const duplicateIndex = nextTrialIndex();
    setTrialDraft(previous => ({
      ...previous,
      trialId: `TW-${String(duplicateIndex).padStart(4, '0')}`,
      trialNumber: `TR-${String(duplicateIndex).padStart(4, '0')}`,
      date: todayString(),
      status: 'Draft',
      ingredients: previous.ingredients.map(ingredient => ({ ...ingredient })),
    }));
    setMessage('Trial draft duplicated as a new snapshot.');
  };

  const saveTrial = () => {
    const baseFormula = baseFormulas.find(record => record.id === trialDraft.baseFormulaId) || null;
    if (!baseFormula) {
      setMessage('Base Formula required.');
      return;
    }
    if (!trialDraft.objective.trim()) {
      setMessage('Objective required.');
      return;
    }
    if (trialDraft.ingredients.length === 0) {
      setMessage('Ingredient required.');
      return;
    }
    if (trialDraft.ingredients.some(ingredient => ingredient.trialQuantity < 0 || ingredient.baseQuantity < 0)) {
      setMessage('No negative quantities.');
      return;
    }

    const nextTrial: SavedTrialRecord = {
      id: `trial-save-${Date.now()}`,
      trialId: trialDraft.trialId,
      trialNumber: trialDraft.trialNumber,
      baseFormulaId: baseFormula.id,
      baseFormulaName: baseFormula.productName,
      date: trialDraft.date,
      objective: trialDraft.objective,
      status: trialDraft.status,
      totalWeight: summary.totalWeight,
      remainingSpace: summary.remainingSpace,
      milkNeeded: summary.milkNeeded,
      generalNotes: trialDraft.generalNotes,
      ingredients: trialDraft.ingredients.map(ingredient => ({ ...ingredient })),
    };

    saveRndTrial(nextTrial);
    setMessage(`Trial ${trialDraft.trialId} saved.`);

    const nextBaseFormula = baseFormulas.find(record => record.id === trialDraft.baseFormulaId) || null;
    setTrialDraft(createDraft(nextBaseFormula, nextTrialIndex()));
  };

  const baseFormulaOptions = baseFormulas;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <Microscope className="h-3.5 w-3.5" />
          Research & Development
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Trial Worksheet</h2>
          <p className="text-sm text-muted-foreground">Trial snapshots stay separate from base formulas and are never overwritten.</p>
        </div>
      </div>

      {!canMutate && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Boss access is view only. Trial creation, duplication, and saving are disabled.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Trial Header</CardTitle>
            <CardDescription>Each trial belongs to one base formula. Trial ID is auto-generated.</CardDescription>
          </div>
          {canMutate && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={createTrial} disabled={baseFormulaOptions.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                Create Trial
              </Button>
              <Button variant="outline" onClick={duplicateTrial} disabled={!trialDraft.baseFormulaId}>
                <CopyPlus className="mr-2 h-4 w-4" />
                Duplicate Trial
              </Button>
              <Button onClick={saveTrial} disabled={!trialDraft.baseFormulaId || baseFormulaOptions.length === 0}>
                <Save className="mr-2 h-4 w-4" />
                Save Trial
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{message}</div>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Trial ID</label>
              <Input value={trialDraft.trialId} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Trial Number</label>
              <Input value={trialDraft.trialNumber} onChange={event => updateDraft('trialNumber', event.target.value)} disabled={!canMutate} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input value={trialDraft.date} disabled />
            </div>
            <div className="space-y-2 xl:col-span-2">
              <label className="text-sm font-medium">Base Formula</label>
              <Select value={trialDraft.baseFormulaId} onValueChange={selectBaseFormula} disabled={!canMutate || baseFormulaOptions.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Select base formula" />
                </SelectTrigger>
                <SelectContent>
                  {baseFormulaOptions.map(baseFormula => (
                    <SelectItem key={baseFormula.id} value={baseFormula.id}>
                      {baseFormula.baseFormulaNumber} - {baseFormula.productName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={trialDraft.status} onValueChange={value => updateDraft('status', value as TrialStatus)} disabled={!canMutate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Selected">Selected</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 xl:col-span-3">
              <label className="text-sm font-medium">Objective</label>
              <Input value={trialDraft.objective} onChange={event => updateDraft('objective', event.target.value)} disabled={!canMutate} placeholder="Enter trial objective" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingredient Grid</CardTitle>
          <CardDescription>Base formula ingredients are shown here. Only Trial Quantity can be modified.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead className="text-right">Base Quantity</TableHead>
                  <TableHead className="text-right">Trial Quantity</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trialDraft.ingredients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      Select a base formula to load ingredients.
                    </TableCell>
                  </TableRow>
                ) : (
                  trialDraft.ingredients.map(ingredient => (
                    <TableRow key={ingredient.id}>
                      <TableCell>
                        <div className="font-medium">{ingredient.ingredientName}</div>
                        <div className="text-xs text-muted-foreground">{ingredient.manufacturer}</div>
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(ingredient.baseQuantity)}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          value={ingredient.trialQuantity}
                          onChange={event => updateIngredient(ingredient.id, event.target.value)}
                          disabled={!canMutate}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(ingredient.difference)}</TableCell>
                      <TableCell>{ingredient.remarks || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalWeight)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Remaining Space</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.remainingSpace)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Milk Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.milkNeeded)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saved Trials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedTrials.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Notes</CardTitle>
          <CardDescription>Keep trial observations here for R&D only.</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            className="flex min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={trialDraft.generalNotes}
            onChange={event => updateDraft('generalNotes', event.target.value)}
            disabled={!canMutate}
            placeholder="Enter general notes"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Trials</CardTitle>
          <CardDescription>Each saved trial remains separate and is never overwritten.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trial ID</TableHead>
                  <TableHead>Trial Number</TableHead>
                  <TableHead>Base Formula</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Weight</TableHead>
                  <TableHead className="text-right">Remaining Space</TableHead>
                  <TableHead className="text-right">Milk Needed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedTrials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                      No trials saved yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  savedTrials.map(trial => (
                    <TableRow key={trial.id}>
                      <TableCell className="font-medium">{trial.trialId}</TableCell>
                      <TableCell>{trial.trialNumber}</TableCell>
                      <TableCell>{trial.baseFormulaName}</TableCell>
                      <TableCell>{trial.date}</TableCell>
                      <TableCell>{trial.status}</TableCell>
                      <TableCell className="text-right">{formatNumber(trial.totalWeight)}</TableCell>
                      <TableCell className="text-right">{formatNumber(trial.remainingSpace)}</TableCell>
                      <TableCell className="text-right">{formatNumber(trial.milkNeeded)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
