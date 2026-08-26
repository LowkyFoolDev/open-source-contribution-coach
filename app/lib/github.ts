import { shortDate } from "./format";
import { SAMPLE_REPO } from "./sample-repo";
import type { Issue, RepoData } from "./types";

const GITHUB_API = "https://api.github.com";
const GITHUB_HEADERS = { Accept: "application/vnd.github+json" };

const FALLBACK_FILES = ["src/", "tests/", "docs/", "scripts/", "package.json", "README.md", "CONTRIBUTING.md"];

export type RepoRef = { owner: string; name: string };

export function parseRepoUrl(value: string): RepoRef | null {
  const clean = value.trim().replace(/\.git$/, "").replace(/\/$/, "");
  const match = clean.match(/github\.com\/([^/]+)\/([^/]+)/i);
  return match ? { owner: match[1], name: match[2] } : null;
}

export function scoreIssue(title: string, labels: string[], comments: number) {
  const text = `${title} ${labels.join(" ")}`.toLowerCase();
  let score = 58;
  if (text.includes("good first issue")) score += 28;
  if (text.includes("documentation") || text.includes("docs")) score += 15;
  if (text.includes("help wanted")) score += 9;
  if (text.includes("test")) score += 6;
  score -= Math.min(comments * 2, 16);
  return Math.max(45, Math.min(score, 98));
}

function repoRequest({ owner, name }: RepoRef, path = "") {
  return fetch(`${GITHUB_API}/repos/${owner}/${name}${path}`, { headers: GITHUB_HEADERS });
}

async function jsonOrEmpty(response: Response): Promise<unknown[]> {
  if (!response.ok) return [];
  const payload = await response.json();
  return Array.isArray(payload) ? payload : [];
}

function rootFilesFrom(contents: unknown[]) {
  return (contents as { name: string; type: string }[])
    .sort((a, b) => (a.type === b.type ? 0 : a.type === "dir" ? -1 : 1))
    .slice(0, 10)
    .map((item) => `${item.name}${item.type === "dir" ? "/" : ""}`);
}

function rankedIssuesFrom(rawIssues: unknown[]): Issue[] {
  type RawIssue = {
    number: number;
    title: string;
    labels: { name?: string }[];
    comments: number;
    pull_request?: unknown;
  };

  return (rawIssues as RawIssue[])
    .filter((item) => !item.pull_request)
    .map((item) => {
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
      } satisfies Issue;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/** Fetches public repository metadata, root paths, and ranked beginner-friendly issues. */
export async function fetchRepoAnalysis(ref: RepoRef): Promise<RepoData> {
  const [repoResponse, issuesResponse, contentsResponse] = await Promise.all([
    repoRequest(ref),
    repoRequest(ref, "/issues?state=open&per_page=20"),
    repoRequest(ref, "/contents"),
  ]);

  if (!repoResponse.ok) throw new Error("Repository unavailable");
  const details = await repoResponse.json();
  const rootFiles = rootFilesFrom(await jsonOrEmpty(contentsResponse));
  const issues = rankedIssuesFrom(await jsonOrEmpty(issuesResponse));

  return {
    owner: ref.owner,
    name: ref.name,
    description: details.description || "No repository description provided.",
    stars: details.stargazers_count ?? 0,
    forks: details.forks_count ?? 0,
    openIssues: details.open_issues_count ?? 0,
    language: details.language || "Multiple",
    updated: shortDate(details.updated_at),
    topics: details.topics?.slice(0, 4) ?? [],
    files: rootFiles.length ? rootFiles : FALLBACK_FILES,
    issues: issues.length ? issues : SAMPLE_REPO.issues,
  };
}
