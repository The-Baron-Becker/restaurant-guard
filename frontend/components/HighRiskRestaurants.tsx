"use client";
import { useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { useAutoRefresh } from "@/lib/useAutoRefresh";

interface HighRiskRestaurant {
  id: number;
  name: string;
  type: string | null;
  city: string | null;
  state: string | null;
  open_high_severity: number;
  open_total: number;
  latest_score: number | null;
}

const scoreColor = (score: number | null) => {
  if (score === null || score === undefined) return "text-gray-400";
  if (score >= 90) return "text-emerald-600";
  if (score >= 80) return "text-yellow-600";
  return "text-red-600";
};

export default function HighRiskRestaurants() {
  const fetcher = useCallback(
    () => fetchApi<HighRiskRestaurant[]>("/api/dashboard/high-risk-restaurants"),
    []
  );
  const { data, loading } = useAutoRefresh(fetcher, { interval: 60000 });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">High-Risk Restaurants</h2>
        </div>
        <div className="p-6 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const rows = data || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">High-Risk Restaurants</h2>
          <p className="text-xs text-gray-500 mt-0.5">Ranked by open critical & high-severity actions</p>
        </div>
        <a href="/corrective-actions" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
          View all →
        </a>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-sm font-medium text-gray-900">No open compliance risks</p>
            <p className="text-xs text-gray-500 mt-1">Every restaurant is clear of open corrective actions.</p>
          </div>
        ) : (
          rows.map((r) => (
            <a
              key={r.id}
              href={`/restaurants/${r.id}`}
              className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">{r.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {[r.type, r.city && `${r.city}${r.state ? `, ${r.state}` : ""}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {r.open_high_severity > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    {r.open_high_severity} critical
                  </span>
                )}
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  {r.open_total} open
                </span>
                <span className={`text-base font-bold tabular-nums ${scoreColor(r.latest_score)}`}>
                  {r.latest_score ?? "—"}
                </span>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
