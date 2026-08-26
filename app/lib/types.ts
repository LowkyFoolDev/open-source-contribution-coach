export type Issue = {
  number: number;
  title: string;
  labels: string[];
  comments: number;
  score: number;
  difficulty: "Beginner" | "Intermediate";
  reason: string;
};

export type RepoData = {
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

export type Tab = "overview" | "codebase" | "issues" | "guide" | "review";
