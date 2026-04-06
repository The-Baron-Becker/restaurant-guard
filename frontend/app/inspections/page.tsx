"use client";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { TableSkeleton } from "@/components/Skeleton";

const EMPTY_FORM = {
  restaurant_id: "",
  inspector_name: "",
  inspection_type: "Routine",
  scheduled_date: "",
};

const EMPTY_COMPLETE = { score: "", notes: "" };

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Complete inspection modal
  const [completeTarget, setCompleteTarget] = useState<any | null>(null);
  const [completeForm, setCompleteForm] = useState(EMPTY_COMPLETE);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    Promise.all([
      fetch(apiUrl("/api/inspections")).then((r) => r.json()),
      fetch(apiUrl("/api/restaurants")).then((r) => r.json()),
    ])
      .then(([insp, rests]) => {
        setInspections(insp);
        setRestaurants(rests);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.restaurant_id) { setFormError("Please select a restaurant."); return; }
    if (!form.scheduled_date) { setFormError("Please enter a scheduled date."); return; }
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(apiUrl("/api/inspections"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: parseInt(form.restaurant_id),
          inspector_name: form.inspector_name || null,
          inspection_type: form.inspection_type,
          scheduled_date: form.scheduled_date,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const created = await res.json();
      const rest = restaurants.find((r) => r.id === created.restaurant_id);
      setInspections((prev) => [{ ...created, restaurant_name: rest?.name }, ...prev]);
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    const scoreNum = parseInt(completeForm.score);
    if (!completeForm.score || isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      setCompleteError("Score must be a number between 0 and 100.");
      return;
    }
    setCompleting(true);
    setCompleteError(null);
    try {
      const res = await fetch(apiUrl(`/api/inspections/${completeTarget.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed", score: scoreNum, notes: completeForm.notes || null }),
      });
      if (!res.ok) throw new Error("Failed to complete");
      const updated = await res.json();
      setInspections((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      setCompleteTarget(null);
      setCompleteForm(EMPTY_COMPLETE);
    } catch {
      setCompleteError("Something went wrong. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  const scoreColor = (score: number | null) => {
    if (!score) return "";
    if (score >= 90) return "text-emerald-600 bg-emerald-50";
    if (score >= 80) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "Completed": return "bg-emerald-100 text-emerald-700";
      case "Scheduled":  return "bg-blue-100 text-blue-700";
      default:           return "bg-gray-100 text-gray-700";
    }
  };

  const filtered = inspections.filter((insp) => {
    const matchSearch =
      !search ||
      insp.restaurant_name?.toLowerCase().includes(search.toLowerCase()) ||
      insp.inspector_name?.toLowerCase().includes(search.toLowerCase()) ||
      insp.inspection_type?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || insp.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading)
    return (
      <div>
        <div className="mb-8"><div className="h-8 bg-gray-200 rounded w-40 animate-pulse" /></div>
        <TableSkeleton rows={6} />
      </div>
    );

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspections</h1>
          <p className="text-gray-500 mt-1">Track all health inspections across your restaurants</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(null); setForm(EMPTY_FORM); }}
          className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <span className="text-base">+</span> Schedule Inspection
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search restaurant, inspector, type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {["All", "Scheduled", "Completed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${
                statusFilter === s
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Restaurant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspector</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">{search || statusFilter !== "All" ? "🔍" : "📋"}</span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {search || statusFilter !== "All" ? "No inspections match your filters" : "No inspections scheduled"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {search || statusFilter !== "All"
                      ? "Try adjusting your search or filter criteria."
                      : "Schedule your first health inspection to get started."}
                  </p>
                  {!(search || statusFilter !== "All") && (
                    <button onClick={() => { setShowModal(true); setFormError(null); setForm(EMPTY_FORM); }}
                      className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
                      + Schedule Inspection
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((insp: any) => (
                <tr key={insp.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{insp.restaurant_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{insp.inspection_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(insp.scheduled_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{insp.inspector_name || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge(insp.status)}`}>
                      {insp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {insp.score ? (
                      <span className={`text-lg font-bold px-2 py-0.5 rounded ${scoreColor(insp.score)}`}>
                        {insp.score}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {insp.status === "Scheduled" && (
                      <button
                        onClick={() => { setCompleteTarget(insp); setCompleteForm(EMPTY_COMPLETE); setCompleteError(null); }}
                        className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Complete Inspection Modal */}
      {completeTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Complete Inspection</h2>
                <p className="text-xs text-gray-500 mt-0.5">{completeTarget.restaurant_name} — {completeTarget.inspection_type}</p>
              </div>
              <button onClick={() => setCompleteTarget(null)} className="text-gray-400 hover:text-gray-700 text-xl font-bold transition">✕</button>
            </div>
            <form onSubmit={handleComplete} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Inspection Score (0–100) *</label>
                <input
                  type="number" min={0} max={100}
                  value={completeForm.score}
                  onChange={(e) => setCompleteForm({ ...completeForm, score: e.target.value })}
                  placeholder="e.g. 92"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <p className="text-xs text-gray-400 mt-1">90–100: Pass ✅ &nbsp; 80–89: Conditional ⚠️ &nbsp; Below 80: Fail ❌</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Inspector Notes</label>
                <textarea
                  rows={3}
                  value={completeForm.notes}
                  onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
                  placeholder="Summary of findings, violations, recommendations…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
              </div>
              {completeError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{completeError}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setCompleteTarget(null)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={completing}
                  className="flex-1 bg-emerald-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                  {completing ? "Saving…" : "Mark Complete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Inspection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Schedule Inspection</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-xl font-bold transition">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Restaurant *</label>
                <select value={form.restaurant_id} onChange={(e) => setForm({ ...form, restaurant_id: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                  <option value="">Select a restaurant…</option>
                  {restaurants.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Inspection Type</label>
                <select value={form.inspection_type} onChange={(e) => setForm({ ...form, inspection_type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                  <option>Routine</option>
                  <option>Follow-Up</option>
                  <option>Complaint</option>
                  <option>Pre-Opening</option>
                  <option>HACCP</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Scheduled Date *</label>
                <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Inspector Name</label>
                <input type="text" value={form.inspector_name} onChange={(e) => setForm({ ...form, inspector_name: e.target.value })}
                  placeholder="e.g. Jane Smith"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-emerald-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                  {saving ? "Scheduling…" : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
