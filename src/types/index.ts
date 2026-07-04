export type OrderPriority = 'EMERGENCY' | 'OVER_DUE' | 'DAILY';

// NEW: This interface tracks split fulfillment sources
export interface AllocationRecord {
  warehouseId: string;
  supplierId: string;
  quantity: number;
}

export interface SubOrder {
  id: string;
  orderId: string;
  itemId: string;
  warehouseId: string; // The originally requested warehouse (or WH-000 wildcard)
  supplierId: string;  // The originally requested supplier (or SP-000 wildcard)
  requestQuantity: number;
  type: OrderPriority;
  createDate: string;
  customerId: string;
  remark?: string;
  
  // NEW: Replaces the flat 'allocatedQuantity' number
  allocations: AllocationRecord[]; 
}

export interface Inventory {
  warehouseId: string;
  supplierId: string;
  itemId: string;
  stock: number;
}

export interface Customer {
  id: string;
  availableCredit: number;
}

export interface PricingRule {
  itemId: string;
  supplierId: string;
  basePrice: number;
}

export interface PriceTier {
  tier: OrderPriority;
  multiplier: number;
}