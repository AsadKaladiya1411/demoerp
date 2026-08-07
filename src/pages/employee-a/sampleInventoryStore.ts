export type SampleDispatchStatus = 'Sent to R&D' | 'Received by R&D';

export type SampleDispatchReceipt = {
  receiveDate: string;
  receivedBy: string;
  remarks: string;
};

export type SampleDispatchRecord = {
  id: string;
  dispatchId: string;
  dispatchDate: string;
  poNumber: string;
  requirementId: string;
  materialName: string;
  quantity: number;
  unit: string;
  dispatchedBy: string;
  dispatchRemarks: string;
  status: SampleDispatchStatus;
  receipt?: SampleDispatchReceipt;
};

export type SampleInventoryRecord = {
  id: string;
  materialName: string;
  availableQuantity: number;
  unit: string;
  receiveDate: string;
  sourcePO: string;
  requirementId: string;
};

const dispatchRecords: SampleDispatchRecord[] = [];
const inventoryRecords: SampleInventoryRecord[] = [];

const cloneDispatchRecord = (record: SampleDispatchRecord): SampleDispatchRecord => ({
  ...record,
  receipt: record.receipt ? { ...record.receipt } : undefined,
});

const cloneInventoryRecord = (record: SampleInventoryRecord): SampleInventoryRecord => ({
  ...record,
});

const getNextDispatchNumber = () => String(dispatchRecords.length + 1).padStart(4, '0');
const getNextInventoryNumber = () => String(inventoryRecords.length + 1).padStart(4, '0');

const upsertInventoryFromDispatch = (record: SampleDispatchRecord, receiveDate: string) => {
  const existingIndex = inventoryRecords.findIndex(item => item.materialName === record.materialName && item.unit === record.unit);
  if (existingIndex >= 0) {
    inventoryRecords[existingIndex] = {
      ...inventoryRecords[existingIndex],
      availableQuantity: Number((inventoryRecords[existingIndex].availableQuantity + record.quantity).toFixed(2)),
      receiveDate,
      sourcePO: record.poNumber,
      requirementId: record.requirementId,
    };
    return;
  }

  inventoryRecords.push({
    id: `INV-${getNextInventoryNumber()}`,
    materialName: record.materialName,
    availableQuantity: Number(record.quantity.toFixed(2)),
    unit: record.unit,
    receiveDate,
    sourcePO: record.poNumber,
    requirementId: record.requirementId,
  });
};

export const getSampleDispatchRecords = () => dispatchRecords.map(cloneDispatchRecord);

export const getPendingSampleReceiptRecords = () => dispatchRecords.filter(record => record.status === 'Sent to R&D').map(cloneDispatchRecord);

export const getReceivedSampleReceiptRecords = () => dispatchRecords.filter(record => record.status === 'Received by R&D').map(cloneDispatchRecord);

export const getSampleInventoryRecords = () => inventoryRecords.map(cloneInventoryRecord);

export const recordSampleDispatch = (input: {
  dispatchDate: string;
  poNumber: string;
  requirementId: string;
  materialName: string;
  quantity: number;
  unit: string;
  dispatchedBy: string;
  dispatchRemarks: string;
}) => {
  const existingIndex = dispatchRecords.findIndex(record => record.requirementId === input.requirementId);
  const existing = existingIndex >= 0 ? dispatchRecords[existingIndex] : null;
  const nextRecord: SampleDispatchRecord = {
    id: existing?.id || `DSP-${getNextDispatchNumber()}`,
    dispatchId: existing?.dispatchId || `DSP-${getNextDispatchNumber()}`,
    dispatchDate: input.dispatchDate,
    poNumber: input.poNumber,
    requirementId: input.requirementId,
    materialName: input.materialName,
    quantity: Number(input.quantity.toFixed(2)),
    unit: input.unit,
    dispatchedBy: input.dispatchedBy,
    dispatchRemarks: input.dispatchRemarks,
    status: 'Sent to R&D',
    receipt: existing?.receipt ? { ...existing.receipt } : undefined,
  };

  if (existingIndex >= 0) {
    dispatchRecords[existingIndex] = nextRecord;
  } else {
    dispatchRecords.push(nextRecord);
  }

  return cloneDispatchRecord(nextRecord);
};

export const receiveSampleFromDispatch = (dispatchId: string, input: { receiveDate: string; receivedBy: string; remarks: string }) => {
  const existingIndex = dispatchRecords.findIndex(record => record.dispatchId === dispatchId);
  if (existingIndex < 0) return null;

  const currentRecord = dispatchRecords[existingIndex];
  const nextRecord: SampleDispatchRecord = {
    ...currentRecord,
    status: 'Received by R&D',
    receipt: {
      receiveDate: input.receiveDate,
      receivedBy: input.receivedBy,
      remarks: input.remarks,
    },
  };

  dispatchRecords[existingIndex] = nextRecord;
  upsertInventoryFromDispatch(nextRecord, input.receiveDate);

  return cloneDispatchRecord(nextRecord);
};
