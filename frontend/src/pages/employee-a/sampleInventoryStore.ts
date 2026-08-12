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

