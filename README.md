# Open-Source Contribution Coach

> From an unfamiliar repository to a merge-ready pull request.

[![Live Demo](https://img.shields.io/badge/Live_Demo-OpenCoach-F26F57?style=for-the-badge)](https://open-source-contribution-coach.lowkyuncoolcoder.chatgpt.site)
[![Built with React](https://img.shields.io/badge/React-19-20221A?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![Open-Source Contribution Coach](public/og.png)

Open-Source Contribution Coach is a focused developer workspace that helps new contributors understand an unfamiliar codebase, choose a realistic issue, plan the implementation, and review their changes before opening a pull request.

Unlike a general coding assistant, the product follows the complete contribution journey:

**Repository URL → codebase map → suitable issue → implementation guidance → PR review**

## Live demo

Try the deployed application:

**[open-source-contribution-coach.lowkyuncoolcoder.chatgpt.site](https://open-source-contribution-coach.lowkyuncoolcoder.chatgpt.site)**

Paste a public GitHub repository URL or select the guided demo to explore the full workflow.

## Why this project exists

Making an open-source contribution is rarely blocked by syntax. The difficult parts are understanding a large repository, finding an issue that matches your skills, identifying the correct files, following project conventions, and preparing a pull request maintainers can review easily.

OpenCoach turns those uncertain steps into a structured workflow.

## Features

- **Repository onboarding** — fetches public GitHub metadata and presents the project in a beginner-friendly workspace.
- **Codebase map** — highlights important root paths, modules, likely entry points, and a suggested reading order.
- **Issue finder** — ranks open issues using contributor-friendly signals such as scope, labels, activity, and discussion overhead.
- **Implementation coach** — converts a selected issue into a focused, trackable execution plan.
- **PR readiness review** — reviews a pasted Git diff for scope, repository conventions, missing tests, and merge readiness.
- **Guided demo** — provides a complete sample journey when users want to explore without entering a repository.
- **Responsive interface** — supports desktop, tablet, and mobile workflows.
- **Graceful fallback** — keeps the product explorable if GitHub's public API is temporarily unavailable or rate-limited.

## Product flow

1. Paste the URL of a public GitHub repository.
2. Review the repository summary, technology, activity, and architecture.
3. Explore the suggested codebase reading path.
4. Choose a ranked beginner-friendly issue.
5. Follow and complete the generated implementation checklist.
6. Paste a Git diff and run the pre-flight PR review.

## Tech stack

| Layer | Technology |
| --- | --- |
| UI | React 19, TypeScript, Tailwind CSS |
| Framework | Vinext / Next-compatible App Router |
| Data | GitHub REST API for public repository metadata and issues |
| Hosting | Cloudflare-compatible server runtime |
| Persistence | Client state in the current MVP |

## Run locally

### Prerequisites

- Node.js 22.13 or newer
- npm

### Setup

```bash
git clone https://github.com/LowkyFoolDev/open-source-contribution-coach.git
cd open-source-contribution-coach
npm install
npm run dev
```

Then open the local URL shown in your terminal.

### Production build

```bash
npm run build
```

## Project structure

```text
app/
├── globals.css       # Product styling and responsive layouts
├── layout.tsx        # Site metadata and social preview configuration
└── page.tsx          # Repository analysis and contribution workflow

public/
├── favicon.svg
└── og.png            # Branded social preview

scripts/              # Installation and build helpers
tests/                # Rendered output checks
```

## Current MVP scope

The current version fetches real metadata, root contents, and open issues from public GitHub repositories. Issue scoring, implementation guidance, codebase explanation, and PR feedback use deterministic MVP heuristics.

This makes the complete user journey testable while keeping the architecture ready for deeper AI analysis.

## Roadmap

- [ ] GitHub OAuth and private repository support
- [ ] Full repository tree, README, and contribution-guide ingestion
- [ ] AI-generated architecture and data-flow explanations
- [ ] Personalized issue recommendations based on developer skills
- [ ] Repository-aware implementation planning
- [ ] Semantic diff and PR review with test-gap detection
- [ ] Saved contribution workspaces and progress history
- [ ] Maintainer mode for contributor onboarding

## Contributing

Contributions, bug reports, and product suggestions are welcome.

1. Fork the repository.
2. Create a focused feature branch.
3. Keep the change limited to one clear purpose.
4. Run the production build before submitting.
5. Open a pull request explaining what changed and how it was verified.

## Product status

This project is an actively evolving MVP. The live application demonstrates the complete product experience; deeper repository intelligence and persistent workspaces are planned for upcoming versions.

---

Built as a focused alternative to general-purpose coding assistants for developers making real open-source contributions.
