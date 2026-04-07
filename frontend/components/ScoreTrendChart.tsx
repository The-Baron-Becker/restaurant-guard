"use client";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

interface TrendPoint {
  month: string;
  avg_score: number;
  inspection_count: number;
}

export default function ScoreTrendChart() {
  const [data, setData] = useState<TrendPoint[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(apiUrl("/api/dashboard/score-trend"))
      .then((r) => r.json())
      .then((rows) => setData(Array.isArray(rows) ? rows : []))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Compliance Score Trend</h2>
        <p className="text-sm text-gray-500">Unable to load trend data.</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-5 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-40 w-full bg-gray-100 rounded" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Compliance Score Trend</h2>
        <p className="text-sm text-gray-500">No completed inspections in the last 6 months.</p>
      </div>
    );
  }

  const width = 640;
  const height = 200;
  const pad = { top: 20, right: 20, bottom: 30, left: 36 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const minScore = Math.min(70, ...data.map((d) => d.avg_score));
  const maxScore = 100;
  const xStep = data.length > 1 ? innerW / (data.length - 1) : 0;
  const y = (score: number) =>
    pad.top + innerH - ((score - minScore) / (maxScore - minScore)) * innerH;
  const x = (i: number) => pad.left + i * xStep;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.avg_score)}`)
    .join(" ");
  const areaPath =
    `M ${x(0)} ${pad.top + innerH} ` +
    data.map((d, i) => `L ${x(i)} ${y(d.avg_score)}`).join(" ") +
    ` L ${x(data.length - 1)} ${pad.top + innerH} Z`;

  const gridLines = [100, 90, 80, 70].filter((g) => g >= minScore);

  const latest = data[data.length - 1];
  const prev = data.length > 1 ? data[data.length - 2] : null;
  const delta = prev ? latest.avg_score - prev.avg_score : 0;

  const fmtMonth = (m: string) => {
    const [yr, mo] = m.split("-");
    return new Date(parseInt(yr), parseInt(mo) - 1, 1).toLocaleString("en-US", {
      month: "short",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Compliance Score Trend</h2>
          <p className="text-sm text-gray-500">Average inspection score, last 6 months</p>
        </div>
        {prev && (
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{latest.avg_score}</p>
            <p
              className={`text-xs font-semibold ${
                delta >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
              aria-label={`${delta >= 0 ? "Up" : "Down"} ${Math.abs(delta)} points vs previous month`}
            >
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} pts vs prev
            </p>
          </div>
        )}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Line chart showing average compliance score per month"
      >
        <defs>
          <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridLines.map((g) => (
          <g key={g}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y(g)}
              y2={y(g)}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
            <text x={pad.left - 8} y={y(g) + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
              {g}
            </text>
          </g>
        ))}
        <path d={areaPath} fill="url(#trendArea)" />
        <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <g key={d.month}>
            <circle cx={x(i)} cy={y(d.avg_score)} r="4" fill="#10b981" stroke="white" strokeWidth="2" />
            <text x={x(i)} y={height - 10} textAnchor="middle" fontSize="11" fill="#6b7280">
              {fmtMonth(d.month)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
