"use client";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { ListSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";

const TYPE_LABELS: Record<string, string> = {
  inspection_upcoming: "Inspection",
  checklist_reminder: "Checklist",
  compliance_alert: "Compliance",
  corrective_action: "Corrective Action",
};
const TYPE_ICONS: Record<string, string> = {
  inspection_upcoming: "📋", checklist_reminder: "✅",
  compliance_alert: "⚠️", corrective_action: "🔧",
};
const TYPE_BG: Record<string, string> = {
  inspection_upcoming: "border-blue-200 bg-blue-50/50",
  checklist_reminder: "border-emerald-200 bg-emerald-50/50",
  compliance_alert: "border-yellow-200 bg-yellow-50/50",
  corrective_action: "border-red-200 bg-red-50/50",
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const { toast } = useToast();

  // Filters
  const [restFilter, setRestFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");

  useEffect(() => {
    Promise.all([
      fetch(apiUrl("/api/alerts")).then((r) => r.json()),
      fetch(apiUrl("/api/restaurants")).then((r) => r.json()),
    ])
      .then(([alts, rests]) => { setAlerts(Array.isArray(alts) ? alts : []); setRestaurants(Array.isArray(rests) ? rests : []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: number) => {
    setMarkingRead(id);
    try {
      const res = await fetch(apiUrl(`/api/alerts/${id}/read`), { method: "PATCH" });
      if (res.ok) { setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a)); toast("Alert marked as read"); }
    } catch (err) { console.error(err); toast("Failed to mark alert", "error"); }
    finally { setMarkingRead(null); }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const qs = restFilter !== "all" ? `?restaurant_id=${restFilter}` : "";
      const res = await fetch(apiUrl(`/api/alerts/read-all${qs}`), { method: "PATCH" });
      if (res.ok) {
        setAlerts((prev) => prev.map((a) =>
          (restFilter === "all" || String(a.restaurant_id) === restFilter) ? { ...a, is_read: true } : a
        ));
        toast("All alerts marked as read");
      }
    } catch (err) { console.error(err); toast("Failed to mark alerts", "error"); }
    finally { setMarkingAll(false); }
  };

  const filtered = alerts.filter((a) => {
    if (restFilter !== "all" && String(a.restaurant_id) !== restFilter) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    if (readFilter === "unread" && a.is_read) return false;
    if (readFilter === "read" && !a.is_read) return false;
    return true;
  });

  const unreadCount = filtered.filter((a) => !a.is_read).length;

  if (loading) return (
    <div>
      <div className="mb-6"><div className="h-8 bg-gray-200 rounded w-32 animate-pulse" /></div>
      <ListSkeleton />
    </div>
  );

  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-500 mt-1">Compliance alerts, reminders, and notifications</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} disabled={markingAll}
            className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition">
            {markingAll ? "Marking…" : `Mark all read (${unreadCount})`}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={restFilter} onChange={(e) => setRestFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 min-w-[180px]">
          <option value="all">All Restaurants</option>
          {restaurants.map((r: any) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
        </select>

        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {[["all", "All Types"], ...Object.entries(TYPE_LABELS)].map(([val, label]) => (
            <button key={val} onClick={() => setTypeFilter(val)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${typeFilter === val ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
              {val !== "all" && TYPE_ICONS[val]} {label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {[["all", "All"], ["unread", "Unread"], ["read", "Read"]] .map(([val, label]) => (
            <button key={val} onClick={() => setReadFilter(val as any)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${readFilter === val ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">{filtered.length} alert{filtered.length !== 1 ? "s" : ""} shown</p>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-16 px-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">{restFilter !== "all" || typeFilter !== "all" || readFilter !== "all" ? "🔍" : "🔔"}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {restFilter !== "all" || typeFilter !== "all" || readFilter !== "all" ? "No alerts match your filters" : "All clear!"}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                {restFilter !== "all" || typeFilter !== "all" || readFilter !== "all"
                  ? "Try adjusting your filter criteria."
                  : "No compliance alerts or reminders at this time."}
              </p>
            </div>
        ) : (
          filtered.map((alert: any) => (
            <div key={alert.id} className={`bg-white rounded-xl shadow-sm border p-5 transition ${TYPE_BG[alert.type] || "border-gray-200"} ${!alert.is_read ? "ring-1 ring-offset-1 ring-blue-300" : "opacity-75"}`}>
              <div className="flex items-start gap-4">
                <span className="text-2xl">{TYPE_ICONS[alert.type] || "🔔"}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                      {!alert.is_read && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0" />}
                    </div>
                    {!alert.is_read && (
                      <button onClick={() => handleMarkRead(alert.id)} disabled={markingRead === alert.id}
                        className="text-xs font-medium text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition flex-shrink-0">
                        {markingRead === alert.id ? "…" : "Mark read"}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <a href={`/restaurants/${alert.restaurant_id}`} className="hover:text-emerald-600 font-medium transition">{alert.restaurant_name}</a>
                    <span>Due: {new Date(alert.due_date).toLocaleDateString()}</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">{TYPE_LABELS[alert.type] || alert.type}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
