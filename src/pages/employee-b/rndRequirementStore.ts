export type RequirementStatus = 'Pending' | 'Purchased' | 'Received' | 'Sent to R&D';

export type SamplePurchaseRecord = {
  id: string; requirementId: string; requirementDate: string; requestedBy: string; materialName: string;
  requiredQuantity: number; unit: string; purchaseDate: string; poNumber: string; supplier: string;
  purchasedQuantity: string; pricePerUnit: string; expectedDeliveryDate: string; remarks: string;
  totalAmount: number; status: 'Purchased' | 'Received' | 'Sent to R&D';
  receipt?: { receivedQuantity: string; receivedDate: string; invoiceNumber: string; remarks: string };
  dispatch?: { dispatchDate: string; dispatchedBy: string; remarks: string };
};

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
  purchase?: SamplePurchaseRecord;
};

