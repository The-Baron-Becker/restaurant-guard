import type { MetadataRoute } from "next";

// Static sitemap of the public routes we want indexed. The dashboard /
// per-restaurant / per-inspection pages are gated behind data the public
// crawler can't see, so they're intentionally excluded — keeps the
// SERP-eligible surface clean and avoids 404s when a customer demo dataset
// is rotated.

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://restaurant-guard.local";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; changeFrequency: "weekly" | "monthly"; priority: number }[] = [
    { path: "/", changeFrequency: "weekly", priority: 1.0 },
    { path: "/restaurants", changeFrequency: "weekly", priority: 0.8 },
    { path: "/inspections", changeFrequency: "weekly", priority: 0.8 },
    { path: "/checklists", changeFrequency: "monthly", priority: 0.7 },
    { path: "/corrective-actions", changeFrequency: "weekly", priority: 0.7 },
    { path: "/reports", changeFrequency: "weekly", priority: 0.6 },
    { path: "/alerts", changeFrequency: "weekly", priority: 0.6 },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
