import React, { createContext, useCallback, useEffect, useMemo, useContext, useState, type ReactNode } from 'react';
import productionLib, { MASTER_FORMULA_GRAMS, type ProductionSummary, type RecipeBoxConfig } from '@/lib/production';

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
  materialId?: string;
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
  flavouredMaterialId?: string;
  assortedMaterialId?: string;
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
  remainingQuantity?: number;
  expiryDate?: string;
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
  remainingQuantity?: number;
  expiryDate?: string;
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
  fifoBatches?: string;
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
  updateCategory: (c: Category) => void;
  removeCategory: (id: string) => void;
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  removeProduct: (id: string) => void;
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

const defaultCategories: Category[] = [];
const defaultManufacturers: Manufacturer[] = [];
const defaultProducts: Product[] = [];
const defaultFlavours: Flavour[] = [];
const defaultRecipes: Recipe[] = [];
const defaultProductionPlans: ProductionPlan[] = [];
const defaultProductionCalculations: ProductionCalculation[] = [];
const defaultRequirementReportSelection: RequirementReportSelection = {
  selectedRecipeIds: [],
  productionQtyByRecipe: {},
};
const defaultAssortedBoxCalculations: AssortedBoxCalculation[] = [];
const defaultRmPurchaseRecords: EmployeeBRmPurchaseRecord[] = [];
const defaultSachetPurchaseRecords: EmployeeBSachetPurchaseRecord[] = [];
const defaultBoxPurchaseRecords: EmployeeBBoxPurchaseRecord[] = [];
const defaultMaterials: Material[] = [];
const defaultVendors: Vendor[] = [];
const defaultVendorHistoryRecords: VendorHistoryRecord[] = [];

const LEGACY_ERP_STORAGE_KEYS = ['jolly-erp-state', 'jolly-erp-state-v2'];
const ERP_STORAGE_KEY = 'jolly-erp-state-v3';

const normalizeRecipeMaterialUnits = (recipe: Recipe): Recipe => ({
  ...recipe,
  materials: recipe.materials.map(material => ({
    ...material,
    unit: material.unit === '%' ? 'kg' : material.unit || 'kg',
  })),
});

const readPersistedState = (): Partial<ErpPersistedState> | null => {
  if (typeof window === 'undefined') return null;
  try {
    LEGACY_ERP_STORAGE_KEYS.forEach(key => window.localStorage.removeItem(key));
    const raw = window.localStorage.getItem(ERP_STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as Partial<ErpPersistedState>;
    return {
      ...state,
      recipes: state.recipes?.map(normalizeRecipeMaterialUnits),
    };
  } catch {
    return null;
  }
};

const writePersistedState = (state: ErpPersistedState) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ERP_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures in the app.
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

  const resolveInventoryMaterialId = useCallback((input: {
    sourceType?: GoodsReceiptMaterialType;
    sourceId?: string;
    lineType?: GoodsReceiptLineType;
    materialId?: string;
    materialName?: string;
  }) => {
    if (input.materialId && materials.some(material => material.id === input.materialId)) return input.materialId;
    const getNameTokens = (value?: string) => new Set((value || '').toLowerCase().match(/[a-z0-9]+/g) || []);
    const getTokenScore = (left?: string, right?: string) => {
      const leftTokens = getNameTokens(left);
      const rightTokens = getNameTokens(right);
      return Array.from(leftTokens).filter(token => token.length > 2 && rightTokens.has(token)).length;
    };

    if (input.sourceType === 'Raw Materials') {
      const purchase = rmPurchaseRecords.find(record => record.id === input.sourceId);
      if (purchase?.materialId && materials.some(material => material.id === purchase.materialId)) return purchase.materialId;
    }

    if (input.sourceType === 'Sachets') {
      const purchase = sachetPurchaseRecords.find(record => record.id === input.sourceId);
      if (purchase?.materialId && materials.some(material => material.id === purchase.materialId)) return purchase.materialId;
    }

    if (input.sourceType === 'Boxes') {
      const purchase = boxPurchaseRecords.find(record => record.id === input.sourceId);
      const materialId = input.lineType === 'Assorted' ? purchase?.assortedMaterialId : purchase?.flavouredMaterialId;
      if (materialId && materials.some(material => material.id === materialId)) return materialId;
    }

    const normalizedName = input.materialName?.toLowerCase().trim();
    if (normalizedName) {
      const directMatched = materials.find(material => {
        const materialName = material.name.toLowerCase().trim();
        return normalizedName === materialName || normalizedName.includes(materialName) || materialName.includes(normalizedName);
      });
      if (directMatched) return directMatched.id;

      const candidates = materials
        .map(material => ({ material, score: getTokenScore(normalizedName, material.name) }))
        .filter(candidate => candidate.score > 0)
        .sort((left, right) => right.score - left.score);
      const matched = candidates[0]?.material;
      if (matched) return matched.id;
    }

    return input.materialId || input.sourceId || '';
  }, [boxPurchaseRecords, materials, rmPurchaseRecords, sachetPurchaseRecords]);

  const getResolvedGoodsReceiptMaterialId = useCallback((record: GoodsReceiptRecord) => resolveInventoryMaterialId({
    sourceType: record.sourceType,
    sourceId: record.sourceId,
    lineType: record.lineType,
    materialId: record.inventoryMaterialId,
    materialName: record.materialName,
  }), [resolveInventoryMaterialId]);

  const getResolvedTestSlipMaterialId = useCallback((slip: MaterialTestSlip) => {
    const receipt = goodsReceiptRecords.find(record => record.id === slip.goodsReceiptId);
    return resolveInventoryMaterialId({
      sourceType: slip.sourceType,
      sourceId: slip.sourceId,
      lineType: slip.lineType,
      materialId: receipt?.inventoryMaterialId || slip.materialId,
      materialName: receipt?.materialName || slip.materialName,
    });
  }, [goodsReceiptRecords, resolveInventoryMaterialId]);

  useEffect(() => {
    setGoodsReceiptRecords(prev => {
      const next = prev.map(record => {
        const materialId = getResolvedGoodsReceiptMaterialId(record);
        return materialId && materialId !== record.inventoryMaterialId
          ? { ...record, inventoryMaterialId: materialId, remainingQuantity: record.remainingQuantity ?? record.availableQuantity }
          : record;
      });
      return next.some((record, index) => record !== prev[index]) ? next : prev;
    });

    setMaterialTestSlips(prev => {
      const next = prev.map(slip => {
        const materialId = getResolvedTestSlipMaterialId(slip);
        return materialId && materialId !== slip.materialId
          ? { ...slip, materialId, remainingQuantity: slip.remainingQuantity ?? slip.availableQuantity }
          : slip;
      });
      return next.some((slip, index) => slip !== prev[index]) ? next : prev;
    });
  }, [getResolvedGoodsReceiptMaterialId, getResolvedTestSlipMaterialId, goodsReceiptRecords, materialTestSlips]);

  const removeProductLinkedData = (productIds: string[]) => {
    const productIdSet = new Set(productIds);
    const flavourIdSet = new Set(flavours.filter(flavour => productIdSet.has(flavour.productId)).map(flavour => flavour.id));
    const recipeIdSet = new Set(recipes.filter(recipe => productIdSet.has(recipe.productId) || flavourIdSet.has(recipe.flavourId)).map(recipe => recipe.id));

    setFlavours(prev => prev.filter(flavour => !productIdSet.has(flavour.productId)));
    setRecipes(prev => prev.filter(recipe => !productIdSet.has(recipe.productId) && !flavourIdSet.has(recipe.flavourId)));
    setProductionPlans(prev => prev.filter(plan =>
      !productIdSet.has(plan.productId) &&
      !flavourIdSet.has(plan.flavourId) &&
      !recipeIdSet.has(plan.recipeId)
    ));
    setProductionCalculations(prev => prev.filter(calculation =>
      !productIdSet.has(calculation.productId) &&
      !flavourIdSet.has(calculation.flavourId) &&
      !recipeIdSet.has(calculation.recipeId)
    ));
    setRequirementReportSelection(prev => ({
      selectedRecipeIds: prev.selectedRecipeIds.filter(recipeId => !recipeIdSet.has(recipeId)),
      productionQtyByRecipe: Object.fromEntries(
        Object.entries(prev.productionQtyByRecipe).filter(([recipeId]) => !recipeIdSet.has(recipeId))
      ),
    }));
    setAssortedBoxCalculations(prev => prev.filter(calculation => !productIdSet.has(calculation.productId)));
  };

  const filterUnchanged = <T,>(items: T[], predicate: (item: T) => boolean) => {
    const filtered = items.filter(predicate);
    return filtered.length === items.length ? items : filtered;
  };

  const updateCategory = (updated: Category) => setCategories(prev => prev.map(category => category.id === updated.id ? updated : category));
  const removeCategory = (id: string) => {
    const productIds = products.filter(product => product.categoryId === id).map(product => product.id);
    setCategories(prev => prev.filter(category => category.id !== id));
    setProducts(prev => prev.filter(product => product.categoryId !== id));
    removeProductLinkedData(productIds);
  };

  const updateProduct = (updated: Product) => setProducts(prev => prev.map(product => product.id === updated.id ? updated : product));
  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
    removeProductLinkedData([id]);
  };

  useEffect(() => {
    const validCategoryIds = new Set(categories.map(category => category.id));
    const validProductIds = new Set(products.filter(product => validCategoryIds.has(product.categoryId)).map(product => product.id));
    const validFlavourIds = new Set(flavours.filter(flavour => validProductIds.has(flavour.productId)).map(flavour => flavour.id));
    const validRecipeIds = new Set(recipes.filter(recipe => validProductIds.has(recipe.productId) && validFlavourIds.has(recipe.flavourId)).map(recipe => recipe.id));

    setProducts(prev => filterUnchanged(prev, product => validCategoryIds.has(product.categoryId)));
    setFlavours(prev => filterUnchanged(prev, flavour => validProductIds.has(flavour.productId)));
    setRecipes(prev => filterUnchanged(prev, recipe => validProductIds.has(recipe.productId) && validFlavourIds.has(recipe.flavourId)));
    setProductionPlans(prev => filterUnchanged(prev, plan =>
      validProductIds.has(plan.productId) &&
      validFlavourIds.has(plan.flavourId) &&
      validRecipeIds.has(plan.recipeId)
    ));
    setProductionCalculations(prev => filterUnchanged(prev, calculation =>
      validProductIds.has(calculation.productId) &&
      validFlavourIds.has(calculation.flavourId) &&
      validRecipeIds.has(calculation.recipeId)
    ));
    setRequirementReportSelection(prev => {
      const selectedRecipeIds = prev.selectedRecipeIds.filter(recipeId => validRecipeIds.has(recipeId));
      const productionQtyByRecipe = Object.fromEntries(
        Object.entries(prev.productionQtyByRecipe).filter(([recipeId]) => validRecipeIds.has(recipeId))
      );

      if (
        selectedRecipeIds.length === prev.selectedRecipeIds.length &&
        Object.keys(productionQtyByRecipe).length === Object.keys(prev.productionQtyByRecipe).length
      ) {
        return prev;
      }

      return { selectedRecipeIds, productionQtyByRecipe };
    });
    setAssortedBoxCalculations(prev => filterUnchanged(prev, calculation => validProductIds.has(calculation.productId)));
  }, [categories, products, flavours, recipes]);

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

  const updateRecipe = (updated: Recipe) => setRecipes(prev => prev.map(r => r.id === updated.id ? normalizeRecipeMaterialUnits(updated) : r));
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
    const inventoryMaterialId = resolveInventoryMaterialId({
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      lineType: input.lineType,
      materialId: input.inventoryMaterialId,
      materialName: input.materialName,
    });
    const quantities = getCalculatedGoodsReceiptQuantities(input.receivedQuantity, input.qaSampleQuantity);
    const rmPurchase = input.sourceType === 'Raw Materials' ? rmPurchaseRecords.find(record => record.id === input.sourceId) : undefined;
    const expiryDate = rmPurchase?.expiryDate || '';

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
          inventoryMaterialId,
          purchaseQuantity: input.purchaseQuantity,
          unit: input.unit,
          purchaseDate: input.purchaseDate,
          receivedQuantity: quantities.receivedQuantity,
          qaSampleQuantity: quantities.qaSampleQuantity,
          availableQuantity: quantities.availableQuantity,
          remainingQuantity: quantities.availableQuantity,
          expiryDate,
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
        remainingQuantity: quantities.availableQuantity,
        expiryDate,
        unit: input.unit,
        receivedDate: input.receivedDate,
        receivedBy: input.receivedBy,
        status: MATERIAL_QA_STATUS.UNDER_TESTING,
      },
    ]);

    if (inventoryMaterialId) {
      setMaterials(prev => prev.map(material => (
        material.id === inventoryMaterialId
          ? { ...material, stock: (material.stock ?? 0) + quantities.availableQuantity, lastUpdated: input.receivedDate, qaStatus: MATERIAL_QA_STATUS.UNDER_TESTING }
          : material
      )));
    }
  };

  const saveMaterialTestDecision = (input: SaveMaterialTestDecisionInput) => {
    const testSlip = materialTestSlips.find(slip => slip.id === input.testSlipId);
    const materialId = testSlip ? getResolvedTestSlipMaterialId(testSlip) : '';
    setMaterialTestSlips(prev => prev.map(slip => slip.id === input.testSlipId
      ? { ...slip, materialId, qaRemarks: input.qaRemarks, status: input.decision }
      : slip
    ));
    if (testSlip) {
      setGoodsReceiptRecords(prev => prev.map(record => record.id === testSlip.goodsReceiptId
        ? { ...record, inventoryMaterialId: materialId, remainingQuantity: testSlip.remainingQuantity ?? record.remainingQuantity ?? record.availableQuantity }
        : record
      ));
      setInventoryTransactions(prev => prev.map(transaction => transaction.referenceId === testSlip.sourceId && transaction.materialName === testSlip.materialName
        ? { ...transaction, materialId }
        : transaction
      ));
      setMaterials(prev => prev.map(material => material.id === materialId
        ? { ...material, qaStatus: input.decision }
        : material
      ));
    }
  };

  const saveProductionIssue = (input: SaveProductionIssueInput) => {
    const currentMaterial = materials.find(material => material.id === input.materialId);
    const approvedSlips = materialTestSlips.filter(slip => getResolvedTestSlipMaterialId(slip) === input.materialId && slip.status === MATERIAL_QA_STATUS.TEST_APPROVED);
    const approvedSlipIds = new Set(approvedSlips.map(slip => slip.goodsReceiptId));
    const fifoBatches = goodsReceiptRecords
      .filter(record => getResolvedGoodsReceiptMaterialId(record) === input.materialId && approvedSlipIds.has(record.id) && (record.remainingQuantity ?? record.availableQuantity) > 0)
      .sort((left, right) => {
        const leftExpiry = left.expiryDate || '9999-12-31';
        const rightExpiry = right.expiryDate || '9999-12-31';
        if (leftExpiry !== rightExpiry) return leftExpiry.localeCompare(rightExpiry);
        if (left.receivedDate !== right.receivedDate) return left.receivedDate.localeCompare(right.receivedDate);
        return left.id.localeCompare(right.id);
      });
    const approvedAvailableQuantity = fifoBatches.reduce((sum, record) => sum + (record.remainingQuantity ?? record.availableQuantity), 0);

    if (approvedAvailableQuantity <= 0) {
      window.alert('This material is currently under testing or has been rejected.');
      return;
    }
    if (input.issuedQuantity > approvedAvailableQuantity) {
      window.alert('Cannot issue more than the available stock.');
      return;
    }
    const approvedRemainingQuantity = approvedAvailableQuantity - input.issuedQuantity;
    const totalRemainingQuantity = Math.max(0, (currentMaterial?.stock ?? approvedAvailableQuantity) - input.issuedQuantity);
    if (approvedRemainingQuantity < 0) {
      window.alert('Issuing this quantity would create negative stock.');
      return;
    }
    const referenceId = getInventoryTransactionId('issue', input.materialId);
    let quantityToIssue = input.issuedQuantity;
    const usedBatchIds: string[] = [];
    const nextReceiptRemaining = new Map<string, number>();

    fifoBatches.forEach(record => {
      if (quantityToIssue <= 0) return;
      const currentRemaining = record.remainingQuantity ?? record.availableQuantity;
      const consumed = Math.min(currentRemaining, quantityToIssue);
      quantityToIssue -= consumed;
      nextReceiptRemaining.set(record.id, Number((currentRemaining - consumed).toFixed(6)));
      usedBatchIds.push(record.id);
    });

    setGoodsReceiptRecords(prev => prev.map(record => (
      nextReceiptRemaining.has(record.id)
        ? { ...record, remainingQuantity: nextReceiptRemaining.get(record.id) }
        : record
    )));
    setMaterialTestSlips(prev => prev.map(slip => (
      nextReceiptRemaining.has(slip.goodsReceiptId)
        ? { ...slip, remainingQuantity: nextReceiptRemaining.get(slip.goodsReceiptId) }
        : slip
    )));

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
        fifoBatches: usedBatchIds.join(', '),
        issueDate: input.issueDate,
        issuedBy: input.issuedBy,
        remarks: input.remarks,
        remainingQuantity: totalRemainingQuantity,
        status: 'Issued',
      },
    ]);

    setMaterials(prev => prev.map(material => (
      material.id === input.materialId
        ? { ...material, stock: totalRemainingQuantity, lastUpdated: input.issueDate }
        : material
    )));

    if (currentMaterial && typeof currentMaterial.minStock === 'number' && totalRemainingQuantity <= currentMaterial.minStock) {
      window.alert(`Low stock alert: ${currentMaterial.name} will be at ${totalRemainingQuantity} ${currentMaterial.unit}, which is at or below the minimum stock level of ${currentMaterial.minStock} ${currentMaterial.unit}.`);
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
      updateCategory,
      removeCategory,
      addProduct: (p) => setProducts(prev => [...prev, p]),
      updateProduct,
      removeProduct,
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
      addRecipe: (r) => setRecipes(prev => [...prev, normalizeRecipeMaterialUnits(r)]),
      updateRecipe, 
      removeRecipe,
      addProductionPlan: (p) => setProductionPlans(prev => prev.some(plan => plan.id === p.id)
        ? prev.map(plan => plan.id === p.id ? p : plan)
        : [...prev, p]
      ),
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
