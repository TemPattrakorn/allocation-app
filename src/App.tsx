import { useEffect } from 'react';
import { useAllocationStore } from '@/store/useAllocationStore';
import { OrderTable } from '@/components/OrderTable';
import { Button } from '@/components/ui/button';
import { mockInventory } from '@/data/mockData';

function App() {
  // Pull resetAllocations from the store
  const { runAutoAssign, resetAllocations, orders } = useAllocationStore();

  useEffect(() => {
    runAutoAssign();
  }, [runAutoAssign]);

  const totalRequested = orders.reduce((sum, o) => sum + o.requestQuantity, 0);
  const totalAllocated = orders.reduce((sum, o) => sum + o.allocatedQuantity, 0);
  const maxSystemStock = mockInventory.reduce((sum, i) => sum + i.stock, 0);
  
  const fullCount = orders.filter(o => o.allocatedQuantity === o.requestQuantity).length;
  const partialCount = orders.filter(o => o.allocatedQuantity > 0 && o.allocatedQuantity < o.requestQuantity).length;
  const blockedCount = orders.filter(o => o.allocatedQuantity === 0).length;

  return (
    <div className="min-h-screen bg-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ZONE A: Capacity Summary */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Allocation Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Live fulfillment capacity and queue management.</p>
          </div>
          <div className="flex gap-2">
            {/* Updated Button to call the store action instead of reloading */}
            <Button variant="outline" onClick={resetAllocations}>Clear Allocations</Button>
            <Button onClick={runAutoAssign} className="bg-slate-900 text-white hover:bg-slate-800">
              Run Auto-Allocation
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Stock Utilization</p>
            <p className="text-2xl font-bold mt-1 text-slate-800">{totalAllocated} / {maxSystemStock}</p>
            <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full" style={{ width: `${(totalAllocated / maxSystemStock) * 100}%` }}></div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-lg border shadow-sm">
            <p className="text-xs text-slate-500 font-semibold uppercase">Fulfillment Rate (Units)</p>
            <p className="text-2xl font-bold mt-1 text-slate-800">{((totalAllocated / totalRequested) * 100).toFixed(1)}%</p>
          </div>
          <div className="p-4 bg-white rounded-lg border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Orders by Status</p>
              <div className="flex gap-3 text-sm">
                <span className="text-emerald-600 font-medium">{fullCount} Full</span>
                <span className="text-amber-600 font-medium">{partialCount} Partial</span>
                <span className="text-red-600 font-medium">{blockedCount} Blocked</span>
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