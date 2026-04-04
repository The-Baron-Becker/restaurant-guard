const API_BASE = typeof window !== "undefined"
  ? "http://localhost:4000"
  : (process.env.BACKEND_URL || "http://localhost:4000");

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
