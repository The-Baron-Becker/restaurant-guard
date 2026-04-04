"use client";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/inspections"))
      .then((r) => r.json())
      .then(setInspections)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-gray-400">Loading...</p></div>;

  const scoreColor = (score: number | null) => {
    if (!score) return "";
    if (score >= 90) return "text-emerald-600 bg-emerald-50";
    if (score >= 80) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "Completed": return "bg-emerald-100 text-emerald-700";
      case "Scheduled": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inspections</h1>
        <p className="text-gray-500 mt-1">Track all health inspections across your restaurants</p>
      </div>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inspections.map((insp: any) => (
              <tr key={insp.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-medium text-gray-900">{insp.restaurant_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{insp.inspection_type}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(insp.scheduled_date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{insp.inspector_name || "—"}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge(insp.status)}`}>{insp.status}</span>
                </td>
                <td className="px-6 py-4">
                  {insp.score ? (
                    <span className={`text-lg font-bold px-2 py-0.5 rounded ${scoreColor(insp.score)}`}>{insp.score}</span>
                  ) : <span className="text-gray-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
