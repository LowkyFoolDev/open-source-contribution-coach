"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowButton,
  DifficultyTag,
  LabeledText,
  MatchScore,
  PageIntro,
  PanelHeading,
  ReadinessRow,
  ReviewCheck,
  TagRow,
} from "./components/ui";
import { compactNumber } from "./lib/format";
import { fetchRepoAnalysis, parseRepoUrl } from "./lib/github";
import { SAMPLE_DIFF, SAMPLE_REPO, SAMPLE_REPO_URL } from "./lib/sample-repo";
import type { Issue, RepoData, Tab } from "./lib/types";

const NAV_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "codebase", label: "Codebase map", icon: "⌘" },
  { id: "issues", label: "Issue finder", icon: "◎" },
  { id: "guide", label: "Implementation", icon: "↗" },
  { id: "review", label: "PR review", icon: "✓" },
];

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
      const analysis = await fetchRepoAnalysis(parsed);
      setRepo(analysis);
      setSelectedIssue(analysis.issues[0] ?? SAMPLE_REPO.issues[0]);
      setTab("overview");
    } catch {
      setRepo({ ...SAMPLE_REPO, owner: parsed.owner, name: parsed.name });
      setSelectedIssue(SAMPLE_REPO.issues[0]);
      setError("Live metadata was unavailable, so a complete demo analysis is shown.");
    } finally {
      setLoading(false);
    }
  }

  function loadDemo() {
    setRepoUrl(SAMPLE_REPO_URL);
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
                <ArrowButton type="submit" disabled={loading} label={loading ? "Analyzing…" : "Analyze repository"} />
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
  const topIssue = repo.issues[0];
  const metrics: [string, number, string][] = [
    ["★", repo.stars, "GitHub stars"],
    ["⑂", repo.forks, "Forks"],
    ["○", repo.openIssues, "Open issues"],
  ];
  return <>
    <div className="stats-grid">
      <article className="summary-card wide"><div className="card-kicker"><span className="dot coral-dot" /> Repository summary</div><p>{repo.description}</p><TagRow tags={repo.topics} /></article>
      {metrics.map(([icon, value, label]) => (
        <article className="metric-card" key={label}><span>{icon}</span><strong>{compactNumber(value)}</strong><small>{label}</small></article>
      ))}
    </div>
    <div className="two-column">
      <article className="panel architecture-card">
        <PanelHeading kicker="Codebase at a glance" title="Architecture map" action={<button onClick={onExplore}>Explore map →</button>} />
        <div className="architecture-flow"><div className="flow-node primary"><span>ENTRY</span><strong>Application</strong><small>apps / web</small></div><div className="flow-line" /><div className="flow-stack"><div className="flow-node"><span>CORE</span><strong>Components</strong><small>packages / ui</small></div><div className="flow-node"><span>DATA</span><strong>Registry</strong><small>packages / registry</small></div></div><div className="flow-line" /><div className="flow-node soft"><span>OUTPUT</span><strong>Documentation</strong><small>apps / docs</small></div></div>
        <div className="language-row"><div><i className="lang-dot" />{repo.language}</div><span>Primary language</span><b>Updated {repo.updated}</b></div>
      </article>
      <article className="panel readiness-card">
        <PanelHeading kicker="Your onboarding" title="Contribution readiness" action={<div className="score-ring">78</div>} />
        <div className="readiness-list">
          <ReadinessRow mark="✓" state="done" title="Repository overview" description="Project purpose and stack understood" trailing={<b>Done</b>} />
          <ReadinessRow mark="✓" state="done" title="Contribution guidelines" description="Conventions extracted" trailing={<b>Done</b>} />
          <ReadinessRow mark="3" state="current" title="Choose an issue" description={`${repo.issues.length} strong matches found`} trailing={<button onClick={onIssues}>Choose</button>} />
          <ReadinessRow mark="4" title="Prepare your PR" description="Unlocked after issue selection" />
        </div>
      </article>
    </div>
    <article className="panel issue-preview">
      <PanelHeading kicker="Recommended for you" title="Best first contribution" action={<button onClick={onIssues}>View all matches →</button>} />
      <div className="issue-row">
        <MatchScore score={topIssue.score} />
        <div className="issue-main">
          <TagRow tags={topIssue.labels.slice(0, 2)}><DifficultyTag difficulty={topIssue.difficulty} /></TagRow>
          <h3>{topIssue.title}</h3><p>{topIssue.reason}</p>
        </div>
        <ArrowButton className="primary-button" onClick={onIssues} label="Open issue coach" />
      </div>
    </article>
  </>;
}

const PATH_DESCRIPTIONS: Record<string, string> = {
  "apps/": "Runnable products and documentation sites",
  "packages/": "Shared UI, utilities, and configuration",
  "templates/": "Starter implementations for users",
  "docs/": "Guides, concepts, and API references",
  "scripts/": "Build and maintenance automation",
  "src/": "Core application source and business logic",
  "tests/": "Unit and integration test suites",
};

const READING_ORDER: [string, string][] = [
  ["Read README and project goals", "5 min"],
  ["Trace the main application entry", "15 min"],
  ["Inspect one representative component", "15 min"],
  ["Review tests and contribution rules", "10 min"],
];

function CodebaseMap({ repo }: { repo: RepoData }) {
  return <div className="tab-page">
    <PageIntro eyebrow="Repository intelligence" title="Understand the codebase before you touch it." description="Start with the high-leverage paths. You do not need to read every file." />
    <div className="map-layout">
      <article className="panel file-tree">
        <PanelHeading kicker="Root" title={`${repo.owner}/${repo.name}`} action={<span className="branch-pill">main</span>} />
        {repo.files.map((file, index) => <div className="file-row" key={file}><span className={file.endsWith("/") ? "folder-icon" : "file-icon"}>{file.endsWith("/") ? "▣" : "□"}</span><div><strong>{file}</strong><p>{PATH_DESCRIPTIONS[file] ?? (index > 4 ? "Project configuration and contributor guidance" : "Primary repository module")}</p></div><b>{index < 2 ? "Start here" : ""}</b></div>)}
      </article>
      <aside className="learning-path">
        <span>Suggested reading order</span><h3>45-minute repository tour</h3>
        {READING_ORDER.map(([text, duration], index) => <div key={text}><b>{index + 1}</b><p>{text}<small>{duration}</small></p></div>)}
        <ArrowButton className="primary-button" label="Start guided tour" />
      </aside>
    </div>
  </div>;
}

function IssueFinder({ issues, onSelect }: { issues: Issue[]; onSelect: (issue: Issue) => void }) {
  return <div className="tab-page">
    <PageIntro eyebrow="Personalized issue finder" title="Issues you can realistically finish." description="Ranked by scope clarity, activity, prerequisites, and contributor friendliness." />
    <div className="filter-row"><button className="active">Best matches</button><button>Beginner</button><button>Documentation</button><button>Code</button><span>{issues.length} recommended issues</span></div>
    <div className="issue-list">{issues.map((issue) => <article className="issue-card" key={issue.number}>
      <MatchScore score={issue.score} />
      <div className="issue-main">
        <div className="issue-meta"><span>#{issue.number}</span><span>{issue.comments} comments</span><DifficultyTag difficulty={issue.difficulty} /></div>
        <h3>{issue.title}</h3><p>{issue.reason}</p>
        <TagRow tags={issue.labels} />
      </div>
      <ArrowButton className="primary-button" onClick={() => onSelect(issue)} label="Coach me" />
    </article>)}</div>
  </div>;
}

const DOCS_PLAN: [string, string][] = [
  ["Confirm the reader's goal", "Define the exact question this documentation change must answer."],
  ["Find the existing pattern", "Locate the closest guide or example and mirror its structure."],
  ["Write the smallest clear addition", "Use a runnable example and avoid changing unrelated sections."],
  ["Verify every instruction", "Run the commands, check links, and proofread the rendered page."],
];

const CODE_PLAN: [string, string][] = [
  ["Understand the expected behavior", "Reproduce the current behavior and write down the precise gap."],
  ["Locate the implementation", "Inspect the relevant source and its nearest test file before editing."],
  ["Make the smallest viable change", "Preserve the public API and follow the existing composition pattern."],
  ["Prove it works", "Add a focused regression test and run the repository's checks."],
];

const DOCS_FILES = ["docs/getting-started.mdx", "examples/workspace/README.md", "CONTRIBUTING.md"];
const CODE_FILES = ["packages/ui/src/component.tsx", "packages/ui/test/component.test.tsx", "docs/components/component.mdx"];

function ImplementationGuide({ issue, steps, setSteps, progress, onReview }: { issue: Issue | null; steps: boolean[]; setSteps: (steps: boolean[]) => void; progress: number; onReview: () => void }) {
  if (!issue) return <div className="blank-panel"><span>◎</span><h2>Choose an issue first</h2><p>Your personalized implementation plan will appear here.</p></div>;
  const docsIssue = /doc|readme|example|guide|installation/i.test(issue.title);
  const items = docsIssue ? DOCS_PLAN : CODE_PLAN;
  const likelyFiles = docsIssue ? DOCS_FILES : CODE_FILES;
  return <div className="tab-page">
    <div className="guide-header"><div><span>Issue #{issue.number}</span><h2>{issue.title}</h2><p>{issue.reason}</p></div><div className="progress-block"><strong>{progress}%</strong><span>ready for review</span><div><i style={{ width: `${progress}%` }} /></div></div></div>
    <div className="guide-grid">
      <article className="panel plan-panel">
        <PanelHeading kicker="Implementation plan" title="Four focused steps" />
        {items.map(([title, description], index) => <button className={`plan-step ${steps[index] ? "complete" : ""}`} key={title} onClick={() => { const next = [...steps]; next[index] = !next[index]; setSteps(next); }}><span>{steps[index] ? "✓" : index + 1}</span><LabeledText title={title} description={description} /><i>{steps[index] ? "Complete" : "Mark done"}</i></button>)}
        <ArrowButton className="primary-button full" onClick={onReview} disabled={progress < 50} label="Review my changes" />
      </article>
      <aside>
        <article className="coach-note"><span>Coach insight</span><h3>Keep the scope narrow</h3><p>The strongest PR changes one behavior and proves it clearly. Avoid adjacent refactors.</p></article>
        <article className="panel">
          <PanelHeading kicker="Likely files" title="Where to work" />
          {likelyFiles.map((path, index) => <div key={path} className={`code-path ${index === 2 ? "muted" : ""}`}>{path}</div>)}
        </article>
      </aside>
    </div>
  </div>;
}

function PRReview({ diff, setDiff, reviewed, setReviewed }: { diff: string; setDiff: (value: string) => void; reviewed: boolean; setReviewed: (value: boolean) => void }) {
  return <div className="tab-page">
    <PageIntro eyebrow="Pre-flight review" title="Catch problems before maintainers do." description="Paste your git diff to check scope, conventions, tests, and PR readiness." />
    <div className="review-grid">
      <article className="panel diff-panel">
        <PanelHeading kicker="Your changes" title="Git diff" action={<button onClick={() => setDiff(SAMPLE_DIFF)}>Load example</button>} />
        <textarea aria-label="Git diff" placeholder="Paste your git diff here…" value={diff} onChange={(event) => { setDiff(event.target.value); setReviewed(false); }} />
        <ArrowButton className="primary-button full" disabled={!diff.trim()} onClick={() => setReviewed(true)} label="Run PR review" />
      </article>
      <aside className={`review-results ${reviewed ? "visible" : ""}`}>{reviewed ? <>
        <div className="review-score"><div>86</div><span><strong>Ready with minor fixes</strong><small>Your change is focused and easy to review.</small></span></div>
        <ReviewCheck status="pass" title="Scope is focused" description="Only the intended component is affected." />
        <ReviewCheck status="warn" title="Add a regression test" description="Cover ArrowDown behavior at the end of the list." />
        <ReviewCheck status="pass" title="Conventions match" description="Naming and structure follow the repository style." />
        <button className="secondary-button full">Generate PR description</button>
      </> : <div className="waiting-review"><span>✓</span><h3>Your review will appear here</h3><p>We’ll turn your diff into concrete, maintainer-minded feedback.</p></div>}</aside>
    </div>
  </div>;
}
