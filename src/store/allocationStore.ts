import { create } from 'zustand';
import type { SubOrder, Inventory, Customer, AllocationRecord } from '../types';
import { mockOrders, mockInventory, mockCustomers, mockPricingRules, mockPriceTiers } from '../data/mockData';
import { bankersRound } from '../utils/rounding';
import { computeAutoAssignment } from './allocationEngine';

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
      orders: state.orders.map(order => ({ ...order, allocations: [] as AllocationRecord[] })),
      inventory: mockInventory,
      customers: mockCustomers,
    })),

  runAutoAssign: () =>
    set(() => {
      const draftOrders = mockOrders.map((o) => ({ ...o, allocations: [] as AllocationRecord[] }));
      return { orders: computeAutoAssignment(draftOrders, mockInventory, mockCustomers) };
    }),

  getLiveRemainingStock: (itemId, warehouseId, supplierId) => {
    const { orders, inventory } = get();
    const baseStock = inventory.find(
      (i) => i.itemId === itemId && i.warehouseId === warehouseId && i.supplierId === supplierId
    )?.stock || 0;

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