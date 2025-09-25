import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-[100px] h-[100px]'
};

export const Loader: React.FC<LoaderProps> = ({ 
  className,
  size = 'md',
  color = '#000000'
}) => {
  const loaderItems = Array.from({ length: 9 }, (_, index) => index);

  return (
    <div className={cn("relative", sizeMap[size], className)}>
      <div 
        className="absolute inset-0 transform"
        style={{
          transform: 'rotateX(45deg) rotateZ(45deg)',
          transformStyle: 'preserve-3d'
        }}
      >
        {loaderItems.map((index) => (
          <div
            key={index}
            className="absolute inset-0 animate-loader-item"
            style={{
              backgroundColor: `color-mix(in srgb, ${color} ${100 - index * 4}%, white)`,
              animationDelay: `${index * 0.5}s`,
              animationDuration: '3s',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Loader;
