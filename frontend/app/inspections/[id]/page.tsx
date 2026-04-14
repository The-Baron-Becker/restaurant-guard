"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";

interface Response {
  id: number;
  checklist_item_id: number;
  status: string;
  notes?: string | null;
  photo_url?: string | null;
  item_description: string;
  is_critical: boolean;
  category: string;
}

interface Inspection {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  checklist_id: number | null;
  inspector_name: string | null;
  inspection_type: string;
  scheduled_date: string | null;
  completed_date: string | null;
  status: string;
  score: number | null;
  notes: string | null;
  responses: Response[];
}

const statusBadge = (status: string) => {
  switch (status) {
    case "Completed": return "bg-emerald-100 text-emerald-700";
    case "Scheduled": return "bg-blue-100 text-blue-700";
    case "Cancelled": return "bg-gray-100 text-gray-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

const responseStatusBadge = (s: string) => {
  switch (s) {
    case "pass": return "bg-emerald-100 text-emerald-700";
    case "fail": return "bg-red-100 text-red-700";
    case "na": return "bg-gray-100 text-gray-500";
    case "pending": return "bg-yellow-100 text-yellow-700";
    default: return "bg-gray-100 text-gray-700";
  }
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

const scoreColor = (score: number | null) => {
  if (score === null || score === undefined) return "text-gray-400";
  if (score >= 90) return "text-emerald-600";
  if (score >= 80) return "text-yellow-600";
  return "text-red-600";
};

export default function InspectionDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [correctiveActions, setCorrectiveActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    Promise.all([
      fetchApi<Inspection>(`/api/inspections/${id}`),
      fetchApi<any[]>("/api/corrective-actions"),
    ])
      .then(([insp, allCAs]) => {
        if (cancelled) return;
        setInspection(insp);
        setCorrectiveActions(
          Array.isArray(allCAs)
            ? allCAs.filter((a) => a.inspection_id === Number(id))
            : []
        );
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load inspection");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="h-8 bg-gray-200 rounded w-64 mb-4 animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }
  if (error || !inspection) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-16 px-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
          <span className="text-3xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Inspection not found</h3>
        <p className="text-sm text-gray-500 mb-6">
          We couldn&apos;t load the requested inspection. It may have been deleted.
        </p>
        <a href="/inspections" className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition">
          Back to inspections
        </a>
      </div>
    );
  }

  const {
    restaurant_name, restaurant_id, inspector_name, inspection_type,
    scheduled_date, completed_date, status, score, notes, responses,
  } = inspection;

  const passedCount = responses.filter((r) => r.status === "pass").length;
  const failedCount = responses.filter((r) => r.status === "fail").length;
  const pendingCount = responses.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="mb-6">
        <a href="/inspections" className="text-sm text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1">
          ← Back to inspections
        </a>
      </div>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Inspection #{inspection.id}
          </h1>
          <p className="text-gray-500 mt-1">
            <a href={`/restaurants/${restaurant_id}`} className="hover:text-emerald-700 underline">
              {restaurant_name}
            </a>
            {" · "}
            {inspection_type}
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusBadge(status)}`}>
          {status}
        </span>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Score</p>
            <p className={`text-2xl font-bold mt-1 ${scoreColor(score)}`}>{score ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Inspector</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{inspector_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</p>
            <p className="text-sm text-gray-900 mt-1">{scheduled_date ? new Date(scheduled_date).toLocaleDateString() : "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</p>
            <p className="text-sm text-gray-900 mt-1">{completed_date ? new Date(completed_date).toLocaleDateString() : "—"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Responses</p>
            <p className="text-sm text-gray-900 mt-1">
              <span className="text-emerald-700 font-semibold">{passedCount}</span> pass ·{" "}
              <span className="text-red-700 font-semibold">{failedCount}</span> fail
              {pendingCount > 0 && <> · <span className="text-yellow-700 font-semibold">{pendingCount}</span> pending</>}
            </p>
          </div>
        </div>
      </div>

      {/* Inspector notes */}
      {notes && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Inspector Notes</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{notes}</p>
        </div>
      )}

      {/* Checklist responses */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Checklist Responses</h2>
          <p className="text-xs text-gray-500">{responses.length} item{responses.length !== 1 ? "s" : ""}</p>
        </div>
        {responses.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">
            No checklist responses recorded yet for this inspection.
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {responses.map((r) => (
              <li key={r.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {r.category}
                      </span>
                      {r.is_critical && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-700">
                          Critical
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{r.item_description}</p>
                    {r.notes && (
                      <p className="text-xs text-gray-600 mt-1 italic">“{r.notes}”</p>
                    )}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${responseStatusBadge(r.status)}`}>
                    {r.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Linked corrective actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Linked Corrective Actions</h2>
          <p className="text-xs text-gray-500">
            {correctiveActions.length} item{correctiveActions.length !== 1 ? "s" : ""}
          </p>
        </div>
        {correctiveActions.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">
            No corrective actions have been logged against this inspection.
          </p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {correctiveActions.map((ca) => (
              <li key={ca.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{ca.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {ca.assigned_to && <>Assigned to <span className="font-medium text-gray-700">{ca.assigned_to}</span> · </>}
                    {ca.due_date && <>Due {new Date(ca.due_date).toLocaleDateString()} · </>}
                    Status: <span className="font-medium text-gray-700">{ca.status}</span>
                  </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap ${severityBadge(ca.severity)}`}>
                  {ca.severity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
