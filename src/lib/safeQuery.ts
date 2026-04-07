/**
 * Wraps any async operation with a timeout.
 * Returns fallback if the operation doesn't complete in time.
 */
export async function withTimeout<T>(
  fn: () => Promise<T> | PromiseLike<T>,
  ms = 5000,
  fallback: T,
): Promise<T> {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    Promise.resolve(fn()).then(
      (result) => { clearTimeout(timer); resolve(result); },
      () => { clearTimeout(timer); resolve(fallback); },
    );
  });
}
