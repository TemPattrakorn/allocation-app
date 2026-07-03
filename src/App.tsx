import { useEffect } from 'react';
import { useAllocationStore } from './store/useAllocationStore';

function App() {
  const { runAutoAssign, orders } = useAllocationStore();

  // Triggered exactly once on page load to automatically assign stock
  useEffect(() => {
    runAutoAssign();
  }, [runAutoAssign]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-800">
            Salmon Allocation Interface
          </h1>
          <p className="text-slate-500 mt-2">
            Total Orders Processed: {orders.length}
          </p>
        </header>

        {/* Temporary Data Dump for Testing Phase 3 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-900 text-green-400 rounded overflow-auto h-96 text-xs">
            <h2 className="text-white mb-2 font-bold">Processed Orders</h2>
            <pre>{JSON.stringify(orders, null, 2)}</pre>
          </div>
          <div className="p-4 bg-gray-900 text-blue-400 rounded overflow-auto h-96 text-xs">
            <h2 className="text-white mb-2 font-bold">Remaining Inventory</h2>
            <pre>{JSON.stringify(useAllocationStore(state => state.inventory), null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;