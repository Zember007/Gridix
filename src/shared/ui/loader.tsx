import React from 'react';
import { cn } from '@/shared/lib/utils';

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
  const itemsCount = 9;
  const loaderItems = Array.from({ length: itemsCount }, (_, index) => index);

  // Настройка скорости
  const step = 0.5; // Интервал между пластинами (как у вас было)
  const duration = itemsCount * step; // 9 * 0.5 = 4.5s (Идеальный цикл)

  return (
    <div className={cn("relative", sizeMap[size], className)}>
      <div
        className="absolute inset-0 transform"
        style={{
          transform: 'rotateX(45deg) rotateZ(45deg)',
          transformStyle: 'preserve-3d'
        }}
      >

        <div
          className="absolute inset-0 "
          style={{
            backgroundColor: `color-mix(in srgb, ${color} ${100 - 7 * 4}%, white)`,
						transform: 'translate(0%, 0%)'
          }}
        />
        {loaderItems.map((index) => (
          <div
            key={index}
            className="absolute inset-0 animate-loader-item"
            style={{
              backgroundColor: `color-mix(in srgb, ${color} ${100 - 7 * 4}%, white)`,
              // Отрицательная задержка — ключевой момент для плавности
              animationDelay: `-${index * step}s`,
              animationDuration: `${duration}s`,
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