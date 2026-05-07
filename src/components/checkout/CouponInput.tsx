import { useState } from 'react';
import { Tag, Loader2, X, Check } from 'lucide-react';
import { useValidateCoupon, Coupon } from '@/hooks/useCoupons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

interface CouponInputProps {
  subtotal: number;
  onApply: (coupon: Coupon, discountAmount: number) => void;
  onRemove: () => void;
  appliedCoupon: Coupon | null;
  discountAmount: number;
}

export function CouponInput({
  subtotal,
  onApply,
  onRemove,
  appliedCoupon,
  discountAmount,
}: CouponInputProps) {
  const [code, setCode] = useState('');
  const { t, formatCurrency } = useSiteSettings();
  const validateCoupon = useValidateCoupon();

  const handleApply = async () => {
    if (!code.trim()) return;

    try {
      const result = await validateCoupon.mutateAsync({ code: code.trim(), subtotal });
      onApply(result.coupon, result.discountAmount);
      setCode('');
    } catch (error: any) {
      // Error message is shown via the mutation's error state
    }
  };

  if (appliedCoupon) {
    return (
      <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">{appliedCoupon.code}</span>
          </div>
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Remove coupon"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-accent mt-1">
          -{formatCurrency(discountAmount)} {appliedCoupon.description && `(${appliedCoupon.description})`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('checkout.couponPlaceholder') || 'Enter coupon code'}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleApply}
          disabled={validateCoupon.isPending || !code.trim()}
        >
          {validateCoupon.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t('checkout.apply') || 'Apply'
          )}
        </Button>
      </div>
      {validateCoupon.isError && (
        <p className="text-sm text-destructive">
          {(validateCoupon.error as Error)?.message || 'Invalid coupon'}
        </p>
      )}
    </div>
  );
}
