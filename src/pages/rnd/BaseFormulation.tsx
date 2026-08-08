import { useMemo, useState, type WheelEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/AuthContext';
import { useErpData } from '@/context/ErpContext';
import { Plus, Trash2, Microscope, Save } from 'lucide-react';
import { calculateBaseFormulaSummary, createIngredientDraft, todayString, type BaseFormulaIngredientDraft } from './baseFormulaUtils';
import { getBaseFormulas, getNextBaseFormulaNumber, saveBaseFormula } from './rndStore';

type SavedBaseFormula = {
  id: string;
  productName: string;
  date: string;
  batchSize: number;
  servingSize: number;
  proteinPerServing: number;
  rmCostPerServing: number;
  basePercentage: number;
  totalCost: number;
  totalProtein: number;
  ingredientCount: number;
};

const createInitialIngredients = (): BaseFormulaIngredientDraft[] => [createIngredientDraft('ingredient-1')];

const formatNumber = (value: number) => value.toFixed(2);
const manualNumberInputClassName = 'w-32 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

const preventNumberWheel = (event: WheelEvent<HTMLInputElement>) => {
  event.preventDefault();
};

export function BaseFormulation() {
  const { currentUser } = useAuth();
  const { materials } = useErpData();
  const _rawMaterials = useMemo(() => materials.filter(material => material.type === 'Raw Material'), [materials]);
  void _rawMaterials;
  const [savedFormulas, setSavedFormulas] = useState<SavedBaseFormula[]>(() => getBaseFormulas().map(record => ({
    id: record.id,
    productName: record.productName,
    date: record.date,
    batchSize: record.batchSize,
    servingSize: record.servingSize,
    proteinPerServing: record.proteinPerServing,
    rmCostPerServing: record.rmCostPerServing,
    basePercentage: record.basePercentage,
    totalCost: record.totalCost,
    totalProtein: record.totalProtein,
    ingredientCount: record.ingredientCount,
  })));
  const [formulaId, setFormulaId] = useState(() => `BF-${getNextBaseFormulaNumber()}`);
  const [productName, setProductName] = useState('');
  const [formulaDate, setFormulaDate] = useState(todayString());
  const [batchSize, setBatchSize] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [ingredients, setIngredients] = useState<BaseFormulaIngredientDraft[]>(createInitialIngredients);
  const [message, setMessage] = useState('');

  const canMutate = currentUser.role === 'Employee A';
  const batchSizeValue = Number(batchSize || 0);
  const servingSizeValue = Number(servingSize || 0);
  const summary = useMemo(() => calculateBaseFormulaSummary(ingredients, batchSizeValue, servingSizeValue), [batchSizeValue, ingredients, servingSizeValue]);

  const updateIngredient = (id: string, field: keyof BaseFormulaIngredientDraft, value: string) => {
    setIngredients(previous => previous.map(ingredient => (ingredient.id === id ? { ...ingredient, [field]: value } : ingredient)));
  };

  const addIngredient = () => {
    setIngredients(previous => [...previous, createIngredientDraft(`ingredient-${Date.now()}`)]);
  };

  const removeIngredient = (id: string) => {
    setIngredients(previous => (previous.length === 1 ? previous : previous.filter(ingredient => ingredient.id !== id)));
  };

  const clearForm = (nextFormulaNumber: number) => {
    setFormulaId(`BF-${String(nextFormulaNumber).padStart(4, '0')}`);
    setProductName('');
    setFormulaDate(todayString());
    setBatchSize('');
    setServingSize('');
    setIngredients(createInitialIngredients());
  };

  const validateAndSave = () => {
    const batch = Number(batchSize || 0);
    const serving = Number(servingSize || 0);
    const validIngredients = ingredients.filter(ingredient => (ingredient.materialName || '').trim());
    const trimmedProductName = productName.trim();

    if (!trimmedProductName) {
      setMessage('Product required.');
      return;
    }
    if (!batch || batch <= 0 || !serving || serving <= 0) {
      setMessage('Batch Size and Serving Size must be greater than zero.');
      return;
    }
    if (summary.basePercentage !== 100) {
      setMessage('Formula Coverage must equal exactly 100%.');
      return;
    }
    if (validIngredients.length === 0) {
      setMessage('Ingredient required.');
      return;
    }

    for (const ingredient of validIngredients) {
      const quantity = Number(ingredient.quantityPer100g || 0);
      const proteinPercent = Number(ingredient.proteinPercent || 0);
      const proteinContribution = Number(ingredient.proteinContribution || 0);
      const costPerKg = Number(ingredient.costPerKg || 0);

      if (quantity < 0 || proteinPercent < 0 || proteinContribution < 0 || costPerKg < 0) {
        setMessage('No negative quantities.');
        return;
      }
      if (quantity === 0) {
        setMessage('Ingredient quantity must be greater than zero.');
        return;
      }
    }

    const savedRecord: SavedBaseFormula = {
      id: formulaId,
      productName: trimmedProductName,
      date: formulaDate,
      batchSize: batch,
      servingSize: serving,
      proteinPerServing: summary.proteinPerServing,
      rmCostPerServing: summary.rmCostPerServing,
      basePercentage: summary.basePercentage,
      totalCost: summary.totalCost,
      totalProtein: summary.totalProtein,
      ingredientCount: validIngredients.length,
    };

    saveBaseFormula({
      id: savedRecord.id,
      baseFormulaNumber: savedRecord.id,
      productId: trimmedProductName,
      productName: trimmedProductName,
      date: savedRecord.date,
      batchSize: savedRecord.batchSize,
      servingSize: savedRecord.servingSize,
      proteinPerServing: savedRecord.proteinPerServing,
      rmCostPerServing: savedRecord.rmCostPerServing,
      basePercentage: savedRecord.basePercentage,
      totalCost: savedRecord.totalCost,
      totalProtein: savedRecord.totalProtein,
      ingredientCount: savedRecord.ingredientCount,
      ingredients: validIngredients.map(ingredient => {
        const quantityPer100g = Number(ingredient.quantityPer100g || 0);
        const proteinPercent = Number(ingredient.proteinPercent || 0);
        const proteinContribution = (proteinPercent * quantityPer100g) / 100;
        return {
          ...ingredient,
          proteinContribution: proteinContribution.toFixed(2),
          materialId: '',
          rawMaterialName: ingredient.materialName || '',
          manufacturer: '',
          uom: '',
        };
      }),
    });

    setSavedFormulas(getBaseFormulas().map(record => ({
      id: record.id,
      productName: record.productName,
      date: record.date,
      batchSize: record.batchSize,
      servingSize: record.servingSize,
      proteinPerServing: record.proteinPerServing,
      rmCostPerServing: record.rmCostPerServing,
      basePercentage: record.basePercentage,
      totalCost: record.totalCost,
      totalProtein: record.totalProtein,
      ingredientCount: record.ingredientCount,
    })));
    setMessage(`Base Formula ${formulaId} saved.`);
    clearForm(getBaseFormulas().length + 1);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <Microscope className="h-3.5 w-3.5" />
          Research & Development
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Base Formulation</h2>
          <p className="text-sm text-muted-foreground">Core R&D laboratory formula builder with local calculations only.</p>
        </div>
      </div>

      {!canMutate && (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Boss access is view only. Formula editing, ingredient changes, and saving are disabled.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Formula Header</CardTitle>
            <CardDescription>Base Formula ID and Date are auto-managed. Other fields stay within the R&D module.</CardDescription>
          </div>
          <Button onClick={validateAndSave} className="w-fit" disabled={!canMutate}>
            <Save className="mr-2 h-4 w-4" />
            Save Base Formula
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{message}</div>}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 xl:col-span-2">
              <label className="text-sm font-medium">Product</label>
              <Input
                value={productName}
                onChange={event => setProductName(event.target.value)}
                placeholder="Enter product name"
                disabled={!canMutate}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Base Formula ID</label>
              <Input value={formulaId} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input value={formulaDate} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Batch Size</label>
              <Input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={batchSize}
                onChange={event => setBatchSize(event.target.value)}
                onWheel={preventNumberWheel}
                className={manualNumberInputClassName}
                disabled={!canMutate}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Serving Size</label>
              <Input
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={servingSize}
                onChange={event => setServingSize(event.target.value)}
                onWheel={preventNumberWheel}
                className={manualNumberInputClassName}
                disabled={!canMutate}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Protein Per Serving</label>
              <Input value={formatNumber(summary.proteinPerServing)} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">RM Cost Per Serving</label>
              <Input value={formatNumber(summary.rmCostPerServing)} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Base Percentage</label>
              <Input value={formatNumber(summary.basePercentage)} disabled />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Ingredient Grid</CardTitle>
            <CardDescription>Rows stay local to the R&D formula and support add/remove operations.</CardDescription>
          </div>
          {canMutate && (
            <Button variant="outline" onClick={addIngredient} className="w-fit">
              <Plus className="mr-2 h-4 w-4" />
              Add Ingredient
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raw Material</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>UOM</TableHead>
                  <TableHead className="text-right">Qty / 100g</TableHead>
                  <TableHead className="text-right">Qty / Serving</TableHead>
                  <TableHead className="text-right">Qty / Batch</TableHead>
                  <TableHead className="text-right">Protein %</TableHead>
                  <TableHead className="text-right">Protein Contribution</TableHead>
                  <TableHead className="text-right">Cost / Kg</TableHead>
                  <TableHead className="text-right">Cost Contribution</TableHead>
                  <TableHead>Remarks</TableHead>
                  {canMutate && <TableHead className="text-right">Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ingredient) => {
                  
                  const quantityPer100g = Number(ingredient.quantityPer100g || 0);
                  const quantityPerServing = quantityPer100g * (servingSizeValue / 100);
                  const quantityPerBatch = quantityPer100g * (batchSizeValue / 100);
                  const proteinPercent = Number(ingredient.proteinPercent || 0);
                  const proteinContribution = (proteinPercent * quantityPer100g) / 100;
                  const costPerKg = Number(ingredient.costPerKg || 0);
                  const costPerGram = costPerKg / 1000;
                  const costContribution = quantityPerServing * costPerGram;

                  return (
                    <TableRow key={ingredient.id}>
                          <TableCell className="min-w-56">
                            <Input value={ingredient.materialName} onChange={event => updateIngredient(ingredient.id, 'materialName', event.target.value)} disabled={!canMutate} placeholder="Enter material name" />
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          value={ingredient.quantityPer100g}
                          onChange={event => updateIngredient(ingredient.id, 'quantityPer100g', event.target.value)}
                          onWheel={preventNumberWheel}
                          disabled={!canMutate}
                          className={`${manualNumberInputClassName} text-right`}
                        />
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(quantityPerServing)}</TableCell>
                      <TableCell className="text-right">{formatNumber(quantityPerBatch)}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          value={ingredient.proteinPercent}
                          onChange={event => updateIngredient(ingredient.id, 'proteinPercent', event.target.value)}
                          onWheel={preventNumberWheel}
                          disabled={!canMutate}
                          className={`${manualNumberInputClassName} text-right`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          value={formatNumber(proteinContribution)}
                          readOnly
                          disabled={!canMutate}
                          className={`${manualNumberInputClassName} text-right`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          value={ingredient.costPerKg}
                          onChange={event => updateIngredient(ingredient.id, 'costPerKg', event.target.value)}
                          onWheel={preventNumberWheel}
                          disabled={!canMutate}
                          className={`${manualNumberInputClassName} text-right`}
                        />
                      </TableCell>
                      <TableCell className="text-right min-w-32">{formatNumber(costContribution)}</TableCell>
                      <TableCell className="min-w-48">
                        <Input
                          value={ingredient.remarks}
                          onChange={event => updateIngredient(ingredient.id, 'remarks', event.target.value)}
                          disabled={!canMutate}
                          placeholder="Optional remarks"
                        />
                      </TableCell>
                      {canMutate && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => removeIngredient(ingredient.id)} disabled={ingredients.length === 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalCost)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Protein</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalProtein)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Formula Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.basePercentage)}%</div>
            <p className="text-xs text-muted-foreground">Sum of Qty/100g</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saved Formulas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savedFormulas.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved Base Formulas</CardTitle>
          <CardDescription>Local register for the current R&D session.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Base Formula ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Batch Size</TableHead>
                  <TableHead className="text-right">Serving Size</TableHead>
                  <TableHead className="text-right">Protein / Serving</TableHead>
                  <TableHead className="text-right">RM Cost / Serving</TableHead>
                  <TableHead className="text-right">Base %</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Total Protein</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedFormulas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                      No base formulas saved yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  savedFormulas.map(formula => (
                    <TableRow key={formula.id}>
                      <TableCell className="font-medium">{formula.id}</TableCell>
                      <TableCell>{formula.productName}</TableCell>
                      <TableCell>{formula.date}</TableCell>
                      <TableCell className="text-right">{formula.batchSize}</TableCell>
                      <TableCell className="text-right">{formula.servingSize}</TableCell>
                      <TableCell className="text-right">{formatNumber(formula.proteinPerServing)}</TableCell>
                      <TableCell className="text-right">{formatNumber(formula.rmCostPerServing)}</TableCell>
                      <TableCell className="text-right">{formatNumber(formula.basePercentage)}</TableCell>
                      <TableCell className="text-right">{formatNumber(formula.totalCost)}</TableCell>
                      <TableCell className="text-right">{formatNumber(formula.totalProtein)}</TableCell>
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