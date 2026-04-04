"use client";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

const EMPTY_FORM = {
  name: "",
  type: "Full Service",
  address: "",
  city: "",
  state: "",
  zip: "",
  phone: "",
  health_dept_id: "",
  next_inspection_date: "",
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/restaurants"))
      .then((r) => r.json())
      .then(setRestaurants)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Restaurant name is required."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/api/restaurants"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          next_inspection_date: form.next_inspection_date || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const created = await res.json();
      setRestaurants((prev) => [...prev, created]);
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Loading...</p>
      </div>
    );

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurants</h1>
          <p className="text-gray-500 mt-1">Manage your restaurant locations</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(null); setForm(EMPTY_FORM); }}
          className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <span className="text-base">+</span> Add Restaurant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {restaurants.map((r: any) => {
          const daysUntil = r.next_inspection_date
            ? Math.ceil(
                (new Date(r.next_inspection_date).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )
            : null;
          return (
            <div
              key={r.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{r.name}</h3>
                  <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 mt-1">
                    {r.type}
                  </span>
                </div>
                <span className="text-xs text-gray-400 font-mono">{r.health_dept_id}</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">{r.address}</p>
              <p className="text-sm text-gray-500 mb-3">
                {r.city}, {r.state} {r.zip}
              </p>
              {r.phone && <p className="text-sm text-gray-600 mb-3">{r.phone}</p>}
              {daysUntil !== null && (
                <div
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg text-center ${
                    daysUntil <= 7
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : daysUntil <= 21
                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  Next Inspection: {new Date(r.next_inspection_date).toLocaleDateString()} ({daysUntil}d)
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Restaurant Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add Restaurant</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Restaurant Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. The Green Fork"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option>Full Service</option>
                    <option>Quick Service</option>
                    <option>Ghost Kitchen</option>
                    <option>Caterer</option>
                    <option>Food Truck</option>
                    <option>Bakery</option>
                    <option>Bar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Health Dept ID</label>
                  <input
                    type="text"
                    value={form.health_dept_id}
                    onChange={(e) => setForm({ ...form, health_dept_id: e.target.value })}
                    placeholder="e.g. HD-2024-0042"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="123 Main St"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="CA"
                      maxLength={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">ZIP</label>
                    <input
                      type="text"
                      value={form.zip}
                      onChange={(e) => setForm({ ...form, zip: e.target.value })}
                      placeholder="90210"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="(555) 555-5555"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Next Inspection Date</label>
                  <input
                    type="date"
                    value={form.next_inspection_date}
                    onChange={(e) => setForm({ ...form, next_inspection_date: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {saving ? "Adding…" : "Add Restaurant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
