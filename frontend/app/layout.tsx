import type { Metadata } from "next";
import "./globals.css";
import SidebarNav from "@/components/SidebarNav";

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
            <SidebarNav />
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
