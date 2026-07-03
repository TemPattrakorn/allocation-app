import type { SubOrder, Inventory, Customer, PricingRule, PriceTier } from '../types';

export const mockOrders: SubOrder[] = [
  { id: 'ORDER-0001-001', orderId: 'ORDER-0001', itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', requestQuantity: 11, type: 'DAILY', createDate: '2025-01-01T00:00:00Z', customerId: 'CT-0001', allocatedQuantity: 0 },
  { id: 'ORDER-0001-002', orderId: 'ORDER-0001', itemId: 'Item-2', warehouseId: 'WH-002', supplierId: 'SP-000', requestQuantity: 20, type: 'DAILY', createDate: '2025-01-01T00:00:00Z', customerId: 'CT-0001', allocatedQuantity: 0 },
  { id: 'ORDER-0002-001', orderId: 'ORDER-0002', itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-002', requestQuantity: 300, type: 'EMERGENCY', createDate: '2025-01-03T00:00:00Z', customerId: 'CT-0002', remark: 'Special for VIP', allocatedQuantity: 0 },
  { id: 'ORDER-0002-002', orderId: 'ORDER-0002', itemId: 'Item-2', warehouseId: 'WH-000', supplierId: 'SP-000', requestQuantity: 100, type: 'EMERGENCY', createDate: '2025-01-03T00:00:00Z', customerId: 'CT-0002', remark: 'Special for VIP', allocatedQuantity: 0 },
];

// Extrapolated base prices from the image
export const mockPricingRules: PricingRule[] = [
  { itemId: 'Item-1', supplierId: 'SP-001', basePrice: 99.75 }, 
  { itemId: 'Item-1', supplierId: 'SP-002', basePrice: 105.00 }, // Mock base price
  { itemId: 'Item-2', supplierId: 'SP-001', basePrice: 150.00 }, // Mock base price
];

export const mockPriceTiers: Record<string, PriceTier> = {
  EMERGENCY: { tier: 'EMERGENCY', multiplier: 1.25 },
  OVER_DUE: { tier: 'OVER_DUE', multiplier: 1.00 },
  DAILY: { tier: 'DAILY', multiplier: 0.90 },
};

// Mock inventory data to test the allocation algorithm (including wildcard tests)
export const mockInventory: Inventory[] = [
  { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-1', stock: 50 },
  { warehouseId: 'WH-001', supplierId: 'SP-002', itemId: 'Item-1', stock: 250 },
  { warehouseId: 'WH-002', supplierId: 'SP-001', itemId: 'Item-2', stock: 50 },
  { warehouseId: 'WH-003', supplierId: 'SP-002', itemId: 'Item-2', stock: 150 }, // Highest stock for wildcards
];

export const mockCustomers: Customer[] = [
  { id: 'CT-0001', availableCredit: 5000 },
  { id: 'CT-0002', availableCredit: 30000 },
];