interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  domNodes: number;
  jsonSize: number;
  parseTime: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: Set<(metrics: PerformanceMetrics) => void> = new Set();

  startMeasure(name: string): void {
    performance.mark(`${name}-start`);
  }

  endMeasure(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    const duration = measure ? measure.duration : 0;
    
    // Clean up
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
    
    return duration;
  }

  measureMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1048576; // Convert to MB
    }
    return 0;
  }

  countDOMNodes(): number {
    return document.getElementsByTagName('*').length;
  }

  recordMetrics(name: string, metrics: Partial<PerformanceMetrics>): void {
    const current = this.metrics.get(name) || {
      renderTime: 0,
      memoryUsage: 0,
      domNodes: 0,
      jsonSize: 0,
      parseTime: 0,
    };
    
    const updated = { ...current, ...metrics };
    this.metrics.set(name, updated);
    
    // Notify observers
    this.observers.forEach(observer => observer(updated));
  }

  getMetrics(name: string): PerformanceMetrics | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  subscribe(observer: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  logMetrics(): void {
    console.group('Performance Metrics');
    this.metrics.forEach((metrics, name) => {
      console.log(`${name}:`, {
        ...metrics,
        renderTime: `${metrics.renderTime.toFixed(2)}ms`,
        memoryUsage: `${metrics.memoryUsage.toFixed(2)}MB`,
      });
    });
    console.groupEnd();
  }

  reset(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Web Vitals integration
export function measureWebVitals(): void {
  if ('PerformanceObserver' in window) {
    // Measure Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        console.log('LCP:', lastEntry.startTime);
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Measure First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        const processingStart = (entry as any).processingStart;
        if (typeof processingStart === 'number') {
          console.log('FID:', processingStart - entry.startTime);
        }
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Measure Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      console.log('CLS:', clsValue);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }
}