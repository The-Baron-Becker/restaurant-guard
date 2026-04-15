"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api";

type PaletteItem = {
  id: string;
  title: string;
  subtitle?: string;
  group: "Pages" | "Restaurants" | "Inspections" | "Actions";
  icon: string;
  href?: string;
  onSelect?: () => void;
};

const STATIC_PAGES: PaletteItem[] = [
  { id: "p-dashboard", title: "Dashboard", subtitle: "Compliance overview", group: "Pages", icon: "📊", href: "/" },
  { id: "p-restaurants", title: "Restaurants", subtitle: "All registered locations", group: "Pages", icon: "🏪", href: "/restaurants" },
  { id: "p-inspections", title: "Inspections", subtitle: "Scheduled & completed visits", group: "Pages", icon: "📋", href: "/inspections" },
  { id: "p-checklists", title: "Checklists", subtitle: "HACCP templates", group: "Pages", icon: "✅", href: "/checklists" },
  { id: "p-corrective", title: "Corrective Actions", subtitle: "Open remediation items", group: "Pages", icon: "⚠️", href: "/corrective-actions" },
  { id: "p-alerts", title: "Alerts", subtitle: "Compliance notifications", group: "Pages", icon: "🔔", href: "/alerts" },
  { id: "p-reports", title: "Reports", subtitle: "Portfolio analytics", group: "Pages", icon: "📈", href: "/reports" },
];

interface Restaurant { id: number; name: string; type?: string; city?: string; state?: string; }
interface Inspection { id: number; restaurant_name?: string; inspection_type?: string; status?: string; scheduled_date?: string; }

export default function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Fetch data lazily the first time the palette opens.
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    // Focus input on open
    setTimeout(() => inputRef.current?.focus(), 30);
    if (restaurants.length > 0 || inspections.length > 0) return;
    setLoading(true);
    Promise.all([
      fetchApi<Restaurant[]>("/api/restaurants").catch(() => []),
      fetchApi<Inspection[]>("/api/inspections").catch(() => []),
    ])
      .then(([r, i]) => {
        setRestaurants(Array.isArray(r) ? r : []);
        setInspections(Array.isArray(i) ? i : []);
      })
      .finally(() => setLoading(false));
  }, [open, restaurants.length, inspections.length]);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const match = (...parts: (string | undefined)[]) =>
      parts.filter(Boolean).join(" ").toLowerCase().includes(q);

    const pageResults = STATIC_PAGES.filter((p) => !q || match(p.title, p.subtitle));
    const restaurantResults: PaletteItem[] = restaurants
      .filter((r) => !q || match(r.name, r.city, r.state, r.type))
      .slice(0, 12)
      .map((r) => ({
        id: `r-${r.id}`,
        title: r.name,
        subtitle: [r.type, r.city && `${r.city}${r.state ? `, ${r.state}` : ""}`].filter(Boolean).join(" · "),
        group: "Restaurants",
        icon: "🏪",
        href: `/restaurants/${r.id}`,
      }));
    const inspectionResults: PaletteItem[] = inspections
      .filter((i) => !q || match(i.restaurant_name, i.inspection_type, i.status))
      .slice(0, 8)
      .map((i) => ({
        id: `i-${i.id}`,
        title: `${i.restaurant_name || "Inspection"} — ${i.inspection_type || "visit"}`,
        subtitle: [i.status, i.scheduled_date && new Date(i.scheduled_date).toLocaleDateString()]
          .filter(Boolean)
          .join(" · "),
        group: "Inspections",
        icon: "📋",
        href: `/inspections/${i.id}`,
      }));
    const quickActions: PaletteItem[] = ([
      {
        id: "a-new-restaurant",
        title: "New Restaurant",
        subtitle: "Register a new location",
        group: "Actions",
        icon: "➕",
        href: "/restaurants",
      },
      {
        id: "a-new-inspection",
        title: "Schedule Inspection",
        subtitle: "Plan a compliance visit",
        group: "Actions",
        icon: "🗓️",
        href: "/inspections",
      },
      {
        id: "a-view-alerts",
        title: "View Unread Alerts",
        subtitle: "Jump to active notifications",
        group: "Actions",
        icon: "🔔",
        href: "/alerts",
      },
    ] as PaletteItem[]).filter((a) => !q || match(a.title, a.subtitle));

    return [...pageResults, ...quickActions, ...restaurantResults, ...inspectionResults];
  }, [query, restaurants, inspections]);

  const flatItems = items;

  useEffect(() => {
    if (activeIndex >= flatItems.length) setActiveIndex(0);
  }, [flatItems.length, activeIndex]);

  const handleSelect = (item: PaletteItem) => {
    onClose();
    if (item.onSelect) item.onSelect();
    else if (item.href) router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(flatItems.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[activeIndex];
      if (item) handleSelect(item);
    }
  };

  if (!open) return null;

  // Group items for rendering while keeping global activeIndex consistent.
  const groupOrder: PaletteItem["group"][] = ["Pages", "Actions", "Restaurants", "Inspections"];
  const grouped = groupOrder
    .map((g) => ({ group: g, entries: flatItems.filter((it) => it.group === g) }))
    .filter((g) => g.entries.length > 0);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[10vh] px-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center px-4 border-b border-gray-100">
          <span className="text-gray-400 text-lg mr-3">🔎</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search restaurants, inspections, pages…"
            className="flex-1 py-4 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
          />
          <kbd className="text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 ml-2">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-2" role="listbox">
          {loading && flatItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">Loading…</div>
          ) : flatItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">No results for &ldquo;{query}&rdquo;</div>
          ) : (
            grouped.map((section) => (
              <div key={section.group} className="mb-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold px-4 pt-2 pb-1">{section.group}</p>
                {section.entries.map((item) => {
                  const globalIndex = flatItems.indexOf(item);
                  const isActive = globalIndex === activeIndex;
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setActiveIndex(globalIndex)}
                      onClick={() => handleSelect(item)}
                      role="option"
                      aria-selected={isActive}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition ${
                        isActive ? "bg-emerald-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-gray-900 truncate">{item.title}</span>
                        {item.subtitle && (
                          <span className="block text-xs text-gray-500 truncate">{item.subtitle}</span>
                        )}
                      </span>
                      {isActive && (
                        <kbd className="text-[10px] text-emerald-700 border border-emerald-200 bg-emerald-100 rounded px-1.5 py-0.5">⏎</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-[11px] text-gray-500 flex items-center gap-4">
          <span><kbd className="border border-gray-200 rounded px-1">↑</kbd> <kbd className="border border-gray-200 rounded px-1">↓</kbd> Navigate</span>
          <span><kbd className="border border-gray-200 rounded px-1">⏎</kbd> Select</span>
          <span className="ml-auto"><kbd className="border border-gray-200 rounded px-1">?</kbd> Shortcuts</span>
        </div>
      </div>
    </div>
  );
}
