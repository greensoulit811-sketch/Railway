import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSliderSlides } from '@/hooks/useShopData';
import { Button } from '@/components/ui/button';

export function HeroSlider() {
  const {
    data: slides = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useSliderSlides();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isStuck, setIsStuck] = useState(false);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!(isLoading || isFetching)) {
      setIsStuck(false);
      return;
    }
    const t = window.setTimeout(() => setIsStuck(true), 10000);
    return () => window.clearTimeout(t);
  }, [isLoading, isFetching]);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide, slides.length]);

  if (isError) {
    return (
      <section className="relative overflow-hidden bg-secondary aspect-[16/9] md:aspect-[16/6]">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6">
          <p className="text-muted-foreground">
            Couldn't load the slider. {error instanceof Error ? error.message : ''}
          </p>
          <Button className="btn-accent" onClick={() => refetch()}>Retry</Button>
        </div>
      </section>
    );
  }

  if (isLoading || isFetching) {
    return (
      <section className="relative overflow-hidden bg-secondary aspect-[16/9] md:aspect-[16/6]">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
          {isStuck && (
            <Button className="btn-accent" onClick={() => refetch()}>Loading too long — Retry</Button>
          )}
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section className="relative overflow-hidden bg-secondary aspect-[16/9] md:aspect-[16/6]">
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">No slides configured</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      {/* Slider */}
      <div className="relative overflow-hidden rounded-lg mx-2 md:mx-3">
        <div className="relative aspect-[16/9] md:aspect-[16/6]">
          {slides.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <Link
                key={slide.id}
                to={slide.cta_link}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.heading}
                  className="w-full h-full object-cover object-top rounded-lg"
                />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Dash Indicators */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 mb-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1 rounded-full transition-all duration-400 ${
                index === currentSlide
                  ? 'w-10 bg-foreground'
                  : 'w-6 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
