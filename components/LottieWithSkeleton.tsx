'use client';

import React, { useState, memo } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';

import { LOTTIE_SKELETONS } from '@/lib/lottie-skeletons';

interface LottieWithSkeletonProps {
  src: string;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
  [key: string]: any;
}

const LottieWithSkeleton = memo(({ src, className, loop = true, autoplay = true, ...props }: LottieWithSkeletonProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const skeleton = LOTTIE_SKELETONS[src];

  return (
    <div className={cn('relative flex items-center justify-center overflow-hidden', className)}>
      {!isLoaded && skeleton && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-800/20 animate-pulse">
          <svg 
            viewBox={skeleton.viewBox} 
            className="w-full h-full text-zinc-700/50 fill-current"
            preserveAspectRatio="xMidYMid meet"
          >
            <path d={skeleton.d} />
          </svg>
        </div>
      )}
      {!isLoaded && !skeleton && (
        <div className="absolute inset-0 bg-zinc-800/20 animate-pulse rounded-full" />
      )}
      <DotLottieReact
        src={src}
        loop={loop}
        autoplay={autoplay}
        onLoad={() => setIsLoaded(true)}
        {...props}
        className={cn(
          'w-full h-full transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
});


LottieWithSkeleton.displayName = 'LottieWithSkeleton';

export default LottieWithSkeleton;
