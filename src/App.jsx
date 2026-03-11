import { useState, useEffect, useCallback } from "react";

const SEARCHES = [
  {
    id: "midnightntwrk",
    label: "midnightntwrk",
    description: "Official ecosystem topic",
    query: "topic:midnightntwrk",
    color: "#7C3AED",
    accent: "#A78BFA",
  },
  {
    id: "compact",
    label: "compact",
    description: "Compact language topic",
    query: "topic:compact midnight",
    color: "#0E7490",
    accent: "#22D3EE",
  },
  {
    id: "midnight",
    label: "midnight",
    description: "Midnight topic tag",
    query: "topic:midnight zk",
    color: "#1D4ED8",
    accent: "#60A5FA",
  },
  {
    id: "midnight-name",
    label: "midnight (name+readme)",
    description: "Keyword: 'midnight' in name OR 'midnight network' in readme (GitHub treats as OR)",
    query: 'midnight in:name "midnight network" in:readme',
    color: "#B45309",
    accent: "#FCD34D",
  },
];

// In-memory cache: { [searchId]: { repos: [], fetchedAt: Date } }
const CACHE = {};
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getCached(id) {
  const entry = CACHE[id];
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
  return entry;
}

function setCached(id, repos) {
  CACHE[id] = { repos, fetchedAt: Date.now() };
}

// Fixed anchor: EC submission date
const EC_SUBMISSION_DATE = "2026-03-06";

function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isNew(dateStr) {
  return new Date(dateStr) >= new Date(EC_SUBMISSION_DATE);
}

function isActive(dateStr) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return new Date(dateStr) >= weekAgo;
}

async function fetchRepos(query, token = "") {
  const headers = {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const firstUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(
    query
  )}&sort=updated&order=desc&per_page=100&page=1`;

  const firstRes = await fetch(firstUrl, { headers });
  if (!firstRes.ok) throw new Error(`GitHub API error: ${firstRes.status}`);
  const firstData = await firstRes.json();

  const totalCount = firstData.total_count || 0;
  let allItems = firstData.items || [];

  // GitHub search API caps at 1000 results (10 pages of 100)
  const totalPages = Math.min(Math.ceil(totalCount / 100), 10);

  for (let page = 2; page <= totalPages; page++) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(
      query
    )}&sort=updated&order=desc&per_page=100&page=${page}`;
    const res = await fetch(url, { headers });
    if (!res.ok) break;
    const data = await res.json();
    allItems = [...allItems, ...(data.items || [])];
  }

  return allItems;
}

function RepoCard({ repo, isNewRepo, accent }) {
  return (
    <a
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        background: isNewRepo
          ? "rgba(124,58,237,0.08)"
          : "rgba(255,255,255,0.03)",
        border: `1px solid ${isNewRepo ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 8,
        padding: "12px 14px",
        marginBottom: 8,
        textDecoration: "none",
        transition: "all 0.15s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isNewRepo
          ? "rgba(124,58,237,0.14)"
          : "rgba(255,255,255,0.06)";
        e.currentTarget.style.borderColor = accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = isNewRepo
          ? "rgba(124,58,237,0.08)"
          : "rgba(255,255,255,0.03)";
        e.currentTarget.style.borderColor = isNewRepo
          ? "rgba(167,139,250,0.3)"
          : "rgba(255,255,255,0.07)";
      }}
    >
      {isNewRepo && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            background: "#7C3AED",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            padding: "2px 6px",
            borderRadius: 4,
            textTransform: "uppercase",
          }}
        >
          NEW
        </span>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 4,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#E2E8F0",
              fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {repo.full_name}
          </div>
          {repo.description && (
            <div
              style={{
                fontSize: 11,
                color: "#94A3B8",
                marginTop: 3,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                lineHeight: 1.5,
              }}
            >
              {repo.description}
            </div>
          )}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 14,
          marginTop: 6,
          alignItems: "center",
        }}
      >
        {repo.language && (
          <span style={{ fontSize: 10, color: "#64748B", display: "flex", alignItems: "center", gap: 4 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#A78BFA",
                display: "inline-block",
              }}
            />
            {repo.language}
          </span>
        )}
        <span style={{ fontSize: 10, color: "#64748B" }}>
          ⭐ {repo.stargazers_count}
        </span>
        <span style={{ fontSize: 10, color: "#64748B" }}>
          Updated {timeAgo(repo.updated_at)}
        </span>
        {isNewRepo && (
          <span style={{ fontSize: 10, color: "#A78BFA", fontWeight: 600 }}>
            Created {timeAgo(repo.created_at)}
          </span>
        )}
      </div>
      {repo.topics && repo.topics.length > 0 && (
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 7 }}
        >
          {repo.topics.slice(0, 5).map((t) => (
            <span
              key={t}
              style={{
                fontSize: 10,
                color:
                  t === "midnightntwrk" || t === "midnight" || t === "compact" || t === "compact-framework"
                    ? accent
                    : "#475569",
                background:
                  t === "midnightntwrk" || t === "midnight" || t === "compact" || t === "compact-framework"
                    ? "rgba(167,139,250,0.1)"
                    : "rgba(255,255,255,0.04)",
                padding: "2px 6px",
                borderRadius: 4,
                border:
                  t === "midnightntwrk" || t === "midnight" || t === "compact" || t === "compact-framework"
                    ? "1px solid rgba(167,139,250,0.2)"
                    : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}

function SearchPanel({ search, repos, loading, error, newCount, cacheEntry }) {
  const [expanded, setExpanded] = useState(true);

  const cacheAge = cacheEntry
    ? Math.floor((Date.now() - cacheEntry.fetchedAt) / 60000)
    : null;
  return (
    <div
      style={{
        background: "rgba(15,15,25,0.6)",
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          background: `linear-gradient(90deg, ${search.color}18 0%, transparent 60%)`,
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: search.accent,
              boxShadow: `0 0 8px ${search.accent}`,
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: search.accent,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {search.query.startsWith("topic:") ? `topic:${search.label}` : search.query}
          </span>
          <span style={{ fontSize: 11, color: "#64748B" }}>
            {search.description}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {newCount > 0 && (
            <span
              style={{
                background: "#7C3AED",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 20,
              }}
            >
              {newCount} new this week
            </span>
          )}
          {!loading && repos && (
            <span style={{ fontSize: 11, color: "#475569" }}>
              {repos.length} repos
              {cacheEntry && (
                <span style={{ color: cacheEntry.fromCache ? "#22D3EE" : "#4ADE80", marginLeft: 5 }}>
                  {cacheEntry.fromCache ? `· cached ${cacheAge}m ago` : "· fresh"}
                </span>
              )}
            </span>
          )}
          <span style={{ color: "#475569", fontSize: 12 }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: "14px 16px" }}>
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#475569",
                fontSize: 12,
                padding: "20px 0",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  border: `2px solid ${search.accent}`,
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Fetching from GitHub...
            </div>
          )}
          {error && (
            <div
              style={{
                color: "#F87171",
                fontSize: 12,
                padding: "16px 0",
                textAlign: "center",
              }}
            >
              {error.includes("403")
                ? "Rate limited by GitHub API. Add a token or wait ~60s."
                : `Error: ${error}`}
            </div>
          )}
          {!loading && !error && repos && repos.length === 0 && (
            <div
              style={{
                color: "#475569",
                fontSize: 12,
                padding: "16px 0",
                textAlign: "center",
              }}
            >
              No repos found.
            </div>
          )}
          {!loading &&
            !error &&
            repos &&
            repos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                isNewRepo={isNew(repo.created_at)}
                accent={search.accent}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [lastRun, setLastRun] = useState(null);
  const [cacheInfo, setCacheInfo] = useState({}); // { [id]: { fromCache: bool, fetchedAt: Date } }
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [token, setToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);

  const runSearches = useCallback(async (forceRefresh = false) => {
    setLastRun(new Date());
    for (const s of SEARCHES) {
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cached = getCached(s.id);
        if (cached) {
          setResults((prev) => ({ ...prev, [s.id]: cached.repos }));
          setCacheInfo((prev) => ({ ...prev, [s.id]: { fromCache: true, fetchedAt: cached.fetchedAt } }));
          continue;
        }
      }
      setLoading((prev) => ({ ...prev, [s.id]: true }));
      setErrors((prev) => ({ ...prev, [s.id]: null }));
      try {
        const repos = await fetchRepos(s.query, token);
        const filtered = s.filter ? repos.filter(s.filter) : repos;
        // Sort newest-first by updated_at within each track
        filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        setCached(s.id, filtered);
        setResults((prev) => ({ ...prev, [s.id]: filtered }));
        setCacheInfo((prev) => ({ ...prev, [s.id]: { fromCache: false, fetchedAt: Date.now() } }));
      } catch (e) {
        setErrors((prev) => ({ ...prev, [s.id]: e.message }));
      } finally {
        setLoading((prev) => ({ ...prev, [s.id]: false }));
      }
    }
  }, [token]);

  const handleForceRefresh = useCallback(() => {
    setCooldownUntil(Date.now() + 10 * 60 * 1000); // 10 min cooldown after force refresh
    runSearches(true);
  }, [runSearches]);

  useEffect(() => {
    runSearches(false);
  }, [runSearches]);

  const cooldownRemaining = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 60000)) : 0;
  const inCooldown = cooldownUntil && Date.now() < cooldownUntil;

  const allRepos = Object.values(results).flat();
  const seen = new Set();
  const dedupedAll = allRepos
    .filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    })
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  const newThisWeek = dedupedAll.filter((r) => isNew(r.created_at));
  newThisWeek.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const totalNew = newThisWeek.length;

  // Rolling 7-day window for weekly velocity tracking
  const weekAgo7 = new Date();
  weekAgo7.setDate(weekAgo7.getDate() - 7);
  const newLast7Days = dedupedAll.filter((r) => new Date(r.created_at) >= weekAgo7);
  const totalNew7 = newLast7Days.length;

  const activeThisWeek = dedupedAll.filter((r) => isActive(r.updated_at));
  activeThisWeek.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  const tabs = [
    { id: "all", label: "All Searches" },
    { id: "new", label: `New Since Mar 6 (${newThisWeek.length})` },
    { id: "active", label: `Active This Week (${activeThisWeek.length})` },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080B14",
        fontFamily: "'Inter', sans-serif",
        color: "#E2E8F0",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2D3748; border-radius: 3px; }
        a { color: inherit; }
      `}</style>

      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(15,15,30,0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "14px 40px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background:
                    "linear-gradient(135deg, #7C3AED 0%, #1D4ED8 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                }}
              >
                🌑
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "#F1F5F9",
                  }}
                >
                  Midnight Ecosystem Tracker
                </div>
                <div style={{ fontSize: 10, color: "#475569" }}>
                  Weekly GitHub discovery
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {lastRun && (
                <span style={{ fontSize: 11, color: "#475569" }}>
                  Last run: {lastRun.toLocaleTimeString()}
                  {Object.values(cacheInfo).some(c => c.fromCache) && (
                    <span style={{ color: "#22D3EE", marginLeft: 5 }}>(cached)</span>
                  )}
                </span>
              )}
              <button
                onClick={() => setShowTokenInput(!showTokenInput)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94A3B8",
                  fontSize: 11,
                  padding: "5px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                🔑 Token
              </button>
              <button
                onClick={() => runSearches(false)}
                disabled={Object.values(loading).some(Boolean)}
                title="Serve from cache if available (30 min TTL)"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94A3B8",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "6px 14px",
                  borderRadius: 6,
                  cursor: "pointer",
                  opacity: Object.values(loading).some(Boolean) ? 0.5 : 1,
                }}
              >
                ↻ Refresh
              </button>
              <button
                onClick={handleForceRefresh}
                disabled={Object.values(loading).some(Boolean) || inCooldown}
                title={inCooldown ? `Force refresh available in ~${cooldownRemaining}m` : "Force fresh data from GitHub API"}
                style={{
                  background: inCooldown
                    ? "rgba(124,58,237,0.2)"
                    : "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
                  border: "none",
                  color: inCooldown ? "#7C3AED" : "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "6px 14px",
                  borderRadius: 6,
                  cursor: inCooldown ? "not-allowed" : "pointer",
                  opacity: (Object.values(loading).some(Boolean) || inCooldown) ? 0.6 : 1,
                }}
              >
                {Object.values(loading).some(Boolean)
                  ? "Fetching..."
                  : inCooldown
                  ? `⏳ ~${cooldownRemaining}m`
                  : "⚡ Force Refresh"}
              </button>
            </div>
          </div>

          {showTokenInput && (
            <div
              style={{
                marginTop: 10,
                padding: "10px 12px",
                background: "rgba(124,58,237,0.08)",
                borderRadius: 8,
                border: "1px solid rgba(124,58,237,0.2)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 11, color: "#94A3B8", whiteSpace: "nowrap" }}>
                GitHub Token (increases rate limit from 60 to 5000 req/hr):
              </span>
              <input
                type="password"
                placeholder="ghp_..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                style={{
                  flex: 1,
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 6,
                  color: "#E2E8F0",
                  fontSize: 11,
                  padding: "5px 10px",
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: 10, color: "#475569" }}>
                Stored in memory only
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 40px" }}>
        {/* Stats bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            {
              label: "midnightntwrk Repos",
              value: (results["midnightntwrk"] || []).length || (loading["midnightntwrk"] ? "..." : "0"),
              icon: "🌑",
              color: "#7C3AED",
              tooltip: "Repos tagged with the official midnightntwrk topic",
            },
            {
              label: "Total (All Searches)",
              value: dedupedAll.length || (Object.values(loading).some(Boolean) ? "..." : "0"),
              icon: "📦",
              color: "#5B21B6",
              tooltip: "Deduplicated across all five search tracks",
            },
            {
              label: "New Since Mar 6",
              value: totalNew || (Object.values(loading).some(Boolean) ? "..." : "0"),
              icon: "✨",
              color: "#0E7490",
              tooltip: "Repos created since EC submission on March 6 (cumulative pipeline)",
            },
            {
              label: "New Last 7 Days",
              value: totalNew7 || (Object.values(loading).some(Boolean) ? "..." : "0"),
              icon: "📈",
              color: "#065F46",
              tooltip: "Repos created in the rolling 7-day window (log Sundays for weekly velocity)",
            },
            {
              label: "Active This Week",
              value: activeThisWeek.length || (Object.values(loading).some(Boolean) ? "..." : "0"),
              icon: "⚡",
              color: "#1D4ED8",
              tooltip: "Repos with commits or updates in the last 7 days",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(15,15,25,0.6)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10,
                padding: "14px 18px",
                borderTop: `2px solid ${stat.color}`,
              }}
              title={stat.tooltip}
            >
              <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#F1F5F9",
                  letterSpacing: "-0.02em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            marginBottom: 20,
            background: "rgba(15,15,25,0.6)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10,
            padding: 4,
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                background:
                  activeTab === tab.id
                    ? "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)"
                    : "transparent",
                border: "none",
                color: activeTab === tab.id ? "#fff" : "#64748B",
                fontSize: 12,
                fontWeight: activeTab === tab.id ? 600 : 400,
                padding: "8px 16px",
                borderRadius: 7,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === "all" &&
          SEARCHES.map((s) => (
            <SearchPanel
              key={s.id}
              search={s}
              repos={results[s.id]}
              loading={loading[s.id]}
              error={errors[s.id]}
              newCount={(results[s.id] || []).filter((r) =>
                isNew(r.created_at)
              ).length}
              cacheEntry={cacheInfo[s.id]}
            />
          ))}

        {activeTab === "new" && (
          <div>
            {newThisWeek.length === 0 &&
            !Object.values(loading).some(Boolean) ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "#475569",
                  fontSize: 13,
                }}
              >
                No new repos created since March 6 across all searches.
              </div>
            ) : Object.values(loading).some(Boolean) ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "#475569",
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    border: "2px solid #7C3AED",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    margin: "0 auto 12px",
                  }}
                />
                Loading...
              </div>
            ) : (
              newThisWeek.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  isNewRepo={true}
                  accent="#A78BFA"
                />
              ))
            )}
          </div>
        )}

        {activeTab === "active" && (
          <div>
            <div style={{
              padding: "10px 14px",
              marginBottom: 16,
              background: "rgba(14,116,144,0.08)",
              border: "1px solid rgba(34,211,238,0.15)",
              borderRadius: 8,
              fontSize: 11,
              color: "#94A3B8",
              lineHeight: 1.6,
            }}>
              Repos with commits or updates in the last 7 days, regardless of when they were created.
              This includes your existing ecosystem staying active, not just new arrivals.
            </div>
            {activeThisWeek.length === 0 && !Object.values(loading).some(Boolean) ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569", fontSize: 13 }}>
                No repos updated in the last 7 days across all searches.
              </div>
            ) : Object.values(loading).some(Boolean) ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569", fontSize: 13 }}>
                <div style={{
                  width: 24, height: 24,
                  border: "2px solid #0E7490",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 12px",
                }} />
                Loading...
              </div>
            ) : (
              activeThisWeek.map((repo) => (
                <RepoCard
                  key={repo.id}
                  repo={repo}
                  isNewRepo={isNew(repo.created_at)}
                  accent="#22D3EE"
                />
              ))
            )}
          </div>
        )}
        <div
          style={{
            marginTop: 32,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 10, color: "#334155" }}>
            GitHub API: 60 req/hr unauthenticated. Add a token for 5,000 req/hr.
          </div>
          <div style={{ fontSize: 10, color: "#334155" }}>
            Midnight Foundation DevRel ·{" "}
            <a
              href="https://github.com/topics/midnightntwrk"
              target="_blank"
              style={{ color: "#7C3AED" }}
            >
              github.com/topics/midnightntwrk
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}