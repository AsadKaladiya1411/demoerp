import type { FormulaVersionRecord, SampleInventoryRecord, SavedBaseFormulaRecord, SavedTrialRecord } from './rndStore';

export type FormulaLibraryReportRow = {
  product: string;
  formulaId: string;
  version: string;
  createdDate: string;
  createdBy: string;
  status: string;
  trialReference: string;
};

export type TrialHistoryReportRow = {
  trialId: string;
  trialNumber: string;
  baseFormula: string;
  date: string;
  objective: string;
  status: string;
  assessmentStatus: string;
  verdict: string;
  totalWeight: number;
};

export type SampleInventoryReportRow = {
  sampleId: string;
  rawMaterial: string;
  manufacturer: string;
  batchNumber: string;
  receivedDate: string;
  receivedQuantity: number;
  unit: string;
  currentBalance: number;
  status: string;
};

export type AssessmentReportRow = {
  trialId: string;
  trialNumber: string;
  baseFormula: string;
  date: string;
  tasteScore: string;
  textureScore: string;
  smellScore: string;
  colourScore: string;
  ph: string;
  verdict: string;
  nextAction: string;
  assessmentStatus: string;
};

export type ReportMetrics = {
  totalProducts: number;
  totalBaseFormulas: number;
  totalTrials: number;
  approvedFormulas: number;
  activeFormulas: number;
  archivedFormulas: number;
  sampleInventoryItems: number;
  pendingAssessments: number;
};

export const getRndMetrics = (baseFormulas: SavedBaseFormulaRecord[], formulaVersions: FormulaVersionRecord[], trials: SavedTrialRecord[], sampleItems: SampleInventoryRecord[]): ReportMetrics => {
  const totalProducts = new Set([
    ...baseFormulas.map(record => record.productId),
    ...formulaVersions.map(record => record.productId),
  ]).size;

  return {
    totalProducts,
    totalBaseFormulas: baseFormulas.length,
    totalTrials: trials.length,
    approvedFormulas: formulaVersions.filter(record => record.status === 'Approved').length,
    activeFormulas: formulaVersions.filter(record => record.status === 'Current').length,
    archivedFormulas: formulaVersions.filter(record => record.status === 'Archived').length,
    sampleInventoryItems: sampleItems.length,
    pendingAssessments: trials.filter(record => !record.assessment).length,
  };
};

export const getFormulaStatusChartData = (formulaVersions: FormulaVersionRecord[]) => {
  const statuses = ['Draft', 'Under Testing', 'Approved', 'Current', 'Archived'] as const;
  return statuses.map(status => ({ name: status, value: formulaVersions.filter(record => record.status === status).length }));
};

export const getTrialStatusChartData = (trials: SavedTrialRecord[]) => {
  const statuses = ['Draft', 'In Progress', 'Completed', 'Selected', 'Rejected'] as const;
  return statuses.map(status => ({ name: status, value: trials.filter(record => record.status === status).length }));
};

export const getSampleStatusChartData = (sampleItems: SampleInventoryRecord[]) => {
  const statuses = ['Available', 'Low Stock', 'Depleted'] as const;
  return statuses.map(status => ({ name: status, value: sampleItems.filter(record => record.status === status).length }));
};

export const buildFormulaLibraryReportRows = (formulaVersions: FormulaVersionRecord[]): FormulaLibraryReportRow[] => formulaVersions.map(record => ({
  product: record.productName,
  formulaId: record.formulaId,
  version: record.version,
  createdDate: record.createdDate,
  createdBy: record.createdBy,
  status: record.status,
  trialReference: record.trialReference,
}));

export const buildTrialHistoryReportRows = (trials: SavedTrialRecord[]): TrialHistoryReportRow[] => trials.map(record => ({
  trialId: record.trialId,
  trialNumber: record.trialNumber,
  baseFormula: record.baseFormulaName,
  date: record.date,
  objective: record.objective,
  status: record.status,
  assessmentStatus: record.assessment ? 'Saved' : 'Pending',
  verdict: record.assessment?.verdict || '-',
  totalWeight: record.totalWeight,
}));

export const buildSampleInventoryReportRows = (sampleItems: SampleInventoryRecord[]): SampleInventoryReportRow[] => sampleItems.map(record => ({
  sampleId: record.sampleId,
  rawMaterial: record.rawMaterialName,
  manufacturer: record.manufacturer,
  batchNumber: record.batchNumber,
  receivedDate: record.receivedDate,
  receivedQuantity: record.receivedQuantity,
  unit: record.unit,
  currentBalance: record.currentBalance,
  status: record.status,
}));

export const buildAssessmentReportRows = (trials: SavedTrialRecord[]): AssessmentReportRow[] => trials
  .filter(record => record.assessment)
  .map(record => ({
    trialId: record.trialId,
    trialNumber: record.trialNumber,
    baseFormula: record.baseFormulaName,
    date: record.date,
    tasteScore: record.assessment?.tasteScore || '',
    textureScore: record.assessment?.textureScore || '',
    smellScore: record.assessment?.smellScore || '',
    colourScore: record.assessment?.colourScore || '',
    ph: record.assessment?.ph || '',
    verdict: record.assessment?.verdict || '',
    nextAction: record.assessment?.nextAction || '',
    assessmentStatus: record.assessment ? 'Saved' : 'Pending',
  }));
