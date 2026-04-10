const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000")
  : (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

interface FetchApiOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export class ApiError extends Error {
  status: number;
  statusText: string;
  constructor(message: string, status: number, statusText: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
  }
}

/**
 * Robust fetch wrapper with retry logic, timeout, and error classification.
 * - Retries on network failures and 5xx errors with exponential backoff
 * - Configurable timeout (default 15s)
 * - Returns parsed JSON automatically
 */
export async function fetchApi<T = any>(
  path: string,
  options: FetchApiOptions = {}
): Promise<T> {
  const {
    retries = 2,
    retryDelay = 500,
    timeout = 15000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(apiUrl(path), {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        // Don't retry client errors (4xx)
        if (res.status >= 400 && res.status < 500) {
          throw new ApiError(
            `Request failed: ${res.status} ${res.statusText}`,
            res.status,
            res.statusText
          );
        }
        // Retry server errors (5xx)
        throw new ApiError(
          `Server error: ${res.status} ${res.statusText}`,
          res.status,
          res.statusText
        );
      }

      return await res.json();
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;

      // Don't retry client errors or aborts from user
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries exhausted
  if (lastError instanceof ApiError) throw lastError;
  throw new Error(
    lastError?.name === "AbortError"
      ? "Request timed out. Please check your connection and try again."
      : `Network error: ${lastError?.message || "Unable to reach server"}`
  );
}
