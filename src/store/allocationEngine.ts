import type { SubOrder, Inventory, Customer, AllocationRecord } from '../types';
import { mockPricingRules, mockPriceTiers } from '../data/mockData';
import { bankersRound } from '../utils/rounding';

export function computeAutoAssignment(
  orders: SubOrder[],
  inventory: Inventory[],
  customers: Customer[]
): SubOrder[] {
  let draftOrders: SubOrder[] = orders.map((o) => ({ ...o }));

  let trackingInventory = inventory.map((i) => ({ ...i }));
  let trackingCustomers = customers.map((c) => ({ ...c }));

  // 1. Sort Orders by Priority & Date
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
    let validSources = trackingInventory.filter((inv) => {
      if (inv.itemId !== order.itemId || inv.stock <= 0) return false;
  
      const matchW = order.warehouseId === 'WH-000' || order.warehouseId === inv.warehouseId;
      const matchS = order.supplierId === 'SP-000' || order.supplierId === inv.supplierId;
  
      return matchW && matchS;
    });

    const multiplier = mockPriceTiers[order.type].multiplier;

    // SORTING STRATEGY: Highest stock first. If tied, cheapest final price first.
    validSources.sort((a, b) => {
      if (b.stock !== a.stock) {
        return b.stock - a.stock;
      }

      const ruleA = mockPricingRules.find(p => p.itemId === a.itemId && p.supplierId === a.supplierId);
      const ruleB = mockPricingRules.find(p => p.itemId === b.itemId && p.supplierId === b.supplierId);

      const finalPriceA = ruleA ? bankersRound(ruleA.basePrice * multiplier) : Infinity;
      const finalPriceB = ruleB ? bankersRound(ruleB.basePrice * multiplier) : Infinity;

      return finalPriceA - finalPriceB;
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

  return draftOrders;
}
