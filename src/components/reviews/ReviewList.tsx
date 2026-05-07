import { Star } from 'lucide-react';
import { ProductReview } from '@/hooks/useProductReviews';
import { cn } from '@/lib/utils';

interface ReviewListProps {
  reviews: ProductReview[];
}

export function ReviewList({ reviews }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No reviews yet. Be the first to review this product!
      </p>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="border-b border-border pb-6 last:border-b-0"
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{review.name}</span>
                {review.verified_purchase && (
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                    Verified Purchase
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "h-4 w-4",
                      star <= review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                ))}
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatDate(review.created_at)}
            </span>
          </div>
          <p className="text-muted-foreground">{review.text}</p>
        </div>
      ))}
    </div>
  );
}
