import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open-Source Contribution Coach",
  description: "Understand any repository, find the right issue, and ship a merge-ready pull request.",
  openGraph: {
    title: "Open-Source Contribution Coach",
    description: "From unfamiliar repo to merge-ready PR.",
    url: "https://open-source-contribution-coach.lowkyuncoolcoder.chatgpt.site",
    siteName: "Open-Source Contribution Coach",
    images: [{
      url: "https://open-source-contribution-coach.lowkyuncoolcoder.chatgpt.site/og.png",
      width: 1672,
      height: 941,
      alt: "Open-Source Contribution Coach — from unfamiliar repo to merge-ready PR",
    }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open-Source Contribution Coach",
    description: "From unfamiliar repo to merge-ready PR.",
    images: ["https://open-source-contribution-coach.lowkyuncoolcoder.chatgpt.site/og.png"],
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
