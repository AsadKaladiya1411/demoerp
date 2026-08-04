import React, { createContext, useEffect, useMemo, useContext, useState, type ReactNode } from 'react';
import productionLib, { MASTER_FORMULA_GRAMS, normalizeRecipeBoxConfig, type ProductionSummary, type RecipeBoxConfig } from '@/lib/production';

export { MASTER_FORMULA_GRAMS };
export type { ProductionSummary };

// Data Types
export interface Category { id: string; code: string; name: string; description: string; status: 'Active' | 'Inactive'; createdDate: string; }
export interface Product { id: string; code: string; name: string; categoryId: string; manufacturerId?: string; shelfLife: number; expiryRequired: boolean; description: string; status: 'Active' | 'Inactive'; }
export interface Flavour { id: string; name: string; productId: string; status: 'Active' | 'Inactive'; }
export interface Manufacturer { id: string; name: string; contactPerson: string; gst: string; address: string; mobile: string; email: string; status: 'Active' | 'Inactive'; }
export const MATERIAL_QA_STATUS = {
  PURCHASED: 'Purchased',
  GOODS_INWARD: 'Goods Inward',
  UNDER_TESTING: 'Under Testing',
  TEST_APPROVED: 'Test Approved',
  TEST_REJECTED: 'Test Rejected',
} as const;

export type MaterialQaStatus = typeof MATERIAL_QA_STATUS[keyof typeof MATERIAL_QA_STATUS];

export interface Material { id: string; code: string; name: string; type: 'Raw Material' | 'Packaging Material'; unit: string; shelfLife: number; expiryRequired: boolean; supplier: string; status: 'Active' | 'Inactive'; stock?: number; minStock?: number; packWeightKg?: number; lastUpdated?: string; qaStatus?: MaterialQaStatus; }
export type VendorType = 'Raw Material' | 'Packaging Material' | 'Additional Material';
export type VendorStatus = 'Active' | 'Inactive' | 'Blocked';
export interface VendorDocument {
  gstCertificate: string;
  fssaiCertificate: string;
  coaSample: string;
  agreement: string;
  otherDocuments: string;
}
export interface Vendor {
  id: string;
  code: string;
  name: string;
  manufacturerName: string;
  vendorTypes: VendorType[];
  status: VendorStatus;
  contactPerson: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  gstNumber: string;
  panNumber: string;
  paymentTerms: string;
  leadTimeDays: number;
  materialIds: string[];
  documents: VendorDocument;
  createdDate: string;
  updatedDate?: string;
}
export interface VendorHistoryRecord {
  id: string;
  vendorId: string;
  action: 'Created' | 'Updated' | 'Deleted';
  actionDate: string;
  description: string;
}
export interface RecipeMaterial { materialId: string; quantity: number; unit: string; make?: string; }
export interface RecipePackaging { materialId: string; unit: 'Nos' | 'Roll'; count?: number; rollWeightKg?: number; emptySachetWeightG?: number; wastagePercent?: number; }
export type { RecipeBoxConfig };
export interface Recipe { id: string; productId: string; flavourId: string; version: string; masterQuantity: number; batchSize: number; packSize: string; servingSize?: string; materials: RecipeMaterial[]; packaging?: RecipePackaging[]; boxConfig: RecipeBoxConfig; }
export interface ProductionPlan { id: string; productId: string; flavourId: string; recipeId: string; manufacturerId: string; batch: string; mfgDate: string; quantity: number; type: 'Normal' | 'Trial'; status: 'Draft' | 'Pending Approval' | 'Approved'; }
export interface ProductionCalculation {
  recipeId: string;
  productId: string;
  flavourId: string;
  productionKg: number;
  finishedSachets: number;
  flavouredRatio: number;
  assortedRatio: number;
  flavouredSachets: number;
  assortedSachets: number;
  sachetsPerFlavouredBox: number;
  flavouredBoxes: number;
}
export interface RequirementReportSelection {
  selectedRecipeIds: string[];
  productionQtyByRecipe: Record<string, string>;
}
export interface AssortedBoxCalculation {
  productId: string;
  selectedFlavourIds: string[];
  servingPerBox: number;
  totalSelectedSachets: number;
  totalAssortedBoxes: number;
}
export type EmployeeBPurchaseStatus = 'Pending' | 'Ordered' | 'In Transit' | 'Delivered';
export type GoodsReceiptMaterialType = 'Raw Materials' | 'Sachets' | 'Boxes' | 'Additional Materials';
export type GoodsReceiptLineType = 'Standard' | 'Flavoured' | 'Assorted';
export type GoodsReceiptStatus = 'Pending' | 'Partially Received' | 'Completed';
export type ProductionIssueMaterialType = 'Raw Materials' | 'Sachets' | 'Boxes' | 'Additional Materials';
export type ProductionIssueStatus = 'Open' | 'Issued';
export type ProductionReturnStatus = 'Open' | 'Partially Returned' | 'Returned';
export type InventoryTransactionType = 'Goods Inward' | 'Goods Receipt' | 'QA Sample Consumption' | 'Production Issue' | 'Production Return' | 'Finished Goods Receipt';
export type InventoryTransactionStatus = 'Pending' | 'Partially Received' | 'Completed' | 'Issued' | 'Returned' | 'Recorded';
export type InventoryTransactionMaterialType = GoodsReceiptMaterialType | 'Finished Goods';
export interface EmployeeBRmPurchaseRecord {
  id: string;
  materialId: string;
  materialName: string;
  requiredQuantity: number;
  unit: string;
  purchasedQuantity: string;
  purchaseDate?: string;
  expiryDate: string;
  pricePerUnit: string;
  supplierName: string;
  poNumber: string;
  expectedDeliveryDateTime: string;
  receiverLocation: string;
  documents: string;
  remarks: string;
  status: EmployeeBPurchaseStatus;
  totalPrice: number;
}
export interface EmployeeBSachetPurchaseRecord {
  id: string;
  productName: string;
  requiredQuantity: number;
  requiredUnit: 'Roll' | 'Nos';
  requiredDisplayUnit: string;
  purchaseUnit: 'Roll' | 'Nos';
  purchasedQuantity: string;
  weightPerRollKg: string;
  pricePerKg: string;
  pricePerSachet: string;
  purchaseDate?: string;
  supplierName: string;
  poNumber: string;
  expectedDeliveryDateTime: string;
  receiverLocation: string;
  documents: string;
  remarks: string;
  status: EmployeeBPurchaseStatus;
  totalWeight: number;
  totalPrice: number;
}
export interface EmployeeBBoxPurchaseRecord {
  id: string;
  productName: string;
  flavouredBoxesRequired: number;
  assortedBoxesRequired: number;
  flavouredPurchasedQuantity: string;
  pricePerFlavouredBox: string;
  assortedPurchasedQuantity: string;
  pricePerAssortedBox: string;
  purchaseDate?: string;
  supplierName: string;
  poNumber: string;
  expectedDeliveryDateTime: string;
  receiverLocation: string;
  documents: string;
  remarks: string;
  status: EmployeeBPurchaseStatus;
  flavouredTotalPrice: number;
  assortedTotalPrice: number;
  grandTotalPrice: number;
}

export interface GoodsReceiptRecord {
  id: string;
  sourceType: GoodsReceiptMaterialType;
  sourceId: string;
  lineType?: GoodsReceiptLineType;
  materialType: GoodsReceiptMaterialType;
  materialName: string;
  inventoryMaterialId?: string;
  purchaseQuantity: number;
  unit: string;
  purchaseDate: string;
  receivedQuantity: number;
  qaSampleQuantity: number;
  availableQuantity: number;
  receivedDate: string;
  receivedBy: string;
  remarks: string;
  status: GoodsReceiptStatus;
}

export interface MaterialTestSlip {
  id: string;
  goodsReceiptId: string;
  sourceType: GoodsReceiptMaterialType;
  sourceId: string;
  lineType?: GoodsReceiptLineType;
  materialType: GoodsReceiptMaterialType;
  materialId: string;
  materialName: string;
  receivedQuantity: number;
  qaSampleQuantity: number;
  availableQuantity: number;
  unit: string;
  receivedDate: string;
  receivedBy: string;
  status: MaterialQaStatus;
  qaRemarks?: string;
}

export interface SaveMaterialTestDecisionInput {
  testSlipId: string;
  qaRemarks: string;
  decision: typeof MATERIAL_QA_STATUS.TEST_APPROVED | typeof MATERIAL_QA_STATUS.TEST_REJECTED;
}

export interface SaveGoodsReceiptInput {
  sourceType: GoodsReceiptMaterialType;
  sourceId: string;
  lineType?: GoodsReceiptLineType;
  materialType: GoodsReceiptMaterialType;
  materialName: string;
  inventoryMaterialId?: string;
  purchaseQuantity: number;
  unit: string;
  purchaseDate: string;
  receivedQuantity: number;
  qaSampleQuantity: number;
  receivedDate: string;
  receivedBy: string;
  remarks: string;
}

export interface ProductionIssueRecord {
  id: string;
  materialType: ProductionIssueMaterialType;
  materialId: string;
  materialName: string;
  availableQuantity: number;
  issuedQuantity: number;
  unit: string;
  batchNumber: string;
  issueDate: string;
  issuedBy: string;
  remarks: string;
  remainingQuantity: number;
  status: ProductionIssueStatus;
}

export interface SaveProductionIssueInput {
  materialType: ProductionIssueMaterialType;
  materialId: string;
  materialName: string;
  availableQuantity: number;
  issuedQuantity: number;
  unit: string;
  batchNumber: string;
  issueDate: string;
  issuedBy: string;
  remarks: string;
}

export interface ProductionReturnRecord {
  id: string;
  issueId: string;
  materialType: ProductionIssueMaterialType;
  materialId: string;
  materialName: string;
  batchNumber: string;
  issuedQuantity: number;
  returnedQuantity: number;
  actualConsumption: number;
  returnDate: string;
  returnedBy: string;
  returnReason: string;
  remarks: string;
  unit: string;
  remainingReturnableQuantity: number;
  status: ProductionReturnStatus;
}

export interface SaveProductionReturnInput {
  issueId: string;
  materialType: ProductionIssueMaterialType;
  materialId: string;
  materialName: string;
  batchNumber: string;
  issuedQuantity: number;
  returnedQuantity: number;
  returnDate: string;
  returnedBy: string;
  returnReason: string;
  remarks: string;
  unit: string;
}

export interface InventoryTransactionRecord {
  id: string;
  transactionDate: string;
  recordedAt: string;
  materialType: InventoryTransactionMaterialType;
  materialId: string;
  materialName: string;
  productName?: string;
  batchNumber?: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  delta: number;
  unit: string;
  runningBalance?: number;
  referenceModule: string;
  createdBy: string;
  status: InventoryTransactionStatus;
  referenceId: string;
}

type ErpPersistedState = {
  categories: Category[];
  products: Product[];
  flavours: Flavour[];
  manufacturers: Manufacturer[];
  materials: Material[];
  vendors: Vendor[];
  vendorHistoryRecords: VendorHistoryRecord[];
  recipes: Recipe[];
  productionPlans: ProductionPlan[];
  productionCalculations: ProductionCalculation[];
  requirementReportSelection: RequirementReportSelection;
  assortedBoxCalculations: AssortedBoxCalculation[];
  rmPurchaseRecords: EmployeeBRmPurchaseRecord[];
  sachetPurchaseRecords: EmployeeBSachetPurchaseRecord[];
  boxPurchaseRecords: EmployeeBBoxPurchaseRecord[];
  goodsReceiptRecords: GoodsReceiptRecord[];
  productionIssueRecords: ProductionIssueRecord[];
  productionReturnRecords: ProductionReturnRecord[];
  inventoryTransactions: InventoryTransactionRecord[];
  materialTestSlips: MaterialTestSlip[];
};

interface ErpContextType {
  categories: Category[];
  products: Product[];
  flavours: Flavour[];
  manufacturers: Manufacturer[];
  materials: Material[];
  vendors: Vendor[];
  vendorHistoryRecords: VendorHistoryRecord[];
  recipes: Recipe[];
  productionPlans: ProductionPlan[];
  productionCalculations: ProductionCalculation[];
  requirementReportSelection: RequirementReportSelection;
  assortedBoxCalculations: AssortedBoxCalculation[];
  rmPurchaseRecords: EmployeeBRmPurchaseRecord[];
  sachetPurchaseRecords: EmployeeBSachetPurchaseRecord[];
  boxPurchaseRecords: EmployeeBBoxPurchaseRecord[];
  goodsReceiptRecords: GoodsReceiptRecord[];
  productionIssueRecords: ProductionIssueRecord[];
  productionReturnRecords: ProductionReturnRecord[];
  inventoryTransactions: InventoryTransactionRecord[];
  materialTestSlips: MaterialTestSlip[];
  
  // Basic setter functions for prototype interactivity
  addCategory: (c: Category) => void;
  addProduct: (p: Product) => void;
  addFlavour: (f: Flavour) => void;
  updateFlavour: (f: Flavour) => void;
  removeFlavour: (id: string) => void;
  addManufacturer: (m: Manufacturer) => void;
  updateManufacturer: (m: Manufacturer) => void;
  removeManufacturer: (id: string) => void;
  addMaterial: (m: Material) => void;
  updateMaterial: (m: Material) => void;
  removeMaterial: (id: string) => void;
  addVendor: (vendor: Omit<Vendor, 'id' | 'code' | 'createdDate'>) => string | null;
  updateVendor: (vendor: Vendor) => string | null;
  removeVendor: (id: string) => void;
  addRecipe: (r: Recipe) => void;
  updateRecipe: (r: Recipe) => void;
  removeRecipe: (id: string) => void;
  addProductionPlan: (p: ProductionPlan) => void;
  upsertProductionCalculation: (p: ProductionCalculation) => void;
  updateRequirementReportSelection: (selection: RequirementReportSelection) => void;
  upsertAssortedBoxCalculation: (calculation: AssortedBoxCalculation) => void;
  saveRmPurchaseRecord: (record: EmployeeBRmPurchaseRecord) => void;
  saveSachetPurchaseRecord: (record: EmployeeBSachetPurchaseRecord) => void;
  saveBoxPurchaseRecord: (record: EmployeeBBoxPurchaseRecord) => void;
  saveGoodsReceipt: (input: SaveGoodsReceiptInput) => void;
  saveMaterialTestDecision: (input: SaveMaterialTestDecisionInput) => void;
  saveProductionIssue: (input: SaveProductionIssueInput) => void;
  saveProductionReturn: (input: SaveProductionReturnInput) => void;
  generateProductionSummary: (recipeId: string, productionKg: number, boxUnits?: number) => ProductionSummary | null;
}

const getInventoryTransactionId = (prefix: string, referenceId: string) => `${prefix}-${referenceId}-${Date.now()}`;

const getCalculatedGoodsReceiptQuantities = (receivedQuantity: number, qaSampleQuantity: number) => {
  const normalizedReceivedQuantity = Math.max(0, Number(receivedQuantity) || 0);
  const normalizedQaSampleQuantity = Math.max(0, Number(qaSampleQuantity) || 0);
  const availableQuantity = Math.max(0, normalizedReceivedQuantity - normalizedQaSampleQuantity);

  return {
    receivedQuantity: normalizedReceivedQuantity,
    qaSampleQuantity: normalizedQaSampleQuantity,
    availableQuantity,
  };
};

const getGoodsReceiptStatus = (purchaseQuantity: number, receivedQuantity: number): GoodsReceiptStatus => {
  if (receivedQuantity <= 0) return 'Pending';
  if (receivedQuantity < purchaseQuantity) return 'Partially Received';
  return 'Completed';
};

const getGoodsReceiptKey = (sourceType: GoodsReceiptMaterialType, sourceId: string, lineType?: GoodsReceiptLineType) => `${sourceType}:${sourceId}:${lineType || 'Standard'}`;

const defaultCategories: Category[] = [
  {
    id: 'cat-nutrition',
    code: 'CAT-NUT',
    name: 'Nutrition Powder',
    description: 'Sachet based nutrition powder products.',
    status: 'Active',
    createdDate: '2026-01-01',
  },
  {
    id: 'cat-beverage',
    code: 'CAT-BEV',
    name: 'Instant Beverage',
    description: 'Ready mix beverage powder products.',
    status: 'Active',
    createdDate: '2026-01-01',
  },
];

const defaultManufacturers: Manufacturer[] = [
  {
    id: 'mfg-jolly',
    name: 'Jolly Foods Manufacturing',
    contactPerson: 'Ramesh Patel',
    gst: '24ABCDE1234F1Z5',
    address: 'GIDC Industrial Estate, Ahmedabad, Gujarat',
    mobile: '9876543210',
    email: 'production@jollyfoods.example',
    status: 'Active',
  },
  {
    id: 'mfg-packwell',
    name: 'Packwell Co-Packers',
    contactPerson: 'Mehul Shah',
    gst: '24PQRSX9876L1Z8',
    address: 'Sanand Industrial Area, Gujarat',
    mobile: '9876501234',
    email: 'ops@packwell.example',
    status: 'Active',
  },
];

const defaultProducts: Product[] = [
  {
    id: 'prod-protein',
    code: 'PRD-PRO-001',
    name: 'Protein Nutrition Sachet',
    categoryId: 'cat-nutrition',
    manufacturerId: 'mfg-jolly',
    shelfLife: 12,
    expiryRequired: true,
    description: '30 g single serve protein nutrition sachet.',
    status: 'Active',
  },
  {
    id: 'prod-shake',
    code: 'PRD-SHK-001',
    name: 'Instant Milk Shake Sachet',
    categoryId: 'cat-beverage',
    manufacturerId: 'mfg-packwell',
    shelfLife: 9,
    expiryRequired: true,
    description: 'Single serve instant flavoured milk shake powder.',
    status: 'Active',
  },
];

const defaultFlavours: Flavour[] = [
  { id: 'flv-chocolate', name: 'Chocolate', productId: 'prod-protein', status: 'Active' },
  { id: 'flv-vanilla', name: 'Vanilla', productId: 'prod-protein', status: 'Active' },
  { id: 'flv-mango', name: 'Mango', productId: 'prod-protein', status: 'Active' },
  { id: 'flv-strawberry', name: 'Strawberry', productId: 'prod-shake', status: 'Active' },
  { id: 'flv-kesar', name: 'Kesar Pista', productId: 'prod-shake', status: 'Active' },
];

const defaultRecipes: Recipe[] = [
  {
    id: 'rec-chocolate-v1',
    productId: 'prod-protein',
    flavourId: 'flv-chocolate',
    version: 'CHOC-v1',
    masterQuantity: 100,
    batchSize: 500,
    servingSize: '30 g',
    packSize: '30 g Sachet',
    materials: [
      { materialId: 'mat-1', quantity: 45, unit: '%', make: 'Base' },
      { materialId: 'mat-2', quantity: 25, unit: '%', make: 'Sweetener' },
      { materialId: 'mat-3', quantity: 15, unit: '%', make: 'Flavour' },
      { materialId: 'mat-4', quantity: 10, unit: '%', make: 'Dairy' },
      { materialId: 'mat-5', quantity: 5, unit: '%', make: 'Premix' },
    ],
    packaging: [
      { materialId: 'mat-6', unit: 'Roll', rollWeightKg: 100, emptySachetWeightG: 1.2, wastagePercent: 2 },
    ],
    boxConfig: {
      defaultAssortedPercentage: 70,
      defaultFlavouredPercentage: 30,
      flavouredBox: { sachetsPerBox: 10 },
      assortedBox: {
        sachetsPerBox: 4,
        allowedFlavourIds: ['flv-chocolate', 'flv-vanilla', 'flv-mango'],
        composition: { 'flv-chocolate': 2, 'flv-vanilla': 1, 'flv-mango': 1 },
      },
    },
  },
  {
    id: 'rec-vanilla-v1',
    productId: 'prod-protein',
    flavourId: 'flv-vanilla',
    version: 'VAN-v1',
    masterQuantity: 100,
    batchSize: 500,
    servingSize: '30 g',
    packSize: '30 g Sachet',
    materials: [
      { materialId: 'mat-1', quantity: 48, unit: '%', make: 'Base' },
      { materialId: 'mat-2', quantity: 27, unit: '%', make: 'Sweetener' },
      { materialId: 'mat-4', quantity: 18, unit: '%', make: 'Dairy' },
      { materialId: 'mat-5', quantity: 7, unit: '%', make: 'Premix' },
    ],
    packaging: [
      { materialId: 'mat-6', unit: 'Roll', rollWeightKg: 100, emptySachetWeightG: 1.2, wastagePercent: 2 },
    ],
    boxConfig: {
      defaultAssortedPercentage: 70,
      defaultFlavouredPercentage: 30,
      flavouredBox: { sachetsPerBox: 10 },
      assortedBox: {
        sachetsPerBox: 4,
        allowedFlavourIds: ['flv-chocolate', 'flv-vanilla', 'flv-mango'],
        composition: { 'flv-chocolate': 1, 'flv-vanilla': 2, 'flv-mango': 1 },
      },
    },
  },
  {
    id: 'rec-mango-v1',
    productId: 'prod-protein',
    flavourId: 'flv-mango',
    version: 'MNG-v1',
    masterQuantity: 100,
    batchSize: 400,
    servingSize: '30 g',
    packSize: '30 g Sachet',
    materials: [
      { materialId: 'mat-1', quantity: 44, unit: '%', make: 'Base' },
      { materialId: 'mat-2', quantity: 30, unit: '%', make: 'Sweetener' },
      { materialId: 'mat-4', quantity: 18, unit: '%', make: 'Dairy' },
      { materialId: 'mat-5', quantity: 8, unit: '%', make: 'Premix' },
    ],
    packaging: [
      { materialId: 'mat-6', unit: 'Roll', rollWeightKg: 100, emptySachetWeightG: 1.2, wastagePercent: 2 },
    ],
    boxConfig: {
      defaultAssortedPercentage: 70,
      defaultFlavouredPercentage: 30,
      flavouredBox: { sachetsPerBox: 10 },
      assortedBox: {
        sachetsPerBox: 4,
        allowedFlavourIds: ['flv-chocolate', 'flv-vanilla', 'flv-mango'],
        composition: { 'flv-chocolate': 1, 'flv-vanilla': 1, 'flv-mango': 2 },
      },
    },
  },
];

const defaultProductionPlans: ProductionPlan[] = [
  {
    id: 'plan-chocolate-demo',
    productId: 'prod-protein',
    flavourId: 'flv-chocolate',
    recipeId: 'rec-chocolate-v1',
    manufacturerId: 'mfg-jolly',
    batch: 'BATCH-CHOC-001',
    mfgDate: '2026-07-15',
    quantity: 500,
    type: 'Normal',
    status: 'Approved',
  },
  {
    id: 'plan-vanilla-demo',
    productId: 'prod-protein',
    flavourId: 'flv-vanilla',
    recipeId: 'rec-vanilla-v1',
    manufacturerId: 'mfg-jolly',
    batch: 'BATCH-VAN-001',
    mfgDate: '2026-07-18',
    quantity: 300,
    type: 'Normal',
    status: 'Pending Approval',
  },
];

const defaultProductionCalculations: ProductionCalculation[] = [];
const defaultRequirementReportSelection: RequirementReportSelection = {
  selectedRecipeIds: [],
  productionQtyByRecipe: {},
};
const defaultAssortedBoxCalculations: AssortedBoxCalculation[] = [];
const defaultRmPurchaseRecords: EmployeeBRmPurchaseRecord[] = [
  {
    id: 'rm-purchase-demo-1',
    materialId: 'mat-1',
    materialName: 'MPC 85',
    requiredQuantity: 225,
    unit: 'kg',
    purchasedQuantity: '250',
    purchaseDate: '2026-08-01',
    expiryDate: '2027-07-31',
    pricePerUnit: '420',
    supplierName: 'Global Dairy',
    poNumber: 'RM-PO-001',
    expectedDeliveryDateTime: '2026-08-04T11:00',
    receiverLocation: 'Main Warehouse',
    documents: 'Pending PO.pdf, COA.pdf',
    remarks: 'Demo bulk raw material purchase.',
    status: 'Ordered',
    totalPrice: 105000,
  },
  {
    id: 'rm-purchase-demo-2',
    materialId: 'mat-2',
    materialName: 'Sugar',
    requiredQuantity: 150,
    unit: 'kg',
    purchasedQuantity: '150',
    purchaseDate: '2026-08-02',
    expiryDate: '2028-01-15',
    pricePerUnit: '42',
    supplierName: 'Sweet Co',
    poNumber: 'RM-PO-002',
    expectedDeliveryDateTime: '2026-08-02T15:30',
    receiverLocation: 'Raw Material Store',
    documents: 'Invoice.pdf, Transport Copy.pdf',
    remarks: 'Received for demo production batch.',
    status: 'Delivered',
    totalPrice: 6300,
  },
];
const defaultSachetPurchaseRecords: EmployeeBSachetPurchaseRecord[] = [
  {
    id: 'sachet-purchase-demo-1',
    productName: 'Protein Nutrition Sachet',
    requiredQuantity: 120,
    requiredUnit: 'Roll',
    requiredDisplayUnit: 'KG',
    purchaseUnit: 'Roll',
    purchasedQuantity: '50',
    weightPerRollKg: '25',
    pricePerKg: '180',
    pricePerSachet: '',
    purchaseDate: '2026-08-03',
    supplierName: 'Print Flex',
    poNumber: 'PF-PO-001',
    expectedDeliveryDateTime: '2026-08-05T10:30',
    receiverLocation: 'Main Warehouse',
    documents: 'Pending PO.pdf, Transport Copy.pdf',
    remarks: 'First lot ordered for demo production.',
    status: 'Ordered',
    totalWeight: 1250,
    totalPrice: 225000,
  },
];
const defaultBoxPurchaseRecords: EmployeeBBoxPurchaseRecord[] = [
  {
    id: 'box-purchase-demo-1',
    productName: 'Protein Nutrition Sachet',
    flavouredBoxesRequired: 500,
    assortedBoxesRequired: 300,
    flavouredPurchasedQuantity: '500',
    pricePerFlavouredBox: '12',
    assortedPurchasedQuantity: '300',
    pricePerAssortedBox: '14',
    purchaseDate: '2026-08-03',
    supplierName: 'Pack Solutions',
    poNumber: 'BOX-PO-001',
    expectedDeliveryDateTime: '2026-08-06T14:00',
    receiverLocation: 'Packaging Store',
    documents: 'Invoice.pdf, Transport Copy.pdf',
    remarks: 'Demo box purchase record.',
    status: 'In Transit',
    flavouredTotalPrice: 6000,
    assortedTotalPrice: 4200,
    grandTotalPrice: 10200,
  },
];

const defaultMaterials: Material[] = [
  { id: 'mat-1', code: 'RM-MPC-85', name: 'MPC 85', type: 'Raw Material', unit: 'kg', shelfLife: 12, expiryRequired: true, supplier: 'Global Dairy', status: 'Active', stock: 500, minStock: 100, lastUpdated: '2026-08-01' },
  { id: 'mat-2', code: 'RM-SUG-01', name: 'Sugar', type: 'Raw Material', unit: 'kg', shelfLife: 24, expiryRequired: false, supplier: 'Sweet Co', status: 'Active', stock: 1000, minStock: 200, lastUpdated: '2026-08-01' },
  { id: 'mat-3', code: 'RM-COC-01', name: 'Cocoa Powder', type: 'Raw Material', unit: 'kg', shelfLife: 18, expiryRequired: true, supplier: 'Cocoa Traders', status: 'Active', stock: 250, minStock: 50, lastUpdated: '2026-08-01' },
  { id: 'mat-4', code: 'RM-MLK-01', name: 'Milk Powder', type: 'Raw Material', unit: 'kg', shelfLife: 12, expiryRequired: true, supplier: 'Global Dairy', status: 'Active', stock: 400, minStock: 75, lastUpdated: '2026-08-01' },
  { id: 'mat-5', code: 'RM-VIT-01', name: 'Vitamin Mix', type: 'Raw Material', unit: 'kg', shelfLife: 18, expiryRequired: true, supplier: 'NutriChem', status: 'Active', stock: 120, minStock: 25, lastUpdated: '2026-08-01' },
  { id: 'mat-6', code: 'PM-SCH-ROLL', name: 'Sachet Roll', type: 'Packaging Material', unit: 'Roll', shelfLife: 0, expiryRequired: false, supplier: 'Print Flex', status: 'Active', stock: 100, minStock: 20, packWeightKg: 100, lastUpdated: '2026-08-01' },
  { id: 'mat-7', code: 'PM-SCH-NOS', name: 'Empty Sachets', type: 'Packaging Material', unit: 'Nos', shelfLife: 0, expiryRequired: false, supplier: 'Sachet Pack', status: 'Active', stock: 50000, minStock: 10000, lastUpdated: '2026-08-01' },
  { id: 'mat-8', code: 'PM-BOX-01', name: 'Boxes', type: 'Packaging Material', unit: 'Nos', shelfLife: 0, expiryRequired: false, supplier: 'Pack Solutions', status: 'Active', stock: 2000, minStock: 500, lastUpdated: '2026-08-01' },
];

const defaultVendors: Vendor[] = [
  {
    id: 'vendor-1',
    code: 'VND-0001',
    name: 'Global Dairy Supplies',
    manufacturerName: 'Global Dairy',
    vendorTypes: ['Raw Material'],
    status: 'Active',
    contactPerson: 'Ramesh Shah',
    mobile: '9876543210',
    alternateMobile: '9876500001',
    email: 'sales@globaldairy.example',
    website: 'https://globaldairy.example',
    address: 'GIDC Phase 2',
    city: 'Ahmedabad',
    state: 'Gujarat',
    country: 'India',
    pinCode: '382445',
    gstNumber: '24ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    paymentTerms: '30 Days',
    leadTimeDays: 7,
    materialIds: ['mat-1', 'mat-4'],
    documents: {
      gstCertificate: 'GST Certificate.pdf',
      fssaiCertificate: 'FSSAI.pdf',
      coaSample: 'COA Sample.pdf',
      agreement: 'Supply Agreement.pdf',
      otherDocuments: '',
    },
    createdDate: '2026-08-01',
  },
  {
    id: 'vendor-2',
    code: 'VND-0002',
    name: 'Pack Solutions',
    manufacturerName: 'Pack Solutions',
    vendorTypes: ['Packaging Material'],
    status: 'Active',
    contactPerson: 'Mehul Patel',
    mobile: '9876543222',
    alternateMobile: '',
    email: 'orders@packsolutions.example',
    website: '',
    address: 'Packaging Industrial Park',
    city: 'Vadodara',
    state: 'Gujarat',
    country: 'India',
    pinCode: '390010',
    gstNumber: '24PACKS9876L1Z8',
    panNumber: 'PACKS9876L',
    paymentTerms: 'Advance',
    leadTimeDays: 10,
    materialIds: ['mat-6', 'mat-8'],
    documents: {
      gstCertificate: 'GST.pdf',
      fssaiCertificate: '',
      coaSample: '',
      agreement: 'Packaging Agreement.pdf',
      otherDocuments: 'Rate Card.xlsx',
    },
    createdDate: '2026-08-01',
  },
];

const defaultVendorHistoryRecords: VendorHistoryRecord[] = [
  { id: 'vh-1', vendorId: 'vendor-1', action: 'Created', actionDate: '2026-08-01', description: 'Vendor created in master.' },
  { id: 'vh-2', vendorId: 'vendor-2', action: 'Created', actionDate: '2026-08-01', description: 'Vendor created in master.' },
];

const ERP_STORAGE_KEY = 'jolly-erp-state';

const readPersistedState = (): Partial<ErpPersistedState> | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ERP_STORAGE_KEY);
    return raw ? JSON.parse(raw) as Partial<ErpPersistedState> : null;
  } catch {
    return null;
  }
};

const writePersistedState = (state: ErpPersistedState) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ERP_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures in the demo app.
  }
};

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export const ErpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const persistedState = useMemo(() => readPersistedState(), []);

  const [categories, setCategories] = useState<Category[]>(() => persistedState?.categories ?? defaultCategories);
  const [products, setProducts] = useState<Product[]>(() => persistedState?.products ?? defaultProducts);
  const [flavours, setFlavours] = useState<Flavour[]>(() => persistedState?.flavours ?? defaultFlavours);
  const updateManufacturer = (updated: Manufacturer) =>
  setManufacturers(prev =>
    prev.map(m => (m.id === updated.id ? updated : m))
  );

  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(() => persistedState?.manufacturers ?? defaultManufacturers);
  const [materials, setMaterials] = useState<Material[]>(() => persistedState?.materials ?? defaultMaterials);
  const [vendors, setVendors] = useState<Vendor[]>(() => persistedState?.vendors ?? defaultVendors);
  const [vendorHistoryRecords, setVendorHistoryRecords] = useState<VendorHistoryRecord[]>(() => persistedState?.vendorHistoryRecords ?? defaultVendorHistoryRecords);
  const [recipes, setRecipes] = useState<Recipe[]>(() => persistedState?.recipes ?? defaultRecipes);
  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>(() => persistedState?.productionPlans ?? defaultProductionPlans);
  const [productionCalculations, setProductionCalculations] = useState<ProductionCalculation[]>(() => persistedState?.productionCalculations ?? defaultProductionCalculations);
  const [requirementReportSelection, setRequirementReportSelection] = useState<RequirementReportSelection>(() => persistedState?.requirementReportSelection ?? defaultRequirementReportSelection);
  const [assortedBoxCalculations, setAssortedBoxCalculations] = useState<AssortedBoxCalculation[]>(() => persistedState?.assortedBoxCalculations ?? defaultAssortedBoxCalculations);
  const [rmPurchaseRecords, setRmPurchaseRecords] = useState<EmployeeBRmPurchaseRecord[]>(() => persistedState?.rmPurchaseRecords ?? defaultRmPurchaseRecords);
  const [sachetPurchaseRecords, setSachetPurchaseRecords] = useState<EmployeeBSachetPurchaseRecord[]>(() => persistedState?.sachetPurchaseRecords ?? defaultSachetPurchaseRecords);
  const [boxPurchaseRecords, setBoxPurchaseRecords] = useState<EmployeeBBoxPurchaseRecord[]>(() => persistedState?.boxPurchaseRecords ?? defaultBoxPurchaseRecords);
  const [goodsReceiptRecords, setGoodsReceiptRecords] = useState<GoodsReceiptRecord[]>(() => persistedState?.goodsReceiptRecords ?? []);
  const [productionIssueRecords, setProductionIssueRecords] = useState<ProductionIssueRecord[]>(() => persistedState?.productionIssueRecords ?? []);
  const [productionReturnRecords, setProductionReturnRecords] = useState<ProductionReturnRecord[]>(() => persistedState?.productionReturnRecords ?? []);
  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransactionRecord[]>(() => persistedState?.inventoryTransactions ?? []);
  const [materialTestSlips, setMaterialTestSlips] = useState<MaterialTestSlip[]>(() => persistedState?.materialTestSlips ?? []);

  useEffect(() => {
    writePersistedState({
      categories,
      products,
      flavours,
      manufacturers,
      materials,
      vendors,
      vendorHistoryRecords,
      recipes,
      productionPlans,
      productionCalculations,
      requirementReportSelection,
      assortedBoxCalculations,
      rmPurchaseRecords,
      sachetPurchaseRecords,
      boxPurchaseRecords,
      goodsReceiptRecords,
      productionIssueRecords,
      productionReturnRecords,
      inventoryTransactions,
      materialTestSlips,
    });
  }, [
    categories,
    products,
    flavours,
    manufacturers,
    materials,
    vendors,
    vendorHistoryRecords,
    recipes,
    productionPlans,
    productionCalculations,
    requirementReportSelection,
    assortedBoxCalculations,
    rmPurchaseRecords,
    sachetPurchaseRecords,
    boxPurchaseRecords,
    goodsReceiptRecords,
    productionIssueRecords,
    productionReturnRecords,
    inventoryTransactions,
    materialTestSlips,
  ]);

  const notifyDeleteBlocked = (message: string) => {
    window.alert(message);
  };

  const removeManufacturer = (id: string) => {
    const isUsedByProduct = products.some(product => product.manufacturerId === id);
    const isUsedByProductionPlan = productionPlans.some(plan => plan.manufacturerId === id);
    if (isUsedByProduct || isUsedByProductionPlan) {
      notifyDeleteBlocked('Cannot delete manufacturer because it is referenced by products or production records.');
      return;
    }
    setManufacturers(prev => prev.filter(m => m.id !== id));
  };

  const updateFlavour = (updated: Flavour) => setFlavours(prev => prev.map(f => f.id === updated.id ? updated : f));
  const removeFlavour = (id: string) => {
    const isUsedByRecipe = recipes.some(recipe => recipe.flavourId === id);
    const isUsedByProductionPlan = productionPlans.some(plan => plan.flavourId === id);
    const isUsedByAssortedBox = recipes.some(recipe => {
      const boxConfig = normalizeRecipeBoxConfig(recipe.boxConfig, recipe.flavourId);
      return boxConfig.assortedBox.allowedFlavourIds.includes(id) || Object.prototype.hasOwnProperty.call(boxConfig.assortedBox.composition, id);
    });
    if (isUsedByRecipe || isUsedByProductionPlan || isUsedByAssortedBox) {
      notifyDeleteBlocked('Cannot delete flavour because it is referenced by recipes, assorted boxes, or production records.');
      return;
    }
    setFlavours(prev => prev.filter(f => f.id !== id));
  };

  const updateMaterial = (updated: Material) => setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
  const removeMaterial = (id: string) => {
    const isUsedByRecipe = recipes.some(recipe =>
      recipe.materials.some(material => material.materialId === id) ||
      (recipe.packaging || []).some(packaging => packaging.materialId === id)
    );
    if (isUsedByRecipe) {
      notifyDeleteBlocked('Cannot delete material because it is referenced by one or more recipes.');
      return;
    }
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const getNextVendorCode = () => {
    const nextNumber = vendors.reduce((max, vendor) => {
      const codeNumber = Number(vendor.code.replace('VND-', '')) || 0;
      return Math.max(max, codeNumber);
    }, 0) + 1;
    return `VND-${String(nextNumber).padStart(4, '0')}`;
  };

  const validateVendor = (vendor: Pick<Vendor, 'id' | 'name' | 'gstNumber' | 'email' | 'mobile'>) => {
    if (!vendor.name.trim()) return 'Vendor Name is required.';
    const duplicateName = vendors.some(item => item.id !== vendor.id && item.name.trim().toLowerCase() === vendor.name.trim().toLowerCase());
    if (duplicateName) return 'Vendor Name must be unique.';
    if (vendor.gstNumber.trim()) {
      const duplicateGst = vendors.some(item => item.id !== vendor.id && item.gstNumber.trim().toLowerCase() === vendor.gstNumber.trim().toLowerCase());
      if (duplicateGst) return 'GST Number must be unique.';
    }
    if (vendor.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendor.email.trim())) return 'Email must be valid.';
    if (vendor.mobile.trim() && !/^[0-9]{10}$/.test(vendor.mobile.trim())) return 'Mobile Number must be 10 digits.';
    return null;
  };

  const addVendor = (vendor: Omit<Vendor, 'id' | 'code' | 'createdDate'>) => {
    const id = `vendor-${Date.now()}`;
    const validation = validateVendor({ id, name: vendor.name, gstNumber: vendor.gstNumber, email: vendor.email, mobile: vendor.mobile });
    if (validation) return validation;
    const now = new Date().toISOString().slice(0, 10);
    const newVendor: Vendor = {
      ...vendor,
      id,
      code: getNextVendorCode(),
      createdDate: now,
    };
    setVendors(prev => [...prev, newVendor]);
    setVendorHistoryRecords(prev => [...prev, {
      id: `vh-${Date.now()}`,
      vendorId: id,
      action: 'Created',
      actionDate: now,
      description: 'Vendor created in master.',
    }]);
    return null;
  };

  const updateVendor = (vendor: Vendor) => {
    const validation = validateVendor(vendor);
    if (validation) return validation;
    const now = new Date().toISOString().slice(0, 10);
    setVendors(prev => prev.map(item => item.id === vendor.id ? { ...vendor, updatedDate: now } : item));
    setVendorHistoryRecords(prev => [...prev, {
      id: `vh-${Date.now()}`,
      vendorId: vendor.id,
      action: 'Updated',
      actionDate: now,
      description: 'Vendor details updated.',
    }]);
    return null;
  };

  const removeVendor = (id: string) => {
    const vendor = vendors.find(item => item.id === id);
    setVendors(prev => prev.filter(item => item.id !== id));
    setVendorHistoryRecords(prev => [...prev, {
      id: `vh-${Date.now()}`,
      vendorId: id,
      action: 'Deleted',
      actionDate: new Date().toISOString().slice(0, 10),
      description: `${vendor?.name || 'Vendor'} deleted from master.`,
    }]);
  };

  const updateRecipe = (updated: Recipe) => setRecipes(prev => prev.map(r => r.id === updated.id ? updated : r));
  const removeRecipe = (id: string) => {
    const isUsedByProductionPlan = productionPlans.some(plan => plan.recipeId === id);
    if (isUsedByProductionPlan) {
      notifyDeleteBlocked('Cannot delete recipe because it is referenced by production records.');
      return;
    }
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const generateProductionSummary = (recipeId: string, productionKg: number, boxUnits?: number): ProductionSummary | null => {
    const rec = recipes.find(r => r.id === recipeId);
    if (!rec) return null;
    return productionLib.calculateProduction(rec, materials, productionKg, boxUnits);
  };

  const upsertProductionCalculation = (calculation: ProductionCalculation) => {
    setProductionCalculations(prev => {
      const exists = prev.some(item => item.recipeId === calculation.recipeId);
      return exists
        ? prev.map(item => item.recipeId === calculation.recipeId ? calculation : item)
        : [...prev, calculation];
    });
  };

  const upsertAssortedBoxCalculation = (calculation: AssortedBoxCalculation) => {
    setAssortedBoxCalculations(prev => {
      const exists = prev.some(item => item.productId === calculation.productId);
      return exists
        ? prev.map(item => item.productId === calculation.productId ? calculation : item)
        : [...prev, calculation];
    });
  };

  const saveRmPurchaseRecord = (record: EmployeeBRmPurchaseRecord) => {
    setRmPurchaseRecords(prev => prev.some(item => item.id === record.id)
      ? prev.map(item => item.id === record.id ? record : item)
      : [...prev, record]
    );
  };

  const saveSachetPurchaseRecord = (record: EmployeeBSachetPurchaseRecord) => {
    setSachetPurchaseRecords(prev => prev.some(item => item.id === record.id)
      ? prev.map(item => item.id === record.id ? record : item)
      : [...prev, record]
    );
  };

  const saveBoxPurchaseRecord = (record: EmployeeBBoxPurchaseRecord) => {
    setBoxPurchaseRecords(prev => prev.some(item => item.id === record.id)
      ? prev.map(item => item.id === record.id ? record : item)
      : [...prev, record]
    );
  };

  const saveGoodsReceipt = (input: SaveGoodsReceiptInput) => {
    const key = getGoodsReceiptKey(input.sourceType, input.sourceId, input.lineType);
    const goodsReceiptId = `${input.sourceType}-${input.sourceId}-${Date.now()}`;
    const inventoryMaterialId = input.inventoryMaterialId || input.sourceId;
    const quantities = getCalculatedGoodsReceiptQuantities(input.receivedQuantity, input.qaSampleQuantity);

    setGoodsReceiptRecords(prev => {
      const existingReceivedQuantity = prev
        .filter(record => getGoodsReceiptKey(record.sourceType, record.sourceId, record.lineType) === key)
        .reduce((sum, record) => sum + record.receivedQuantity, 0);
      const totalReceivedQuantity = existingReceivedQuantity + quantities.receivedQuantity;

      return [
        ...prev,
        {
          id: goodsReceiptId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          lineType: input.lineType,
          materialType: input.materialType,
          materialName: input.materialName,
          inventoryMaterialId: input.inventoryMaterialId,
          purchaseQuantity: input.purchaseQuantity,
          unit: input.unit,
          purchaseDate: input.purchaseDate,
          receivedQuantity: quantities.receivedQuantity,
          qaSampleQuantity: quantities.qaSampleQuantity,
          availableQuantity: quantities.availableQuantity,
          receivedDate: input.receivedDate,
          receivedBy: input.receivedBy,
          remarks: input.remarks,
          status: getGoodsReceiptStatus(input.purchaseQuantity, totalReceivedQuantity),
        },
      ];
    });

    const inwardTransactionId = getInventoryTransactionId('grn', input.sourceId);
    const qaSampleTransactionId = getInventoryTransactionId('qa', input.sourceId);

    setInventoryTransactions(prev => [
      ...prev,
      {
        id: inwardTransactionId,
        transactionDate: input.receivedDate,
        recordedAt: new Date().toISOString(),
        materialType: input.materialType,
        materialId: inventoryMaterialId,
        materialName: input.materialName,
        transactionType: 'Goods Inward',
        quantity: quantities.receivedQuantity,
        delta: quantities.receivedQuantity,
        unit: input.unit,
        referenceModule: 'Goods Receipt',
        createdBy: input.receivedBy,
        status: quantities.receivedQuantity <= 0 ? 'Pending' : 'Completed',
        referenceId: input.sourceId,
      },
      {
        id: qaSampleTransactionId,
        transactionDate: input.receivedDate,
        recordedAt: new Date().toISOString(),
        materialType: input.materialType,
        materialId: inventoryMaterialId,
        materialName: input.materialName,
        transactionType: 'QA Sample Consumption',
        quantity: quantities.qaSampleQuantity,
        delta: -quantities.qaSampleQuantity,
        unit: input.unit,
        referenceModule: 'Goods Receipt',
        createdBy: input.receivedBy,
        status: quantities.qaSampleQuantity <= 0 ? 'Pending' : 'Completed',
        referenceId: input.sourceId,
      },
    ]);

    setMaterialTestSlips(prev => [
      ...prev,
      {
        id: `mts-${goodsReceiptId}`,
        goodsReceiptId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        lineType: input.lineType,
        materialType: input.materialType,
        materialId: inventoryMaterialId,
        materialName: input.materialName,
        receivedQuantity: quantities.receivedQuantity,
        qaSampleQuantity: quantities.qaSampleQuantity,
        availableQuantity: quantities.availableQuantity,
        unit: input.unit,
        receivedDate: input.receivedDate,
        receivedBy: input.receivedBy,
        status: MATERIAL_QA_STATUS.UNDER_TESTING,
      },
    ]);

    if (input.inventoryMaterialId) {
      setMaterials(prev => prev.map(material => (
        material.id === input.inventoryMaterialId
          ? { ...material, stock: (material.stock ?? 0) + quantities.availableQuantity, lastUpdated: input.receivedDate, qaStatus: MATERIAL_QA_STATUS.UNDER_TESTING }
          : material
      )));
    }
  };

  const saveMaterialTestDecision = (input: SaveMaterialTestDecisionInput) => {
    setMaterialTestSlips(prev => prev.map(slip => slip.id === input.testSlipId
      ? { ...slip, qaRemarks: input.qaRemarks, status: input.decision }
      : slip
    ));
    const testSlip = materialTestSlips.find(slip => slip.id === input.testSlipId);
    if (testSlip) {
      setMaterials(prev => prev.map(material => material.id === testSlip.materialId
        ? { ...material, qaStatus: input.decision }
        : material
      ));
    }
  };

  const saveProductionIssue = (input: SaveProductionIssueInput) => {
    const currentMaterial = materials.find(material => material.id === input.materialId);
    if (currentMaterial?.qaStatus !== MATERIAL_QA_STATUS.TEST_APPROVED) {
      window.alert('This material is currently under testing or has been rejected.');
      return;
    }
    if (input.issuedQuantity > input.availableQuantity) {
      window.alert('Cannot issue more than the available stock.');
      return;
    }
    const remainingQuantity = input.availableQuantity - input.issuedQuantity;
    if (remainingQuantity < 0) {
      window.alert('Issuing this quantity would create negative stock.');
      return;
    }
    const referenceId = getInventoryTransactionId('issue', input.materialId);
    setProductionIssueRecords(prev => [
      ...prev,
      {
        id: `${input.materialId}-${Date.now()}`,
        materialType: input.materialType,
        materialId: input.materialId,
        materialName: input.materialName,
        availableQuantity: input.availableQuantity,
        issuedQuantity: input.issuedQuantity,
        unit: input.unit,
        batchNumber: input.batchNumber,
        issueDate: input.issueDate,
        issuedBy: input.issuedBy,
        remarks: input.remarks,
        remainingQuantity,
        status: 'Issued',
      },
    ]);

    setMaterials(prev => prev.map(material => (
      material.id === input.materialId
        ? { ...material, stock: remainingQuantity, lastUpdated: input.issueDate }
        : material
    )));

    if (currentMaterial && typeof currentMaterial.minStock === 'number' && remainingQuantity <= currentMaterial.minStock) {
      window.alert(`Low stock alert: ${currentMaterial.name} will be at ${remainingQuantity} ${currentMaterial.unit}, which is at or below the minimum stock level of ${currentMaterial.minStock} ${currentMaterial.unit}.`);
    }

      setInventoryTransactions(prev => [
        ...prev,
        {
          id: referenceId,
          transactionDate: input.issueDate,
          recordedAt: new Date().toISOString(),
          materialType: input.materialType,
          materialId: input.materialId,
          materialName: input.materialName,
          batchNumber: input.batchNumber,
          transactionType: 'Production Issue',
          quantity: input.issuedQuantity,
          delta: -input.issuedQuantity,
          unit: input.unit,
          referenceModule: 'Production Issue',
          createdBy: input.issuedBy,
          status: 'Issued',
          referenceId: input.materialId,
        },
      ]);
  };

  const saveProductionReturn = (input: SaveProductionReturnInput) => {
      const referenceId = getInventoryTransactionId('return', input.issueId);
    setProductionReturnRecords(prev => {
      const issueReturns = prev.filter(record => record.issueId === input.issueId);
      const totalReturned = issueReturns.reduce((sum, record) => sum + record.returnedQuantity, 0) + input.returnedQuantity;
      const actualConsumption = input.issuedQuantity - totalReturned;
      const remainingReturnableQuantity = Math.max(0, input.issuedQuantity - totalReturned);
      const status: ProductionReturnStatus = totalReturned <= 0
        ? 'Open'
        : totalReturned < input.issuedQuantity
          ? 'Partially Returned'
          : 'Returned';

      return [
        ...prev,
        {
          id: `${input.issueId}-${Date.now()}`,
          issueId: input.issueId,
          materialType: input.materialType,
          materialId: input.materialId,
          materialName: input.materialName,
          batchNumber: input.batchNumber,
          issuedQuantity: input.issuedQuantity,
          returnedQuantity: input.returnedQuantity,
          actualConsumption,
          returnDate: input.returnDate,
          returnedBy: input.returnedBy,
          returnReason: input.returnReason,
          remarks: input.remarks,
          unit: input.unit,
          remainingReturnableQuantity,
          status,
        },
      ];
    });

    setMaterials(prev => prev.map(material => (
      material.id === input.materialId
        ? { ...material, stock: (material.stock ?? 0) + input.returnedQuantity, lastUpdated: input.returnDate }
        : material
    )));

    setInventoryTransactions(prev => [
      ...prev,
      {
        id: referenceId,
        transactionDate: input.returnDate,
        recordedAt: new Date().toISOString(),
        materialType: input.materialType,
        materialId: input.materialId,
        materialName: input.materialName,
        batchNumber: input.batchNumber,
        transactionType: 'Production Return',
        quantity: input.returnedQuantity,
        delta: input.returnedQuantity,
        unit: input.unit,
        referenceModule: 'Production Return',
        createdBy: input.returnedBy,
        status: 'Returned',
        referenceId: input.issueId,
      },
    ]);
  };

  return (
    <ErpContext.Provider value={{
      categories, products, flavours, manufacturers, materials, vendors, vendorHistoryRecords, recipes, productionPlans, productionCalculations, requirementReportSelection, assortedBoxCalculations, rmPurchaseRecords, sachetPurchaseRecords, boxPurchaseRecords, goodsReceiptRecords, productionIssueRecords, productionReturnRecords, inventoryTransactions, materialTestSlips,
      addCategory: (c) => setCategories(prev => [...prev, c]),
      addProduct: (p) => setProducts(prev => [...prev, p]),
      addFlavour: (f) => setFlavours(prev => [...prev, f]),
      updateFlavour,
      removeFlavour,
      updateManufacturer,
      removeManufacturer,
      addManufacturer: (m) => setManufacturers(prev => [...prev, m]),
      addMaterial: (m) => setMaterials(prev => [...prev, m]),
      removeMaterial,
      updateMaterial,
      addVendor,
      updateVendor,
      removeVendor,
      addRecipe: (r) => setRecipes(prev => [...prev, r]),
      updateRecipe, 
      removeRecipe,
      addProductionPlan: (p) => setProductionPlans(prev => [...prev, p]),
      upsertProductionCalculation,
      updateRequirementReportSelection: setRequirementReportSelection,
      upsertAssortedBoxCalculation,
      saveRmPurchaseRecord,
      saveSachetPurchaseRecord,
      saveBoxPurchaseRecord,
      saveGoodsReceipt,
      saveMaterialTestDecision,
      saveProductionIssue,
      saveProductionReturn,
      generateProductionSummary,
    }}>
      {children}
    </ErpContext.Provider>
  );
};

export const useErpData = () => {
  const context = useContext(ErpContext);
  if (!context) throw new Error("useErpData must be used within an ErpProvider");
  return context;
};
