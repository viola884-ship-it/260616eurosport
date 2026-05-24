import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import type { Order } from '../App';

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  error: string | null;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  onRowClick: (displayId: string) => void;
  pagination: {
    page: number;
    total: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'new':
      return 'default';
    case 'confirmed':
      return 'secondary';
    case 'processing':
    case 'shipped':
      return 'outline';
    case 'completed':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function OrdersTable({
  orders,
  loading,
  error,
  sortColumn,
  sortDirection,
  onSort,
  onRowClick,
  pagination,
}: OrdersTableProps) {
  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const start = (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(pagination.page * pagination.pageSize, pagination.total);

  const columns = [
    { key: 'display_id', label: 'Order ID' },
    { key: 'customer_name', label: 'Customer' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created' },
    { key: 'item_count', label: 'Items' },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((col) => (
                  <TableHead key={col.key} className="px-4 py-3 text-left">
                    {col.label}
                  </TableHead>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {columns.map((col) => (
                    <TableCell key={col.key} className="px-4 py-3">
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border rounded-lg p-4 text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className="px-4 py-3 text-left cursor-pointer hover:bg-muted/50"
                  onClick={() => onSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortColumn === col.key && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.display_id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRowClick(order.display_id)}
                >
                  <TableCell className="px-4 py-3">{order.display_id}</TableCell>
                  <TableCell className="px-4 py-3">
                    {order.customer_name}
                    {order.customer_username && (
                      <span className="text-muted-foreground ml-1">
                        (@{order.customer_username})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span title={order.created_at}>
                      {formatRelativeTime(order.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">{order.item_count}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalPages > 0 ? `Showing ${start}-${end} of ${pagination.total}` : 'No results'}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => pagination.onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => pagination.onPageChange(pagination.page + 1)}
            disabled={pagination.page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}