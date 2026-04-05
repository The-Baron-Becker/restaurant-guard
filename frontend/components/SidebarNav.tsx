"use client";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/restaurants", label: "Restaurants", icon: "🏪" },
  { href: "/inspections", label: "Inspections", icon: "📋" },
  { href: "/checklists", label: "Checklists", icon: "✅" },
  { href: "/corrective-actions", label: "Corrective Actions", icon: "⚠️" },
  { href: "/alerts", label: "Alerts", icon: "🔔" },
];

export default function SidebarNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex-1 p-4 space-y-1">
      {NAV_ITEMS.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-sm font-medium ${
            isActive(item.href)
              ? "bg-emerald-700 text-white shadow-sm"
              : "hover:bg-emerald-800 text-emerald-100"
          }`}
        >
          <span>{item.icon}</span>
          {item.label}
          {isActive(item.href) && (
            <span className="ml-auto w-1.5 h-1.5 bg-emerald-300 rounded-full" />
          )}
        </a>
      ))}
    </nav>
  );
}
