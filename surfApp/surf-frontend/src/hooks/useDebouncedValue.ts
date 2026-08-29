import { useEffect, useState } from "react";

// Returns a copy of `value` that only updates after it has stopped changing for
// `delayMs`. Handy for search inputs: the expensive filter/sort runs once the
// user pauses typing instead of on every keystroke.
export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
