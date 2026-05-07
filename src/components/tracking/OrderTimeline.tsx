import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineStep {
  status: string;
  label: string;
  date?: string;
  description?: string;
  completed: boolean;
  current: boolean;
}

interface OrderTimelineProps {
  currentStatus: string;
  courierStatus?: string | null;
  createdAt: string;
  updatedAt: string;
  courierCreatedAt?: string | null;
  courierUpdatedAt?: string | null;
}

const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
const statusLabels: Record<string, string> = {
  pending: 'Order Placed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function OrderTimeline({
  currentStatus,
  courierStatus,
  createdAt,
  updatedAt,
  courierCreatedAt,
  courierUpdatedAt,
}: OrderTimelineProps) {
  const isCancelled = currentStatus === 'cancelled';
  const currentIndex = statusOrder.indexOf(currentStatus);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const steps: TimelineStep[] = statusOrder.map((status, index) => {
    let date: string | undefined;
    let description: string | undefined;

    if (status === 'pending') {
      date = formatDate(createdAt);
    } else if (status === 'shipped' && courierCreatedAt) {
      date = formatDate(courierCreatedAt);
      if (courierStatus) {
        description = `Courier status: ${courierStatus}`;
      }
    } else if (status === currentStatus && status !== 'pending') {
      date = formatDate(updatedAt);
    }

    return {
      status,
      label: statusLabels[status],
      date,
      description,
      completed: !isCancelled && index < currentIndex,
      current: !isCancelled && index === currentIndex,
    };
  });

  if (isCancelled) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
            <span className="text-destructive font-bold text-sm">✕</span>
          </div>
          <div>
            <p className="font-semibold text-destructive">Order Cancelled</p>
            <p className="text-sm text-muted-foreground">{formatDate(updatedAt)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map((step, index) => (
        <div key={step.status} className="flex gap-4">
          {/* Connector Line & Icon */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                step.completed
                  ? "bg-accent border-accent text-accent-foreground"
                  : step.current
                  ? "bg-accent/20 border-accent text-accent"
                  : "bg-muted border-border text-muted-foreground"
              )}
            >
              {step.completed ? (
                <Check className="h-4 w-4" />
              ) : (
                <Circle className={cn("h-3 w-3", step.current && "fill-current")} />
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-0.5 flex-1 min-h-[40px]",
                  step.completed ? "bg-accent" : "bg-border"
                )}
              />
            )}
          </div>

          {/* Content */}
          <div className="pb-8 pt-1">
            <p
              className={cn(
                "font-medium",
                step.completed || step.current
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </p>
            {step.date && (
              <p className="text-sm text-muted-foreground">{step.date}</p>
            )}
            {step.description && (
              <p className="text-sm text-accent mt-1">{step.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
