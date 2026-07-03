import { useEffect } from 'react';
import { useAllocationStore } from '@/store/useAllocationStore';
import { OrderTable } from '@/components/OrderTable';
import { Button } from '@/components/ui/button';

function App() {
  const { runAutoAssign, orders } = useAllocationStore();

  // Trigger auto-assign on initial load
  useEffect(() => {
    runAutoAssign();
  }, [runAutoAssign]);

  // Calculate high-level metrics for the dashboard
  const totalRequested = orders.reduce((sum, o) => sum + o.requestQuantity, 0);
  const totalAllocated = orders.reduce((sum, o) => sum + o.allocatedQuantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header & Metrics */}
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Allocation Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Fulfillment Status: {totalAllocated} / {totalRequested} Units
            </p>
          </div>
          <Button onClick={runAutoAssign} variant="default">
            Run Auto-Assign
          </Button>
        </header>

        {/* Interactive Data Grid */}
        <OrderTable />
        
      </div>
    </div>
  );
}

export default App;