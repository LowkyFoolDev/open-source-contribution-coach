import type { RepoData } from "./types";

export const SAMPLE_REPO: RepoData = {
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

export const SAMPLE_REPO_URL = "https://github.com/shadcn-ui/ui";

export const SAMPLE_DIFF = `diff --git a/packages/ui/src/command.tsx b/packages/ui/src/command.tsx\n@@ -42,6 +42,9 @@ export function CommandItem(props) {\n+  function handleKeyDown(event) {\n+    if (event.key === "ArrowDown") focusNextItem()\n+  }`;
