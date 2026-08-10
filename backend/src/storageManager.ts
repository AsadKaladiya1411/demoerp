import fs from 'fs/promises';
import path from 'path';

const FILE = path.resolve(__dirname, '..', 'data', 'records.json');

type StoredState = Record<string, unknown>;

const DEFAULT_STATE: StoredState = {
  users: [],
  categories: [],
  products: [],
  flavours: [],
  recipes: [],
  packagingMaterials: [],
  manufacturers: [],
  materials: [],
  suppliers: [],
  customers: [],
  purchaseRequisitions: [],
  purchaseOrders: [],
  goodsReceipts: [],
  goodsReceiptRecords: [],
  materialTesting: [],
  materialTestSlips: [],
  rmInventory: [],
  pmInventory: [],
  finishedGoods: [],
  stockTransactions: [],
  inventoryTransactions: [],
  productionPlans: [],
  productionOrders: [],
  productionIssues: [],
  productionIssueRecords: [],
  productionReturns: [],
  productionReturnRecords: [],
  productionOutput: [],
  rndSampleRequirements: [],
  rndSampleInventory: [],
  sampleDispatchRecords: [],
  sampleReceiptInventory: [],
  rndBaseFormulas: [],
  rndTrials: [],
  rndFormulaVersions: [],
  trialWorksheets: [],
  formulaLibrary: [],
  reports: [],
  dashboard: [],
  vendors: [],
  vendorHistoryRecords: [],
  productionCalculations: [],
  requirementReportSelection: { selectedRecipeIds: [], productionQtyByRecipe: {} },
  assortedBoxCalculations: [],
  rmPurchaseRecords: [],
  sachetPurchaseRecords: [],
  boxPurchaseRecords: [],
};

async function ensureFile() {
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, JSON.stringify(DEFAULT_STATE, null, 2), 'utf8');
  }
}

const OBJECT_COLLECTIONS = new Set(['requirementReportSelection']);

function normalizeCollection(name: string, value: unknown) {
  if (OBJECT_COLLECTIONS.has(name)) {
    const candidate = value && !Array.isArray(value) && typeof value === 'object' ? value as Record<string, unknown> : {};
    return {
      selectedRecipeIds: Array.isArray(candidate.selectedRecipeIds) ? candidate.selectedRecipeIds : [],
      productionQtyByRecipe: candidate.productionQtyByRecipe && typeof candidate.productionQtyByRecipe === 'object' && !Array.isArray(candidate.productionQtyByRecipe) ? candidate.productionQtyByRecipe : {},
    };
  }
  return Array.isArray(value) ? value.filter(item => item !== null && typeof item === 'object' && !Array.isArray(item)) : [];
}

let writeQueue: Promise<unknown> = Promise.resolve();

function serialized<T>(work: () => Promise<T>): Promise<T> {
  const next = writeQueue.then(work, work);
  writeQueue = next.then(() => undefined, () => undefined);
  return next;
}

function normalizeState(parsed: unknown): StoredState {
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    return { ...DEFAULT_STATE };
  }

  const source = parsed as Record<string, unknown>;
  return Object.fromEntries(Object.keys(DEFAULT_STATE).map(name => [name, normalizeCollection(name, source[name])])) as StoredState;
}

export async function readState() {
  await ensureFile();
  const raw = await fs.readFile(FILE, 'utf8');
  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function writeState(state: StoredState) {
  await ensureFile();
  await fs.writeFile(FILE, JSON.stringify(state, null, 2), 'utf8');
}

export type StateOperation =
  | { type: 'upsert'; collection: string; key: string; item: Record<string, unknown> }
  | { type: 'delete'; collection: string; key: string }
  | { type: 'set'; collection: string; value: unknown };

const RECORD_KEY_FIELDS: Record<string, string> = {
  productionCalculations: 'recipeId',
  assortedBoxCalculations: 'productId',
};

const recordKey = (collection: string, item: unknown) => {
  const candidate = item && typeof item === 'object' ? item as Record<string, unknown> : {};
  return String(candidate[RECORD_KEY_FIELDS[collection] || 'id'] ?? '');
};

export async function applyOperations(operations: StateOperation[]) {
  return serialized(async () => {
    const state = await readState();
    for (const operation of operations) {
      if (operation.type === 'set') {
        state[operation.collection] = normalizeCollection(operation.collection, operation.value);
        continue;
      }
      const collection = normalizeCollection(operation.collection, state[operation.collection]);
      if (!Array.isArray(collection)) throw new Error(`${operation.collection} does not support record operations`);
      const index = collection.findIndex(item => recordKey(operation.collection, item) === operation.key);
      if (operation.type === 'delete') {
        if (index >= 0) collection.splice(index, 1);
      } else if (index >= 0) {
        collection[index] = operation.item;
      } else {
        collection.push(operation.item);
      }
      state[operation.collection] = collection;
    }
    await writeState(state);
    return normalizeState(state);
  });
}

export async function getCollection(name: string) {
  const state = await readState();
  return normalizeCollection(name, state[name]);
}

export async function upsertItem(name: string, item: Record<string, unknown>) {
  const key = String(item.id ?? '');
  if (!key) throw new Error('Record id is required');
  await applyOperations([{ type: 'upsert', collection: name, key, item }]);
  return item;
}

export async function deleteItem(name: string, id: string) {
  await applyOperations([{ type: 'delete', collection: name, key: id }]);
  return true;
}
