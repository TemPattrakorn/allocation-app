export type OrderPriority = 'EMERGENCY' | 'OVER_DUE' | 'DAILY';

export interface SubOrder {
  id: string; // e.g., ORDER-0001-001
  orderId: string; // e.g., ORDER-0001
  itemId: string;
  warehouseId: string; // e.g., WH-001, or WH-000 for wildcard
  supplierId: string; // e.g., SP-001, or SP-000 for wildcard
  requestQuantity: number;
  type: OrderPriority;
  createDate: string; // ISO string preferred for sorting
  customerId: string;
  remark?: string;
  allocatedQuantity: number; // For our UI state
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
  multiplier: number; // e.g., 1.25 for 125%
}