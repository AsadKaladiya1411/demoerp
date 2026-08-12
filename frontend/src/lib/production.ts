export type Unit = 'kg' | 'g' | 'pcs' | 'roll' | 'bundle' | 'meter' | string;
export type PackagingUnit = 'Nos' | 'Roll';

export const MASTER_FORMULA_GRAMS = 100;

export interface MaterialRef {
  id: string;
  name?: string;
  unit: Unit;
  packWeightKg?: number;
  stock?: number;
}

export interface RecipeMaterialReq {
  materialId: string;
  quantity: number;
  unit: Unit;
  make?: string;
}

export interface RecipePackagingReq {
  materialId: string;
  unit: PackagingUnit;
  count?: number;
  rollWeightKg?: number;
  emptySachetWeightG?: number;
  wastagePercent?: number;
}

export interface RecipePayload {
  id: string;
  masterQuantity: number;
  batchSize?: number;
  packSize?: string;
  boxConfig?: RecipeBoxConfigLike;
  servingSize?: string;
  materials: RecipeMaterialReq[];
}

export interface RecipeBoxConfig {
  defaultAssortedPercentage: number;
  defaultFlavouredPercentage: number;
  flavouredBox: {
    sachetsPerBox: number;
  };
  assortedBox: {
    sachetsPerBox: number;
    allowedFlavourIds: string[];
    composition: Record<string, number>;
  };
}

type LegacyRecipeBoxConfig = {
  assortedPercentage?: number;
  flavouredPercentage?: number;
  flavouredSachetsPerBox?: number;
  assortedSachetsPerBox?: number;
  assortedComposition?: Record<string, number>;
};

export type RecipeBoxConfigLike = RecipeBoxConfig | LegacyRecipeBoxConfig;

export interface RawMaterialCalculated {
  materialId: string;
  name?: string;
  make?: string;
  required: number;
  requiredBaseGrams?: number;
  perServingQuantityG?: number;
  percentage?: number;
  unit: Unit;
}

export interface PackagingCalculated {
  materialId: string;
  name?: string;
  packagingUnit: PackagingUnit;
  requiredSachets: number;
  count?: number;
  rollWeightKg?: number;
  emptySachetWeightG?: number;
  wastagePercent?: number;
  totalSachetsInOneRoll?: number;
  requiredRolls?: number;
  requiredNos?: number;
}

export interface ProductionSummary {
  productionKg: number;
  servingSizeG: number;
  totalFinishedUnits: number;
  totalGrams: number;
  rawMaterials: RawMaterialCalculated[];
  totalBoxes?: number;
  looseUnits?: number;
  lossKg?: number;
}

export interface MaterialRequirementReportInput {
  recipe: RecipePayload & {
    version: string;
    packaging?: RecipePackagingReq[];
  };
  recipeName: string;
  productionKg: number;
}

export interface RecipeWiseRawMaterialRequirement {
  materialId: string;
  name: string;
  required: number;
  unit: Unit;
}

export interface RecipeWisePackagingRequirement {
  materialId: string;
  name: string;
  required: number;
  unit: string;
}

export interface RecipeWiseRequirement {
  recipeId: string;
  recipeName: string;
  version: string;
  productionKg: number;
  rawMaterials: RecipeWiseRawMaterialRequirement[];
  packagingMaterials: RecipeWisePackagingRequirement[];
}

export interface ConsolidatedRequirement {
  materialId: string;
  name: string;
  totalRequired: number;
  unit: string;
}

export interface ConsolidatedMaterialRequirementReport {
  recipeWiseRequirements: RecipeWiseRequirement[];
  consolidatedRawMaterials: ConsolidatedRequirement[];
  consolidatedPackagingMaterials: ConsolidatedRequirement[];
}

export interface BoxPlanningFlavourInput {
  flavourId: string;
  flavourName: string;
  recipeName: string;
  version: string;
  producedSachets: number;
  assortedSachetsPerBox: number;
}

export interface BoxPlanningInput {
  boxConfig: RecipeBoxConfigLike;
  flavours: BoxPlanningFlavourInput[];
}

export interface BoxPlanningFlavourResult {
  flavourId: string;
  flavourName: string;
  recipeName: string;
  version: string;
  producedSachets: number;
  usedInAssorted: number;
  remainingSachets: number;
  flavouredBoxes: number;
  remainingLooseSachets: number;
}

export interface BoxPlanningSummary {
  totalSachets: number;
  assortedPercentage: number;
  flavouredPercentage: number;
  targetAssortedSachets: number;
  assortedSachets: number;
  flavouredSachets: number;
  assortedBoxes: number;
  flavouredBoxes: number;
  remainingSachets: number;
  maximumPossibleAssortedBoxes: number;
}

export interface BoxPlanningReport {
  summary: BoxPlanningSummary;
  flavours: BoxPlanningFlavourResult[];
  validationMessages: string[];
}

function parseServingSize(s?: string): number | undefined {
  if (!s) return undefined;
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? undefined : n;
}

function normalizeUnit(unit?: string): Unit {
  return (unit || 'pcs').toLowerCase();
}

export function normalizeRecipeBoxConfig(config?: RecipeBoxConfigLike, ownFlavourId?: string): RecipeBoxConfig {
  const legacy = config as LegacyRecipeBoxConfig | undefined;
  const current = config as RecipeBoxConfig | undefined;
  const composition = current?.assortedBox?.composition || legacy?.assortedComposition || {};
  const allowedFlavourIds = current?.assortedBox?.allowedFlavourIds?.length
    ? current.assortedBox.allowedFlavourIds
    : Object.keys(composition).length
      ? Object.keys(composition)
      : ownFlavourId
        ? [ownFlavourId]
        : [];

  return {
    defaultAssortedPercentage: current?.defaultAssortedPercentage ?? legacy?.assortedPercentage ?? 20,
    defaultFlavouredPercentage: current?.defaultFlavouredPercentage ?? legacy?.flavouredPercentage ?? 80,
    flavouredBox: {
      sachetsPerBox: current?.flavouredBox?.sachetsPerBox ?? legacy?.flavouredSachetsPerBox ?? 10,
    },
    assortedBox: {
      sachetsPerBox: current?.assortedBox?.sachetsPerBox ?? legacy?.assortedSachetsPerBox ?? 20,
      allowedFlavourIds,
      composition,
    },
  };
}

export function validateRecipeFormulaTotal(materials: RecipeMaterialReq[], expectedTotal = MASTER_FORMULA_GRAMS): boolean {
  const total = materials.reduce((sum, m) => sum + (m.quantity || 0), 0);
  return total === expectedTotal;
}

export function validatePackagingRow(row: RecipePackagingReq, material?: MaterialRef): string | null {
  if (!row.materialId) return 'Packaging material is required';
  if (row.unit === 'Nos' && (!row.count || row.count <= 0)) return 'Piece-wise packaging count is required';
  if (row.unit === 'Roll') {
    const rollWeight = row.rollWeightKg ?? material?.packWeightKg;
    if (!rollWeight || rollWeight <= 0) return 'Roll weight (Kg) is required for Roll packaging';
    if (!row.emptySachetWeightG || row.emptySachetWeightG <= 0) return 'Empty sachet weight (g) is required for Roll packaging';
    if (row.wastagePercent !== undefined && row.wastagePercent < 0) return 'Wastage % cannot be negative';
  }
  return null;
}

export function getPackagingRequiredDisplay(item: PackagingCalculated): { quantity: number; unit: string } {
  if (item.packagingUnit === 'Roll') {
    return { quantity: item.requiredRolls ?? 0, unit: 'Roll' };
  }
  return { quantity: item.requiredNos ?? item.requiredSachets, unit: 'Nos' };
}

export function getPackagingStockDeduction(item: PackagingCalculated, material: MaterialRef): number {
  if (item.packagingUnit === 'Roll') {
    const rolls = item.requiredRolls ?? 0;
    const rollWeightKg = item.rollWeightKg ?? material.packWeightKg ?? 0;
    if (material.unit === 'kg') return rolls * rollWeightKg;
    return rolls;
  }
  return item.requiredNos ?? item.requiredSachets;
}

/**
 * Production Calculation — scales the 100g master recipe to production quantity.
 * Returns raw material requirements only. Does NOT calculate packaging.
 * Packaging must be calculated separately via calculatePackaging() using this output.
 */
export function calculateProduction(
  recipe: RecipePayload,
  materialsRef: MaterialRef[],
  productionKg: number,
  boxUnits?: number
): ProductionSummary {
  const totalGrams = productionKg * 1000;
  const servingSizeG = parseServingSize(recipe.servingSize);
  const formulaBaseG = recipe.masterQuantity || MASTER_FORMULA_GRAMS;
  const servingBaseG = servingSizeG || formulaBaseG;
  const totalFinishedUnits = Math.floor(totalGrams / servingBaseG);
  const scale = totalGrams / formulaBaseG;

  const rawMaterials: RawMaterialCalculated[] = recipe.materials.map(m => {
    const qtyInGrams = m.quantity * scale;
    const mat = materialsRef.find(x => x.id === m.materialId);
    const unit = normalizeUnit(mat?.unit || m.unit || 'g');
    const perServingQuantityG = (m.quantity / 100) * servingBaseG;
    let required = qtyInGrams;
    if (unit === 'kg') required = qtyInGrams / 1000;
    return {
      materialId: m.materialId,
      name: mat?.name,
      make: m.make,
      required: Number(required.toFixed(6)),
      requiredBaseGrams: qtyInGrams,
      perServingQuantityG: Number(perServingQuantityG.toFixed(6)),
      percentage: m.quantity,
      unit
    };
  });

  let totalBoxes: number | undefined;
  let looseUnits: number | undefined;
  if (boxUnits && boxUnits > 0) {
    totalBoxes = Math.floor(totalFinishedUnits / boxUnits);
    looseUnits = totalFinishedUnits % boxUnits;
  }

  return {
    productionKg,
    servingSizeG: servingBaseG,
    totalFinishedUnits,
    totalGrams,
    rawMaterials,
    totalBoxes,
    looseUnits,
    lossKg: 0,
  };
}

/**
 * Packaging Calculation — always derived from Production output.
 *
 * Architecture: Recipe → Production → Packaging
 *
 * @param requiredSachets  totalFinishedUnits from ProductionSummary
 * @param packagingConfig  packaging configuration from the Recipe model
 * @param materialsRef     material master data for name/unit lookups
 *
 * Business Rules:
 *   Unit = Nos  → Required Packaging = Required Sachets
 *   Unit = Roll →
 *     Total Sachets In Roll = floor((Roll Weight Kg × 1000) / Empty Sachet Weight g)
 *     Required Rolls        = ceil(Required Sachets / Total Sachets In Roll)
 */
export function calculatePackaging(
  requiredSachets: number,
  packagingConfig: RecipePackagingReq[],
  materialsRef: MaterialRef[]
): PackagingCalculated[] {
  return packagingConfig.map(p => {
    const mat = materialsRef.find(x => x.id === p.materialId);
    const packagingUnit: PackagingUnit = p.unit === 'Roll' ? 'Roll' : 'Nos';

    if (packagingUnit === 'Roll') {
      const rollWeightKg = p.rollWeightKg ?? mat?.packWeightKg;
      const emptySachetWeightG = p.emptySachetWeightG;
      const rollWeightG = rollWeightKg ? rollWeightKg * 1000 : 0;
      const usableRollWeightG = rollWeightG * (1 - ((p.wastagePercent || 0) / 100));
      const totalSachetsInOneRoll =
        usableRollWeightG > 0 && emptySachetWeightG ? Math.floor(usableRollWeightG / emptySachetWeightG) : 0;
      const requiredRolls =
        totalSachetsInOneRoll > 0 ? Math.ceil(requiredSachets / totalSachetsInOneRoll) : 0;

      return {
        materialId: p.materialId,
        name: mat?.name,
        packagingUnit: 'Roll' as PackagingUnit,
        requiredSachets,
        rollWeightKg,
        emptySachetWeightG,
        wastagePercent: p.wastagePercent,
        totalSachetsInOneRoll,
        requiredRolls,
      };
    }

    return {
      materialId: p.materialId,
      name: mat?.name,
      packagingUnit: 'Nos' as PackagingUnit,
      requiredSachets,
      count: p.count,
      requiredNos: requiredSachets * (p.count || 1),
    };
  });
}

function sortByName<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

function addConsolidatedRequirement(
  consolidated: Map<string, ConsolidatedRequirement>,
  materialId: string,
  name: string,
  required: number,
  unit: string
) {
  const existing = consolidated.get(materialId);
  if (existing) {
    consolidated.set(materialId, {
      ...existing,
      totalRequired: Number((existing.totalRequired + required).toFixed(6)),
    });
    return;
  }

  consolidated.set(materialId, {
    materialId,
    name,
    totalRequired: Number(required.toFixed(6)),
    unit,
  });
}

export function generateConsolidatedMaterialRequirementReport(
  inputs: MaterialRequirementReportInput[],
  materialsRef: MaterialRef[]
): ConsolidatedMaterialRequirementReport {
  const rawMaterialTotals = new Map<string, ConsolidatedRequirement>();
  const packagingMaterialTotals = new Map<string, ConsolidatedRequirement>();

  const recipeWiseRequirements = inputs.map(input => {
    const production = calculateProduction(input.recipe, materialsRef, input.productionKg);
    const packaging = input.recipe.packaging?.length
      ? calculatePackaging(production.totalFinishedUnits, input.recipe.packaging, materialsRef)
      : [];

    const rawMaterials = production.rawMaterials.map(item => {
      const name = item.name || item.materialId;
      addConsolidatedRequirement(rawMaterialTotals, item.materialId, name, item.required, item.unit);
      return {
        materialId: item.materialId,
        name,
        required: item.required,
        unit: item.unit,
      };
    });

    const packagingMaterials = packaging.map(item => {
      const display = getPackagingRequiredDisplay(item);
      const name = item.name || item.materialId;
      addConsolidatedRequirement(packagingMaterialTotals, item.materialId, name, display.quantity, display.unit);
      return {
        materialId: item.materialId,
        name,
        required: display.quantity,
        unit: display.unit,
      };
    });

    return {
      recipeId: input.recipe.id,
      recipeName: input.recipeName,
      version: input.recipe.version,
      productionKg: input.productionKg,
      rawMaterials: sortByName(rawMaterials),
      packagingMaterials: sortByName(packagingMaterials),
    };
  });

  return {
    recipeWiseRequirements,
    consolidatedRawMaterials: sortByName(Array.from(rawMaterialTotals.values())),
    consolidatedPackagingMaterials: sortByName(Array.from(packagingMaterialTotals.values())),
  };
}

function hasNegativeBoxPlanningValue(input: BoxPlanningInput): boolean {
  const boxConfig = normalizeRecipeBoxConfig(input.boxConfig);
  return [
    boxConfig.defaultAssortedPercentage,
    boxConfig.defaultFlavouredPercentage,
    boxConfig.assortedBox.sachetsPerBox,
    boxConfig.flavouredBox.sachetsPerBox,
    ...input.flavours.flatMap(flavour => [flavour.producedSachets, flavour.assortedSachetsPerBox]),
  ].some(value => value < 0);
}

export function calculateBoxPlanning(input: BoxPlanningInput): BoxPlanningReport {
  const validationMessages: string[] = [];
  const boxConfig = normalizeRecipeBoxConfig(input.boxConfig);
  const assortedPercentage = boxConfig.defaultAssortedPercentage;
  const flavouredPercentage = boxConfig.defaultFlavouredPercentage;
  const configuredComposition = boxConfig.assortedBox.composition;
  const allowedFlavourIds = new Set(boxConfig.assortedBox.allowedFlavourIds);
  const totalSachets = input.flavours.reduce((sum, flavour) => sum + Math.floor(flavour.producedSachets), 0);
  const flavoursWithComposition = input.flavours.map(flavour => ({
    ...flavour,
    assortedSachetsPerBox: configuredComposition[flavour.flavourId] ?? flavour.assortedSachetsPerBox,
  }));
  const assortedRecipeSachetsPerBox = flavoursWithComposition.reduce((sum, flavour) => sum + Math.floor(flavour.assortedSachetsPerBox), 0);
  const assortedSachetsPerBox = boxConfig.assortedBox.sachetsPerBox;
  const effectiveAssortedSachetsPerBox = assortedRecipeSachetsPerBox || assortedSachetsPerBox;

  if (assortedPercentage + flavouredPercentage !== 100) {
    validationMessages.push('Assorted and Flavoured percentages must equal exactly 100%.');
  }
  if (hasNegativeBoxPlanningValue(input)) {
    validationMessages.push('Negative values are not allowed.');
  }
  if (assortedPercentage > 0 && assortedSachetsPerBox <= 0) {
    validationMessages.push('Assorted sachets per box must be greater than 0.');
  }
  if (flavouredPercentage > 0 && boxConfig.flavouredBox.sachetsPerBox <= 0) {
    validationMessages.push('Flavoured sachets per box must be greater than 0.');
  }
  if (assortedPercentage > 0 && boxConfig.assortedBox.allowedFlavourIds.length === 0) {
    validationMessages.push('At least one flavour must be allowed for assorted boxes.');
  }
  if (assortedPercentage > 0 && assortedRecipeSachetsPerBox !== assortedSachetsPerBox) {
    validationMessages.push('Assorted flavour composition must equal assorted sachets per box.');
  }
  if (assortedPercentage > 0 && flavoursWithComposition.some(flavour => flavour.assortedSachetsPerBox > 0 && !allowedFlavourIds.has(flavour.flavourId))) {
    validationMessages.push('Assorted composition can only use allowed flavours.');
  }

  const configuredFlavours = flavoursWithComposition.filter(flavour => flavour.assortedSachetsPerBox > 0);
  const maximumPossibleAssortedBoxes = configuredFlavours.length
    ? Math.min(...configuredFlavours.map(flavour => Math.floor(flavour.producedSachets / flavour.assortedSachetsPerBox)))
    : 0;

  if (assortedPercentage > 0 && configuredFlavours.length === 0) {
    validationMessages.push('At least one flavour must be configured for assorted boxes.');
  }

  const targetAssortedSachets = Math.floor(totalSachets * (assortedPercentage / 100));
  const targetAssortedBoxes = effectiveAssortedSachetsPerBox > 0 ? Math.floor(targetAssortedSachets / effectiveAssortedSachetsPerBox) : 0;
  const assortedBoxes = Math.min(targetAssortedBoxes, maximumPossibleAssortedBoxes);
  const assortedSachets = assortedBoxes * effectiveAssortedSachetsPerBox;

  if (targetAssortedBoxes > maximumPossibleAssortedBoxes) {
    validationMessages.push('Assorted boxes are limited by available flavour sachets.');
  }

  const flavours = flavoursWithComposition.map(flavour => {
    const usedInAssorted = assortedBoxes * flavour.assortedSachetsPerBox;
    const remainingSachets = Math.max(0, Math.floor(flavour.producedSachets) - usedInAssorted);
    const flavouredBoxes = boxConfig.flavouredBox.sachetsPerBox > 0 ? Math.floor(remainingSachets / boxConfig.flavouredBox.sachetsPerBox) : 0;
    const remainingLooseSachets = boxConfig.flavouredBox.sachetsPerBox > 0 ? remainingSachets % boxConfig.flavouredBox.sachetsPerBox : remainingSachets;

    return {
      flavourId: flavour.flavourId,
      flavourName: flavour.flavourName,
      recipeName: flavour.recipeName,
      version: flavour.version,
      producedSachets: Math.floor(flavour.producedSachets),
      usedInAssorted,
      remainingSachets,
      flavouredBoxes,
      remainingLooseSachets,
    };
  });

  const flavouredSachets = flavours.reduce((sum, flavour) => sum + flavour.remainingSachets, 0);
  const flavouredBoxes = flavours.reduce((sum, flavour) => sum + flavour.flavouredBoxes, 0);
  const remainingSachets = flavours.reduce((sum, flavour) => sum + flavour.remainingLooseSachets, 0);

  return {
    summary: {
      totalSachets,
      assortedPercentage,
      flavouredPercentage,
      targetAssortedSachets,
      assortedSachets,
      flavouredSachets,
      assortedBoxes,
      flavouredBoxes,
      remainingSachets,
      maximumPossibleAssortedBoxes,
    },
    flavours,
    validationMessages,
  };
}

export default { calculateProduction, calculatePackaging, validateRecipeFormulaTotal, validatePackagingRow, getPackagingRequiredDisplay, getPackagingStockDeduction, generateConsolidatedMaterialRequirementReport, calculateBoxPlanning, normalizeRecipeBoxConfig, MASTER_FORMULA_GRAMS };
