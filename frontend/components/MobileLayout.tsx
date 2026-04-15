"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SidebarNav from "@/components/SidebarNav";
import { useTheme } from "@/components/ThemeProvider";
import CommandPalette from "@/components/CommandPalette";
import ShortcutsHelp from "@/components/ShortcutsHelp";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { resolved, toggle } = useTheme();
  const router = useRouter();

  // Global keyboard listeners for Cmd/Ctrl+K, "?" shortcuts, and G-prefix navigation.
  useEffect(() => {
    let gPrefixActive = false;
    let gPrefixTimer: ReturnType<typeof setTimeout> | null = null;
    const clearGPrefix = () => {
      gPrefixActive = false;
      if (gPrefixTimer) clearTimeout(gPrefixTimer);
    };

    const isEditable = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el.isContentEditable
      );
    };

    const onKey = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K — open command palette
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen(true);
        setShortcutsOpen(false);
        return;
      }
      // Ignore plain-key shortcuts when typing in a form field
      if (isEditable(e.target)) return;
      // "?" — shortcuts help
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen(true);
        setPaletteOpen(false);
        return;
      }
      // "G" prefix navigation: G then D/R/I/A/P/C
      if (e.key === "g" || e.key === "G") {
        gPrefixActive = true;
        if (gPrefixTimer) clearTimeout(gPrefixTimer);
        gPrefixTimer = setTimeout(clearGPrefix, 1200);
        return;
      }
      if (gPrefixActive) {
        const map: Record<string, string> = {
          d: "/",
          r: "/restaurants",
          i: "/inspections",
          a: "/alerts",
          p: "/reports",
          c: "/checklists",
        };
        const target = map[e.key.toLowerCase()];
        if (target) {
          e.preventDefault();
          router.push(target);
        }
        clearGPrefix();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (gPrefixTimer) clearTimeout(gPrefixTimer);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex">
      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-emerald-900 flex items-center px-4 z-50 lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white p-2 -ml-2 rounded-lg hover:bg-emerald-800 transition"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {sidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>        <h1 className="text-lg font-bold text-white ml-3 flex items-center gap-2">
          <span>🛡️</span> RestaurantGuard
        </h1>
        <button
          onClick={() => setPaletteOpen(true)}
          aria-label="Open command palette"
          className="ml-auto text-emerald-200 hover:text-white p-2 rounded-lg hover:bg-emerald-800 transition"
        >
          🔎
        </button>
      </div>

      {/* Sidebar - desktop: fixed, mobile: slide-over */}
      <aside
        aria-label="Primary navigation"
        aria-hidden={typeof window !== "undefined" && window.innerWidth < 1024 && !sidebarOpen ? "true" : undefined}
        className={`
        fixed h-full bg-emerald-900 text-white flex flex-col z-50
        transition-transform duration-300 ease-in-out
        w-64
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-emerald-800 hidden lg:block">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🛡️</span> RestaurantGuard
          </h1>
          <p className="text-emerald-300 text-xs mt-1">AI Compliance Copilot</p>
        </div>
        {/* Spacer for mobile header */}
        <div className="h-14 lg:hidden" />
        <SidebarNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="p-4 border-t border-emerald-800 flex items-center justify-between">
          <span className="text-xs text-emerald-400">v1.0 — Factory Build</span>
          <button
            onClick={toggle}
            className="text-emerald-300 hover:text-white p-1.5 rounded-lg hover:bg-emerald-800 transition"
            aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
          >
            {resolved === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </aside>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main id="main-content" role="main" className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8 focus:outline-none" tabIndex={-1}>
        {/* Desktop-only top toolbar with command-palette launcher */}
        <div className="hidden lg:flex items-center justify-end mb-4 -mt-1">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-1.5 hover:border-emerald-300 hover:text-gray-700 transition shadow-sm"
            aria-label="Open command palette"
          >
            <span>🔎</span>
            <span>Search or jump to…</span>
            <kbd className="font-mono text-[10px] border border-gray-200 rounded px-1 py-0.5 ml-2 bg-gray-50">⌘K</kbd>
          </button>
          <button
            onClick={() => setShortcutsOpen(true)}
            aria-label="Show keyboard shortcuts"
            className="ml-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 hover:border-emerald-300 hover:text-gray-700 transition shadow-sm"
          >
            ?
          </button>
        </div>
        {children}
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <ShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}