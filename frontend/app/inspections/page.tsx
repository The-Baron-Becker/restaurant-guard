"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { TableSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { useModalA11y } from "@/lib/useModal";

export default function InspectionsPage() {
  return (
    <Suspense fallback={<div><div className="mb-8"><div className="h-8 bg-gray-200 rounded w-40 animate-pulse" /></div><TableSkeleton rows={6} /></div>}>
      <InspectionsPageInner />
    </Suspense>
  );
}

const EMPTY_FORM = {
  restaurant_id: "",
  inspector_name: "",
  inspection_type: "Routine",
  scheduled_date: "",
};

const EMPTY_COMPLETE = { score: "", notes: "" };

function InspectionsPageInner() {
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

  // Filter state — initialize from URL query params
  const searchParams = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "All");
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [sortCol, setSortCol] = useState<string>("scheduled_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const PAGE_SIZE = 10;

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-emerald-600 ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };
  const { toast } = useToast();

  // Sync filters to URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter !== "All") params.set("status", statusFilter);
    if (currentPage > 1) params.set("page", String(currentPage));
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/inspections", { scroll: false });
  }, [search, statusFilter, currentPage, router]);
  const closeSchedule = useCallback(() => setShowModal(false), []);
  const closeComplete = useCallback(() => setCompleteTarget(null), []);
  const scheduleModalRef = useModalA11y(showModal, closeSchedule);
  const completeModalRef = useModalA11y(!!completeTarget, closeComplete);

  useEffect(() => {
    Promise.all([
      fetchApi("/api/inspections"),
      fetchApi("/api/restaurants"),
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
      const created = await fetchApi("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: parseInt(form.restaurant_id),
          inspector_name: form.inspector_name || null,
          inspection_type: form.inspection_type,
          scheduled_date: form.scheduled_date,
        }),
      });
      const rest = restaurants.find((r) => r.id === created.restaurant_id);
      setInspections((prev) => [{ ...created, restaurant_name: rest?.name }, ...prev]);
      setShowModal(false);
      setForm(EMPTY_FORM);
      toast("Inspection scheduled successfully");
    } catch {
      setFormError("Something went wrong. Please try again.");
      toast("Failed to schedule inspection", "error");
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
      const updated = await fetchApi(`/api/inspections/${completeTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed", score: scoreNum, notes: completeForm.notes || null }),
      });
      setInspections((prev) => prev.map((i) => i.id === updated.id ? updated : i));
      setCompleteTarget(null);
      setCompleteForm(EMPTY_COMPLETE);
      toast("Inspection marked as complete");
    } catch {
      setCompleteError("Something went wrong. Please try again.");
      toast("Failed to complete inspection", "error");
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

  const exportCsv = () => {
    const headers = ["Restaurant", "Type", "Scheduled Date", "Inspector", "Status", "Score", "Notes"];
    const escape = (v: any) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = filtered.map((i: any) => [
      i.restaurant_name,
      i.inspection_type,
      i.scheduled_date ? new Date(i.scheduled_date).toISOString().slice(0, 10) : "",
      i.inspector_name || "",
      i.status,
      i.score ?? "",
      i.notes || "",
    ].map(escape).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inspections-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filtered = inspections
    .filter((insp) => {
      const matchSearch =
        !search ||
        insp.restaurant_name?.toLowerCase().includes(search.toLowerCase()) ||
        insp.inspector_name?.toLowerCase().includes(search.toLowerCase()) ||
        insp.inspection_type?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || insp.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortCol) {
        case "restaurant_name": aVal = a.restaurant_name || ""; bVal = b.restaurant_name || ""; break;
        case "inspection_type": aVal = a.inspection_type || ""; bVal = b.inspection_type || ""; break;
        case "scheduled_date":  aVal = a.scheduled_date ? new Date(a.scheduled_date).getTime() : 0; bVal = b.scheduled_date ? new Date(b.scheduled_date).getTime() : 0; break;
        case "inspector_name":  aVal = a.inspector_name || ""; bVal = b.inspector_name || ""; break;
        case "status":          aVal = a.status || ""; bVal = b.status || ""; break;
        case "score":           aVal = a.score ?? -1; bVal = b.score ?? -1; break;
        default: aVal = ""; bVal = "";
      }
      if (typeof aVal === "string") {
        const cmp = aVal.localeCompare(bVal);
        return sortDir === "asc" ? cmp : -cmp;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

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
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export filtered inspections to CSV"
          >
            <span aria-hidden="true">⬇</span> Export CSV
          </button>
          <button
            onClick={() => { setShowModal(true); setFormError(null); setForm(EMPTY_FORM); }}
            className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
          >
            <span className="text-base">+</span> Schedule Inspection
          </button>
        </div>
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
              {[
                { col: "restaurant_name", label: "Restaurant" },
                { col: "inspection_type", label: "Type" },
                { col: "scheduled_date", label: "Date" },
                { col: "inspector_name", label: "Inspector" },
                { col: "status", label: "Status" },
                { col: "score", label: "Score" },
              ].map(({ col, label }) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none hover:text-gray-800 hover:bg-gray-100 transition"
                >
                  {label}<SortIcon col={col} />
                </th>
              ))}
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
              paginated.map((insp: any) => (
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

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-sm text-gray-500">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 text-sm font-semibold rounded-lg transition ${
                  page === safePage
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Complete Inspection Modal */}
      {completeTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Complete inspection">
          <div ref={completeModalRef} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Schedule inspection">
          <div ref={scheduleModalRef} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
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
