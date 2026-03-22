import { useState, useEffect } from 'react';

// In-memory cache: filename+width → resolved image URL
const urlCache = new Map<string, string>();

interface WikimediaImageInfo {
  thumburl?: string;
  url?: string;
}

interface WikimediaApiPage {
  imageinfo?: WikimediaImageInfo[];
}

interface WikimediaApiResponse {
  query?: {
    pages?: Record<string, WikimediaApiPage>;
  };
}

interface WikimediaImageProps {
  /** Wikimedia Commons filename (e.g. "Great_Pyramid.jpg") OR a direct https:// URL */
  image: string;
  width?: number;
  className?: string;
  alt: string;
  /** Shown when the image fails to load (Commons items only) */
  fallbackSrc?: string;
}

/**
 * Renders a Wikimedia Commons image by resolving its URL via the public API,
 * which guarantees the correct thumbnail URL regardless of CDN path changes.
 *
 * For non-Commons items (direct https:// URLs) the image is rendered as-is.
 */
export default function WikimediaImage({
  image,
  width = 320,
  className,
  alt,
  fallbackSrc,
}: WikimediaImageProps) {
  const isDirectUrl = image.startsWith('https://');
  const cacheKey = `${image}@${width}`;

  // For direct URLs and cache hits, initialize src immediately (no loading phase).
  const [src, setSrc] = useState<string | null>(() => {
    if (isDirectUrl) return image;
    return urlCache.get(cacheKey) ?? null;
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Direct URLs don't need an API lookup.
    if (isDirectUrl) return;

    // Already resolved from the cache initialiser — nothing to do.
    if (urlCache.has(cacheKey)) return;

    const controller = new AbortController();
    const apiUrl =
      `https://commons.wikimedia.org/w/api.php` +
      `?action=query` +
      `&titles=File:${encodeURIComponent(image)}` +
      `&prop=imageinfo` +
      `&iiprop=url` +
      `&iiurlwidth=${width}` +
      `&format=json` +
      `&origin=*`;

    fetch(apiUrl, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: WikimediaApiResponse) => {
        const pages = data.query?.pages ?? {};
        const page = Object.values(pages)[0];
        const info = page?.imageinfo?.[0];
        const resolved = info?.thumburl ?? info?.url;
        if (resolved) {
          urlCache.set(cacheKey, resolved);
          setSrc(resolved);
        } else {
          setFailed(true);
        }
      })
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setFailed(true);
        }
      });

    return () => controller.abort();
  }, [image, width, isDirectUrl, cacheKey]);

  if (failed) {
    if (fallbackSrc) {
      return (
        <img
          className={className}
          src={fallbackSrc}
          alt={alt}
          loading="lazy"
        />
      );
    }
    return null;
  }

  if (!src) {
    // Placeholder while the API call is in-flight
    return <div className={className} aria-hidden="true" />;
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
