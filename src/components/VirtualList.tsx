import React, { useState, useEffect, useRef, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight?: string | number;
  buffer?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight = '100%',
  buffer = 3,
  className = ''
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [clientHeight, setClientHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Set initial client height
    setClientHeight(el.clientHeight || 600);

    const handleScroll = () => {
      setScrollTop(el.scrollTop);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setClientHeight(entry.contentRect.height || el.clientHeight || 600);
      }
    });

    el.addEventListener('scroll', handleScroll, { passive: true });
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  const totalHeight = items.length * itemHeight;

  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const end = Math.min(items.length, Math.ceil((scrollTop + clientHeight) / itemHeight) + buffer);
    return { startIndex: start, endIndex: end };
  }, [scrollTop, itemHeight, clientHeight, items.length, buffer]);

  const visibleItems = useMemo(() => {
    const rendered: React.ReactNode[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      rendered.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            top: i * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight,
            overflow: 'hidden'
          }}
        >
          {renderItem(items[i], i)}
        </div>
      );
    }
    return rendered;
  }, [items, startIndex, endIndex, itemHeight, renderItem]);

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto relative ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, width: '100%', position: 'relative' }}>
        {visibleItems}
      </div>
    </div>
  );
}
