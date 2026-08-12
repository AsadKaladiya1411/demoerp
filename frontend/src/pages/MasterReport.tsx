import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useErpData } from '@/context/ErpContext';
import { calculateBoxPlanning, calculatePackaging, calculateProduction, getPackagingRequiredDisplay, normalizeRecipeBoxConfig } from '@/lib/production';

export function MasterReport() {
  const { categories, products, flavours, manufacturers, materials, recipes, productionPlans } = useErpData();

  const plan = productionPlans[0] || null;
  const recipe = plan ? recipes.find(item => item.id === plan.recipeId) || recipes[0] : recipes[0];
  const product = recipe ? products.find(item => item.id === recipe.productId) : undefined;
  const flavour = recipe ? flavours.find(item => item.id === recipe.flavourId) : undefined;
  const category = product ? categories.find(item => item.id === product.categoryId) : undefined;
  const manufacturer = plan
    ? manufacturers.find(item => item.id === plan.manufacturerId)
    : manufacturers.find(item => item.id === product?.manufacturerId);
  const productionKg = plan?.quantity || recipe?.batchSize || 0;
  const productionSummary = recipe ? calculateProduction(recipe, materials, productionKg) : null;
  const packagingResults = productionSummary && recipe?.packaging?.length
    ? calculatePackaging(productionSummary.totalFinishedUnits, recipe.packaging, materials)
    : [];
  const boxPlanningReport = productionSummary && recipe
    ? calculateBoxPlanning({
        boxConfig: recipe.boxConfig,
        flavours: normalizeRecipeBoxConfig(recipe.boxConfig, recipe.flavourId).assortedBox.allowedFlavourIds.map(flavourId => ({
          flavourId,
          flavourName: flavours.find(item => item.id === flavourId)?.name || flavourId,
          recipeName: recipe.version,
          version: recipe.version,
          producedSachets: flavourId === recipe.flavourId ? productionSummary.totalFinishedUnits : 0,
          assortedSachetsPerBox: normalizeRecipeBoxConfig(recipe.boxConfig, recipe.flavourId).assortedBox.composition[flavourId] ?? 0,
        })),
      })
    : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Master Report</h2>
        <div className="space-x-2">
          <Button variant="outline"><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button><Download className="mr-2 h-4 w-4" /> Export PDF</Button>
        </div>
      </div>

      <Card className="print:shadow-none print:border-none p-8">
        <CardHeader className="text-center border-b pb-6 mb-6">
          <CardTitle className="text-4xl text-primary font-black uppercase tracking-wider">Jolly Group of Companies</CardTitle>
          <p className="text-lg text-muted-foreground mt-2">Comprehensive Production Master Report</p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {!recipe || !productionSummary ? (
            <div className="text-center py-12 text-muted-foreground">Recipe data is not available.</div>
          ) : (
            <>
              <section className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-6 rounded-lg border">
                <div>
                  <div className="text-sm text-muted-foreground">Batch Number</div>
                  <div className="font-bold text-lg">{plan?.batch || recipe.id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Manufacturing Date</div>
                  <div className="font-bold text-lg">{plan?.mfgDate || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Pack Size</div>
                  <div className="font-bold text-lg">{recipe.packSize}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Production Quantity</div>
                  <div className="font-bold text-lg text-primary">{productionKg} kg</div>
                </div>
              </section>

              <section className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4 border-b pb-2">Product Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">Category:</span> <span className="font-medium">{category?.name || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Product:</span> <span className="font-medium">{product?.name || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Flavour:</span> <span className="font-medium">{flavour?.name || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Recipe Version:</span> <span className="font-medium">{recipe.version}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Manufacturer:</span> <span className="font-medium">{manufacturer?.name || '-'}</span></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-4 border-b pb-2">Packaging Summary</h3>
                  <div className="space-y-3 bg-primary/5 p-4 rounded-md border border-primary/20">
                    <div className="flex justify-between"><span className="font-medium">Total Sachets:</span> <span className="font-bold">{productionSummary.totalFinishedUnits}</span></div>
                    <div className="flex justify-between"><span className="font-medium">Assorted Boxes:</span> <span className="font-bold">{boxPlanningReport?.summary.assortedBoxes ?? 0}</span></div>
                    <div className="flex justify-between"><span className="font-medium">{flavour?.name || 'Flavoured'} Boxes:</span> <span className="font-bold">{boxPlanningReport?.summary.flavouredBoxes ?? 0}</span></div>
                    <div className="flex justify-between pt-2 border-t border-primary/20"><span className="font-medium text-destructive">Remaining Sachets:</span> <span className="font-bold text-destructive">{boxPlanningReport?.summary.remainingSachets ?? 0}</span></div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-bold mb-4 border-b pb-2">Material Requirements</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-2">Raw Materials</h4>
                    <table className="w-full text-sm">
                      <tbody className="divide-y">
                        {productionSummary.rawMaterials.map(item => (
                          <tr key={item.materialId}>
                            <td className="py-2">{item.name || item.materialId}</td>
                            <td className="py-2 text-right font-medium">{item.required.toFixed(3)} {item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div>
                    <h4 className="font-semibold text-muted-foreground mb-2">Packaging Materials</h4>
                    <table className="w-full text-sm">
                      <tbody className="divide-y">
                        {packagingResults.map(item => {
                          const display = getPackagingRequiredDisplay(item);
                          return (
                            <tr key={item.materialId}>
                              <td className="py-2">{item.name || item.materialId}</td>
                              <td className="py-2 text-right font-medium">{display.quantity} {display.unit}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}

          <section className="pt-12 grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-b-2 border-dashed border-gray-300 w-48 mx-auto mb-2" />
              <div className="font-semibold text-sm">Prepared By</div>
              <div className="text-xs text-muted-foreground">Planning Dept</div>
            </div>
            <div className="text-center">
              <div className="border-b-2 border-dashed border-gray-300 w-48 mx-auto mb-2" />
              <div className="font-semibold text-sm">Approved By</div>
              <div className="text-xs text-muted-foreground">Factory Manager</div>
            </div>
          </section>
        </CardContent>
      </Card>
    </motion.div>
  );
}
