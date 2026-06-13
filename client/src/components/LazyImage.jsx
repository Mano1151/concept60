import { useState, useEffect, useRef } from 'react';

function LazyImage({ src, alt, className = '', placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E' }) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // Use Intersection Observer for lazy loading
    if ('IntersectionObserver' in window && imageRef) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            setImageSrc(src);
            observer.unobserve(img);
          }
        });
      }, {
        rootMargin: '50px',
        threshold: 0.01,
      });

      observerRef.current = observer;
      observer.observe(imageRef);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    } else {
      // Fallback for browsers without IntersectionObserver
      setImageSrc(src);
    }
  }, [src, imageRef]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={`${className} transition-opacity duration-300`}
      loading="lazy"
    />
  );
}

export default LazyImage;
