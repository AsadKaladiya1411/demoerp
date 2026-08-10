import { Router, type NextFunction, type Request, type Response } from 'express';
import * as storage from '../storageManager';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// List of allowed collections
const COLLECTIONS = new Set([
  'users','categories','products','flavours','recipes','packagingMaterials','manufacturers','materials','suppliers','customers','purchaseRequisitions','purchaseOrders','goodsReceipts','goodsReceiptRecords','materialTesting','materialTestSlips','rmInventory','pmInventory','finishedGoods','stockTransactions','inventoryTransactions','productionPlans','productionCalculations','productionOrders','productionIssues','productionIssueRecords','productionReturns','productionReturnRecords','productionOutput','rndSampleRequirements','rndSampleInventory','sampleDispatchRecords','sampleReceiptInventory','rndBaseFormulas','rndTrials','rndFormulaVersions','trialWorksheets','formulaLibrary','reports','dashboard','vendors','vendorHistoryRecords','requirementReportSelection','assortedBoxCalculations','rmPurchaseRecords','sachetPurchaseRecords','boxPurchaseRecords'
]);

const WRITE_COLLECTIONS_BY_ROLE: Record<string, Set<string>> = {
  'Employee A': new Set(['categories','products','flavours','recipes','manufacturers','materials','productionPlans','productionCalculations','requirementReportSelection','assortedBoxCalculations','rndSampleRequirements','rndSampleInventory','sampleDispatchRecords','sampleReceiptInventory','rndBaseFormulas','rndTrials','rndFormulaVersions']),
  'Employee B': new Set(['vendors','vendorHistoryRecords','rmPurchaseRecords','sachetPurchaseRecords','boxPurchaseRecords','rndSampleRequirements','sampleDispatchRecords']),
  'Employee C': new Set(['vendors','vendorHistoryRecords','materials','goodsReceiptRecords','materialTestSlips','inventoryTransactions','productionIssueRecords','productionReturnRecords']),
  'Employee D': new Set(['vendors','vendorHistoryRecords','materials','goodsReceiptRecords','materialTestSlips','inventoryTransactions']),
};

const roleOf = (req: Request) => String((req as Request & { user?: { role?: string } }).user?.role || '');
const canWrite = (req: Request, collection: string) => roleOf(req) === 'Boss' || WRITE_COLLECTIONS_BY_ROLE[roleOf(req)]?.has(collection);
const rejectUnknown = (collection: string, res: Response) => {
  if (COLLECTIONS.has(collection)) return false;
  res.status(404).json({ error: 'Unknown collection' });
  return true;
};

const asyncHandler = (handler: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => {
  void handler(req, res).catch(next);
};

router.get('/state/snapshot', requireAuth, asyncHandler(async (_req: Request, res: Response) => {
  res.json(await storage.readState());
}));

router.patch('/state', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const operations = Array.isArray(req.body?.operations) ? req.body.operations as storage.StateOperation[] : null;
  if (!operations || operations.length > 500) return res.status(400).json({ error: 'A valid operations array is required' });
  for (const operation of operations) {
    if (!operation || typeof operation.collection !== 'string' || rejectUnknown(operation.collection, res)) return;
    if (!canWrite(req, operation.collection)) return res.status(403).json({ error: `Write access denied for ${operation.collection}` });
    if (!['upsert', 'delete', 'set'].includes(operation.type)) return res.status(400).json({ error: 'Invalid operation type' });
    if (operation.type === 'set' && operation.collection !== 'requirementReportSelection') return res.status(400).json({ error: 'Set is only valid for object collections' });
    if (operation.type !== 'set' && (!operation.key || typeof operation.key !== 'string')) return res.status(400).json({ error: 'Record key is required' });
    if (operation.type === 'upsert' && (!operation.item || typeof operation.item !== 'object' || Array.isArray(operation.item))) return res.status(400).json({ error: 'Record item is required' });
  }
  await storage.applyOperations(operations);
  res.json({ ok: true });
}));

// GET /api/:collection
router.get('/:collection', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const name = String(req.params.collection || '');
  if (rejectUnknown(name, res)) return;
  const data = await storage.getCollection(name);
  res.json(data);
}));

// POST /api/:collection -> upsert single item (protected)
router.post('/:collection', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const name = String(req.params.collection || '');
  if (rejectUnknown(name, res)) return;
  if (!canWrite(req, name)) return res.status(403).json({ error: 'Forbidden' });
  const item = req.body;
  const saved = await storage.upsertItem(name, item);
  res.json(saved);
}));

// PUT /api/:collection/:id -> update item (protected)
router.put('/:collection/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const name = String(req.params.collection || '');
  if (rejectUnknown(name, res)) return;
  if (!canWrite(req, name)) return res.status(403).json({ error: 'Forbidden' });
  const item = req.body;
  item.id = String(req.params.id || '');
  const saved = await storage.upsertItem(name, item);
  res.json(saved);
}));

// DELETE /api/:collection/:id (protected)
router.delete('/:collection/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const name = String(req.params.collection || '');
  if (rejectUnknown(name, res)) return;
  if (!canWrite(req, name)) return res.status(403).json({ error: 'Forbidden' });
  await storage.deleteItem(name, String(req.params.id || ''));
  res.json({ ok: true });
}));

export default router;
