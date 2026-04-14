"use client";
import { useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { useAutoRefresh } from "@/lib/useAutoRefresh";
import RefreshBar from "@/components/RefreshBar";
import { DashboardSkeleton } from "@/components/Skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ReportsSummary {
  pass_rate: { total: number; passed: number; failed: number; pct: number };
  score_by_type: Array<{ type: string; inspection_count: number; avg_score: number | null }>;
  severity_breakdown: Array<{ severity: string; count: number }>;
  top_risk_restaurants: Array<{
    id: number;
    name: string;
    type: string;
    city: string;
    state: string;
    open_high_severity: number;
    open_total: number;
    latest_score: number | null;
  }>;
  inspector_performance: Array<{ inspector: string; inspection_count: number; avg_score: number }>;
  monthly_volume: Array<{ month: string; completed: number; passed: number }>;
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#dc2626",
  High: "#ea580c",
  Medium: "#ca8a04",
  Low: "#2563eb",
};

const scoreColor = (score: number | null) => {
  if (score === null || score === undefined) return "text-gray-400";
  if (score >= 90) return "text-emerald-600";
  if (score >= 80) return "text-yellow-600";
  return "text-red-600";
};

export default function ReportsPage() {
  const fetcher = useCallback(
    () => fetchApi<ReportsSummary>("/api/reports/summary"),
    []
  );
  const { data, loading, lastUpdated, refresh, refreshing } = useAutoRefresh(
    fetcher,
    { interval: 120_000 }
  );

  if (loading) return <DashboardSkeleton />;
  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-16 px-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Unable to load reports</h3>
        <p className="text-sm text-gray-500 mb-6">Check that the API server is running and try again.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    pass_rate,
    score_by_type,
    severity_breakdown,
    top_risk_restaurants,
    inspector_performance,
    monthly_volume,
  } = data;

  const passRatePct = pass_rate.pct;
  const passRateColor =
    passRatePct >= 90 ? "text-emerald-600" : passRatePct >= 75 ? "text-yellow-600" : "text-red-600";

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports &amp; Analytics</h1>
          <p className="text-gray-500 mt-1">
            Portfolio-level view of compliance, risk, and inspection throughput.
          </p>
        </div>
        <RefreshBar lastUpdated={lastUpdated} onRefresh={refresh} refreshing={refreshing} />
      </div>

      {/* Headline KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Rate</p>
          <p className={`text-3xl font-bold mt-2 ${passRateColor}`}>{passRatePct}%</p>
          <p className="text-xs text-gray-500 mt-1">
            {pass_rate.passed} of {pass_rate.total} inspections ≥ 80
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed Inspections</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{pass_rate.total}</p>
          <p className="text-xs text-gray-500 mt-1">All-time completed &amp; scored</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Failed Inspections</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{pass_rate.failed}</p>
          <p className="text-xs text-gray-500 mt-1">Score &lt; 80</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Open Critical/High</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">
            {severity_breakdown
              .filter((s) => s.severity === "Critical" || s.severity === "High")
              .reduce((sum, s) => sum + s.count, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Corrective actions requiring attention</p>
        </div>
      </div>

      {/* Row 1: severity breakdown + monthly volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Open Corrective Actions by Severity</h2>
          {severity_breakdown.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No open corrective actions — great work!</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={severity_breakdown}
                  dataKey="count"
                  nameKey="severity"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry: any) => `${entry.severity}: ${entry.count}`}
                >
                  {severity_breakdown.map((entry) => (
                    <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Inspection Volume</h2>
          {monthly_volume.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No completed inspections in the last 6 months.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthly_volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#64748b" name="Completed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="passed" fill="#059669" name="Passed (≥80)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2: score by type */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Average Score by Restaurant Type</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="py-2">Type</th>
                <th className="py-2">Inspections</th>
                <th className="py-2">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {score_by_type.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-400">No data yet.</td>
                </tr>
              ) : (
                score_by_type.map((row) => (
                  <tr key={row.type} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 font-medium text-gray-900">{row.type}</td>
                    <td className="py-3 text-gray-600">{row.inspection_count}</td>
                    <td className={`py-3 font-bold ${scoreColor(row.avg_score)}`}>
                      {row.avg_score ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3: top-risk restaurants + inspector performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Top-Risk Restaurants</h2>
            <p className="text-xs text-gray-500 mt-0.5">Ranked by open critical/high corrective actions.</p>
          </div>
          <div className="divide-y divide-gray-50">
            {top_risk_restaurants.length === 0 ? (
              <p className="p-6 text-gray-400 text-sm">No high-risk restaurants right now.</p>
            ) : (
              top_risk_restaurants.map((r) => (
                <a
                  key={r.id}
                  href={`/restaurants/${r.id}`}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-medium text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-500">
                      {r.type}
                      {r.city && ` · ${r.city}, ${r.state}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Open CAs</p>
                      <p className="text-sm font-bold text-orange-600">
                        {r.open_high_severity} high / {r.open_total}
                      </p>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <p className="text-xs text-gray-500">Score</p>
                      <p className={`text-sm font-bold ${scoreColor(r.latest_score)}`}>
                        {r.latest_score ?? "—"}
                      </p>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Inspector Performance</h2>
            <p className="text-xs text-gray-500 mt-0.5">Completed inspections &amp; average score.</p>
          </div>
          <div className="divide-y divide-gray-50">
            {inspector_performance.length === 0 ? (
              <p className="p-6 text-gray-400 text-sm">No completed inspections yet.</p>
            ) : (
              inspector_performance.map((r) => (
                <div key={r.inspector} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{r.inspector}</p>
                    <p className="text-xs text-gray-500">{r.inspection_count} inspections completed</p>
                  </div>
                  <p className={`text-lg font-bold ${scoreColor(r.avg_score)}`}>{r.avg_score}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
