// Performance optimizations for PhotoSearch AI

export class PerformanceManager {
  private static cache = new Map<string, unknown>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Image compression for thumbnails
  static async compressImage(
    file: File, 
    maxWidth: number = 400, 
    maxHeight: number = 400, 
    quality: number = 0.8
  ): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  // Debounced search function
  static debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  // Cached API calls
  static async cachedFetch<
    T extends (...args: unknown[]) => Promise<unknown>
  >(
    key: string,
    fetchFunction: T,
    ttl: number = this.CACHE_TTL
  ): Promise<Awaited<ReturnType<T>>> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    const data = await fetchFunction();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  // Batch processing with concurrency control
  static async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 3,
    delay: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(processor)
      );
      
      // Extract successful results
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        }
      });
      
      // Add delay between batches to prevent overwhelming APIs
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  }

  // Memory cleanup
  static cleanup() {
    // Clear old cache entries
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  // Virtual scrolling helper for large photo grids
  static calculateVisibleRange(
    scrollTop: number,
    containerHeight: number,
    itemHeight: number,
    totalItems: number,
    overscan: number = 5
  ) {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      totalItems - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return { startIndex, endIndex };
  }

  // Image lazy loading
  static createLazyLoader(threshold: number = 0.1) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      },
      { threshold }
    );

    return observer;
  }

  // Progressive image loading
  static async loadImageProgressively(
    lowQualitySrc: string,
    highQualitySrc: string,
    imgElement: HTMLImageElement
  ) {
    // Load low quality first
    imgElement.src = lowQualitySrc;
    imgElement.style.filter = 'blur(5px)';
    
    // Load high quality in background
    const highQualityImg = new Image();
    highQualityImg.onload = () => {
      imgElement.src = highQualitySrc;
      imgElement.style.filter = 'none';
      imgElement.style.transition = 'filter 0.3s ease';
    };
    highQualityImg.src = highQualitySrc;
  }
}