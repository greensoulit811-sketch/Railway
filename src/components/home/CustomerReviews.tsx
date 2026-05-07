import { Star, Quote } from 'lucide-react';
import { useReviews } from '@/hooks/useShopData';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export function CustomerReviews() {
  const { data: reviews = [], isLoading } = useReviews();
  const { ref, isVisible } = useScrollReveal();

  if (isLoading || reviews.length === 0) return null;

  return (
    <section className="section-padding bg-primary text-primary-foreground" ref={ref}>
      <div className="container-shop">
        <div className={`text-center mb-12 reveal-base ${isVisible ? 'reveal-visible' : ''}`}>
          <h2 className="text-2xl md:text-3xl font-bold">What Our Customers Say</h2>
        </div>

        <Carousel
          opts={{ align: 'start', loop: true }}
          className={`w-full reveal-base ${isVisible ? 'reveal-visible' : ''}`}
        >
          <CarouselContent className="-ml-4">
            {reviews.map((review, index) => (
              <CarouselItem key={review.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="bg-primary-foreground/5 backdrop-blur-sm rounded-xl p-6 border border-primary-foreground/10 h-full flex flex-col">
                  <Quote className="h-8 w-8 text-accent mb-4 shrink-0" />
                  <p className="text-primary-foreground/90 mb-6 leading-relaxed flex-1">
                    "{review.text}"
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{review.name}</p>
                      <div className="flex gap-0.5 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'text-accent fill-accent'
                                : 'text-primary-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-primary-foreground/50">
                      {new Date(review.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-center gap-4 mt-8">
            <CarouselPrevious className="static translate-y-0 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20" />
            <CarouselNext className="static translate-y-0 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
