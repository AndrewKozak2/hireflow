import { useEffect, useLayoutEffect, useRef } from "react";

export function useInfiniteScroll(
  onLoadMore,
  { rootMargin = "300px", root = null } = {},
) {
  const sentinelRef = useRef(null);
  const callbackRef = useRef(onLoadMore);

  useLayoutEffect(() => {
    callbackRef.current = onLoadMore;
  });

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callbackRef.current();
        }
      },
      {
        root,
        rootMargin,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, root]);

  return sentinelRef;
}
