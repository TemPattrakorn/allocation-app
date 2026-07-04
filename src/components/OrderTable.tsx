import React, { useState } from 'react';
import { useAllocationStore } from '@/store/useAllocationStore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, PieChart, XCircle, ChevronDown, ChevronRight} from 'lucide-react';
import type { OrderPriority } from '@/types';
import { AllocationDetailPanel } from './AllocationDetailPanel';

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
                      <div className="flex flex-col w-32">
                        <span className="text-xs font-semibold text-slate-900">{order.customerId}</span>
                        <span className="text-[10px] font-mono text-slate-500 mt-0.5" title="Remaining / Total Limit">
                          ฿{liveCredit.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ฿{customer?.availableCredit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
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