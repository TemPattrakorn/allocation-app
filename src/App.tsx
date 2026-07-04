import { useEffect } from 'react';
import { useAllocationStore } from '@/store/useAllocationStore';
import { OrderTable } from '@/components/OrderTable';
import { Button } from '@/components/ui/button';
import { mockInventory } from '@/data/mockData';

function App() {
  const { runAutoAssign, resetAllocations, orders } = useAllocationStore();

  useEffect(() => {
    runAutoAssign();
  }, [runAutoAssign]);

  // --- Dashboard Metrics Engine ---
  const totalRequested = orders.reduce((sum, o) => sum + o.requestQuantity, 0);
  
  // Calculate total allocated by summing up every split record in every order
  const totalAllocated = orders.reduce((sum, o) => {
    const orderTotal = o.allocations.reduce((acc, a) => acc + a.quantity, 0);
    return sum + orderTotal;
  }, 0);

  const maxSystemStock = mockInventory.reduce((sum, i) => sum + i.stock, 0);
  
  // Determine queue status counts based on split totals
  const fullCount = orders.filter(o => {
    const qty = o.allocations.reduce((acc, a) => acc + a.quantity, 0);
    return qty === o.requestQuantity;
  }).length;

  const partialCount = orders.filter(o => {
    const qty = o.allocations.reduce((acc, a) => acc + a.quantity, 0);
    return qty > 0 && qty < o.requestQuantity;
  }).length;

  const blockedCount = orders.filter(o => {
    const qty = o.allocations.reduce((acc, a) => acc + a.quantity, 0);
    return qty === 0;
  }).length;

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ZONE A: Capacity Summary Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Allocation Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Live multi-source fulfillment capacity and queue management.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetAllocations}>Clear Allocations</Button>
            <Button onClick={runAutoAssign} className="bg-slate-900 text-white hover:bg-slate-800 shadow-md">
              Auto-Allocation
            </Button>
          </div>
        </header>

        {/* ZONE A: Live KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Stock Utilization</p>
            <p className="text-2xl font-bold mt-1 text-slate-800">{totalAllocated} / {maxSystemStock}</p>
            <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-500 ease-out" 
                style={{ width: `${Math.min(100, (totalAllocated / maxSystemStock) * 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 font-semibold uppercase">Fulfillment Rate (Units)</p>
            <p className="text-2xl font-bold mt-1 text-slate-800">
              {totalRequested > 0 ? ((totalAllocated / totalRequested) * 100).toFixed(1) : '0.0'}%
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Orders by Status</p>
              <div className="flex gap-3 text-sm mt-2">
                <span className="text-emerald-600 font-medium px-2 py-1 bg-emerald-50 rounded-md">{fullCount} Full</span>
                <span className="text-amber-600 font-medium px-2 py-1 bg-amber-50 rounded-md">{partialCount} Partial</span>
                <span className="text-red-600 font-medium px-2 py-1 bg-red-50 rounded-md">{blockedCount} Blocked</span>
              </div>
            </div>
          </div>
        </div>

        {/* ZONE B & C: Order Queue & Editor */}
        <OrderTable />
        
      </div>
    </div>
  );
}

export default App;