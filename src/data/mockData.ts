import type { SubOrder, Inventory, Customer, PricingRule, PriceTier } from '../types';

export const mockOrders: SubOrder[] = [
  { id: 'ORDER-0001-001', orderId: 'ORDER-0001', itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', requestQuantity: 11, type: 'DAILY', createDate: '2025-01-01T00:00:00Z', customerId: 'CT-0001', allocatedQuantity: 0 },
  { id: 'ORDER-0001-002', orderId: 'ORDER-0001', itemId: 'Item-2', warehouseId: 'WH-002', supplierId: 'SP-000', requestQuantity: 20, type: 'DAILY', createDate: '2025-01-01T00:00:00Z', customerId: 'CT-0001', allocatedQuantity: 0 },
  { id: 'ORDER-0002-001', orderId: 'ORDER-0002', itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-002', requestQuantity: 300, type: 'EMERGENCY', createDate: '2025-01-03T00:00:00Z', customerId: 'CT-0002', remark: 'Special for VIP', allocatedQuantity: 0 },
  { id: 'ORDER-0002-002', orderId: 'ORDER-0002', itemId: 'Item-2', warehouseId: 'WH-000', supplierId: 'SP-000', requestQuantity: 100, type: 'EMERGENCY', createDate: '2025-01-03T00:00:00Z', customerId: 'CT-0002', remark: 'Special for VIP', allocatedQuantity: 0 },
  { id: 'ORDER-0003-001', orderId: 'ORDER-0003', itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', requestQuantity: 20, type: 'OVER_DUE', createDate: '2024-12-30T00:00:00Z', customerId: 'CT-0003', allocatedQuantity: 0 }, // Oldest Overdue
  { id: 'ORDER-0003-002', orderId: 'ORDER-0003', itemId: 'Item-3', warehouseId: 'WH-000', supplierId: 'SP-000', requestQuantity: 50, type: 'OVER_DUE', createDate: '2025-01-02T00:00:00Z', customerId: 'CT-0003', allocatedQuantity: 0 }, // Wildcard Test
  { id: 'ORDER-0004-001', orderId: 'ORDER-0004', itemId: 'Item-3', warehouseId: 'WH-002', supplierId: 'SP-003', requestQuantity: 600, type: 'EMERGENCY', createDate: '2025-01-04T00:00:00Z', customerId: 'CT-0004', remark: 'Exceeds Stock', allocatedQuantity: 0 }, 
  { id: 'ORDER-0005-001', orderId: 'ORDER-0005', itemId: 'Item-2', warehouseId: 'WH-003', supplierId: 'SP-002', requestQuantity: 40, type: 'DAILY', createDate: '2025-01-05T00:00:00Z', customerId: 'CT-0005', remark: 'Low Credit Test', allocatedQuantity: 0 },
];

export const mockPricingRules: PricingRule[] = [
  { itemId: 'Item-1', supplierId: 'SP-001', basePrice: 99.75 }, 
  { itemId: 'Item-1', supplierId: 'SP-002', basePrice: 105.00 },
  { itemId: 'Item-2', supplierId: 'SP-001', basePrice: 150.00 },
  { itemId: 'Item-2', supplierId: 'SP-002', basePrice: 140.00 },
  { itemId: 'Item-3', supplierId: 'SP-003', basePrice: 200.50 },
];

export const mockPriceTiers: Record<string, PriceTier> = {
  EMERGENCY: { tier: 'EMERGENCY', multiplier: 1.25 },
  OVER_DUE: { tier: 'OVER_DUE', multiplier: 1.00 },
  DAILY: { tier: 'DAILY', multiplier: 0.90 },
};

export const mockInventory: Inventory[] = [
  { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-1', stock: 50 },
  { warehouseId: 'WH-001', supplierId: 'SP-002', itemId: 'Item-1', stock: 250 },
  { warehouseId: 'WH-002', supplierId: 'SP-001', itemId: 'Item-2', stock: 50 },
  { warehouseId: 'WH-003', supplierId: 'SP-002', itemId: 'Item-2', stock: 150 }, 
  { warehouseId: 'WH-004', supplierId: 'SP-001', itemId: 'Item-1', stock: 100 },
  { warehouseId: 'WH-001', supplierId: 'SP-003', itemId: 'Item-3', stock: 10 },
  { warehouseId: 'WH-002', supplierId: 'SP-003', itemId: 'Item-3', stock: 500 },
];

export const mockCustomers: Customer[] = [
  { id: 'CT-0001', availableCredit: 5000 },
  { id: 'CT-0002', availableCredit: 30000 },
  { id: 'CT-0003', availableCredit: 15000 }, // Mid-tier credit
  { id: 'CT-0004', availableCredit: 100000 }, // High credit (Whale) - Will hit stock limits first
  { id: 'CT-0005', availableCredit: 1500 }, // Low credit - Will hit credit limits before fulfilling 40 units of Item-2
];