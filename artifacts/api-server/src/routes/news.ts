import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";

type ExaResult = {
  title?: string | null;
  url?: string | null;
  publishedDate?: string | null;
  author?: string | null;
  image?: string | null;
  summary?: string | null;
  highlights?: string[] | null;
  text?: string | null;
};

type ExaSearchResponse = {
  results?: ExaResult[];
};

type FireArticle = {
  title: string;
  url: string;
  source: string;
  publishedDate: string;
  summary: string;
  imageUrl?: string;
};

type FireNewsResponse = {
  source: "exa" | "fallback" | "stale";
  updatedAt: string;
  articles: FireArticle[];
};

const router: IRouter = Router();

const EXA_SEARCH_URL = "https://api.exa.ai/search";
const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000;
const SOURCE_DOMAINS = [
  "channelnewsasia.com",
  "straitstimes.com",
  "asiaone.com",
  "mothership.sg",
  "todayonline.com",
  "scdf.gov.sg",
];

let cachedFeed: { expiresAt: number; data: FireNewsResponse } | null = null;

const fallbackArticles: FireArticle[] = [
  {
    title: "Joo Seng flat fire: Man charged after allegedly burning charcoal in living room",
    url: "https://www.channelnewsasia.com/",
    source: "CNA",
    publishedDate: "2026-05-06T00:00:00.000Z",
    summary:
      "A Singapore flat fire case highlights how quickly a residential incident can escalate before formal response reaches the scene.",
  },
  {
    title: "Joo Seng fire: Man charged over blaze in HDB unit",
    url: "https://www.straitstimes.com/",
    source: "The Straits Times",
    publishedDate: "2026-05-06T00:00:00.000Z",
    summary:
      "A late-night HDB blaze underlines the need for nearby trained residents who can account for neighbours in the first minutes.",
  },
  {
    title: "Joo Seng Road flat blaze: Man to be charged with mischief by fire",
    url: "https://www.asiaone.com/",
    source: "AsiaOne",
    publishedDate: "2026-05-05T00:00:00.000Z",
    summary:
      "Reports of an HDB unit engulfed by fire show why location-aware volunteer paging is valuable for vulnerable residents.",
  },
];

router.get("/news/recent-fires", async (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=900, stale-while-revalidate=3600");

  const now = Date.now();
  if (cachedFeed && cachedFeed.expiresAt > now) {
    res.json(cachedFeed.data);
    return;
  }

  const apiKey = process.env["EXA_API_KEY"];
  if (!apiKey) {
    const data = buildFallbackFeed();
    cachedFeed = { expiresAt: now + getCacheTtlMs(), data };
    res.json(data);
    return;
  }

  try {
    const data = await fetchExaFireNews(apiKey);
    cachedFeed = { expiresAt: now + getCacheTtlMs(), data };
    res.json(data);
  } catch (err) {
    logger.warn({ err }, "Failed to refresh Exa fire news feed");

    if (cachedFeed) {
      res.json({ ...cachedFeed.data, source: "stale" satisfies FireNewsResponse["source"] });
      return;
    }

    const data = buildFallbackFeed();
    cachedFeed = { expiresAt: now + getCacheTtlMs(), data };
    res.json(data);
  }
});

async function fetchExaFireNews(apiKey: string): Promise<FireNewsResponse> {
  const startPublishedDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
  const response = await fetch(EXA_SEARCH_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      query: "recent Singapore HDB flat fire SCDF blaze vulnerable residents",
      type: "auto",
      category: "news",
      numResults: 6,
      includeDomains: SOURCE_DOMAINS,
      startPublishedDate,
      contents: {
        summary: {
          query:
            "Summarize this Singapore fire incident in one sentence, focusing on location, impact, and why rapid neighbour response matters.",
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Exa search failed with ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as ExaSearchResponse;
  const articles = (body.results ?? []).map(normalizeExaResult).filter((article): article is FireArticle => article !== null);

  return {
    source: "exa",
    updatedAt: new Date().toISOString(),
    articles: articles.length > 0 ? articles : fallbackArticles,
  };
}

function normalizeExaResult(result: ExaResult): FireArticle | null {
  const title = sanitizeText(result.title);
  const url = sanitizeText(result.url);
  if (!title || !url) return null;

  const summary =
    sanitizeText(result.summary) ??
    sanitizeText(result.highlights?.[0]) ??
    sanitizeText(result.text)?.slice(0, 220) ??
    "Recent Singapore fire coverage relevant to neighbourhood first response.";

  return {
    title,
    url,
    source: sourceNameForUrl(url),
    publishedDate: sanitizeText(result.publishedDate) ?? new Date().toISOString(),
    summary,
    imageUrl: sanitizeText(result.image),
  };
}

function sourceNameForUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    if (hostname.includes("channelnewsasia")) return "CNA";
    if (hostname.includes("straitstimes")) return "The Straits Times";
    if (hostname.includes("asiaone")) return "AsiaOne";
    if (hostname.includes("mothership")) return "Mothership";
    if (hostname.includes("todayonline")) return "TODAY";
    if (hostname.includes("scdf")) return "SCDF";
    return hostname;
  } catch {
    return "News";
  }
}

function sanitizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function buildFallbackFeed(): FireNewsResponse {
  return {
    source: "fallback",
    updatedAt: new Date().toISOString(),
    articles: fallbackArticles,
  };
}

function getCacheTtlMs() {
  const raw = Number(process.env["EXA_NEWS_CACHE_TTL_MS"]);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_CACHE_TTL_MS;
}

export default router;
