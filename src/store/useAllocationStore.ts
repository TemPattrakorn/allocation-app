import { create } from 'zustand';
import type { SubOrder, Inventory, Customer } from '../types';
import { mockOrders, mockInventory, mockCustomers, mockPricingRules, mockPriceTiers } from '../data/mockData';
import { bankersRound } from '../utils/rounding';

interface AllocationState {
  orders: SubOrder[];
  inventory: Inventory[];
  customers: Customer[];
  updateAllocation: (orderId: string, allocatedQty: number) => void;
  resetAllocations: () => void;
  runAutoAssign: () => void;
}

export const useAllocationStore = create<AllocationState>((set) => ({
  orders: mockOrders,
  inventory: mockInventory,
  customers: mockCustomers,

  updateAllocation: (orderId, allocatedQty) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, allocatedQuantity: allocatedQty } : order
      ),
    })),

  resetAllocations: () =>
    set({
      orders: mockOrders,
      inventory: mockInventory,
      customers: mockCustomers,
    }),

  runAutoAssign: () =>
    set((state) => {
      // 1. Create deep copies of the state to safely mutate during calculation
      let draftOrders = [...state.orders];
      let draftInventory = state.inventory.map((i) => ({ ...i }));
      let draftCustomers = state.customers.map((c) => ({ ...c }));

      // 2. Sort Orders: EMERGENCY > OVER_DUE > DAILY, then by Create Date (FIFO)
      const priorityWeight = { EMERGENCY: 3, OVER_DUE: 2, DAILY: 1 };
      draftOrders.sort((a, b) => {
        if (priorityWeight[a.type] !== priorityWeight[b.type]) {
          return priorityWeight[b.type] - priorityWeight[a.type];
        }
        return new Date(a.createDate).getTime() - new Date(b.createDate).getTime();
      });

      // 3. Process each order sequentially
      draftOrders = draftOrders.map((order) => {
        let currentWarehouse = order.warehouseId;
        let currentSupplier = order.supplierId;

        // --- WILDCARD RESOLUTION ---
        if (currentWarehouse === 'WH-000' || currentSupplier === 'SP-000') {
          const validStock = draftInventory.filter((inv) => inv.itemId === order.itemId);
          let highestStock = -1;
          let bestMatch = null;

          for (const inv of validStock) {
            const matchW = currentWarehouse === 'WH-000' || currentWarehouse === inv.warehouseId;
            const matchS = currentSupplier === 'SP-000' || currentSupplier === inv.supplierId;
            
            if (matchW && matchS && inv.stock > highestStock) {
              highestStock = inv.stock;
              bestMatch = inv;
            }
          }

          if (bestMatch) {
            currentWarehouse = bestMatch.warehouseId;
            currentSupplier = bestMatch.supplierId;
          } else {
            // Cannot fulfill wildcard
            return { ...order, allocatedQuantity: 0 };
          }
        }

        // --- INVENTORY LOOKUP ---
        const invIndex = draftInventory.findIndex(
          (i) => i.itemId === order.itemId && i.warehouseId === currentWarehouse && i.supplierId === currentSupplier
        );
        if (invIndex === -1 || draftInventory[invIndex].stock <= 0) {
          return { ...order, allocatedQuantity: 0 };
        }

        // --- PRICING & BANKER's ROUNDING ---
        const rule = mockPricingRules.find(
          (p) => p.itemId === order.itemId && p.supplierId === currentSupplier
        );
        if (!rule) return { ...order, allocatedQuantity: 0 };

        const multiplier = mockPriceTiers[order.type].multiplier;
        const unroundedPrice = rule.basePrice * multiplier;
        const finalUnitPrice = bankersRound(unroundedPrice);

        // --- CUSTOMER CREDIT LOOKUP ---
        const custIndex = draftCustomers.findIndex((c) => c.id === order.customerId);
        if (custIndex === -1) return { ...order, allocatedQuantity: 0 };
        
        const customer = draftCustomers[custIndex];
        const inventoryRecord = draftInventory[invIndex];

        // --- CONSTRAINT CHECKS & ALLOCATION ---
        const maxQtyByStock = Math.min(order.requestQuantity, inventoryRecord.stock);
        // Avoid division by zero if price is somehow 0
        const maxQtyByCredit = finalUnitPrice > 0 ? Math.floor(customer.availableCredit / finalUnitPrice) : maxQtyByStock; 
        
        const allocatedQty = Math.min(maxQtyByStock, maxQtyByCredit);

        // Deduct from global state pools
        if (allocatedQty > 0) {
          draftInventory[invIndex].stock -= allocatedQty;
          draftCustomers[custIndex].availableCredit -= (allocatedQty * finalUnitPrice);
        }

        return { 
          ...order, 
          allocatedQuantity: allocatedQty,
          // Update visual IDs if resolved from a wildcard
          warehouseId: currentWarehouse, 
          supplierId: currentSupplier 
        };
      });

      return { orders: draftOrders, inventory: draftInventory, customers: draftCustomers };
    }),
}));