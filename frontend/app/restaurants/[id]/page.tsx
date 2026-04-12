"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";

export default function RestaurantDetailPage() {
  const params = useParams();
  const id = params.id;
  const [restaurant, setRestaurant] = useState<any>(null);
  const [inspections, setInspections] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"inspections" | "actions" | "alerts">("inspections");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchApi(`/api/restaurants/${id}`),
      fetchApi("/api/inspections"),
      fetchApi("/api/corrective-actions"),
      fetchApi("/api/alerts"),
    ])
      .then(([rest, allInsp, allActs, allAlerts]) => {
        setRestaurant(rest);
        setInspections(Array.isArray(allInsp) ? allInsp.filter((i: any) => i.restaurant_id === Number(id)) : []);
        setActions(Array.isArray(allActs) ? allActs.filter((a: any) => a.restaurant_id === Number(id)) : []);
        setAlerts(Array.isArray(allAlerts) ? allAlerts.filter((a: any) => a.restaurant_id === Number(id)) : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const scoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const severityBadge = (s: string) => {
    switch (s) {
      case "Critical": return "bg-red-100 text-red-700";
      case "High": return "bg-orange-100 text-orange-700";
      case "Medium": return "bg-yellow-100 text-yellow-700";
      case "Low": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">🏪</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Restaurant Not Found</h2>
        <p className="text-gray-500 mb-6">This restaurant may have been removed.</p>
        <a href="/restaurants" className="text-emerald-600 font-semibold hover:underline">← Back to Restaurants</a>
      </div>
    );
  }

  const openActions = actions.filter(a => a.status === "Open");
  const completedInsp = inspections.filter(i => i.status === "Completed");
  const avgScore = completedInsp.length > 0
    ? Math.round(completedInsp.reduce((sum, i) => sum + (i.score || 0), 0) / completedInsp.length)
    : null;
  const unreadAlerts = alerts.filter(a => !a.is_read).length;
  const daysUntilInspection = restaurant.next_inspection_date
    ? Math.ceil((new Date(restaurant.next_inspection_date).getTime() - Date.now()) / (1000*60*60*24))
    : null;

  const TABS = [
    { key: "inspections" as const, label: "Inspections", count: inspections.length },
    { key: "actions" as const, label: "Actions", count: actions.length },
    { key: "alerts" as const, label: "Alerts", count: unreadAlerts || alerts.length },
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <a href="/restaurants" className="text-sm text-emerald-600 hover:underline font-medium">← Restaurants</a>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">{restaurant.type}</span>
            {restaurant.health_dept_id && (
              <span className="text-xs text-gray-400 font-mono">{restaurant.health_dept_id}</span>
            )}
          </div>
        </div>
        <a href={`/restaurants`}
          className="text-sm font-medium text-gray-500 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition self-start">
          Edit Restaurant
        </a>
      </div>

      {/* Info row */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Address</p>
            <p className="text-gray-900">{restaurant.address || "—"}</p>
            <p className="text-gray-600">{[restaurant.city, restaurant.state, restaurant.zip].filter(Boolean).join(", ") || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Phone</p>
            <p className="text-gray-900">{restaurant.phone || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Next Inspection</p>
            {daysUntilInspection !== null ? (
              <p className={`font-semibold ${daysUntilInspection <= 7 ? "text-red-600" : daysUntilInspection <= 21 ? "text-yellow-600" : "text-blue-600"}`}>
                {new Date(restaurant.next_inspection_date).toLocaleDateString()} ({daysUntilInspection}d)
              </p>
            ) : <p className="text-gray-400">Not scheduled</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Created</p>
            <p className="text-gray-600">{new Date(restaurant.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Score</p>
          <p className={`text-3xl font-bold mt-1 ${avgScore ? scoreColor(avgScore) : "text-gray-300"}`}>
            {avgScore ?? "—"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Inspections</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{inspections.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Open Actions</p>
          <p className="text-3xl font-bold text-orange-600 mt-1">{openActions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Unread Alerts</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{unreadAlerts}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1 mb-6 w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`text-sm font-semibold px-4 py-2 rounded-md transition flex items-center gap-2 ${
              activeTab === t.key ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"
            }`}>
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === t.key ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500"
            }`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Tab Content: Inspections */}
      {activeTab === "inspections" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {inspections.length === 0 ? (
            <div className="text-center py-12 px-6">
              <p className="text-4xl mb-3">📋</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No inspections yet</h3>
              <p className="text-sm text-gray-500 mb-4">Schedule the first inspection for this restaurant.</p>
              <a href="/inspections" className="inline-block bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
                Schedule Inspection
              </a>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspector</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inspections.map((insp: any) => (
                  <tr key={insp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{insp.inspection_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(insp.scheduled_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{insp.inspector_name || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        insp.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                      }`}>{insp.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      {insp.score ? (
                        <span className={`text-lg font-bold ${scoreColor(insp.score)}`}>{insp.score}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab Content: Corrective Actions */}
      {activeTab === "actions" && (
        <div className="space-y-3">
          {actions.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12 px-6">
              <p className="text-4xl mb-3">✅</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No corrective actions</h3>
              <p className="text-sm text-gray-500">This restaurant has a clean record.</p>
            </div>
          ) : (
            actions.map((ca: any) => (
              <div key={ca.id} className={`bg-white rounded-xl shadow-sm border p-5 ${
                ca.status === "Open" ? "border-orange-200" : "border-gray-200 opacity-75"
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 pr-4">
                    <p className="font-medium text-gray-900">{ca.description}</p>
                    <p className="text-sm text-gray-500 mt-1">Assigned to {ca.assigned_to || "Unassigned"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${severityBadge(ca.severity)}`}>{ca.severity}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      ca.status === "Open" ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                    }`}>{ca.status}</span>
                  </div>
                </div>
                <p className={`text-xs ${new Date(ca.due_date) < new Date() && ca.status === "Open" ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                  Due: {new Date(ca.due_date).toLocaleDateString()}
                  {new Date(ca.due_date) < new Date() && ca.status === "Open" && " — OVERDUE"}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content: Alerts */}
      {activeTab === "alerts" && (
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12 px-6">
              <p className="text-4xl mb-3">🔔</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No alerts</h3>
              <p className="text-sm text-gray-500">No notifications for this restaurant.</p>
            </div>
          ) : (
            alerts.map((alert: any) => (
              <div key={alert.id} className={`bg-white rounded-xl shadow-sm border p-5 ${!alert.is_read ? "ring-1 ring-blue-300 border-blue-200" : "border-gray-200 opacity-75"}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl">{alert.type === "inspection_upcoming" ? "📋" : alert.type === "compliance_alert" ? "⚠️" : "🔔"}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {alert.title}
                      {!alert.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-2">Due: {new Date(alert.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
