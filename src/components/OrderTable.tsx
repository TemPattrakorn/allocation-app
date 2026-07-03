import { useAllocationStore } from '../store/useAllocationStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import type { OrderPriority } from '../types';

export function OrderTable() {
  const { orders, updateAllocation } = useAllocationStore();

  const getBadgeVariant = (type: OrderPriority) => {
    switch (type) {
      case 'EMERGENCY': return 'destructive'; // Red
      case 'OVER_DUE': return 'secondary';    // Gray/Yellowish
      case 'DAILY': return 'outline';         // Transparent/Simple
      default: return 'default';
    }
  };

  const handleInputChange = (orderId: string, value: string, maxRequest: number) => {
    const numValue = parseInt(value, 10);
    // Prevent NaN, negative numbers, and allocating more than requested
    if (isNaN(numValue) || numValue < 0) {
      updateAllocation(orderId, 0);
    } else if (numValue > maxRequest) {
      updateAllocation(orderId, maxRequest);
    } else {
      updateAllocation(orderId, numValue);
    }
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Routing (WH / SP)</TableHead>
            <TableHead className="text-right">Requested</TableHead>
            <TableHead className="text-right w-[150px]">Allocated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.id}</TableCell>
              <TableCell>
                <Badge variant={getBadgeVariant(order.type)}>
                  {order.type}
                </Badge>
              </TableCell>
              <TableCell>{order.itemId}</TableCell>
              <TableCell className="text-slate-500 text-xs">
                {order.warehouseId} / {order.supplierId}
              </TableCell>
              <TableCell className="text-right">{order.requestQuantity}</TableCell>
              <TableCell className="text-right">
                <Input
                  type="number"
                  min={0}
                  max={order.requestQuantity}
                  value={order.allocatedQuantity || ''}
                  onChange={(e) => 
                    handleInputChange(order.id, e.target.value, order.requestQuantity)
                  }
                  className="h-8 w-24 text-right ml-auto"
                />
              </TableCell>
            </TableRow>
          ))}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}