"use client";

import { ReactNode } from "react";
import type { Issue } from "../lib/types";

export function PanelHeading({ kicker, title, action }: { kicker: string; title: ReactNode; action?: ReactNode }) {
  return (
    <div className="panel-heading">
      <div><span>{kicker}</span><h2>{title}</h2></div>
      {action}
    </div>
  );
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="page-intro"><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>
  );
}

export function TagRow({ tags, children }: { tags: string[]; children?: ReactNode }) {
  return (
    <div className="tag-row">{children}{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
  );
}

export function ArrowButton({ label, className, disabled, onClick, type }: {
  label: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button type={type ?? "button"} className={className} disabled={disabled} onClick={onClick}>
      {label}<span>→</span>
    </button>
  );
}

export function LabeledText({ title, description }: { title: string; description: ReactNode }) {
  return <p><strong>{title}</strong><small>{description}</small></p>;
}

export function MatchScore({ score }: { score: number }) {
  return <div className="match-score"><strong>{score}</strong><small>match</small></div>;
}

export function DifficultyTag({ difficulty }: { difficulty: Issue["difficulty"] }) {
  return <span className={difficulty === "Beginner" ? "green-tag" : "amber-tag"}>{difficulty}</span>;
}

export function ReadinessRow({ mark, state, title, description, trailing }: {
  mark: ReactNode;
  state?: "done" | "current";
  title: string;
  description: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div>
      <span className={state ? `check ${state}` : "check"}>{mark}</span>
      <LabeledText title={title} description={description} />
      {trailing}
    </div>
  );
}

export function ReviewCheck({ status, title, description }: {
  status: "pass" | "warn";
  title: string;
  description: string;
}) {
  return (
    <div className={`review-check ${status}`}>
      <b>{status === "pass" ? "✓" : "!"}</b>
      <LabeledText title={title} description={description} />
    </div>
  );
}
