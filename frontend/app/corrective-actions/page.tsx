"use client";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { ListSkeleton } from "@/components/Skeleton";

const SEVERITY_OPTIONS = ["Critical", "High", "Medium", "Low"];
const EMPTY_FORM = {
  restaurant_id: "", description: "", severity: "Medium",
  assigned_to: "", due_date: "",
};

export default function CorrectiveActionsPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);

  // Create modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  // Filters
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    Promise.all([
      fetch(apiUrl("/api/corrective-actions")).then((r) => r.json()),
      fetch(apiUrl("/api/restaurants")).then((r) => r.json()),
    ])
      .then(([acts, rests]) => { setActions(acts); setRestaurants(rests); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleResolve = async (id: number) => {
    setResolving(id);
    try {
      const res = await fetch(apiUrl(`/api/corrective-actions/${id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Resolved" }),
      });
      if (res.ok) {
        setActions((prev) => prev.map((a) =>
          a.id === id ? { ...a, status: "Resolved", completed_at: new Date().toISOString() } : a
        ));
      }
    } catch (err) { console.error(err); }
    finally { setResolving(null); }
  };
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.restaurant_id) { setFormError("Please select a restaurant."); return; }
    if (!form.description.trim()) { setFormError("Description is required."); return; }
    if (!form.due_date) { setFormError("Due date is required."); return; }
    setSaving(true); setFormError(null);
    try {
      const res = await fetch(apiUrl("/api/corrective-actions"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: parseInt(form.restaurant_id),
          description: form.description,
          severity: form.severity,
          assigned_to: form.assigned_to || null,
          due_date: form.due_date,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const created = await res.json();
      const rest = restaurants.find((r) => r.id === created.restaurant_id);
      setActions((prev) => [{ ...created, restaurant_name: rest?.name }, ...prev]);
      setShowModal(false); setForm(EMPTY_FORM);
    } catch { setFormError("Something went wrong. Please try again."); }
    finally { setSaving(false); }
  };
  const severityBadge = (s: string) => {
    switch (s) {
      case "Critical": return "bg-red-100 text-red-700";
      case "High":     return "bg-orange-100 text-orange-700";
      case "Medium":   return "bg-yellow-100 text-yellow-700";
      case "Low":      return "bg-blue-100 text-blue-700";
      default:         return "bg-gray-100 text-gray-700";
    }
  };

  const filtered = actions.filter((a) => {
    const matchSearch = !search ||
      a.description?.toLowerCase().includes(search.toLowerCase()) ||
      a.restaurant_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.assigned_to?.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = severityFilter === "All" || a.severity === severityFilter;
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    return matchSearch && matchSeverity && matchStatus;
  });

  const open = filtered.filter((a) => a.status === "Open");
  const resolved = filtered.filter((a) => a.status === "Resolved");

  if (loading) return (
    <div>
      <div className="mb-6"><div className="h-8 bg-gray-200 rounded w-56 animate-pulse" /></div>
      <ListSkeleton />
    </div>
  );
  return (
    <div>
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Corrective Actions</h1>
          <p className="text-gray-500 mt-1">Track and resolve inspection findings</p>
        </div>
        <button onClick={() => { setShowModal(true); setFormError(null); setForm(EMPTY_FORM); }}
          className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2">
          <span className="text-base">+</span> New Action
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input type="text" placeholder="Search description, restaurant, assignee…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {["All", "Open", "Resolved"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${statusFilter === s ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
              {s}
            </button>
          ))}
        </div>        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {["All", ...SEVERITY_OPTIONS].map((s) => (
            <button key={s} onClick={() => setSeverityFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${severityFilter === s ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-gray-400 mb-4">{filtered.length} action{filtered.length !== 1 ? "s" : ""} shown</p>

      {/* Open */}
      {(statusFilter === "All" || statusFilter === "Open") && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full"></span> Open ({open.length})
          </h2>
          <div className="space-y-3">
            {open.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-12 px-6">
                <div className="w-14 h-14 mx-auto mb-3 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">No open actions</h3>
                <p className="text-sm text-gray-500">{search || severityFilter !== "All" ? "Try adjusting your filters." : "All corrective actions have been resolved."}</p>
              </div>
            ) : (
              open.map((ca: any) => (
                <div key={ca.id} className="bg-white rounded-xl shadow-sm border border-orange-200 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-4">
                      <p className="font-medium text-gray-900">{ca.description}</p>
                      <p className="text-sm text-gray-500 mt-1">{ca.restaurant_name} — Assigned to {ca.assigned_to || "Unassigned"}</p>
                    </div>                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${severityBadge(ca.severity)}`}>{ca.severity}</span>
                      <button onClick={() => handleResolve(ca.id)} disabled={resolving === ca.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                        {resolving === ca.id ? "Resolving…" : "✓ Resolve"}
                      </button>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${new Date(ca.due_date) < new Date() ? "text-red-600" : "text-gray-500"}`}>
                    Due: {new Date(ca.due_date).toLocaleDateString()}{new Date(ca.due_date) < new Date() && " — OVERDUE"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Resolved */}
      {(statusFilter === "All" || statusFilter === "Resolved") && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span> Resolved ({resolved.length})
          </h2>
          <div className="space-y-2">
            {resolved.length === 0 ? (
              <p className="text-gray-400 text-sm bg-white rounded-xl p-6 border border-gray-200">No resolved actions match your filters.</p>
            ) : (
              resolved.map((ca: any) => (                <div key={ca.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 opacity-75">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-700">{ca.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{ca.restaurant_name} — Resolved {ca.completed_at ? new Date(ca.completed_at).toLocaleDateString() : ""}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${severityBadge(ca.severity)}`}>{ca.severity}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">New Corrective Action</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-xl font-bold transition">✕</button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Restaurant *</label>
                <select value={form.restaurant_id} onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                  <option value="">Select a restaurant…</option>
                  {restaurants.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description *</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the issue and required corrective action…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Severity</label>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    {SEVERITY_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date *</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Assigned To</label>
                <input type="text" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  placeholder="e.g. Kitchen Manager"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-emerald-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition">
                  {saving ? "Creating…" : "Create Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}