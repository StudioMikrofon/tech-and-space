"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface QueueTask {
  id: number;
  article_id: number;
  task_type: string;
  model: string;
  status: string;
  error_msg: string | null;
  created_at: string;
  done_at: string | null;
}

interface ArticleImage {
  id: string;
  url: string;
  label: string;
  attribution?: string;
  sourceUrl?: string;
  provider?: string;
  description?: string;
}

interface MemoryMatch {
  id: number;
  title: string;
  status: string | null;
  created_at: string | null;
  score: number;
  reason: string;
  panelUrl: string;
}

interface MemoryAlert {
  status: "duplicate" | "warning";
  topicKey: string;
  reason: string;
  checkedAt: string | null;
  duplicateOf: number | null;
  bestMatch: MemoryMatch | null;
  matches: MemoryMatch[];
}

interface Article {
  id: number;
  title: string;
  title_en: string | null;
  category: string;
  lead: string;
  pipeline_stage: string;
  status: string;
  github_uploaded: number;
  created_at: string;
  source_url: string | null;
  source_name: string | null;
  source_published_at: string | null;
  memoryAlert: MemoryAlert | null;
  images: ArticleImage[];
  folderName: string | null;
}

interface FullArticle {
  id: number;
  title: string;
  title_en: string | null;
  subtitle: string | null;
  subtitle_en: string | null;
  part1: string | null;
  part1_en: string | null;
  part2: string | null;
  part2_en: string | null;
  endings_json: string | null;
  endings_en: string | null;
  chosen_ending: string | null;
  status: string;
  body_md: string | null;
  source_url: string | null;
  source_name: string | null;
  source_published_at: string | null;
  github_uploaded: number;
  lead_sentence: string | null;
  lead_sentence_en: string | null;
  exec_summary: string | null;
  exec_summary_en: string | null;
  key_points_hr: string | null;
  key_points_en: string | null;
}

interface EditFields {
  title: string;
  title_en: string;
  lead_sentence: string;
  lead_sentence_en: string;
  exec_summary: string;
  exec_summary_en: string;
  part1: string;
  part1_en: string;
  subtitle: string;
  subtitle_en: string;
  part2: string;
  part2_en: string;
  key_points_hr: string;
  key_points_en: string;
}

interface ArticleSelections {
  hero: string | null;
  subtitle: string | null;
}

const CAT_COLORS: Record<string, string> = {
  ai:        "bg-purple-950 text-purple-300 border-purple-700/50",
  tech:      "bg-blue-950   text-blue-300   border-blue-700/50",
  space:     "bg-indigo-950 text-indigo-300 border-indigo-700/50",
  gaming:    "bg-green-950  text-green-300  border-green-700/50",
  medicine:  "bg-rose-950   text-rose-300   border-rose-700/50",
  robotics:  "bg-orange-950 text-orange-300 border-orange-700/50",
  society:   "bg-yellow-950 text-yellow-300 border-yellow-700/50",
  energy:    "bg-teal-950   text-teal-300   border-teal-700/50",
};

const STATUS_COLORS: Record<string, string> = {
  pending:   "text-yellow-400",
  approved:  "text-green-400",
  published: "text-cyan-400",
  rejected:  "text-red-500",
  rewrite:   "text-orange-400",
};

function parseEndings(json: string | null): Record<string, string> {
  if (!json) return {};
  try { return JSON.parse(json) as Record<string, string>; } catch { return {}; }
}

export default function FotoReviewPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Image selection state
  const [selections, setSelections] = useState<Record<number, ArticleSelections>>({});
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [actionResult, setActionResult] = useState<Record<number, { ok: boolean; msg: string }>>({});
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [generating, setGenerating] = useState<Record<number, string | null>>({});

  // Expand / full article state
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [fullData, setFullData] = useState<Record<number, FullArticle>>({});
  const [fullLoading, setFullLoading] = useState<Record<number, boolean>>({});
  const [editData, setEditData] = useState<Record<number, EditFields>>({});
  const [editCategory, setEditCategory] = useState<Record<number, string>>({});
  const [editLang, setEditLang] = useState<Record<number, "hr" | "en">>({});
  const [savingEdit, setSavingEdit] = useState<Record<number, boolean>>({});
  const [regenningEndings, setRegenningEndings] = useState<Record<number, boolean>>({});
  const [regenningLead, setRegenningLead] = useState<Record<number, boolean>>({});
  const [writingEn, setWritingEn] = useState<Record<number, boolean>>({});
  const [showLog, setShowLog] = useState<Record<number, boolean>>({});
  const [logLines, setLogLines] = useState<string[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [publishing, setPublishing] = useState<Record<number, boolean>>({});
  const [publishResult, setPublishResult] = useState<Record<number, { ok: boolean; msg: string }>>({});
  const loadedIds = useRef(new Set<number>());
  const articleRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Deep-link article ID from URL query param — reactive on URL changes
  const [deepLinkId, setDeepLinkId] = useState<number | null>(null);
  const lastUrlRef = useRef<string>("");

  // Update deepLinkId when URL changes (handles navigation from article pages)
  useEffect(() => {
    const updateDeepLink = () => {
      if (typeof window !== "undefined") {
        const currentUrl = window.location.search;
        // Only update if URL actually changed
        if (lastUrlRef.current !== currentUrl) {
          lastUrlRef.current = currentUrl;
          const id = Number(new URLSearchParams(currentUrl).get("id")) || null;
          setDeepLinkId(id);
        }
      }
    };

    // Initial parse on mount
    updateDeepLink();

    // Listen for URL changes (popstate)
    window.addEventListener("popstate", updateDeepLink);

    // Also poll for URL changes (handles SPA navigation with links)
    const pollInterval = setInterval(updateDeepLink, 500);

    return () => {
      window.removeEventListener("popstate", updateDeepLink);
      clearInterval(pollInterval);
    };
  }, []);

  // Queue state
  const [queueOpen, setQueueOpen] = useState(false);
  const [queueTasks, setQueueTasks] = useState<QueueTask[]>([]);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});
  const [queueAdding, setQueueAdding] = useState<Record<string, boolean>>({});

  // Global model selector for image generation
  const [genModel, setGenModel] = useState<"qwen" | "openai">("qwen");
  // Per-article model override (falls back to genModel)
  const [articleModels, setArticleModels] = useState<Record<number, "qwen" | "openai">>({});
  const getArticleModel = (id: number) => articleModels[id] ?? genModel;

  // Manual scrape
  const [manualUrl, setManualUrl] = useState("");
  const [manualScraping, setManualScraping] = useState(false);
  const [manualResult, setManualResult] = useState<{ ok: boolean; msg: string; steps?: string[]; articleId?: number } | null>(null);
  const [manualStep, setManualStep] = useState("");

  // Batch scrape
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchUrls, setBatchUrls] = useState<string[]>([]);
  const [batchInput, setBatchInput] = useState("");
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchResults, setBatchResults] = useState<Array<{
    url: string; success: boolean; article_id: number | null; title: string; message: string;
  }>>([]);

  const handleManualScrape = async () => {
    if (!manualUrl.trim() || !manualUrl.startsWith("http")) return;
    setManualScraping(true);
    setManualResult(null);
    setManualStep("Scrapam stranicu...");
    // Cycle step labels while waiting
    const stepLabels = ["Scrapam stranicu...", "Pretražujem Reddit...", "Generiram brief...", "Pišem članak..."];
    let stepIdx = 0;
    const stepTimer = setInterval(() => {
      stepIdx = (stepIdx + 1) % stepLabels.length;
      setManualStep(stepLabels[stepIdx]);
    }, 4000);
    try {
      const r = await fetch("/api/manual-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: manualUrl.trim() }),
      });
      const data = await r.json();
      if (data.success) {
        setManualResult({
          ok: true,
          msg: `✓ #${data.article_id} — ${(data.title || "").substring(0, 55)}`,
          steps: data.steps,
          articleId: data.article_id,
        });
        setManualUrl("");
        // Refresh article list and scroll to new article
        const refreshed = await fetch("/api/foto-review").then(r => r.json()).catch(() => null);
        if (refreshed?.articles) setArticles(refreshed.articles);
        if (data.article_id) {
          setTimeout(() => {
            const el = articleRefs.current[data.article_id];
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 600);
        }
      } else {
        setManualResult({ ok: false, msg: data.message || data.error || "Scrape failed", steps: data.steps });
      }
    } catch {
      setManualResult({ ok: false, msg: "Network error" });
    } finally {
      clearInterval(stepTimer);
      setManualStep("");
      setManualScraping(false);
    }
  };

  // Batch scrape handlers
  const handleBatchAdd = () => {
    const lines = batchInput
      .split(/[\n,]/)
      .map((l) => l.trim())
      .filter((l) => l.startsWith("http") && !batchUrls.includes(l));
    if (lines.length > 0) {
      setBatchUrls((prev) => [...prev, ...lines]);
      setBatchInput("");
    }
  };
  const handleBatchRemove = (idx: number) => {
    setBatchUrls((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleBatchStart = async () => {
    if (batchUrls.length === 0 || batchRunning) return;
    setBatchRunning(true);
    setBatchProgress(0);
    setBatchResults([]);
    try {
      const r = await fetch("/api/manual-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: batchUrls }),
      });
      const data = await r.json();
      if (data.results) {
        setBatchResults(data.results);
        setBatchProgress(data.total || batchUrls.length);
        // Refresh article list
        const refreshed = await fetch("/api/foto-review").then((r) => r.json()).catch(() => null);
        if (refreshed?.articles) setArticles(refreshed.articles);
        // Clear URLs that succeeded
        const failedUrls = data.results
          .filter((r: { success: boolean; url: string }) => !r.success)
          .map((r: { url: string }) => r.url);
        setBatchUrls(failedUrls);
      } else {
        setBatchResults([{ url: "", success: false, article_id: null, title: "", message: data.error || "Batch failed" }]);
      }
    } catch {
      setBatchResults([{ url: "", success: false, article_id: null, title: "", message: "Network error" }]);
    } finally {
      setBatchRunning(false);
    }
  };

  // Filters
  const [filterCat, setFilterCat] = useState("all");
  const [filterImg, setFilterImg] = useState("all");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"neobjavljeni"|"objavljeni">("neobjavljeni");
  const [filterUploaded, setFilterUploaded] = useState<"all"|"uploaded"|"not_uploaded">("all");
  const [filterDate, setFilterDate] = useState<"all"|"today"|"yesterday"|"7d"|"30d">("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchBusy, setBatchBusy] = useState<"save" | "publish" | "press" | "pull" | null>(null);
  const [batchResult, setBatchResult] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Simple mapping: neobjavljeni=pending, objavljeni=published
    const apiFilter = filterStatus === "neobjavljeni" ? "pending" : "published";

    fetch(`/api/foto-review?filter=${apiFilter}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.articles) {
          setArticles(data.articles);
        } else setError(data.error || "API error");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filterStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep-link handler: Load article directly by ID (independent of filter)
  useEffect(() => {
    if (!deepLinkId) return;

    // Load the specific article by ID without filter
    fetch(`/api/foto-review?id=${deepLinkId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.article) {
          // Add article to current list if not already present
          setArticles((prev) => {
            const exists = prev.some((a) => a.id === deepLinkId);
            return exists ? prev : [...prev, data.article];
          });
          // Auto-expand the deep-linked article
          setExpandedIds((prev) => {
            const s = new Set(prev);
            s.add(deepLinkId);
            return s;
          });
        }
      })
      .catch(() => {
        // Silently fail if article can't be loaded
      });
  }, [deepLinkId]);

  // Scroll to deep-link article after render
  useEffect(() => {
    if (!deepLinkId || loading) return;
    const el = articleRefs.current[deepLinkId];
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
  }, [loading, deepLinkId]);

  const refreshArticle = useCallback(async (articleId: number) => {
    try {
      const res = await fetch(`/api/foto-review?id=${articleId}`);
      const data = await res.json();
      if (data.article) {
        setArticles((prev) =>
          prev.map((a) => (a.id === articleId ? data.article : a))
        );
      }
    } catch {}
  }, []);

  // Build editData from full article — falls back to body_md for old articles missing part1/part2
  function buildEditData(data: FullArticle): EditFields {
    let part1 = data.part1 || "";
    let part2 = data.part2 || "";
    if (!part1 && data.body_md) {
      const paras = data.body_md.split("\n\n").filter(Boolean);
      const half = Math.max(1, Math.floor(paras.length / 2));
      part1 = paras.slice(0, half).join("\n\n");
      part2 = paras.slice(half).join("\n\n");
    }
    // Parse key_points from JSON array to newline-separated string for editing
    const parseKeyPoints = (val: string | null): string => {
      if (!val) return "";
      try {
        const arr = JSON.parse(val);
        return Array.isArray(arr) ? arr.join("\n") : val;
      } catch {
        return val;
      }
    };
    return {
      title: data.title || "",
      title_en: data.title_en || "",
      lead_sentence: data.lead_sentence || "",
      lead_sentence_en: data.lead_sentence_en || "",
      exec_summary: data.exec_summary || "",
      exec_summary_en: data.exec_summary_en || "",
      part1,
      part1_en: data.part1_en || "",
      subtitle: data.subtitle || "",
      subtitle_en: data.subtitle_en || "",
      part2,
      part2_en: data.part2_en || "",
      key_points_hr: parseKeyPoints(data.key_points_hr),
      key_points_en: parseKeyPoints(data.key_points_en),
    };
  }

  const refreshFullData = useCallback(async (articleId: number) => {
    try {
      const res = await fetch(`/api/editorial?id=${articleId}`);
      const data = await res.json();
      if (!data.error) {
        setFullData(p => ({ ...p, [articleId]: data }));
        setEditData(p => ({ ...p, [articleId]: buildEditData(data) }));
      }
    } catch {}
  }, []);

  // ── Expand ──────────────────────────────────────────────────
  const handleExpand = useCallback(async (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      next.add(id);
      return next;
    });
    if (!loadedIds.current.has(id)) {
      setFullLoading(p => ({ ...p, [id]: true }));
      try {
        const res = await fetch(`/api/editorial?id=${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setFullData(p => ({ ...p, [id]: data }));
        setEditData(p => ({ ...p, [id]: buildEditData(data) }));
        loadedIds.current.add(id);
      } catch {
        // Keep it retryable on next expand click.
        loadedIds.current.delete(id);
      } finally {
        setFullLoading(p => ({ ...p, [id]: false }));
      }
    }
  }, []);

  const setEditField = useCallback((id: number, field: keyof EditFields, value: string) => {
    setEditData(p => ({ ...p, [id]: { ...p[id], [field]: value } }));
  }, []);

  // ── Save text edits ──────────────────────────────────────────
  const handleSaveEdit = async (articleId: number) => {
    const e = editData[articleId];
    if (!e) return;
    setSavingEdit(p => ({ ...p, [articleId]: true }));
    try {
      const catEdit = editCategory[articleId];
      // Convert newline-separated key_points back to JSON array
      const stringifyKeyPoints = (val: string): string | null => {
        if (!val || !val.trim()) return null;
        const lines = val.split("\n").map((s) => s.trim()).filter(Boolean);
        return lines.length > 0 ? JSON.stringify(lines) : null;
      };
      const res = await fetch("/api/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: articleId,
          title: e.title || null,
          title_en: e.title_en || null,
          lead_sentence: e.lead_sentence || null,
          lead_sentence_en: e.lead_sentence_en || null,
          part1: e.part1 || null,
          part1_en: e.part1_en || null,
          subtitle: e.subtitle || null,
          subtitle_en: e.subtitle_en || null,
          part2: e.part2 || null,
          part2_en: e.part2_en || null,
          category: catEdit || null,
          key_points_hr: stringifyKeyPoints(e.key_points_hr),
          key_points_en: stringifyKeyPoints(e.key_points_en),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        await Promise.all([refreshArticle(articleId), refreshFullData(articleId)]);
        // If article is already published, also trigger MDX sync + rebuild
        const article = articles.find(a => a.id === articleId);
        if (article?.github_uploaded) {
          // Fire-and-forget: sync MDX + rebuild
          fetch("/api/editorial", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: articleId, action: "sync" }),
          }).catch(() => {});
          setActionResult(p => ({ ...p, [articleId]: { ok: true, msg: "✓ Snimljeno + rebuild pokrenut" } }));
        } else {
          setActionResult(p => ({ ...p, [articleId]: { ok: true, msg: "✓ Izmjene snimljene" } }));
        }
      } else {
        setActionResult(p => ({ ...p, [articleId]: { ok: false, msg: data.error || "Greška" } }));
      }
    } finally {
      setSavingEdit(p => ({ ...p, [articleId]: false }));
    }
  };

  // ── Publish with ending ──────────────────────────────────────
  const handlePublish = async (articleId: number, ending: string) => {
    if (!confirm(`Objaviti članak #${articleId} sa završetkom ${ending}?`)) return;
    setActionResult(p => ({ ...p, [articleId]: { ok: false, msg: "Objavljujem..." } }));
    const res = await fetch("/api/editorial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: articleId, action: "ending", ending }),
    });
    const data = await res.json();
    setActionResult(p => ({ ...p, [articleId]: { ok: !!data.ok, msg: data.message || data.error || "?" } }));
    if (data.ok) await refreshArticle(articleId);
  };

  // ── Reject ───────────────────────────────────────────────────
  const handleReject = async (articleId: number) => {
    if (!confirm(`Odbiti članak #${articleId}?`)) return;
    const res = await fetch("/api/editorial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: articleId, action: "reject" }),
    });
    const data = await res.json();
    if (data.ok) setDeletedIds(p => new Set([...p, articleId]));
    else alert(data.error);
  };

  // ── Rewrite ──────────────────────────────────────────────────
  const handleRewrite = async (articleId: number) => {
    if (!confirm(`Označiti članak #${articleId} za prepis?`)) return;
    const res = await fetch("/api/editorial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: articleId, action: "rewrite" }),
    });
    const data = await res.json();
    setActionResult(p => ({ ...p, [articleId]: { ok: !!data.ok, msg: data.message || data.error || "?" } }));
    if (data.ok) await refreshArticle(articleId);
  };

  // ── Write HR ─────────────────────────────────────────────────
  const handleWriteHr = async (articleId: number) => {
    setActionResult(p => ({ ...p, [articleId]: { ok: false, msg: "Pišem HR verziju... (~45s)" } }));
    const res = await fetch("/api/foto-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "write_hr", articleId }),
    });
    const data = await res.json();
    setActionResult(p => ({ ...p, [articleId]: { ok: !!data.ok, msg: data.message || data.error || "?" } }));
    if (data.ok) {
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await refreshFullData(articleId);
        if (attempts >= 10) {
          clearInterval(poll);
          setActionResult(p => ({ ...p, [articleId]: { ok: true, msg: "✓ HR verzija napisana — refresh za provjeru" } }));
        }
      }, 5000);
    }
  };

  // ── Write EN ─────────────────────────────────────────────────
  const handleWriteEn = async (articleId: number) => {
    setWritingEn(p => ({ ...p, [articleId]: true }));
    setActionResult(p => ({ ...p, [articleId]: { ok: false, msg: "Pišem EN verziju... (~30s)" } }));
    const res = await fetch("/api/foto-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "write_en", articleId }),
    });
    const data = await res.json();
    setActionResult(p => ({ ...p, [articleId]: { ok: !!data.ok, msg: data.message || data.error || "?" } }));
    if (data.ok) {
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await refreshFullData(articleId);
        const latest = fullData[articleId];
        if (latest?.part1_en || attempts >= 8) {
          clearInterval(poll);
          setWritingEn(p => ({ ...p, [articleId]: false }));
          if (attempts >= 8) return;
          setActionResult(p => ({ ...p, [articleId]: { ok: true, msg: "✓ EN verzija napisana" } }));
        }
      }, 5000);
    } else {
      setWritingEn(p => ({ ...p, [articleId]: false }));
    }
  };

  // ── Regen endings ────────────────────────────────────────────
  const handleRegenEndings = async (articleId: number) => {
    setRegenningEndings(p => ({ ...p, [articleId]: true }));
    setActionResult(p => ({ ...p, [articleId]: { ok: false, msg: "Regeneriram završetke... (~30s)" } }));
    const res = await fetch("/api/foto-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "regen_endings", articleId }),
    });
    const data = await res.json();
    setActionResult(p => ({ ...p, [articleId]: { ok: !!data.ok, msg: data.message || data.error || "?" } }));
    if (data.ok) {
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await refreshFullData(articleId);
        if (attempts >= 8) {
          clearInterval(poll);
          setRegenningEndings(p => ({ ...p, [articleId]: false }));
        }
      }, 5000);
    } else {
      setRegenningEndings(p => ({ ...p, [articleId]: false }));
    }
  };

  // ── Regen lead ───────────────────────────────────────────────
  const handleRegenLead = async (articleId: number) => {
    setRegenningLead(p => ({ ...p, [articleId]: true }));
    setActionResult(p => ({ ...p, [articleId]: { ok: false, msg: "Regeneriram lead... (~15s)" } }));
    const oldLead = fullData[articleId]?.lead_sentence_en || "";
    const res = await fetch("/api/foto-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "regen_lead", articleId }),
    });
    const data = await res.json();
    setActionResult(p => ({ ...p, [articleId]: { ok: !!data.ok, msg: data.message || data.error || "?" } }));
    if (data.ok) {
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await refreshFullData(articleId);
        const latest = fullData[articleId];
        const newLead = latest?.lead_sentence_en || "";
        const changed = newLead && newLead !== oldLead;
        if (changed || attempts >= 8) {
          clearInterval(poll);
          setRegenningLead(p => ({ ...p, [articleId]: false }));
          if (changed) {
            setActionResult(p => ({ ...p, [articleId]: { ok: true, msg: "✓ Lead regeneriran" } }));
          }
        }
      }, 4000);
    } else {
      setRegenningLead(p => ({ ...p, [articleId]: false }));
    }
  };

  // ── Log viewer ───────────────────────────────────────────────
  const handleShowLog = async (articleId: number) => {
    setShowLog(p => ({ ...p, [articleId]: !p[articleId] }));
    if (!showLog[articleId]) {
      setLogLoading(true);
      try {
        const res = await fetch("/api/foto-review?log=60");
        const data = await res.json();
        setLogLines(data.lines ?? []);
      } finally {
        setLogLoading(false);
      }
    }
  };

  // ── Queue ────────────────────────────────────────────────────
  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/foto-review?queue=1");
      const data = await res.json();
      setQueueTasks(data.tasks ?? []);
      const counts: Record<string, number> = {};
      for (const c of (data.counts ?? [])) counts[c.status] = c.n;
      setQueueCounts(counts);
    } catch {}
  }, []);

  // Auto-poll when queue is open or there are pending/running tasks
  useEffect(() => {
    if (!queueOpen && !queueCounts.pending && !queueCounts.running) return;
    fetchQueue();
    const iv = setInterval(fetchQueue, 4000);
    return () => clearInterval(iv);
  }, [queueOpen, fetchQueue, queueCounts.pending, queueCounts.running]);

  const handleQueueAdd = useCallback(async (articleId: number, taskType: string, model?: string) => {
    const key = `${articleId}-${taskType}`;
    setQueueAdding(p => ({ ...p, [key]: true }));
    try {
      await fetch("/api/foto-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "queue_add", articleId, taskType, model }),
      });
      await fetchQueue();
      setQueueOpen(true);
    } finally {
      setQueueAdding(p => ({ ...p, [key]: false }));
    }
  }, [fetchQueue]);

  const handleQueueClear = useCallback(async () => {
    await fetch("/api/foto-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "queue_clear", articleId: 0 }),
    });
    await fetchQueue();
  }, [fetchQueue]);

  const queuePending = (queueCounts.pending ?? 0) + (queueCounts.running ?? 0);

  // ── Image selection handlers ──────────────────────────────────
  const filtered = articles.filter((a) => {
    if (deletedIds.has(a.id)) return false;
    if (filterCat !== "all" && a.category !== filterCat) return false;
    if (filterImg === "with" && a.images.length === 0) return false;
    if (filterImg === "without" && a.images.length > 0) return false;
    // Status filters - Simple: neobjavljeni=pending, objavljeni=published
    if (filterStatus === "neobjavljeni" && a.status !== "pending") return false;
    if (filterStatus === "objavljeni" && a.status !== "published") return false;
    // Upload filter
    if (filterUploaded === "uploaded" && !a.github_uploaded) return false;
    if (filterUploaded === "not_uploaded" && a.github_uploaded) return false;
    if (filterDate !== "all" && a.created_at) {
      const d = new Date(a.created_at);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const week = new Date(today); week.setDate(week.getDate() - 7);
      const month = new Date(today); month.setDate(month.getDate() - 30);
      if (filterDate === "today" && d < today) return false;
      if (filterDate === "yesterday" && (d < yesterday || d >= today)) return false;
      if (filterDate === "7d" && d < week) return false;
      if (filterDate === "30d" && d < month) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !String(a.id).includes(q) &&
          !(a.title_en ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const categories = ["all", ...Array.from(new Set(articles.map((a) => a.category))).sort()];
  const getSel = useCallback((id: number): ArticleSelections => selections[id] ?? { hero: null, subtitle: null }, [selections]);
  const selectedFiltered = filtered.filter((article) => selectedIds.has(article.id));
  const batchSavable = selectedFiltered.filter((article) => Boolean(getSel(article.id).hero));

  const toggleSelected = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAllFiltered = useCallback(() => {
    setSelectedIds(new Set(filtered.map((article) => article.id)));
  }, [filtered]);

  const handleClearSelected = useCallback(() => {
    setSelectedIds(new Set());
    setBatchResult(null);
  }, []);

  const setRole = useCallback(
    (articleId: number, imageId: string, role: "hero" | "subtitle") => {
      setSelections((prev) => {
        const cur = prev[articleId] ?? { hero: null, subtitle: null };
        if (cur[role] === imageId) return { ...prev, [articleId]: { ...cur, [role]: null } };
        const next = { ...cur, [role]: imageId };
        if (role === "hero" && next.subtitle === imageId) next.subtitle = null;
        if (role === "subtitle" && next.hero === imageId) next.hero = null;
        return { ...prev, [articleId]: next };
      });
    }, []
  );

  const handleSave = async (article: Article) => {
    const sel = getSel(article.id);
    if (!sel.hero) { alert("Odaberi HERO sliku!"); return; }
    setSaving((p) => ({ ...p, [article.id]: true }));
    setActionResult((p) => ({ ...p, [article.id]: { ok: false, msg: "Snimam..." } }));
    try {
      const res = await fetch("/api/foto-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "select_images",
          articleId: article.id,
          heroImageId: sel.hero,
          subtitleImageId: sel.subtitle ?? undefined,
        }),
      });
      const data = await res.json();
      setActionResult((p) => ({ ...p, [article.id]: { ok: !!data.ok, msg: data.message || data.error || "?" } }));
      if (data.ok) {
        // CRITICAL FIX: DON'T clear selections after save — keep them visible so UI shows what was just saved
        // The images are now persisted in DB (images_json), and refreshArticle will load them from server.
        // Keeping selections visible allows user to see confirmation + the saved image selection together.
        // DO NOT call: setSelections((p) => ({ ...p, [article.id]: { hero: null, subtitle: null } }));
        await refreshArticle(article.id);
        // If article is already published/uploaded, trigger rebuild so images appear on site
        if (article.github_uploaded) {
          fetch("/api/editorial", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: article.id, action: "sync" }),
          }).catch(() => {});
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionResult((p) => ({ ...p, [article.id]: { ok: false, msg } }));
    } finally {
      setSaving((p) => ({ ...p, [article.id]: false }));
    }
  };

  const publishLocal = async (articleId: number, requireConfirm = true) => {
    if (requireConfirm && !confirm(`Objavi članak #${articleId}?`)) return false;
    setPublishing((p) => ({ ...p, [articleId]: true }));
    setPublishResult((p) => ({ ...p, [articleId]: { ok: false, msg: "Objavljujem... (može potrajati ~2min ako treba generirati slike)" } }));
    try {
      const res = await fetch("/api/publish-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      const data = await res.json();
      setPublishResult((p) => ({ ...p, [articleId]: {
        ok: !!data.ok,
        msg: data.ok ? "✅ Objavljeno i vidljivo odmah" : `❌ ${data.error || "Greška"}`,
      }}));
      if (data.ok) {
        await refreshArticle(articleId);
      }
      return !!data.ok;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setPublishResult((p) => ({ ...p, [articleId]: { ok: false, msg } }));
      return false;
    } finally {
      setPublishing((p) => ({ ...p, [articleId]: false }));
    }
  };

  const handlePublishLocal = async (articleId: number) => {
    await publishLocal(articleId, true);
  };

  const handleDeleteArticle = async (articleId: number) => {
    if (!confirm(`Trajno obrisati članak #${articleId}? Ovo se ne može poništiti.`)) return;
    const res = await fetch("/api/foto-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_article", articleId }),
    });
    const data = await res.json();
    if (data.ok) setDeletedIds((p) => new Set([...p, articleId]));
    else alert(data.error || "Greška pri brisanju");
  };

  const handleDeleteImage = async (articleId: number, imageId: string) => {
    if (!confirm("Trajno obrisati ovu sliku?")) return;
    setSelections((prev) => {
      const cur = prev[articleId];
      if (!cur) return prev;
      return { ...prev, [articleId]: { hero: cur.hero === imageId ? null : cur.hero, subtitle: cur.subtitle === imageId ? null : cur.subtitle } };
    });
    const res = await fetch("/api/foto-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete_image", articleId, imageId }),
    });
    const data = await res.json();
    if (data.ok) {
      setArticles((prev) => prev.map((a) =>
        a.id === articleId ? { ...a, images: a.images.filter((i) => i.id !== imageId) } : a
      ));
    } else {
      alert(data.error || "Brisanje slike nije uspjelo");
    }
  };

  const handleBatchSave = async () => {
    if (batchSavable.length === 0) {
      setBatchResult("Nema oznacenih clanaka sa spremnim HERO odabirom.");
      return;
    }
    setBatchBusy("save");
    setBatchResult(`Spremam ${batchSavable.length} oznacenih clanaka...`);
    for (const article of batchSavable) {
      await handleSave(article);
    }
    setBatchBusy(null);
    setBatchResult(`Spremljeno ${batchSavable.length}/${batchSavable.length} oznacenih odabira.`);
  };

  const handleBatchPublish = async () => {
    if (selectedFiltered.length === 0) {
      setBatchResult("Prvo oznaci clanke za batch publish.");
      return;
    }
    if (!confirm(`Objaviti ${selectedFiltered.length} oznacenih clanaka?`)) return;
    setBatchBusy("publish");
    setBatchResult(`Objavljujem ${selectedFiltered.length} oznacenih clanaka...`);
    let ok = 0;
    for (const article of selectedFiltered) {
      if (await publishLocal(article.id, false)) {
        ok += 1;
      }
    }
    setBatchBusy(null);
    setBatchResult(`Objavljeno ${ok}/${selectedFiltered.length} oznacenih clanaka.`);
  };

  const handleBatchPullPress = async () => {
    if (selectedFiltered.length === 0) {
      setBatchResult("Prvo oznaci clanke za batch press pull.");
      return;
    }
    setBatchBusy("press");
    setBatchResult(`Pronalazim press slike za ${selectedFiltered.length} oznacenih clanaka (~20-30s)...`);
    try {
      const ids = selectedFiltered.map(a => a.id);
      const res = await fetch("/api/image-press", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (data.ok) {
        setBatchResult(`Press pronalaženje pokrenuto za ${ids.length} clanaka. Osvježavam...`);
        // Poll for updates
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          for (const id of ids) {
            await refreshArticle(id);
          }
          if (attempts >= 8) {
            clearInterval(poll);
            setBatchBusy(null);
            setBatchResult(`✓ Batch press pronalaženje dovršeno.`);
          }
        }, 3000);
      } else {
        setBatchBusy(null);
        setBatchResult(`⚠ Batch press pronalaženje nije uspjelo: ${data.error}`);
      }
    } catch (e) {
      setBatchBusy(null);
      const msg = e instanceof Error ? e.message : String(e);
      setBatchResult(`⚠ Greška: ${msg}`);
    }
  };

  const handleBatchPullImages = async () => {
    if (selectedFiltered.length === 0) {
      setBatchResult("Prvo oznaci clanke za batch pull slike.");
      return;
    }
    setBatchBusy("pull");
    setBatchResult(`Povlačim slike za ${selectedFiltered.length} oznacenih clanaka (~20-30s)...`);
    try {
      const ids = selectedFiltered.map(a => a.id);
      const res = await fetch("/api/image-pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (data.ok) {
        setBatchResult(`Povlačenje web slika pokrenuto za ${ids.length} clanaka. Osvježavam...`);
        // Poll for updates
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          for (const id of ids) {
            await refreshArticle(id);
          }
          if (attempts >= 8) {
            clearInterval(poll);
            setBatchBusy(null);
            setBatchResult(`✓ Batch povlačenje slike dovršeno.`);
          }
        }, 3000);
      } else {
        setBatchBusy(null);
        setBatchResult(`⚠ Batch povlačenje slike nije uspjelo: ${data.error}`);
      }
    } catch (e) {
      setBatchBusy(null);
      const msg = e instanceof Error ? e.message : String(e);
      setBatchResult(`⚠ Greška: ${msg}`);
    }
  };

  // ── Pull images from web ─────────────────────────────────────
  const [pulling, setPulling] = useState<Record<number, boolean>>({});
  const [pullingPress, setPullingPress] = useState<Record<number, boolean>>({});
  const [previewImage, setPreviewImage] = useState<{ url: string; label: string } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewImage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handlePullWeb = async (article: Article) => {
    setPulling((p) => ({ ...p, [article.id]: true }));
    const prevUrls = new Set(article.images.map(i => i.url));
    setActionResult((p) => ({ ...p, [article.id]: { ok: false, msg: "🌐 Povlačim slike s weba... (~15s)" } }));
    try {
      const res = await fetch("/api/image-pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, queryVariation: Date.now() }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionResult((p) => ({ ...p, [article.id]: { ok: true, msg: data.message || "Povlačenje pokrenuto..." } }));
        let attempts = 0;
        let found = false;
        const poll = setInterval(async () => {
          attempts++;
          await refreshArticle(article.id);
          setArticles((prev) => {
            const cur = prev.find(a => a.id === article.id);
            if (cur && cur.images.some(i => !prevUrls.has(i.url))) found = true;
            return prev;
          });
          if (found || attempts >= 8) {
            clearInterval(poll);
            setPulling((p) => ({ ...p, [article.id]: false }));
            setActionResult((p) => ({
              ...p,
              [article.id]: found
                ? { ok: true, msg: "✓ Web slike preuzete" }
                : { ok: false, msg: "⚠ Povlačenje završeno — slika nije pronađena (nema og:image ili Wikimedia rezultata)" },
            }));
          }
        }, 3000);
      } else {
        setActionResult((p) => ({ ...p, [article.id]: { ok: false, msg: data.error || "Pull nije uspio" } }));
        setPulling((p) => ({ ...p, [article.id]: false }));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionResult((p) => ({ ...p, [article.id]: { ok: false, msg } }));
      setPulling((p) => ({ ...p, [article.id]: false }));
    }
  };

  const handlePullPress = async (article: Article) => {
    setPullingPress((p) => ({ ...p, [article.id]: true }));
    const prevUrls = new Set(article.images.map(i => i.url));
    setActionResult((p) => ({ ...p, [article.id]: { ok: false, msg: "📰 Pronalazim press slike... (~5s)" } }));
    try {
      const res = await fetch("/api/image-press", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionResult((p) => ({ ...p, [article.id]: { ok: true, msg: data.message || "Press pronalaženje pokrenuto..." } }));
        let attempts = 0;
        let found = false;
        const poll = setInterval(async () => {
          attempts++;
          await refreshArticle(article.id);
          setArticles((prev) => {
            const cur = prev.find(a => a.id === article.id);
            if (cur && cur.images.some(i => !prevUrls.has(i.url))) found = true;
            return prev;
          });
          if (found || attempts >= 6) {
            clearInterval(poll);
            setPullingPress((p) => ({ ...p, [article.id]: false }));
            setActionResult((p) => ({
              ...p,
              [article.id]: found
                ? { ok: true, msg: "✓ Press slike pronađene" }
                : { ok: false, msg: "⚠ Nema press slika — fallback na web pull ili AI" },
            }));
          }
        }, 2000);
      } else {
        setActionResult((p) => ({ ...p, [article.id]: { ok: false, msg: data.error || "Press pronalaženje nije uspjelo" } }));
        setPullingPress((p) => ({ ...p, [article.id]: false }));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionResult((p) => ({ ...p, [article.id]: { ok: false, msg } }));
      setPullingPress((p) => ({ ...p, [article.id]: false }));
    }
  };

  const handleGenerate = async (article: Article, type: "main" | "subtitle") => {
    const model = getArticleModel(article.id);
    setGenerating((p) => ({ ...p, [article.id]: type }));
    const modelLabel = model === "openai" ? " [OpenAI]" : " [Qwen]";
    setActionResult((p) => ({ ...p, [article.id]: { ok: false, msg: `Generiram ${type}${modelLabel}... (~30s)` } }));
    // Snapshot current image URLs to detect new ones (comparing URLs, not just count)
    const prevUrls = new Set(article.images.map(i => i.url));
    try {
      const res = await fetch("/api/image-regen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, image_type: type, model }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionResult((p) => ({ ...p, [article.id]: { ok: true, msg: data.message || "Generacija pokrenuta, čekam..." } }));
        let attempts = 0;
        let found = false;
        const poll = setInterval(async () => {
          attempts++;
          await refreshArticle(article.id);
          // Check if any new URL appeared that wasn't in the pre-generation snapshot
          setArticles((prev) => {
            const cur = prev.find(a => a.id === article.id);
            if (cur && cur.images.some(i => !prevUrls.has(i.url))) found = true;
            return prev;
          });
          if (found || attempts >= 10) {
            clearInterval(poll);
            setGenerating((p) => ({ ...p, [article.id]: null }));
            setActionResult((p) => ({
              ...p,
              [article.id]: found
                ? { ok: true, msg: "✓ Nova slika generirana" }
                : { ok: false, msg: "⚠ Generacija završena ali slika nije pronađena — provjeri log" },
            }));
          }
        }, 5000);
      } else {
        setActionResult((p) => ({ ...p, [article.id]: { ok: false, msg: data.error || "Generacija nije uspjela" } }));
        setGenerating((p) => ({ ...p, [article.id]: null }));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionResult((p) => ({ ...p, [article.id]: { ok: false, msg } }));
      setGenerating((p) => ({ ...p, [article.id]: null }));
    }
  };

  const handleGenerateBoth = async (article: Article) => {
    const model = getArticleModel(article.id);
    setGenerating((p) => ({ ...p, [article.id]: "main" }));
    setActionResult((p) => ({ ...p, [article.id]: { ok: false, msg: `Generiram main + subtitle [${model === "openai" ? "OpenAI" : "Qwen"}]...` } }));
    try {
      const res1 = await fetch("/api/image-regen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, image_type: "main", model }),
      });
      const d1 = await res1.json();
      if (!d1.ok) throw new Error(d1.error || "Main gen failed");
      setGenerating((p) => ({ ...p, [article.id]: "subtitle" }));
      setActionResult((p) => ({ ...p, [article.id]: { ok: false, msg: "Main OK — generiram subtitle..." } }));
      const res2 = await fetch("/api/image-regen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: article.id, image_type: "subtitle", model }),
      });
      const d2 = await res2.json();
      if (!d2.ok) throw new Error(d2.error || "Subtitle gen failed");
      setActionResult((p) => ({ ...p, [article.id]: { ok: true, msg: "✓ Obje slike generirane — čekam..." } }));
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        await refreshArticle(article.id);
        if (attempts >= 12) {
          clearInterval(poll);
          setGenerating((p) => ({ ...p, [article.id]: null }));
        }
      }, 5000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setActionResult((p) => ({ ...p, [article.id]: { ok: false, msg } }));
      setGenerating((p) => ({ ...p, [article.id]: null }));
    }
  };

  // ────────────────────────────────────────────────────────────
  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center font-mono text-cyan-400">Učitavanje članaka...</div>;
  }
  if (error) {
    return <div className="min-h-screen bg-black flex items-center justify-center font-mono text-red-400">Greška: {error}</div>;
  }

  const withImages = articles.filter((a) => !deletedIds.has(a.id) && a.images.length > 0).length;

  return (
    <div className="min-h-screen bg-[#080808] text-white font-mono">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-[#080808]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-base font-bold tracking-widest text-cyan-400 shrink-0">FOTO REVIEW</h1>
          <span className="text-white/30 text-xs shrink-0">
            {filtered.length} / {articles.length - deletedIds.size} &bull; {withImages} sa slikama
          </span>
          {/* Manual URL scrape */}
          <div className="flex items-center gap-1 flex-1 min-w-0 max-w-sm">
            <input
              type="url"
              placeholder="Paste URL ili YouTube link..."
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualScrape()}
              disabled={manualScraping}
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50 disabled:opacity-40"
            />
            <button
              onClick={handleManualScrape}
              disabled={manualScraping || !manualUrl.startsWith("http")}
              className="px-2 py-1 text-[10px] bg-orange-900/40 border border-orange-500/30 text-orange-300 rounded hover:bg-orange-800/50 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 transition-colors"
            >
              {manualScraping ? <span className="animate-pulse">{manualStep || "..."}</span> : "SCRAPE"}
            </button>
            <button
              onClick={() => setBatchOpen(!batchOpen)}
              className={`px-2 py-1 text-[10px] border rounded shrink-0 transition-colors ${batchOpen ? "bg-purple-900/50 border-purple-500/50 text-purple-300" : "bg-white/5 border-white/10 text-white/40 hover:border-purple-500/30 hover:text-purple-300"}`}
            >
              BATCH{batchUrls.length > 0 ? ` (${batchUrls.length})` : ""}
            </button>
          </div>
          {manualResult && (
            <div className="flex flex-col gap-0.5 shrink-0 max-w-xs">
              <span className={`text-[10px] ${manualResult.ok ? "text-green-400" : "text-red-400"}`}>
                {manualResult.msg}
                {manualResult.ok && manualResult.articleId && (
                  <button
                    onClick={() => {
                      const el = articleRefs.current[manualResult.articleId!];
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className="ml-2 text-cyan-400 underline hover:text-cyan-300"
                  >↓ skoči</button>
                )}
              </span>
              {manualResult.steps && manualResult.steps.length > 0 && (
                <div className="text-[9px] text-white/30 leading-tight">
                  {manualResult.steps.map((s, i) => <div key={i}>{s}</div>)}
                </div>
              )}
            </div>
          )}
          <input
            type="text" placeholder="Pretraži..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 w-36"
          />
          <div className="flex gap-1 flex-wrap">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${filterCat === cat ? "bg-cyan-900/40 border-cyan-500/50 text-cyan-300" : "border-white/10 text-white/35 hover:border-white/25 hover:text-white/60"}`}
              >{cat.toUpperCase()}</button>
            ))}
          </div>
          {/* Model selector */}
          <div className="flex items-center gap-1 border border-white/12 rounded overflow-hidden">
            <span className="text-[9px] text-white/25 px-2">GEN:</span>
            <button onClick={() => setGenModel("qwen")}
              className={`text-[10px] px-2.5 py-1 transition-colors ${genModel === "qwen" ? "bg-purple-900/50 text-purple-200" : "text-white/30 hover:text-white/60"}`}
            >QWEN</button>
            <button onClick={() => setGenModel("openai")}
              className={`text-[10px] px-2.5 py-1 transition-colors ${genModel === "openai" ? "bg-green-900/50 text-green-200" : "text-white/30 hover:text-white/60"}`}
            >OPENAI</button>
          </div>

          <div className="flex gap-1 ml-auto items-center flex-wrap justify-end">
            {/* Image filter */}
            {([ ["all","SVE SLIKE"], ["with","SA SLIKAMA"], ["without","BEZ SLIKA"] ] as const).map(([v, l]) => (
              <button key={v} onClick={() => setFilterImg(v)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${filterImg === v ? "bg-yellow-900/40 border-yellow-500/50 text-yellow-300" : "border-white/10 text-white/35 hover:border-white/25 hover:text-white/60"}`}
              >{l}</button>
            ))}
            {/* Upload filter */}
            {([ ["all","SVI"], ["uploaded","UPLOADED"], ["not_uploaded","NIJE UPLOAD"] ] as const).map(([v, l]) => (
              <button key={v} onClick={() => setFilterUploaded(v)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${filterUploaded === v ? "bg-teal-900/40 border-teal-500/50 text-teal-300" : "border-white/10 text-white/35 hover:border-white/25 hover:text-white/60"}`}
              >{l}</button>
            ))}
            {/* Status filter - Only NEOBJAVLJENI vs OBJAVLJENI */}
            {([ ["neobjavljeni","🔴 NEOBJAVLJENI"], ["objavljeni","🟢 OBJAVLJENI"] ] as const).map(([v, l]) => (
              <button key={v} onClick={() => setFilterStatus(v)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${filterStatus === v ? (
                  v === "objavljeni" ? "bg-cyan-900/40 border-cyan-500/50 text-cyan-300" :
                  "bg-orange-900/40 border-orange-500/50 text-orange-300"
                ) : "border-white/10 text-white/35 hover:border-white/25 hover:text-white/60"}`}
              >{l}</button>
            ))}
            {/* Date filter */}
            {([ ["all","SVE DATUME"], ["today","DANAS"], ["yesterday","JUČER"], ["7d","7D"], ["30d","30D"] ] as const).map(([v, l]) => (
              <button key={v} onClick={() => setFilterDate(v)}
                className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${filterDate === v ? "bg-cyan-900/40 border-cyan-500/50 text-cyan-300" : "border-white/10 text-white/35 hover:border-white/25 hover:text-white/60"}`}
              >{l}</button>
            ))}
            {/* Queue toggle */}
            <button onClick={() => { setQueueOpen(q => !q); fetchQueue(); }}
              className={`relative ml-2 text-[10px] px-2.5 py-1 rounded border transition-colors ${queueOpen ? "border-indigo-500/60 bg-indigo-900/30 text-indigo-300" : "border-white/15 text-white/40 hover:text-white/70"}`}
            >
              QUEUE
              {queuePending > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-500 text-white text-[8px] flex items-center justify-center leading-none">
                  {queuePending}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="max-w-screen-2xl mx-auto px-4 pb-3 flex flex-wrap items-center gap-2 text-[10px]">
          <span className="text-white/35">
            Batch: {selectedFiltered.length} oznacenih, {batchSavable.length} spremnih za save
          </span>
          <button
            onClick={handleSelectAllFiltered}
            className="px-2.5 py-1 rounded border border-white/12 text-white/45 hover:text-white/70 hover:border-white/25 transition-colors"
          >
            OZNACI FILTRIRANE
          </button>
          <button
            onClick={handleClearSelected}
            className="px-2.5 py-1 rounded border border-white/12 text-white/45 hover:text-white/70 hover:border-white/25 transition-colors"
          >
            OCISTI OZNAKE
          </button>
          <button
            onClick={handleBatchSave}
            disabled={batchBusy !== null || batchSavable.length === 0}
            className="px-2.5 py-1 rounded border border-green-700/50 text-green-300 disabled:text-white/20 disabled:border-white/10 hover:bg-green-900/20 transition-colors"
          >
            {batchBusy === "save" ? "SPREMAM..." : "BATCH SAVE"}
          </button>
          <button
            onClick={handleBatchPullPress}
            disabled={batchBusy !== null || selectedFiltered.length === 0}
            title="Pronađi press slike za sve označene članke"
            className="px-2.5 py-1 rounded border border-amber-700/50 text-amber-300 disabled:text-white/20 disabled:border-white/10 hover:bg-amber-900/20 transition-colors"
          >
            {batchBusy === "press" ? "📰 PRONALAZIM..." : "📰 BATCH PRESS"}
          </button>
          <button
            onClick={handleBatchPullImages}
            disabled={batchBusy !== null || selectedFiltered.length === 0}
            title="Povuci slobodne web slike za sve označene članke"
            className="px-2.5 py-1 rounded border border-teal-700/50 text-teal-300 disabled:text-white/20 disabled:border-white/10 hover:bg-teal-900/20 transition-colors"
          >
            {batchBusy === "pull" ? "🖼️ POVLAČIM..." : "🖼️ BATCH PULL"}
          </button>
          <button
            onClick={handleBatchPublish}
            disabled={batchBusy !== null || selectedFiltered.length === 0}
            className="px-2.5 py-1 rounded border border-cyan-700/50 text-cyan-300 disabled:text-white/20 disabled:border-white/10 hover:bg-cyan-900/20 transition-colors"
          >
            {batchBusy === "publish" ? "OBJAVLJUJEM..." : "BATCH PUBLISH"}
          </button>
          {batchResult && <span className="text-white/45">{batchResult}</span>}
        </div>

        {/* Queue panel */}
        {queueOpen && (
          <div className="border-t border-indigo-500/20 bg-[#0a0a18] px-4 py-3 max-h-64 overflow-y-auto">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] text-indigo-400/70 tracking-widest">QUEUE STATUS</span>
              {Object.entries(queueCounts).map(([s, n]) => (
                <span key={s} className={`text-[9px] px-1.5 py-0.5 rounded ${
                  s === "pending" ? "bg-yellow-900/30 text-yellow-400" :
                  s === "running" ? "bg-indigo-900/40 text-indigo-300 animate-pulse" :
                  s === "done" ? "bg-green-900/20 text-green-500/70" :
                  "bg-red-900/20 text-red-400/70"
                }`}>{s}: {n}</span>
              ))}
              <button onClick={handleQueueClear}
                className="ml-auto text-[9px] px-2 py-0.5 rounded border border-white/10 text-white/25 hover:text-white/50 transition-colors"
              >CLEAR DONE</button>
            </div>
            {queueTasks.length === 0 ? (
              <div className="text-white/20 text-xs italic">Queue je prazan</div>
            ) : (
              <div className="space-y-1">
                {queueTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-[10px]">
                    <span className={`w-14 text-center rounded px-1 py-0.5 ${
                      t.status === "pending" ? "bg-yellow-900/30 text-yellow-400" :
                      t.status === "running" ? "bg-indigo-900/40 text-indigo-300 animate-pulse" :
                      t.status === "done" ? "text-green-500/50" : "text-red-400/70"
                    }`}>{t.status}</span>
                    <span className="text-white/25">#{t.article_id}</span>
                    <span className="text-white/60">{t.task_type}</span>
                    <span className="text-white/25">[{t.model}]</span>
                    {t.error_msg && <span className="text-red-400/70 truncate max-w-xs">{t.error_msg}</span>}
                    <span className="text-white/15 ml-auto">{t.created_at?.slice(11, 19)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Batch scrape panel */}
        {batchOpen && (
          <div className="border-t border-purple-500/20 bg-[#0c0812] px-4 py-4">
            <div className="max-w-screen-2xl mx-auto">
              {/* Input area — full width, then list below */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-purple-400/70 tracking-widest font-bold">BATCH SCRAPE - Zalijepi linkove (jedan po liniji ili comma-separated)</div>
                  <div className="text-[9px] text-purple-400/50">{batchUrls.length} linkova u listi</div>
                </div>
                <div className="flex gap-3">
                  <textarea
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    placeholder={"https://example.com/article1\nhttps://youtube.com/watch?v=xxx\nhttps://reddit.com/r/tech/...\nhttps://another-article.com"}
                    rows={7}
                    className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white placeholder-white/15 focus:outline-none focus:border-purple-500/50 resize-none font-mono"
                  />
                  <div className="flex flex-col gap-2 pt-0.5">
                    <button
                      onClick={handleBatchAdd}
                      disabled={!batchInput.trim()}
                      className="px-4 py-2 text-[11px] font-bold bg-purple-600/60 border border-purple-400/40 text-purple-100 rounded hover:bg-purple-500/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                    >
                      ➕ ADD TO LIST
                    </button>
                    <button
                      onClick={() => { setBatchUrls([]); setBatchResults([]); setBatchInput(""); }}
                      disabled={batchUrls.length === 0}
                      className="px-4 py-2 text-[11px] border border-red-500/20 text-red-400/70 rounded hover:text-red-300 hover:border-red-500/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      🗑️ OCISTI
                    </button>
                    <button
                      onClick={handleBatchStart}
                      disabled={batchRunning || batchUrls.length === 0}
                      className="px-4 py-2 text-[11px] font-bold bg-green-900/60 border border-green-500/40 text-green-300 rounded hover:bg-green-800/70 disabled:opacity-30 disabled:cursor-not-allowed transition-colors whitespace-nowrap mt-auto"
                    >
                      {batchRunning ? (
                        <span className="animate-pulse">▶️ SKRAPAM...</span>
                      ) : (
                        `▶️ START (${batchUrls.length})`
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* URL list */}
              {batchUrls.length > 0 && (
                <div className="border-t border-purple-500/10 pt-3">
                  <div className="text-[9px] text-purple-400/60 mb-2 font-mono tracking-widest">
                    LISTA LINKOVA ({batchUrls.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto bg-white/2 rounded p-2">
                    {batchUrls.map((u, i) => (
                      <div key={i} className="flex items-start gap-1.5 bg-purple-900/20 rounded p-1.5 group border border-purple-500/10 hover:border-purple-500/30 transition-colors">
                        <span className="text-[8px] text-purple-400/60 shrink-0 font-bold min-w-[16px]">#{i+1}</span>
                        <span className="text-[9px] text-purple-200/70 truncate flex-1 min-w-0 font-mono" title={u}>
                          {u.length > 50 ? u.slice(0, 50) + "…" : u}
                        </span>
                        <button
                          onClick={() => handleBatchRemove(i)}
                          className="text-red-400/40 hover:text-red-400 text-[10px] shrink-0 font-bold transition-colors"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Batch results */}
              {batchResults.length > 0 && (
                <div className="mt-3 border-t border-purple-500/10 pt-2">
                  <div className="text-[10px] text-purple-400/50 mb-1">
                    REZULTATI: {batchResults.filter(r => r.success).length} uspjesnih / {batchResults.length} ukupno
                  </div>
                  <div className="space-y-0.5 max-h-40 overflow-y-auto">
                    {batchResults.map((r, i) => (
                      <div key={i} className={`flex items-center gap-2 text-[9px] ${r.success ? "text-green-400/70" : "text-red-400/70"}`}>
                        <span className="shrink-0">{r.success ? "[OK]" : "[FAIL]"}</span>
                        {r.article_id && <span className="text-white/40">#{r.article_id}</span>}
                        <span className="truncate flex-1 min-w-0">{r.title || r.url || r.message}</span>
                        {r.success && r.article_id && (
                          <button
                            onClick={() => {
                              const el = articleRefs.current[r.article_id!];
                              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}
                            className="text-cyan-400/60 hover:text-cyan-400 shrink-0"
                          >skoci</button>
                        )}
                        {!r.success && <span className="text-red-400/50 truncate max-w-[200px]">{r.message}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Article list */}
      <div className="max-w-screen-2xl mx-auto px-4 py-5 space-y-4">
        {filtered.length === 0 && <div className="text-center text-white/20 py-24 text-sm">Nema članaka</div>}

        {filtered.map((article) => {
          const sel = getSel(article.id);
          const isSaving = saving[article.id];
          const result = actionResult[article.id];
          const genType = generating[article.id];
          const isGenerating = !!genType;
          const isExpanded = expandedIds.has(article.id);
          const catCls = CAT_COLORS[article.category] ?? "bg-gray-900 text-gray-300 border-gray-700/50";
          const full = fullData[article.id];
          const isFullLoading = fullLoading[article.id];
          const edits = editData[article.id];
          const lang = editLang[article.id] ?? "hr";
          const isSavingEdit = savingEdit[article.id];
          const isRegenning = regenningEndings[article.id];
          const isWritingEn = writingEn[article.id];

          const hrEndings = parseEndings(full?.endings_json ?? null);
          const enEndings = parseEndings(full?.endings_en ?? null);
          const curEndings = lang === "en" ? enEndings : hrEndings;

          return (
            <div key={article.id} ref={el => { articleRefs.current[article.id] = el; }} className={`border rounded-lg bg-[#0f0f0f] overflow-hidden ${deepLinkId === article.id ? "border-cyan-500/50" : "border-white/8"}`}>
              {/* Article header */}
              <div className="px-4 py-3 border-b border-white/8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <label className="flex items-center gap-2 text-[10px] text-white/40 shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(article.id)}
                    onChange={() => toggleSelected(article.id)}
                    className="accent-cyan-400"
                  />
                  batch
                </label>
                <span className="text-white/25 text-xs tabular-nums">#{article.id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${catCls}`}>
                  {article.category.toUpperCase()}
                </span>
                <h2 className="text-sm font-semibold text-white/90 flex-1 min-w-0 leading-snug">
                  {article.title}
                </h2>
                {article.title_en && (
                  <span className="text-white/25 text-[10px] italic truncate max-w-xs hidden lg:block">
                    {article.title_en}
                  </span>
                )}
                <span className={`text-[10px] shrink-0 ${STATUS_COLORS[article.status] ?? "text-white/30"}`}>
                  {article.status}
                </span>
                <span className="text-white/20 text-[10px] shrink-0">{article.pipeline_stage}</span>
                {article.github_uploaded ? <span className="text-cyan-500/70 text-[10px] shrink-0">✓ uploaded</span> : null}
                {/* Expand toggle */}
                <button
                  onClick={() => { handleExpand(article.id); setEditCategory(p => ({ ...p, [article.id]: p[article.id] ?? article.category })); }}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors shrink-0 ${isExpanded ? "border-cyan-500/50 text-cyan-300 bg-cyan-900/20" : "border-white/15 text-white/35 hover:border-white/30 hover:text-white/60"}`}
                >
                  {isExpanded ? "▲ SAŽMI" : "▼ PROŠIRI"}
                </button>
              </div>

              {/* Source Info */}
              {(article.source_name || article.source_published_at) && (
                <div className="px-4 py-2 text-white/40 text-[11px] flex flex-wrap gap-3 border-b border-white/5">
                  {article.source_name && (
                    <span>📰 <span className="text-white/60">{article.source_name}</span></span>
                  )}
                  {article.source_published_at && (
                    <span>
                      📅{" "}
                      {new Date(article.source_published_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "UTC"
                      })}
                      {" UTC"}
                    </span>
                  )}
                </div>
              )}

              {/* Lead */}
              {article.lead && (
                <div className="px-4 py-2 text-white/50 text-xs leading-relaxed border-b border-white/5">
                  {article.lead}
                </div>
              )}

              {article.memoryAlert && (
                <div className={`mx-4 mt-3 rounded-lg border px-3 py-2.5 ${
                  article.memoryAlert.status === "duplicate"
                    ? "border-red-700/50 bg-red-950/25"
                    : "border-amber-700/50 bg-amber-950/25"
                }`}>
                  <div className={`text-[11px] font-semibold ${
                    article.memoryAlert.status === "duplicate" ? "text-red-300" : "text-amber-300"
                  }`}>
                    {article.memoryAlert.status === "duplicate"
                      ? "Mogući duplikat iste priče"
                      : "Slična tema je već obrađena"}
                  </div>
                  {article.memoryAlert.reason && (
                    <div className="mt-1 text-[11px] text-white/70 leading-relaxed">
                      {article.memoryAlert.reason}
                    </div>
                  )}
                  {article.memoryAlert.matches.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {article.memoryAlert.matches.slice(0, 3).map((match) => (
                        <div key={match.id} className="rounded border border-white/8 bg-black/20 px-2 py-1.5">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
                            <span className="text-white/35">#{match.id}</span>
                            <span className="text-white/85">{match.title}</span>
                            {match.status && <span className="text-white/35 uppercase">{match.status}</span>}
                            <span className="text-white/35">score {(match.score * 100).toFixed(0)}%</span>
                            <a href={match.panelUrl} className="text-cyan-300 hover:text-cyan-200 underline ml-auto">
                              otvori ↗
                            </a>
                          </div>
                          {match.reason && (
                            <div className="mt-1 text-[10px] text-white/45 leading-relaxed">
                              {match.reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* YouTube preview (always visible when source is YouTube) */}
              {(() => {
                const ytMatch = article.source_url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
                if (!ytMatch) return null;
                const ytId = ytMatch[1];
                return (
                  <div className="mx-4 mb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-red-400 text-[10px] font-bold">▶ YouTube izvor</span>
                      <a href={article.source_url!} target="_blank" rel="noopener noreferrer"
                        className="text-red-400/50 hover:text-red-300 underline text-[10px]"
                      >otvori ↗</a>
                    </div>
                    <div className="rounded-lg overflow-hidden aspect-video max-w-sm border border-red-900/40">
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}`}
                        className="w-full h-full"
                        allowFullScreen
                        title="YouTube preview"
                        loading="lazy"
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Images grid */}
              {article.images.length > 0 ? (
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                    {article.images.map((img) => {
                      const isHero = sel.hero === img.id;
                      const isSub = sel.subtitle === img.id;
                      return (
                        <div key={img.id}
                          className={`relative group rounded overflow-hidden border-2 transition-all duration-150 ${isHero ? "border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.3)]" : isSub ? "border-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.3)]" : "border-white/10 hover:border-white/25"}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.url}
                            alt={img.label}
                            className="w-full aspect-video object-cover block cursor-zoom-in"
                            loading="lazy"
                            onClick={() => setPreviewImage({ url: img.url, label: img.label })}
                            title="Klikni za uvećanje"
                          />
                          {(isHero || isSub) && (
                            <div className={`absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded z-10 ${isHero ? "bg-green-500 text-black" : "bg-blue-500 text-white"}`}>
                              {isHero ? "HERO" : "PODNASLOV"}
                            </div>
                          )}
                          <button onClick={() => handleDeleteImage(article.id, img.id)}
                            className="absolute top-1 right-1 z-20 w-5 h-5 rounded bg-black/70 text-red-400 hover:bg-red-900/80 hover:text-red-200 text-xs flex items-center justify-center leading-none transition-colors"
                            title="Obriši sliku"
                          >×</button>
                          <div className="absolute bottom-0 inset-x-0 bg-black/70">
                            <div className="px-1.5 pt-1 text-white/40 text-[9px] truncate">{img.label}</div>
                            {img.description && (
                              <div className="px-1.5 text-white/60 text-[8px] leading-tight line-clamp-2" title={img.description}>
                                {img.description}
                              </div>
                            )}
                            {img.attribution && (
                              <div className="px-1.5 pb-1 flex items-center gap-1 min-w-0">
                                {img.sourceUrl ? (
                                  <a href={img.sourceUrl} target="_blank" rel="noopener noreferrer"
                                    className="text-[8px] text-blue-300/70 hover:text-blue-300 truncate leading-tight block max-w-full"
                                    title={img.attribution}
                                    onClick={e => e.stopPropagation()}
                                  >📷 {img.attribution}</a>
                                ) : (
                                  <span className="text-[8px] text-white/30 truncate leading-tight block max-w-full" title={img.attribution}>
                                    📷 {img.attribution}
                                  </span>
                                )}
                              </div>
                            )}
                            {!img.attribution && <div className="pb-1" />}
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors pointer-events-none" />
                          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-1.5 z-10">
                            <button onClick={() => setRole(article.id, img.id, "hero")}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded transition-colors ${isHero ? "bg-green-500 text-black" : "bg-black/90 text-green-300 border border-green-500/60 hover:bg-green-900/60"}`}
                            >HERO</button>
                            <button onClick={() => setRole(article.id, img.id, "subtitle")}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded transition-colors ${isSub ? "bg-blue-500 text-white" : "bg-black/90 text-blue-300 border border-blue-500/60 hover:bg-blue-900/60"}`}
                            >POD</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {(sel.hero || sel.subtitle) && (
                    <div className="mt-2 flex gap-4 text-[10px] text-white/40">
                      {sel.hero && <span><span className="text-green-400">HERO</span> → {article.images.find((i) => i.id === sel.hero)?.label}</span>}
                      {sel.subtitle && <span><span className="text-blue-400">PODNASLOV</span> → {article.images.find((i) => i.id === sel.subtitle)?.label}</span>}
                    </div>
                  )}
                </div>
              ) : (() => {
                // YouTube embed if source is YouTube
                const ytSrc = full?.source_url || null;
                const ytMatch = ytSrc?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
                if (ytMatch) {
                  return (
                    <div className="p-4">
                      <div className="rounded-lg overflow-hidden aspect-video max-w-2xl">
                        <iframe
                          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                          className="w-full h-full"
                          allowFullScreen
                          title="YouTube preview"
                        />
                      </div>
                      <div className="mt-1 text-white/20 text-[10px] italic">YouTube embed — nema slike</div>
                    </div>
                  );
                }
                return <div className="px-4 py-3 text-white/20 text-xs italic">Nema slika</div>;
              })()}

              {/* Image action bar */}
              <div className="px-4 py-3 border-t border-white/8 flex items-center gap-2 flex-wrap">
                {result && (
                  <span className={`text-xs ${result.ok ? "text-green-400" : "text-red-400"}`}>{result.msg}</span>
                )}
                {result && (
                  <button onClick={() => handleShowLog(article.id)}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-white/10 text-white/25 hover:text-white/50 hover:border-white/20 transition-colors"
                  >📋 LOG</button>
                )}
                <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
                  {/* Pull press images */}
                  <button
                    onClick={() => handlePullPress(article)}
                    disabled={pullingPress[article.id] || pulling[article.id] || isGenerating}
                    title="Pronađi službene press/newsroom slike (brže, prije web pull)"
                    className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${
                      pullingPress[article.id]
                        ? "border-amber-500/60 text-amber-300 animate-pulse"
                        : (pullingPress[article.id] || pulling[article.id] || isGenerating)
                          ? "border-white/8 text-white/20 cursor-not-allowed"
                          : "border-amber-700/50 text-amber-400/80 hover:bg-amber-900/20 hover:text-amber-300"
                    }`}
                  >{pullingPress[article.id] ? "📰 Pronalazim..." : "📰 PULL PRESS"}</button>
                  {/* Pull web images */}
                  <button
                    onClick={() => handlePullWeb(article)}
                    disabled={pulling[article.id] || pullingPress[article.id] || isGenerating}
                    title="Povuci slike s weba (og:image → Wikimedia → Unsplash)"
                    className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${
                      pulling[article.id]
                        ? "border-sky-500/60 text-sky-300 animate-pulse"
                        : (pulling[article.id] || pullingPress[article.id] || isGenerating)
                          ? "border-white/8 text-white/20 cursor-not-allowed"
                          : "border-sky-700/50 text-sky-400/80 hover:bg-sky-900/20 hover:text-sky-300"
                    }`}
                  >{pulling[article.id] ? "🌐 Povlačim..." : "🌐 PULL WEB"}</button>
                  {/* Per-article model toggle */}
                  <div className="flex items-center border border-white/10 rounded overflow-hidden">
                    <button onClick={() => setArticleModels(p => ({ ...p, [article.id]: "qwen" }))}
                      className={`text-[9px] px-2 py-1 transition-colors ${getArticleModel(article.id) === "qwen" ? "bg-purple-900/50 text-purple-200" : "text-white/25 hover:text-white/50"}`}
                    >QWEN</button>
                    <button onClick={() => setArticleModels(p => ({ ...p, [article.id]: "openai" }))}
                      className={`text-[9px] px-2 py-1 transition-colors ${getArticleModel(article.id) === "openai" ? "bg-green-900/50 text-green-200" : "text-white/25 hover:text-white/50"}`}
                    >OPENAI</button>
                  </div>
                  <button onClick={() => handleGenerate(article, "main")} disabled={isGenerating}
                    className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${genType === "main" ? "border-yellow-500/60 text-yellow-300 animate-pulse" : isGenerating ? "border-white/8 text-white/20 cursor-not-allowed" : "border-yellow-700/50 text-yellow-400/70 hover:bg-yellow-900/20 hover:text-yellow-300"}`}
                  >{genType === "main" ? "⚡ Generiram..." : "⚡ GEN MAIN"}</button>
                  <button onClick={() => handleQueueAdd(article.id, "gen_main", getArticleModel(article.id))} title="Dodaj u queue"
                    className={`text-[10px] px-1.5 py-1.5 rounded border border-indigo-800/50 text-indigo-500/60 hover:bg-indigo-900/20 hover:text-indigo-300 transition-colors ${queueAdding[`${article.id}-gen_main`] ? "animate-pulse" : ""}`}
                  >+Q</button>
                  <button onClick={() => handleGenerate(article, "subtitle")} disabled={isGenerating}
                    className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${genType === "subtitle" ? "border-yellow-500/60 text-yellow-300 animate-pulse" : isGenerating ? "border-white/8 text-white/20 cursor-not-allowed" : "border-yellow-700/50 text-yellow-400/70 hover:bg-yellow-900/20 hover:text-yellow-300"}`}
                  >{genType === "subtitle" ? "⚡ Generiram..." : "⚡ GEN POD"}</button>
                  <button onClick={() => handleQueueAdd(article.id, "gen_subtitle", getArticleModel(article.id))} title="Dodaj u queue"
                    className={`text-[10px] px-1.5 py-1.5 rounded border border-indigo-800/50 text-indigo-500/60 hover:bg-indigo-900/20 hover:text-indigo-300 transition-colors ${queueAdding[`${article.id}-gen_subtitle`] ? "animate-pulse" : ""}`}
                  >+Q</button>
                  <button onClick={() => handleGenerateBoth(article)} disabled={isGenerating}
                    className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${isGenerating ? "border-white/8 text-white/20 cursor-not-allowed" : "border-orange-700/50 text-orange-400/70 hover:bg-orange-900/20 hover:text-orange-300"}`}
                  >{genType && isGenerating ? "⚡ Generiram..." : "⚡ GEN OBA"}</button>
                  {article.images.length > 0 && (
                    <button onClick={() => handleSave(article)} disabled={isSaving || !sel.hero}
                      className={`text-xs px-3 py-1.5 rounded border transition-colors ${sel.hero && !isSaving ? "border-green-600/60 text-green-300 hover:bg-green-900/25" : "border-white/8 text-white/20 cursor-not-allowed"}`}
                    >{isSaving ? "Snimam..." : "SPREMI ODABIR"}</button>
                  )}
                  <button
                    onClick={() => handlePublishLocal(article.id)}
                    disabled={publishing[article.id]}
                    className="text-xs px-3 py-1.5 rounded border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/25 hover:border-cyan-400 transition-colors font-bold disabled:opacity-50"
                  >
                    {publishing[article.id] ? "⏳ Objavl..." : "🚀 PUBLISH"}
                  </button>
                  <button onClick={() => handleDeleteArticle(article.id)}
                    className="text-xs px-3 py-1.5 rounded border border-red-900/60 text-red-500/80 hover:bg-red-950/40 hover:text-red-400 transition-colors"
                  >TRAJNO OBRIŠI</button>
                </div>
                {publishResult[article.id] && (
                  <div className={`text-xs font-mono mt-1 px-2 py-1 rounded ${publishResult[article.id].ok ? "text-cyan-300" : "text-red-400"}`}>
                    {publishResult[article.id].msg}
                  </div>
                )}
              </div>

              {/* Log viewer */}
              {showLog[article.id] && (
                <div className="border-t border-white/5 bg-black/40 px-4 py-3">
                  {logLoading ? (
                    <span className="text-white/25 text-xs">Učitavam log...</span>
                  ) : (
                    <pre className="text-[10px] text-white/45 leading-relaxed overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {logLines.length > 0 ? logLines.join("\n") : "Log je prazan"}
                    </pre>
                  )}
                </div>
              )}

              {/* ── Expanded panel ── */}
              {isExpanded && (
                <div className="border-t border-cyan-500/20 bg-[#0a0a12]">
                  {isFullLoading ? (
                    <div className="px-6 py-6 text-cyan-400/60 text-xs">Učitavam...</div>
                  ) : full && edits ? (
                    <div className="px-6 py-5 space-y-5">

                      {/* HR missing warning */}
                      {!full.part1 && full.body_md && (
                        <div className="text-[10px] text-yellow-500/70 bg-yellow-950/20 border border-yellow-800/30 rounded px-3 py-2">
                          ⚠ Stari članak — HR tekst prikazan iz <code>body_md</code>. Klikni <strong>NAPIŠI HR</strong> za strukturirani prepis.
                        </div>
                      )}
                      {!full.part1 && !full.body_md && (
                        <div className="text-[10px] text-red-500/70 bg-red-950/20 border border-red-800/30 rounded px-3 py-2">
                          ✕ Nema HR teksta. Klikni <strong>NAPIŠI HR</strong> za generiranje.
                        </div>
                      )}

                      {/* Top action bar */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Language tabs */}
                        <div className="flex rounded overflow-hidden border border-white/15 mr-2">
                          <button onClick={() => setEditLang(p => ({ ...p, [article.id]: "hr" }))}
                            className={`text-[10px] px-3 py-1 transition-colors ${lang === "hr" ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"}`}
                          >HR</button>
                          <button onClick={() => setEditLang(p => ({ ...p, [article.id]: "en" }))}
                            className={`text-[10px] px-3 py-1 transition-colors ${lang === "en" ? "bg-white/10 text-white" : "text-white/35 hover:text-white/60"}`}
                          >EN</button>
                        </div>

                        {result && (
                          <span className={`text-xs ${result.ok ? "text-green-400" : "text-red-400"}`}>{result.msg}</span>
                        )}

                        <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
                          <button onClick={() => handleSaveEdit(article.id)} disabled={isSavingEdit}
                            className={`text-xs px-3 py-1.5 rounded border transition-colors ${isSavingEdit ? "border-white/8 text-white/20" : "border-green-700/50 text-green-400/80 hover:bg-green-900/20 hover:text-green-300"}`}
                          >{isSavingEdit ? "Snimam..." : "SPREMI IZMJENE"}</button>
                          <button onClick={() => handleWriteHr(article.id)}
                            className="text-xs px-3 py-1.5 rounded border border-cyan-900/50 text-cyan-500/70 hover:bg-cyan-900/20 hover:text-cyan-300 transition-colors"
                          >NAPIŠI HR</button>
                          <button onClick={() => handleQueueAdd(article.id, "rewrite_hr")} title="Dodaj NAPIŠI HR u queue"
                            className={`text-[10px] px-1.5 py-1.5 rounded border border-cyan-800/40 text-cyan-500/50 hover:bg-cyan-900/20 hover:text-cyan-300 transition-colors ${queueAdding[`${article.id}-rewrite_hr`] ? "animate-pulse" : ""}`}
                          >+Q</button>
                          <button onClick={() => handleWriteEn(article.id)} disabled={isWritingEn}
                            className={`text-xs px-3 py-1.5 rounded border transition-colors ${isWritingEn ? "border-blue-500/40 text-blue-300 animate-pulse" : "border-blue-800/50 text-blue-400/70 hover:bg-blue-900/20 hover:text-blue-300"}`}
                          >{isWritingEn ? "⚡ Pišem EN..." : "NAPIŠI EN"}</button>
                          <button onClick={() => handleQueueAdd(article.id, "write_en")} title="Dodaj NAPIŠI EN u queue"
                            className={`text-[10px] px-1.5 py-1.5 rounded border border-blue-800/40 text-blue-500/50 hover:bg-blue-900/20 hover:text-blue-300 transition-colors ${queueAdding[`${article.id}-write_en`] ? "animate-pulse" : ""}`}
                          >+Q</button>
                          <button onClick={() => handleRewrite(article.id)}
                            className="text-xs px-3 py-1.5 rounded border border-orange-800/50 text-orange-400/70 hover:bg-orange-900/20 hover:text-orange-300 transition-colors"
                          >REWRITE</button>
                          <button onClick={() => handleReject(article.id)}
                            className="text-xs px-3 py-1.5 rounded border border-red-900/50 text-red-500/70 hover:bg-red-950/30 hover:text-red-400 transition-colors"
                          >ODBIJ</button>
                        </div>
                      </div>

                      {/* Category picker */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30 tracking-widest uppercase shrink-0">Kategorija</span>
                        <select
                          value={editCategory[article.id] ?? article.category ?? ""}
                          onChange={(ev) => setEditCategory(p => ({ ...p, [article.id]: ev.target.value }))}
                          className="text-xs px-2 py-1 rounded border border-white/15 bg-black/40 text-white/80 focus:outline-none focus:border-white/30"
                        >
                          <option value="">-- Odaberi kategoriju --</option>
                          {[
                            { value: "ai", label: "AI" },
                            { value: "gaming", label: "Gaming" },
                            { value: "tech", label: "Technology" },
                            { value: "robotics", label: "Robotics" },
                            { value: "space", label: "Space" },
                            { value: "medicine", label: "Medicine" },
                            { value: "society", label: "Society" },
                            { value: "energy", label: "Energy" },
                          ].map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                        {(editCategory[article.id] && editCategory[article.id] !== article.category) && (
                          <span className="text-[10px] text-yellow-400/70">● promijenjeno</span>
                        )}
                      </div>

                      {/* Editable fields */}
                      <div className="space-y-3">
                        <EditField label={lang === "hr" ? "NASLOV" : "TITLE"}
                          value={lang === "hr" ? edits.title : edits.title_en}
                          onChange={(v) => setEditField(article.id, lang === "hr" ? "title" : "title_en", v)}
                          rows={2}
                        />
                        {/* Lead sentence */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] tracking-widest text-cyan-500/50 uppercase block">
                              {lang === "hr" ? "LEAD REČENICA (HR)" : "LEAD SENTENCE (EN)"}
                            </label>
                            <button
                              onClick={() => handleRegenLead(article.id)}
                              disabled={regenningLead[article.id]}
                              className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${regenningLead[article.id] ? "border-cyan-500/40 text-cyan-300 animate-pulse" : "border-cyan-800/40 text-cyan-500/50 hover:bg-cyan-900/20 hover:text-cyan-400"}`}
                            >{regenningLead[article.id] ? "⚡ Generiram..." : "⚡ REGEN LEAD"}</button>
                          </div>
                          <textarea
                            value={lang === "hr" ? edits.lead_sentence : edits.lead_sentence_en}
                            onChange={(e) => setEditField(article.id, lang === "hr" ? "lead_sentence" : "lead_sentence_en", e.target.value)}
                            rows={2}
                            placeholder={lang === "hr" ? "Kratka rečenica koja opisuje ključnu informaciju iz članka (max 130 znakova)..." : "Short sentence describing key info from article (max 130 chars)..."}
                            className="w-full bg-cyan-950/20 border border-cyan-800/30 rounded px-3 py-2 text-xs text-cyan-100/80 leading-relaxed resize-y focus:outline-none focus:border-cyan-500/40 focus:bg-cyan-950/30 transition-colors placeholder-cyan-900/60"
                            spellCheck={false}
                          />
                          {(lang === "hr" ? edits.lead_sentence : edits.lead_sentence_en).length > 130 && (
                            <span className="text-[9px] text-red-400/70">⚠ Previše znakova ({(lang === "hr" ? edits.lead_sentence : edits.lead_sentence_en).length}/130)</span>
                          )}
                        </div>

                        {/* Exec Summary */}
                        <div className="space-y-1">
                          <label className="text-[9px] tracking-widest text-yellow-600/50 uppercase block">
                            {lang === "hr" ? "SAŽETAK (2 REČENICE)" : "EXEC SUMMARY (2 SENTENCES)"}
                          </label>
                          <textarea
                            value={lang === "hr" ? edits.exec_summary : edits.exec_summary_en}
                            onChange={(e) => setEditField(article.id, lang === "hr" ? "exec_summary" : "exec_summary_en", e.target.value)}
                            rows={3}
                            placeholder={lang === "hr" ? "2-3 rečenice sa ključnim zaključcima članka za editory i čitatelje..." : "2-3 sentences with key findings from article for editors and readers..."}
                            className="w-full bg-yellow-950/20 border border-yellow-800/30 rounded px-3 py-2 text-xs text-yellow-100/70 leading-relaxed resize-y focus:outline-none focus:border-yellow-500/40 focus:bg-yellow-950/30 transition-colors placeholder-yellow-900/60"
                            spellCheck={false}
                          />
                          <span className="text-[9px] text-yellow-600/50">({(lang === "hr" ? edits.exec_summary : edits.exec_summary_en).length} znakova)</span>
                        </div>

                        <EditField label={lang === "hr" ? "UVOD (part1)" : "LEAD (part1_en)"}
                          value={lang === "hr" ? edits.part1 : edits.part1_en}
                          onChange={(v) => setEditField(article.id, lang === "hr" ? "part1" : "part1_en", v)}
                          rows={5}
                        />
                        <EditField label={lang === "hr" ? "PODNASLOV" : "SUBTITLE"}
                          value={lang === "hr" ? edits.subtitle : edits.subtitle_en}
                          onChange={(v) => setEditField(article.id, lang === "hr" ? "subtitle" : "subtitle_en", v)}
                          rows={2}
                        />
                        <EditField label={lang === "hr" ? "DIO 2 (part2)" : "PART2 (part2_en)"}
                          value={lang === "hr" ? edits.part2 : edits.part2_en}
                          onChange={(v) => setEditField(article.id, lang === "hr" ? "part2" : "part2_en", v)}
                          rows={5}
                        />
                        <EditField label={lang === "hr" ? "KLJUČNE TOČKE" : "KEY POINTS"}
                          value={lang === "hr" ? edits.key_points_hr : edits.key_points_en}
                          onChange={(v) => setEditField(article.id, lang === "hr" ? "key_points_hr" : "key_points_en", v)}
                          rows={3}
                        />
                      </div>

                      {/* Endings */}
                      {(Object.keys(hrEndings).length > 0 || Object.keys(enEndings).length > 0) && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-white/30 tracking-widest uppercase">Završeci</span>
                            <button onClick={() => handleRegenEndings(article.id)} disabled={isRegenning}
                              className={`text-[10px] px-2.5 py-1 rounded border transition-colors ${isRegenning ? "border-yellow-500/40 text-yellow-300 animate-pulse" : "border-yellow-800/40 text-yellow-500/60 hover:bg-yellow-900/20 hover:text-yellow-400"}`}
                            >{isRegenning ? "⚡ Regeneriram..." : "⚡ GENERIRAJ PONOVO"}</button>
                            <button onClick={() => handleQueueAdd(article.id, "regen_endings")} title="Dodaj GENERIRAJ PONOVO u queue"
                              className={`text-[10px] px-1.5 py-1 rounded border border-yellow-800/30 text-yellow-500/40 hover:bg-yellow-900/20 hover:text-yellow-300 transition-colors ${queueAdding[`${article.id}-regen_endings`] ? "animate-pulse" : ""}`}
                            >+Q</button>
                          </div>
                          {(["A", "B", "C"] as const).map((key) => {
                            const text = curEndings[key];
                            if (!text) return null;
                            const isChosen = full.chosen_ending === key;
                            return (
                              <div key={key}
                                className={`rounded border p-3 ${isChosen ? "border-green-600/40 bg-green-950/20" : "border-white/8 bg-white/2"}`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${isChosen ? "bg-green-500 text-black" : "bg-white/10 text-white/50"}`}>
                                      {key}
                                    </span>
                                    <p className="text-xs text-white/65 leading-relaxed line-clamp-4 flex-1">
                                      {text}
                                    </p>
                                  </div>
                                  <button onClick={() => handlePublish(article.id, key)}
                                    className={`text-[10px] px-3 py-1.5 rounded border shrink-0 transition-colors ${isChosen ? "border-green-600/50 text-green-300 hover:bg-green-900/30" : "border-white/15 text-white/40 hover:border-green-600/40 hover:text-green-300 hover:bg-green-900/15"}`}
                                  >{isChosen ? "✓ OBJAVI" : "OBJAVI"}</button>
                                </div>
                              </div>
                            );
                          })}
                          {Object.keys(curEndings).length === 0 && (
                            <div className="text-white/20 text-xs italic px-1">
                              {lang === "en" ? "Nema EN završetaka" : "Nema završetaka"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-6 py-4 text-red-400/60 text-xs">Greška pri učitavanju</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-[96vw] max-h-[96vh]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage.url}
              alt={previewImage.label}
              className="max-w-[96vw] max-h-[90vh] object-contain rounded border border-white/15 shadow-2xl"
            />
            <div className="mt-2 text-center text-xs text-white/60">{previewImage.label}</div>
            <div className="mt-1 text-center text-[10px] text-white/35">ESC ili klik van slike za zatvoriti</div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditField({
  label, value, onChange, rows,
}: {
  label: string; value: string; onChange: (v: string) => void; rows: number;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] tracking-widest text-white/25 uppercase block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-white/4 border border-white/8 rounded px-3 py-2 text-xs text-white/85 leading-relaxed resize-y focus:outline-none focus:border-cyan-500/40 focus:bg-white/6 transition-colors placeholder-white/15"
        spellCheck={false}
      />
    </div>
  );
}
