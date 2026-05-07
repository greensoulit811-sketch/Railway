import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function WishlistButton({ productId, className, size = 'md' }: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist, isLoading } = useWishlist();

  const isWished = isInWishlist(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId);
  };

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "flex items-center justify-center rounded-full transition-all",
        size === 'sm' ? 'w-8 h-8' : 'w-10 h-10',
        isWished
          ? "text-destructive"
          : "text-muted-foreground hover:text-destructive",
        className
      )}
      aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={cn(iconSize, isWished && "fill-current")}
      />
    </button>
  );
}
