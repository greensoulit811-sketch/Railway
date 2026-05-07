import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { useCreateReview } from '@/hooks/useProductReviews';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  productId: string;
  productName: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, productName, onSuccess }: ReviewFormProps) {
  const createReview = useCreateReview();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState('');
  const [text, setText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      return;
    }

    await createReview.mutateAsync({
      product_id: productId,
      name,
      rating,
      text,
    });

    setRating(0);
    setName('');
    setText('');
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Rating for {productName}
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-colors"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  (hoverRating || rating) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Your Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-shop"
          placeholder="Enter your name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Your Review *</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-shop min-h-[100px]"
          placeholder="Share your experience with this product..."
          required
        />
      </div>

      <Button
        type="submit"
        className="btn-accent w-full"
        disabled={createReview.isPending || rating === 0}
      >
        {createReview.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : null}
        Submit Review
      </Button>
    </form>
  );
}
