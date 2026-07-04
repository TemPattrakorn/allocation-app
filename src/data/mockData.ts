import type { SubOrder, Inventory, Customer, PricingRule, PriceTier } from '../types';

export const mockOrders: SubOrder[] = [
  // Original Orders
  { id: 'ORDER-0001-001', orderId: 'ORDER-0001', itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', requestQuantity: 11, type: 'DAILY', createDate: '2025-01-01T00:00:00Z', customerId: 'CT-0001', allocations: [] },
  { id: 'ORDER-0001-002', orderId: 'ORDER-0001', itemId: 'Item-2', warehouseId: 'WH-002', supplierId: 'SP-000', requestQuantity: 20, type: 'DAILY', createDate: '2025-01-01T00:00:00Z', customerId: 'CT-0001', allocations: [] },
  { id: 'ORDER-0002-001', orderId: 'ORDER-0002', itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-002', requestQuantity: 300, type: 'EMERGENCY', createDate: '2025-01-03T00:00:00Z', customerId: 'CT-0002', remark: 'Special for VIP', allocations: [] },
  { id: 'ORDER-0002-002', orderId: 'ORDER-0002', itemId: 'Item-2', warehouseId: 'WH-000', supplierId: 'SP-000', requestQuantity: 100, type: 'EMERGENCY', createDate: '2025-01-03T00:00:00Z', customerId: 'CT-0002', remark: 'Special for VIP', allocations: [] },
  { id: 'ORDER-0003-001', orderId: 'ORDER-0003', itemId: 'Item-1', warehouseId: 'WH-001', supplierId: 'SP-001', requestQuantity: 20, type: 'OVER_DUE', createDate: '2024-12-30T00:00:00Z', customerId: 'CT-0003', allocations: [] },
  { id: 'ORDER-0003-002', orderId: 'ORDER-0003', itemId: 'Item-3', warehouseId: 'WH-000', supplierId: 'SP-000', requestQuantity: 50, type: 'OVER_DUE', createDate: '2025-01-02T00:00:00Z', customerId: 'CT-0003', allocations: [] },
  { id: 'ORDER-0004-001', orderId: 'ORDER-0004', itemId: 'Item-3', warehouseId: 'WH-002', supplierId: 'SP-003', requestQuantity: 600, type: 'EMERGENCY', createDate: '2025-01-04T00:00:00Z', customerId: 'CT-0004', remark: 'Exceeds Stock', allocations: [] }, 
  { id: 'ORDER-0005-001', orderId: 'ORDER-0005', itemId: 'Item-2', warehouseId: 'WH-003', supplierId: 'SP-002', requestQuantity: 40, type: 'DAILY', createDate: '2025-01-05T00:00:00Z', customerId: 'CT-0005', remark: 'Low Credit Test', allocations: [] },
  
  // New Expanded Orders - Heavy Wildcard Usage
  { id: 'ORDER-0006-001', orderId: 'ORDER-0006', itemId: 'Item-1', warehouseId: 'WH-000', supplierId: 'SP-000', requestQuantity: 450, type: 'EMERGENCY', createDate: '2025-01-06T10:00:00Z', customerId: 'CT-0006', remark: 'Requires heavy splitting', allocations: [] },
  { id: 'ORDER-0006-002', orderId: 'ORDER-0006', itemId: 'Item-5', warehouseId: 'WH-000', supplierId: 'SP-000', requestQuantity: 25, type: 'DAILY', createDate: '2025-01-06T10:05:00Z', customerId: 'CT-0006', allocations: [] },
  { id: 'ORDER-0007-001', orderId: 'ORDER-0007', itemId: 'Item-4', warehouseId: 'WH-004', supplierId: 'SP-000', requestQuantity: 120, type: 'OVER_DUE', createDate: '2024-12-28T08:30:00Z', customerId: 'CT-0007', remark: 'Oldest overdue order', allocations: [] },
  { id: 'ORDER-0008-001', orderId: 'ORDER-0008', itemId: 'Item-2', warehouseId: 'WH-000', supplierId: 'SP-005', requestQuantity: 80, type: 'DAILY', createDate: '2025-01-07T14:15:00Z', customerId: 'CT-0008', allocations: [] },
  { id: 'ORDER-0009-001', orderId: 'ORDER-0009', itemId: 'Item-3', warehouseId: 'WH-000', supplierId: 'SP-000', requestQuantity: 800, type: 'EMERGENCY', createDate: '2025-01-07T16:00:00Z', customerId: 'CT-0009', remark: 'Whale customer, huge demand', allocations: [] },
  { id: 'ORDER-0010-001', orderId: 'ORDER-0010', itemId: 'Item-1', warehouseId: 'WH-000', supplierId: 'SP-000', requestQuantity: 15, type: 'DAILY', createDate: '2025-01-08T09:00:00Z', customerId: 'CT-0010', allocations: [] },
  { id: 'ORDER-0010-002', orderId: 'ORDER-0010', itemId: 'Item-2', warehouseId: 'WH-000', supplierId: 'SP-000', requestQuantity: 15, type: 'DAILY', createDate: '2025-01-08T09:05:00Z', customerId: 'CT-0010', allocations: [] },
  { id: 'ORDER-0011-001', orderId: 'ORDER-0011', itemId: 'Item-4', warehouseId: 'WH-000', supplierId: 'SP-000', requestQuantity: 300, type: 'OVER_DUE', createDate: '2025-01-01T11:00:00Z', customerId: 'CT-0011', allocations: [] },
  { id: 'ORDER-0012-001', orderId: 'ORDER-0012', itemId: 'Item-5', warehouseId: 'WH-005', supplierId: 'SP-005', requestQuantity: 200, type: 'DAILY', createDate: '2025-01-09T10:00:00Z', customerId: 'CT-0012', remark: 'Strict location requirement', allocations: [] },
  { id: 'ORDER-0013-001', orderId: 'ORDER-0013', itemId: 'Item-2', warehouseId: 'WH-000', supplierId: 'SP-000', requestQuantity: 50, type: 'EMERGENCY', createDate: '2025-01-09T11:30:00Z', customerId: 'CT-0013', allocations: [] },
  { id: 'ORDER-0014-001', orderId: 'ORDER-0014', itemId: 'Item-3', warehouseId: 'WH-000', supplierId: 'SP-000', requestQuantity: 75, type: 'DAILY', createDate: '2025-01-10T08:45:00Z', customerId: 'CT-0014', allocations: [] },
  { id: 'ORDER-0015-001', orderId: 'ORDER-0015', itemId: 'Item-1', warehouseId: 'WH-000', supplierId: 'SP-000', requestQuantity: 500, type: 'OVER_DUE', createDate: '2025-01-02T13:20:00Z', customerId: 'CT-0015', remark: 'Should exhaust remaining Item-1', allocations: [] },
];

export const mockPricingRules: PricingRule[] = [
  // Item 1
  { itemId: 'Item-1', supplierId: 'SP-001', basePrice: 99.75 }, 
  { itemId: 'Item-1', supplierId: 'SP-002', basePrice: 105.00 },
  { itemId: 'Item-1', supplierId: 'SP-004', basePrice: 95.50 }, // Cheapest Item 1
  
  // Item 2
  { itemId: 'Item-2', supplierId: 'SP-001', basePrice: 150.00 },
  { itemId: 'Item-2', supplierId: 'SP-002', basePrice: 140.00 },
  { itemId: 'Item-2', supplierId: 'SP-005', basePrice: 145.00 },
  
  // Item 3
  { itemId: 'Item-3', supplierId: 'SP-002', basePrice: 210.00 },
  { itemId: 'Item-3', supplierId: 'SP-003', basePrice: 200.50 },
  { itemId: 'Item-3', supplierId: 'SP-005', basePrice: 195.00 }, // Cheapest Item 3
  
  // Item 4
  { itemId: 'Item-4', supplierId: 'SP-001', basePrice: 320.00 },
  { itemId: 'Item-4', supplierId: 'SP-003', basePrice: 315.00 },
  { itemId: 'Item-4', supplierId: 'SP-004', basePrice: 330.00 },
  
  // Item 5 (Premium)
  { itemId: 'Item-5', supplierId: 'SP-003', basePrice: 500.00 },
  { itemId: 'Item-5', supplierId: 'SP-004', basePrice: 480.00 },
  { itemId: 'Item-5', supplierId: 'SP-005', basePrice: 510.00 },
];

export const mockPriceTiers: Record<string, PriceTier> = {
  EMERGENCY: { tier: 'EMERGENCY', multiplier: 1.25 },
  OVER_DUE: { tier: 'OVER_DUE', multiplier: 1.00 },
  DAILY: { tier: 'DAILY', multiplier: 0.90 },
};

export const mockInventory: Inventory[] = [
  // Item 1 Spread
  { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-1', stock: 50 },
  { warehouseId: 'WH-001', supplierId: 'SP-002', itemId: 'Item-1', stock: 250 },
  { warehouseId: 'WH-004', supplierId: 'SP-001', itemId: 'Item-1', stock: 100 },
  { warehouseId: 'WH-002', supplierId: 'SP-004', itemId: 'Item-1', stock: 400 },
  { warehouseId: 'WH-005', supplierId: 'SP-004', itemId: 'Item-1', stock: 150 },

  // Item 2 Spread
  { warehouseId: 'WH-002', supplierId: 'SP-001', itemId: 'Item-2', stock: 50 },
  { warehouseId: 'WH-003', supplierId: 'SP-002', itemId: 'Item-2', stock: 150 }, 
  { warehouseId: 'WH-001', supplierId: 'SP-005', itemId: 'Item-2', stock: 80 },
  { warehouseId: 'WH-005', supplierId: 'SP-005', itemId: 'Item-2', stock: 200 },

  // Item 3 Spread
  { warehouseId: 'WH-001', supplierId: 'SP-003', itemId: 'Item-3', stock: 10 },
  { warehouseId: 'WH-002', supplierId: 'SP-003', itemId: 'Item-3', stock: 500 },
  { warehouseId: 'WH-003', supplierId: 'SP-002', itemId: 'Item-3', stock: 300 },
  { warehouseId: 'WH-004', supplierId: 'SP-005', itemId: 'Item-3', stock: 120 },

  // Item 4 Spread
  { warehouseId: 'WH-001', supplierId: 'SP-001', itemId: 'Item-4', stock: 90 },
  { warehouseId: 'WH-004', supplierId: 'SP-003', itemId: 'Item-4', stock: 210 },
  { warehouseId: 'WH-005', supplierId: 'SP-004', itemId: 'Item-4', stock: 60 },

  // Item 5 Spread
  { warehouseId: 'WH-002', supplierId: 'SP-003', itemId: 'Item-5', stock: 40 },
  { warehouseId: 'WH-003', supplierId: 'SP-004', itemId: 'Item-5', stock: 85 },
  { warehouseId: 'WH-005', supplierId: 'SP-005', itemId: 'Item-5', stock: 300 },
];

export const mockCustomers: Customer[] = [
  // Original
  { id: 'CT-0001', availableCredit: 5000 },
  { id: 'CT-0002', availableCredit: 60000 }, // Updated to 60k per your earlier testing
  { id: 'CT-0003', availableCredit: 15000 }, 
  { id: 'CT-0004', availableCredit: 100000 }, 
  { id: 'CT-0005', availableCredit: 1500 }, 
  
  // New Expanded Customers
  { id: 'CT-0006', availableCredit: 85000 }, // High credit, heavy splitting
  { id: 'CT-0007', availableCredit: 45000 }, 
  { id: 'CT-0008', availableCredit: 12000 }, 
  { id: 'CT-0009', availableCredit: 500000 }, // Massive Whale
  { id: 'CT-0010', availableCredit: 3000 },  // Micro buyer
  { id: 'CT-0011', availableCredit: 75000 }, 
  { id: 'CT-0012', availableCredit: 150000 }, 
  { id: 'CT-0013', availableCredit: 20000 }, 
  { id: 'CT-0014', availableCredit: 35000 }, 
  { id: 'CT-0015', availableCredit: 90000 }, 
];