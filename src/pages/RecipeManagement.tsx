import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useErpData } from '@/context/ErpContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import productionLib, { calculateBoxPlanning, calculatePackaging, getPackagingRequiredDisplay, normalizeRecipeBoxConfig, validatePackagingRow } from '@/lib/production';
import type { Recipe } from '@/context/ErpContext';

type MaterialRow = { materialId: string; quantity: string; unit: string; make: string };
type PackagingRow = { materialId: string; unit: 'Nos' | 'Roll'; count: string; rollWeightKg: string; emptySachetWeightG: string; wastagePercent: string };
type AssortedCompositionRow = { flavourId: string; sachetsPerBox: string };

export function RecipeManagement() {
  const { products, flavours, materials, recipes, addRecipe, updateRecipe, removeRecipe } = useErpData();

  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedFlavour, setSelectedFlavour] = useState('');
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [editingRecipeId, setEditingRecipeId] = useState('');
  const [version, setVersion] = useState('v1');
  const [materialsRows, setMaterialsRows] = useState<MaterialRow[]>([{ materialId: '', quantity: '', unit: '%', make: '' }]);
  const [packagingRows, setPackagingRows] = useState<PackagingRow[]>([]);
  const [productionQty, setProductionQty] = useState('300');
  const [servingSize, setServingSize] = useState('30');
  const [statusMessage, setStatusMessage] = useState('');
  const [batchSize, setBatchSize] = useState('500');
  const [packSize, setPackSize] = useState('1 Kg');
  const [assortedPercentage, setAssortedPercentage] = useState('20');
  const [flavouredPercentage, setFlavouredPercentage] = useState('80');
  const [flavouredSachetsPerBox, setFlavouredSachetsPerBox] = useState('10');
  const [assortedSachetsPerBox, setAssortedSachetsPerBox] = useState('20');
  const [allowedAssortedFlavourIds, setAllowedAssortedFlavourIds] = useState<string[]>([]);
  const [assortedCompositionRows, setAssortedCompositionRows] = useState<AssortedCompositionRow[]>([]);
  const [planningFlavouredRatio, setPlanningFlavouredRatio] = useState('30');
  const [planningFlavouredBoxCapacity, setPlanningFlavouredBoxCapacity] = useState('24');
  const [planningAssortedComposition, setPlanningAssortedComposition] = useState<Record<string, string>>({});

  const selectedProductFlavours = useMemo(() => flavours.filter(f => f.productId === selectedProduct), [flavours, selectedProduct]);
  const selectedFlavourRecipes = useMemo(() => recipes.filter(r => r.flavourId === selectedFlavour), [recipes, selectedFlavour]);
  const selectedRecipe = useMemo(
    () => recipes.find(recipe => recipe.id === selectedRecipeId) || null,
    [recipes, selectedRecipeId]
  );
  const productionRecipe = useMemo(
    () => selectedRecipe || (editingRecipeId ? recipes.find(recipe => recipe.id === editingRecipeId) || null : null),
    [editingRecipeId, recipes, selectedRecipe]
  );
  const planningProductFlavours = useMemo(
    () => flavours.filter(flavour => flavour.productId === (productionRecipe?.productId || selectedProduct)),
    [flavours, productionRecipe?.productId, selectedProduct]
  );

  useEffect(() => {
    setPlanningAssortedComposition(prev => {
      const next: Record<string, string> = {};
      planningProductFlavours.forEach(flavour => {
        next[flavour.id] = prev[flavour.id] ?? (flavour.id === (productionRecipe?.flavourId || selectedFlavour) ? '1' : '0');
      });
      return next;
    });
  }, [planningProductFlavours, productionRecipe?.flavourId, selectedFlavour]);

  const totalQuantity = materialsRows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  const canSave = totalQuantity === 100 && selectedProduct && selectedFlavour;
  const duplicateVersionExists = recipes.some(recipe => {
    const sameFlavour = recipe.flavourId === selectedFlavour;
    const sameVersion = recipe.version.trim().toLowerCase() === version.trim().toLowerCase();
    const differentRecord = recipe.id !== editingRecipeId;
    return sameFlavour && sameVersion && differentRecord;
  });

  const resetForm = () => {
    setEditingRecipeId('');
    setVersion('v1');
    setBatchSize('500');
    setPackSize('1 Kg');
    setAssortedPercentage('20');
    setFlavouredPercentage('80');
    setFlavouredSachetsPerBox('10');
    setAssortedSachetsPerBox('20');
    setAllowedAssortedFlavourIds(selectedFlavour ? [selectedFlavour] : []);
    setAssortedCompositionRows(selectedFlavour ? [{ flavourId: selectedFlavour, sachetsPerBox: '20' }] : []);
    setMaterialsRows([{ materialId: '', quantity: '', unit: '%', make: '' }]);
    setPackagingRows([]);
    setStatusMessage('');
  };

  const loadRecipe = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    setSelectedProduct(recipe.productId);
    setSelectedFlavour(recipe.flavourId);
    setSelectedRecipeId(recipe.id);
    setEditingRecipeId(recipe.id);
    setVersion(recipe.version);
    setBatchSize(String(recipe.batchSize));
    setPackSize(recipe.packSize);
    const boxConfig = normalizeRecipeBoxConfig(recipe.boxConfig, recipe.flavourId);
    setAssortedPercentage(String(boxConfig.defaultAssortedPercentage));
    setFlavouredPercentage(String(boxConfig.defaultFlavouredPercentage));
    setFlavouredSachetsPerBox(String(boxConfig.flavouredBox.sachetsPerBox));
    setAssortedSachetsPerBox(String(boxConfig.assortedBox.sachetsPerBox));
    setAllowedAssortedFlavourIds(boxConfig.assortedBox.allowedFlavourIds);
    setAssortedCompositionRows(Object.entries(boxConfig.assortedBox.composition).map(([flavourId, sachetsPerBox]) => ({
      flavourId,
      sachetsPerBox: String(sachetsPerBox),
    })));
    setMaterialsRows(recipe.materials.map(material => ({ materialId: material.materialId, quantity: String(material.quantity), unit: material.unit || '%', make: material.make || '' })));
    setPackagingRows((recipe.packaging || []).map(pack => ({
      materialId: pack.materialId,
      unit: pack.unit || 'Nos',
      count: pack.count ? String(pack.count) : '1',
      rollWeightKg: pack.rollWeightKg ? String(pack.rollWeightKg) : '',
      emptySachetWeightG: pack.emptySachetWeightG ? String(pack.emptySachetWeightG) : '',
      wastagePercent: pack.wastagePercent ? String(pack.wastagePercent) : '',
    })));
    setStatusMessage(`Loaded ${recipe.version}`);
  };

  const saveRecipe = () => {
    const total = materialsRows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
    if (duplicateVersionExists) {
      setStatusMessage('Recipe version must be unique for the selected flavour.');
      return;
    }
    if (total !== 100) {
      setStatusMessage('Recipe must total exactly 100g before saving.');
      return;
    }
    if (!Number(batchSize) || Number(batchSize) <= 0) {
      setStatusMessage('Batch Size must be greater than 0 Kg.');
      return;
    }
    if (!packSize.trim()) {
      setStatusMessage('Pack Size is required.');
      return;
    }
    if (Number(assortedPercentage) + Number(flavouredPercentage) !== 100) {
      setStatusMessage('Assorted % and Flavoured % must equal exactly 100.');
      return;
    }
    if (Number(flavouredSachetsPerBox) <= 0 || Number(assortedSachetsPerBox) <= 0) {
      setStatusMessage('Box sachets per box must be greater than 0.');
      return;
    }
    const assortedComposition = Object.fromEntries(
      assortedCompositionRows
        .filter(row => row.flavourId && allowedAssortedFlavourIds.includes(row.flavourId))
        .map(row => [row.flavourId, Number(row.sachetsPerBox) || 0])
    );
    const assortedCompositionTotal = Object.values(assortedComposition).reduce((sum, value) => sum + value, 0);
    if (Number(assortedPercentage) > 0 && allowedAssortedFlavourIds.length === 0) {
      setStatusMessage('Select at least one allowed flavour for assorted boxes.');
      return;
    }
    if (Number(assortedPercentage) > 0 && assortedCompositionTotal !== Number(assortedSachetsPerBox)) {
      setStatusMessage('Assorted flavour composition must equal assorted sachets per box.');
      return;
    }

    const packagingPayload = packagingRows.map(row => ({
      materialId: row.materialId,
      unit: row.unit,
      count: row.unit === 'Nos' && row.count ? Number(row.count) : undefined,
      rollWeightKg: row.unit === 'Roll' && row.rollWeightKg ? Number(row.rollWeightKg) : undefined,
      emptySachetWeightG: row.unit === 'Roll' && row.emptySachetWeightG ? Number(row.emptySachetWeightG) : undefined,
      wastagePercent: row.unit === 'Roll' && row.wastagePercent ? Number(row.wastagePercent) : undefined,
    }));

    for (const row of packagingPayload) {
      const mat = materials.find(m => m.id === row.materialId);
      const err = validatePackagingRow(row, mat);
      if (err) {
        setStatusMessage(err);
        return;
      }
    }

    const recipe: Recipe = {
      id: editingRecipeId || Math.random().toString(36).slice(2),
      productId: selectedProduct,
      flavourId: selectedFlavour,
      version,
      masterQuantity: 100,
      batchSize: Number(batchSize),
      packSize: packSize.trim(),
      servingSize: servingSize ? `${servingSize}g` : undefined,
      materials: materialsRows.map(row => ({ materialId: row.materialId, quantity: Number(row.quantity) || 0, unit: row.unit || '%', make: row.make.trim() || undefined })),
      packaging: packagingPayload,
      boxConfig: {
        defaultAssortedPercentage: Number(assortedPercentage),
        defaultFlavouredPercentage: Number(flavouredPercentage),
        flavouredBox: { sachetsPerBox: Number(flavouredSachetsPerBox) },
        assortedBox: {
          sachetsPerBox: Number(assortedSachetsPerBox),
          allowedFlavourIds: allowedAssortedFlavourIds,
          composition: assortedComposition,
        },
      },
    };

    if (editingRecipeId) updateRecipe(recipe);
    else addRecipe(recipe);

    setSelectedRecipeId(recipe.id);
    setEditingRecipeId(recipe.id);
    setStatusMessage('Recipe saved.');
  };

  const productionQuantityKg = Number(productionQty) || 0;
  const productionValidationMessages = useMemo(() => {
    const messages: string[] = [];
    if (productionQuantityKg <= 0) messages.push('Production quantity must be greater than 0 kg.');
    if (!productionRecipe) messages.push('Save or select a recipe before calculating production.');
    if (productionRecipe && productionRecipe.materials.length === 0) messages.push('Recipe must contain raw materials.');
    if (productionRecipe && (!productionRecipe.packaging || productionRecipe.packaging.length === 0)) messages.push('Recipe must contain packaging materials.');
    return messages;
  }, [productionQuantityKg, productionRecipe]);

  const canCalculateProduction = productionValidationMessages.length === 0 && productionRecipe;

  const summary = canCalculateProduction
    ? productionLib.calculateProduction(productionRecipe, materials, productionQuantityKg)
    : null;

  // Packaging Calculation — always derived from Production output
  const packagingResults = summary && productionRecipe?.packaging?.length
    ? calculatePackaging(summary.totalFinishedUnits, productionRecipe.packaging, materials)
    : [];

  const productionBoxConfig = productionRecipe
    ? normalizeRecipeBoxConfig(productionRecipe.boxConfig, productionRecipe.flavourId)
    : null;

  const boxPlanningReport = summary && productionRecipe
    ? calculateBoxPlanning({
        boxConfig: productionBoxConfig
          ? {
              ...productionBoxConfig,
              assortedBox: {
                ...productionBoxConfig.assortedBox,
                allowedFlavourIds: [productionRecipe.flavourId],
                composition: { [productionRecipe.flavourId]: productionBoxConfig.assortedBox.sachetsPerBox },
              },
            }
          : productionRecipe.boxConfig,
        flavours: [{
          flavourId: productionRecipe.flavourId,
          flavourName: flavours.find(flavour => flavour.id === productionRecipe.flavourId)?.name || productionRecipe.flavourId,
          recipeName: productionRecipe.version,
          version: productionRecipe.version,
          producedSachets: summary.totalFinishedUnits,
          assortedSachetsPerBox: productionBoxConfig?.assortedBox.sachetsPerBox ?? 0,
        }],
      })
    : null;

  const totalBoxes = boxPlanningReport
    ? boxPlanningReport.summary.assortedBoxes + boxPlanningReport.summary.flavouredBoxes
    : 0;

  const planningFinishedSachets = summary?.totalFinishedUnits ?? 0;
  const planningFlavouredRatioValue = Number(planningFlavouredRatio) || 0;
  const planningAssortedRatio = 100 - planningFlavouredRatioValue;
  const planningFlavouredBoxCapacityValue = Number(planningFlavouredBoxCapacity) || 0;
  const planningTotalAssortedBoxSachets = planningProductFlavours.reduce(
    (sum, flavour) => sum + (Number(planningAssortedComposition[flavour.id]) || 0),
    0
  );
  const planningFlavouredSachets = planningFinishedSachets * (planningFlavouredRatioValue / 100);
  const planningAssortedSachets = planningFinishedSachets * (planningAssortedRatio / 100);
  const planningFlavouredBoxes = planningFlavouredBoxCapacityValue > 0
    ? planningFlavouredSachets / planningFlavouredBoxCapacityValue
    : 0;
  const planningAssortedBoxes = planningTotalAssortedBoxSachets > 0
    ? planningAssortedSachets / planningTotalAssortedBoxSachets
    : 0;
  const planningTotalBoxes = planningFlavouredBoxes + planningAssortedBoxes;

  const finalReportRows = summary
    ? [
        ...summary.rawMaterials.map(row => ({
          type: 'RM',
          materialName: row.name || row.materialId,
          quantity: `${row.required.toFixed(3)} ${row.unit}`,
        })),
        ...packagingResults.map(row => {
          const display = getPackagingRequiredDisplay(row);
          return {
            type: 'PM',
            materialName: row.name || row.materialId,
            quantity: `${display.quantity} ${display.unit}`,
          };
        }),
      ]
    : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Recipe Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipe Master</CardTitle>
          <CardDescription>Keep the existing Category → Product → Flavour → Recipe hierarchy. Each recipe version must total exactly 100g.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={(value) => { setSelectedProduct(value); setSelectedFlavour(''); setSelectedRecipeId(''); resetForm(); }}>
                <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                <SelectContent>
                  {products.map(product => <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Flavour</Label>
              <Select value={selectedFlavour} onValueChange={(value) => { setSelectedFlavour(value); setSelectedRecipeId(''); resetForm(); }}>
                <SelectTrigger><SelectValue placeholder="Select Flavour" /></SelectTrigger>
                <SelectContent>
                  {selectedProductFlavours.map(flavour => <SelectItem key={flavour.id} value={flavour.id}>{flavour.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Recipe Version</Label>
              <Input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="v1" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">

          <div className="space-y-2">
             <Label>Batch Size (Kg)</Label>
              <Input
               type="number"
               value={batchSize}
               onChange={(e) => setBatchSize(e.target.value)}
               placeholder="500"
               />
               </div>
               <div className="space-y-2">
                 <Label>Pack Size</Label>
                 <Input
                 value={packSize}
                 onChange={(e) => setPackSize(e.target.value)}
                 placeholder="1 Kg / 500 g / 250 g"
                 />
                 </div>
                 </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Existing Recipe Version</Label>
              <Select value={selectedRecipeId} onValueChange={loadRecipe}>
                <SelectTrigger><SelectValue placeholder="Choose recipe" /></SelectTrigger>
                <SelectContent>
                  {selectedFlavourRecipes.map(recipe => <SelectItem key={recipe.id} value={recipe.id}>{recipe.version}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Serving Size</Label>
              <Input value={servingSize} onChange={(event) => setServingSize(event.target.value)} placeholder="30" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div>
              <h4 className="text-lg font-semibold">Box Configuration</h4>
              <p className="text-sm text-muted-foreground">Box planning stays inside each recipe and is used by production calculation.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Default Assorted %</Label>
                <Input type="number" value={assortedPercentage} onChange={(event) => setAssortedPercentage(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Default Flavoured %</Label>
                <Input type="number" value={flavouredPercentage} onChange={(event) => setFlavouredPercentage(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Flavoured Box Sachets</Label>
                <Input type="number" value={flavouredSachetsPerBox} onChange={(event) => setFlavouredSachetsPerBox(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Assorted Box Sachets</Label>
                <Input type="number" value={assortedSachetsPerBox} onChange={(event) => setAssortedSachetsPerBox(event.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <Label>Allowed Flavours In Assorted Box</Label>
                <div className="rounded-md border p-3 space-y-2">
                  {selectedProductFlavours.map(flavour => (
                    <label key={flavour.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={allowedAssortedFlavourIds.includes(flavour.id)}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setAllowedAssortedFlavourIds(prev => [...new Set([...prev, flavour.id])]);
                            setAssortedCompositionRows(prev => prev.some(row => row.flavourId === flavour.id) ? prev : [...prev, { flavourId: flavour.id, sachetsPerBox: '0' }]);
                            return;
                          }
                          setAllowedAssortedFlavourIds(prev => prev.filter(id => id !== flavour.id));
                          setAssortedCompositionRows(prev => prev.filter(row => row.flavourId !== flavour.id));
                        }}
                      />
                      <span>{flavour.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label>Assorted Box Composition</Label>
                <div className="rounded-md border p-3 space-y-2">
                  {assortedCompositionRows.filter(row => allowedAssortedFlavourIds.includes(row.flavourId)).map(row => (
                    <div key={row.flavourId} className="grid grid-cols-2 gap-3 items-center">
                      <div className="text-sm">{flavours.find(flavour => flavour.id === row.flavourId)?.name || row.flavourId}</div>
                      <Input
                        type="number"
                        min="0"
                        value={row.sachetsPerBox}
                        onChange={(event) => setAssortedCompositionRows(prev => prev.map(current => current.flavourId === row.flavourId ? { ...current, sachetsPerBox: event.target.value } : current))}
                      />
                    </div>
                  ))}
                  <div className="text-xs text-muted-foreground">
                    Total: {assortedCompositionRows.reduce((sum, row) => allowedAssortedFlavourIds.includes(row.flavourId) ? sum + (Number(row.sachetsPerBox) || 0) : sum, 0)} / {assortedSachetsPerBox} sachets
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold">Recipe Formula Chart</h4>
                <p className="text-sm text-muted-foreground">This table is the fixed 100g master formula.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setMaterialsRows(prev => [...prev, { materialId: '', quantity: '', unit: '%', make: '' }])}>Add Material</Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Quantity (g)</TableHead>
                  <TableHead>Make</TableHead>
                  <TableHead>Per Serving</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialsRows.map((row, index) => {
                  const selectedMaterial = materials.find(material => material.id === row.materialId);
                  return (
                    <TableRow key={`${row.materialId || 'row'}-${index}`}>
                      <TableCell className="min-w-56">
                        <Select value={row.materialId} onValueChange={(value) => setMaterialsRows(prev => prev.map((currentRow, currentIndex) => currentIndex === index ? { ...currentRow, materialId: value, unit: '%' } : currentRow))}>
                          <SelectTrigger><SelectValue placeholder="Select Material" /></SelectTrigger>
                          <SelectContent>
                            {materials.filter(material => material.type === 'Raw Material').map(material => <SelectItem key={material.id} value={material.id}>{material.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={row.quantity} onChange={(event) => setMaterialsRows(prev => prev.map((currentRow, currentIndex) => currentIndex === index ? { ...currentRow, quantity: event.target.value } : currentRow))} />
                      </TableCell>
                      <TableCell>
                        <Input value={row.make} onChange={(event) => setMaterialsRows(prev => prev.map((currentRow, currentIndex) => currentIndex === index ? { ...currentRow, make: event.target.value } : currentRow))} placeholder="e.g. KP Manish" />
                      </TableCell>
                      <TableCell>{selectedMaterial?.name ? `${(((Number(row.quantity) || 0) / 100) * (Number(servingSize) || 0)).toFixed(3)} g` : '-'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setMaterialsRows(prev => prev.filter((_, currentIndex) => currentIndex !== index))}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell className={totalQuantity === 100 ? 'text-green-600 font-semibold' : 'text-destructive font-semibold'}>Total</TableCell>
                  <TableCell className={totalQuantity === 100 ? 'text-green-600 font-semibold' : 'text-destructive font-semibold'}>{totalQuantity} g</TableCell>
                  <TableCell />
                  <TableCell>{totalQuantity === 100 ? 'Valid' : 'Must equal 100g'}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>

            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold">Packaging Material</h4>
                  <p className="text-sm text-muted-foreground">Packaging stays inside the recipe and drives the production summary.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPackagingRows(prev => [...prev, { materialId: '', unit: 'Nos', count: '1', rollWeightKg: '', emptySachetWeightG: '', wastagePercent: '' }])}>Add Packaging</Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material Name</TableHead>
                    <TableHead>Packaging Unit</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Roll Weight (Kg)</TableHead>
                    <TableHead>Weight Of One Empty Sachet (g)</TableHead>
                    <TableHead>Wastage %</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packagingRows.map((row, index) => (
                    <TableRow key={`${row.materialId || 'pack'}-${index}`}>
                      <TableCell className="min-w-56">
                        <Select value={row.materialId} onValueChange={(value) => setPackagingRows(prev => prev.map((currentRow, currentIndex) => currentIndex === index ? { ...currentRow, materialId: value } : currentRow))}>
                          <SelectTrigger><SelectValue placeholder="Select Packaging Material" /></SelectTrigger>
                          <SelectContent>
                            {materials.filter(material => material.type === 'Packaging Material' && !material.name.toLowerCase().includes('box')).map(material => <SelectItem key={material.id} value={material.id}>{material.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={row.unit} onValueChange={(value) => setPackagingRows(prev => prev.map((currentRow, currentIndex) => currentIndex === index ? { ...currentRow, unit: value as 'Nos' | 'Roll' } : currentRow))}>
                          <SelectTrigger><SelectValue placeholder="Unit" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Nos">Nos</SelectItem>
                            <SelectItem value="Roll">Roll</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={row.count} onChange={(event) => setPackagingRows(prev => prev.map((currentRow, currentIndex) => currentIndex === index ? { ...currentRow, count: event.target.value } : currentRow))} disabled={row.unit !== 'Nos'} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={row.rollWeightKg} onChange={(event) => setPackagingRows(prev => prev.map((currentRow, currentIndex) => currentIndex === index ? { ...currentRow, rollWeightKg: event.target.value } : currentRow))} disabled={row.unit !== 'Roll'} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={row.emptySachetWeightG} onChange={(event) => setPackagingRows(prev => prev.map((currentRow, currentIndex) => currentIndex === index ? { ...currentRow, emptySachetWeightG: event.target.value } : currentRow))} disabled={row.unit !== 'Roll'} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" value={row.wastagePercent} onChange={(event) => setPackagingRows(prev => prev.map((currentRow, currentIndex) => currentIndex === index ? { ...currentRow, wastagePercent: event.target.value } : currentRow))} disabled={row.unit !== 'Roll'} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setPackagingRows(prev => prev.filter((_, currentIndex) => currentIndex !== index))}>Remove</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={!canSave} onClick={saveRecipe}>Save Recipe</Button>
              <Button variant="outline" onClick={() => setStatusMessage('')}>Clear Status</Button>
              {editingRecipeId ? <Button variant="outline" onClick={resetForm}>New Version</Button> : null}
              <span className="text-sm text-muted-foreground">{statusMessage || 'Recipes remain editable. Formula updates whenever you edit and save.'}</span>
            </div>
            <div className={`rounded-md border px-3 py-2 text-sm ${totalQuantity === 100 ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              Current ingredient total: {totalQuantity} g {totalQuantity === 100 ? '(ready to save)' : '(must equal 100 g)'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Production Calculation</CardTitle>
          <CardDescription>Production uses the selected recipe. Recipe data supplies serving size, pack size, materials, packaging, and box configuration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Product</div>
              <div className="font-medium">{productionRecipe ? products.find(product => product.id === productionRecipe.productId)?.name || '-' : '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Flavour / Recipe</div>
              <div className="font-medium">
                {productionRecipe ? `${flavours.find(flavour => flavour.id === productionRecipe.flavourId)?.name || '-'} / ${productionRecipe.version}` : '-'}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Production Quantity (kg)</Label>
              <Input type="number" min="0" value={productionQty} onChange={(event) => setProductionQty(event.target.value)} placeholder="300" />
            </div>
          </div>

          {productionValidationMessages.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {productionValidationMessages.map(message => <div key={message}>{message}</div>)}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Finished Sachets</div>
              <div className="text-2xl font-semibold">{summary?.totalFinishedUnits ?? 0}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Assorted Sachets</div>
              <div className="text-2xl font-semibold">{boxPlanningReport?.summary.assortedSachets ?? 0}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Flavoured Sachets</div>
              <div className="text-2xl font-semibold">{boxPlanningReport?.summary.flavouredSachets ?? 0}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Flavoured Boxes</div>
              <div className="text-2xl font-semibold">{boxPlanningReport?.summary.flavouredBoxes ?? 0}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Assorted Boxes</div>
              <div className="text-2xl font-semibold">{boxPlanningReport?.summary.assortedBoxes ?? 0}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Box Requirement</div>
              <div className="text-2xl font-semibold">{totalBoxes}</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Loose Sachets</div>
              <div className="text-2xl font-semibold">{boxPlanningReport?.summary.remainingSachets ?? 0}</div>
            </div>
          </div>

          {boxPlanningReport?.validationMessages.length ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {boxPlanningReport.validationMessages.map(message => <div key={message}>{message}</div>)}
            </div>
          ) : null}

          <div className="space-y-4 pt-4 border-t">
            <div>
              <h4 className="text-lg font-semibold">Production Planning</h4>
              <p className="text-sm text-muted-foreground">Uses the finished sachets already calculated above.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Flavoured Ratio (%)</Label>
                <Input type="number" value={planningFlavouredRatio} onChange={event => setPlanningFlavouredRatio(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Assorted Ratio (%)</Label>
                <Input readOnly value={planningAssortedRatio} />
              </div>
              <div className="space-y-2">
                <Label>Sachets Per Flavoured Box</Label>
                <Input type="number" value={planningFlavouredBoxCapacity} onChange={event => setPlanningFlavouredBoxCapacity(event.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Assorted Box Configuration</h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {planningProductFlavours.map(flavour => (
                  <div key={flavour.id} className="space-y-2">
                    <Label>{flavour.name}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={planningAssortedComposition[flavour.id] ?? '0'}
                      onChange={event => setPlanningAssortedComposition(prev => ({ ...prev, [flavour.id]: event.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">Total Sachets Per Assorted Box: {planningTotalAssortedBoxSachets}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Finished Sachets</div>
                <div className="text-2xl font-semibold">{planningFinishedSachets}</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Flavoured Sachets</div>
                <div className="text-2xl font-semibold">{planningFlavouredSachets.toFixed(2)}</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Assorted Sachets</div>
                <div className="text-2xl font-semibold">{planningAssortedSachets.toFixed(2)}</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Flavoured Boxes</div>
                <div className="text-2xl font-semibold">{planningFlavouredBoxes.toFixed(2)}</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Assorted Boxes</div>
                <div className="text-2xl font-semibold">{planningAssortedBoxes.toFixed(2)}</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Total Boxes</div>
                <div className="text-2xl font-semibold">{planningTotalBoxes.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {summary && productionRecipe ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Raw Material Requirement</CardTitle>
                  <CardDescription>{productionRecipe.version} | {summary.productionKg} kg | {summary.servingSizeG}g serving</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Total Required</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.rawMaterials.map(item => (
                        <TableRow key={item.materialId}>
                          <TableCell>{item.name || item.materialId}</TableCell>
                          <TableCell>{item.required.toFixed(3)} {item.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Packaging Material Requirement</CardTitle>
                  <CardDescription>Calculated from finished sachets and recipe packaging.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Required</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packagingResults.map(item => {
                        const display = getPackagingRequiredDisplay(item);
                        return (
                          <TableRow key={item.materialId}>
                            <TableCell>{item.name || item.materialId}</TableCell>
                            <TableCell>{display.quantity} {display.unit}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <div>
            <h4 className="mb-2 font-medium">Final Manufacturing Summary</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex justify-between"><span>Recipe Version</span><span>{productionRecipe?.version || '-'}</span></div>
              <div className="flex justify-between"><span>Production Quantity</span><span>{summary ? `${summary.productionKg} kg` : '-'}</span></div>
              <div className="flex justify-between"><span>Finished Sachets</span><span>{summary?.totalFinishedUnits ?? '-'}</span></div>
              <div className="flex justify-between"><span>Assorted Sachets</span><span>{boxPlanningReport?.summary.assortedSachets ?? '-'}</span></div>
              <div className="flex justify-between"><span>Flavoured Sachets</span><span>{boxPlanningReport?.summary.flavouredSachets ?? '-'}</span></div>
              <div className="flex justify-between"><span>Assorted Boxes</span><span>{boxPlanningReport?.summary.assortedBoxes ?? '-'}</span></div>
              <div className="flex justify-between"><span>Flavoured Boxes</span><span>{boxPlanningReport?.summary.flavouredBoxes ?? '-'}</span></div>
              <div className="flex justify-between"><span>Total Boxes</span><span>{boxPlanningReport ? totalBoxes : '-'}</span></div>
              <div className="flex justify-between"><span>Loose Sachets</span><span>{boxPlanningReport?.summary.remainingSachets ?? '-'}</span></div>
              <div className="flex justify-between"><span>Status</span><span>{summary ? 'Ready' : 'Pending Calculation'}</span></div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 font-medium">Final Report</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Material Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Flavour</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finalReportRows.map(row => (
                  <TableRow key={`${row.type}-${row.materialName}`}>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.materialName}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>{productionRecipe ? flavours.find(flavour => flavour.id === productionRecipe.flavourId)?.name || '-' : '-'}</TableCell>
                  </TableRow>
                ))}
                {finalReportRows.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Save or select a recipe and enter production quantity to generate report.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved Recipes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Flavour</TableHead>
                <TableHead>Batch Size</TableHead>
                <TableHead>Pack Size</TableHead>
                <TableHead>Formula Total</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.map(recipe => (
                <TableRow key={recipe.id}>
  <TableCell>{recipe.version}</TableCell>

  <TableCell>
    {products.find(product => product.id === recipe.productId)?.name || '-'}
  </TableCell>

  <TableCell>
    {flavours.find(flavour => flavour.id === recipe.flavourId)?.name || '-'}
  </TableCell>

  <TableCell>{recipe.batchSize} Kg</TableCell>

  <TableCell>{recipe.packSize}</TableCell>

  <TableCell>
    {recipe.materials.reduce((sum, row) => sum + row.quantity, 0)} g
  </TableCell>

  <TableCell className="space-x-2">
    <Button variant="outline" size="sm" onClick={() => loadRecipe(recipe.id)}>
      Edit
    </Button>

    <Button variant="outline" size="sm" onClick={() => setSelectedRecipeId(recipe.id)}>
      Use
    </Button>

    <Button variant="destructive" size="sm" onClick={() => removeRecipe(recipe.id)}>
      Delete
    </Button>
  </TableCell>
</TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default RecipeManagement;

