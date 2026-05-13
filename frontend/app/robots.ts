import type { MetadataRoute } from "next";

// AI-training crawler policy parity with SafeGSA + WedgeOps. Per-agent rules
// listed BEFORE the wildcard so strict (first-match) parsers hit the
// targeted rule first. Source-of-truth is in code so changes flow through
// PR review, not silent edits on a static file.

const AI_TRAINING_CRAWLERS = [
  "GPTBot",
  "Google-Extended",
  "CCBot",
  "anthropic-ai",
  "ClaudeBot",
  "PerplexityBot",
  "Bytespider",
  "Amazonbot",
  "FacebookBot",
  "Applebot-Extended",
  "cohere-ai",
];

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://restaurant-guard.local";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 11 AI training crawlers blocked across the entire site.
      ...AI_TRAINING_CRAWLERS.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
      // Standard search crawlers: indexing allowed; APIs and admin areas
      // hidden so anonymous Googlebot indexers don't try to enumerate the
      // CRUD surface or surface user-action URLs in results.
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/api/admin/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
