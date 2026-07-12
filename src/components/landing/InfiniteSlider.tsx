import React, { useRef } from 'react'

type InfiniteSliderProps = {
  children: React.ReactNode
  className?: string
  direction?: 'horizontal' | 'vertical'
  duration?: number
  gap?: number
  reverse?: boolean
}

export function InfiniteSlider({
  children,
  className = '',
  direction = 'horizontal',
  duration = 30,
  gap = 20,
  reverse = false,
}: InfiniteSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      ref={containerRef}
    >
      <div
        className="flex w-max items-center"
        style={{
          gap: `${gap}px`,
          flexDirection: direction === 'horizontal' ? 'row' : 'column',
          animation: `infinite-marquee-${reverse ? 'reverse' : 'forward'} ${duration}s linear infinite`,
          willChange: 'transform',
        }}
      >
        {children}
        {children}
      </div>

      <style>{`
        @keyframes infinite-marquee-forward {
          0% {
            transform: ${direction === 'horizontal' ? 'translateX(0%)' : 'translateY(0%)'};
          }
          100% {
            transform: ${
              direction === 'horizontal' ? `translateX(calc(-50% - ${gap / 2}px))` : `translateY(calc(-50% - ${gap / 2}px))`
            };
          }
        }
        @keyframes infinite-marquee-reverse {
          0% {
            transform: ${
              direction === 'horizontal' ? `translateX(calc(-50% - ${gap / 2}px))` : `translateY(calc(-50% - ${gap / 2}px))`
            };
          }
          100% {
            transform: ${direction === 'horizontal' ? 'translateX(0%)' : 'translateY(0%)'};
          }
        }
      `}</style>
    </div>
  )
}
