"use client";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { CardSkeleton } from "@/components/Skeleton";

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/checklists"))
      .then((r) => r.json())
      .then(setChecklists)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadChecklist = async (id: number) => {
    const res = await fetch(apiUrl(`/api/checklists/${id}`));
    const data = await res.json();
    setSelected(data);
  };

  if (loading) return (
    <div>
      <div className="mb-8"><div className="h-8 bg-gray-200 rounded w-40 animate-pulse" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">{[1,2,3,4].map(i => <CardSkeleton key={i} />)}</div>
        <div className="lg:col-span-2"><div className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" /></div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Checklists</h1>
        <p className="text-gray-500 mt-1">HACCP checklists and inspection prep templates</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {checklists.map((cl: any) => (
            <button key={cl.id} onClick={() => loadChecklist(cl.id)}
              className={`w-full text-left bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition ${
                selected?.id === cl.id ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-sm text-gray-900">{cl.name}</h3>
                {cl.is_template && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Template</span>}
              </div>
              <p className="text-xs text-gray-500">{cl.category}</p>
            </button>
          ))}
        </div>
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{selected.name}</h2>
              <p className="text-sm text-gray-500 mb-4">{selected.category} — {selected.items?.length || 0} items</p>
              <div className="space-y-2">
                {selected.items?.map((item: any, idx: number) => (
                  <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg ${item.is_critical ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
                    <span className="text-gray-400 text-sm font-mono w-6 text-right flex-shrink-0">{idx + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{item.description}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-gray-400">{item.category}</span>
                        {item.is_critical && <span className="text-xs font-semibold text-red-600">Critical</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16 px-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">📝</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Select a checklist</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">Choose a checklist from the left panel to view its items and requirements.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
