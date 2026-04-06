"use client";
import { useState } from "react";
import SidebarNav from "@/components/SidebarNav";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      </div>

      {/* Sidebar - desktop: fixed, mobile: slide-over */}
      <aside className={`
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
        <div className="p-4 border-t border-emerald-800 text-xs text-emerald-400">
          v1.0 — Factory Build
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
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}