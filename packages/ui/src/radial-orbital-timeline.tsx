"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ArrowRight, Link } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardHeader } from "./card";

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  status: "completed" | "in-progress" | "pending";
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
    {},
  );
  const viewMode = "orbital" as const;
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const centerOffset = useMemo(() => ({ x: 0, y: 0 }), []);
  const [containerSize, setContainerSize] = useState<{
    width: number;
    height: number;
  }>({
    width: 0,
    height: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const targetAngleRef = useRef<number | null>(null);
  const isAnimatingToTargetRef = useRef<boolean>(false);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (!prev[id]) {
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setAutoRotate(true);
        setPulseEffect({});
      }

      return newState;
    });
  };

  // Обновление размера контейнера
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Плавная анимация с requestAnimationFrame
  useEffect(() => {
    if (viewMode === "orbital") {
      const animate = (currentTime: number) => {
        if (lastTimeRef.current === 0) {
          lastTimeRef.current = currentTime;
        }

        const deltaTime = currentTime - lastTimeRef.current;
        lastTimeRef.current = currentTime;

        setRotationAngle((prev) => {
          // Если есть целевой угол для плавного перехода
          if (
            targetAngleRef.current !== null &&
            isAnimatingToTargetRef.current
          ) {
            const target = targetAngleRef.current;
            let diff = target - prev;

            // Нормализуем разницу в диапазон [-180, 180] для кратчайшего пути
            if (diff > 180) diff -= 360;
            if (diff < -180) diff += 360;

            // Скорость анимации к целевому углу (0.08 = плавно, 0.2 = быстрее)
            // Меньше значение = медленнее и плавнее переход
            const transitionSpeed = 0.08;
            const step = diff * Math.min(1, deltaTime * transitionSpeed);

            // Если мы достаточно близко к целевому углу, завершаем анимацию
            if (Math.abs(diff) < 0.1) {
              isAnimatingToTargetRef.current = false;
              targetAngleRef.current = null;
              return target;
            }

            return (prev + step + 360) % 360;
          }

          // Обычное вращение, если включен autoRotate
          if (autoRotate) {
            // Скорость вращения: уменьшите значение для более медленного вращения
            // Текущее значение: 0.01 (градусов за миллисекунду)
            // Рекомендуемый диапазон: 0.01 (очень медленно) - 0.1 (быстро)
            const rotationSpeed = 0.01;
            return (prev + deltaTime * rotationSpeed) % 360;
          }

          return prev;
        });

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimeRef.current = 0;
    };
  }, [autoRotate, viewMode]);

  // Вычисляем адаптивный радиус на основе размера контейнера
  const radius = useMemo(() => {
    if (containerSize.width === 0 || containerSize.height === 0) {
      return 300; // Значение по умолчанию
    }
    // На мобильных устройствах используем меньший процент и минимальный радиус
    const isMobile = containerSize.width < 768;
    const percentage = isMobile ? 0.3 : 0.45;
    const minRadius = isMobile ? 110 : 250;
    // Ограничиваем радиус, чтобы он не превышал половину ширины контейнера (с небольшим запасом)
    const calculatedRadius =
      Math.min(containerSize.width, containerSize.height) * percentage;
    const cap = containerSize.width / 2 - 8;
    return Math.max(minRadius, Math.min(calculatedRadius, cap));
  }, [containerSize]);

  // Эффективный диаметр орбиты с учётом фактической ширины контейнера
  const orbitDiameter = useMemo(() => {
    if (containerSize.width === 0) return radius * 2;
    return Math.min(radius * 2, Math.max(0, containerSize.width - 8));
  }, [radius, containerSize.width]);

  const centerViewOnNode = useCallback(
    (nodeId: number) => {
      if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;

      const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
      const totalNodes = timelineData.length;
      const baseAngle = (nodeIndex / totalNodes) * 360;
      const targetAngle = (270 - baseAngle + 360) % 360;

      // Устанавливаем целевой угол для плавной анимации
      targetAngleRef.current = targetAngle;
      isAnimatingToTargetRef.current = true;
    },
    [viewMode, timelineData],
  );

  const calculateNodePosition = useCallback(
    (index: number, total: number, currentRadius: number) => {
      const angle = ((index / total) * 360 + rotationAngle) % 360;
      const radian = (angle * Math.PI) / 180;

      const x = currentRadius * Math.cos(radian) + centerOffset.x;
      const y = currentRadius * Math.sin(radian) + centerOffset.y;

      const zIndex = Math.round(100 + 50 * Math.cos(radian));
      const opacity = Math.max(
        0.4,
        Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2)),
      );

      return { x, y, angle, zIndex, opacity };
    },
    [rotationAngle, centerOffset],
  );

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  return (
    <div
      className="flex h-[100vw] w-full max-w-full flex-col items-center justify-center md:h-[80vh]"
      ref={containerRef}
      onClick={handleContainerClick}
      style={{ maxWidth: "100vw" }}
    >
      <div className="relative flex h-full w-full items-center justify-center">
        <div
          className="absolute flex h-full w-full items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: "1000px",
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
            willChange: "transform",
            maxWidth: "100%",
          }}
        >
          <div className="absolute z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-teal-500">
            <div className="absolute h-20 w-20 rounded-full border border-white/20"></div>
            <div
              className="absolute h-24 w-24 rounded-full border border-white/10"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-md"></div>
          </div>

          <div
            className="absolute rounded-full border border-white/10"
            style={{
              width: `${orbitDiameter}px`,
              height: `${orbitDiameter}px`,
            }}
          ></div>

          {timelineData.map((item, index) => {
            const effectiveRadius = Math.min(
              radius,
              (containerSize.width - 8) / 2,
            );
            const position = calculateNodePosition(
              index,
              timelineData.length,
              effectiveRadius,
            );
            const isExpanded = expandedItems[item.id];
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            const nodeStyle = {
              transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
              zIndex: isExpanded ? 200 : position.zIndex,
              willChange: isExpanded ? "transform, opacity" : "transform",
            };

            return (
              <div
                key={item.id}
                ref={(el) => (nodeRefs.current[item.id] = el)}
                className="absolute cursor-pointer transition-opacity transition-transform duration-300 ease-out"
                style={nodeStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                <div
                  className={`absolute -inset-1 rounded-full ${
                    isPulsing ? "duration-1000" : ""
                  }`}
                  style={{
                    background: `radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)`,
                    width: `${item.energy * 0.5 + 40}px`,
                    height: `${item.energy * 0.5 + 40}px`,
                    left: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                    top: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                  }}
                ></div>

                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full ${
                    isExpanded ? "bg-white text-black" : "bg-black text-white"
                  } border-2 ${
                    isExpanded
                      ? "border-white shadow-lg shadow-white/30"
                      : "border-white/40"
                  } transform transition-all duration-300 ${isExpanded ? "scale-150" : ""} `}
                >
                  <Icon size={20} />
                </div>

                <div
                  className={`absolute top-15 left-1/2 -translate-x-1/2 text-center text-[10px] font-semibold tracking-wider whitespace-nowrap transition-all duration-300 md:text-xs ${isExpanded ? "scale-125 text-black" : "text-black/70"} `}
                >
                  {item.title}
                </div>

                {isExpanded && (
                  <Card className="absolute top-20 left-1/2 w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-visible border-white/30 bg-black/90 shadow-xl shadow-white/10 backdrop-blur-lg sm:max-w-none">
                    <div className="absolute -top-3 left-1/2 h-3 w-px -translate-x-1/2 bg-white/50"></div>
                    <CardHeader className="pb-2"></CardHeader>
                    <CardContent className="text-xs text-white/80">
                      <p>{item.content}</p>

                      {item.relatedIds.length > 0 && (
                        <div className="mt-4 border-t border-white/10 pt-3">
                          <div className="mb-2 flex items-center">
                            <Link size={10} className="mr-1 text-white/70" />
                            <h4 className="text-xs font-medium tracking-wider text-white/70 uppercase">
                              Connected Nodes
                            </h4>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {item.relatedIds.map((relatedId) => {
                              const relatedItem = timelineData.find(
                                (i) => i.id === relatedId,
                              );
                              return (
                                <Button
                                  key={relatedId}
                                  variant="outline"
                                  size="sm"
                                  className="flex h-6 items-center rounded-none border-white/20 bg-transparent px-2 py-0 text-xs text-white/80 transition-all hover:bg-white/10 hover:text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(relatedId);
                                  }}
                                >
                                  {relatedItem?.title}
                                  <ArrowRight
                                    size={8}
                                    className="ml-1 text-white/60"
                                  />
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
