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
    getLiveRemainingStock: (itemId: string, warehouseId: string, supplierId: string) => number;
    getLiveRemainingCredit: (customerId: string) => number;
    updateManualAllocation: (orderId: string, allocatedQty: number, warehouseId: string, supplierId: string) => void;
}

// FIX 1: Added 'get' to the parameters here
export const useAllocationStore = create<AllocationState>((set, get) => ({
    orders: mockOrders,
    inventory: mockInventory,
    customers: mockCustomers,

    updateAllocation: (orderId, allocatedQty) =>
        set((state) => ({
            orders: state.orders.map((order) =>
            order.id === orderId ? { ...order, allocatedQuantity: allocatedQty } : order
        ),
    })),

    updateManualAllocation: (orderId, allocatedQty, warehouseId, supplierId) =>
    set((state) => ({
        orders: state.orders.map((order) =>
        order.id === orderId 
            ? { ...order, allocatedQuantity: allocatedQty, warehouseId, supplierId } 
            : order
        ),
    })),

    resetAllocations: () =>
        set({
            orders: mockOrders,
            inventory: mockInventory,
            customers: mockCustomers,
        }),

    runAutoAssign: () =>
    set(() => {
      // FIX 2: Pull draftOrders directly from mockOrders to reset Wildcards on every run
      let draftOrders = mockOrders.map((o) => ({ ...o }));
      let draftInventory = mockInventory.map((i) => ({ ...i }));
      let draftCustomers = mockCustomers.map((c) => ({ ...c }));

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

    getLiveRemainingStock: (itemId: string, warehouseId: string, supplierId: string) => {
        // Now get() will work perfectly!
        const { orders, inventory } = get();
        const baseStock = inventory.find(
            (i) => i.itemId === itemId && i.warehouseId === warehouseId && i.supplierId === supplierId
        )?.stock || 0;
    
        const currentlyAllocated = orders
        .filter((o) => o.itemId === itemId && o.warehouseId === warehouseId && o.supplierId === supplierId)
        .reduce((sum, o) => sum + o.allocatedQuantity, 0);
      
        return baseStock - currentlyAllocated;
    },

    getLiveRemainingCredit: (customerId: string) => {
        const { orders, customers } = get();
        const baseCredit = customers.find((c) => c.id === customerId)?.availableCredit || 0;
    
        const currentlySpent = orders
        .filter((o) => o.customerId === customerId)
        .reduce((sum, o) => {
        const rule = mockPricingRules.find((p) => p.itemId === o.itemId && p.supplierId === o.supplierId);
        if (!rule) return sum;
        const multiplier = mockPriceTiers[o.type].multiplier;
        const price = bankersRound(rule.basePrice * multiplier);
        return sum + (price * o.allocatedQuantity);
        }, 0);
      
    return baseCredit - currentlySpent;

    
  },
}));