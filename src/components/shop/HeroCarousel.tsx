"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useCallback, useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

export function HeroCarousel() {
  // ✅ fetches from DB — admin changes reflect immediately
  const { data: slides = [], isLoading } = api.slides.list.useQuery();

  const autoplay = useRef(
    Autoplay({ delay: 4500, stopOnInteraction: false })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [autoplay.current]
  );
  const [selected, setSelected] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo   = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi]
  );

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () =>
      setSelected(emblaApi.selectedScrollSnap())
    );
  }, [emblaApi]);

  // Reset to first slide if slides change (admin added/removed)
  useEffect(() => {
    setSelected(0);
    emblaApi?.scrollTo(0);
  }, [slides.length]);

  if (isLoading) {
    return <Skeleton className="mx-4 mt-4 h-64 rounded-2xl" />;
  }

  if (slides.length === 0) return null;

  return (
    <div className="relative mx-4 mt-4 overflow-hidden rounded-2xl">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="relative min-w-0 flex-[0_0_100%]"
              style={{ minHeight: 260 }}
            >
              {/* Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a0500] via-[#3d0d00] to-[#1a0500]">
                {slide.image && slide.image.includes("utfs.io") && (
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-cover opacity-50"
                    priority
                  />
                )}
                {/* Decorative sparks */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="animate-pulse absolute right-[38%] top-[15%] h-20 w-20 rounded-full bg-orange-500/20" />
                  <div
                    className="animate-pulse absolute right-[30%] top-[55%] h-12 w-12 rounded-full bg-yellow-400/20"
                    style={{ animationDelay: "0.7s" }}
                  />
                  <div
                    className="animate-pulse absolute bottom-[-10px] left-[40%] h-28 w-28 rounded-full bg-red-500/15"
                    style={{ animationDelay: "1.2s" }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 flex h-full min-h-[260px] items-center gap-6 px-10 py-10">
                <div className="flex-1">
                  {slide.badge && (
                    <div className="mb-3 inline-block rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[2px] text-yellow-400">
                      ✦ {slide.badge}
                    </div>
                  )}
                  <h1 className="mb-1 font-serif text-3xl font-black leading-tight text-white">
                    {slide.title}
                  </h1>
                  <h2 className="mb-4 font-serif text-3xl font-black leading-tight text-yellow-300">
                    {slide.subtitle}
                  </h2>
                  <p className="mb-6 max-w-xs text-sm leading-relaxed text-white/50">
                    Light up your festivities with our premium collection of
                    safe, vibrant crackers. Make this Diwali unforgettable.
                  </p>
                  <div className="flex gap-3">
                    <Link href={slide.ctaLink}>
                      <Button className="rounded-lg bg-[#D4380D] text-white hover:bg-[#b82e08]">
                        {slide.ctaText}
                      </Button>
                    </Link>
                    <Link href="/products">
                      <Button
                        variant="outline"
                        className="rounded-lg border-white/20 text-white/70 hover:bg-white/10"
                      >
                        Price List
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Right decorative firework */}
                <div className="relative hidden h-44 w-56 shrink-0 overflow-hidden rounded-2xl md:block">
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-900/60 to-red-950/80">
                    <svg viewBox="0 0 120 120" className="h-28 w-28">
                      <g opacity="0.9">
                        {[0,45,90,135,180,225,270,315,22,67,112,157].map(
                          (deg, i) => (
                            <line
                              key={i}
                              x1="60" y1="60"
                              x2={60 + 40 * Math.cos((deg * Math.PI) / 180)}
                              y2={60 + 40 * Math.sin((deg * Math.PI) / 180)}
                              stroke={
                                i % 3 === 0
                                  ? "#FFD700"
                                  : i % 3 === 1
                                  ? "#FF6600"
                                  : "#fff"
                              }
                              strokeWidth={i < 8 ? 2.5 : 1.5}
                              strokeLinecap="round"
                              opacity={i < 8 ? 1 : 0.6}
                            />
                          )
                        )}
                        <circle cx="60" cy="60" r="6" fill="#FFD700" />
                        <circle cx="60" cy="60" r="3" fill="#fff" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white hover:bg-black/50"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/30 p-1.5 text-white hover:bg-black/50"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === selected
                    ? "w-5 bg-yellow-400"
                    : "w-1.5 bg-white/40"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}