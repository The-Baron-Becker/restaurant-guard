const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000")
  : (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000");

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}