import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import type { Order } from '../App';

interface OrderDetailDialogProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
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

export function OrderDetailDialog({ order, open, onClose }: OrderDetailDialogProps) {
  if (!order) return null;

  const initials = order.customer?.name
    ? order.customer.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Order {order.display_id}
          </DialogTitle>
          <DialogDescription>
            Order details and status history
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{order.customer?.name || order.customer_name}</div>
                  {order.customer?.username && (
                    <div className="text-sm text-muted-foreground">@{order.customer.username}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusBadgeVariant(order.status)} className="text-base">
                {order.status}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Product Links</CardTitle>
            </CardHeader>
            <CardContent>
              {order.items && order.items.length > 0 ? (
                <ul className="space-y-1">
                  {order.items.map((item, index) => (
                    <li key={index}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {item.link}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted-foreground">No items</div>
              )}
            </CardContent>
          </Card>

          {order.specs && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{order.specs}</div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Status History</CardTitle>
            </CardHeader>
            <CardContent>
              {order.transitions && order.transitions.length > 0 ? (
                <ul className="space-y-2">
                  {order.transitions.map((t, index) => (
                    <li key={index} className="flex justify-between items-center text-sm">
                      <span>
                        <Badge variant="outline" className="mr-2">
                          {t.from_status || 'created'} → {t.to_status}
                        </Badge>
                      </span>
                      <span className="text-muted-foreground">
                        {t.changed_by} • {formatRelativeTime(t.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted-foreground">No transitions</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {new Date(order.created_at).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}