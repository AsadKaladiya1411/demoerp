import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useErpData } from '@/context/ErpContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import productionLib, { calculatePackaging, getPackagingRequiredDisplay, normalizeRecipeBoxConfig, validatePackagingRow } from '@/lib/production';
import { FileText, Printer } from 'lucide-react';
import type { Recipe } from '@/context/ErpContext';

type IngredientRow = { materialId: string; quantity: string; unit: string; make: string };
type PackagingRow = { materialId: string; unit: 'Nos' | 'Roll'; count: string; rollWeightKg: string; emptySachetWeightG: string; wastagePercent: string };

function isSachetMaterialName(name: string) {
  const normalized = name.toLowerCase();
  return normalized.includes('sachet') || normalized.includes('film') || normalized.includes('pouch');
}

export function FlavourDetails() {
  const { productId, flavourId } = useParams();
  const navigate = useNavigate();
  const { products, flavours, recipes, materials, productionCalculations, addRecipe, updateRecipe, addProductionPlan, upsertProductionCalculation } = useErpData();

  const product = products.find(p => p.id === productId);
  const flavour = flavours.find(f => f.id === flavourId && f.productId === productId);
  const flavourRecipes = useMemo(() => recipes.filter(r => r.flavourId === flavour?.id), [recipes, flavour?.id]);

  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [version, setVersion] = useState('');
  const [batchSize, setBatchSize] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [packSize, setPackSize] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [packagingRows, setPackagingRows] = useState<PackagingRow[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  const [productionKg, setProductionKg] = useState('');
  const [flavouredRatio, setFlavouredRatio] = useState('');
  const [flavouredBoxCapacity, setFlavouredBoxCapacity] = useState('');
  const [sachetKgWeight, setSachetKgWeight] = useState('');
  const [productionStatus, setProductionStatus] = useState('');

  const selectedRecipe = useMemo(
    () => flavourRecipes.find(recipe => recipe.id === selectedRecipeId) || null,
    [flavourRecipes, selectedRecipeId]
  );

  useEffect(() => {
    if (!selectedRecipeId && flavourRecipes.length > 0) {
      setSelectedRecipeId(flavourRecipes[0].id);
    }
  }, [flavourRecipes, selectedRecipeId]);

  useEffect(() => {
    if (!selectedRecipe) return;
    setVersion(selectedRecipe.version);
    setBatchSize(String(selectedRecipe.batchSize));
    setServingSize(selectedRecipe.servingSize || '');
    setPackSize(selectedRecipe.packSize || '');
    setIngredients(selectedRecipe.materials.map(row => ({
      materialId: row.materialId,
      quantity: String(row.quantity),
      unit: row.unit || 'kg',
      make: row.make || '',
    })));
    setPackagingRows((selectedRecipe.packaging || []).map(row => ({
      materialId: row.materialId,
      unit: row.unit,
      count: row.count ? String(row.count) : '',
      rollWeightKg: row.rollWeightKg ? String(row.rollWeightKg) : '',
      emptySachetWeightG: row.emptySachetWeightG ? String(row.emptySachetWeightG) : '',
      wastagePercent: row.wastagePercent ? String(row.wastagePercent) : '',
    })));
    setProductionKg(String(selectedRecipe.batchSize || ''));
    setFlavouredRatio('');
    setFlavouredBoxCapacity('');
    setSachetKgWeight('');
    setProductionStatus('');
    setStatusMessage('');
  }, [selectedRecipe]);

  useEffect(() => {
    if (!selectedRecipe) return;
    const saved = productionCalculations.find(item => item.recipeId === selectedRecipe.id);
    if (!saved) return;
    setProductionKg(String(saved.productionKg));
    setFlavouredRatio(String(saved.flavouredRatio));
    setFlavouredBoxCapacity(String(saved.sachetsPerFlavouredBox));
  }, [productionCalculations, selectedRecipe]);

  const ingredientTotal = ingredients.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);
  const duplicateVersionExists = flavourRecipes.some(recipe => recipe.version.trim().toLowerCase() === version.trim().toLowerCase() && recipe.id !== selectedRecipe?.id);
  const productionQuantityKg = Number(productionKg) || 0;
  const productionSummary = selectedRecipe && productionQuantityKg > 0
    ? productionLib.calculateProduction(selectedRecipe, materials, productionQuantityKg)
    : null;
  const packagingResults = productionSummary && selectedRecipe?.packaging?.length
    ? calculatePackaging(productionSummary.totalFinishedUnits, selectedRecipe.packaging, materials)
    : [];

  const finishedSachets = productionSummary?.totalFinishedUnits ?? 0;
  const flavouredRatioValue = Number(flavouredRatio) || 0;
  const flavouredSachets = Math.floor(finishedSachets * (flavouredRatioValue / 100));
  const assortedSachets = finishedSachets - flavouredSachets;
  const flavouredBoxCapacityValue = Number(flavouredBoxCapacity) || 0;
  const flavouredBoxes = flavouredBoxCapacityValue > 0 ? Math.floor(flavouredSachets / flavouredBoxCapacityValue) : 0;
  const sachetKgWeightValue = Number(sachetKgWeight) || 0;
  const requiredSachetKg = Number(((finishedSachets * sachetKgWeightValue) / 1000).toFixed(6));

  const updatePackagingMaterial = (index: number, materialId: string) => {
    const selectedMaterial = materials.find(item => item.id === materialId);
    const selectedIsSachet = selectedMaterial ? isSachetMaterialName(selectedMaterial.name) : false;
    setPackagingRows(prev => {
      const next = selectedIsSachet
        ? prev.filter((row, currentIndex) => {
            if (currentIndex === index) return true;
            const material = materials.find(item => item.id === row.materialId);
            return !material || !isSachetMaterialName(material.name);
          })
        : prev;

      return next.map((row, currentIndex) => {
        if (currentIndex !== Math.min(index, next.length - 1)) return row;
        return { ...row, materialId };
      });
    });
  };

  const updatePackagingUnit = (index: number, unit: 'Nos' | 'Roll') => {
    setPackagingRows(prev => prev.map((row, currentIndex) => currentIndex === index
      ? {
          ...row,
          unit,
          count: unit === 'Nos' ? row.count : '',
          rollWeightKg: unit === 'Roll' ? row.rollWeightKg : '',
          emptySachetWeightG: unit === 'Roll' ? row.emptySachetWeightG : '',
          wastagePercent: unit === 'Roll' ? row.wastagePercent : '',
        }
      : row
    ));
  };

  const finalReportRows = productionSummary
    ? [
        ...productionSummary.rawMaterials.map(row => ({
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

  const saveRecipe = () => {
    if (!product || !flavour) return;
    if (!version.trim()) {
      setStatusMessage('Recipe version is required.');
      return;
    }
    if (duplicateVersionExists) {
      setStatusMessage('Recipe version must be unique for this flavour.');
      return;
    }
    if (!servingSize.trim()) {
      setStatusMessage('Serving Size is required.');
      return;
    }
    if (!Number(batchSize) || Number(batchSize) <= 0) {
      setBatchSize('0');
    }
    if (ingredientTotal !== 100) {
      setStatusMessage('Ingredient quantities must total exactly 100 grams.');
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

    const sachetPackagingRows = packagingPayload.filter(row => {
      const material = materials.find(item => item.id === row.materialId);
      return material && isSachetMaterialName(material.name);
    });
    if (sachetPackagingRows.length > 1) {
      setStatusMessage('Only one sachet packaging mode is allowed: Roll or Nos.');
      return;
    }

    for (const row of packagingPayload) {
      const material = materials.find(item => item.id === row.materialId);
      const error = validatePackagingRow(row, material);
      if (error) {
        setStatusMessage(error);
        return;
      }
    }

    const existingBoxConfig = selectedRecipe
      ? normalizeRecipeBoxConfig(selectedRecipe.boxConfig, selectedRecipe.flavourId)
      : {
          defaultAssortedPercentage: 0,
          defaultFlavouredPercentage: 100,
          flavouredBox: { sachetsPerBox: 1 },
          assortedBox: { sachetsPerBox: 1, allowedFlavourIds: [], composition: {} },
        };

    const recipe: Recipe = {
      id: selectedRecipe?.id || Math.random().toString(36).slice(2),
      productId: product.id,
      flavourId: flavour.id,
      version: version.trim(),
      masterQuantity: 100,
      batchSize: Number(batchSize),
      servingSize: servingSize.trim(),
      packSize: packSize.trim(),
      materials: ingredients.map(row => ({
        materialId: row.materialId,
        quantity: Number(row.quantity) || 0,
        unit: row.unit || 'kg',
        make: row.make.trim() || undefined,
      })),
      packaging: packagingPayload,
      boxConfig: existingBoxConfig,
    };

    if (selectedRecipe) updateRecipe(recipe);
    else addRecipe(recipe);
    setSelectedRecipeId(recipe.id);
    setStatusMessage('Recipe saved.');
  };

  const saveProductionCalculation = () => {
    if (!product || !flavour || !selectedRecipe || !productionSummary) return;
    if (productionQuantityKg <= 0) {
      setProductionStatus('Production Quantity must be greater than 0.');
      return;
    }
    if (flavouredRatioValue < 0 || flavouredRatioValue > 100) {
      setProductionStatus('Flavoured Ratio must be between 0 and 100.');
      return;
    }
    if (flavouredBoxCapacityValue <= 0) {
      setProductionStatus('Sachets Per Flavoured Box is required.');
      return;
    }

    upsertProductionCalculation({
      recipeId: selectedRecipe.id,
      productId: product.id,
      flavourId: flavour.id,
      productionKg: productionQuantityKg,
      finishedSachets,
      flavouredRatio: flavouredRatioValue,
      assortedRatio: Number(100 - flavouredRatioValue),
      flavouredSachets,
      assortedSachets,
      sachetsPerFlavouredBox: flavouredBoxCapacityValue,
      flavouredBoxes,
    });
    setProductionStatus('Production calculation saved for product box planning.');
  };

  const generateReport = () => {
    if (!product || !flavour || !selectedRecipe || !productionSummary) return;
    if (productionQuantityKg <= 0) {
      setProductionStatus('Production Quantity must be greater than 0.');
      return;
    }

    upsertProductionCalculation({
      recipeId: selectedRecipe.id,
      productId: product.id,
      flavourId: flavour.id,
      productionKg: productionQuantityKg,
      finishedSachets,
      flavouredRatio: flavouredRatioValue,
      assortedRatio: Number(100 - flavouredRatioValue),
      flavouredSachets,
      assortedSachets,
      sachetsPerFlavouredBox: flavouredBoxCapacityValue,
      flavouredBoxes,
    });

    addProductionPlan({
      id: `report-${selectedRecipe.id}`,
      productId: product.id,
      flavourId: flavour.id,
      recipeId: selectedRecipe.id,
      manufacturerId: product.manufacturerId || '',
      batch: `REPORT-${selectedRecipe.version}`,
      mfgDate: new Date().toISOString().slice(0, 10),
      quantity: productionQuantityKg,
      type: 'Normal',
      status: 'Approved',
    });

    setProductionStatus('Final report generated and added to Requirement Report.');
  };

  if (!product || !flavour) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Flavour not found</h2>
        <div className="mt-4">
          <Button asChild><Link to="/masters/products">Back to Products</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">{flavour.name}</h2>
          <div className="text-sm text-muted-foreground">{product.name} | Flavour workflow</div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/masters/products/${product.id}`)}>Back to Product</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recipe Information</CardTitle>
          <CardDescription>SECTION 1</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Recipe</Label>
              <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
                <SelectTrigger><SelectValue placeholder="Choose recipe" /></SelectTrigger>
                <SelectContent>
                  {flavourRecipes.map(recipe => <SelectItem key={recipe.id} value={recipe.id}>{recipe.version}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Recipe Version</Label>
              <Input value={version} onChange={event => setVersion(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Serving Size</Label>
              <Input value={servingSize} onChange={event => setServingSize(event.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
          <CardDescription>SECTION 2</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantity (g)</TableHead>
                <TableHead>Make</TableHead>
                <TableHead>Per Serving</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((row, index) => (
                <TableRow key={`ingredient-row-${index}`}>
                  <TableCell>
                    <Input value={row.materialId} onChange={event => setIngredients(prev => prev.map((item, currentIndex) => currentIndex === index ? { ...item, materialId: event.target.value, unit: 'kg' } : item))} placeholder="Enter material name" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" value={row.quantity} onChange={event => setIngredients(prev => prev.map((item, currentIndex) => currentIndex === index ? { ...item, quantity: event.target.value } : item))} />
                  </TableCell>
                  <TableCell>
                    <Input value={row.make} onChange={event => setIngredients(prev => prev.map((item, currentIndex) => currentIndex === index ? { ...item, make: event.target.value } : item))} />
                  </TableCell>
                  <TableCell>
                    {(((Number(row.quantity) || 0) / 100) * (Number(servingSize.replace(/[^0-9.]/g, '')) || 0)).toFixed(3)} g
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setIngredients(prev => prev.filter((_, currentIndex) => currentIndex !== index))}>Remove</Button>
                  </TableCell>
                </TableRow>
              ))}
              {ingredients.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No ingredients configured.</TableCell></TableRow>
              )}
              <TableRow>
                <TableCell className={ingredientTotal === 100 ? 'font-semibold text-green-600' : 'font-semibold text-destructive'}>Total</TableCell>
                <TableCell className={ingredientTotal === 100 ? 'font-semibold text-green-600' : 'font-semibold text-destructive'}>{ingredientTotal} g</TableCell>
                <TableCell>{ingredientTotal === 100 ? 'Valid' : 'Must equal 100 g'}</TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setIngredients(prev => [...prev, { materialId: '', quantity: '', unit: 'kg', make: '' }])}>Add Ingredient</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Packaging Materials</CardTitle>
          <CardDescription>SECTION 3</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Packaging Type</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Roll Weight</TableHead>
                <TableHead>Empty Sachet Weight</TableHead>
                <TableHead>Wastage</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {packagingRows.map((row, index) => (
                <TableRow key={`packaging-row-${index}`}>
                  <TableCell>
                    <Input value={row.materialId} onChange={event => updatePackagingMaterial(index, event.target.value)} placeholder="Enter packaging material" />
                  </TableCell>
                  <TableCell>
                    <Select value={row.unit} onValueChange={value => updatePackagingUnit(index, value as 'Nos' | 'Roll')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nos">Nos</SelectItem>
                        <SelectItem value="Roll">Roll</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input type="number" disabled={row.unit !== 'Nos'} value={row.count} onChange={event => setPackagingRows(prev => prev.map((item, currentIndex) => currentIndex === index ? { ...item, count: event.target.value } : item))} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" disabled={row.unit !== 'Roll'} value={row.rollWeightKg} onChange={event => setPackagingRows(prev => prev.map((item, currentIndex) => currentIndex === index ? { ...item, rollWeightKg: event.target.value } : item))} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" disabled={row.unit !== 'Roll'} value={row.emptySachetWeightG} onChange={event => setPackagingRows(prev => prev.map((item, currentIndex) => currentIndex === index ? { ...item, emptySachetWeightG: event.target.value } : item))} />
                  </TableCell>
                  <TableCell>
                    <Input type="number" disabled={row.unit !== 'Roll'} value={row.wastagePercent} onChange={event => setPackagingRows(prev => prev.map((item, currentIndex) => currentIndex === index ? { ...item, wastagePercent: event.target.value } : item))} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setPackagingRows(prev => prev.filter((_, currentIndex) => currentIndex !== index))}>Remove</Button>
                  </TableCell>
                </TableRow>
              ))}
              {packagingRows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No packaging materials configured.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          <Button variant="outline" size="sm" onClick={() => setPackagingRows(prev => [...prev, { materialId: '', unit: 'Nos', count: '', rollWeightKg: '', emptySachetWeightG: '', wastagePercent: '' }])}>Add Packaging</Button>
          <div className="space-y-3 border-t pt-4">
            <h4 className="font-medium">Sachet Kg Calculation</h4>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>1 Empty Sachet Weight (g)</Label>
                <Input type="number" value={sachetKgWeight} onChange={event => setSachetKgWeight(event.target.value)} />
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Finished Sachets</div>
                <div className="text-2xl font-semibold">{finishedSachets}</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Required Sachet Kg</div>
                <div className="text-2xl font-semibold">{requiredSachetKg} kg</div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t pt-4">
            <Button onClick={saveRecipe}>Save Recipe</Button>
            <span className="text-sm text-muted-foreground">{statusMessage}</span>
          </div>
        </CardContent>
      </Card>

      {selectedRecipe ? (
        <Card>
          <CardHeader>
            <CardTitle>Production Calculation</CardTitle>
            <CardDescription>SECTION 4</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Production Quantity (Kg)</Label>
                <Input type="number" value={productionKg} onChange={event => setProductionKg(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Flavoured Ratio (%)</Label>
                <Input type="number" value={flavouredRatio} onChange={event => setFlavouredRatio(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Assorted Ratio</Label>
                <Input readOnly value={flavouredRatio === '' ? '' : String(100 - flavouredRatioValue)} />
              </div>
              <div className="space-y-2">
                <Label>Sachets Per Flavoured Box</Label>
                <Input type="number" value={flavouredBoxCapacity} onChange={event => setFlavouredBoxCapacity(event.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Serving Size</div>
                <div className="text-2xl font-semibold">{productionSummary?.servingSizeG ?? '-' } g</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Finished Sachets</div>
                <div className="text-2xl font-semibold">{finishedSachets}</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Flavoured Sachets</div>
                <div className="text-2xl font-semibold">{flavouredSachets}</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Assorted Sachets</div>
                <div className="text-2xl font-semibold">{assortedSachets}</div>
              </div>
              <div className="rounded-md border p-4">
                <div className="text-sm text-muted-foreground">Flavoured Boxes</div>
                <div className="text-2xl font-semibold">{flavouredBoxes}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t pt-4">
              <Button onClick={saveProductionCalculation} disabled={!productionSummary}>Save Production Calculation</Button>
              <Button variant="outline" asChild>
                <Link to={`/masters/products/${product.id}/assorted-configuration`}>Assorted Configuration</Link>
              </Button>
              <span className="text-sm text-muted-foreground">{productionStatus}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {productionSummary ? (
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>SECTION 5</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <div>
              <h4 className="mb-2 font-medium">Raw Material Requirement</h4>
              <Table>
                <TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Total Required</TableHead></TableRow></TableHeader>
                <TableBody>
                  {productionSummary.rawMaterials.map(row => (
                    <TableRow key={row.materialId}><TableCell>{row.name || row.materialId}</TableCell><TableCell>{row.required.toFixed(3)} {row.unit}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div>
              <h4 className="mb-2 font-medium">Packaging Material Requirement</h4>
              <Table>
                <TableHeader><TableRow><TableHead>Material</TableHead><TableHead>Required</TableHead></TableRow></TableHeader>
                <TableBody>
                  {packagingResults.map(row => {
                    const display = getPackagingRequiredDisplay(row);
                    return <TableRow key={row.materialId}><TableCell>{row.name || row.materialId}</TableCell><TableCell>{display.quantity} {display.unit}</TableCell></TableRow>;
                  })}
                </TableBody>
              </Table>
            </div>
            <div>
              <h4 className="mb-2 font-medium">Flavour Box Output</h4>
              <Table>
                <TableHeader><TableRow><TableHead>Output</TableHead><TableHead>Qty</TableHead></TableRow></TableHeader>
                <TableBody>
                  <TableRow><TableCell>Flavoured Boxes</TableCell><TableCell>{flavouredBoxes}</TableCell></TableRow>
                  <TableRow><TableCell>Assorted Sachets</TableCell><TableCell>{assortedSachets}</TableCell></TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>SECTION 6</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex justify-between"><span>Recipe Version</span><span>{selectedRecipe?.version || '-'}</span></div>
            <div className="flex justify-between"><span>Production Quantity</span><span>{productionKg || '-'} kg</span></div>
            <div className="flex justify-between"><span>Finished Sachets</span><span>{productionSummary?.totalFinishedUnits ?? '-'}</span></div>
            <div className="flex justify-between"><span>Flavoured Sachets</span><span>{productionSummary ? flavouredSachets : '-'}</span></div>
            <div className="flex justify-between"><span>Assorted Sachets</span><span>{productionSummary ? assortedSachets : '-'}</span></div>
            <div className="flex justify-between"><span>Flavoured Boxes</span><span>{productionSummary ? flavouredBoxes : '-'}</span></div>
            <div className="flex justify-between"><span>Status</span><span>{productionSummary ? 'Ready' : 'Pending Calculation'}</span></div>
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
                    <TableCell>{flavour.name}</TableCell>
                  </TableRow>
                ))}
                {finalReportRows.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">Complete production planning to generate report.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={!productionSummary}><FileText className="mr-2 h-4 w-4" /> Generate Report</Button>
            <Button variant="outline" disabled={!productionSummary}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default FlavourDetails;
