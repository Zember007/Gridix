import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAsyncActionOptions<TResult> {
  onSuccess?: (result: TResult) => void;
  onError?: (error: unknown) => void;
}

interface UseAsyncActionResult<TArgs extends unknown[], TResult> {
  run: (...args: TArgs) => Promise<TResult | undefined>;
  isRunning: boolean;
}

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options?: UseAsyncActionOptions<TResult>
): UseAsyncActionResult<TArgs, TResult> {
  const [isRunning, setIsRunning] = useState(false);
  const isMountedRef = useRef(true);
  const isRunningRef = useRef(false);
  const actionRef = useRef(action);
  const optionsRef = useRef(options);

  actionRef.current = action;
  optionsRef.current = options;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const run = useCallback(async (...args: TArgs) => {
    if (isRunningRef.current) {
      return undefined;
    }

    isRunningRef.current = true;

    if (isMountedRef.current) {
      setIsRunning(true);
    }

    try {
      const result = await actionRef.current(...args);
      optionsRef.current?.onSuccess?.(result);
      return result;
    } catch (error: unknown) {
      optionsRef.current?.onError?.(error);
      throw error;
    } finally {
      isRunningRef.current = false;

      if (isMountedRef.current) {
        setIsRunning(false);
      }
    }
  }, []);

  return {
    run,
    isRunning,
  };
}
