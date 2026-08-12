import type { BaseFormulaIngredientDraft } from './baseFormulaUtils';

export type TrialStatus = 'Draft' | 'In Progress' | 'Completed' | 'Selected' | 'Rejected';
export type TrialAssessmentVerdict = 'Pass' | 'Fail' | 'Need Modification' | 'Approved for Next Stage';

export type TrialAssessmentRecord = {
  tasteScore: string;
  tasteRemarks: string;
  textureScore: string;
  textureRemarks: string;
  smellScore: string;
  smellRemarks: string;
  colourScore: string;
  colourRemarks: string;
  ph: string;
  phAfter30Minutes: string;
  foamingPercent: string;
  solubility: string;
  verdict: TrialAssessmentVerdict;
  nextAction: string;
  generalRemarks: string;
};

export type FormulaVersionStatus = 'Draft' | 'Under Testing' | 'Approved' | 'Archived' | 'Current';

export type SampleInventoryStatus = 'Available' | 'Low Stock' | 'Depleted';
export type SampleInventoryAction = 'Receive Sample' | 'Issue Sample' | 'Adjust Quantity';

export type SampleInventoryHistoryRecord = {
  id: string;
  date: string;
  action: SampleInventoryAction;
  quantity: number;
  balance: number;
  remarks: string;
};

export type SampleInventoryRecord = {
  id: string;
  sampleId: string;
  rawMaterialId: string;
  rawMaterialName: string;
  manufacturer: string;
  batchNumber: string;
  receivedDate: string;
  receivedQuantity: number;
  unit: string;
  currentBalance: number;
  status: SampleInventoryStatus;
  history: SampleInventoryHistoryRecord[];
};

export type FormulaVersionRecord = {
  id: string;
  productId: string;
  productName: string;
  formulaId: string;
  version: string;
  createdDate: string;
  createdBy: string;
  status: FormulaVersionStatus;
  trialReference: string;
  ingredients: Array<{
    ingredientName: string;
    rawMaterialId: string;
    manufacturer: string;
    uom: string;
    qtyPer100g: number;
    qtyPerServing: number;
    qtyPerBatch: number;
    proteinContribution: number;
    costPerKg: number;
    costContribution: number;
    remarks: string;
  }>;
  notes?: string;
};

export type SavedBaseFormulaRecord = {
  id: string;
  baseFormulaNumber: string;
  productId: string;
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
  ingredients: Array<BaseFormulaIngredientDraft & {
    rawMaterialName: string;
    manufacturer: string;
    uom: string;
  }>;
};

export type TrialIngredientRecord = {
  id: string;
  ingredientName: string;
  rawMaterialId: string;
  manufacturer: string;
  uom: string;
  baseQuantity: number;
  trialQuantity: number;
  difference: number;
  remarks: string;
};

export type SavedTrialRecord = {
  id: string;
  trialId: string;
  trialNumber: string;
  baseFormulaId: string;
  baseFormulaName: string;
  date: string;
  objective: string;
  status: TrialStatus;
  totalWeight: number;
  remainingSpace: number;
  milkNeeded: number;
  generalNotes: string;
  ingredients: TrialIngredientRecord[];
  assessment?: TrialAssessmentRecord;
};

const toNumber = (value: string | number | undefined) => Number(value || 0);

export const buildFormulaVersionFromApprovedTrial = (trialId: string, createdBy: string, trials: SavedTrialRecord[], formulas: SavedBaseFormulaRecord[], versions: FormulaVersionRecord[]) => {
  const trial = trials.find(record => record.trialId === trialId);
  if (!trial || trial.assessment?.verdict !== 'Approved for Next Stage') return null;

  const baseFormula = formulas.find(record => record.id === trial.baseFormulaId);
  if (!baseFormula) return null;

  const nextFormulaId = `FL-${String(versions.length + 1).padStart(4, '0')}`;
  const nextVersion = `v${versions.filter(record => record.productId === baseFormula.productId).length + 1}`;

  return {
    id: nextFormulaId,
    productId: baseFormula.productId,
    productName: baseFormula.productName,
    formulaId: nextFormulaId,
    version: nextVersion,
    createdDate: new Date().toISOString().slice(0, 10),
    createdBy,
    status: 'Current' as const,
    trialReference: trial.trialId,
    ingredients: trial.ingredients.map((ingredient, index) => {
      const baseIngredient = baseFormula.ingredients[index];
      const qtyPer100g = toNumber(ingredient.trialQuantity);
      const costPerKg = toNumber(baseIngredient?.costPerKg);
      const proteinContribution = toNumber(baseIngredient?.proteinContribution);
      const qtyPerServing = qtyPer100g;
      const qtyPerBatch = qtyPer100g * (baseFormula.batchSize / 100);
      return {
        ingredientName: ingredient.ingredientName,
        rawMaterialId: ingredient.rawMaterialId,
        manufacturer: ingredient.manufacturer,
        uom: ingredient.uom,
        qtyPer100g,
        qtyPerServing,
        qtyPerBatch,
        proteinContribution,
        costPerKg,
        costContribution: qtyPerBatch * costPerKg,
        remarks: ingredient.remarks,
      };
    }),
    notes: trial.generalNotes,
  } satisfies FormulaVersionRecord;
};
