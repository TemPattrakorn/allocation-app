import React, { useState } from 'react';
import { useAllocationStore } from '@/store/useAllocationStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, PieChart, XCircle, ChevronDown, ChevronRight, Save, X } from 'lucide-react';
import { mockPricingRules, mockPriceTiers } from '@/data/mockData';
import { bankersRound } from '@/utils/rounding';
import type { OrderPriority, AllocationRecord, SubOrder } from '@/types';

// --- SUB-COMPONENT: ZONE C (SPLIT ALLOCATION DETAIL PANEL) ---
function AllocationDetailPanel({ order, onClose }: { order: SubOrder; onClose: () => void }) {
  const { orders, customers, inventory, updateManualAllocation } = useAllocationStore();

  const validSources = inventory.filter(i => i.itemId === order.itemId);

  const [draftQuantities, setDraftQuantities] = useState<Record<string, number | ''>>(() => {
    const initialMap: Record<string, number> = {};
    order.allocations.forEach(a => {
      initialMap[`${a.warehouseId}|${a.supplierId}`] = a.quantity;
    });
    return initialMap;
  });

  const getNumericQty = (key: string) => {
    const val = draftQuantities[key];
    return val === '' || val === undefined ? 0 : val;
  };

  const totalDraftAllocated = validSources.reduce((sum, src) => {
    return sum + getNumericQty(`${src.warehouseId}|${src.supplierId}`);
  }, 0);

  const multiplier = mockPriceTiers[order.type].multiplier;
  let runningLineTotal = 0;
  let sourceStockExceeded = false;
  const stockExceededTracker: Record<string, boolean> = {};
  const sourceMaxAvailTracker: Record<string, number> = {};

  const sourceRowsData = validSources.map(src => {
    const key = `${src.warehouseId}|${src.supplierId}`;
    const draftQty = getNumericQty(key);

    const othersUsed = orders
      .filter(o => o.itemId === order.itemId && o.id !== order.id)
      .reduce((sum, o) => {
        const matchingAlloc = o.allocations.find(a => a.warehouseId === src.warehouseId && a.supplierId === src.supplierId);
        return sum + (matchingAlloc ? matchingAlloc.quantity : 0);
      }, 0);

    const availableStockAtSource = src.stock - othersUsed;
    sourceMaxAvailTracker[key] = availableStockAtSource;

    if (draftQty > availableStockAtSource) {
      sourceStockExceeded = true;
      stockExceededTracker[key] = true;
    }

    const rule = mockPricingRules.find(p => p.itemId === order.itemId && p.supplierId === src.supplierId);
    const basePrice = rule?.basePrice || 0;
    const unitPrice = bankersRound(basePrice * multiplier);
    const rowTotal = bankersRound(unitPrice * draftQty);
    
    runningLineTotal += rowTotal;

    return {
      key,
      warehouseId: src.warehouseId,
      supplierId: src.supplierId,
      basePrice, // Exporting basePrice for the UI
      unitPrice,
      availableStockAtSource,
      rowTotal
    };
  });

  const customer = customers.find(c => c.id === order.customerId);
  const totalCreditLimit = customer?.availableCredit || 0;

  const spentByOtherOrders = orders
    .filter(o => o.customerId === order.customerId && o.id !== order.id)
    .reduce((totalSpent, o) => {
      const oMultiplier = mockPriceTiers[o.type].multiplier;
      const orderCost = o.allocations.reduce((sum, a) => {
        const rule = mockPricingRules.find(p => p.itemId === o.itemId && p.supplierId === a.supplierId);
        if (!rule) return sum;
        const price = bankersRound(rule.basePrice * oMultiplier);
        return sum + (price * a.quantity);
      }, 0);
      return totalSpent + orderCost;
    }, 0);

  const liveRemainingCredit = totalCreditLimit - spentByOtherOrders - runningLineTotal;
  const isCreditExceeded = liveRemainingCredit < 0;

  const isRequestedExceeded = totalDraftAllocated > order.requestQuantity;
  const isBlocked = sourceStockExceeded || isCreditExceeded || isRequestedExceeded;

  const handleSave = () => {
    if (isBlocked) return;

    const finalAllocations: AllocationRecord[] = Object.entries(draftQuantities)
      .filter(([_, qty]) => qty !== '' && qty > 0)
      .map(([key, qty]) => {
        const [wh, sp] = key.split('|');
        return { warehouseId: wh, supplierId: sp, quantity: qty as number };
      });

    updateManualAllocation(order.id, finalAllocations);
    onClose();
  };

  return (
    <div className="p-4 bg-slate-100 border-x border-b shadow-inner grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-b-md">
      
      {/* Ledger Table: Columns 1 to 7 */}
      <div className="lg:col-span-7 bg-white p-4 rounded border border-slate-200 space-y-3">
        <div className="flex justify-between items-center border-b pb-2">
          <p className="text-xs font-bold text-slate-500 uppercase">Fulfillment Split Ledger</p>
          <span className={`text-xs font-semibold ${isRequestedExceeded ? 'text-red-600' : 'text-slate-600'}`}>
            Total Allocated: {totalDraftAllocated} / {order.requestQuantity}
          </span>
        </div>
        
        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
          {sourceRowsData.map(row => (
            <div key={row.key} className="grid grid-cols-12 gap-2 items-center text-sm border-b pb-2 last:border-0 last:pb-0">
              <div className="col-span-5 flex flex-col">
                <span className="font-semibold text-slate-700">{row.warehouseId} / {row.supplierId}</span>
                <span className="text-xs text-slate-400">Available: {row.availableStockAtSource} units</span>
              </div>
              {/* UPDATED: Unit Price Column with Base & Multiplier */}
              <div className="col-span-3 flex flex-col items-end justify-center pr-2">
                <span className="font-mono text-xs font-semibold text-slate-700">฿{row.unitPrice.toFixed(2)} /u</span>
                <span className="font-mono text-[10px] text-slate-400 leading-tight mt-0.5">
                  Base: ฿{row.basePrice.toFixed(2)} &times; {multiplier}
                </span>
              </div>
              <div className="col-span-2">
                <Input 
                  type="number"
                  min={0}
                  value={draftQuantities[row.key] ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDraftQuantities(prev => ({
                      ...prev,
                      [row.key]: val === '' ? '' : parseInt(val, 10)
                    }));
                  }}
                  className={`h-8 text-center px-1 bg-white font-mono text-xs ${stockExceededTracker[row.key] ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
              </div>
              <div className="col-span-2 text-right font-mono font-semibold text-xs text-slate-600">
                ฿{row.rowTotal.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        {isRequestedExceeded && <p className="text-xs text-red-600 mt-1 font-semibold">Total allocations cannot exceed requested quantity ({order.requestQuantity}).</p>}
        {sourceStockExceeded && <p className="text-xs text-red-600 mt-1 font-semibold">One or more sources exceed local physical capacity constraints.</p>}
      </div>

      {/* Credit Pool & Actions Viewports: Columns 8 to 12 */}
      <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
        <div className="bg-white p-3 rounded border border-slate-200 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase border-b pb-1">Live Financial Exposure</p>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total Credit Limit:</span>
            <span>฿{totalCreditLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Other Orders Cost:</span>
            <span className="text-slate-700">- ฿{spentByOtherOrders.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">This Order Ledger Total:</span>
            <span className="text-red-500 font-bold">- ฿{runningLineTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t pt-1">
            <span>Remaining Runway:</span>
            <span className={isCreditExceeded ? 'text-red-600' : 'text-emerald-600'}>
              ฿{liveRemainingCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}><X className="w-4 h-4 mr-1"/> Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={isBlocked} className="bg-slate-900 text-white">
            <Save className="w-4 h-4 mr-1"/> Save Splits
          </Button>
        </div>
      </div>

    </div>
  );
}

// --- MAIN QUEUE CONTAINER ---
export function OrderTable() {
  const { orders, customers, getLiveRemainingCredit } = useAllocationStore();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (orderId: string) => {
    setExpandedRow(prev => prev === orderId ? null : orderId);
  };

  const getPriorityBadge = (type: OrderPriority) => {
    switch (type) {
      case 'EMERGENCY': return 'destructive';
      case 'OVER_DUE': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <TooltipProvider>
      <div className="rounded-md border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 whitespace-nowrap">
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Item</TableHead> 
              <TableHead>Customer</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Assigned Matrix</TableHead>
              <TableHead className="text-right">Req.</TableHead>
              <TableHead className="text-right">Total Allocated</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const liveCredit = getLiveRemainingCredit(order.customerId);
              const customer = customers.find(c => c.id === order.customerId);
              const creditPercent = customer ? Math.max(0, (liveCredit / customer.availableCredit) * 100) : 0;
              
              const totalAllocatedUnits = order.allocations.reduce((sum, a) => sum + a.quantity, 0);

              const isFull = totalAllocatedUnits === order.requestQuantity;
              const isPartial = totalAllocatedUnits > 0 && totalAllocatedUnits < order.requestQuantity;
              const isBlocked = totalAllocatedUnits === 0;

              return (
                <React.Fragment key={order.id}>
                  <TableRow 
                    className={`cursor-pointer transition-colors ${expandedRow === order.id ? 'bg-blue-50/50 hover:bg-blue-50/50' : 'hover:bg-slate-50'}`}
                    onClick={() => toggleRow(order.id)}
                  >
                    <TableCell>
                      {expandedRow === order.id ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">{order.id}</TableCell>
                    
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                        {order.itemId}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1 w-24">
                        <span className="text-xs font-semibold">{order.customerId}</span>
                        <Progress value={creditPercent} className="h-1.5" />
                      </div>
                    </TableCell>

                    <TableCell><Badge variant={getPriorityBadge(order.type)}>{order.type}</Badge></TableCell>
                    <TableCell className="text-xs text-slate-500">{new Date(order.createDate).toLocaleDateString()}</TableCell>
                    
                    <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">
                      {isBlocked ? (
                        <span className="text-slate-400 italic">None Assigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {order.allocations.map((a, i) => (
                            <span key={i} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono text-[11px]">
                              {a.warehouseId}({a.quantity})
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="text-right font-medium">{order.requestQuantity}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-slate-700">{totalAllocatedUnits}</TableCell>

                    <TableCell className="text-center">
                      {isFull && <Badge className="bg-emerald-100 text-emerald-800 border-none shadow-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Full</Badge>}
                      
                      {isPartial && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 cursor-help">
                              <PieChart className="w-3 h-3 mr-1" /> Partial
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={5} className="z-[9999] bg-slate-900 text-white">
                            <p>Split fulfilled across multiple physical channels.</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      
                      {isBlocked && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="destructive" className="cursor-help">
                              <XCircle className="w-3 h-3 mr-1" /> Blocked
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={5} className="z-[9999] bg-red-900 text-white border-none shadow-lg">
                            <p className="font-semibold">Allocation blocked by stock or credit limits.</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>

                  {expandedRow === order.id && (
                    <TableRow className="hover:bg-transparent border-none">
                      <TableCell colSpan={10} className="p-0 border-none">
                        <AllocationDetailPanel order={order} onClose={() => setExpandedRow(null)} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}