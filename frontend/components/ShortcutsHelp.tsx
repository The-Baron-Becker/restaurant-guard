"use client";
import { useEffect } from "react";

type Shortcut = {
  keys: string[];
  label: string;
};

const SHORTCUTS: { group: string; items: Shortcut[] }[] = [
  {
    group: "Navigation",
    items: [
      { keys: ["⌘", "K"], label: "Open command palette" },
      { keys: ["Ctrl", "K"], label: "Open command palette (Windows/Linux)" },
      { keys: ["G", "D"], label: "Go to Dashboard" },
      { keys: ["G", "R"], label: "Go to Restaurants" },
      { keys: ["G", "I"], label: "Go to Inspections" },
      { keys: ["G", "A"], label: "Go to Alerts" },
      { keys: ["G", "P"], label: "Go to Reports" },
    ],
  },
  {
    group: "General",
    items: [
      { keys: ["?"], label: "Show this shortcuts panel" },
      { keys: ["Esc"], label: "Close dialogs & palettes" },
      { keys: ["R"], label: "Refresh the current data view" },
    ],
  },
];

export default function ShortcutsHelp({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
            <p className="text-xs text-gray-500 mt-0.5">Move faster around RestaurantGuard.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts panel"
            className="text-gray-400 hover:text-gray-700 p-1"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map((section) => (
            <div key={section.group} className="mb-5 last:mb-0">
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2">
                {section.group}
              </p>
              <ul className="space-y-2">
                {section.items.map((sc) => (
                  <li key={sc.label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{sc.label}</span>
                    <span className="flex items-center gap-1">
                      {sc.keys.map((k, idx) => (
                        <kbd
                          key={idx}
                          className="text-xs font-mono text-gray-700 border border-gray-200 bg-gray-50 rounded px-1.5 py-0.5 min-w-[22px] text-center"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          Press <kbd className="border border-gray-200 rounded px-1">Esc</kbd> to close.
        </div>
      </div>
    </div>
  );
}
