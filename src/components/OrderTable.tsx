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
import type { OrderPriority } from '@/types';

// --- SUB-COMPONENT: ZONE C (DETAIL PANEL) ---
function AllocationDetailPanel({ order, onClose }: { order: any; onClose: () => void }) {
  const { orders, customers, inventory, updateManualAllocation } = useAllocationStore();
  
  const [draftQty, setDraftQty] = useState<number | ''>(order.allocatedQuantity);
  const [draftSource, setDraftSource] = useState(`${order.warehouseId}|${order.supplierId}`);
  const [draftWH, draftSP] = draftSource.split('|');

  const numericQty = draftQty === '' ? 0 : draftQty;
  const validSources = inventory.filter(i => i.itemId === order.itemId);

  const selectedInventoryRecord = inventory.find(
    i => i.itemId === order.itemId && i.warehouseId === draftWH && i.supplierId === draftSP
  );
  const maxStockAtSource = selectedInventoryRecord?.stock || 0;

  const stockUsedByOtherOrders = orders
    .filter(o => o.itemId === order.itemId && o.warehouseId === draftWH && o.supplierId === draftSP && o.id !== order.id)
    .reduce((sum, o) => sum + o.allocatedQuantity, 0);

  const availableStockForThisOrder = maxStockAtSource - stockUsedByOtherOrders;
  const isStockExceeded = numericQty > availableStockForThisOrder;

  const rule = mockPricingRules.find(p => p.itemId === order.itemId && p.supplierId === draftSP);
  const basePrice = rule?.basePrice || 0;
  const multiplier = mockPriceTiers[order.type as OrderPriority].multiplier;
  
  const unitPrice = bankersRound(basePrice * multiplier);
  const draftLineTotal = bankersRound(unitPrice * numericQty);

  const customer = customers.find(c => c.id === order.customerId);
  const totalCreditLimit = customer?.availableCredit || 0;

  const spentByOtherOrders = orders
    .filter(o => o.customerId === order.customerId && o.id !== order.id)
    .reduce((sum, o) => {
      const oRule = mockPricingRules.find(p => p.itemId === o.itemId && p.supplierId === o.supplierId);
      const oMultiplier = mockPriceTiers[o.type as OrderPriority]?.multiplier || 1;
      const oPrice = bankersRound((oRule?.basePrice || 0) * oMultiplier);
      return sum + (oPrice * o.allocatedQuantity);
    }, 0);

  const liveRemainingCredit = totalCreditLimit - spentByOtherOrders - draftLineTotal;
  const isCreditExceeded = liveRemainingCredit < 0;

  const isBlocked = isStockExceeded || isCreditExceeded || numericQty > order.requestQuantity;

  const handleSave = () => {
    if (isBlocked) return;
    updateManualAllocation(order.id, numericQty, draftWH, draftSP);
    onClose();
  };

  return (
    <div className="p-4 bg-slate-100 border-x border-b shadow-inner grid grid-cols-1 md:grid-cols-3 gap-6 rounded-b-md">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase">Override Source (Live Stock)</label>
          <select 
            className="mt-1 flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm"
            value={draftSource}
            onChange={(e) => setDraftSource(e.target.value)}
          >
            {validSources.map(src => {
              const othersUsed = orders
                .filter(o => o.itemId === src.itemId && o.warehouseId === src.warehouseId && o.supplierId === src.supplierId && o.id !== order.id)
                .reduce((sum, o) => sum + o.allocatedQuantity, 0);
              const avail = src.stock - othersUsed;
              
              return (
                <option key={`${src.warehouseId}|${src.supplierId}`} value={`${src.warehouseId}|${src.supplierId}`}>
                  {src.warehouseId} / {src.supplierId} — {avail} avail
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 uppercase flex justify-between">
            Allocate Quantity
            <span className="text-slate-400">Max Req: {order.requestQuantity}</span>
          </label>
          <Input 
            type="number" 
            min={0} max={order.requestQuantity}
            value={draftQty}
            onChange={(e) => {
              const val = e.target.value;
              setDraftQty(val === '' ? '' : parseInt(val, 10));
            }}
            className={`mt-1 bg-white font-mono ${isStockExceeded ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
          />
          {isStockExceeded && <p className="text-xs text-red-600 mt-1 font-semibold">Exceeds available stock ({availableStockForThisOrder} max)</p>}
          {numericQty > order.requestQuantity && <p className="text-xs text-red-600 mt-1 font-semibold">Cannot exceed requested qty.</p>}
        </div>
      </div>

      <div className="bg-white p-3 rounded border border-slate-200 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase border-b pb-1">Price Breakdown</p>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Base Price:</span>
          <span>฿{basePrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Tier Adjust ({multiplier * 100}%):</span>
          <span>{multiplier > 1 ? '+' : '-'} ฿{Math.abs(basePrice - (basePrice * multiplier)).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold border-t pt-1">
          <span>Final Unit Price:</span>
          <span>฿{unitPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-500 mt-2">
          <span>Order Total:</span>
          <span className="font-mono">฿{draftLineTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-col justify-between">
        <div className="bg-white p-3 rounded border border-slate-200 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase border-b pb-1">Live Credit Validation</p>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Total Credit Limit:</span>
            <span>฿{totalCreditLimit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Used by Other Orders:</span>
            <span className="text-slate-700">- ฿{spentByOtherOrders.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Used by This Order:</span>
            <span className="text-red-500 font-bold">- ฿{draftLineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t pt-1">
            <span>Remaining Available:</span>
            <span className={isCreditExceeded ? 'text-red-600' : 'text-emerald-600'}>
              ฿{liveRemainingCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}><X className="w-4 h-4 mr-1"/> Cancel</Button>
          <Button onClick={handleSave} disabled={isBlocked} className="bg-slate-900 text-white">
            <Save className="w-4 h-4 mr-1"/> Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN TABLE ---
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
              <TableHead>Customer</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Source (WH/SP)</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Req.</TableHead>
              <TableHead className="text-right">Allocated</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const liveCredit = getLiveRemainingCredit(order.customerId);
              const customer = customers.find(c => c.id === order.customerId);
              
              const rule = mockPricingRules.find(p => p.itemId === order.itemId && p.supplierId === order.supplierId);
              const multiplier = mockPriceTiers[order.type].multiplier;
              const unitPrice = rule ? bankersRound(rule.basePrice * multiplier) : 0;
              const creditPercent = customer ? Math.max(0, (liveCredit / customer.availableCredit) * 100) : 0;
              
              const isFull = order.allocatedQuantity === order.requestQuantity;
              const isPartial = order.allocatedQuantity > 0 && order.allocatedQuantity < order.requestQuantity;
              const isBlocked = order.allocatedQuantity === 0;

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
                      <div className="flex flex-col gap-1 w-24">
                        <span className="text-xs font-semibold">{order.customerId}</span>
                        <Progress value={creditPercent} className="h-1.5" />
                      </div>
                    </TableCell>

                    <TableCell><Badge variant={getPriorityBadge(order.type)}>{order.type}</Badge></TableCell>
                    <TableCell className="text-xs text-slate-500">{new Date(order.createDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs whitespace-nowrap">{order.warehouseId} / {order.supplierId}</TableCell>
                    <TableCell className="text-right font-mono text-xs">฿{unitPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">{order.requestQuantity}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-slate-700">{order.allocatedQuantity}</TableCell>

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
                            <p>Partially fulfilled due to stock or credit limits.</p>
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