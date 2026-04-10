"use client";
import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/useAutoRefresh";

interface RefreshBarProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function RefreshBar({ lastUpdated, onRefresh, refreshing }: RefreshBarProps) {
  const [display, setDisplay] = useState("");

  // Update relative time every 10s
  useEffect(() => {
    setDisplay(timeAgo(lastUpdated));
    const id = setInterval(() => setDisplay(timeAgo(lastUpdated)), 10000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  if (!lastUpdated) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <span>Updated {display}</span>
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-emerald-600 disabled:opacity-50 transition"
        title="Refresh data"
      >
        <span className={`inline-block ${refreshing ? "animate-spin" : ""}`}>↻</span>
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
