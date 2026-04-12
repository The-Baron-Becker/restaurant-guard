"use client";
import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { CardSkeleton } from "@/components/Skeleton";
import { useToast } from "@/components/Toast";
import { useModalA11y } from "@/lib/useModal";

const CATEGORIES = ["General", "Temperature Control", "Food Storage", "Personal Hygiene", "Cleaning & Sanitation", "Equipment", "Pest Control"];

interface ChecklistItem {
  id?: number;
  description: string;
  category: string;
  is_critical: boolean;
}

interface ChecklistForm {
  name: string;
  category: string;
  description: string;
  is_template: boolean;
  items: ChecklistItem[];
}

const EMPTY_CHECKLIST: ChecklistForm = {
  name: "",
  category: "General",
  description: "",
  is_template: false,
  items: [],
};

const EMPTY_ITEM: ChecklistItem = {
  description: "",
  category: "General",
  is_critical: false,
};

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [form, setForm] = useState<ChecklistForm>(EMPTY_CHECKLIST);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newItem, setNewItem] = useState<ChecklistItem>(EMPTY_ITEM);
  const { toast } = useToast();
  const closeModal = useCallback(() => { setShowModal(false); setEditTarget(null); }, []);
  const closeDelete = useCallback(() => setDeleteConfirm(null), []);
  const modalRef = useModalA11y(showModal, closeModal);
  const deleteModalRef = useModalA11y(!!deleteConfirm, closeDelete);

  useEffect(() => {
    fetchApi("/api/checklists")
      .then(setChecklists)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_CHECKLIST);
    setNewItem(EMPTY_ITEM);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (cl: any) => {
    setEditTarget(cl);
    setForm({
      name: cl.name || "",
      category: cl.category || "General",
      description: cl.description || "",
      is_template: cl.is_template || false,
      items: cl.items || [],
    });
    setNewItem(EMPTY_ITEM);
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Checklist name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const method = editTarget ? "PATCH" : "POST";
      const path = editTarget
        ? `/api/checklists/${editTarget.id}`
        : "/api/checklists";
      const saved = await fetchApi(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          description: form.description,
          is_template: form.is_template,
          items: form.items,
        }),
      });
      if (editTarget) {
        setChecklists((prev: any[]) =>
          prev.map((cl: any) => (cl.id === saved.id ? { ...saved, items: form.items } : cl))
        );
        setSelected((prev: any) =>
          prev && prev.id === saved.id ? { ...saved, items: form.items } : prev
        );
        toast("Checklist updated successfully");
      } else {
        setChecklists((prev: any[]) => [...prev, { ...saved, items: form.items }]);
        toast("Checklist added successfully");
      }
      setShowModal(false);
      setEditTarget(null);
      setForm(EMPTY_CHECKLIST);
    } catch {
      setError("Something went wrong. Please try again.");
      toast("Failed to save checklist", "error");
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    if (!newItem.description.trim()) {
      setError("Item description is required.");
      return;
    }
    setForm((prev: ChecklistForm) => ({
      ...prev,
      items: [...prev.items, { ...newItem }],
    }));
    setNewItem(EMPTY_ITEM);
    setError(null);
  };

  const removeItem = (idx: number) => {
    setForm((prev: ChecklistForm) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const moveItem = (idx: number, direction: "up" | "down") => {
    const newItems = [...form.items];
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
    setForm((prev: ChecklistForm) => ({ ...prev, items: newItems }));
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await fetchApi(`/api/checklists/${deleteConfirm.id}`, {
        method: "DELETE",
      });
      setChecklists((prev: any[]) =>
        prev.filter((cl: any) => cl.id !== deleteConfirm.id)
      );
      if (selected?.id === deleteConfirm.id) {
        setSelected(null);
      }
      setDeleteConfirm(null);
      toast("Checklist deleted");
    } catch {
      toast("Failed to delete checklist", "error");
    } finally {
      setDeleting(false);
    }
  };

  const loadChecklist = async (id: number) => {
    const data = await fetchApi(`/api/checklists/${id}`);
    setSelected(data);
  };

  if (loading)
    return (
      <div>
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />
          </div>
        </div>
      </div>
    );

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Checklists</h1>
          <p className="text-gray-500 mt-1">
            HACCP checklists and inspection prep templates
          </p>
        </div>
        <button
          onClick={openAdd}
          className="bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
        >
          <span className="text-base">+</span> New Checklist
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {checklists.map((cl: any) => (
            <div
              key={cl.id}
              className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition ${
                selected?.id === cl.id
                  ? "border-emerald-500 ring-2 ring-emerald-200"
                  : "border-gray-200"
              }`}
            >
              <button
                onClick={() => loadChecklist(cl.id)}
                className="w-full text-left mb-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-sm text-gray-900">
                    {cl.name}
                  </h3>
                  {cl.is_template && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                      Template
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{cl.category}</p>
              </button>
              <div className="flex gap-2 border-t border-gray-100 pt-3">
                <button
                  onClick={() => openEdit(cl)}
                  className="flex-1 text-xs font-semibold text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 py-1.5 transition rounded"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(cl)}
                  className="flex-1 text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 py-1.5 transition rounded"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {selected.name}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {selected.category} — {selected.items?.length || 0} items
              </p>
              <div className="space-y-2">
                {selected.items?.map((item: any, idx: number) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      item.is_critical
                        ? "bg-red-50 border border-red-100"
                        : "bg-gray-50"
                    }`}
                  >
                    <span className="text-gray-400 text-sm font-mono w-6 text-right flex-shrink-0">
                      {idx + 1}.
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{item.description}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {item.category}
                        </span>
                        {item.is_critical && (
                          <span className="text-xs font-semibold text-red-600">
                            Critical
                          </span>
                        )}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Select a checklist
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Choose a checklist from the left panel to view its items and
                requirements.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Delete checklist confirmation"
        >
          <div
            ref={deleteModalRef}
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Delete Checklist?
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              This will permanently delete{" "}
              <span className="font-semibold text-gray-800">
                {deleteConfirm.name}
              </span>{" "}
              and all its items.
            </p>
            <p className="text-xs font-semibold text-red-600 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={
            editTarget ? "Edit checklist" : "Add checklist"
          }
        >
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-gray-900">
                {editTarget ? "Edit Checklist" : "New Checklist"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditTarget(null);
                }}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Checklist Name *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="e.g. Daily Temperature Check"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Is Template
                  </label>
                  <div className="flex items-center h-10">
                    <input
                      type="checkbox"
                      checked={form.is_template}
                      onChange={(e) =>
                        setForm({ ...form, is_template: e.target.checked })
                      }
                      className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-400"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      Use as template
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Additional details about this checklist..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-semibold text-sm text-gray-900 mb-3">
                  Checklist Items
                </h3>
                <div className="space-y-3 mb-4">
                  {form.items.map((item: ChecklistItem, idx: number) => (
                    <div
                      key={idx}
                      className={`flex items-start gap-2 p-3 rounded-lg ${
                        item.is_critical
                          ? "bg-red-50 border border-red-100"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <span className="text-gray-400 text-sm font-mono w-5 flex-shrink-0">
                        {idx + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 break-words">
                          {item.description}
                        </p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500">
                            {item.category}
                          </span>
                          {item.is_critical && (
                            <span className="text-xs font-semibold text-red-600">
                              Critical
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => moveItem(idx, "up")}
                            className="text-gray-400 hover:text-gray-600 text-xs p-1"
                            title="Move up"
                          >
                            ↑
                          </button>
                        )}
                        {idx < form.items.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveItem(idx, "down")}
                            className="text-gray-400 hover:text-gray-600 text-xs p-1"
                            title="Move down"
                          >
                            ↓
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-gray-400 hover:text-red-600 text-xs p-1"
                          title="Delete item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-semibold text-gray-700 mb-3">
                    Add New Item
                  </h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newItem.description}
                      onChange={(e) =>
                        setNewItem({ ...newItem, description: e.target.value })
                      }
                      placeholder="Item description..."
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newItem.category}
                        onChange={(e) =>
                          setNewItem({ ...newItem, category: e.target.value })
                        }
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newItem.is_critical}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              is_critical: e.target.checked,
                            })
                          }
                          className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-400"
                        />
                        <span className="ml-2 text-xs text-gray-600">
                          Critical
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={addItem}
                      className="w-full border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      + Add Item
                    </button>
                  </div>
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
                  onClick={() => {
                    setShowModal(false);
                    setEditTarget(null);
                  }}
                  className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {saving ? "Saving..." : editTarget ? "Save Changes" : "Create Checklist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}