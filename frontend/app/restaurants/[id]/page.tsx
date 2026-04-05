"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiUrl } from "@/lib/api";

export default function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<any>(null);
  const [inspections, setInspections] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"inspections" | "actions" | "alerts">("inspections");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(apiUrl(`/api/restaurants/${id}`)).then((r) => r.json()),
      fetch(apiUrl(`/api/inspections?restaurant_id=${id}`)).then((r) => r.json()),
      fetch(apiUrl(`/api/corrective-actions?restaurant_id=${id}`)).then((r) => r.json()),
      fetch(apiUrl(`/api/alerts?restaurant_id=${id}`)).then((r) => r.json()),
    ])
      .then(([rest, insp, acts, alts]) => {
        setRestaurant(rest);
        setInspections(Array.isArray(insp) ? insp : []);
        setActions(Array.isArray(acts) ? acts : []);
        setAlerts(Array.isArray(alts) ? alts : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-400">Loading...</p></div>;
  if (!restaurant || restaurant.error) return <div className="text-red-500 p-8">Restaurant not found.</div>;

  const completedInsp = inspections.filter((i) => i.status === "Completed");
  const avgScore = completedInsp.length
    ? Math.round(completedInsp.reduce((s, i) => s + (i.score || 0), 0) / completedInsp.length) : null;
  const openActions = actions.filter((a) => a.status === "Open");
  const unreadAlerts = alerts.filter((a) => !a.is_read);

  const scoreColor = (s: number) => s >= 90 ? "text-emerald-600" : s >= 80 ? "text-yellow-600" : "text-red-600";
  const severityBadge = (s: string) => ({
    Critical: "bg-red-100 text-red-700", High: "bg-orange-100 text-orange-700",
    Medium: "bg-yellow-100 text-yellow-700", Low: "bg-blue-100 text-blue-700",
  }[s] || "bg-gray-100 text-gray-600");

  return (
    <div>
      {/* Back link */}
      <a href="/restaurants" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-700 mb-6 transition">
        ← Back to Restaurants
      </a>

      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">{restaurant.type}</span>
            </div>
            <p className="text-sm text-gray-500">{restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip}</p>
            {restaurant.phone && <p className="text-sm text-gray-500 mt-0.5">{restaurant.phone}</p>}
            {restaurant.health_dept_id && <p className="text-xs text-gray-400 mt-1 font-mono">HD ID: {restaurant.health_dept_id}</p>}
          </div>
          {/* Stats */}
          <div className="flex gap-4 flex-wrap">
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Avg Score</p>
              {avgScore !== null
                ? <p className={`text-3xl font-bold ${scoreColor(avgScore)}`}>{avgScore}</p>
                : <p className="text-xl text-gray-300 font-bold">—</p>}
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Inspections</p>
              <p className="text-3xl font-bold text-gray-800">{inspections.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Open Actions</p>
              <p className={`text-3xl font-bold ${openActions.length > 0 ? "text-orange-600" : "text-gray-300"}`}>{openActions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Unread Alerts</p>
              <p className={`text-3xl font-bold ${unreadAlerts.length > 0 ? "text-red-600" : "text-gray-300"}`}>{unreadAlerts.length}</p>
            </div>
          </div>
        </div>
        {restaurant.next_inspection_date && (() => {
          const d = Math.ceil((new Date(restaurant.next_inspection_date).getTime() - Date.now()) / 86400000);
          return (
            <div className={`mt-4 inline-block text-xs font-semibold px-3 py-1.5 rounded-lg border ${
              d <= 7 ? "bg-red-50 text-red-700 border-red-200" : d <= 21 ? "bg-yellow-50 text-yellow-700 border-yellow-200" : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              Next Inspection: {new Date(restaurant.next_inspection_date).toLocaleDateString()} ({d}d)
            </div>
          );
        })()}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-5 w-fit">
        {([["inspections", "📋 Inspections", inspections.length], ["actions", "⚠️ Corrective Actions", openActions.length + " open"], ["alerts", "🔔 Alerts", unreadAlerts.length + " unread"]] as const).map(([key, label, count]) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2 ${tab === key ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"}`}>
            {label} <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === key ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Inspections Tab */}
      {tab === "inspections" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {["Type", "Date", "Inspector", "Status", "Score", "Notes"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inspections.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No inspections yet.</td></tr>
              ) : inspections.map((i: any) => (
                <tr key={i.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{i.inspection_type}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{new Date(i.scheduled_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{i.inspector_name || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${i.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>{i.status}</span>
                  </td>
                  <td className="px-5 py-3">
                    {i.score ? <span className={`text-lg font-bold ${scoreColor(i.score)}`}>{i.score}</span> : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 max-w-xs truncate">{i.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Corrective Actions Tab */}
      {tab === "actions" && (
        <div className="space-y-3">
          {actions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">No corrective actions.</div>
          ) : actions.map((ca: any) => (
            <div key={ca.id} className={`bg-white rounded-xl shadow-sm border p-5 ${ca.status === "Open" ? "border-orange-200" : "border-gray-200 opacity-70"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{ca.description}</p>
                  <p className="text-sm text-gray-500 mt-1">Assigned to {ca.assigned_to || "—"}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${severityBadge(ca.severity)}`}>{ca.severity}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ca.status === "Open" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"}`}>{ca.status}</span>
                </div>
              </div>
              <p className={`text-xs mt-2 font-medium ${new Date(ca.due_date) < new Date() && ca.status === "Open" ? "text-red-600" : "text-gray-400"}`}>
                Due: {new Date(ca.due_date).toLocaleDateString()}{new Date(ca.due_date) < new Date() && ca.status === "Open" ? " — OVERDUE" : ""}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Alerts Tab */}
      {tab === "alerts" && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">No alerts.</div>
          ) : alerts.map((a: any) => (
            <div key={a.id} className={`bg-white rounded-xl shadow-sm border p-5 ${!a.is_read ? "border-blue-200 ring-1 ring-blue-200" : "border-gray-200 opacity-70"}`}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{
                  { inspection_upcoming: "📋", checklist_reminder: "✅", compliance_alert: "⚠️", corrective_action: "🔧" }[a.type as string] || "🔔"
                }</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{a.title}</h3>
                    {!a.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-gray-600">{a.message}</p>
                  <p className="text-xs text-gray-400 mt-1">Due: {new Date(a.due_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
