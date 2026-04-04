import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RestaurantGuard — AI Compliance Copilot",
  description: "AI-powered food safety compliance for independent restaurants",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <div className="min-h-screen flex">
          {/* Sidebar */}
          <aside className="w-64 bg-emerald-900 text-white flex flex-col fixed h-full">
            <div className="p-6 border-b border-emerald-800">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">🛡️</span> RestaurantGuard
              </h1>
              <p className="text-emerald-300 text-xs mt-1">AI Compliance Copilot</p>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-800 transition text-sm font-medium">
                <span>📊</span> Dashboard
              </a>
              <a href="/restaurants" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-800 transition text-sm font-medium">
                <span>🏪</span> Restaurants
              </a>
              <a href="/inspections" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-800 transition text-sm font-medium">
                <span>📋</span> Inspections
              </a>
              <a href="/checklists" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-800 transition text-sm font-medium">
                <span>✅</span> Checklists
              </a>
              <a href="/corrective-actions" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-800 transition text-sm font-medium">
                <span>⚠️</span> Corrective Actions
              </a>
              <a href="/alerts" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-emerald-800 transition text-sm font-medium">
                <span>🔔</span> Alerts
              </a>
            </nav>
            <div className="p-4 border-t border-emerald-800 text-xs text-emerald-400">
              v1.0 — Factory Build
            </div>
          </aside>
          {/* Main content */}
          <main className="flex-1 ml-64 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
