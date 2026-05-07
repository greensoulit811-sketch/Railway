import { useState, useEffect } from 'react';
import { ProductVariant } from '@/hooks/useVariants';
import { cn } from '@/lib/utils';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onSelect: (variant: ProductVariant) => void;
  onColorSelect?: (color: string | null) => void;
}

export function VariantSelector({ variants, selectedVariant, onSelect, onColorSelect }: VariantSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Extract unique sizes
  const sizes = [...new Set(variants.filter(v => v.size).map(v => v.size!))];

  // Extract unique colors (split comma-separated)
  const allColors = [...new Set(
    variants
      .filter(v => v.color)
      .flatMap(v => v.color!.split(',').map(c => c.trim()))
      .filter(Boolean)
  )];

  // Sync local state from selectedVariant on mount/change
  useEffect(() => {
    if (selectedVariant) {
      setSelectedSize(selectedVariant.size || null);
      // Pick first color from variant's color list
      if (selectedVariant.color) {
        const colors = selectedVariant.color.split(',').map(c => c.trim()).filter(Boolean);
        if (colors.length > 0 && !selectedColor) {
          setSelectedColor(colors[0]);
        }
      }
    }
  }, [selectedVariant]);

  // Find best matching variant for given size + color
  const findVariant = (size: string | null, color: string | null): ProductVariant | null => {
    // Try exact match (size + color)
    if (size && color) {
      const match = variants.find(v =>
        v.size === size &&
        v.color?.split(',').map(c => c.trim()).includes(color) &&
        v.is_active && v.stock > 0
      );
      if (match) return match;
    }

    // Try size only
    if (size) {
      const match = variants.find(v => v.size === size && v.is_active && v.stock > 0)
        || variants.find(v => v.size === size);
      if (match) return match;
    }

    // Try color only
    if (color) {
      const match = variants.find(v =>
        v.color?.split(',').map(c => c.trim()).includes(color) &&
        v.is_active && v.stock > 0
      ) || variants.find(v =>
        v.color?.split(',').map(c => c.trim()).includes(color)
      );
      if (match) return match;
    }

    return null;
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const variant = findVariant(size, selectedColor);
    if (variant) {
      onSelect(variant);
      // If new variant doesn't have the selected color, reset
      if (selectedColor) {
        const variantColors = variant.color?.split(',').map(c => c.trim()) || [];
        if (!variantColors.includes(selectedColor)) {
          setSelectedColor(variantColors.length > 0 ? variantColors[0] : null);
        }
      }
    }
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onColorSelect?.(color);
    const variant = findVariant(selectedSize, color);
    if (variant) {
      onSelect(variant);
      // Sync size if variant has a different size
      if (variant.size) {
        setSelectedSize(variant.size);
      }
    }
  };

  const isSizeAvailable = (size: string) =>
    variants.some(v => v.size === size && v.stock > 0 && v.is_active);

  const isColorAvailable = (color: string) =>
    variants.some(v =>
      v.color?.split(',').map(c => c.trim()).includes(color) &&
      v.stock > 0 && v.is_active &&
      (!selectedSize || v.size === selectedSize || !v.size)
    );

  // Get colors relevant to the current size selection
  const visibleColors = selectedSize
    ? [...new Set(
        variants
          .filter(v => v.size === selectedSize && v.color)
          .flatMap(v => v.color!.split(',').map(c => c.trim()))
          .filter(Boolean)
      )]
    : allColors;

  return (
    <div className="space-y-5">
      {/* Size Selector */}
      {sizes.length > 0 && (
        <div>
          <label className="text-sm font-semibold mb-3 block tracking-wide">
            Size
            {selectedSize && <span className="text-muted-foreground font-normal ml-1.5">({selectedSize})</span>}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {sizes.map((size) => {
              const available = isSizeAvailable(size);
              const isSelected = selectedSize === size;
              return (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  disabled={!available}
                  className={cn(
                    "min-w-[48px] h-11 px-5 rounded-full border-2 text-sm font-semibold transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : available
                      ? "border-border bg-background text-foreground hover:border-primary/60 hover:shadow-sm"
                      : "border-border/50 bg-muted/30 text-muted-foreground/50 cursor-not-allowed line-through"
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Selector */}
      {visibleColors.length > 0 && (
        <div>
          <label className="text-sm font-semibold mb-3 block tracking-wide">
            Color
            {selectedColor && <span className="text-muted-foreground font-normal ml-1.5">({selectedColor})</span>}
          </label>
          <div className="flex flex-wrap gap-2.5">
            {visibleColors.map((color) => {
              const available = isColorAvailable(color);
              const isSelected = selectedColor === color;
              return (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  disabled={!available}
                  title={color}
                  className={cn(
                    "min-w-[48px] h-11 px-5 rounded-full border-2 text-sm font-semibold transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : available
                      ? "border-border bg-background text-foreground hover:border-primary/60 hover:shadow-sm"
                      : "border-border/50 bg-muted/30 text-muted-foreground/50 cursor-not-allowed line-through"
                  )}
                >
                  {color}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
