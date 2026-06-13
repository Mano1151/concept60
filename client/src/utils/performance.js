// Performance optimization utility for Concept60
// Handles lazy loading, caching, and performance monitoring

// Cache configuration
const CACHE_CONFIG = {
  images: 3600000, // 1 hour in milliseconds
  api: 600000, // 10 minutes
  pages: 1800000, // 30 minutes
};

// Initialize performance monitoring
export function initPerformanceMonitoring() {
  // Report Core Web Vitals
  if ('web-vital' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
        }
      });

      observer.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
    } catch (e) {
      // Browser doesn't support this observer
    }
  }
}

// Defer non-critical CSS
export function deferNonCriticalStyles() {
  /*const links = document.querySelectorAll('link[rel="stylesheet"]');
  links.forEach((link) => {
    if (!link.hasAttribute('data-critical')) {
      link.media = 'print';
      link.addEventListener('load', function () {
        this.media = 'all';
      });
    }
  });*/
}

// Preload critical resources
export function preloadCriticalResources() {
  /*const criticalResources = [
    { rel: 'preload', as: 'font', href: '/fonts/main.woff2', crossorigin: '' },
    { rel: 'preload', as: 'script', href: '/js/critical.js' },
    { rel: 'prefetch', href: '/pages/trending' },
    { rel: 'prefetch', href: '/pages/categories' },
  ];*/

  criticalResources.forEach(({ rel, as, href, crossorigin }) => {
    const link = document.createElement('link');
    link.rel = rel;
    if (as) link.as = as;
    link.href = href;
    if (crossorigin !== undefined) link.crossOrigin = crossorigin;
    document.head.appendChild(link);
  });
}

// Image preloading with error handling
export function preloadImages(imageUrls) {
  imageUrls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}

// Implement request caching
export function setupRequestCache() {
  const cache = new Map();

  return function getCachedOrFetch(url, options = {}) {
    const cacheKey = `${url}${JSON.stringify(options)}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_CONFIG.api) {
      return Promise.resolve(cached.data);
    }

    return fetch(url, options)
      .then((response) => response.json())
      .then((data) => {
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      });
  };
}

// Compress and optimize data
export function compressData(data) {
  return JSON.stringify(data)
    .replace(/\s+/g, ' ')
    .trim();
}

// Implement IndexedDB for offline caching
export function setupOfflineCache() {
  if (!('indexedDB' in window)) {
    console.warn('IndexedDB not available');
    return null;
  }

  const dbName = 'concept60_cache';
  const storeName = 'cached_data';
  let db = null;

  const initDB = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  };

  const saveToCache = (key, data) => {
    if (!db) return Promise.reject(new Error('DB not initialized'));

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put({ key, data, timestamp: Date.now() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  const getFromCache = (key) => {
    if (!db) return Promise.reject(new Error('DB not initialized'));

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('key');
      const request = index.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.data || null);
    });
  };

  initDB().catch((e) => console.warn('Failed to initialize IndexedDB:', e));

  return { saveToCache, getFromCache, initDB };
}

// Optimize DOM rendering
export function optimizeDOMRendering() {
  // Debounce scroll events
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      // Trigger lazy loading checks here
    }, 100);
  }, { passive: true });

  // Use requestAnimationFrame for animations
  if (!('requestAnimationFrame' in window)) {
    window.requestAnimationFrame = (callback) => setTimeout(callback, 1000 / 60);
  }
}

// Service Worker registration for caching
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registered'))
        .catch((err) => console.warn('Service Worker registration failed:', err));
    });
  }
}

// Initialize all optimizations
export function initAllOptimizations() {
  initPerformanceMonitoring();
  deferNonCriticalStyles();
  preloadCriticalResources();
  optimizeDOMRendering();
  registerServiceWorker();
}

export default {
  initPerformanceMonitoring,
  deferNonCriticalStyles,
  preloadCriticalResources,
  preloadImages,
  setupRequestCache,
  compressData,
  setupOfflineCache,
  optimizeDOMRendering,
  registerServiceWorker,
  initAllOptimizations,
};
