export type RequirementStatus = 'Pending' | 'Purchased' | 'Received' | 'Sent to R&D';

export type RndSampleRequirementRecord = {
  id: string;
  requirementId: string;
  requestedBy: string;
  requestDate: string;
  status: RequirementStatus;
  materialName: string;
  quantity: number;
  unit: string;
  purpose: 'Trial' | 'Base Formula' | 'Testing' | string;
  priority: 'Low' | 'Medium' | 'High' | string;
  requiredDate?: string;
  remarks?: string;
};

const records: RndSampleRequirementRecord[] = [];
const listeners: Array<() => void> = [];

const clone = (r: RndSampleRequirementRecord) => ({ ...r });

const notify = () => listeners.forEach(l => l());

const getNextNumber = () => String(records.length + 1).padStart(4, '0');

export const getRndSampleRequirements = () => records.map(clone);

export const getPendingRndSampleRequirements = () => records.filter(r => r.status === 'Pending').map(clone);

export const createRndSampleRequirement = (input: Omit<RndSampleRequirementRecord, 'id' | 'requirementId' | 'requestDate' | 'status'> & { requestDate?: string, status?: RequirementStatus }) => {
  const id = `RNRQ-${getNextNumber()}`;
  const requirementId = id;
  const record: RndSampleRequirementRecord = {
    id,
    requirementId,
    requestedBy: input.requestedBy,
    requestDate: input.requestDate || new Date().toISOString().slice(0, 10),
    status: input.status || 'Pending',
    materialName: input.materialName,
    quantity: Number(input.quantity || 0),
    unit: input.unit,
    purpose: input.purpose,
    priority: input.priority,
    requiredDate: input.requiredDate,
    remarks: input.remarks,
  };
  records.push(record);
  notify();
  return clone(record);
};

export const updateRndSampleRequirementStatus = (requirementId: string, status: RequirementStatus) => {
  const idx = records.findIndex(r => r.requirementId === requirementId);
  if (idx < 0) return null;
  records[idx] = { ...records[idx], status };
  notify();
  return clone(records[idx]);
};

export const subscribeRndRequirementStore = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
};

export default null;
