import { create } from 'zustand';
import type { SubOrder, Inventory, Customer, AllocationRecord } from '../types';
import { mockOrders, mockInventory, mockCustomers, mockPricingRules, mockPriceTiers } from '../data/mockData';
import { bankersRound } from '../utils/rounding';

interface AllocationState {
  orders: SubOrder[];
  inventory: Inventory[];
  customers: Customer[];
  updateManualAllocation: (orderId: string, allocations: AllocationRecord[]) => void;
  resetAllocations: () => void;
  runAutoAssign: () => void;
  getLiveRemainingStock: (itemId: string, warehouseId: string, supplierId: string) => number;
  getLiveRemainingCredit: (customerId: string) => number;
}

export const useAllocationStore = create<AllocationState>((set, get) => ({
  orders: mockOrders,
  inventory: mockInventory,
  customers: mockCustomers,

  updateManualAllocation: (orderId, allocations) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, allocations } : order
      ),
    })),

  resetAllocations: () =>
    set((state) => ({
      // FIX: Tell TS this empty array is meant for AllocationRecords
      orders: state.orders.map(order => ({ ...order, allocations: [] as AllocationRecord[] })),
      inventory: mockInventory,
      customers: mockCustomers,
    })),

  runAutoAssign: () =>
    set(() => {
      // FIX: Tell TS the draft array is meant for AllocationRecords and SubOrders
      let draftOrders: SubOrder[] = mockOrders.map((o) => ({ ...o, allocations: [] as AllocationRecord[] }));
      
      let trackingInventory = mockInventory.map((i) => ({ ...i }));
      let trackingCustomers = mockCustomers.map((c) => ({ ...c }));

      // 1. Sort by Priority & Date
      const priorityWeight = { EMERGENCY: 3, OVER_DUE: 2, DAILY: 1 };
      draftOrders.sort((a, b) => {
        if (priorityWeight[a.type] !== priorityWeight[b.type]) {
          return priorityWeight[b.type] - priorityWeight[a.type];
        }
        return new Date(a.createDate).getTime() - new Date(b.createDate).getTime();
      });

      // 2. The Split-Fulfillment Loop
      draftOrders = draftOrders.map((order) => {
        let remainingToFulfill = order.requestQuantity;
        const newAllocations: AllocationRecord[] = [];

        // Find all sources that stock this item and match wildcard rules
        let validSources = trackingInventory.filter((inv) => {
          if (inv.itemId !== order.itemId || inv.stock <= 0) return false;
          const matchW = order.warehouseId === 'WH-000' || order.warehouseId === inv.warehouseId;
          const matchS = order.supplierId === 'SP-000' || order.supplierId === inv.supplierId;
          return matchW && matchS;
        });

        // SORTING STRATEGY: Cheapest base price first (to stretch customer credit), then highest stock
        validSources.sort((a, b) => {
          const ruleA = mockPricingRules.find(p => p.itemId === a.itemId && p.supplierId === a.supplierId);
          const ruleB = mockPricingRules.find(p => p.itemId === b.itemId && p.supplierId === b.supplierId);
          const priceA = ruleA?.basePrice || Infinity;
          const priceB = ruleB?.basePrice || Infinity;
          
          if (priceA !== priceB) return priceA - priceB;
          return b.stock - a.stock;
        });

        const custIndex = trackingCustomers.findIndex((c) => c.id === order.customerId);
        if (custIndex === -1) return order;

        // Greedy consumption loop
        for (const source of validSources) {
          if (remainingToFulfill <= 0) break; // Order fulfilled!

          const invIndex = trackingInventory.findIndex(
            (i) => i.itemId === source.itemId && i.warehouseId === source.warehouseId && i.supplierId === source.supplierId
          );

          const rule = mockPricingRules.find((p) => p.itemId === order.itemId && p.supplierId === source.supplierId);
          if (!rule) continue;

          const multiplier = mockPriceTiers[order.type].multiplier;
          const finalUnitPrice = bankersRound(rule.basePrice * multiplier);

          const maxQtyByStock = Math.min(remainingToFulfill, trackingInventory[invIndex].stock);
          const customerCredit = trackingCustomers[custIndex].availableCredit;
          const maxQtyByCredit = finalUnitPrice > 0 ? Math.floor(customerCredit / finalUnitPrice) : maxQtyByStock; 
          
          const allocatedQty = Math.min(maxQtyByStock, maxQtyByCredit);

          if (allocatedQty > 0) {
            trackingInventory[invIndex].stock -= allocatedQty;
            trackingCustomers[custIndex].availableCredit -= (allocatedQty * finalUnitPrice);
            remainingToFulfill -= allocatedQty;

            newAllocations.push({
              warehouseId: source.warehouseId,
              supplierId: source.supplierId,
              quantity: allocatedQty
            });
          }
        }

        return { ...order, allocations: newAllocations };
      });

      return { orders: draftOrders };
    }),

  getLiveRemainingStock: (itemId, warehouseId, supplierId) => {
    const { orders, inventory } = get();
    const baseStock = inventory.find(
      (i) => i.itemId === itemId && i.warehouseId === warehouseId && i.supplierId === supplierId
    )?.stock || 0;

    // Sum all quantities from the new allocations arrays
    const currentlyAllocated = orders.reduce((total, o) => {
      if (o.itemId !== itemId) return total;
      
      const sourceAllocations = o.allocations.filter(
        (a) => a.warehouseId === warehouseId && a.supplierId === supplierId
      );
      return total + sourceAllocations.reduce((sum, a) => sum + a.quantity, 0);
    }, 0);
  
    return baseStock - currentlyAllocated;
  },

  getLiveRemainingCredit: (customerId) => {
    const { orders, customers } = get();
    const baseCredit = customers.find((c) => c.id === customerId)?.availableCredit || 0;

    // Loop through every split record inside every order for this customer
    const currentlySpent = orders
      .filter((o) => o.customerId === customerId)
      .reduce((totalSpent, o) => {
        const multiplier = mockPriceTiers[o.type].multiplier;
        
        const orderCost = o.allocations.reduce((sum, a) => {
          const rule = mockPricingRules.find((p) => p.itemId === o.itemId && p.supplierId === a.supplierId);
          if (!rule) return sum;
          const price = bankersRound(rule.basePrice * multiplier);
          return sum + (price * a.quantity);
        }, 0);

        return totalSpent + orderCost;
      }, 0);
  
    return baseCredit - currentlySpent;
  },
}));