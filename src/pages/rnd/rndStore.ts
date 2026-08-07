import type { BaseFormulaIngredientDraft } from './baseFormulaUtils';
import type { Material } from '@/context/ErpContext';

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

const baseFormulas: SavedBaseFormulaRecord[] = [];
const trialRecords: SavedTrialRecord[] = [];
const formulaVersions: FormulaVersionRecord[] = [];
const sampleInventoryRecords: SampleInventoryRecord[] = [];

const cloneSampleRecord = (record: SampleInventoryRecord): SampleInventoryRecord => ({
  ...record,
  history: record.history.map(entry => ({ ...entry })),
});

const getSampleStatus = (balance: number): SampleInventoryStatus => {
  if (balance <= 0) return 'Depleted';
  if (balance < 10) return 'Low Stock';
  return 'Available';
};

export const getBaseFormulas = () => baseFormulas.map(record => ({
  ...record,
  ingredients: record.ingredients.map(ingredient => ({ ...ingredient })),
}));

export const getBaseFormulaById = (baseFormulaId: string) => baseFormulas.find(record => record.id === baseFormulaId) || null;

export const getNextBaseFormulaNumber = () => String(baseFormulas.length + 1).padStart(4, '0');

export const saveBaseFormula = (record: SavedBaseFormulaRecord) => {
  baseFormulas.push({
    ...record,
    ingredients: record.ingredients.map(ingredient => ({ ...ingredient })),
  });
};

export const getTrialRecords = () => trialRecords.map(record => ({
  ...record,
  ingredients: record.ingredients.map(ingredient => ({ ...ingredient })),
  assessment: record.assessment ? { ...record.assessment } : undefined,
}));

export const getTrialById = (trialId: string) => trialRecords.find(record => record.trialId === trialId) || null;

export const getNextTrialNumber = () => String(trialRecords.length + 1).padStart(4, '0');

export const saveTrialRecord = (record: SavedTrialRecord) => {
  trialRecords.push({
    ...record,
    ingredients: record.ingredients.map(ingredient => ({ ...ingredient })),
    assessment: record.assessment ? { ...record.assessment } : undefined,
  });
};

export const saveTrialAssessment = (trialId: string, assessment: TrialAssessmentRecord) => {
  const target = trialRecords.find(record => record.trialId === trialId);
  if (!target) return;
  target.assessment = { ...assessment };
};

export const getFormulaVersions = () => formulaVersions.map(record => ({
  ...record,
  ingredients: record.ingredients.map(ingredient => ({ ...ingredient })),
}));

export const getFormulaVersionsForProduct = (productId: string) => formulaVersions.filter(record => record.productId === productId).map(record => ({
  ...record,
  ingredients: record.ingredients.map(ingredient => ({ ...ingredient })),
}));

export const getApprovedTrials = () => trialRecords.filter(record => record.assessment?.verdict === 'Approved for Next Stage');

export const getCurrentFormulaVersionForProduct = (productId: string) => formulaVersions.find(record => record.productId === productId && record.status === 'Current') || null;

export const getNextFormulaVersionLabel = (productId: string) => {
  const versions = formulaVersions.filter(record => record.productId === productId);
  return `v${versions.length + 1}`;
};

export const saveFormulaVersion = (record: FormulaVersionRecord) => {
  const currentVersion = formulaVersions.find(item => item.productId === record.productId && item.status === 'Current');
  if (record.status === 'Current' && currentVersion && currentVersion.id !== record.id) {
    currentVersion.status = 'Archived';
  }

  const existingIndex = formulaVersions.findIndex(item => item.id === record.id);
  const nextRecord = {
    ...record,
    ingredients: record.ingredients.map(ingredient => ({ ...ingredient })),
  };

  if (existingIndex >= 0) {
    formulaVersions[existingIndex] = nextRecord;
  } else {
    formulaVersions.push(nextRecord);
  }

  if (record.status === 'Current') {
    formulaVersions.forEach(item => {
      if (item.productId === record.productId && item.id !== record.id && item.status === 'Current') {
        item.status = 'Archived';
      }
    });
  }
};

const toNumber = (value: string | number | undefined) => Number(value || 0);

export const buildFormulaVersionFromApprovedTrial = (trialId: string, createdBy: string) => {
  const trial = trialRecords.find(record => record.trialId === trialId);
  if (!trial || trial.assessment?.verdict !== 'Approved for Next Stage') return null;

  const baseFormula = baseFormulas.find(record => record.id === trial.baseFormulaId);
  if (!baseFormula) return null;

  const nextFormulaId = `FL-${String(formulaVersions.length + 1).padStart(4, '0')}`;
  const nextVersion = getNextFormulaVersionLabel(baseFormula.productId);

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

export const archiveFormulaVersion = (formulaId: string) => {
  const target = formulaVersions.find(record => record.id === formulaId);
  if (!target) return;
  target.status = 'Archived';
};

export const getSampleInventoryRecords = () => sampleInventoryRecords.map(cloneSampleRecord);

export const getSampleInventoryById = (sampleId: string) => sampleInventoryRecords.find(record => record.sampleId === sampleId) || null;

export const seedSampleInventoryRecords = (materials: Material[]) => {
  void materials;
  return getSampleInventoryRecords();
};

export const receiveSample = (input: {
  rawMaterialId: string;
  rawMaterialName: string;
  manufacturer: string;
  batchNumber: string;
  receivedDate: string;
  receivedQuantity: number;
  unit: string;
  remarks: string;
}) => {
  const record: SampleInventoryRecord = {
    id: `sample-${Date.now()}`,
    sampleId: `SMP-${String(sampleInventoryRecords.length + 1).padStart(4, '0')}`,
    rawMaterialId: input.rawMaterialId,
    rawMaterialName: input.rawMaterialName,
    manufacturer: input.manufacturer,
    batchNumber: input.batchNumber || `${input.rawMaterialId}-${Date.now().toString().slice(-4)}`,
    receivedDate: input.receivedDate,
    receivedQuantity: input.receivedQuantity,
    unit: input.unit,
    currentBalance: input.receivedQuantity,
    status: getSampleStatus(input.receivedQuantity),
    history: [
      {
        id: `hist-${Date.now()}`,
        date: input.receivedDate,
        action: 'Receive Sample',
        quantity: input.receivedQuantity,
        balance: input.receivedQuantity,
        remarks: input.remarks.trim() || 'Sample received',
      },
    ],
  };

  sampleInventoryRecords.unshift(record);
  return cloneSampleRecord(record);
};

export const issueSample = (sampleId: string, quantity: number, date: string, remarks: string) => {
  const target = sampleInventoryRecords.find(record => record.sampleId === sampleId);
  if (!target || quantity <= 0 || quantity > target.currentBalance) return null;

  target.currentBalance -= quantity;
  target.status = getSampleStatus(target.currentBalance);
  target.history.unshift({
    id: `hist-${Date.now()}`,
    date,
    action: 'Issue Sample',
    quantity: -quantity,
    balance: target.currentBalance,
    remarks: remarks.trim() || 'Sample issued',
  });

  return cloneSampleRecord(target);
};

export const adjustSampleQuantity = (sampleId: string, quantity: number, mode: 'Increase' | 'Decrease', date: string, remarks: string) => {
  const target = sampleInventoryRecords.find(record => record.sampleId === sampleId);
  if (!target || quantity <= 0) return null;
  if (mode === 'Decrease' && quantity > target.currentBalance) return null;

  const delta = mode === 'Increase' ? quantity : -quantity;
  target.currentBalance = Math.max(0, target.currentBalance + delta);
  target.status = getSampleStatus(target.currentBalance);
  target.history.unshift({
    id: `hist-${Date.now()}`,
    date,
    action: 'Adjust Quantity',
    quantity: target.currentBalance - (target.currentBalance - delta),
    balance: target.currentBalance,
    remarks: remarks.trim() || `${mode} adjustment`,
  });

  return cloneSampleRecord(target);
};
