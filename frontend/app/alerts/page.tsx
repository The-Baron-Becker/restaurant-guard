"use client";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState<number | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/alerts"))
      .then((r) => r.json())
      .then(setAlerts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: number) => {
    setMarkingRead(id);
    try {
      const res = await fetch(apiUrl(`/api/alerts/${id}/read`), {
        method: "PATCH",
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingRead(null);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = alerts.filter((a) => !a.is_read);
    for (const alert of unread) {
      await fetch(apiUrl(`/api/alerts/${alert.id}/read`), { method: "PATCH" });
    }
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading...</p>
      </div>
    );

  const typeIcon = (type: string) => {
    switch (type) {
      case "inspection_upcoming":  return "📋";
      case "checklist_reminder":   return "✅";
      case "compliance_alert":     return "⚠️";
      case "corrective_action":    return "🔧";
      default:                     return "🔔";
    }
  };

  const typeBg = (type: string) => {
    switch (type) {
      case "inspection_upcoming": return "border-blue-200 bg-blue-50/50";
      case "checklist_reminder":  return "border-emerald-200 bg-emerald-50/50";
      case "compliance_alert":    return "border-yellow-200 bg-yellow-50/50";
      case "corrective_action":   return "border-red-200 bg-red-50/50";
      default:                    return "border-gray-200";
    }
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts</h1>
          <p className="text-gray-500 mt-1">Compliance alerts, reminders, and notifications</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-100 transition"
          >
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No alerts</p>
        ) : (
          alerts.map((alert: any) => (
            <div
              key={alert.id}
              className={`bg-white rounded-xl shadow-sm border p-5 transition ${typeBg(alert.type)} ${
                !alert.is_read ? "ring-1 ring-offset-1 ring-blue-300" : "opacity-75"
              }`}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl">{typeIcon(alert.type)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {!alert.is_read && (
                        <>
                          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                          <button
                            onClick={() => handleMarkRead(alert.id)}
                            disabled={markingRead === alert.id}
                            className="text-xs font-medium text-gray-500 hover:text-gray-800 bg-white border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
                          >
                            {markingRead === alert.id ? "…" : "Mark read"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{alert.restaurant_name}</span>
                    <span>Due: {new Date(alert.due_date).toLocaleDateString()}</span>
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
