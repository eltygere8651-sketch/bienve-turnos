import { useRef, useEffect, useCallback } from 'react';

export const useDebouncedCallback = <T extends (...args: any[]) => void>(
    callback: T,
    delay: number
) => {
    const callbackRef = useRef(callback);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const debouncedCallback = useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]);

    return debouncedCallback;
};
