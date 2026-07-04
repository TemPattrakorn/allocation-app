import { useAllocationStore } from '@/store/useAllocationStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, PieChart, XCircle, Info } from 'lucide-react';
import { mockPricingRules, mockPriceTiers } from '@/data/mockData';
import { bankersRound } from '@/utils/rounding';
import type { OrderPriority } from '@/types';

export function OrderTable() {
  const { 
    orders, 
    customers, 
    updateAllocation, 
    getLiveRemainingStock, 
    getLiveRemainingCredit 
  } = useAllocationStore();

  const getPriorityBadge = (type: OrderPriority) => {
    switch (type) {
      case 'EMERGENCY': return 'destructive'; // Red
      case 'OVER_DUE': return 'secondary';    // Orange/Gray
      default: return 'outline';              // Transparent/Daily
    }
  };

  const handleManualEdit = (order: any, value: string) => {
    const newQty = parseInt(value, 10) || 0;
    if (newQty < 0) return;

    const diff = newQty - order.allocatedQuantity;
    const availableStock = getLiveRemainingStock(order.itemId, order.warehouseId, order.supplierId);
    
    // Check if the user is trying to allocate more than allowed
    if (newQty <= order.requestQuantity && diff <= availableStock) {
      updateAllocation(order.id, newQty);
    }
  };

  return (
    <TooltipProvider>
      <div className="rounded-md border bg-white shadow-sm overflow-x-auto">
        <div className="p-4 bg-slate-50 border-b flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Info className="w-4 h-4" />
          Priority Sort: Emergency &gt; Overdue &gt; Daily (FIFO)
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 whitespace-nowrap">
              <TableHead>Order ID</TableHead>
              <TableHead>Customer / Credit</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Source (WH/SP)</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Req.</TableHead>
              <TableHead className="text-right w-[120px]">Allocated</TableHead>
              <TableHead className="text-right">Line Total</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              // --- Real-time Calculations ---
              const liveStock = getLiveRemainingStock(order.itemId, order.warehouseId, order.supplierId);
              const liveCredit = getLiveRemainingCredit(order.customerId);
              const customer = customers.find(c => c.id === order.customerId);
              
              // Pricing Math (Banker's Rounding)
              const rule = mockPricingRules.find(p => p.itemId === order.itemId && p.supplierId === order.supplierId);
              const multiplier = mockPriceTiers[order.type].multiplier;
              const unitPrice = rule ? bankersRound(rule.basePrice * multiplier) : 0;
              const lineTotal = bankersRound(unitPrice * order.allocatedQuantity);
              
              // Credit Gauge Math
              const creditPercent = customer ? Math.max(0, (liveCredit / customer.availableCredit) * 100) : 0;
              
              // Status & Block Reason Logic
              const isFull = order.allocatedQuantity === order.requestQuantity;
              const isPartial = order.allocatedQuantity > 0 && order.allocatedQuantity < order.requestQuantity;
              const isBlocked = order.allocatedQuantity === 0;
              
              let blockReason = "";
              if (!isFull) {
                if (liveStock <= 0) blockReason = `Stock exhausted at ${order.warehouseId}/${order.supplierId}`;
                else if (unitPrice > 0 && liveCredit < unitPrice) blockReason = `Credit limit reached. Available: ฿${liveCredit.toFixed(2)}`;
              }

              return (
                <TableRow key={order.id} className="hover:bg-slate-50 transition-colors">
                  <TableCell className="font-medium text-slate-900">{order.id}</TableCell>
                  
                  {/* Customer & Mini-Gauge */}
                  <TableCell>
                    <div className="flex flex-col gap-1 w-24">
                      <span className="text-xs font-semibold">{order.customerId}</span>
                      <Progress value={creditPercent} className="h-1.5" />
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={getPriorityBadge(order.type)}>{order.type}</Badge>
                  </TableCell>
                  
                  <TableCell className="text-xs text-slate-500">
                    {new Date(order.createDate).toLocaleDateString()}
                  </TableCell>
                  
                  <TableCell className="text-slate-500 font-mono text-xs whitespace-nowrap">
                    {order.warehouseId} / {order.supplierId}
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs">
                    ฿{unitPrice.toFixed(2)}
                  </TableCell>

                  <TableCell className="text-right font-medium">{order.requestQuantity}</TableCell>
                  
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      max={order.requestQuantity}
                      value={order.allocatedQuantity || ''}
                      onChange={(e) => handleManualEdit(order, e.target.value)}
                      className={`h-8 w-20 ml-auto text-right font-mono ${blockReason.includes('Stock') ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                  </TableCell>

                  <TableCell className="text-right font-mono text-sm font-semibold">
                    ฿{lineTotal.toFixed(2)}
                  </TableCell>

                  {/* Status Badge with Tooltip for Blocks */}
                  <TableCell className="text-center">
                    {isFull && (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none shadow-none gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Full
                      </Badge>
                    )}
                    {isPartial && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1 cursor-help">
                            <PieChart className="w-3 h-3" /> Partial
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent><p>{blockReason}</p></TooltipContent>
                      </Tooltip>
                    )}
                    {isBlocked && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="destructive" className="gap-1 cursor-help">
                            <XCircle className="w-3 h-3" /> Blocked
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="bg-red-900 text-white border-none">
                          <p className="font-semibold">{blockReason}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}