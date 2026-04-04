"use client";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

export default function CorrectiveActionsPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = () => {
    fetch(apiUrl("/api/corrective-actions"))
      .then((r) => r.json())
      .then(setActions)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleResolve = async (id: number) => {
    setResolving(id);
    try {
      const res = await fetch(apiUrl(`/api/corrective-actions/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Resolved" }),
      });
      if (res.ok) {
        setActions((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, status: "Resolved", completed_at: new Date().toISOString() }
              : a
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolving(null);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading...</p>
      </div>
    );

  const severityBadge = (s: string) => {
    switch (s) {
      case "Critical": return "bg-red-100 text-red-700";
      case "High":     return "bg-orange-100 text-orange-700";
      case "Medium":   return "bg-yellow-100 text-yellow-700";
      case "Low":      return "bg-blue-100 text-blue-700";
      default:         return "bg-gray-100 text-gray-700";
    }
  };

  const open     = actions.filter((a) => a.status === "Open");
  const resolved = actions.filter((a) => a.status === "Resolved");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Corrective Actions</h1>
        <p className="text-gray-500 mt-1">Track and resolve inspection findings</p>
      </div>

      {/* Open */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-3 h-3 bg-orange-500 rounded-full"></span> Open ({open.length})
        </h2>
        <div className="space-y-3">
          {open.length === 0 ? (
            <p className="text-gray-400 text-sm bg-white rounded-xl p-6 border border-gray-200">
              No open corrective actions 🎉
            </p>
          ) : (
            open.map((ca: any) => (
              <div
                key={ca.id}
                className="bg-white rounded-xl shadow-sm border border-orange-200 p-5"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 pr-4">
                    <p className="font-medium text-gray-900">{ca.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {ca.restaurant_name} — Assigned to {ca.assigned_to}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${severityBadge(ca.severity)}`}
                    >
                      {ca.severity}
                    </span>
                    <button
                      onClick={() => handleResolve(ca.id)}
                      disabled={resolving === ca.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {resolving === ca.id ? "Resolving…" : "✓ Resolve"}
                    </button>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium ${
                    new Date(ca.due_date) < new Date()
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  Due: {new Date(ca.due_date).toLocaleDateString()}
                  {new Date(ca.due_date) < new Date() && " — OVERDUE"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Resolved */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span className="w-3 h-3 bg-emerald-500 rounded-full"></span> Resolved ({resolved.length})
        </h2>
        <div className="space-y-2">
          {resolved.map((ca: any) => (
            <div
              key={ca.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 opacity-75"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-700">{ca.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {ca.restaurant_name} — Resolved{" "}
                    {ca.completed_at
                      ? new Date(ca.completed_at).toLocaleDateString()
                      : ""}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${severityBadge(ca.severity)}`}
                >
                  {ca.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
