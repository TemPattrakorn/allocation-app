import { create } from 'zustand';
import type { SubOrder, Inventory, Customer } from '../types';
import { mockOrders, mockInventory, mockCustomers } from '../data/mockData';

interface AllocationState {
  orders: SubOrder[];
  inventory: Inventory[];
  customers: Customer[];
  
  // Actions
  updateAllocation: (orderId: string, allocatedQty: number) => void;
  resetAllocations: () => void;
  // We will add runAutoAssign in Phase 3
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
}));