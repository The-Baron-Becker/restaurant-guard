"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/restaurants", label: "Restaurants", icon: "🏪" },
  { href: "/inspections", label: "Inspections", icon: "📋" },
  { href: "/checklists", label: "Checklists", icon: "✅" },
  { href: "/corrective-actions", label: "Corrective Actions", icon: "⚠️" },
  { href: "/alerts", label: "Alerts", icon: "🔔", badgeKey: "alerts" },
  { href: "/reports", label: "Reports", icon: "📈" },
];
export default function SidebarNav({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);

  useEffect(() => {
    const fetchUnread = () => {
      fetch(apiUrl("/api/alerts?unread=true"))
        .then((r) => r.json())
        .then((data: any[]) => {
          const count = Array.isArray(data) ? data.filter((a) => !a.is_read).length : 0;
          setUnreadAlerts(count);
        })
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, []);
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <nav className="flex-1 p-4 space-y-1" aria-label="Main sections">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const badge = item.badgeKey === "alerts" && unreadAlerts > 0 ? unreadAlerts : null;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              aria-label={badge !== null ? `${item.label}, ${badge} unread` : item.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900 ${
                active
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "hover:bg-emerald-800 text-emerald-100"
              }`}
            >              <span>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {badge !== null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center ${
                  active ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                }`}>
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
              {active && badge === null && (
                <span className="ml-auto w-1.5 h-1.5 bg-emerald-300 rounded-full" />
              )}
            </a>
          );
        })}
      </nav>
    </>
  );
}