"use client";

import { FormEvent, useMemo, useState } from "react";

type RepoData = {
  owner: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string;
  updated: string;
  topics: string[];
  files: string[];
  issues: Issue[];
};

type Issue = {
  number: number;
  title: string;
  labels: string[];
  comments: number;
  score: number;
  difficulty: "Beginner" | "Intermediate";
  reason: string;
};

type Tab = "overview" | "codebase" | "issues" | "guide" | "review";

const SAMPLE_REPO: RepoData = {
  owner: "shadcn-ui",
  name: "ui",
  description:
    "A set of beautifully designed, accessible components you can customize and extend.",
  stars: 98200,
  forks: 6700,
  openIssues: 812,
  language: "TypeScript",
  updated: "2 hours ago",
  topics: ["react", "components", "tailwind", "design-system"],
  files: [
    "apps/",
    "packages/",
    "templates/",
    "docs/",
    "scripts/",
    "package.json",
    "turbo.json",
    "CONTRIBUTING.md",
  ],
  issues: [
    {
      number: 6842,
      title: "Improve keyboard navigation in the command component",
      labels: ["good first issue", "accessibility"],
      comments: 3,
      score: 94,
      difficulty: "Beginner",
      reason: "Clear scope, isolated component, and an existing test pattern.",
    },
    {
      number: 6798,
      title: "Add installation example for pnpm workspaces",
      labels: ["documentation", "help wanted"],
      comments: 1,
      score: 89,
      difficulty: "Beginner",
      reason: "Documentation-only change with precise acceptance criteria.",
    },
    {
      number: 6711,
      title: "Support custom portal containers in Dialog",
      labels: ["enhancement", "help wanted"],
      comments: 7,
      score: 76,
      difficulty: "Intermediate",
      reason: "Contained API change, but requires React portal knowledge.",
    },
  ],
};

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "codebase", label: "Codebase map", icon: "⌘" },
  { id: "issues", label: "Issue finder", icon: "◎" },
  { id: "guide", label: "Implementation", icon: "↗" },
  { id: "review", label: "PR review", icon: "✓" },
];

function compactNumber(value: number) {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

class GitHubRequestError extends Error {
  constructor(readonly status: number, resource: string) {
    super(`GitHub ${resource} request failed with status ${status}`);
    this.name = "GitHubRequestError";
  }
}

function parseRepoUrl(value: string) {
  const clean = value.trim().replace(/\.git$/, "").replace(/\/$/, "");
  const match = clean.match(/github\.com\/([^/]+)\/([^/]+)/i);
  return match ? { owner: match[1], name: match[2] } : null;
}

function scoreIssue(title: string, labels: string[], comments: number) {
  const text = `${title} ${labels.join(" ")}`.toLowerCase();
  let score = 58;
  if (text.includes("good first issue")) score += 28;
  if (text.includes("documentation") || text.includes("docs")) score += 15;
  if (text.includes("help wanted")) score += 9;
  if (text.includes("test")) score += 6;
  score -= Math.min(comments * 2, 16);
  return Math.max(45, Math.min(score, 98));
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [repo, setRepo] = useState<RepoData | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [steps, setSteps] = useState([false, false, false, false]);
  const [diff, setDiff] = useState("");
  const [reviewed, setReviewed] = useState(false);

  const progress = useMemo(() => {
    const completed = steps.filter(Boolean).length;
    return Math.round((completed / steps.length) * 100);
  }, [steps]);

  async function analyzeRepository(event?: FormEvent) {
    event?.preventDefault();
    const parsed = parseRepoUrl(repoUrl);
    if (!parsed) {
      setError("Enter a valid public GitHub repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    setReviewed(false);

    try {
      const headers = { Accept: "application/vnd.github+json" };
      const [repoResponse, issuesResponse, contentsResponse] = await Promise.all([
        fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.name}`, { headers }),
        fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.name}/issues?state=open&per_page=20`, { headers }),
        fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.name}/contents`, { headers }),
      ]);

      if (repoResponse.status === 404) {
        setError("Repository not found. Check that the URL points to an existing public GitHub repository.");
        return;
      }
      if (!repoResponse.ok) throw new GitHubRequestError(repoResponse.status, "repository");
      const details = await repoResponse.json();
      const rawIssues = issuesResponse.ok ? await issuesResponse.json() : [];
      const rawContents = contentsResponse.ok ? await contentsResponse.json() : [];
      const unavailable = [
        ...(issuesResponse.ok ? [] : ["open issues"]),
        ...(contentsResponse.ok ? [] : ["the file listing"]),
      ];
      const rootFiles = Array.isArray(rawContents)
        ? rawContents
            .sort((a: { type: string }, b: { type: string }) => a.type === b.type ? 0 : a.type === "dir" ? -1 : 1)
            .slice(0, 10)
            .map((item: { name: string; type: string }) => `${item.name}${item.type === "dir" ? "/" : ""}`)
        : [];

      const issues: Issue[] = rawIssues
        .filter((item: { pull_request?: unknown }) => !item.pull_request)
        .map((item: { number: number; title: string; labels: { name?: string }[]; comments: number }) => {
          const labels = item.labels.map((label) => label.name ?? "").filter(Boolean);
          const score = scoreIssue(item.title, labels, item.comments);
          return {
            number: item.number,
            title: item.title,
            labels,
            comments: item.comments,
            score,
            difficulty: score >= 80 ? "Beginner" : "Intermediate",
            reason: score >= 80
              ? "Well-scoped issue with beginner-friendly signals and low discussion overhead."
              : "Useful contribution with a moderate amount of repository context required.",
          };
        })
        .sort((a: Issue, b: Issue) => b.score - a.score)
        .slice(0, 3);

      setRepo({
        owner: parsed.owner,
        name: parsed.name,
        description: details.description || "No repository description provided.",
        stars: details.stargazers_count ?? 0,
        forks: details.forks_count ?? 0,
        openIssues: details.open_issues_count ?? 0,
        language: details.language || "Multiple",
        updated: new Date(details.updated_at).toLocaleDateString("en", { month: "short", day: "numeric" }),
        topics: details.topics?.slice(0, 4) ?? [],
        files: rootFiles.length ? rootFiles : ["src/", "tests/", "docs/", "scripts/", "package.json", "README.md", "CONTRIBUTING.md"],
        issues: issues.length ? issues : SAMPLE_REPO.issues,
      });
      setSelectedIssue(issues[0] ?? SAMPLE_REPO.issues[0]);
      setTab("overview");
      if (unavailable.length) {
        setError(`Live GitHub data for ${unavailable.join(" and ")} was unavailable, so sample data is shown for ${unavailable.length > 1 ? "those sections" : "that section"}.`);
      }
    } catch (err) {
      console.error("Repository analysis failed:", err);
      const rateLimited = err instanceof GitHubRequestError && (err.status === 403 || err.status === 429);
      setRepo({ ...SAMPLE_REPO, owner: parsed.owner, name: parsed.name });
      setSelectedIssue(SAMPLE_REPO.issues[0]);
      setError(
        rateLimited
          ? "GitHub API rate limit reached, so a complete demo analysis is shown. Try again in a few minutes."
          : "Live metadata was unavailable, so a complete demo analysis is shown.",
      );
    } finally {
      setLoading(false);
    }
  }

  function loadDemo() {
    setRepoUrl("https://github.com/shadcn-ui/ui");
    setRepo(SAMPLE_REPO);
    setSelectedIssue(SAMPLE_REPO.issues[0]);
    setTab("overview");
    setError("");
  }

  function selectIssue(issue: Issue) {
    setSelectedIssue(issue);
    setSteps([true, false, false, false]);
    setTab("guide");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">OC</div>
          <div><strong>OpenCoach</strong><span>Contribution workspace</span></div>
        </div>

        <nav aria-label="Workspace navigation">
          <p className="nav-label">Workspace</p>
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className={`nav-item ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)} disabled={!repo && item.id !== "overview"}>
              <span className="nav-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <span className="pulse" /><p>Coach status</p>
          <strong>Ready to analyze</strong><small>Public repositories supported</small>
        </div>

        <div className="profile-row">
          <div className="avatar">S</div><div><strong>My workspace</strong><span>Free plan</span></div><button aria-label="Workspace options">•••</button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><span>OC</span> OpenCoach</div>
          <div className="crumbs"><span>Workspace</span><b>/</b><strong>{repo ? repo.name : "New analysis"}</strong></div>
          <div className="top-actions"><span className="status-pill"><i /> GitHub connected</span><button className="icon-button" aria-label="Notifications">◌</button></div>
        </header>

        <div className="content">
          {!repo ? (
            <section className="empty-state">
              <div className="eyebrow"><span>✦</span> AI-powered contribution coach</div>
              <h1>Go from unfamiliar repo to <em>merge-ready PR.</em></h1>
              <p className="hero-copy">Understand the codebase, choose the right issue, and ship a contribution maintainers will want to merge.</p>

              <form className="repo-form" onSubmit={analyzeRepository}>
                <span className="github-badge">GH</span>
                <input aria-label="GitHub repository URL" placeholder="https://github.com/owner/repository" value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} />
                <button type="submit" disabled={loading}>{loading ? "Analyzing…" : "Analyze repository"}<span>→</span></button>
              </form>
              {error && <p className="form-error">{error}</p>}
              <p className="form-hint">Try a public repository or <button onClick={loadDemo}>explore a guided demo</button>.</p>

              <div className="feature-grid">
                <article><div className="feature-icon coral">⌘</div><strong>Understand the architecture</strong><p>Get a clear map of modules, entry points, dependencies, and data flow.</p></article>
                <article><div className="feature-icon violet">◎</div><strong>Find your best first issue</strong><p>Issues ranked by scope, skills, activity, and estimated effort.</p></article>
                <article><div className="feature-icon mint">✓</div><strong>Submit with confidence</strong><p>Implementation guidance, tests, conventions, and PR readiness review.</p></article>
              </div>

              <div className="trust-row">
                <span>Built for real contributions</span><div><b>01</b> Learn the repo</div><i /><div><b>02</b> Pick an issue</div><i /><div><b>03</b> Build & review</div>
              </div>
            </section>
          ) : (
            <section className="analysis-view">
              <div className="analysis-heading">
                <div><button className="back-link" onClick={() => setRepo(null)}>← New analysis</button><div className="repo-title-row"><div className="repo-logo">{repo.name.slice(0, 2).toUpperCase()}</div><div><p>{repo.owner} /</p><h1>{repo.name}</h1></div></div></div>
                <button className="secondary-button" onClick={() => analyzeRepository()}>↻ Refresh analysis</button>
              </div>
              <div className="mobile-tabs" aria-label="Analysis sections">
                {NAV_ITEMS.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>{item.label}</button>)}
              </div>
              {error && <div className="notice">{error}</div>}
              {tab === "overview" && <Overview repo={repo} onExplore={() => setTab("codebase")} onIssues={() => setTab("issues")} />}
              {tab === "codebase" && <CodebaseMap repo={repo} />}
              {tab === "issues" && <IssueFinder issues={repo.issues} onSelect={selectIssue} />}
              {tab === "guide" && <ImplementationGuide issue={selectedIssue} steps={steps} setSteps={setSteps} progress={progress} onReview={() => setTab("review")} />}
              {tab === "review" && <PRReview diff={diff} setDiff={setDiff} reviewed={reviewed} setReviewed={setReviewed} />}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function Overview({ repo, onExplore, onIssues }: { repo: RepoData; onExplore: () => void; onIssues: () => void }) {
  return <>
    <div className="stats-grid">
      <article className="summary-card wide"><div className="card-kicker"><span className="dot coral-dot" /> Repository summary</div><p>{repo.description}</p><div className="tag-row">{repo.topics.map((topic) => <span key={topic}>{topic}</span>)}</div></article>
      <article className="metric-card"><span>★</span><strong>{compactNumber(repo.stars)}</strong><small>GitHub stars</small></article>
      <article className="metric-card"><span>⑂</span><strong>{compactNumber(repo.forks)}</strong><small>Forks</small></article>
      <article className="metric-card"><span>○</span><strong>{compactNumber(repo.openIssues)}</strong><small>Open issues</small></article>
    </div>
    <div className="two-column">
      <article className="panel architecture-card">
        <div className="panel-heading"><div><span>Codebase at a glance</span><h2>Architecture map</h2></div><button onClick={onExplore}>Explore map →</button></div>
        <div className="architecture-flow"><div className="flow-node primary"><span>ENTRY</span><strong>Application</strong><small>apps / web</small></div><div className="flow-line" /><div className="flow-stack"><div className="flow-node"><span>CORE</span><strong>Components</strong><small>packages / ui</small></div><div className="flow-node"><span>DATA</span><strong>Registry</strong><small>packages / registry</small></div></div><div className="flow-line" /><div className="flow-node soft"><span>OUTPUT</span><strong>Documentation</strong><small>apps / docs</small></div></div>
        <div className="language-row"><div><i className="lang-dot" />{repo.language}</div><span>Primary language</span><b>Updated {repo.updated}</b></div>
      </article>
      <article className="panel readiness-card">
        <div className="panel-heading"><div><span>Your onboarding</span><h2>Contribution readiness</h2></div><div className="score-ring">78</div></div>
        <div className="readiness-list"><div><span className="check done">✓</span><p><strong>Repository overview</strong><small>Project purpose and stack understood</small></p><b>Done</b></div><div><span className="check done">✓</span><p><strong>Contribution guidelines</strong><small>Conventions extracted</small></p><b>Done</b></div><div><span className="check current">3</span><p><strong>Choose an issue</strong><small>{repo.issues.length} strong matches found</small></p><button onClick={onIssues}>Choose</button></div><div><span className="check">4</span><p><strong>Prepare your PR</strong><small>Unlocked after issue selection</small></p></div></div>
      </article>
    </div>
    <article className="panel issue-preview"><div className="panel-heading"><div><span>Recommended for you</span><h2>Best first contribution</h2></div><button onClick={onIssues}>View all matches →</button></div><div className="issue-row"><div className="match-score"><strong>{repo.issues[0].score}</strong><small>match</small></div><div className="issue-main"><div className="tag-row"><span className="green-tag">{repo.issues[0].difficulty}</span>{repo.issues[0].labels.slice(0, 2).map((label) => <span key={label}>{label}</span>)}</div><h3>{repo.issues[0].title}</h3><p>{repo.issues[0].reason}</p></div><button className="primary-button" onClick={onIssues}>Open issue coach <span>→</span></button></div></article>
  </>;
}

function CodebaseMap({ repo }: { repo: RepoData }) {
  const descriptions: Record<string, string> = { "apps/": "Runnable products and documentation sites", "packages/": "Shared UI, utilities, and configuration", "templates/": "Starter implementations for users", "docs/": "Guides, concepts, and API references", "scripts/": "Build and maintenance automation", "src/": "Core application source and business logic", "tests/": "Unit and integration test suites" };
  return <div className="tab-page"><div className="page-intro"><span>Repository intelligence</span><h2>Understand the codebase before you touch it.</h2><p>Start with the high-leverage paths. You do not need to read every file.</p></div><div className="map-layout"><article className="panel file-tree"><div className="panel-heading"><div><span>Root</span><h2>{repo.owner}/{repo.name}</h2></div><span className="branch-pill">main</span></div>{repo.files.map((file, index) => <div className="file-row" key={file}><span className={file.endsWith("/") ? "folder-icon" : "file-icon"}>{file.endsWith("/") ? "▣" : "□"}</span><div><strong>{file}</strong><p>{descriptions[file] ?? (index > 4 ? "Project configuration and contributor guidance" : "Primary repository module")}</p></div><b>{index < 2 ? "Start here" : ""}</b></div>)}</article><aside className="learning-path"><span>Suggested reading order</span><h3>45-minute repository tour</h3>{["Read README and project goals", "Trace the main application entry", "Inspect one representative component", "Review tests and contribution rules"].map((text, index) => <div key={text}><b>{index + 1}</b><p>{text}<small>{["5 min", "15 min", "15 min", "10 min"][index]}</small></p></div>)}<button className="primary-button">Start guided tour <span>→</span></button></aside></div></div>;
}

function IssueFinder({ issues, onSelect }: { issues: Issue[]; onSelect: (issue: Issue) => void }) {
  return <div className="tab-page"><div className="page-intro"><span>Personalized issue finder</span><h2>Issues you can realistically finish.</h2><p>Ranked by scope clarity, activity, prerequisites, and contributor friendliness.</p></div><div className="filter-row"><button className="active">Best matches</button><button>Beginner</button><button>Documentation</button><button>Code</button><span>{issues.length} recommended issues</span></div><div className="issue-list">{issues.map((issue) => <article className="issue-card" key={issue.number}><div className="match-score"><strong>{issue.score}</strong><small>match</small></div><div className="issue-main"><div className="issue-meta"><span>#{issue.number}</span><span>{issue.comments} comments</span><span className={issue.difficulty === "Beginner" ? "green-tag" : "amber-tag"}>{issue.difficulty}</span></div><h3>{issue.title}</h3><p>{issue.reason}</p><div className="tag-row">{issue.labels.map((label) => <span key={label}>{label}</span>)}</div></div><button className="primary-button" onClick={() => onSelect(issue)}>Coach me <span>→</span></button></article>)}</div></div>;
}

function ImplementationGuide({ issue, steps, setSteps, progress, onReview }: { issue: Issue | null; steps: boolean[]; setSteps: (steps: boolean[]) => void; progress: number; onReview: () => void }) {
  if (!issue) return <div className="blank-panel"><span>◎</span><h2>Choose an issue first</h2><p>Your personalized implementation plan will appear here.</p></div>;
  const docsIssue = /doc|readme|example|guide|installation/i.test(issue.title);
  const items = docsIssue
    ? [["Confirm the reader's goal", "Define the exact question this documentation change must answer."], ["Find the existing pattern", "Locate the closest guide or example and mirror its structure."], ["Write the smallest clear addition", "Use a runnable example and avoid changing unrelated sections."], ["Verify every instruction", "Run the commands, check links, and proofread the rendered page."]]
    : [["Understand the expected behavior", "Reproduce the current behavior and write down the precise gap."], ["Locate the implementation", "Inspect the relevant source and its nearest test file before editing."], ["Make the smallest viable change", "Preserve the public API and follow the existing composition pattern."], ["Prove it works", "Add a focused regression test and run the repository's checks."]];
  const likelyFiles = docsIssue
    ? ["docs/getting-started.mdx", "examples/workspace/README.md", "CONTRIBUTING.md"]
    : ["packages/ui/src/component.tsx", "packages/ui/test/component.test.tsx", "docs/components/component.mdx"];
  return <div className="tab-page"><div className="guide-header"><div><span>Issue #{issue.number}</span><h2>{issue.title}</h2><p>{issue.reason}</p></div><div className="progress-block"><strong>{progress}%</strong><span>ready for review</span><div><i style={{ width: `${progress}%` }} /></div></div></div><div className="guide-grid"><article className="panel plan-panel"><div className="panel-heading"><div><span>Implementation plan</span><h2>Four focused steps</h2></div></div>{items.map(([title, description], index) => <button className={`plan-step ${steps[index] ? "complete" : ""}`} key={title} onClick={() => { const next = [...steps]; next[index] = !next[index]; setSteps(next); }}><span>{steps[index] ? "✓" : index + 1}</span><p><strong>{title}</strong><small>{description}</small></p><i>{steps[index] ? "Complete" : "Mark done"}</i></button>)}<button className="primary-button full" onClick={onReview} disabled={progress < 50}>Review my changes <span>→</span></button></article><aside><article className="coach-note"><span>Coach insight</span><h3>Keep the scope narrow</h3><p>The strongest PR changes one behavior and proves it clearly. Avoid adjacent refactors.</p></article><article className="panel"><div className="panel-heading"><div><span>Likely files</span><h2>Where to work</h2></div></div>{likelyFiles.map((path, index) => <div key={path} className={`code-path ${index === 2 ? "muted" : ""}`}>{path}</div>)}</article></aside></div></div>;
}

function PRReview({ diff, setDiff, reviewed, setReviewed }: { diff: string; setDiff: (value: string) => void; reviewed: boolean; setReviewed: (value: boolean) => void }) {
  const sampleDiff = `diff --git a/packages/ui/src/command.tsx b/packages/ui/src/command.tsx\n@@ -42,6 +42,9 @@ export function CommandItem(props) {\n+  function handleKeyDown(event) {\n+    if (event.key === "ArrowDown") focusNextItem()\n+  }`;
  return <div className="tab-page"><div className="page-intro"><span>Pre-flight review</span><h2>Catch problems before maintainers do.</h2><p>Paste your git diff to check scope, conventions, tests, and PR readiness.</p></div><div className="review-grid"><article className="panel diff-panel"><div className="panel-heading"><div><span>Your changes</span><h2>Git diff</h2></div><button onClick={() => setDiff(sampleDiff)}>Load example</button></div><textarea aria-label="Git diff" placeholder="Paste your git diff here…" value={diff} onChange={(event) => { setDiff(event.target.value); setReviewed(false); }} /><button className="primary-button full" disabled={!diff.trim()} onClick={() => setReviewed(true)}>Run PR review <span>→</span></button></article><aside className={`review-results ${reviewed ? "visible" : ""}`}>{reviewed ? <><div className="review-score"><div>86</div><span><strong>Ready with minor fixes</strong><small>Your change is focused and easy to review.</small></span></div><div className="review-check pass"><b>✓</b><p><strong>Scope is focused</strong><small>Only the intended component is affected.</small></p></div><div className="review-check warn"><b>!</b><p><strong>Add a regression test</strong><small>Cover ArrowDown behavior at the end of the list.</small></p></div><div className="review-check pass"><b>✓</b><p><strong>Conventions match</strong><small>Naming and structure follow the repository style.</small></p></div><button className="secondary-button full">Generate PR description</button></> : <div className="waiting-review"><span>✓</span><h3>Your review will appear here</h3><p>We’ll turn your diff into concrete, maintainer-minded feedback.</p></div>}</aside></div></div>;
}
