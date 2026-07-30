import React, { createContext, useContext, useState, type ReactNode } from 'react';
import productionLib, { MASTER_FORMULA_GRAMS, normalizeRecipeBoxConfig, type ProductionSummary, type RecipeBoxConfig } from '@/lib/production';

export { MASTER_FORMULA_GRAMS };
export type { ProductionSummary };

// Data Types
export interface Category { id: string; code: string; name: string; description: string; status: 'Active' | 'Inactive'; createdDate: string; }
export interface Product { id: string; code: string; name: string; categoryId: string; manufacturerId?: string; shelfLife: number; expiryRequired: boolean; description: string; status: 'Active' | 'Inactive'; }
export interface Flavour { id: string; name: string; productId: string; status: 'Active' | 'Inactive'; }
export interface Manufacturer { id: string; name: string; contactPerson: string; gst: string; address: string; mobile: string; email: string; status: 'Active' | 'Inactive'; }
export interface Material { id: string; code: string; name: string; type: 'Raw Material' | 'Packaging Material'; unit: string; shelfLife: number; expiryRequired: boolean; supplier: string; status: 'Active' | 'Inactive'; stock?: number; minStock?: number; packWeightKg?: number; }
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

interface ErpContextType {
  categories: Category[];
  products: Product[];
  flavours: Flavour[];
  manufacturers: Manufacturer[];
  materials: Material[];
  recipes: Recipe[];  
  productionPlans: ProductionPlan[];
  productionCalculations: ProductionCalculation[];
  
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
  addRecipe: (r: Recipe) => void;
  updateRecipe: (r: Recipe) => void;
  removeRecipe: (id: string) => void;
  addProductionPlan: (p: ProductionPlan) => void;
  upsertProductionCalculation: (p: ProductionCalculation) => void;
  generateProductionSummary: (recipeId: string, productionKg: number, boxUnits?: number) => ProductionSummary | null;
}

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
      { materialId: 'mat-7', unit: 'Nos', count: 1 },
      { materialId: 'mat-8', unit: 'Nos', count: 1 },
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
      { materialId: 'mat-7', unit: 'Nos', count: 1 },
      { materialId: 'mat-8', unit: 'Nos', count: 1 },
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
      { materialId: 'mat-7', unit: 'Nos', count: 1 },
      { materialId: 'mat-8', unit: 'Nos', count: 1 },
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

const defaultMaterials: Material[] = [
  { id: 'mat-1', code: 'RM-MPC-85', name: 'MPC 85', type: 'Raw Material', unit: 'kg', shelfLife: 12, expiryRequired: true, supplier: 'Global Dairy', status: 'Active', stock: 500, minStock: 100 },
  { id: 'mat-2', code: 'RM-SUG-01', name: 'Sugar', type: 'Raw Material', unit: 'kg', shelfLife: 24, expiryRequired: false, supplier: 'Sweet Co', status: 'Active', stock: 1000, minStock: 200 },
  { id: 'mat-3', code: 'RM-COC-01', name: 'Cocoa Powder', type: 'Raw Material', unit: 'kg', shelfLife: 18, expiryRequired: true, supplier: 'Cocoa Traders', status: 'Active', stock: 250, minStock: 50 },
  { id: 'mat-4', code: 'RM-MLK-01', name: 'Milk Powder', type: 'Raw Material', unit: 'kg', shelfLife: 12, expiryRequired: true, supplier: 'Global Dairy', status: 'Active', stock: 400, minStock: 75 },
  { id: 'mat-5', code: 'RM-VIT-01', name: 'Vitamin Mix', type: 'Raw Material', unit: 'kg', shelfLife: 18, expiryRequired: true, supplier: 'NutriChem', status: 'Active', stock: 120, minStock: 25 },
  { id: 'mat-6', code: 'PM-FILM-01', name: 'Printed Film', type: 'Packaging Material', unit: 'Roll', shelfLife: 0, expiryRequired: false, supplier: 'Print Flex', status: 'Active', stock: 100, minStock: 20, packWeightKg: 100 },
  { id: 'mat-7', code: 'PM-LBL-01', name: 'Labels', type: 'Packaging Material', unit: 'Nos', shelfLife: 0, expiryRequired: false, supplier: 'Label Co', status: 'Active', stock: 50000, minStock: 10000 },
  { id: 'mat-8', code: 'PM-BOX-01', name: 'Boxes', type: 'Packaging Material', unit: 'Nos', shelfLife: 0, expiryRequired: false, supplier: 'Pack Solutions', status: 'Active', stock: 2000, minStock: 500 },
  { id: 'mat-9', code: 'PM-MCT-01', name: 'Master Cartons', type: 'Packaging Material', unit: 'Nos', shelfLife: 0, expiryRequired: false, supplier: 'Pack Solutions', status: 'Active', stock: 500, minStock: 100 },
];

const ErpContext = createContext<ErpContextType | undefined>(undefined);

export const ErpProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [flavours, setFlavours] = useState<Flavour[]>(defaultFlavours);
  const updateManufacturer = (updated: Manufacturer) =>
  setManufacturers(prev =>
    prev.map(m => (m.id === updated.id ? updated : m))
  );

  const [manufacturers, setManufacturers] = useState<Manufacturer[]>(defaultManufacturers);
  const [materials, setMaterials] = useState<Material[]>(defaultMaterials);
  const [recipes, setRecipes] = useState<Recipe[]>(defaultRecipes);
  const [productionPlans, setProductionPlans] = useState<ProductionPlan[]>(defaultProductionPlans);
  const [productionCalculations, setProductionCalculations] = useState<ProductionCalculation[]>(defaultProductionCalculations);

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

  return (
    <ErpContext.Provider value={{
      categories, products, flavours, manufacturers, materials, recipes, productionPlans, productionCalculations,
      addCategory: (c) => setCategories([...categories, c]),
      addProduct: (p) => setProducts([...products, p]),
      addFlavour: (f) => setFlavours([...flavours, f]),
      updateFlavour,
      removeFlavour,
      updateManufacturer,
      removeManufacturer,
      addManufacturer: (m) => setManufacturers([...manufacturers, m]),
      addMaterial: (m) => setMaterials([...materials, m]),
      removeMaterial,
      updateMaterial,
      addRecipe: (r) => setRecipes([...recipes, r]),
      updateRecipe, 
      removeRecipe,
      addProductionPlan: (p) => setProductionPlans([...productionPlans, p]),
      upsertProductionCalculation,
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
