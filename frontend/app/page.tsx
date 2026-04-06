"use client";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { DashboardSkeleton } from "@/components/Skeleton";

interface DashboardStats {
  total_restaurants: number;
  upcoming_inspections: number;
  open_corrective_actions: number;
  unread_alerts: number;
  average_score: number;
  recent_inspections: any[];
  upcoming_inspection_list: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/dashboard/stats"))
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!stats) return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-16 px-6">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
        <span className="text-3xl">⚠️</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">Unable to load dashboard</h3>
      <p className="text-sm text-gray-500 mb-6">Check that the API server is running and try again.</p>
      <button onClick={() => window.location.reload()}
        className="bg-emerald-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition">
        Retry
      </button>
    </div>
  );

  const scoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600";
    if (score >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Food safety compliance overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurants</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_restaurants}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</p>
          <p className={`text-3xl font-bold mt-2 ${scoreColor(stats.average_score)}`}>{stats.average_score}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Upcoming Inspections</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.upcoming_inspections}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Open Actions</p>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats.open_corrective_actions}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Unread Alerts</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{stats.unread_alerts}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Inspections</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.upcoming_inspection_list.length === 0 ? (
              <p className="p-6 text-gray-400 text-sm">No upcoming inspections</p>
            ) : (
              stats.upcoming_inspection_list.map((insp: any) => {
                const daysUntil = Math.ceil((new Date(insp.scheduled_date).getTime() - Date.now()) / (1000*60*60*24));
                return (
                  <div key={insp.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{insp.restaurant_name}</p>
                      <p className="text-sm text-gray-500">{insp.inspection_type} — {new Date(insp.scheduled_date).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      daysUntil <= 7 ? 'bg-red-100 text-red-700' : daysUntil <= 14 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {daysUntil <= 0 ? "Today" : `${daysUntil}d`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Inspections</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recent_inspections.length === 0 ? (
              <p className="p-6 text-gray-400 text-sm">No completed inspections</p>
            ) : (
              stats.recent_inspections.map((insp: any) => (
                <div key={insp.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{insp.restaurant_name}</p>
                    <p className="text-sm text-gray-500">{insp.inspector_name} — {new Date(insp.completed_date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-2xl font-bold ${scoreColor(insp.score)}`}>
                    {insp.score}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
