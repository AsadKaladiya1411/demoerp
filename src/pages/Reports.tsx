import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import { useErpData } from '@/context/ErpContext';
import { calculatePackaging, calculateProduction, generateConsolidatedMaterialRequirementReport, getPackagingRequiredDisplay } from '@/lib/production';

export function Reports() {
  const { productionPlans, products, flavours, recipes, materials } = useErpData();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [productionQtyByRecipe, setProductionQtyByRecipe] = useState<Record<string, string>>({});
  const [pendingPoByMaterial, setPendingPoByMaterial] = useState<Record<string, string>>({});

  const selectedRecipeSet = useMemo(() => new Set(selectedRecipeIds), [selectedRecipeIds]);

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

  const purchaseDecisionRows = useMemo(() => {
    const allRequirements = [
      ...materialRequirementReport.consolidatedRawMaterials.map(item => ({ ...item, materialType: 'Raw Material' })),
      ...materialRequirementReport.consolidatedPackagingMaterials.map(item => ({ ...item, materialType: 'Packaging Material' })),
    ];
    const sachetKgTotals = new Map<string, { materialId: string; name: string; totalRequired: number; unit: string; materialType: string }>();

    reportInputs.forEach(input => {
      const production = calculateProduction(input.recipe, materials, input.productionKg);
      const packaging = calculatePackaging(production.totalFinishedUnits, input.recipe.packaging || [], materials);
      packaging
        .filter(item => item.packagingUnit === 'Roll' && item.emptySachetWeightG && item.emptySachetWeightG > 0)
        .forEach(item => {
          const requiredKg = (item.requiredSachets * (item.emptySachetWeightG || 0)) / 1000;
          const key = `${item.materialId}-sachet-kg`;
          const existing = sachetKgTotals.get(key);
          sachetKgTotals.set(key, {
            materialId: key,
            name: `${item.name || item.materialId} Sachet Kg`,
            totalRequired: Number(((existing?.totalRequired || 0) + requiredKg).toFixed(6)),
            unit: 'kg',
            materialType: 'Sachet Kg Requirement',
          });
        });
    });

    return [...allRequirements, ...Array.from(sachetKgTotals.values())].map(item => {
      const material = materials.find(mat => mat.id === item.materialId);
      const availableStock = material?.stock || 0;
      const pendingPo = Number(pendingPoByMaterial[item.materialId]) || 0;
      const qtyToPurchase = Math.max(0, Number((item.totalRequired - availableStock - pendingPo).toFixed(6)));

      return {
        ...item,
        materialType: item.materialType,
        availableStock,
        pendingPo,
        qtyToPurchase,
      };
    });
  }, [materialRequirementReport, materials, pendingPoByMaterial]);

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">System Reports</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium">From Date</label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">To Date</label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <Button variant="secondary">Filter</Button>
            <div className="flex-1" />
            <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Excel</Button>
            <Button variant="default"><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="production" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="production">Production Report</TabsTrigger>
              <TabsTrigger value="requirement">Requirement Report</TabsTrigger>
              <TabsTrigger value="packaging">Packaging Report</TabsTrigger>
              <TabsTrigger value="inventory">Material Report</TabsTrigger>
            </TabsList>
            
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
                  <h3 className="text-xl font-semibold mb-4">Purchase Requirement</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Total Requirement</TableHead>
                        <TableHead>Available Stock</TableHead>
                        <TableHead>Pending PO</TableHead>
                        <TableHead>Qty To Purchase</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseDecisionRows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Select recipes to calculate purchase requirement.</TableCell>
                        </TableRow>
                      )}
                      {purchaseDecisionRows.map(row => (
                        <TableRow key={`${row.materialId}-${row.unit}`}>
                          <TableCell>{row.name}</TableCell>
                          <TableCell>{row.materialType}</TableCell>
                          <TableCell>{row.totalRequired} {row.unit}</TableCell>
                          <TableCell>{row.availableStock} {row.unit}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={pendingPoByMaterial[row.materialId] || ''}
                              onChange={event => setPendingPoByMaterial(prev => ({ ...prev, [row.materialId]: event.target.value }))}
                              className="max-w-32"
                            />
                          </TableCell>
                          <TableCell>{row.qtyToPurchase} {row.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            
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
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
